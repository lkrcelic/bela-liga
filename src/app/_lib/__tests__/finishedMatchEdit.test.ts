import assert from "node:assert/strict";
import {test} from "node:test";
import {finishedMatchWinner, noWinnerWarning} from "../service/admin/hands";

// The admin scorepad's change of a finished match's hands: the match may change hands freely, but leaving a match that
// had a winner without one (the round then counts it for neither team) needs the admin's confirmation first. The database side is in
// db/finishedMatchEdit.test.ts (npm run test:db).

const match = (score1: number, score2: number, extra: {time_expired?: boolean; score_threshold?: number | null} = {}) => ({
  player_pair1_score: score1,
  player_pair2_score: score2,
  score_threshold: extra.score_threshold ?? 1001,
  time_expired: extra.time_expired ?? false,
});

test("a finished match goes to the team over the threshold, or by points when time ran out", () => {
  assert.equal(finishedMatchWinner(match(1020, 640)), 1);
  assert.equal(finishedMatchWinner(match(900, 1005)), 2);
  assert.equal(finishedMatchWinner(match(860, 640)), null);
  assert.equal(finishedMatchWinner(match(860, 640, {time_expired: true})), 1);
  assert.equal(finishedMatchWinner(match(700, 700, {time_expired: true})), null);
  assert.equal(finishedMatchWinner(match(860, 640, {score_threshold: null})), null);
});

test("deleting a hand that takes the winner below 1001 asks first", () => {
  const warning = noWinnerWarning(match(1020, 640), match(860, 640));
  assert.equal(warning, "Nakon ove promjene meč je 860:640 i nitko nema 1001, pa se ne broji nijednoj ekipi. Rezultat stola, poredak i rejting ponovno se računaju.");
});

test("an edit that levels the score asks first, with or without the time limit", () => {
  assert.match(noWinnerWarning(match(1100, 1010), match(1010, 1010)) ?? "", /meč je 1010:1010, pa/);
  assert.match(noWinnerWarning(match(800, 700, {time_expired: true}), match(700, 700, {time_expired: true})) ?? "", /meč je 700:700, pa/);
});

test("an edit that keeps a winner, or moves the win to the other team, doesn't ask", () => {
  assert.equal(noWinnerWarning(match(1020, 640), match(1010, 650)), null);
  assert.equal(noWinnerWarning(match(1020, 900), match(900, 1020)), null);
  assert.equal(noWinnerWarning(match(800, 700, {time_expired: true}), match(650, 700, {time_expired: true})), null);
});

test("a match that already had no winner can still be corrected", () => {
  assert.equal(noWinnerWarning(match(860, 640), match(860, 700)), null);
  assert.equal(noWinnerWarning(match(860, 640), match(1020, 640)), null);
});
