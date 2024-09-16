// src/app/api/players/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Handle GET request to fetch a single player by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const player = await prisma.player.findUnique({
      where: {
        player_id: Number(id), // Assuming player_id is a number
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
