import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { STATUS } from "@/app/lib/statusCodes";
import { MatchResponseValidation } from "@/app/lib/interfaces/match";

export async function GET(request: Request, { params }: { params: { id:string } }) {
    const { id } = params;

    try {
        const dbOngoingMatch = await prisma.ongoingMatch.findUnique({
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
        });
        if (!dbOngoingMatch) {
            return NextResponse.json({ error: "Ongoing match not found." }, { status: STATUS.NotFound });
        }

        const ongoingMatch = MatchResponseValidation.parse(dbOngoingMatch);

        return NextResponse.json(ongoingMatch, { status: STATUS.OK });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ongoing match." }, { status: STATUS.BadRequest });
    }
}
