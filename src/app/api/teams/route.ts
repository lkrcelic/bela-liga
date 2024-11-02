// src/app/api/teams/route.ts

import {prisma} from "@/app/lib/prisma";
import {TeamRequestValidation, TeamResponseValidation, TeamsResponseValidation} from "@/app/interfaces/team";
import {z} from "zod";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";

export async function GET() {
  try {
    const dbTeams = await prisma.team.findMany({
      include: {
        teamPlayers: {
          include: {player: true},
        },
      },
    });
    const teams = TeamsResponseValidation.parse(dbTeams);

    return NextResponse.json(teams, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch teams."}, {status: STATUS.ServerError});
  }
}

export async function POST(request: Request) {
  try {
    const req_data = await request.json();

    const teamVal = TeamRequestValidation.parse(req_data);
    const createdTeam = await prisma.team.create({data: teamVal});
    const team = TeamResponseValidation.parse(createdTeam);

    return NextResponse.json(team, {status: STATUS.OK});
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
    }
    return NextResponse.json({error: error}, {status: STATUS.ServerError});
  }
}
