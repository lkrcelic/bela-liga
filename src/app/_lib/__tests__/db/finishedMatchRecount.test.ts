import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {finishOngoingMatch} from "@/app/_lib/service/match/finishOngoingMatch";
import {updateHand} from "@/app/_lib/service/admin/hands";

// The admin correcting a hand of a finished match of a closed, rated league table (#46): the standings (TeamScore) are
// recounted from the round's new wins on every change, and the ratings are replayed only when the round's outcome
// changed (a win became a draw or a loss), not for a correction that keeps it. The table is of an earlier night, so a
// match left without a winner never goes back in play here (that part is db/finishedMatchEdit.test.ts). Run with
// `npm run test:db` on a throwaway database (never production).

const tag = `fr${Date.now()}`;
// an earlier league night, after RATINGS_FROM, so the table is rated
const night = new Date("2026-01-15T00:00:00Z");
// a rating no replay gives: a player who still has it after a change wasn't replayed
const UNTOUCHED = 1234;

let leagueId = 0;
const teams: number[] = [];
const players: number[][] = [];

before(async () => {
  const league = await prisma.league.create({data: {league_name: `${tag} liga`}});
  leagueId = league.league_id;
  for (const name of ["A", "B"]) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    teams.push(team.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
    const roster: number[] = [];
    for (const n of [1, 2]) {
      const username = `${tag}${name}${n}`.toLowerCase();
      const player = await prisma.player.create({
        data: {username, email: `${username}@test.invalid`, password_hash: "x", player_role: "PLAYER", first_name: name, last_name: `${n}`},
      });
      await prisma.teamPlayer.create({data: {team_id: team.team_id, player_id: player.id}});
      roster.push(player.id);
    }
    players.push(roster);
  }
});

after(async () => {
  // a round's matches only lose their round_id when it is deleted, so they go first (their hands go with them)
  await prisma.match.deleteMany({where: {round: {leagueRounds: {some: {league_id: leagueId}}}}});
  await prisma.ongoingMatch.deleteMany({where: {round: {leagueRounds: {some: {league_id: leagueId}}}}});
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.player.deleteMany({where: {id: {in: players.flat()}}});
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

const standing = (teamId: number) =>
  prisma.teamScore.findUniqueOrThrow({
    where: {team_id_league_id: {team_id: teamId, league_id: leagueId}},
    select: {rounds_played: true, wins: true, draws: true, losses: true, point_difference: true, score: true},
  });

const ratings = async () => {
  const rows = await prisma.player.findMany({where: {id: {in: players.flat()}}, select: {id: true, rating: true}});
  return players.map((roster) => roster.map((id) => rows.find((r) => r.id === id)!.rating));
};

const markRatings = () => prisma.player.updateMany({where: {id: {in: players.flat()}}, data: {rating: UNTOUCHED}});

let roundId = 0;
let secondMatchHand = 0;

test("a table won 2:0 counts as a win in the standings and in the ratings", async () => {
  const round = await prisma.round.create({
    data: {
      round_number: 1,
      round_date: night,
      team1_id: teams[0],
      team2_id: teams[1],
      status: "PUBLISHED",
      published_at: new Date(),
      leagueRounds: {create: {league_id: leagueId}},
    },
  });
  roundId = round.id;
  await playMatch(roundId, [[860, 640], [160, 0]]);
  await playMatch(roundId, [[1005, 900]]);

  const closed = await prisma.round.findUniqueOrThrow({
    where: {id: roundId},
    include: {matches: {orderBy: {id: "asc"}, include: {belaResults: true}}},
  });
  assert.deepEqual([closed.team1_wins, closed.team2_wins, closed.open], [2, 0, false]);
  secondMatchHand = closed.matches[1].belaResults[0].result_id;

  assert.deepEqual(await standing(teams[0]), {rounds_played: 1, wins: 1, draws: 0, losses: 0, point_difference: 485, score: 2});
  assert.deepEqual(await standing(teams[1]), {rounds_played: 1, wins: 0, draws: 0, losses: 1, point_difference: -485, score: 0});
  const [a, b] = await ratings();
  assert.ok(Math.min(...a) > Math.max(...b), `the winners rate above the losers: ${a} vs ${b}`);
});

test("a corrected hand that keeps the 2:0 recounts the points in the standings but replays no ratings", async () => {
  await markRatings();
  assert.deepEqual(await updateHand("finished", secondMatchHand, {manual: true, points1: 1010, points2: 900}), {reopened: false});

  const round = await prisma.round.findUniqueOrThrow({where: {id: roundId}, include: {matches: {orderBy: {id: "asc"}}}});
  assert.deepEqual([round.matches[1].player_pair1_score, round.matches[1].player_pair2_score], [1010, 900]);
  assert.deepEqual([round.team1_wins, round.team2_wins], [2, 0]);
  assert.deepEqual(await standing(teams[0]), {rounds_played: 1, wins: 1, draws: 0, losses: 0, point_difference: 490, score: 2});
  assert.deepEqual(await standing(teams[1]), {rounds_played: 1, wins: 0, draws: 0, losses: 1, point_difference: -490, score: 0});
  assert.deepEqual(await ratings(), [[UNTOUCHED, UNTOUCHED], [UNTOUCHED, UNTOUCHED]]);
});

test("a corrected hand that moves a match's win to the other team turns 2:0 into 1:1: a draw for both, and the ratings are replayed", async () => {
  await markRatings();
  assert.deepEqual(await updateHand("finished", secondMatchHand, {manual: true, points1: 800, points2: 1100}), {reopened: false});

  const round = await prisma.round.findUniqueOrThrow({where: {id: roundId}, include: {matches: {orderBy: {id: "asc"}}}});
  assert.deepEqual([round.matches[1].player_pair1_score, round.matches[1].player_pair2_score], [800, 1100]);
  assert.deepEqual([round.team1_wins, round.team2_wins, round.open], [1, 1, false]);
  assert.deepEqual(await standing(teams[0]), {rounds_played: 1, wins: 0, draws: 1, losses: 0, point_difference: 80, score: 1});
  assert.deepEqual(await standing(teams[1]), {rounds_played: 1, wins: 0, draws: 1, losses: 0, point_difference: -80, score: 1});

  const after = (await ratings()).flat();
  assert.ok(after.every((r) => r !== UNTOUCHED), `every player of the table is rated again: ${after}`);
  const history = await prisma.playerRatingHistory.findMany({where: {player_id: {in: players.flat()}, night}});
  assert.deepEqual(history.map((h) => h.rounds), [1, 1, 1, 1]);
});
