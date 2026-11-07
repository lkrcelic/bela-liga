import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {getTablePad} from "@/app/_lib/service/admin/hands";
import {expireDueMatches} from "@/app/_lib/service/match/timeLimit";
import {createBelaResult, TIME_UP} from "@/app/_lib/service/ongoingBelaResult/create";

// Vrijeme partije against a real Postgres: a match whose time is up closes at once (no wait after the deadline) with
// the team ahead winning, a player's hand after the time is refused, and a level score plays one more hand. Run with
// `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied (it adds its own league and
// teams and removes them afterwards). Never point it at production.

const tag = `tl${Date.now()}`;
let leagueId = 0;
const teams: number[] = [];

before(async () => {
  const league = await prisma.league.create({data: {league_name: `${tag} liga`, game_minutes: 35}});
  leagueId = league.league_id;
  for (const name of ["A", "B", "C", "D", "E", "F"]) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    teams.push(team.team_id);
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
  }
});

after(async () => {
  await prisma.ongoingMatch.deleteMany({where: {round: {leagueRounds: {some: {league_id: leagueId}}}}});
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: teams}}});
  await prisma.$disconnect();
});

// a published league table whose first match is at this score, with its time up this many seconds ago (negative: still
// running)
async function tableOutOfTime(team1: number, team2: number, score1: number, score2: number, secondsAgo: number) {
  const round = await prisma.round.create({
    data: {team1_id: team1, team2_id: team2, status: "PUBLISHED", published_at: new Date(), leagueRounds: {create: {league_id: leagueId}}},
  });
  const ends = new Date(Date.now() - secondsAgo * 1000);
  const match = await prisma.ongoingMatch.create({
    data: {round_id: round.id, score_threshold: 1001, player_pair1_score: score1, player_pair2_score: score2, started_at: new Date(ends.getTime() - 35 * 60_000), ends_at: ends},
  });
  return {roundId: round.id, matchId: match.id};
}

// a player's hand: the caller's team takes 100, the other 62
function hand(matchId: number, caller: 1 | 2) {
  return {
    match_id: matchId,
    player_pair1_game_points: caller === 1 ? 100 : 62,
    player_pair2_game_points: caller === 1 ? 62 : 100,
    player_pair1_announcement_points: 0,
    player_pair2_announcement_points: 0,
    player_pair1_total_points: caller === 1 ? 100 : 62,
    player_pair2_total_points: caller === 1 ? 62 : 100,
    trump_caller_team: caller,
    pass: false,
    complete_victory: false,
    announcements: [],
  };
}

test("a second after the deadline the match is closed: the team ahead wins, the second match opens", async () => {
  const {roundId, matchId} = await tableOutOfTime(teams[0], teams[1], 709, 627, 1);
  assert.deepEqual(await expireDueMatches({roundIds: [roundId]}), [roundId]);

  assert.equal(await prisma.ongoingMatch.count({where: {id: matchId}}), 0);
  const finished = await prisma.match.findFirstOrThrow({where: {round_id: roundId}});
  assert.deepEqual([finished.player_pair1_score, finished.player_pair2_score, finished.time_expired], [709, 627, true]);
  const round = await prisma.round.findUniqueOrThrow({where: {id: roundId}});
  assert.deepEqual([round.team1_wins, round.team2_wins, round.open], [1, 0, true]);
  const next = await prisma.ongoingMatch.findFirstOrThrow({where: {round_id: roundId}});
  assert.ok(next.ends_at && Math.abs(next.ends_at.getTime() - (Date.now() + 35 * 60_000)) < 60_000);
  // the admin's scorepad shows its winner too, though nobody reached 1001
  assert.deepEqual((await getTablePad(roundId)).matches.map((m) => [m.kind, m.winner]), [["finished", 1], ["ongoing", null]]);
});

test("a match whose time isn't up stays open", async () => {
  const {roundId, matchId} = await tableOutOfTime(teams[2], teams[3], 709, 627, -60);
  assert.deepEqual(await expireDueMatches({roundIds: [roundId]}), []);
  assert.equal(await prisma.ongoingMatch.count({where: {id: matchId}}), 1);
});

test("a player's hand after the deadline is refused and doesn't change the score", async () => {
  const {matchId} = await tableOutOfTime(teams[4], teams[5], 500, 400, 1);
  await assert.rejects(createBelaResult(hand(matchId, 2)), {message: TIME_UP});
  const match = await prisma.ongoingMatch.findUniqueOrThrow({where: {id: matchId}});
  assert.deepEqual([match.player_pair1_score, match.player_pair2_score], [500, 400]);
});

test("a level score after the deadline stays open for one more hand, and that hand ends the match", async () => {
  const {roundId, matchId} = await tableOutOfTime(teams[1], teams[2], 480, 480, 30);
  assert.deepEqual(await expireDueMatches({roundIds: [roundId]}), []);
  assert.deepEqual(await createBelaResult(hand(matchId, 2)), {closed: true});

  assert.equal(await prisma.ongoingMatch.count({where: {id: matchId}}), 0);
  const finished = await prisma.match.findFirstOrThrow({where: {round_id: roundId}});
  assert.deepEqual([finished.player_pair1_score, finished.player_pair2_score, finished.time_expired], [542, 580, true]);
  const round = await prisma.round.findUniqueOrThrow({where: {id: roundId}});
  assert.deepEqual([round.team1_wins, round.team2_wins], [0, 1]);
});
