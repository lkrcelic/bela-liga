import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leagueNightString} from "@/app/_lib/dates";
import {nightSplit, setNightSplit} from "@/app/_lib/service/league/split";
import {updateLeagueNight} from "@/app/_lib/service/league/nights";
import {deleteLocation} from "@/app/_lib/service/location/locations";
import {LOCATION_IN_USE} from "@/app/_interfaces/location";
import {inDraftWarning, SPLIT_NOT_IN_LEAGUE, SPLIT_ONE_PLACE, SPLIT_PAST_NIGHT} from "@/app/_interfaces/split";

// Podjela against a real Postgres: a two-place night's teams go to a place and back, a banned team carries its ban and
// can still be placed (Bela, DECISIONS #98), a team that leaves a place where it is in a Skica is reported, and a night with one place, a past night or a team from elsewhere is refused. Run with
// `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied.

const tag = `sp${Date.now()}`;
const dayAfter = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const NIGHT = dayAfter(leagueNightString(), 7);
const ONE_PLACE = dayAfter(leagueNightString(), 14);
const PAST = dayAfter(leagueNightString(), -7);
const night = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

let leagueId = 0;
const places: number[] = [];
const teams: number[] = [];
let outsider = 0;

before(async () => {
  for (const name of ["Kartaš", "Lanterna"]) places.push((await prisma.location.create({data: {name: `${tag} ${name}`}})).location_id);
  const league = await prisma.league.create({data: {league_name: `${tag} liga`, location_id: places[0]}});
  leagueId = league.league_id;
  for (const name of ["Akužavci", "Bura i Jugo", "Čarobnjaci", "Dva baje"]) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    teams.push(team.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id, active: name !== "Dva baje"}});
  }
  outsider = (await prisma.team.create({data: {team_name: `${tag} Izvana`}})).team_id;
  await prisma.leagueNight.createMany({
    data: [
      {league_id: leagueId, night: night(NIGHT), second_location_id: places[1]},
      {league_id: leagueId, night: night(ONE_PLACE)},
      {league_id: leagueId, night: night(PAST), second_location_id: places[1]},
    ],
  });
});

after(async () => {
  await prisma.signupBan.deleteMany({where: {team_id: {in: teams}}});
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: [...teams, outsider]}}});
  await prisma.location.deleteMany({where: {location_id: {in: places}}});
  await prisma.$disconnect();
});

test("a two-place night lists both places and every team, none placed yet", async () => {
  const split = await nightSplit(leagueId, NIGHT);
  assert.deepEqual(
    split?.places?.map((p) => p.name),
    [`${tag} Kartaš`, `${tag} Lanterna`]
  );
  // alphabetical, Č after C
  assert.deepEqual(
    split?.teams.map((t) => [t.name.slice(tag.length + 1), t.slot, t.active]),
    [
      ["Akužavci", null, true],
      ["Bura i Jugo", null, true],
      ["Čarobnjaci", null, true],
      ["Dva baje", null, false],
    ]
  );
  // a one-place night has no places, so no Podjela
  assert.equal((await nightSplit(leagueId, ONE_PLACE))?.places, null);
  assert.equal(await nightSplit(leagueId, dayAfter(NIGHT, 1)), null);
});

test("teams go to a place, move to the other one and back to Neraspoređene", async () => {
  const first = await setNightSplit(leagueId, NIGHT, [
    {team_id: teams[0], slot: 1},
    {team_id: teams[1], slot: 2},
    // an inactive team can be placed too
    {team_id: teams[3], slot: 2},
  ]);
  assert.deepEqual(
    first?.split.teams.map((t) => t.slot),
    [1, 2, null, 2]
  );
  assert.deepEqual(first?.warnings, []);

  const moved = await setNightSplit(leagueId, NIGHT, [
    {team_id: teams[0], slot: 2},
    {team_id: teams[3], slot: null},
  ]);
  assert.deepEqual(
    moved?.split.teams.map((t) => t.slot),
    [2, 2, null, null]
  );
  const rows = await prisma.leagueNightTeam.findMany({where: {league_id: leagueId, night: night(NIGHT)}, orderBy: {team_id: "asc"}});
  assert.deepEqual(
    rows.map((r) => [r.team_id, r.slot]),
    [
      [teams[0], 2],
      [teams[1], 2],
    ]
  );
});

test("a banned team shows its ban in Podjela and can still be placed", async () => {
  await prisma.signupBan.create({data: {team_id: teams[2], until: null}});
  const placed = await setNightSplit(leagueId, NIGHT, [{team_id: teams[2], slot: 2}]);
  const banned = placed?.split.teams.find((t) => t.team_id === teams[2]);
  assert.deepEqual([banned?.slot, banned?.ban], [2, {until: null, player: null}]);
  // the others have none
  assert.equal(placed?.split.teams.find((t) => t.team_id === teams[0])?.ban, null);
  await prisma.signupBan.deleteMany({where: {team_id: teams[2]}});
  await setNightSplit(leagueId, NIGHT, [{team_id: teams[2], slot: null}]);
});

test("a team that leaves a place where it is in a Skica stays in it, and the admin is told", async () => {
  // Lanterna's Skica A has Bura i Jugo against Akužavci
  await prisma.round.create({
    data: {team1_id: teams[1], team2_id: teams[0], round_number: 1, round_date: night(NIGHT), status: "DRAFT", draft_order: 1, location_slot: 2, leagueRounds: {create: {league_id: leagueId}}},
  });
  const result = await setNightSplit(leagueId, NIGHT, [{team_id: teams[1], slot: 1}]);
  assert.deepEqual(result?.warnings, [inDraftWarning(`${tag} Bura i Jugo`, `${tag} Lanterna`)]);
  // the Skica isn't touched
  assert.equal(await prisma.round.count({where: {round_date: night(NIGHT), leagueRounds: {some: {league_id: leagueId}}, team1_id: teams[1]}}), 1);
  // a team that stays where it is says nothing
  assert.deepEqual((await setNightSplit(leagueId, NIGHT, [{team_id: teams[0], slot: 2}]))?.warnings, []);
});

test("a night with one place, a past night and a team from elsewhere are refused", async () => {
  await assert.rejects(setNightSplit(leagueId, ONE_PLACE, [{team_id: teams[0], slot: 1}]), {message: SPLIT_ONE_PLACE});
  await assert.rejects(setNightSplit(leagueId, PAST, [{team_id: teams[0], slot: 1}]), {message: SPLIT_PAST_NIGHT});
  await assert.rejects(setNightSplit(leagueId, NIGHT, [{team_id: outsider, slot: 1}]), {message: SPLIT_NOT_IN_LEAGUE});
  assert.equal(await setNightSplit(leagueId, dayAfter(NIGHT, 1), [{team_id: teams[0], slot: 1}]), null);
});

test("a place a night uses can't be deleted, and taking the second place away ends the Podjela", async () => {
  await assert.rejects(deleteLocation(places[1]), {message: LOCATION_IN_USE});
  // no table at the night may stay for the place to change: the Skica goes first, as Odbaci skicu does
  await prisma.round.deleteMany({where: {round_date: night(NIGHT), leagueRounds: {some: {league_id: leagueId}}}});
  // a moved night takes its Podjela along (and back)
  const placed = await prisma.leagueNightTeam.count({where: {league_id: leagueId, night: night(NIGHT)}});
  assert.ok(placed > 0);
  const moved = dayAfter(NIGHT, 3);
  await updateLeagueNight(leagueId, NIGHT, {date: moved});
  assert.equal(await prisma.leagueNightTeam.count({where: {league_id: leagueId, night: night(moved)}}), placed);
  await updateLeagueNight(leagueId, moved, {date: NIGHT});
  const one = await updateLeagueNight(leagueId, NIGHT, {second_location_id: null});
  assert.equal(one?.second_location, null);
  assert.equal(await prisma.leagueNightTeam.count({where: {league_id: leagueId, night: night(NIGHT)}}), 0);
  assert.equal((await nightSplit(leagueId, NIGHT))?.places, null);
});
