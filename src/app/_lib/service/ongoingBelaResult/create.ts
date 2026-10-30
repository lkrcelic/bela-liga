import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {prisma} from "@/app/_lib/prisma";
import {transformBelaResult} from "@/app/_lib/helpers/databaseHelpers";
import {declarationsError, InvalidResultError, normalizeBelaResult} from "@/app/_lib/validation/validateResult";
import {matchWinner} from "@/app/_lib/bela/scoring";
import {closesAfterHand, handTiming} from "@/app/_lib/gameTime";
import {closeByTime} from "@/app/_lib/service/match/timeLimit";

export const TIME_UP = "Vrijeme partije je isteklo. Partija se zatvara s upisanim rezultatom.";

// Saves a hand and adds it to the match score in one transaction, so the score can't drift from the hands.
// `normalize` checks the hand and recomputes its totals (an admin's manual hand uses its own rule).
// Vrijeme partije: after the deadline a player's hand is taken only when its entry started in time (and it comes within
// the grace) or the score is level (one more hand); the match is then closed by time unless the score is still level.
// An admin's hands don't depend on the time. Answers whether the hand closed the match.
export async function createBelaResult(
    resultData: BelaResultCreateRequest,
    normalize: (r: BelaResultCreateRequest) => BelaResultCreateRequest = normalizeBelaResult,
    {admin = false, entryStartedAt = null}: {admin?: boolean; entryStartedAt?: Date | null} = {},
): Promise<{closed: boolean}> {
    const result = normalize(resultData);

    const closeNow = await prisma.$transaction(async (tx) => {
        // Lock the match row so two phones saving at the same time are applied one after the other
        const [match] = await tx.$queryRaw<{player_pair1_score: number, player_pair2_score: number, score_threshold: number | null, declarations: boolean | null, ends_at: Date | null}[]>`
            SELECT om.player_pair1_score, om.player_pair2_score, om.score_threshold, r.declarations, om.ends_at
            FROM "OngoingMatch" om LEFT JOIN "Round" r ON r.id = om.round_id
            WHERE om.id = ${result.match_id} FOR UPDATE OF om`;
        if (!match) {
            throw new InvalidResultError("Ovaj meč je već završen.");
        }
        if (matchWinner(match.player_pair1_score, match.player_pair2_score, match.score_threshold ?? 1001) !== null) {
            throw new InvalidResultError("Meč je gotov – završi ga umjesto da dodaješ igru.");
        }
        const zvanja = declarationsError(match.declarations ?? true, result.announcements);
        if (zvanja) throw new InvalidResultError(zvanja);

        const timing = admin
            ? "on_time"
            : handTiming({now: new Date(), endsAt: match.ends_at, tied: match.player_pair1_score === match.player_pair2_score, entryStartedAt});
        if (timing === "too_late") throw new InvalidResultError(TIME_UP);

        await tx.ongoingBelaResult.create({data: transformBelaResult(result)});
        await tx.ongoingMatch.update({
            where: {id: result.match_id},
            data: {
                player_pair1_score: {increment: result.player_pair1_total_points},
                player_pair2_score: {increment: result.player_pair2_total_points},
            },
        });
        const tied = match.player_pair1_score + result.player_pair1_total_points === match.player_pair2_score + result.player_pair2_total_points;
        return closesAfterHand(timing, tied);
    });

    // the hand after the time: the match ends with it (the next match or the table's result follows, as after Završi meč)
    if (closeNow) await closeByTime(result.match_id);
    return {closed: closeNow};
}
