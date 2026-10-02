// src/app/api/teams/[id]/route.ts
import {NextRequest, NextResponse} from "next/server";
import {requireUser} from "@/app/_lib/service/auth/requireUser";
import {prisma} from "@/app/_lib/prisma";
import {STATUS} from "@/app/_lib/statusCodes";
import { TeamExtendedResponseValidation } from "@/app/_interfaces/team";

// Handle GET request to fetch a single team by ID
export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
    const {id} = params;

    try {
        const dbTeam = await prisma.team.findUnique({
            where: {
                team_id: Number(id),
            },
        });

        if (!dbTeam) {
            return NextResponse.json({error: "Team not found."}, {status: STATUS.NotFound});
        }
        const team = TeamExtendedResponseValidation.parse(dbTeam);

        return NextResponse.json(team, {status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: "Failed to fetch team."}, {status: STATUS.BadRequest});
    }
}
