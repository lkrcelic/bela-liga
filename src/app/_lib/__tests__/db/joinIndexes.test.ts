import assert from "node:assert/strict";
import {after, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";

// The join and filter columns the standings, Rejting, team pages, scorepads and permission checks read on every poll
// have an index of their own (#50). Postgres doesn't index a foreign key by itself, and a composite primary key only
// helps a lookup by its first column, so without these every such query scans the whole table, which grows every
// season. Run with `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied.

after(async () => {
  await prisma.$disconnect();
});

// table → the columns that must each be the first column of some index on it
const EXPECTED: Record<string, string[]> = {
  Round: ["team1_id", "team2_id", "round_date"],
  Match: ["round_id"],
  OngoingMatch: ["round_id"],
  LeagueRound: ["round_id"],
  BelaResult: ["match_id"],
  OngoingBelaResult: ["match_id"],
  BelaPlayerAnnouncement: ["result_id"],
  OngoingBelaPlayerAnnouncement: ["result_id"],
  TeamPlayer: ["player_id"],
  RoundPlayer: ["player_id"],
  Session: ["userId"],
  LuciaSession: ["userId"],
};

test("every hot join column leads an index, so its lookups don't scan the table", async () => {
  const rows = await prisma.$queryRaw<{table: string; column: string}[]>`
    SELECT t.relname AS "table", a.attname AS "column"
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = current_schema()
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]`;
  const leading = new Set(rows.map((r) => `${r.table}.${r.column}`));
  const missing = Object.entries(EXPECTED)
    .flatMap(([table, columns]) => columns.map((column) => `${table}.${column}`))
    .filter((key) => !leading.has(key));
  assert.deepEqual(missing, []);
});
