import "./helpers/memoryStorage";
import assert from "node:assert/strict";
import {test} from "node:test";
import {TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import {RoundExtendedResponse} from "@/app/_interfaces/round";
import {myTeamIsTeam1} from "@/app/_hooks/useOpenTable";
import {computeHandTotals, matchWinner} from "@/app/_lib/bela/scoring";
import {InvalidResultError, normalizeBelaResult} from "@/app/_lib/validation/validateResult";
import {enterHand, HandPlan} from "./helpers/handEntry";

// The scoreboard end to end without a database: hands are entered through the same store steps as the screens,
// checked and recomputed like the API does (normalizeBelaResult), and added to the match score like
// createBelaResult does, which refuses hands once the match has a winner.

const THRESHOLD = 1001;

class Match {
  scores: [number, number] = [0, 0];
  hands: [number, number][] = [];

  constructor(readonly id = 1) {}

  get winner(): TeamSide | null {
    return matchWinner(this.scores[0], this.scores[1], THRESHOLD);
  }

  play(plan: HandPlan) {
    if (this.winner !== null) throw new InvalidResultError("This match is already over, finish it instead of adding a hand.");
    const sent = enterHand(this.id, plan);
    const saved = normalizeBelaResult(sent);
    // what the phone showed is what the server stores
    assert.deepEqual(
      [sent.player_pair1_total_points, sent.player_pair2_total_points],
      [saved.player_pair1_total_points, saved.player_pair2_total_points],
      `client and server disagree on ${JSON.stringify(plan)}`
    );
    this.scores = [this.scores[0] + saved.player_pair1_total_points, this.scores[1] + saved.player_pair2_total_points];
    this.hands.push([saved.player_pair1_total_points, saved.player_pair2_total_points]);
    return saved;
  }
}

test("a hand with zvanja: caller passes, totals add game and announcement points", () => {
  const m = new Match();
  m.play({caller: 1, typed: "92", announcements: [{team: 1, points: 50}, {team: 2, points: 20}]});
  assert.deepEqual(m.scores, [142, 90]);
});

test("the caller falls: the other team takes 162 and every announcement", () => {
  const m = new Match();
  const saved = m.play({caller: 1, typed: "60", announcements: [{team: 1, points: 20}]});
  assert.equal(saved.pass, false);
  assert.deepEqual(m.scores, [0, 182]);
});

test("points typed for the other team still count for the right side", () => {
  const m = new Match();
  // team 2 called; the scorer types team 1's 52, so team 2 has 110
  m.play({caller: 2, typedFor: 1, typed: "52"});
  assert.deepEqual(m.scores, [52, 110]);
});

test("Štiglja for the team that didn't call", () => {
  const m = new Match();
  m.play({caller: 1, stiglja: 2, announcements: [{team: 1, points: 50}]});
  assert.deepEqual(m.scores, [0, 302]);
});

test("a whole match: the first team over 1001 wins and no more hands are taken", () => {
  const m = new Match();
  const hands: HandPlan[] = [
    {caller: 1, typed: "92", announcements: [{team: 1, points: 50}]}, // 142 : 70
    {caller: 2, typed: "102"}, // 60 : 102
    {caller: 1, typed: "120"}, // 120 : 42
    {caller: 1, typed: "70"}, // fall: 0 : 162
    {caller: 2, stiglja: 1}, // 252 : 0
    {caller: 1, typed: "130", announcements: [{team: 1, points: 100}]}, // 230 : 32
    {caller: 2, typedFor: 1, typed: "80"}, // 80 : 82
  ];
  for (const h of hands) m.play(h);
  assert.deepEqual(m.scores, [884, 490]);
  assert.equal(m.winner, null);

  m.play({caller: 1, typed: "122"}); // 122 : 40
  assert.deepEqual(m.scores, [1006, 530]);
  assert.equal(m.winner, 1);
  assert.throws(() => m.play({caller: 2, typed: "100"}), /already over/);
  assert.equal(m.hands.length, 8);
});

test("both teams over 1001 in the same hand: the higher score wins; a tie plays on", () => {
  assert.equal(matchWinner(1010, 1040, THRESHOLD), 2);
  assert.equal(matchWinner(1020, 1020, THRESHOLD), null);

  const m = new Match();
  m.scores = [990, 995];
  m.play({caller: 2, typed: "81"}); // 81 : 81, team 2 called and falls -> 162 : 0
  assert.deepEqual(m.scores, [1152, 995]);
  assert.equal(m.winner, 1);
});

test("phone and server agree on every possible hand", () => {
  const zvanja: HandPlan["announcements"][] = [[], [{team: 1, points: 20}], [{team: 2, points: 50}], [{team: 1, points: 100}, {team: 2, points: 20}]];
  let checked = 0;
  for (const caller of [1, 2] as TeamSide[]) {
    for (const announcements of zvanja) {
      for (let points = 0; points <= 162; points++) {
        const sent = enterHand(1, {caller, typedFor: 1, typed: String(points), announcements});
        const saved = normalizeBelaResult(sent);
        const expected = computeHandTotals({
          gamePoints1: points,
          gamePoints2: 162 - points,
          announcementPoints1: saved.player_pair1_announcement_points,
          announcementPoints2: saved.player_pair2_announcement_points,
          trumpCaller: caller,
          completeVictory: false,
        });
        assert.deepEqual([sent.player_pair1_total_points, sent.player_pair2_total_points], [expected.totalPoints1, expected.totalPoints2]);
        assert.deepEqual([saved.player_pair1_total_points, saved.player_pair2_total_points], [expected.totalPoints1, expected.totalPoints2]);
        // no hand creates or loses points: 162 (or 252) plus the announcements always goes to someone
        assert.equal(
          saved.player_pair1_total_points + saved.player_pair2_total_points,
          162 + saved.player_pair1_announcement_points + saved.player_pair2_announcement_points
        );
        checked++;
      }
    }
  }
  assert.equal(checked, 2 * 4 * 163);
});

// Which team the scoreboard shows on the left (green): the viewer's own
const round = {
  team1: {team_id: 1, team_name: "Dalmatinci", teamPlayers: [{player: {id: 10}}, {player: {id: 11}}]},
  team2: {team_id: 2, team_name: "Zagorci", teamPlayers: [{player: {id: 20}}, {player: {id: 21}}]},
} as unknown as Pick<RoundExtendedResponse, "team1" | "team2">;

test("the viewer's team is on the left; someone who isn't playing sees team 1 on the left", () => {
  assert.equal(myTeamIsTeam1(round, 11), true);
  assert.equal(myTeamIsTeam1(round, 20), false);
  assert.equal(myTeamIsTeam1(round, 99), true); // e.g. an admin watching
  assert.equal(myTeamIsTeam1(round, null), true);
});
