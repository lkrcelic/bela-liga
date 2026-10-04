import assert from "node:assert/strict";
import {test} from "node:test";
import {
  addZvanje,
  blankEntry,
  canSave,
  clearPoints,
  EntryState,
  fromPadHand,
  previewTotals,
  setActive,
  setCaller,
  setStiglja,
  switchMode,
  toAdminHand,
  typeDigit,
} from "../ui/adminEntry";
import {normalizeBelaResult} from "../validation/validateResult";

// The admin scorepad's hand entry (normal and manual)

const type = (s: EntryState, digits: string) => digits.split("").reduce((acc, d) => typeDigit(acc, Number(d)), s);

test("normal entry fills in the other team's half of 162 and stops at 162", () => {
  let s = type(blankEntry(), "92");
  assert.deepEqual(s.points, [92, 70]);
  s = type(setActive(s, 2), "163");
  assert.deepEqual(s.points, [146, 16]);
});

test("manual entry types each team on its own, up to 9999", () => {
  let s = type(blankEntry("man"), "600");
  s = type(setActive(s, 2), "1100");
  assert.deepEqual(s.points, [600, 1100]);
  s = type(s, "0"); // 11000 is too much
  assert.deepEqual(s.points, [600, 1100]);
  assert.equal(canSave(s), true);
  assert.deepEqual(toAdminHand(s), {manual: true, points1: 600, points2: 1100});
});

test("a normal hand needs a caller and game points that add up", () => {
  let s = type(blankEntry(), "92");
  assert.equal(canSave(s), false);
  s = setCaller(s, 2);
  assert.equal(canSave(s), true);
  assert.equal(canSave(clearPoints(s)), false);
  assert.equal(canSave(blankEntry("man")), false);
});

test("Štiglja is 252 : 0 for the active team and blocks the keypad", () => {
  let s = setStiglja(setActive(setCaller(blankEntry(), 1), 2));
  assert.deepEqual(s.points, [0, 252]);
  s = typeDigit(s, 5);
  assert.deepEqual(s.points, [0, 252]);
  assert.equal(canSave(s), true);
  assert.equal(setStiglja(blankEntry("man")).stiglja, false);
});

test("zvanja are limited to 16 cards per team", () => {
  let s = blankEntry();
  for (const v of [100, 100, 50, 20, 50] as const) s = addZvanje(s, v);
  assert.deepEqual(s.zvanja[1], {20: 1, 50: 1, 100: 2, 150: 0, 200: 0});
});

test("the hand sent to the server matches what the server computes", () => {
  let s = setCaller(type(blankEntry(), "60"), 1);
  s = addZvanje(s, 20);
  s = addZvanje(setActive(s, 2), 50);
  const hand = toAdminHand(s);
  assert.equal(hand.manual, false);
  if (hand.manual) return;
  const {manual: _m, ...rest} = hand;
  void _m;
  const saved = normalizeBelaResult({...rest, match_id: 1});
  assert.deepEqual([saved.player_pair1_total_points, saved.player_pair2_total_points], previewTotals(s));
  assert.deepEqual(previewTotals(s), [0, 232]); // 80 : 152, the caller falls
});

test("switching mode keeps the points and drops zvanja and Štiglja", () => {
  let s = addZvanje(setStiglja(setCaller(blankEntry(), 1)), 50);
  s = switchMode(s, "man");
  assert.deepEqual(s.points, [252, 0]);
  assert.equal(s.stiglja, false);
  assert.equal(s.zvanja[1][50], 0);
});

test("a saved hand opens with its caller, points, Štiglja and zvanja; a manual one as manual", () => {
  const std = fromPadHand({
    id: 1, total1: 142, total2: 70, game1: 92, game2: 70, caller: 1, completeVictory: false, manual: false,
    announcements: [{team: 1, type: "FIFTY"}, {team: 2, type: "TWENTY"}, {team: 2, type: "TWENTY"}],
  });
  assert.equal(std.mode, "std");
  assert.equal(std.caller, 1);
  assert.deepEqual(std.points, [92, 70]);
  assert.equal(std.zvanja[1][50], 1);
  assert.equal(std.zvanja[2][20], 2);

  const man = fromPadHand({id: 2, total1: 600, total2: 300, game1: 600, game2: 300, caller: null, completeVictory: false, manual: true, announcements: []});
  assert.equal(man.mode, "man");
  assert.deepEqual(man.points, [600, 300]);
});
