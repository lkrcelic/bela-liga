import {test} from "node:test";
import assert from "node:assert/strict";
import {updateTeams} from "@/app/_lib/rating/ratingService";

const player = (rating: number, rd = 200) => ({rating, rd, vol: 0.06});

test("winners gain what losers lose between equal teams", () => {
  const {teamA, teamB} = updateTeams([player(1500), player(1500)], [player(1500), player(1500)], 1);
  assert.ok(teamA[0].rating > 1500);
  assert.ok(teamB[0].rating < 1500);
  assert.equal(teamA[0].rating - 1500, 1500 - teamB[0].rating);
});

test("a draw between equal teams changes nothing", () => {
  const {teamA, teamB} = updateTeams([player(1500)], [player(1500)], 0.5);
  assert.equal(teamA[0].rating, 1500);
  assert.equal(teamB[0].rating, 1500);
});

test("each player keeps their own rating deviation", () => {
  const {teamA} = updateTeams([player(1500, 300), player(1500, 120)], [player(1500), player(1500)], 1);
  assert.ok(teamA[0].rd > teamA[1].rd);
  assert.ok(teamA[0].rd < 300);
});

test("teams with substitutes (more than two players) are rated", () => {
  const {teamA, teamB} = updateTeams([player(1600), player(1500), player(1400)], [player(1500), player(1500)], 0);
  assert.equal(teamA.length, 3);
  assert.equal(teamB.length, 2);
  assert.ok(teamA.every((p, i) => p.rating < [1600, 1500, 1400][i]));
});
