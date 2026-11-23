import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {adminAddTeam, admitTeam, setRegistrationsOpen, SIGN_UPS_CLOSED, signOff, signUp, TEAM_NEEDS_TWO} from "@/app/_lib/service/tournament/entries";
import {ensureNextKoloDraft, makeKoloDraft, publishKolo, STALE_DRAFT_ERROR, StaleDraftError} from "@/app/_lib/service/tournament/kola";
import {adminSetActive, adminSetArrival, closeArrival} from "@/app/_lib/service/tournament/day";
import {BYE_TEAM_ID} from "@/app/_lib/bye";

// Tournament sign-ups and Kolos against a real Postgres: the limit and the waiting list, sign-off promoting the first
// team waiting, a player in two entries, a stale Kolo 1 draft, the next Kolo made only once the previous one is over,
// two taps making one draft, and a Kolo made before Početak pairing only the teams that confirmed arrival. Run with `npm run test:db` and DATABASE_URL on a throwaway database with the
// migrations applied (it adds its own tournaments, teams and players and removes them afterwards). Never point it at
// production.

const tag = `te${Date.now()}`;
const tournaments: number[] = [];
const teams: number[] = [];
const players: number[] = [];

const day = (offset: number) => new Date(`${new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)}T00:00:00.000Z`);

async function player(name: string, active = true) {
  const p = await prisma.player.create({
    data: {
      first_name: tag,
      last_name: name,
      username: `${tag}${name}`.toLowerCase().slice(0, 20),
      password_hash: "x",
      email: `${tag}${name}@test.local`.toLowerCase(),
      player_role: "PLAYER",
      active,
    },
  });
  players.push(p.id);
  return p.id;
}

// a team of the given players (made here, with accounts)
async function team(name: string, playerIds: number[]) {
  const t = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
  teams.push(t.team_id);
  for (const id of playerIds) await prisma.teamPlayer.create({data: {team_id: t.team_id, player_id: id}});
  return t.team_id;
}

async function tournament(data: {max_teams?: number | null; rounds?: number; registrations_open?: boolean; open_signups?: boolean; gathering_time?: string; start_time?: string}) {
  const t = await prisma.tournament.create({data: {tournament_name: `${tag} turnir`, date: day(7), rounds: 3, matches_per_round: 1, ...data}});
  tournaments.push(t.tournament_id);
  return t.tournament_id;
}

const viewer = (id: number) => ({id, player_role: "PLAYER"});

const statusOf = async (tournamentId: number, teamId: number) =>
  (await prisma.tournamentTeam.findUnique({where: {tournament_id_team_id: {tournament_id: tournamentId, team_id: teamId}}}))?.status ?? null;

const tables = (tournamentId: number) =>
  prisma.round.findMany({
    where: {tournamentRounds: {some: {tournament_id: tournamentId}}},
    select: {id: true, round_number: true, status: true, open: true, team1_id: true, team2_id: true},
    orderBy: [{round_number: "asc"}, {table_number: "asc"}],
  });

// a Kolo's tables played to the end: team1 wins each one
async function finishKolo(tournamentId: number, number: number) {
  const ids = (await tables(tournamentId)).filter((r) => r.round_number === number).map((r) => r.id);
  await prisma.round.updateMany({where: {id: {in: ids}}, data: {open: false, team1_wins: 1, team2_wins: 0}});
}

// p[0..9]: p[0]+p[1] team A, p[2]+p[3] team B, p[4]+p[5] team C, p[0]+p[6] team AX (shares p[0] with A),
// p[7] + an inactive p[8] team L (only one active player)
const p: number[] = [];
const t: Record<string, number> = {};

before(async () => {
  for (let i = 0; i < 8; i++) p.push(await player(`p${i}`));
  p.push(await player("p8", false));
  t.A = await team("A", [p[0], p[1]]);
  t.B = await team("B", [p[2], p[3]]);
  t.C = await team("C", [p[4], p[5]]);
  t.AX = await team("AX", [p[0], p[6]]);
  t.L = await team("L", [p[7], p[8]]);
  // a Kolo of an odd number of teams has a Slobodna runda table, whose team is 0
  await prisma.team.upsert({where: {team_id: BYE_TEAM_ID}, update: {}, create: {team_id: BYE_TEAM_ID, team_name: `${tag} Bye`}});
});

after(async () => {
  const rounds = await prisma.tournamentRound.findMany({where: {tournament_id: {in: tournaments}}, select: {round_id: true}});
  const ids = rounds.map((r) => r.round_id);
  await prisma.ongoingMatch.deleteMany({where: {round_id: {in: ids}}});
  await prisma.match.deleteMany({where: {round_id: {in: ids}}});
  await prisma.tournamentRound.deleteMany({where: {tournament_id: {in: tournaments}}});
  await prisma.round.deleteMany({where: {id: {in: ids}}});
  await prisma.tournamentTeam.deleteMany({where: {tournament_id: {in: tournaments}}});
  await prisma.tournament.deleteMany({where: {tournament_id: {in: tournaments}}});
  await prisma.teamPlayer.deleteMany({where: {team_id: {in: teams}}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.player.deleteMany({where: {id: {in: players}}});
  await prisma.$disconnect();
});

test("full: the team over the limit goes to WAITING, and a sign-off lets the first team waiting in", async () => {
  const id = await tournament({max_teams: 2});
  const F = await team("F", [await player("p11"), await player("p12")]);
  assert.deepEqual(await signUp(id, viewer(p[0]), {team_id: t.A}), {teamId: t.A, status: "REGISTERED"});
  assert.deepEqual(await signUp(id, viewer(p[2]), {team_id: t.B}), {teamId: t.B, status: "REGISTERED"});
  assert.deepEqual(await signUp(id, viewer(p[4]), {team_id: t.C}), {teamId: t.C, status: "WAITING"});
  assert.equal(await adminAddTeam(id, F), "WAITING");

  // only a player of the team signs it off
  await assert.rejects(signOff(id, t.A, viewer(p[2])), /samo ekipu u kojoj igraš/);
  await signOff(id, t.A, viewer(p[1]));
  assert.equal(await statusOf(id, t.A), null);
  assert.equal(await statusOf(id, t.C), "REGISTERED", "the first team waiting comes in");
  assert.equal(await statusOf(id, F), "WAITING", "the second keeps waiting");

  // a waiting team signing off changes nobody's place
  await signOff(id, F, {id: p[0], player_role: "ADMIN"});
  assert.deepEqual([await statusOf(id, t.B), await statusOf(id, t.C), await statusOf(id, F)], ["REGISTERED", "REGISTERED", null]);
});

test("Ubaci u turnir: a waiting team comes in and the limit grows by one", async () => {
  const id = await tournament({max_teams: 2});
  assert.equal(await adminAddTeam(id, t.A), "REGISTERED");
  assert.equal(await adminAddTeam(id, t.B), "REGISTERED");
  assert.equal(await adminAddTeam(id, t.C), "WAITING");
  await admitTeam(id, t.C);
  assert.equal(await statusOf(id, t.C), "REGISTERED");
  assert.equal((await prisma.tournament.findUniqueOrThrow({where: {tournament_id: id}})).max_teams, 3);
  // a second tap on a team already in changes nothing
  await admitTeam(id, t.C);
  assert.equal((await prisma.tournament.findUniqueOrThrow({where: {tournament_id: id}})).max_teams, 3);
});

test("refused: a player already in another entry, a team with one active player, a team twice, closed sign-ups, another's team", async () => {
  const id = await tournament({max_teams: null});
  await signUp(id, viewer(p[0]), {team_id: t.A});
  await assert.rejects(signUp(id, viewer(p[6]), {team_id: t.AX}), (e: Error) => e.message === `${tag} p0 je već prijavljen s ekipom ${tag} A.`);
  await assert.rejects(adminAddTeam(id, t.AX), /je već prijavljen s ekipom/);
  await assert.rejects(signUp(id, viewer(p[7]), {team_id: t.L}), (e: Error) => e.message === TEAM_NEEDS_TWO);
  await assert.rejects(adminAddTeam(id, t.A), /Ekipa je već prijavljena/);
  await assert.rejects(signUp(id, viewer(p[2]), {team_id: t.C}), /samo ekipu u kojoj igraš/);
  await setRegistrationsOpen(id, false);
  await assert.rejects(signUp(id, viewer(p[2]), {team_id: t.B}), (e: Error) => e.message === SIGN_UPS_CLOSED);
  assert.deepEqual((await prisma.tournamentTeam.findMany({where: {tournament_id: id}})).map((e) => e.team_id), [t.A]);
});

test("Kolos: a stale Kolo 1 draft is refused, the next Kolo waits for the open tables, two taps make one draft", async () => {
  const id = await tournament({max_teams: null, rounds: 3});
  for (const [teamId, by] of [[t.A, p[0]], [t.B, p[2]], [t.C, p[4]]] as const) await signUp(id, viewer(by), {team_id: teamId});
  const D = await team("D", [p[6], p[7]]);
  await signUp(id, viewer(p[6]), {team_id: D});

  // (this tournament has no start time, so no Potvrda dolaska: its teams are drawn as they are)
  await setRegistrationsOpen(id, false);

  // two taps make one draft
  const first = await makeKoloDraft(id);
  const again = await makeKoloDraft(id);
  assert.deepEqual([first.number, first.tables, again.number, again.tables], [1, 2, 1, 2]);
  assert.equal((await tables(id)).length, 2);

  // the team list changes after the draw: D signs off and E comes in, so still four teams, but not the drawn ones
  await signOff(id, D, viewer(p[7]));
  t.E = await team("E", [await player("p9"), await player("p10")]);
  assert.equal(await adminAddTeam(id, t.E), "REGISTERED");
  await assert.rejects(publishKolo(id, 1), (e: Error) => e instanceof StaleDraftError && e.message === STALE_DRAFT_ERROR);
  assert.equal((await prisma.tournament.findUniqueOrThrow({where: {tournament_id: id}})).started_at, null, "not started");

  // Složi ponovo, then it goes out and the tournament starts
  await makeKoloDraft(id, {redo: true});
  const seated = (await tables(id)).flatMap((r) => [r.team1_id, r.team2_id]).sort((a, b) => a - b);
  assert.deepEqual(seated, [t.A, t.B, t.C, t.E].sort((a, b) => a - b));
  await publishKolo(id, 1);
  const started = await prisma.tournament.findUniqueOrThrow({where: {tournament_id: id}});
  assert.ok(started.started_at);
  assert.equal(started.registrations_open, false);
  assert.ok((await tables(id)).every((r) => r.status === "PUBLISHED" && r.open));

  // Kolo 1 is being played: no Kolo 2 yet, by hand or by itself
  await assert.rejects(makeKoloDraft(id), /Kolo 1 još traje/);
  await ensureNextKoloDraft(id);
  assert.equal((await tables(id)).length, 2, "quiet while a table of Kolo 1 is open");

  // one table finished is not enough
  const [one] = (await tables(id)).filter((r) => r.round_number === 1);
  await prisma.round.update({where: {id: one.id}, data: {open: false, team1_wins: 1}});
  await ensureNextKoloDraft(id);
  assert.equal((await tables(id)).length, 2);

  // the whole Kolo over: Kolo 2's draft comes by itself, unpublished (no Automatska kola), and only once
  await finishKolo(id, 1);
  await ensureNextKoloDraft(id);
  await ensureNextKoloDraft(id);
  const kolo2 = (await tables(id)).filter((r) => r.round_number === 2);
  assert.equal(kolo2.length, 2);
  assert.ok(kolo2.every((r) => r.status === "DRAFT"));
  // Kolo 2 is paired by the standings: Kolo 1's winners meet each other
  const winners = new Set((await tables(id)).filter((r) => r.round_number === 1).map((r) => r.team1_id));
  assert.ok(kolo2.some((r) => winners.has(r.team1_id) && winners.has(r.team2_id)));
});

const entryOf = (tournamentId: number, teamId: number) => prisma.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: tournamentId, team_id: teamId}}});

const seatedIn = async (tournamentId: number, kolo: number) =>
  (await tables(tournamentId))
    .filter((r) => r.round_number === kolo)
    .flatMap((r) => [r.team1_id, r.team2_id])
    .filter((teamId) => teamId !== BYE_TEAM_ID)
    .sort((a, b) => a - b);

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);

test("Kolo 1 made before Početak with sign-ups open: only the confirmed teams are drawn, a later confirmation makes it stale, Objavi runs the start switch, and a team the admin switches on after it is in Kolo 2", async () => {
  // a week ahead, so the start time is far off; sign-ups stay open (no Otvorene prijave)
  const id = await tournament({max_teams: 3, rounds: 2, gathering_time: "09:30", start_time: "10:00"});
  const G = await team("G", [await player("p13"), await player("p14")]);
  for (const teamId of [t.A, t.B, t.C]) assert.equal(await adminAddTeam(id, teamId), "REGISTERED");
  assert.equal(await adminAddTeam(id, G), "WAITING");
  // A, B and the waiting G confirm arrival; C doesn't
  for (const teamId of [t.A, t.B, G]) await adminSetArrival(id, teamId, true);

  // Složi Kolo 1 while sign-ups are open: C isn't drawn, and G takes the place C leaves, as the start time would do
  const made = await makeKoloDraft(id);
  assert.equal(made.number, 1);
  assert.deepEqual(await seatedIn(id, 1), sorted([t.A, t.B, G]));

  // C confirms after the draw: the draft is stale; its confirmation taken back, it isn't
  await adminSetArrival(id, t.C, true);
  await assert.rejects(publishKolo(id, 1), (e: Error) => e instanceof StaleDraftError);
  await adminSetArrival(id, t.C, false);

  // published before Početak: the tournament starts and the switch runs now: C inactive, G in, sign-ups closed
  await publishKolo(id, 1);
  const started = await prisma.tournament.findUniqueOrThrow({where: {tournament_id: id}});
  assert.ok(started.started_at && started.arrival_closed_at);
  assert.equal(started.registrations_open, false);
  assert.equal((await entryOf(id, t.C)).active, false);
  assert.equal((await entryOf(id, G)).status, "REGISTERED");

  // the admin switches C on after the start: that marks its arrival, so it is paired in Kolo 2
  await adminSetActive(id, t.C, true);
  const c = await entryOf(id, t.C);
  assert.ok(c.active && c.arrived_at && c.arrived_by_admin);
  await finishKolo(id, 1);
  await ensureNextKoloDraft(id);
  assert.deepEqual(await seatedIn(id, 2), sorted([t.A, t.B, t.C, G]));
});

test("Otvorene prijave: a Kolo 1 made before Početak also pairs only the confirmed teams", async () => {
  const id = await tournament({max_teams: null, rounds: 2, open_signups: true, gathering_time: "09:30", start_time: "10:00"});
  for (const teamId of [t.A, t.B, t.C]) await adminAddTeam(id, teamId);
  for (const teamId of [t.A, t.B]) await adminSetArrival(id, teamId, true);
  await makeKoloDraft(id);
  assert.deepEqual(await seatedIn(id, 1), sorted([t.A, t.B]));
  // too few confirmed teams: no Kolo, whatever the time
  await adminSetArrival(id, t.B, false);
  await assert.rejects(makeKoloDraft(id, {redo: true}), /barem dvije aktivne ekipe s potvrđenim dolaskom/);
});

test("after Početak's switch the admin's Ubaci and Aktivna mark a team's arrival, so it is drawn; before the switch Ubaci doesn't", async () => {
  const id = await tournament({max_teams: 2, rounds: 2, gathering_time: "09:30", start_time: "10:00"});
  const H = await team("H", [await player("p15"), await player("p16")]);
  const I = await team("I", [await player("p17"), await player("p18")]);
  for (const teamId of [t.A, t.B]) assert.equal(await adminAddTeam(id, teamId), "REGISTERED");
  for (const teamId of [t.C, H, I]) assert.equal(await adminAddTeam(id, teamId), "WAITING");
  for (const teamId of [t.A, t.B]) await adminSetArrival(id, teamId, true);

  // before the switch Ubaci only lets C in: it still confirms by itself
  await admitTeam(id, t.C);
  const c = await entryOf(id, t.C);
  assert.deepEqual([c.status, c.arrived_at], ["REGISTERED", null]);

  // Početak's switch (the clock, a day after it): C didn't confirm, so it is inactive; H and I keep waiting
  await prisma.$transaction((tx) => closeArrival(tx, id, day(8)));
  assert.equal((await entryOf(id, t.C)).active, false);

  // after it, Ubaci (H), Aktivna on a waiting team (I) and Aktivna on an inactive one (C) mark the arrival as the admin's
  await admitTeam(id, H);
  await adminSetActive(id, I, true);
  await adminSetActive(id, t.C, true);
  for (const teamId of [H, I, t.C]) {
    const e = await entryOf(id, teamId);
    assert.deepEqual([e.status, e.active, e.arrived_at != null, e.arrived_by_admin], ["REGISTERED", true, true, true], `team ${teamId}`);
  }
  await makeKoloDraft(id);
  assert.deepEqual(await seatedIn(id, 1), sorted([t.A, t.B, t.C, H, I]));
});

test("reopening sign-ups keeps a Kolo 1 draft; a team that signs up and confirms after it makes the draft stale", async () => {
  const id = await tournament({max_teams: null, rounds: 2, gathering_time: "09:30", start_time: "10:00"});
  for (const teamId of [t.A, t.B]) await adminAddTeam(id, teamId);
  for (const teamId of [t.A, t.B]) await adminSetArrival(id, teamId, true);
  await setRegistrationsOpen(id, false);
  await makeKoloDraft(id);
  const drawn = (await tables(id)).map((r) => r.id);
  assert.equal(drawn.length, 1);

  await setRegistrationsOpen(id, true);
  assert.deepEqual((await tables(id)).map((r) => r.id), drawn, "the draft stays");
  await adminAddTeam(id, t.C);
  await adminSetArrival(id, t.C, true);
  await assert.rejects(publishKolo(id, 1), (e: Error) => e instanceof StaleDraftError);
});
