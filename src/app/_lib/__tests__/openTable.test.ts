import assert from "node:assert/strict";
import {test} from "node:test";
import {readSaysNothing, tableToPlay} from "@/app/_lib/ui/openTable";

// The player's open table on the pages that offer it (#85): a tournament's page offers Započni igru only for the
// player's open table of that tournament, never for a table the tournament already says was decided without play, and
// a failed read keeps the card shown unless the server said there is no table

const open = {roundId: 4777, tournamentId: 14};
const noShow = {round_id: 4777, attendance: "NO_SHOW" as const, won: true};

test("the player's open table of this tournament is the one to play", () => {
  assert.equal(tableToPlay(open, 14, null), open);
  assert.equal(tableToPlay(open, 14, undefined), open);
});

test("no open table, or an open table of another tournament or of a league, offers nothing here", () => {
  assert.equal(tableToPlay(null, 14, null), null);
  assert.equal(tableToPlay({roundId: 4777, tournamentId: 15}, 14, null), null);
  assert.equal(tableToPlay({roundId: 4777, tournamentId: null}, 14, null), null);
});

test("a table the tournament says ended without play (Ne, nisu došli or skipped) isn't offered, though the open table still has it", () => {
  const lost = {...noShow, won: false};
  const skipped = {...noShow, attendance: "SKIPPED" as const, won: false};
  assert.equal(tableToPlay(open, 14, noShow), null);
  assert.equal(tableToPlay(open, 14, lost), null);
  assert.equal(tableToPlay(open, 14, skipped), null);
});

test("a table of an earlier Kolo decided without play leaves the new Kolo's table to play", () => {
  const earlier = {...noShow, round_id: 4700};
  assert.equal(tableToPlay(open, 14, earlier), open);
});

test("no connection or a server fault says nothing about the table, so the card shown stays", () => {
  assert.equal(readSaysNothing(new Error("Nema veze.")), true);
  assert.equal(readSaysNothing(Object.assign(new Error("Greška"), {status: 500})), true);
  assert.equal(readSaysNothing(Object.assign(new Error("Greška"), {status: 503})), true);
  assert.equal(readSaysNothing(null), true);
});

test("the server saying there is no open table, or that the player is logged out, takes the card away", () => {
  assert.equal(readSaysNothing(Object.assign(new Error("Trenutno nemaš otvorenu rundu."), {status: 404})), false);
  assert.equal(readSaysNothing(Object.assign(new Error("Prijavi se."), {status: 401})), false);
});
