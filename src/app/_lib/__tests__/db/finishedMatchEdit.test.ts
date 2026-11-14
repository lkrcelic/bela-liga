import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {finishOngoingMatch} from "@/app/_lib/service/match/finishOngoingMatch";
import {deleteHand, updateHand} from "@/app/_lib/service/admin/hands";
import {leagueNight} from "@/app/_lib/dates";

// The admin scorepad changing a finished league round against a real Postgres: a change that would leave a match
// without a winner is held back (NoWinnerWarning) and the round, its matches and the standings stay as they were until
// the admin confirms it; a change that keeps the winner recounts the match. A match of tonight closed with time left
// that no team has won any more goes back in play at its table, unless something came after it. Run with
// `npm run test:db` on a throwaway database (never production).

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

// A league table of Kolo `number`, published, of tonight (or of another night)
const table = (number: number | null = null, night = leagueNight()) =>
  prisma.round.create({
    data: {round_number: number, round_date: night, team1_id: teams[0], team2_id: teams[1], status: "PUBLISHED", published_at: new Date(), leagueRounds: {create: {league_id: leagueId}}},
  });

// the table's finished matches with their hands, in order
const finished = (roundId: number) => prisma.match.findMany({where: {round_id: roundId}, orderBy: {id: "asc"}, include: {belaResults: {orderBy: {result_id: "asc"}}}});

// the match was closed `minutes` after it started
const playedFor = (matchId: number, minutes: number) =>
  prisma.match.update({where: {id: matchId}, data: {start_time: new Date(Date.now() - minutes * 60_000), end_time: new Date()}});

test("a match closed with time left that no team has won any more goes back in play, with the time it had left", async () => {
  const round = await table(901);
  await playMatch(round.id, [[600, 400], [450, 0]]);
  const [match] = await finished(round.id);
  await playedFor(match.id, 10);

  const outcome = await deleteHand("finished", match.belaResults[1].result_id);
  assert.deepEqual(outcome, {reopened: true});
  const after = await prisma.round.findUniqueOrThrow({where: {id: round.id}, include: {matches: true, ongoingMatches: {include: {belaResults: true}}}});
  assert.equal(after.matches.length, 0);
  assert.deepEqual([after.team1_wins, after.team2_wins, after.open], [0, 0, true]);
  // the empty second match is gone: the first one is played again, with its hand
  assert.equal(after.ongoingMatches.length, 1);
  const ongoing = after.ongoingMatches[0];
  assert.deepEqual([ongoing.player_pair1_score, ongoing.player_pair2_score, ongoing.score_threshold, ongoing.belaResults.length], [600, 400, 1001, 1]);
  // 35 minutes, 10 of them played: about 25 left
  const left = (ongoing.ends_at!.getTime() - Date.now()) / 60_000;
  assert.ok(left > 24 && left <= 25.1, `${left} minutes left`);
});

test("a closed table goes back in play: the standings no longer count it", async () => {
  const round = await table(902);
  const scoreBefore = await prisma.teamScore.findUnique({where: {team_id_league_id: {team_id: teams[0], league_id: leagueId}}, select: {wins: true}});
  await playMatch(round.id, [[1001, 700]]);
  await playMatch(round.id, [[600, 400], [450, 0]]);
  const closed = await prisma.round.findUniqueOrThrow({where: {id: round.id}, include: {matches: {orderBy: {id: "asc"}, include: {belaResults: {orderBy: {result_id: "asc"}}}}}});
  assert.equal(closed.open, false);
  await playedFor(closed.matches[1].id, 5);
  const scoreClosed = await prisma.teamScore.findUniqueOrThrow({where: {team_id_league_id: {team_id: teams[0], league_id: leagueId}}, select: {wins: true}});
  assert.equal(scoreClosed.wins, (scoreBefore?.wins ?? 0) + 1);

  const outcome = await updateHand("finished", closed.matches[1].belaResults[1].result_id, {manual: true, points1: 50, points2: 0});
  assert.deepEqual(outcome, {reopened: true});
  const after = await prisma.round.findUniqueOrThrow({where: {id: round.id}, include: {matches: true, ongoingMatches: true}});
  assert.deepEqual([after.matches.length, after.ongoingMatches.length, after.team1_wins, after.team2_wins, after.open, after.active], [1, 1, 1, 0, true, true]);
  assert.deepEqual([after.ongoingMatches[0].player_pair1_score, after.ongoingMatches[0].player_pair2_score], [650, 400]);
  const scoreAfter = await prisma.teamScore.findUniqueOrThrow({where: {team_id_league_id: {team_id: teams[0], league_id: leagueId}}, select: {wins: true}});
  assert.equal(scoreAfter.wins, scoreBefore?.wins ?? 0);
});

test("a match stays closed without a winner once the next Kolo is made, or the next match has a hand", async () => {
  // the next match already has a hand
  const busy = await table(903);
  await playMatch(busy.id, [[600, 400], [450, 0]]);
  const [m1] = await finished(busy.id);
  await playedFor(m1.id, 10);
  const next = await prisma.ongoingMatch.findFirstOrThrow({where: {round_id: busy.id}});
  await prisma.ongoingBelaResult.create({data: {match_id: next.id, player_pair1_game_points: 100, player_pair2_game_points: 62, player_pair1_total_points: 100, player_pair2_total_points: 62, pass: true}});
  await assert.rejects(deleteHand("finished", m1.belaResults[1].result_id), (e: Error) => e.name === "NoWinnerWarning" && /Za stolom se već igra sljedeći meč/.test(e.message));
  assert.deepEqual(await deleteHand("finished", m1.belaResults[1].result_id, {allowNoWinner: true}), {reopened: false});
  const kept = await prisma.match.findUniqueOrThrow({where: {id: m1.id}});
  assert.deepEqual([kept.player_pair1_score, kept.player_pair2_score], [600, 400]);
  assert.equal(await prisma.ongoingBelaResult.count({where: {match_id: next.id}}), 1);

  // a later Kolo of the league exists (a draft counts)
  const early = await table(904);
  await playMatch(early.id, [[600, 400], [450, 0]]);
  const [m2] = await finished(early.id);
  await playedFor(m2.id, 10);
  await prisma.round.create({data: {round_number: 905, team1_id: teams[0], team2_id: teams[1], status: "DRAFT", draft_order: 1, leagueRounds: {create: {league_id: leagueId}}}});
  await assert.rejects(deleteHand("finished", m2.belaResults[1].result_id), (e: Error) => e.name === "NoWinnerWarning" && /Sljedeće kolo je već složeno/.test(e.message));
});

test("a match of an earlier night, or one with no time left, stays closed for the admin to add its hands", async () => {
  // a table of last week, the league's last Kolo so far
  const old = await table(906, new Date(leagueNight().getTime() - 7 * 86_400_000));
  await playMatch(old.id, [[600, 400], [450, 0]]);
  const [m1] = await finished(old.id);
  await assert.rejects(deleteHand("finished", m1.belaResults[1].result_id), (e: Error) => e.name === "NoWinnerWarning" && /Stol nije od večeras/.test(e.message));

  // tonight's, but its 35 minutes were used up when it was closed
  const late = await table(907);
  await playMatch(late.id, [[600, 400], [450, 0]]);
  const [m2] = await finished(late.id);
  await playedFor(m2.id, 40);
  await assert.rejects(deleteHand("finished", m2.belaResults[1].result_id), (e: Error) => e.name === "NoWinnerWarning" && /Meču je vrijeme već isteklo/.test(e.message));
  assert.equal(await prisma.ongoingBelaResult.count({where: {match: {round_id: late.id}}}), 0);
});

test("a match closed by Vrijeme partije goes to the team with more points, and a level score asks first", async () => {
  const round = await table(null);
  const hand = (a: number, b: number) => ({player_pair1_game_points: a, player_pair2_game_points: b, player_pair1_total_points: a, player_pair2_total_points: b, pass: true});
  const match = await prisma.match.create({
    data: {
      round_id: round.id,
      player_pair1_score: 500,
      player_pair2_score: 400,
      score_threshold: 1001,
      time_expired: true,
      belaResults: {create: [hand(400, 300), hand(100, 100)]},
    },
    include: {belaResults: {orderBy: {result_id: "asc"}}},
  });
  await prisma.round.update({where: {id: round.id}, data: {team1_wins: 1}});

  // the other team now has more points: the win moves, no question and no reopening
  assert.deepEqual(await updateHand("finished", match.belaResults[1].result_id, {manual: true, points1: 0, points2: 200}), {reopened: false});
  let after = await prisma.match.findUniqueOrThrow({where: {id: match.id}, include: {round: true}});
  assert.deepEqual([after.player_pair1_score, after.player_pair2_score, after.round!.team1_wins, after.round!.team2_wins], [400, 500, 0, 1]);

  // level: asked first, then left without a winner
  await assert.rejects(updateHand("finished", match.belaResults[1].result_id, {manual: true, points1: 50, points2: 150}), {name: "NoWinnerWarning"});
  await updateHand("finished", match.belaResults[1].result_id, {manual: true, points1: 50, points2: 150}, {allowNoWinner: true});
  after = await prisma.match.findUniqueOrThrow({where: {id: match.id}, include: {round: true}});
  assert.deepEqual([after.player_pair1_score, after.player_pair2_score, after.round!.team1_wins, after.round!.team2_wins], [450, 450, 0, 0]);
  assert.equal(await prisma.ongoingMatch.count({where: {round_id: round.id}}), 0);
});
