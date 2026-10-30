import assert from "node:assert/strict";
import {test} from "node:test";
import {clockLabel, closesAfterHand, closesByTime, handTiming, LATE_HAND_GRACE_MS, matchDeadline, timeWinner} from "@/app/_lib/gameTime";

// Vrijeme partije: the deadline, the hands after it, and closing a match by time

const start = new Date("2026-10-31T09:00:00Z");
const ends = matchDeadline(start, 35);
const at = (minutes: number, seconds = 0) => new Date(start.getTime() + minutes * 60_000 + seconds * 1000);

test("a match's time counts from its start", () => {
  assert.equal(ends.toISOString(), "2026-10-31T09:35:00.000Z");
});

test("a hand before the time is up is on time; without a limit always", () => {
  assert.equal(handTiming({now: at(34, 59), endsAt: ends, tied: false}), "on_time");
  assert.equal(handTiming({now: at(90), endsAt: null, tied: false}), "on_time");
});

test("after the time: a hand started in time comes within the grace, a level score gets one more hand", () => {
  assert.equal(handTiming({now: at(36), endsAt: ends, tied: false, entryStartedAt: at(34, 30)}), "late_entry");
  // started after the time: refused
  assert.equal(handTiming({now: at(36), endsAt: ends, tied: false, entryStartedAt: at(35, 10)}), "too_late");
  // past the grace: refused even if started in time
  assert.equal(handTiming({now: new Date(ends.getTime() + LATE_HAND_GRACE_MS + 1000), endsAt: ends, tied: false, entryStartedAt: at(34)}), "too_late");
  assert.equal(handTiming({now: at(50), endsAt: ends, tied: true}), "extra_hand");
});

test("a hand after the time ends the match unless the score is still level", () => {
  assert.equal(closesAfterHand("late_entry", false), true);
  assert.equal(closesAfterHand("late_entry", true), false);
  assert.equal(closesAfterHand("extra_hand", false), true);
  assert.equal(closesAfterHand("on_time", false), false);
});

test("nobody finishing: the match closes by itself after the time and the grace, not while level", () => {
  assert.equal(closesByTime({now: at(36), endsAt: ends, tied: false}), false);
  assert.equal(closesByTime({now: at(37, 1), endsAt: ends, tied: false}), true);
  assert.equal(closesByTime({now: at(60), endsAt: ends, tied: true}), false);
  assert.equal(closesByTime({now: at(60), endsAt: null, tied: false}), false);
});

test("the team with more points wins a match closed by time", () => {
  assert.equal(timeWinner(640, 588), 1);
  assert.equal(timeWinner(300, 420), 2);
  assert.equal(timeWinner(500, 500), null);
});

test("the scorepad's clock", () => {
  assert.equal(clockLabel(23 * 60_000 + 41_000), "23:41");
  assert.equal(clockLabel(5 * 60_000), "5:00");
  assert.equal(clockLabel(6_500), "0:07");
  assert.equal(clockLabel(-3000), "0:00");
});
