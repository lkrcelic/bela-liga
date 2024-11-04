import {BelaResultRequest} from "@/app/interfaces/belaResult";
import {prisma} from "../../prisma";

export async function updateMatch(belaResult: BelaResultRequest): Promise<void> {
    await prisma.ongoingMatch.update({
        where: {id: belaResult.match_id},
        data: {
            player_pair1_score: {
                increment: belaResult.player_pair1_total_points,
            },
            player_pair2_score: {
                increment: belaResult.player_pair2_total_points,
            }
        },
        select: {
            player_pair1_score: true,
            player_pair2_score: true,
            score_threshold: true,
        },
    })
}
