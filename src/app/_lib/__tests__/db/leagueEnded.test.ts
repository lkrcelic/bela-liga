import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leaguesEnded} from "@/app/_lib/service/league/ended";

// A league is over once its last night is (DECISIONS 104, #90): before 08:00 only when that night has played its Broj
// kola at every place, every table of those Kolos closed and no Kolo still being played; the same night played out
// doesn't end a league whose last night is later. The night and the clock are fixed (the last night 18.11.2026, asked
// at 21:00, at 03:45 the morning after, when #90 showed "Završeno", and at 08:00), so the test doesn't depend on when
// it runs. Run with `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied.

const tag = `le${Date.now()}`;
const NIGHT = "2026-11-18";
const nightDate = new Date(`${NIGHT}T00:00:00.000Z`);
// Zagreb is UTC+1 in November
const EVENING = new Date("2026-11-18T20:00:00Z");
const AT_0345 = new Date("2026-11-19T02:45:00Z");
const AT_0800 = new Date("2026-11-19T07:00:00Z");
const leagues: number[] = [];
const teams: number[] = [];
const places: number[] = [];

before(async () => {
  for (const name of ["Kartaš", "Lanterna"]) places.push((await prisma.location.create({data: {name: `${tag} ${name}`}})).location_id);
  for (const name of ["A", "B"]) teams.push((await prisma.team.create({data: {team_name: `${tag} ${name}`}})).team_id);
});

after(async () => {
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: {in: leagues}}}}});
  await prisma.league.deleteMany({where: {league_id: {in: leagues}}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.location.deleteMany({where: {location_id: {in: places}}});
  await prisma.$disconnect();
});

// a league playing on NIGHT at Kartaš (Broj kola: rounds), and at Lanterna too with its own Broj kola when second is given
async function league(name: string, rounds: number, second?: {rounds: number | null}): Promise<number> {
  const l = await prisma.league.create({data: {league_name: `${tag} ${name}`, rounds_per_night: rounds, location_id: places[0]}});
  leagues.push(l.league_id);
  await prisma.leagueNight.create({
    data: {league_id: l.league_id, night: nightDate, ...(second ? {second_location_id: places[1], second_rounds_per_night: second.rounds} : {})},
  });
  return l.league_id;
}

// a published table of that night's Kolo at a place (slot null: a one-place night)
const table = (leagueId: number, kolo: number, open: boolean, slot: number | null = null) =>
  prisma.round.create({
    data: {team1_id: teams[0], team2_id: teams[1], round_number: kolo, round_date: nightDate, status: "PUBLISHED", published_at: EVENING, open, location_slot: slot, leagueRounds: {create: {league_id: leagueId}}},
  });

const ended = async (id: number, now: Date, end: string = NIGHT) => (await leaguesEnded([{league_id: id, end_date: end, last_night: null}], now)).get(id);

test("#90: at 03:45 after the league's last night it still runs while Kolos are left; it ends after the last Kolo, and at 08:00 anyway", async () => {
  const id = await league("jedno mjesto", 2);
  assert.equal(await ended(id, AT_0345), false, "03:45, nothing played: still the last night");
  await table(id, 1, false);
  assert.equal(await ended(id, AT_0345), false, "Kolo 1 of 2 played, every table closed");
  const kolo2 = await table(id, 2, true);
  assert.equal(await ended(id, AT_0345), false, "Kolo 2 being played");
  assert.equal(await ended(id, AT_0800), true, "08:00: over with Kolo 2 unplayed");
  await prisma.round.update({where: {id: kolo2.id}, data: {open: false}});
  assert.equal(await ended(id, EVENING), true, "Kolo 2 of 2 played, the same evening");
  assert.equal(await ended(id, AT_0345), true);
  // a Kolo beyond Broj kola keeps it going while it is played
  const kolo3 = await table(id, 3, true);
  assert.equal(await ended(id, AT_0345), false, "Kolo 3 of 2 being played");
  await prisma.round.update({where: {id: kolo3.id}, data: {open: false}});
  assert.equal(await ended(id, AT_0345), true);
});

test("a night played out ends only a league whose last night it is; a last night behind the league night is over", async () => {
  const id = await league("kasnije", 1);
  await table(id, 1, false);
  assert.equal(await ended(id, EVENING, "2026-11-25"), false, "the last night is next week");
  assert.equal(await ended(id, EVENING, "2026-11-17"), true, "the last night was yesterday: 08:00 passed");
  assert.equal(await ended(id, EVENING), true);
});

test("on a two-place night the league is over once both places have played their own Broj kola", async () => {
  // Kartaš plays 2, Lanterna its own 1
  const id = await league("dva mjesta", 2, {rounds: 1});
  await table(id, 1, false, 1);
  await table(id, 1, false, 2);
  assert.equal(await ended(id, AT_0345), false, "Lanterna is done, Kartaš has 1 of 2");
  await table(id, 2, false, 1);
  assert.equal(await ended(id, AT_0345), true);
});
