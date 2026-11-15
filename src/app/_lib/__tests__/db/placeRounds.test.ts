import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leagueNight} from "@/app/_lib/dates";
import {SeatedPair} from "@/app/_lib/matching/smokingTables";
import {insertRoundBatch} from "@/app/_lib/service/round/insertPairRounds";
import {DRAFT_WAITING_ERROR} from "@/app/_lib/roundStatus";
import {approveNight, discardDraft, getDraftNight, publishNight} from "@/app/_lib/service/round/publication";
import {addTable, deleteLeagueRound, editTablePair, listLeagueRounds} from "@/app/_lib/service/admin/tables";
import {Slot} from "@/app/_lib/locations";
import {tableNightKolo} from "@/app/_lib/service/round/nightKolo";

// Novo kolo, Skica and Objavi at the two places of one night, against a real Postgres: each place makes, approves,
// publishes and discards its own rounds with its own teams, tables are numbered from Stol 1 at each place, and both
// places share the night's Kolo numbers (Kartaš 7, 8; Lanterna 7, 8), the next night going on after the highest. Run
// with `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied.

const tag = `pr${Date.now()}`;
const tonight = leagueNight();
const iso = tonight.toISOString().slice(0, 10);
const lastWeek = new Date(tonight.getTime() - 7 * 86_400_000);
let leagueId = 0;
const places: number[] = [];
// A–D at Kartaš (1), E–H at Lanterna (2)
const teams: number[] = [];
const team = (i: number) => ({id: teams[i], name: `${tag} ${i}`});
const pair = (a: number, b: number, table: number): SeatedPair => ({teamOne: team(a), teamTwo: team(b), table, smoking: false}) as unknown as SeatedPair;
// two rounds of two tables at a place: A–B, C–D then A–C, B–D (E–H the same at Lanterna)
const batch = (o: number) => [
  [pair(o, o + 1, 1), pair(o + 2, o + 3, 2)],
  [pair(o, o + 2, 1), pair(o + 1, o + 3, 2)],
];

before(async () => {
  for (const name of ["Kartaš", "Lanterna"]) places.push((await prisma.location.create({data: {name: `${tag} ${name}`}})).location_id);
  const league = await prisma.league.create({data: {league_name: `${tag} liga`, location_id: places[0]}});
  leagueId = league.league_id;
  await prisma.leagueNight.create({data: {league_id: leagueId, night: tonight, second_location_id: places[1]}});
  for (let i = 0; i < 8; i++) {
    const t = await prisma.team.create({data: {team_name: `${tag} ${i}`}});
    teams.push(t.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: t.team_id}});
    await prisma.leagueNightTeam.create({data: {league_id: leagueId, night: tonight, team_id: t.team_id, slot: i < 4 ? 1 : 2}});
  }
  // last week's Kolo 6, so tonight's first Kolo is 7
  await prisma.round.create({
    data: {team1_id: teams[0], team2_id: teams[1], round_number: 6, round_date: lastWeek, status: "PUBLISHED", published_at: lastWeek, leagueRounds: {create: {league_id: leagueId}}},
  });
});

after(async () => {
  const ids = (await prisma.round.findMany({where: {leagueRounds: {some: {league_id: leagueId}}}, select: {id: true}})).map((r) => r.id);
  await prisma.match.deleteMany({where: {round_id: {in: ids}}});
  await prisma.round.deleteMany({where: {id: {in: ids}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.location.deleteMany({where: {location_id: {in: places}}});
  await prisma.$disconnect();
});

const published = async (slot: Slot) =>
  (await getDraftNight(leagueId, iso, slot))!.rounds.filter((r) => r.status === "PUBLISHED").map((r) => r.roundNumber);

test("each place makes its own Skica with its own teams; the other place's doesn't stop it", async () => {
  // a two-place night needs the place, and the place its own teams
  await assert.rejects(insertRoundBatch(batch(0), leagueId), {message: "Večeras se igra na dvije lokacije: odaberi lokaciju."});
  await assert.rejects(insertRoundBatch(batch(2), leagueId, {}, 1), (e: Error) => e.message.startsWith(`Nisu na lokaciji ${tag} Kartaš: ${tag} 4, ${tag} 5`));

  await insertRoundBatch(batch(0), leagueId, {}, 1);
  // Kartaš's Skica waits: a second Kartaš Novo kolo is refused, Lanterna's isn't
  await assert.rejects(insertRoundBatch(batch(0), leagueId, {}, 1), {message: DRAFT_WAITING_ERROR});
  await insertRoundBatch(batch(4), leagueId, {}, 2);

  const kartas = await getDraftNight(leagueId, iso, 1);
  const lanterna = await getDraftNight(leagueId, iso, 2);
  assert.deepEqual(
    kartas?.rounds.map((r) => [r.letter, r.tables.map((t) => t.table)]),
    [
      ["A", [1, 2]],
      ["B", [1, 2]],
    ]
  );
  assert.deepEqual(
    lanterna?.rounds.map((r) => [r.letter, r.tables.map((t) => [t.table, t.team1.id])]),
    [
      ["A", [[1, teams[4]], [2, teams[6]]]],
      ["B", [[1, teams[4]], [2, teams[5]]]],
    ]
  );
  // a one-place view of the night has none of them
  assert.equal(await getDraftNight(leagueId, iso, null), null);
});

test("both places number their published Kola from the same Kolo 7", async () => {
  // Kartaš publishes both, Lanterna only its Skica A
  await approveNight(leagueId, iso, 1);
  assert.deepEqual((await publishNight(leagueId, iso, 1)).rounds, [7, 8]);
  const lanterna = await getDraftNight(leagueId, iso, 2);
  await prisma.round.updateMany({where: {id: {in: lanterna!.rounds[0].tables.map((t) => t.id)}}, data: {status: "APPROVED"}});
  assert.deepEqual((await publishNight(leagueId, iso, 2)).rounds, [7]);
  // Lanterna's Skica B is still there and Kartaš's Kola untouched
  assert.deepEqual(await published(1), [7, 8]);
  assert.deepEqual(await published(2), [7]);
  assert.equal((await getDraftNight(leagueId, iso, 2))!.rounds.filter((r) => r.status !== "PUBLISHED").length, 1);

  // "Kolo k/n" on a player's table counts the place's own Kola: Kartaš's Kolo 8 is its 2nd of 2, Lanterna's 7 its 1st of 1
  const kolo = async (slot: Slot, n: number) => {
    const id = (await getDraftNight(leagueId, iso, slot))!.rounds.find((r) => r.roundNumber === n)!.tables[0].id;
    return tableNightKolo(await prisma.round.findUniqueOrThrow({where: {id}}));
  };
  assert.deepEqual(await kolo(1, 8), [2, 2]);
  assert.deepEqual(await kolo(2, 7), [1, 1]);

  // the next night goes on after the highest Kolo of both places (Kartaš's 8), not after Lanterna's 7
  const nextWeek = new Date(tonight.getTime() + 7 * 86_400_000);
  await prisma.round.create({
    data: {team1_id: teams[0], team2_id: teams[1], round_number: 100, round_date: nextWeek, status: "APPROVED", draft_order: 1, leagueRounds: {create: {league_id: leagueId}}},
  });
  assert.deepEqual((await publishNight(leagueId, nextWeek.toISOString().slice(0, 10))).rounds, [9]);

  // the Kola list has a row per place
  const rows = (await listLeagueRounds(leagueId)).filter((r) => r.date === iso);
  assert.deepEqual(
    rows.map((r) => [r.roundNumber, r.slot, r.letter]),
    [
      [8, 1, null],
      [8, 2, "B"],
      [7, 1, null],
      [7, 2, null],
    ]
  );
});

test("a table added or re-paired stays at its place and is numbered there", async () => {
  // the teams already play in Kartaš's Kolo 7
  await assert.rejects(addTable(leagueId, tonight, 7, teams[0], teams[1], 1), {message: "Ekipa već igra u ovom kolu."});
  // Kartaš's Kolo 7 gets a third table: only Kartaš's tables count, so two teams of Lanterna's Kolo 7 can sit there,
  // and it is Stol 3 at Kartaš
  const id = await addTable(leagueId, tonight, 7, teams[4], teams[5], 1);
  const added = await prisma.round.findUniqueOrThrow({where: {id}, select: {location_slot: true, table_number: true}});
  assert.deepEqual([added.location_slot, added.table_number], [1, 3]);
  const kartas7 = (await getDraftNight(leagueId, iso, 1))!.rounds.find((r) => r.roundNumber === 7)!;
  assert.equal(kartas7.tables.length, 3);
  // swapping in a team that also sits at Lanterna's Kolo 7 moves only Kartaš's tables
  const changed = await editTablePair(kartas7.tables[0].id, teams[0], teams[4]);
  assert.ok(changed.length > 0 && changed.every((c) => kartas7.tables.some((t) => t.id === c.roundId)));
  const lanterna7 = (await getDraftNight(leagueId, iso, 2))!.rounds.find((r) => r.roundNumber === 7)!;
  assert.deepEqual(
    lanterna7.tables.map((t) => [t.table, t.team1.id, t.team2.id]),
    [
      [1, teams[4], teams[5]],
      [2, teams[6], teams[7]],
    ]
  );
});

test("Obriši and Odbaci skicu at one place leave the other's; the Kola tab deletes a Kolo at both places", async () => {
  // one place's Kolo only: Kartaš's Kolo 8 goes, Lanterna's Skica B (its Kolo 8 too) stays
  assert.equal(await deleteLeagueRound(leagueId, tonight, 8, 1), 2);
  assert.deepEqual(await published(1), [7]);
  assert.equal((await getDraftNight(leagueId, iso, 2))!.rounds.filter((r) => r.status !== "PUBLISHED").length, 1);

  await assert.rejects(discardDraft(leagueId, iso, 1), {message: "Ta večer nema neobjavljenih kola."});
  assert.deepEqual((await discardDraft(leagueId, iso, 2)).rounds, [8]);
  assert.deepEqual(await published(1), [7]);

  // Obriši on the Kola tab: Kolo 7 goes at both places (3 + 2 tables)
  assert.equal(await deleteLeagueRound(leagueId, tonight, 7), 5);
  assert.equal(await getDraftNight(leagueId, iso, 1), null);
  assert.equal(await getDraftNight(leagueId, iso, 2), null);
});
