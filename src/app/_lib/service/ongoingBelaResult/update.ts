import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {InvalidResultError, normalizeBelaResult} from "@/app/_lib/validation/validateResult";
import {prisma} from "@/app/_lib/prisma";

type UpdateOngoingBelaResultType = {
    result_id: number,
    resultData: BelaResultCreateRequest,
}

// Replaces a hand and moves the match score by the difference, all in one transaction.
// The match is taken from the stored hand, never from the request body.
export async function updateOngoingBelaResult({result_id, resultData}: UpdateOngoingBelaResultType): Promise<void> {
    const {announcements, ...nonRelationalData} = normalizeBelaResult(resultData);
    delete nonRelationalData.match_id;

    await prisma.$transaction(async (tx) => {
        // Lock the hand so two edits of it at the same time can't both apply their difference to the match score
        const [existingResult] = await tx.$queryRaw<{match_id: number, player_pair1_total_points: number, player_pair2_total_points: number}[]>`
            SELECT match_id, player_pair1_total_points, player_pair2_total_points
            FROM "OngoingBelaResult" WHERE result_id = ${result_id} FOR UPDATE`;
        if (!existingResult) {
            throw new InvalidResultError(`Hand ${result_id} not found.`);
        }

        await tx.ongoingBelaResult.update({
            where: {result_id: result_id},
            data: nonRelationalData,
        });

        await tx.ongoingBelaPlayerAnnouncement.deleteMany({
            where: {result_id: result_id},
        });
        if (announcements && announcements.length > 0) {
            await tx.ongoingBelaPlayerAnnouncement.createMany({
                data: announcements.map(a => ({
                    result_id: result_id,
                    team: a.team,
                    announcement_type: a.announcement_type,
                })),
            });
        }

        await tx.ongoingMatch.update({
            where: {id: existingResult.match_id},
            data: {
                player_pair1_score: {
                    increment: nonRelationalData.player_pair1_total_points - existingResult.player_pair1_total_points,
                },
                player_pair2_score: {
                    increment: nonRelationalData.player_pair2_total_points - existingResult.player_pair2_total_points,
                },
            },
        });
    });
}
