import {prisma} from "@/app/_lib/prisma";
import {BelaMatchAllIncluded, transformBelaMatch} from "@/app/_lib/helpers/databaseHelpers";
import {matchWinner} from "@/app/_lib/bela/scoring";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {closeRound, lockRound} from "@/app/_lib/service/round/finish";
import {combineDateAndTime} from "@/app/_lib/dates";
import {timeWinner} from "@/app/_lib/gameTime";
import {matchClock} from "@/app/_lib/service/match/timeLimit";

export class MatchAlreadyFinishedError extends Error {
  constructor() {
    super("Ovaj meč je već završen.");
    this.name = "MatchAlreadyFinishedError";
  }
}

export type FinishMatchOutcome = {
  roundId: number | null;
  roundFinished: boolean;
  nextOngoingMatchId: number | null;
};

// Stores a finished match and moves the round on: starts the next match, or closes the round and updates the
// standings and ratings once its matches are played (both in a league; a tournament's table may play one). Everything
// happens in one transaction holding a lock on the
// match, so when two phones tap "Završi meč" at the same time only the first one counts.
// byTime: Vrijeme partije is up, so the team with more points wins whatever the score (refused while it is level or
// before the deadline).
export async function finishOngoingMatch(ongoingMatchId: number, {byTime = false}: {byTime?: boolean} = {}): Promise<FinishMatchOutcome> {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<{id: number}[]>`
        SELECT id FROM "OngoingMatch" WHERE id = ${ongoingMatchId} FOR UPDATE`;
    if (!locked) {
      throw new MatchAlreadyFinishedError();
    }

    const ongoingMatch = await tx.ongoingMatch.findUniqueOrThrow({
      where: {id: ongoingMatchId},
      include: {belaResults: {include: {belaPlayerAnnouncements: true}, orderBy: {result_id: "asc"}}},
    });

    const threshold = ongoingMatch.score_threshold ?? 1001;
    const reached = matchWinner(ongoingMatch.player_pair1_score, ongoingMatch.player_pair2_score, threshold);
    let winner = reached;
    if (byTime) {
      if (!ongoingMatch.ends_at || ongoingMatch.ends_at.getTime() > Date.now()) throw new InvalidResultError("Vrijeme partije još nije isteklo.");
      winner = timeWinner(ongoingMatch.player_pair1_score, ongoingMatch.player_pair2_score);
      if (winner === null) throw new InvalidResultError("Rezultat je izjednačen: igra se još jedno miješanje.");
    }
    if (winner === null) {
      throw new InvalidResultError(`Nijedna ekipa još nije došla do ${threshold}.`);
    }

    await tx.match.create({
      data: {
        ...transformBelaMatch(ongoingMatch as BelaMatchAllIncluded),
        // the ongoing match stores only the time of day; the finished match keeps a full timestamp
        start_time: ongoingMatch.started_at ?? combineDateAndTime(ongoingMatch.match_date, ongoingMatch.start_time),
        end_time: new Date(),
        // the time decided it (nobody had reached 1001)
        time_expired: byTime && reached === null,
      },
    });
    await tx.ongoingMatch.delete({where: {id: ongoingMatchId}});

    const roundId = ongoingMatch.round_id;
    if (roundId == null) {
      return {roundId: null, roundFinished: false, nextOngoingMatchId: null};
    }

    const round = await lockRound(tx, roundId);
    await tx.round.update({
      where: {id: roundId},
      data: winner === 1 ? {team1_wins: {increment: 1}} : {team2_wins: {increment: 1}},
    });

    const playedMatches = await tx.match.count({where: {round_id: roundId}});
    if (playedMatches >= round.matches_per_round) {
      await closeRound(tx, roundId);
      return {roundId, roundFinished: true, nextOngoingMatchId: null};
    }

    const now = new Date();
    // the second match's time counts from when it opens
    const nextMatch = await tx.ongoingMatch.create({
      data: {round_id: roundId, score_threshold: threshold, match_date: now, start_time: now, ...(await matchClock(tx, roundId, now))},
    });
    return {roundId, roundFinished: false, nextOngoingMatchId: nextMatch.id};
  }, {timeout: 20000});
}
