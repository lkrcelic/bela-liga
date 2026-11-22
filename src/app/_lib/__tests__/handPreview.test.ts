// The Σ line on the points step (Korak 3 od 3, players and admin scorepad) shows what Spremi will save, pad and
// štiglja included, and which team fell (#48)
import {test} from "node:test";
import assert from "node:assert/strict";
import {handPreview} from "@/app/_lib/bela/scoring";

const preview = (overrides: Partial<Parameters<typeof handPreview>[0]>) => handPreview({
  gamePoints1: 90,
  gamePoints2: 72,
  announcementPoints1: 0,
  announcementPoints2: 0,
  trumpCaller: 1,
  completeVictory: false,
  ...overrides,
});

test("a calling team that passes shows its points plus its zvanja", () => {
  assert.deepEqual(preview({announcementPoints1: 20}), {sums: [110, 72], fell: null});
});

test("a calling team that falls shows 0 and the other team takes 162 and all zvanja", () => {
  // the issue's hand: caller with 20 zvanja takes 50, the other team 112; saved 0 : 182
  assert.deepEqual(preview({gamePoints1: 50, gamePoints2: 112, announcementPoints1: 20}), {sums: [0, 182], fell: 1});
  assert.deepEqual(preview({gamePoints1: 100, gamePoints2: 62, trumpCaller: 2}), {sums: [162, 0], fell: 2});
});

test("a tie is a fall for the calling team in the preview too", () => {
  assert.deepEqual(preview({gamePoints1: 81, gamePoints2: 81}), {sums: [0, 162], fell: 1});
});

test("štiglja gives 252 and every zvanje to the team that took all tricks", () => {
  // the issue's admin hand: caller team 2 with 20 zvanja, team 1 with 100 zvanja and Štiglja; saved 372 : 0
  assert.deepEqual(
    preview({gamePoints1: 252, gamePoints2: 0, announcementPoints1: 100, announcementPoints2: 20, trumpCaller: 2, completeVictory: true}),
    {sums: [372, 0], fell: null}
  );
});

test("before the game points are typed it is just each team's zvanja, with no pad", () => {
  assert.deepEqual(preview({gamePoints1: 0, gamePoints2: 0, announcementPoints1: 20}), {sums: [20, 0], fell: null});
});

test("with no caller yet nobody can fall", () => {
  assert.deepEqual(preview({gamePoints1: 50, gamePoints2: 112, trumpCaller: null}), {sums: [50, 112], fell: null});
});
