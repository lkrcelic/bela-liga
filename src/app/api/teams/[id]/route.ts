// src/app/api/teams/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { teamOutput } from "@/app/lib/interfaces/team";
import { STATUS } from "@/app/lib/statusCodes";

// Handle GET request to fetch a single team by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const dbTeam = await prisma.team.findUnique({
      where: {
        team_id: Number(id),
      },
    });

    if (!dbTeam) {
      return NextResponse.json({ error: "Team not found." }, { status: STATUS.NotFound });
    }
    const team = teamOutput.parse(dbTeam);

    return NextResponse.json(team, { status: STATUS.OK });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team." }, { status: STATUS.BadRequest });
  }
}
