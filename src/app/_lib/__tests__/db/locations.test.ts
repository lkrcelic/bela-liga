import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {LOCATION_IN_USE, LOCATION_NAME_TAKEN, LOCATION_NOT_FOUND} from "@/app/_interfaces/location";
import {createLocation, deleteLocation, updateLocation} from "@/app/_lib/service/location/locations";
import {addLeagueNight, updateLeagueNight} from "@/app/_lib/service/league/nights";

// Lokacije against a real Postgres (DECISIONS #98): a place's name is tidied and can't repeat in another case or
// spacing, an emptied address goes, a place in use can't be deleted and an unused one can, and a league night pointed
// at a place that doesn't exist is a readable refusal, not a 500. Run with `npm run test:db` and DATABASE_URL on a
// throwaway database with the migrations applied.

const tag = `lc${Date.now()}`;
const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const made: number[] = [];
let leagueId = 0;

before(async () => {
  leagueId = (await prisma.league.create({data: {league_name: `${tag} liga`}})).league_id;
});

after(async () => {
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.location.deleteMany({where: {location_id: {in: made}}});
  await prisma.$disconnect();
});

test("a new place's name is tidied, and the same name in another case or spacing is refused", async () => {
  const kartas = await createLocation({name: `  ${tag}   Kartaš `, address: " Ilica 1 ", url: ""});
  made.push(kartas.location_id);
  assert.deepEqual([kartas.name, kartas.address, kartas.url], [`${tag} Kartaš`, "Ilica 1", null]);
  await assert.rejects(createLocation({name: `${tag.toUpperCase()} kartaš`}), {message: LOCATION_NAME_TAKEN});
  assert.equal(await prisma.location.count({where: {name: {contains: tag, mode: "insensitive"}}}), 1);
});

test("Uredi lokaciju changes what it is given, refuses another place's name and an unknown place", async () => {
  const lanterna = await createLocation({name: `${tag} Lanterna`, address: "Savska 52"});
  made.push(lanterna.location_id);
  const edited = await updateLocation(lanterna.location_id, {address: "", url: "https://maps.app.goo.gl/x"});
  assert.deepEqual([edited.name, edited.address, edited.url], [`${tag} Lanterna`, null, "https://maps.app.goo.gl/x"]);
  await assert.rejects(updateLocation(lanterna.location_id, {name: `${tag} KARTAŠ`}), {message: LOCATION_NAME_TAKEN});
  // its own name in another case is fine
  assert.equal((await updateLocation(lanterna.location_id, {name: `${tag} lanterna`})).name, `${tag} lanterna`);
  await assert.rejects(updateLocation(2_000_000_000, {address: "x"}), {message: LOCATION_NOT_FOUND});
});

test("a place a night uses can't be deleted; an unused one can", async () => {
  const [kartas, lanterna] = made;
  await addLeagueNight(leagueId, {date: nextWeek, location_id: kartas});
  await assert.rejects(deleteLocation(kartas), {message: LOCATION_IN_USE});
  await deleteLocation(lanterna);
  assert.equal(await prisma.location.count({where: {location_id: lanterna}}), 0);
  await assert.rejects(deleteLocation(lanterna), {message: LOCATION_NOT_FOUND});
});

test("a night pointed at a place that doesn't exist is refused with a readable message", async () => {
  await assert.rejects(addLeagueNight(leagueId, {date: "2027-01-05", location_id: 2_000_000_000}), {message: LOCATION_NOT_FOUND});
  await assert.rejects(updateLeagueNight(leagueId, nextWeek, {location_id: 2_000_000_000}), {message: LOCATION_NOT_FOUND});
});
