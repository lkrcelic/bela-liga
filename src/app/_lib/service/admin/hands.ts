import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {AdminHand, HandKind, PadHand, PadMatch, TablePad} from "@/app/_interfaces/adminHand";
import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {isByeTeam} from "@/app/_lib/bye";
import {matchWinner} from "@/app/_lib/bela/scoring";
import {InvalidResultError, normalizeBelaResult} from "@/app/_lib/validation/validateResult";
import {transformBelaResult} from "@/app/_lib/helpers/databaseHelpers";
import {createBelaResult} from "@/app/_lib/service/ongoingBelaResult/create";
import {updateOngoingBelaResult} from "@/app/_lib/service/ongoingBelaResult/update";
import {createOngoingMatch} from "@/app/_lib/service/ongoingMatch/create";
import {finishOngoingMatch, FinishMatchOutcome} from "@/app/_lib/service/match/finishOngoingMatch";
import {lockRound} from "@/app/_lib/service/round/finish";
import {isRatedRound, recalcTeamScores, replayRatings} from "./recalc";
import {NotFoundError} from "./tables";

// The admin scorepad of a Daily table: every hand of the match being played and of the finished matches can be
// added, changed or deleted. Changing a finished match recounts its score, the round's wins, the standings and,
// when the round's outcome changed, the ratings.

type Tx = Prisma.TransactionClient;
const DEFAULT_THRESHOLD = 1001;

// A hand as the server stores it. A manual hand keeps its points as game points and totals, without a caller.
export function adminHandToResult(hand: AdminHand, matchId: number): BelaResultCreateRequest {
  if (hand.manual) {
    if (hand.points1 === 0 && hand.points2 === 0) throw new InvalidResultError("Enter points for at least one team.");
    return {
      match_id: matchId,
      player_pair1_game_points: hand.points1,
      player_pair2_game_points: hand.points2,
      player_pair1_announcement_points: 0,
      player_pair2_announcement_points: 0,
      player_pair1_total_points: hand.points1,
      player_pair2_total_points: hand.points2,
      trump_caller_team: null as unknown as 1,
      pass: true,
      complete_victory: false,
      announcements: [],
    };
  }
  const {manual: _manual, ...rest} = hand;
  void _manual;
  return normalizeBelaResult({...rest, match_id: matchId});
}

type StoredHand = {
  result_id: number;
  player_pair1_total_points: number;
  player_pair2_total_points: number;
  player_pair1_game_points: number;
  player_pair2_game_points: number;
  trump_caller_team: number | null;
  complete_victory: boolean;
  belaPlayerAnnouncements: {team: number; announcement_type: string}[];
};

const handInclude = {belaPlayerAnnouncements: {select: {team: true, announcement_type: true}}} as const;

function toPadHand(h: StoredHand): PadHand {
  return {
    id: h.result_id,
    total1: h.player_pair1_total_points,
    total2: h.player_pair2_total_points,
    game1: h.player_pair1_game_points,
    game2: h.player_pair2_game_points,
    caller: h.trump_caller_team === 1 || h.trump_caller_team === 2 ? h.trump_caller_team : null,
    completeVictory: h.complete_victory,
    manual: h.trump_caller_team == null,
    announcements: h.belaPlayerAnnouncements.map((a) => ({team: a.team as 1 | 2, type: a.announcement_type})),
  };
}

export async function getTablePad(roundId: number): Promise<TablePad> {
  const round = await prisma.round.findUnique({
    where: {id: roundId},
    include: {
      team1: {select: {team_id: true, team_name: true}},
      team2: {select: {team_id: true, team_name: true}},
      leagueRounds: {select: {league_id: true}},
      matches: {orderBy: {id: "asc"}, include: {belaResults: {orderBy: {result_id: "asc"}, include: handInclude}}},
      ongoingMatches: {orderBy: {id: "desc"}, take: 1, include: {belaResults: {orderBy: {result_id: "asc"}, include: handInclude}}},
      _count: {select: {roundPlayers: true}},
    },
  });
  if (!round) throw new NotFoundError("Table not found.");

  const matches: PadMatch[] = round.matches.map((m, i) => {
    const threshold = m.score_threshold ?? DEFAULT_THRESHOLD;
    return {
      kind: "finished",
      id: m.id,
      number: i + 1,
      score1: m.player_pair1_score,
      score2: m.player_pair2_score,
      threshold,
      winner: matchWinner(m.player_pair1_score, m.player_pair2_score, threshold),
      hands: m.belaResults.map(toPadHand),
    };
  });
  const ongoing = round.ongoingMatches[0];
  if (ongoing) {
    const threshold = ongoing.score_threshold ?? DEFAULT_THRESHOLD;
    matches.push({
      kind: "ongoing",
      id: ongoing.id,
      number: matches.length + 1,
      score1: ongoing.player_pair1_score,
      score2: ongoing.player_pair2_score,
      threshold,
      winner: matchWinner(ongoing.player_pair1_score, ongoing.player_pair2_score, threshold),
      hands: ongoing.belaResults.map(toPadHand),
    });
  }

  return {
    roundId: round.id,
    leagueId: round.leagueRounds[0]?.league_id ?? 0,
    roundNumber: round.round_number,
    date: round.round_date ? round.round_date.toISOString().slice(0, 10) : null,
    table: round.table_number,
    team1: {id: round.team1.team_id, name: round.team1.team_name},
    team2: {id: round.team2.team_id, name: round.team2.team_name},
    done: !round.open,
    bye: isByeTeam(round.team1_id) || isByeTeam(round.team2_id),
    hasLineup: round._count.roundPlayers > 0,
    matches,
  };
}

async function assertEditableTable(roundId: number) {
  const round = await prisma.round.findUnique({where: {id: roundId}, select: {team1_id: true, team2_id: true}});
  if (!round) throw new NotFoundError("Table not found.");
  if (isByeTeam(round.team1_id) || isByeTeam(round.team2_id)) throw new InvalidResultError("A bye table has no hands to edit.");
}

// After a finished match's hands changed: its score, the round's wins, and for a finished round the standings
// (and the ratings when the round's outcome changed)
async function recountFinishedMatch(tx: Tx, matchId: number) {
  const sums = await tx.belaResult.aggregate({
    where: {match_id: matchId},
    _sum: {player_pair1_total_points: true, player_pair2_total_points: true},
  });
  const match = await tx.match.update({
    where: {id: matchId},
    data: {
      player_pair1_score: sums._sum.player_pair1_total_points ?? 0,
      player_pair2_score: sums._sum.player_pair2_total_points ?? 0,
    },
    select: {round_id: true},
  });
  if (match.round_id == null) return;

  const round = await tx.round.findUniqueOrThrow({
    where: {id: match.round_id},
    select: {
      id: true,
      open: true,
      team1_id: true,
      team2_id: true,
      team1_wins: true,
      team2_wins: true,
      leagueRounds: {select: {league_id: true}},
      matches: {select: {player_pair1_score: true, player_pair2_score: true, score_threshold: true}},
    },
  });
  // a match without a winner (nobody over the threshold after an edit) counts for neither team
  const winners = round.matches.map((m) => matchWinner(m.player_pair1_score, m.player_pair2_score, m.score_threshold ?? DEFAULT_THRESHOLD));
  const team1Wins = winners.filter((w) => w === 1).length;
  const team2Wins = winners.filter((w) => w === 2).length;
  await tx.round.update({where: {id: round.id}, data: {team1_wins: team1Wins, team2_wins: team2Wins}});

  if (round.open) return;
  for (const {league_id} of round.leagueRounds) {
    await recalcTeamScores(tx, league_id, [round.team1_id, round.team2_id]);
  }
  const outcome = (a: number, b: number) => Math.sign(a - b);
  if (isRatedRound(round) && outcome(round.team1_wins, round.team2_wins) !== outcome(team1Wins, team2Wins)) {
    await replayRatings(tx);
  }
}

// Runs a change of a finished match's hands with the round locked, then recounts
async function changeFinishedMatch(matchId: number, change: (tx: Tx) => Promise<void>) {
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({where: {id: matchId}, select: {round_id: true}});
    if (!match) throw new NotFoundError("Match not found.");
    if (match.round_id != null) await lockRound(tx, match.round_id);
    await change(tx);
    await recountFinishedMatch(tx, matchId);
  }, {timeout: 60000});
}

export type HandTarget = {kind: "ongoing"} | {kind: "finished"; matchId: number};

export async function addHand(roundId: number, target: HandTarget, hand: AdminHand): Promise<void> {
  await assertEditableTable(roundId);
  if (target.kind === "ongoing") {
    // a table that hasn't started gets its first match here (refused when the round is over)
    const ongoing =
      (await prisma.ongoingMatch.findFirst({where: {round_id: roundId}, orderBy: {id: "desc"}, select: {id: true}})) ??
      (await createOngoingMatch({round_id: roundId, score_threshold: DEFAULT_THRESHOLD}));
    const result = adminHandToResult(hand, ongoing.id);
    await createBelaResult(result, (r) => r);
    return;
  }

  const match = await prisma.match.findUnique({where: {id: target.matchId}, select: {round_id: true}});
  if (!match || match.round_id !== roundId) throw new NotFoundError("Match not found at this table.");
  const result = adminHandToResult(hand, target.matchId);
  await changeFinishedMatch(target.matchId, async (tx) => {
    await tx.belaResult.create({data: transformBelaResult(result)});
  });
}

export async function updateHand(kind: HandKind, resultId: number, hand: AdminHand): Promise<void> {
  if (kind === "ongoing") {
    const stored = await prisma.ongoingBelaResult.findUnique({where: {result_id: resultId}, select: {match_id: true}});
    if (!stored) throw new NotFoundError("Hand not found.");
    const result = adminHandToResult(hand, stored.match_id);
    await updateOngoingBelaResult({result_id: resultId, resultData: result, normalize: (r) => r});
    return;
  }

  const stored = await prisma.belaResult.findUnique({where: {result_id: resultId}, select: {match_id: true}});
  if (!stored) throw new NotFoundError("Hand not found.");
  const {announcements, match_id: _matchId, ...data} = adminHandToResult(hand, stored.match_id);
  void _matchId;
  await changeFinishedMatch(stored.match_id, async (tx) => {
    await tx.belaResult.update({where: {result_id: resultId}, data});
    await tx.belaPlayerAnnouncement.deleteMany({where: {result_id: resultId}});
    if (announcements?.length) {
      await tx.belaPlayerAnnouncement.createMany({
        data: announcements.map((a) => ({result_id: resultId, team: a.team, announcement_type: a.announcement_type})),
      });
    }
  });
}

export async function deleteHand(kind: HandKind, resultId: number): Promise<void> {
  if (kind === "ongoing") {
    await prisma.$transaction(async (tx) => {
      const [hand] = await tx.$queryRaw<{match_id: number; player_pair1_total_points: number; player_pair2_total_points: number}[]>`
          SELECT match_id, player_pair1_total_points, player_pair2_total_points
          FROM "OngoingBelaResult" WHERE result_id = ${resultId} FOR UPDATE`;
      if (!hand) throw new NotFoundError("Hand not found.");
      // the match row is locked by the update, so a hand saved at the same moment is applied before or after this
      await tx.ongoingMatch.update({
        where: {id: hand.match_id},
        data: {
          player_pair1_score: {decrement: hand.player_pair1_total_points},
          player_pair2_score: {decrement: hand.player_pair2_total_points},
        },
      });
      await tx.ongoingBelaResult.delete({where: {result_id: resultId}});
    });
    return;
  }

  const stored = await prisma.belaResult.findUnique({where: {result_id: resultId}, select: {match_id: true}});
  if (!stored) throw new NotFoundError("Hand not found.");
  await changeFinishedMatch(stored.match_id, async (tx) => {
    await tx.belaResult.delete({where: {result_id: resultId}});
  });
}

// Finishes the table's match in progress (as "Završi meč" on the scoreboard)
export async function finishTableMatch(roundId: number): Promise<FinishMatchOutcome> {
  const ongoing = await prisma.ongoingMatch.findFirst({where: {round_id: roundId}, orderBy: {id: "desc"}, select: {id: true}});
  if (!ongoing) throw new NotFoundError("No match is being played at this table.");
  return finishOngoingMatch(ongoing.id);
}
