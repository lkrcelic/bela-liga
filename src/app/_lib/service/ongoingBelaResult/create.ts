import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {prisma} from "@/app/_lib/prisma";
import {transformBelaResult} from "@/app/_lib/helpers/databaseHelpers";
import {InvalidResultError, normalizeBelaResult} from "@/app/_lib/validation/validateResult";
import {matchWinner} from "@/app/_lib/bela/scoring";

// Saves a hand and adds it to the match score in one transaction, so the score can't drift from the hands.
// `normalize` checks the hand and recomputes its totals (an admin's manual hand uses its own rule).
export async function createBelaResult(
    resultData: BelaResultCreateRequest,
    normalize: (r: BelaResultCreateRequest) => BelaResultCreateRequest = normalizeBelaResult,
): Promise<void> {
    const result = normalize(resultData);

    await prisma.$transaction(async (tx) => {
        // Lock the match row so two phones saving at the same time are applied one after the other
        const [match] = await tx.$queryRaw<{player_pair1_score: number, player_pair2_score: number, score_threshold: number | null}[]>`
            SELECT player_pair1_score, player_pair2_score, score_threshold
            FROM "OngoingMatch" WHERE id = ${result.match_id} FOR UPDATE`;
        if (!match) {
            throw new InvalidResultError("This match is already finished.");
        }
        if (matchWinner(match.player_pair1_score, match.player_pair2_score, match.score_threshold ?? 1001) !== null) {
            throw new InvalidResultError("This match is already over, finish it instead of adding a hand.");
        }

        await tx.ongoingBelaResult.create({data: transformBelaResult(result)});
        await tx.ongoingMatch.update({
            where: {id: result.match_id},
            data: {
                player_pair1_score: {increment: result.player_pair1_total_points},
                player_pair2_score: {increment: result.player_pair2_total_points},
            },
        });
    });
}
