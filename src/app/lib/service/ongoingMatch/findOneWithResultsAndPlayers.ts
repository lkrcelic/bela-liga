import {prisma} from "@/app/lib/prisma";
import {OngoingMatchResponseValidation} from "@/app/interfaces/match";

export async function findOngoingMatchWithResultsAndPlayers(id: number): Promise<OngoingMatchResponseValidation> {
    const dbOngoingMatch = await prisma.ongoingMatch.findUnique({
        where: {
            id: id,
        },
        include: {
            belaResults: {
                select: {
                    player_pair1_total_points: true,
                    player_pair2_total_points: true,
                },
            },
            playerPair1: {
                include: {
                    player1: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            player_role: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    player2: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            player_role: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
            },
            playerPair2: {
                include: {
                    player1: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            player_role: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    player2: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            player_role: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
            },
        },

    })

    if (!dbOngoingMatch) {
        throw new Error("Ongoing match not found.");
    }

    return dbOngoingMatch;
}