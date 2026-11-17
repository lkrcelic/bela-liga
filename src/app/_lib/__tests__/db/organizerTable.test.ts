import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {Player} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {canPlayRound, lineupAccess, managesRound} from "@/app/_lib/service/auth/requireUser";
import {getLineup, saveLineup} from "@/app/_lib/service/round/lineup";

// #83: the organizer runs the tables of their own tournament as an admin does (DECISIONS #86). Tko igra (GET and PUT
// /api/rounds/[id]/lineup) lets them in, shows them a finished table's lineup and lets them confirm it; another
// organizer's tournament and a player who isn't at the table stay out. Run with `npm run test:db` on a throwaway
// database with the migrations applied (it adds its own tournaments, teams and players and removes them afterwards).

const tag = `ot${Date.now()}`;
const tournaments: number[] = [];
const teams: number[] = [];
const players: number[] = [];
const rounds: number[] = [];
let organizer: Player;
let otherOrganizer: Player;
let stranger: Player;

const today = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

async function player(name: string, role: string): Promise<Player> {
  const p = await prisma.player.create({
    data: {first_name: tag, last_name: name, username: `${tag}${name}`.toLowerCase().slice(0, 20), password_hash: "x", email: `${tag}${name}@test.local`.toLowerCase(), player_role: role as Player["player_role"]},
  });
  players.push(p.id);
  return p;
}

async function tournament(createdBy: number): Promise<number> {
  const t = await prisma.tournament.create({
    data: {tournament_name: `${tag} turnir`, date: today(), rounds: 3, game_minutes: 35, started_at: new Date(), registrations_open: false, created_by: createdBy},
  });
  tournaments.push(t.tournament_id);
  return t.tournament_id;
}

// a published table of the tournament; open: false = already played
async function table(tournamentId: number, team1: number, team2: number, open = true): Promise<number> {
  const round = await prisma.round.create({
    data: {
      team1_id: team1,
      team2_id: team2,
      round_number: 1,
      round_date: today(),
      status: "PUBLISHED",
      published_at: new Date(),
      matches_per_round: 1,
      open,
      tournamentRounds: {create: {tournament_id: tournamentId}},
    },
  });
  rounds.push(round.id);
  return round.id;
}

// each team: two players, the first two of its roster
const rosters: number[][] = [];

before(async () => {
  organizer = await player("org", "ORGANIZER");
  otherOrganizer = await player("org2", "ORGANIZER");
  stranger = await player("str", "PLAYER");
  for (const name of ["A", "B"]) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    teams.push(team.team_id);
    const members = [await player(`${name}1`, "PLAYER"), await player(`${name}2`, "PLAYER")];
    for (const m of members) await prisma.teamPlayer.create({data: {team_id: team.team_id, player_id: m.id}});
    rosters.push(members.map((m) => m.id));
  }
});

after(async () => {
  await prisma.roundPlayer.deleteMany({where: {round_id: {in: rounds}}});
  await prisma.tournamentRound.deleteMany({where: {round_id: {in: rounds}}});
  await prisma.round.deleteMany({where: {id: {in: rounds}}});
  await prisma.tournament.deleteMany({where: {tournament_id: {in: tournaments}}});
  await prisma.teamPlayer.deleteMany({where: {team_id: {in: teams}}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.player.deleteMany({where: {id: {in: players}}});
  await prisma.$disconnect();
});

const lineup = () => ({teams: [{team_id: teams[0], player_ids: rosters[0]}, {team_id: teams[1], player_ids: rosters[1]}]});

test("the organizer opens Tko igra on a table of their own tournament and confirms it", async () => {
  const roundId = await table(await tournament(organizer.id), teams[0], teams[1]);

  assert.equal(await canPlayRound(organizer, roundId), true);
  // what the route decides with (lineupAccess), handed on as the route hands it
  const access = await lineupAccess(organizer, roundId);
  assert.deepEqual(access, {allowed: true, manages: true});
  const shown = await getLineup(roundId, organizer, access.manages);
  assert.notEqual(shown, "finished");

  await saveLineup(roundId, lineup(), {admin: access.manages});
  assert.equal(await prisma.roundPlayer.count({where: {round_id: roundId}}), 4);
});

test("on a finished table of their own tournament the organizer sees and corrects who played, as an admin does", async () => {
  const roundId = await table(await tournament(organizer.id), teams[0], teams[1], false);

  const access = await lineupAccess(organizer, roundId);
  assert.deepEqual(access, {allowed: true, manages: true});
  const shown = await getLineup(roundId, organizer, access.manages);
  assert.notEqual(shown, "finished");
  assert.equal(shown !== "finished" && shown.finished, true);

  await saveLineup(roundId, lineup(), {admin: access.manages});
  assert.equal(await prisma.roundPlayer.count({where: {round_id: roundId}}), 4);
});

test("another organizer's tournament and a player who isn't at the table stay out", async () => {
  const roundId = await table(await tournament(otherOrganizer.id), teams[0], teams[1]);

  assert.equal(await canPlayRound(organizer, roundId), false);
  assert.equal(await managesRound(organizer, roundId), false);
  assert.equal(await canPlayRound(stranger, roundId), false);
  assert.equal(await managesRound(stranger, roundId), false);
  // a player of the table plays it, but doesn't run it
  const atTable = {...stranger, id: rosters[0][0]};
  assert.equal(await canPlayRound(atTable, roundId), true);
  assert.equal(await managesRound(atTable, roundId), false);
  assert.deepEqual(await lineupAccess(atTable, roundId), {allowed: true, manages: false});
  assert.deepEqual(await lineupAccess(organizer, roundId), {allowed: false, manages: false});
});

test("a tournament made before the organizer role (no created_by) is only the admin's", async () => {
  const t = await prisma.tournament.create({data: {tournament_name: `${tag} stari`, date: today(), rounds: 3, registrations_open: false}});
  tournaments.push(t.tournament_id);
  const roundId = await table(t.tournament_id, teams[0], teams[1]);

  assert.equal(await canPlayRound(organizer, roundId), false);
  assert.equal(await managesRound(organizer, roundId), false);
});
