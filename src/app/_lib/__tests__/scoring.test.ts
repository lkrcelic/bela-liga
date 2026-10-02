import {test} from "node:test";
import assert from "node:assert/strict";
import {computeHandTotals, gamePointsError, matchWinner, sumAnnouncements} from "@/app/_lib/bela/scoring";

const hand = (overrides: Partial<Parameters<typeof computeHandTotals>[0]>) => computeHandTotals({
  gamePoints1: 90,
  gamePoints2: 72,
  announcementPoints1: 0,
  announcementPoints2: 0,
  trumpCaller: 1,
  completeVictory: false,
  ...overrides,
});

test("calling team that scores more keeps its points", () => {
  assert.deepEqual(hand({}), {totalPoints1: 90, totalPoints2: 72, pass: true});
});

test("calling team that scores less falls (pad) and the other team takes everything", () => {
  assert.deepEqual(hand({gamePoints1: 70, gamePoints2: 92}), {totalPoints1: 0, totalPoints2: 162, pass: false});
  assert.deepEqual(hand({gamePoints1: 70, gamePoints2: 92, announcementPoints1: 20}), {totalPoints1: 0, totalPoints2: 182, pass: false});
});

test("a tie is a fall for the calling team", () => {
  assert.deepEqual(hand({gamePoints1: 81, gamePoints2: 81}), {totalPoints1: 0, totalPoints2: 162, pass: false});
  assert.deepEqual(hand({gamePoints1: 81, gamePoints2: 81, trumpCaller: 2}), {totalPoints1: 162, totalPoints2: 0, pass: false});
});

test("announcements count towards passing", () => {
  assert.deepEqual(hand({gamePoints1: 70, gamePoints2: 92, announcementPoints1: 50}), {totalPoints1: 120, totalPoints2: 92, pass: true});
});

test("team 2 calling", () => {
  assert.deepEqual(hand({trumpCaller: 2}), {totalPoints1: 162, totalPoints2: 0, pass: false});
  assert.deepEqual(hand({trumpCaller: 2, gamePoints1: 60, gamePoints2: 102}), {totalPoints1: 60, totalPoints2: 102, pass: true});
});

test("complete victory gives 252 plus all announcements to the winner", () => {
  assert.deepEqual(hand({completeVictory: true, gamePoints1: 0, gamePoints2: 252, announcementPoints1: 20, announcementPoints2: 50}),
    {totalPoints1: 0, totalPoints2: 322, pass: true});
  assert.deepEqual(hand({completeVictory: true, gamePoints1: 252, gamePoints2: 0}), {totalPoints1: 252, totalPoints2: 0, pass: true});
});

test("game points validation", () => {
  assert.equal(gamePointsError(90, 72, false), null);
  assert.notEqual(gamePointsError(90, 73, false), null);
  assert.notEqual(gamePointsError(-10, 172, false), null);
  assert.equal(gamePointsError(252, 0, true), null);
  assert.notEqual(gamePointsError(252, 10, true), null);
  assert.notEqual(gamePointsError(90, 72, true), null);
});

test("announcement sums per team", () => {
  const announcements = [
    {team: 1 as const, announcement_type: "TWENTY" as const},
    {team: 1 as const, announcement_type: "FIFTY" as const},
    {team: 2 as const, announcement_type: "ONE_HUNDRED" as const},
  ];
  assert.equal(sumAnnouncements(announcements, 1), 70);
  assert.equal(sumAnnouncements(announcements, 2), 100);
  assert.equal(sumAnnouncements([], 1), 0);
});

test("match is over once a team reaches the threshold with a lead", () => {
  assert.equal(matchWinner(1000, 900, 1001), null);
  assert.equal(matchWinner(1001, 900, 1001), 1);
  assert.equal(matchWinner(1050, 1100, 1001), 2);
  assert.equal(matchWinner(1100, 1100, 1001), null);
});
