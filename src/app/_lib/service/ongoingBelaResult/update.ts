import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {belaResultIsValid} from "@/app/_lib/validation/validateResult";
import {prisma} from "@/app/_lib/prisma";

type UpdateOngoingBelaResultType = {
    result_id: number,
    resultData: BelaResultCreateRequest,
}

export async function updateOngoingBelaResult({result_id, resultData}: UpdateOngoingBelaResultType): Promise<void> {
    if (!belaResultIsValid(resultData)) {
        throw new Error("Invalid bela result entry.");
    }

    // TODO: Validate one of the 4 players playing the game is entering the result?
    delete resultData.match_id

    const {announcements, ...nonRelationalData} = resultData;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.ongoingBelaResult.update({
                where: {result_id: result_id},
                data: nonRelationalData,
            });

            await tx.ongoingBelaPlayerAnnouncement.deleteMany({
                where: {
                    result_id: result_id,
                },
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
        });
    } catch (error) {
        console.error(`Failed to update OngoingBelaResult with result_id ${result_id}:`, error);
        throw error;
    }

}