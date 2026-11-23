import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leagueNight, leagueNightString} from "@/app/_lib/dates";
import {leaguesEnded} from "@/app/_lib/service/league/ended";

// A league is over once its last night is (DECISIONS 104, #90): before 08:00 only when that night has played its Broj
// kola at every place, every table of those Kolos closed and no Kolo still being played; the same night played out
// doesn't end a league whose last night is later. Run with `npm run test:db` and DATABASE_URL on a throwaway database
// with the migrations applied.

const tag = `le${Date.now()}`;
const tonight = leagueNight();
const night = leagueNightString();
const shift = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
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

// a league playing tonight at Kartaš (Broj kola: rounds), and at Lanterna too with its own Broj kola when second is given
async function league(name: string, rounds: number, second?: {rounds: number | null}): Promise<number> {
  const l = await prisma.league.create({data: {league_name: `${tag} ${name}`, rounds_per_night: rounds, location_id: places[0]}});
  leagues.push(l.league_id);
  await prisma.leagueNight.create({
    data: {league_id: l.league_id, night: tonight, ...(second ? {second_location_id: places[1], second_rounds_per_night: second.rounds} : {})},
  });
  return l.league_id;
}

// a published table of tonight's Kolo at a place (slot null: a one-place night)
const table = (leagueId: number, kolo: number, open: boolean, slot: number | null = null) =>
  prisma.round.create({
    data: {team1_id: teams[0], team2_id: teams[1], round_number: kolo, round_date: tonight, status: "PUBLISHED", published_at: new Date(), open, location_slot: slot, leagueRounds: {create: {league_id: leagueId}}},
  });

const ended = async (id: number, end: string = night) => (await leaguesEnded([{league_id: id, end_date: end, last_night: null}])).get(id);

test("a league whose last night is tonight is over once that night has played its Broj kola, not between Kolos", async () => {
  const id = await league("jedno mjesto", 2);
  assert.equal(await ended(id), false, "nothing played yet");
  await table(id, 1, false);
  assert.equal(await ended(id), false, "Kolo 1 of 2 played, every table closed");
  const kolo2 = await table(id, 2, true);
  assert.equal(await ended(id), false, "Kolo 2 being played");
  await prisma.round.update({where: {id: kolo2.id}, data: {open: false}});
  assert.equal(await ended(id), true, "Kolo 2 of 2 played");
  // a Kolo beyond Broj kola keeps it going while it is played
  const kolo3 = await table(id, 3, true);
  assert.equal(await ended(id), false, "Kolo 3 of 2 being played");
  await prisma.round.update({where: {id: kolo3.id}, data: {open: false}});
  assert.equal(await ended(id), true);
});

test("tonight played out ends only a league whose last night it is; a last night behind the league night is over", async () => {
  const id = await league("kasnije", 1);
  await table(id, 1, false);
  assert.equal(await ended(id, shift(night, 7)), false, "the last night is next week");
  assert.equal(await ended(id, shift(night, -1)), true, "the last night was yesterday: 08:00 passed");
  assert.equal(await ended(id), true);
});

test("on a two-place night the league is over once both places have played their own Broj kola", async () => {
  // Kartaš plays 2, Lanterna its own 1
  const id = await league("dva mjesta", 2, {rounds: 1});
  await table(id, 1, false, 1);
  await table(id, 1, false, 2);
  assert.equal(await ended(id), false, "Lanterna is done, Kartaš has 1 of 2");
  await table(id, 2, false, 1);
  assert.equal(await ended(id), true);
});
