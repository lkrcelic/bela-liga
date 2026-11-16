import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {finishOngoingMatch} from "@/app/_lib/service/match/finishOngoingMatch";
import {replayRatings} from "@/app/_lib/service/admin/recalc";

// Closing a round replays the ratings (issue #26): only tonight's history rows and the players whose rating changed
// are written; the other nights' rows are left as they are (same xmin, so not rewritten). Run with `npm run test:db`
// and DATABASE_URL on a throwaway database with the migrations applied. Never point it at production.

const tag = `rr${Date.now()}`;
const night = new Date("2026-11-05T00:00:00Z"); // a past night; these four players meet nobody else
let leagueId = 0;
const teams: number[] = [];
const players: number[] = [];

before(async () => {
  leagueId = (await prisma.league.create({data: {league_name: `${tag} liga`}})).league_id;
  for (const name of ["A", "B"]) {
    const ids: number[] = [];
    for (const n of [1, 2]) {
      const p = await prisma.player.create({data: {username: `${tag}${name}${n}`.toLowerCase(), email: `${tag}${name}${n}@example.com`, password_hash: "x", player_role: "PLAYER", first_name: name, last_name: tag}});
      ids.push(p.id);
    }
    players.push(...ids);
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`, teamPlayers: {create: ids.map((player_id) => ({player_id}))}}});
    teams.push(team.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
  }
});

after(async () => {
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.$transaction((tx) => replayRatings(tx), {timeout: 60000});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.player.deleteMany({where: {id: {in: players}}});
  await prisma.$disconnect();
});

type Row = {player_id: number; night: Date; xmin: string};
const historyRows = () => prisma.$queryRaw<Row[]>`SELECT player_id, night, xmin::text FROM "PlayerRatingHistory" ORDER BY player_id, night`;

async function playMatch(roundId: number, score1: number, score2: number) {
  const match = await prisma.ongoingMatch.findFirst({where: {round_id: roundId}})
    ?? await prisma.ongoingMatch.create({data: {round_id: roundId, score_threshold: 1001}});
  await prisma.ongoingMatch.update({where: {id: match.id}, data: {player_pair1_score: score1, player_pair2_score: score2}});
  return finishOngoingMatch(match.id);
}

test("a round close writes that night's rows for its players and leaves the other nights' rows untouched", async () => {
  await prisma.$transaction((tx) => replayRatings(tx), {timeout: 60000}); // the stored history is the replay's
  const beforeRows = await historyRows();

  const round = await prisma.round.create({
    data: {round_number: 1, round_date: night, team1_id: teams[0], team2_id: teams[1], status: "PUBLISHED", published_at: new Date(), leagueRounds: {create: {league_id: leagueId}}},
  });
  await playMatch(round.id, 1001, 500);
  assert.equal((await playMatch(round.id, 1001, 700)).roundFinished, true);

  const afterRows = await historyRows();
  const added = afterRows.filter((r) => players.includes(r.player_id));
  assert.deepEqual(added.map((r) => [r.player_id, r.night.toISOString().slice(0, 10)]), players.map((id) => [id, "2026-11-05"]));
  const others = afterRows.filter((r) => !players.includes(r.player_id));
  assert.deepEqual(others, beforeRows, "no other history row was deleted, added or rewritten");

  const rated = await prisma.player.findMany({where: {id: {in: players}}, select: {id: true, rating: true}, orderBy: {id: "asc"}});
  assert.ok(rated[0].rating > 1500 && rated[2].rating < 1500, JSON.stringify(rated));

  // removing the round and replaying takes its rows away again
  await prisma.round.delete({where: {id: round.id}});
  await prisma.$transaction((tx) => replayRatings(tx), {timeout: 60000});
  assert.equal((await historyRows()).filter((r) => players.includes(r.player_id)).length, 0);
  assert.deepEqual((await prisma.player.findMany({where: {id: {in: players}}, select: {rating: true}})).map((p) => p.rating), [1500, 1500, 1500, 1500]);
});
