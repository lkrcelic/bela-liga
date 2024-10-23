import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {ExtendedRoundResponseValidation} from "@/app/lib/interfaces/round";

export async function GET(request: Request, {params}: { params: { id: string } }) {
    const {id} = params;

    try {
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

        if (!dbRound) {
            return NextResponse.json({error: "Round not found."}, {status: STATUS.NotFound});
        }

        const round = ExtendedRoundResponseValidation.parse(dbRound);

        return NextResponse.json(round, {status: STATUS.OK});
    } catch (error) {
        console.error('Error fetching round:', error);
        return NextResponse.json({ error: "Failed to fetch round." }, { status: STATUS.BadRequest });
    }
}
