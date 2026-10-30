import assert from "node:assert/strict";
import {test} from "node:test";
import {PadMatch, TablePad} from "@/app/_interfaces/adminHand";
import {currentMatchNumber, matchSlots, matchTabSub, roundWins, tableState, toTableOverview} from "@/app/_lib/tableOverview";
import {manualFields} from "@/app/_lib/ui/adminEntry";

// Pregled stola and the admin's phone scorepad (DECISIONS #60): what a table and its two matches show

const hand = (id: number, total1: number, total2: number) => ({
  id,
  total1,
  total2,
  game1: total1,
  game2: total2,
  caller: 1 as const,
  completeVictory: false,
  manual: false,
  announcements: [{team: 1 as const, type: "TWENTY"}],
});

const finished = (number: number, score1: number, score2: number, winner: 1 | 2 | null): PadMatch => ({
  kind: "finished",
  id: 100 + number,
  number,
  score1,
  score2,
  threshold: 1001,
  winner,
  hands: [hand(number * 10, score1, score2)],
});

const pad = (matches: PadMatch[], done = false): TablePad => ({
  roundId: 7,
  leagueId: 1,
  tournamentId: null,
  matchesPerRound: 2,
  declarations: true,
  roundNumber: 3,
  date: "2026-02-17",
  table: 4,
  smoking: true,
  team1: {id: 11, name: "Purgeri"},
  team2: {id: 12, name: "Kvarnerci"},
  done,
  bye: false,
  hasLineup: true,
  matches,
});

test("the overview keeps each hand's totals only, and doesn't say whether the lineup is confirmed", () => {
  const o = toTableOverview(pad([finished(1, 1034, 748, 1)]));
  assert.deepEqual(o.matches[0].hands, [{id: 10, total1: 1034, total2: 748}]);
  assert.equal("hasLineup" in o, false);
  assert.equal(o.smoking, true);
  assert.equal(o.team1.name, "Purgeri");
});

test("a table is new until a hand is entered, live while played, done once closed", () => {
  const running: PadMatch = {kind: "ongoing", id: 9, number: 1, score1: 0, score2: 0, threshold: 1001, winner: null, hands: []};
  assert.equal(tableState({done: false, matches: []}), "new");
  // the lineup is confirmed and the match started, but nothing entered yet
  assert.equal(tableState({done: false, matches: [running]}), "new");
  assert.equal(tableState({done: false, matches: [{...running, hands: [hand(1, 62, 100)]}]}), "live");
  assert.equal(tableState({done: false, matches: [finished(1, 1034, 748, 1)]}), "live");
  assert.equal(tableState({done: true, matches: [finished(1, 1034, 748, 1), finished(2, 1012, 466, 1)]}), "done");
});

test("Meč 1 · Meč 2: played, being played, not started", () => {
  const running: PadMatch = {kind: "ongoing", id: 9, number: 2, score1: 312, score2: 480, threshold: 1001, winner: null, hands: [hand(1, 312, 480)]};
  const slots = matchSlots([finished(1, 748, 1034, 2), running]);
  assert.deepEqual(
    slots.map((s) => s.state),
    ["done", "live"]
  );
  const names: [string, string] = ["Slavonci", "Istrani"];
  assert.equal(matchTabSub(slots[0], names, "pregled"), "748 : 1034 · Istrani");
  assert.equal(matchTabSub(slots[1], names, "pregled"), "u tijeku · 312 : 480");
  assert.equal(matchTabSub(slots[0], names, "admin"), "748 : 1034 · završen");
  assert.equal(matchTabSub(slots[1], names, "admin"), "u tijeku");
  const fresh = matchSlots([]);
  assert.deepEqual(
    fresh.map((s) => [s.number, s.state, matchTabSub(s, names, "pregled")]),
    [
      [1, "new", "nije počeo"],
      [2, "new", "nije počeo"],
    ]
  );
});

test("a table opens on the match being played, else the last one played, else Meč 1", () => {
  assert.equal(currentMatchNumber([]), 1);
  assert.equal(currentMatchNumber([finished(1, 1034, 748, 1)]), 1);
  assert.equal(currentMatchNumber([finished(1, 1034, 748, 1), {...finished(2, 0, 0, null), kind: "ongoing"}]), 2);
  assert.equal(currentMatchNumber([finished(1, 1034, 748, 1), finished(2, 1012, 466, 1)]), 2);
});

test("the round's wins count finished matches with a winner", () => {
  assert.deepEqual(roundWins([finished(1, 1034, 748, 1), finished(2, 900, 1012, 2)]), [1, 1]);
  // a corrected match nobody won any more counts for neither
  assert.deepEqual(roundWins([finished(1, 990, 748, null)]), [0, 0]);
});

test("Ručni unos takes 0–9999 for each team, and at least one team's points", () => {
  assert.deepEqual(manualFields("", ""), {bad: false, points: null});
  assert.deepEqual(manualFields("124", ""), {bad: false, points: null});
  assert.deepEqual(manualFields("124", "38"), {bad: false, points: [124, 38]});
  assert.deepEqual(manualFields("0", "0"), {bad: false, points: null});
  assert.deepEqual(manualFields("9999", "0"), {bad: false, points: [9999, 0]});
  assert.deepEqual(manualFields("10000", "0"), {bad: true, points: null});
  assert.deepEqual(manualFields("1.5", "0"), {bad: true, points: null});
});
