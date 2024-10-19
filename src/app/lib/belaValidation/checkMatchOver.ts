import {BelaResultType} from "../interfaces/belaResult";
import {prisma} from "../prisma";
import {runPrismaQuery} from "@/app/lib/helpers/prismaClientHelper";

export async function checkMatchOver(belaResult: BelaResultType): Promise<boolean> {
    const updatedMatch = await runPrismaQuery(
        prisma.ongoingMatch.update({
            where: {id: belaResult.match_id},
            data: {
                player_pair1_score: {
                    increment: belaResult.player_pair1_total_points,
                },
                player_pair2_score: {
                    increment: belaResult.player_pair2_total_points,
                },
            },
            select: {
                player_pair1_score: true,
                player_pair2_score: true,
                score_threshold: true,
            },
        })
    );

    const score_threshold = updatedMatch.score_threshold ?? 1001;
    return updatedMatch.player_pair1_score > score_threshold ||
        updatedMatch.player_pair2_score > score_threshold;
}
