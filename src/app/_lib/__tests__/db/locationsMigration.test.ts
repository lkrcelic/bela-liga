import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {after, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";

// The data part of migration 20261114120000_locations (#81, DECISIONS #98): every place written as text on a league,
// night or tournament becomes one Location. The same name in any case and spacing is one place, named by its most used
// spelling (the newest of equals), with the newest address and link that are filled in; an empty name and a night
// without a place stay without one. The migration's own SQL runs, unchanged, on tables in a schema of this file's own
// that have the old text columns, so no other row in the database is read or changed. Run with `npm run test:db` and
// DATABASE_URL on a throwaway database with the migrations applied.

const schema = `locmig_${Date.now()}`;
const migration = readFileSync(join(process.cwd(), "prisma/migrations/20261114120000_locations/migration.sql"), "utf8");

// the statements of a part of the migration: comments dropped, split where a line ends with ";"
function statements(sql: string) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const createLocation = migration.match(/CREATE TABLE "Location" \([\s\S]*?\);\n/)?.[0];
const dataPart = migration.slice(migration.indexOf("-- Data: today's places become Locations"));

type Row = {name: string | null; address: string | null; url: string | null};
type Place = {location_id: number; name: string; address: string | null; url: string | null};
type Pointer = {id: string; location_id: number | null};

after(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$disconnect();
});

// the tables as they were before the migration (only the columns its data part reads and writes), the rows given,
// then the migration's data part; returns the Locations made and where each row points
async function migrate(rows: {league: (Row & {id: string; at: string})[]; night: (Row & {id: string; at: string})[]; tournament: (Row & {id: string; at: string})[]}) {
  assert.ok(createLocation, "the migration creates the Location table");
  assert.ok(dataPart.length > 0, "the migration has its data part");
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    const old = `"id" TEXT PRIMARY KEY, "location_name" VARCHAR(100), "location_address" VARCHAR(200), "location_url" VARCHAR(500), "location_id" INTEGER`;
    await tx.$executeRawUnsafe(`CREATE TABLE "League" (${old}, "created_at" TIMESTAMP(3) NOT NULL)`);
    await tx.$executeRawUnsafe(`CREATE TABLE "LeagueNight" (${old}, "night" DATE NOT NULL)`);
    await tx.$executeRawUnsafe(`CREATE TABLE "Tournament" (${old}, "date" DATE NOT NULL)`);
    for (const [table, when] of [["League", "created_at"], ["LeagueNight", "night"], ["Tournament", "date"]] as const) {
      const list = table === "League" ? rows.league : table === "LeagueNight" ? rows.night : rows.tournament;
      for (const r of list) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "${table}" ("id", "location_name", "location_address", "location_url", "${when}") VALUES ($1, $2, $3, $4, $5::timestamp)`,
          r.id, r.name, r.address, r.url, r.at,
        );
      }
    }
    for (const s of statements(createLocation!)) await tx.$executeRawUnsafe(s);
    for (const s of statements(dataPart)) await tx.$executeRawUnsafe(s);

    const places = await tx.$queryRawUnsafe<Place[]>(`SELECT "location_id", "name", "address", "url" FROM "Location" ORDER BY "name"`);
    const pointers = await tx.$queryRawUnsafe<Pointer[]>(
      `SELECT "id", "location_id" FROM "League" UNION ALL SELECT "id", "location_id" FROM "LeagueNight"
       UNION ALL SELECT "id", "location_id" FROM "Tournament" ORDER BY "id"`,
    );
    await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    return {places, byName: new Map(places.map((p) => [p.name, p.location_id])), pointers: Object.fromEntries(pointers.map((p) => [p.id, p.location_id]))};
  }, {timeout: 30_000});
}

test("each written place becomes one Location, and every league, night and tournament points at its own", async () => {
  const {places, byName, pointers} = await migrate({
    league: [
      // Rio written with extra spaces, the oldest row with an address
      {id: "league rio", name: "  Caffe   Bar Rio ", address: "Stara 1", url: null, at: "2025-01-01"},
      // Pod Lipom: two spellings used once each, the older one here
      {id: "league lipa", name: "Pod lipom", address: "Lipova 5", url: "https://maps.app.goo.gl/lipa", at: "2024-09-01"},
      // an empty name is no place
      {id: "league empty", name: "   ", address: "Negdje 9", url: null, at: "2025-01-02"},
    ],
    night: [
      // Rio: the newest address and link
      {id: "night rio feb", name: "Caffe Bar Rio", address: " Nova 2 ", url: "https://maps.app.goo.gl/rio", at: "2025-02-01"},
      // Rio in lower case, the newest row, but this spelling is used once: it doesn't name the place; and without an
      // address or link it doesn't empty the place's
      {id: "night rio mar", name: "caffe bar rio", address: "", url: " ", at: "2025-03-01"},
      // a night without its own place (the league's)
      {id: "night none", name: null, address: null, url: null, at: "2025-03-08"},
    ],
    tournament: [
      {id: "tournament rio", name: "Caffe Bar Rio", address: "Srednja 3", url: null, at: "2025-01-15"},
      // Pod Lipom's newer spelling, used as often as the older one
      {id: "tournament lipa", name: "Pod Lipom", address: null, url: null, at: "2025-06-01"},
      {id: "tournament tresnja", name: "Klub Trešnja", address: null, url: null, at: "2025-04-01"},
    ],
  });

  assert.deepEqual(
    places.map(({name, address, url}) => ({name, address, url})),
    [
      // "Caffe Bar Rio" is written three times (league, night of February, tournament), "caffe bar rio" once (newest)
      {name: "Caffe Bar Rio", address: "Nova 2", url: "https://maps.app.goo.gl/rio"},
      {name: "Klub Trešnja", address: null, url: null},
      // a tie in use goes to the newest spelling; the address and link of the older row stay, as nothing newer has any
      {name: "Pod Lipom", address: "Lipova 5", url: "https://maps.app.goo.gl/lipa"},
    ],
  );
  assert.deepEqual(pointers, {
    "league empty": null,
    "league lipa": byName.get("Pod Lipom"),
    "league rio": byName.get("Caffe Bar Rio"),
    "night none": null,
    "night rio feb": byName.get("Caffe Bar Rio"),
    "night rio mar": byName.get("Caffe Bar Rio"),
    "tournament lipa": byName.get("Pod Lipom"),
    "tournament rio": byName.get("Caffe Bar Rio"),
    "tournament tresnja": byName.get("Klub Trešnja"),
  });
});
