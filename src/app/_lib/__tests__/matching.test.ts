import {test} from "node:test";
import assert from "node:assert/strict";
import {generateMultipleRoundPairings, matchTeams, Team} from "@/app/_lib/matching/multipleRoundMatching";
import {BYE_TEAM_ID} from "@/app/_lib/bye";

const makeTeams = (count: number): Team[] =>
  Array.from({length: count}, (_, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    score: count - i,
    point_difference: 0,
    played_against: [],
  }));

const assertValidRound = (teams: Team[], pairs: ReturnType<typeof matchTeams>) => {
  const ids = pairs.flatMap((p) => [p.teamOne.id, p.teamTwo.id]).filter((id) => id !== BYE_TEAM_ID);
  assert.equal(new Set(ids).size, ids.length, "a team plays twice in one round");
  assert.deepEqual([...ids].sort((a, b) => a - b), teams.map((t) => t.id), "every team plays once");
};

test("single round pairing works for every league size", () => {
  // 24-31 and 40-47 teams used to throw because the window size came out odd
  for (let count = 2; count <= 64; count++) {
    const teams = makeTeams(count);
    assertValidRound(teams, matchTeams(teams));
  }
});

test("odd number of teams gets exactly one bye, placed last", () => {
  const pairs = matchTeams(makeTeams(9));
  const byes = pairs.filter((p) => p.teamOne.id === BYE_TEAM_ID || p.teamTwo.id === BYE_TEAM_ID);
  assert.equal(byes.length, 1);
  assert.equal(pairs[pairs.length - 1], byes[0]);
});

test("multiple rounds don't repeat a matchup", () => {
  const teams = makeTeams(16);
  const rounds = generateMultipleRoundPairings(teams, {windowSize: 8, numberOfRounds: 3});
  assert.equal(rounds.length, 3);
  const seen = new Set<string>();
  for (const round of rounds) {
    assertValidRound(teams, round);
    for (const {teamOne, teamTwo} of round) {
      const key = [teamOne.id, teamTwo.id].sort((a, b) => a - b).join("-");
      assert.ok(!seen.has(key), `rematch ${key}`);
      seen.add(key);
    }
  }
});

test("pairing prefers teams that haven't played each other within a window", () => {
  const teams = makeTeams(4);
  teams[0].played_against = [2];
  teams[1].played_against = [1];
  const [pairs] = generateMultipleRoundPairings(teams, {windowSize: 4, numberOfRounds: 1});
  const rematch = pairs.some((p) => [p.teamOne.id, p.teamTwo.id].sort().join() === "1,2");
  assert.ok(!rematch);
});
