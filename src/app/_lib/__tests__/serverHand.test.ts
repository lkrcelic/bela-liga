import assert from "node:assert/strict";
import {test} from "node:test";
import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {normalizeBelaResult} from "@/app/_lib/validation/validateResult";

// What the server does with a hand before saving it: check it and recompute the totals itself

const hand = (overrides: Partial<BelaResultCreateRequest> = {}): BelaResultCreateRequest => ({
  match_id: 1,
  player_pair1_game_points: 92,
  player_pair2_game_points: 70,
  player_pair1_announcement_points: 0,
  player_pair2_announcement_points: 0,
  player_pair1_total_points: 92,
  player_pair2_total_points: 70,
  trump_caller_team: 1,
  pass: true,
  complete_victory: false,
  announcements: [],
  ...overrides,
});

// matched by name: the tests compile to an ES5 target, where instanceof doesn't work for Error subclasses
const InvalidResultError = {name: "InvalidResultError"};

const totals = (h: BelaResultCreateRequest) => [h.player_pair1_total_points, h.player_pair2_total_points, h.pass];

test("a correct hand is kept as it is", () => {
  assert.deepEqual(totals(normalizeBelaResult(hand())), [92, 70, true]);
});

test("totals sent by the client are ignored and recomputed", () => {
  // a tampered client claims 5000 points
  const saved = normalizeBelaResult(hand({player_pair1_total_points: 5000, pass: true}));
  assert.deepEqual(totals(saved), [92, 70, true]);
});

test("a caller who falls is stored as a fall even if the client said it passed", () => {
  const saved = normalizeBelaResult(
    hand({player_pair1_game_points: 70, player_pair2_game_points: 92, player_pair1_total_points: 70, player_pair2_total_points: 92, pass: true})
  );
  assert.deepEqual(totals(saved), [0, 162, false]);
});

test("announcement points must match the announcements sent with them", () => {
  const ok = normalizeBelaResult(
    hand({
      player_pair1_announcement_points: 70,
      announcements: [
        {team: 1, announcement_type: "FIFTY"},
        {team: 1, announcement_type: "TWENTY"},
      ],
    })
  );
  assert.deepEqual(totals(ok), [162, 70, true]);

  assert.throws(
    () => normalizeBelaResult(hand({player_pair1_announcement_points: 100, announcements: [{team: 1, announcement_type: "FIFTY"}]})),
    InvalidResultError
  );
  // points without the announcements behind them
  assert.throws(() => normalizeBelaResult(hand({player_pair2_announcement_points: 20})), InvalidResultError);
});

test("missing announcements are treated as none", () => {
  const saved = normalizeBelaResult(hand({announcements: null}));
  assert.deepEqual(saved.announcements, []);
  assert.deepEqual(totals(saved), [92, 70, true]);
});

test("game points that can't happen are refused", () => {
  const cases: Partial<BelaResultCreateRequest>[] = [
    {player_pair1_game_points: 100, player_pair2_game_points: 100}, // more than 162
    {player_pair1_game_points: 0, player_pair2_game_points: 0}, // nothing entered
    {player_pair1_game_points: -10, player_pair2_game_points: 172}, // negative
    {complete_victory: true}, // Štiglja must be 252 : 0
    {complete_victory: true, player_pair1_game_points: 252, player_pair2_game_points: 10},
  ];
  for (const c of cases) {
    assert.throws(() => normalizeBelaResult(hand(c)), InvalidResultError, JSON.stringify(c));
  }
});

test("Štiglja: the winner takes 252 and every announcement, whoever called", () => {
  const saved = normalizeBelaResult(
    hand({
      complete_victory: true,
      trump_caller_team: 1,
      player_pair1_game_points: 0,
      player_pair2_game_points: 252,
      player_pair1_announcement_points: 20,
      player_pair2_announcement_points: 100,
      announcements: [
        {team: 1, announcement_type: "TWENTY"},
        {team: 2, announcement_type: "ONE_HUNDRED"},
      ],
    })
  );
  assert.deepEqual(totals(saved), [0, 372, true]);
});
