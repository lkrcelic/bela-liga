import {LeagueTeamUpdateRequestValidation} from "@/app/_interfaces/league";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {setLeagueTeamActive} from "@/app/_lib/service/league/leagues";
import {STATUS} from "@/app/_lib/statusCodes";
import {NextRequest, NextResponse} from "next/server";

// Mark a team of the league active or inactive (admin)
export async function PATCH(request: NextRequest, {params}: {params: {id: string; teamId: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const {active} = LeagueTeamUpdateRequestValidation.parse(await request.json());
    const updated = await setLeagueTeamActive(Number(params.id), Number(params.teamId), active);
    if (!updated) return NextResponse.json({error: "The team is not in this league."}, {status: STATUS.NotFound});
    return NextResponse.json({league_id: Number(params.id), team_id: Number(params.teamId), active}, {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Failed to update the team.");
  }
}
