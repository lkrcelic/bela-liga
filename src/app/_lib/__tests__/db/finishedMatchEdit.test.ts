import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {finishOngoingMatch} from "@/app/_lib/service/match/finishOngoingMatch";
import {deleteHand, updateHand} from "@/app/_lib/service/admin/hands";

// The admin scorepad changing a finished league round against a real Postgres: a change that would leave a match
// without a winner is held back (NoWinnerWarning) and the round, its matches and the standings stay as they were until
// the admin confirms it; a change that keeps the winner recounts the match. Run with `npm run test:db` on a throwaway database (never production).

const tag = `fm${Date.now()}`;
let leagueId = 0;
const teams: number[] = [];

before(async () => {
  const league = await prisma.league.create({data: {league_name: `${tag} liga`}});
  leagueId = league.league_id;
  for (const name of ["A", "B"]) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    teams.push(team.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
  }
});

after(async () => {
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.$disconnect();
});

// plays the round's open match hand by hand (manual hands) and taps Završi meč
async function playMatch(roundId: number, hands: [number, number][]) {
  const match = await prisma.ongoingMatch.findFirst({where: {round_id: roundId}})
    ?? await prisma.ongoingMatch.create({data: {round_id: roundId, score_threshold: 1001}});
  for (const [a, b] of hands) {
    await prisma.ongoingBelaResult.create({
      data: {match_id: match.id, player_pair1_game_points: a, player_pair2_game_points: b, player_pair1_total_points: a, player_pair2_total_points: b, pass: true},
    });
  }
  const sum = (i: 0 | 1) => hands.reduce((s, h) => s + h[i], 0);
  await prisma.ongoingMatch.update({where: {id: match.id}, data: {player_pair1_score: sum(0), player_pair2_score: sum(1)}});
  return finishOngoingMatch(match.id);
}

const state = async (roundId: number) => {
  const round = await prisma.round.findUniqueOrThrow({
    where: {id: roundId},
    include: {matches: {orderBy: {id: "asc"}, include: {belaResults: {orderBy: {result_id: "asc"}}}}},
  });
  const score = await prisma.teamScore.findUniqueOrThrow({where: {team_id_league_id: {team_id: teams[0], league_id: leagueId}}, select: {wins: true, draws: true, score: true}});
  return {round, score};
};

test("deleting the hand that took a 2:0 winner over 1001 asks first, and saves once confirmed", async () => {
  const round = await prisma.round.create({
    data: {team1_id: teams[0], team2_id: teams[1], status: "PUBLISHED", published_at: new Date(), leagueRounds: {create: {league_id: leagueId}}},
  });
  await playMatch(round.id, [[860, 640], [160, 0]]);
  await playMatch(round.id, [[1005, 900]]);
  const before = await state(round.id);
  assert.deepEqual([before.round.team1_wins, before.round.team2_wins, before.round.open], [2, 0, false]);
  assert.deepEqual(before.score, {wins: 1, draws: 0, score: 2});

  const lastHand = before.round.matches[0].belaResults[1];
  await assert.rejects(deleteHand("finished", lastHand.result_id), (e: Error) => e.name === "NoWinnerWarning" && /meč je 860:640 i nitko nema 1001/.test(e.message));
  await assert.rejects(updateHand("finished", lastHand.result_id, {manual: true, points1: 0, points2: 0 + 220}), {name: "NoWinnerWarning"});

  const after = await state(round.id);
  assert.deepEqual([after.round.team1_wins, after.round.team2_wins], [2, 0]);
  assert.deepEqual([after.round.matches[0].player_pair1_score, after.round.matches[0].player_pair2_score], [1020, 640]);
  assert.equal(after.round.matches[0].belaResults.length, 2);
  assert.deepEqual(after.score, {wins: 1, draws: 0, score: 2});

  // a typo fixed that keeps the winner over 1001 is recounted
  await updateHand("finished", lastHand.result_id, {manual: true, points1: 150, points2: 12});
  const fixed = await state(round.id);
  assert.deepEqual([fixed.round.matches[0].player_pair1_score, fixed.round.matches[0].player_pair2_score], [1010, 652]);
  assert.deepEqual([fixed.round.team1_wins, fixed.round.team2_wins], [2, 0]);
  assert.deepEqual(fixed.score, {wins: 1, draws: 0, score: 2});

  // confirmed (Obriši svejedno): the match is left at 860:640 without a winner, the round reads 1:0 and is still a win
  await deleteHand("finished", lastHand.result_id, {allowNoWinner: true});
  const confirmed = await state(round.id);
  assert.deepEqual([confirmed.round.matches[0].player_pair1_score, confirmed.round.matches[0].player_pair2_score], [860, 640]);
  assert.equal(confirmed.round.matches[0].belaResults.length, 1);
  assert.deepEqual([confirmed.round.team1_wins, confirmed.round.team2_wins], [1, 0]);
  assert.deepEqual(confirmed.score, {wins: 1, draws: 0, score: 2});
});
