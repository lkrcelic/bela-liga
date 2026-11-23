import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {Viewer} from "@/app/_lib/players/privacy";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {getPlayerOverview} from "@/app/_lib/service/players/overview";
import {allRatings, getPlayerRating, ratingsOf, ratingSummaries} from "@/app/_lib/service/ratings/ratings";

// A player's or a team's page reads only its own players' Rejting rows (#51), and each row is the one the whole
// Rejting list has: the same place (players with the same rating share it), team, rounds and change, and the same
// number of players on the list. Run with `npm run test:db` on a throwaway database with the migrations applied.

const tag = `ro${Date.now()}`;
const p: Record<string, number> = {};
const teams: number[] = [];
const rounds: number[] = [];
const viewer: Viewer = {id: 0, player_role: "ADMIN"};

async function player(name: string, rating: number, extra: object = {}) {
  const row = await prisma.player.create({
    data: {username: `${tag}${name}`.toLowerCase(), email: `${tag}${name}@example.com`, password_hash: "x", player_role: "PLAYER", first_name: name, last_name: tag, rating, ...extra},
  });
  p[name] = row.id;
}

async function team(name: string, players: string[]) {
  const row = await prisma.team.create({data: {team_name: `${tag} ${name}`, teamPlayers: {create: players.map((n) => ({player_id: p[n]}))}}});
  teams.push(row.team_id);
  return row.team_id;
}

before(async () => {
  // A and B share a rating (and a place); C has rated nights but no team; D was deleted; E has neither team nor nights
  await player("A", 1612);
  await player("B", 1612);
  await player("C", 1544);
  await player("D", 1700, {deleted_at: new Date(), active: false});
  await player("E", 1800);
  const t1 = await team("Prvi", ["A", "B"]);
  const t2 = await team("Drugi", ["A"]);
  const t3 = await team("Treći", ["D"]);
  // A played for Prvi in January and for Drugi in February: Rejting shows Drugi
  for (const [team1_id, team2_id, date] of [[t1, t3, "2026-01-10"], [t2, t3, "2026-02-10"]] as const) {
    const r = await prisma.round.create({data: {team1_id, team2_id, status: "PUBLISHED", round_date: new Date(date), open: false}});
    rounds.push(r.id);
  }
  await prisma.playerRatingHistory.createMany({
    data: [
      {player_id: p.A, night: new Date("2026-01-10"), rating: 1590, rating_deviation: 200, change: 90, rounds: 3},
      {player_id: p.A, night: new Date("2026-02-10"), rating: 1612, rating_deviation: 180, change: 22, rounds: 2},
      {player_id: p.C, night: new Date("2026-01-10"), rating: 1544, rating_deviation: 250, change: -6, rounds: 4},
    ],
  });
});

// Written from the rule, not from the service: on the list is every player who isn't deleted and is on a team (not the
// bye) or has a rated night; a player's place is one more than the number of players on the list rated higher
async function listed() {
  return prisma.player.findMany({
    where: {deleted_at: null, OR: [{ratingHistory: {some: {}}}, {teamPlayers: {some: {team_id: {not: BYE_TEAM_ID}}}}]},
    select: {id: true, rating: true},
  });
}
const place = (all: {rating: number}[], rating: number) => 1 + all.filter((x) => x.rating > rating).length;

after(async () => {
  await prisma.round.deleteMany({where: {id: {in: rounds}}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.player.deleteMany({where: {id: {in: Object.values(p)}}});
  await prisma.$disconnect();
});

test("the rows of some players are their rows on the whole Rejting list, in its order, with its length", async () => {
  const list = await allRatings();
  const ids = [p.C, p.E, p.D, p.B, p.A];
  const {rows, total} = await ratingsOf(ids);
  assert.equal(total, list.length);
  assert.deepEqual(rows, list.filter((r) => ids.includes(r.id)));
  assert.deepEqual(rows.map((r) => r.id), [p.A, p.B, p.C]);
  const all = await listed();
  assert.equal(total, all.length);
  for (const row of rows) assert.equal(row.rank, place(all, row.rating), `place of ${row.name}`);
  const [a, b, c] = rows;
  assert.equal(a.rank, b.rank);
  assert.ok(c.rank >= a.rank + 2, "A and B share a place, so C comes at least two places lower");
  assert.deepEqual([a.team, a.rounds, a.change, a.provisional], [`${tag} Drugi`, 5, 22, true]);
  assert.deepEqual([b.team, b.rounds, b.change], [`${tag} Prvi`, 0, null]);
  assert.deepEqual([c.team, c.rounds, c.change], [null, 4, -6]);
});

test("no players: no rows, and the list's length", async () => {
  assert.deepEqual(await ratingsOf([]), {rows: [], total: (await listed()).length});
});

test("the Player page: the player's place and the list's length, and teammates in Rejting's order", async () => {
  const all = await listed();
  const overview = (await getPlayerOverview(p.A, viewer))!;
  assert.equal(overview.rating.total, all.length);
  assert.equal(overview.rating.rank, place(all, 1612));
  assert.deepEqual([overview.rating.rounds, overview.rating.change], [5, 22]);
  // A and B share a place; on the list the name decides (A before B)
  const prvi = overview.teams.find((t) => t.team_name === `${tag} Prvi`)!;
  assert.deepEqual(prvi.players.map((x) => x.id), [p.A, p.B]);
});

test("a player's Rejting detail and a team's ratings match the whole list", async () => {
  const list = await allRatings();
  const detail = await getPlayerRating(p.C, viewer);
  assert.equal(detail.total, list.length);
  assert.deepEqual({...detail.player, photo_url: undefined}, {...list.find((r) => r.id === p.C), photo_url: undefined});
  await assert.rejects(getPlayerRating(p.D, viewer), {name: "NotFoundError"});

  const summaries = await ratingSummaries([{id: p.A, rating: 1612}, {id: p.E, rating: 1800}]);
  const a = list.find((r) => r.id === p.A)!;
  assert.deepEqual(summaries.get(p.A), {rating: a.rating, change: a.change, rounds: a.rounds, provisional: a.provisional, rank: a.rank});
  assert.deepEqual(summaries.get(p.E), {rating: 1800, change: null, rounds: 0, provisional: true, rank: null});
});
