// src/app/api/players/route.ts

import {prisma} from "@/app/lib/prisma";

export async function GET() {
    try {
        const players = await prisma.player.findMany();

        return new Response(JSON.stringify(players), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        return new Response(JSON.stringify({error: "Failed to fetch players"}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
}
