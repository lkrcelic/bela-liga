import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {OngoingMatchResponseValidation} from "@/app/lib/interfaces/match";
import {PlayerPartialResponseValidation} from "@/app/lib/interfaces/player";
import {runPrismaQuery} from "@/app/lib/apiHelpers/prismaClientHelper";

export async function GET(request: Request, {params}: { params: { id: string } }) {
    const {id} = params;

    try {
        const dbOngoingMatch = await runPrismaQuery(
            prisma.ongoingMatch.findUnique({
                where: {
                    id: Number(id),
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
        );

        if (!dbOngoingMatch) {
            return NextResponse.json({error: "Ongoing match not found."}, {status: STATUS.NotFound});
        }

        const {seating_order_ids} = dbOngoingMatch
        if (!seating_order_ids) {
            throw new Error("Incomplete seating data");
        }

        const dbSeatingOrderPlayers = await prisma.player.findMany({
            where: {
                id: {in: seating_order_ids},
            },
            select: {
                id: true,
                username: true,
                first_name: true,
                last_name: true,
            },
        });

        if (dbSeatingOrderPlayers.length !== seating_order_ids.length) {
            throw new Error("One or more players in seating_order not found");
        }

        const seatingOrder = seating_order_ids.map((id) => {
            const player = dbSeatingOrderPlayers.find((player) => player.id === id);
            return PlayerPartialResponseValidation.parse(player);
        });

        const ongoingMatch = OngoingMatchResponseValidation.parse(dbOngoingMatch);
        ongoingMatch.seating_order = seatingOrder;

        return NextResponse.json(ongoingMatch, {status: STATUS.OK});
    } catch (error) {
        console.log("Error: ", error);
        return NextResponse.json({error: "Failed to fetch ongoing match."}, {status: STATUS.BadRequest});
    }
}
