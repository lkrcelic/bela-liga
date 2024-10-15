import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {ExtendedRoundValidation} from "@/app/lib/interfaces/round";

export async function GET(request: Request, {params}: { params: { id: number } }) {
    const {id} = params;

    try {
        // Fetch the round from the database by ID
        const dbRound = await prisma.round.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                team1: {
                    include: {
                        teamPlayers: {
                            include: {
                                player: {
                                    select: {
                                        id: true,
                                        username: true,
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                team2: {
                    include: {
                        teamPlayers: {
                            include: {
                                player: {
                                    select: {
                                        id: true,
                                        username: true,
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Handle case when the round is not found
        if (!dbRound) {
            return NextResponse.json({error: "Round not found."}, {status: STATUS.NotFound});
        }

        // Validate the round using RoundValidation schema
        const round = ExtendedRoundValidation.parse(dbRound);

        console.log(round);

        // Return the round data if validation passes
        return NextResponse.json(round, {status: STATUS.OK});
    } catch (error) {
        // Return a BadRequest status if something goes wrong
        return NextResponse.json({error: "Failed to fetch round."}, {status: STATUS.BadRequest});
    }
}
