// src/app/api/players/[id]/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/app/lib/prisma";
import {playerOutput} from "@/app/interfaces/player";
import {STATUS} from "@/app/lib/statusCodes";

// Handle GET request to fetch a single player by ID
export async function GET(
    request: Request,
    {params}: { params: { id: string } }
) {
    const {id} = params;

    try {
        const dbPlayer = await prisma.player.findUnique({
            where: {
                id: Number(id), // Assuming player_id is a number
            },
        });

        if (!dbPlayer) {
            return NextResponse.json({error: "Player not found."}, {status: STATUS.NotFound});
        }
        const player = playerOutput.parse(dbPlayer);

        return NextResponse.json(player, {status: STATUS.OK});
    } catch (error) {
        return NextResponse.json(
            {error: "Failed to fetch player."},
            {status: STATUS.ServerError}
        );
    }
}
