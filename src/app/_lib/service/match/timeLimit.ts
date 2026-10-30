import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {closesByTime, GAME_MINUTES_DEFAULT, LATE_HAND_GRACE_MS, matchDeadline} from "@/app/_lib/gameTime";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {finishOngoingMatch, MatchAlreadyFinishedError} from "@/app/_lib/service/match/finishOngoingMatch";
import {afterTableClosed} from "@/app/_lib/service/tournament/kola";

// Vrijeme partije on the server: a match gets its deadline when it starts, and a match whose time (and the grace for a
// hand being entered) is over is closed with the score entered then, by whichever request comes first (the scorepads
// ask every 15 seconds; the tournament's pages and the admin's do too, and so does /api/cron/tick once a scheduler
// calls it). Matches started before the limit came in have no deadline.

type Db = Prisma.TransactionClient | typeof prisma;

// A table's time limit: its tournament's or its league's Vrijeme partije
export async function gameMinutesOf(db: Db, roundId: number): Promise<number> {
  const round = await db.round.findUnique({
    where: {id: roundId},
    select: {
      tournamentRounds: {select: {tournament: {select: {game_minutes: true}}}, take: 1},
      leagueRounds: {select: {league: {select: {game_minutes: true}}}, take: 1},
    },
  });
  return round?.tournamentRounds[0]?.tournament.game_minutes ?? round?.leagueRounds[0]?.league.game_minutes ?? GAME_MINUTES_DEFAULT;
}

// started_at and ends_at of a match of this table starting now
export async function matchClock(db: Db, roundId: number, now = new Date()): Promise<{started_at: Date; ends_at: Date}> {
  return {started_at: now, ends_at: matchDeadline(now, await gameMinutesOf(db, roundId))};
}

// Closes a match by time (the team with more points wins) and moves its table on as Završi meč does. Quiet when another
// request closed it first or the score is level.
export async function closeByTime(ongoingMatchId: number): Promise<boolean> {
  try {
    const outcome = await finishOngoingMatch(ongoingMatchId, {byTime: true});
    if (outcome.roundFinished) await afterTableClosed(outcome.roundId);
    return true;
  } catch (error) {
    if (error instanceof MatchAlreadyFinishedError || error instanceof InvalidResultError) return false;
    throw error;
  }
}

// Closes every match whose time and grace are over (of these tables, or all), unless its score is level (one more
// hand is played then). Answers with the tables whose match was closed.
export async function expireDueMatches({roundIds, matchId}: {roundIds?: number[]; matchId?: number} = {}): Promise<number[]> {
  const now = new Date();
  const due = await prisma.ongoingMatch.findMany({
    where: {
      ends_at: {lt: new Date(now.getTime() - LATE_HAND_GRACE_MS)},
      ...(roundIds && {round_id: {in: roundIds}}),
      ...(matchId != null && {id: matchId}),
    },
    select: {id: true, round_id: true, ends_at: true, player_pair1_score: true, player_pair2_score: true},
  });
  const closed: number[] = [];
  for (const m of due) {
    if (!closesByTime({now, endsAt: m.ends_at, tied: m.player_pair1_score === m.player_pair2_score})) continue;
    if ((await closeByTime(m.id)) && m.round_id != null) closed.push(m.round_id);
  }
  return closed;
}
