import {NextRequest, NextResponse} from "next/server";
import {getAuthorizedUser} from "@/app/lib/auth";
import {STATUS} from "@/app/lib/statusCodes";
import {getLeagueStandings} from "@/app/lib/service/league/getStandings";

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const {id} = params;

  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({message: "You are not authorized for this action."}, {status: STATUS.NotAllowed});
    }

    const teamScores = await getLeagueStandings(Number(id));

    return NextResponse.json(teamScores, {status: STATUS.OK});
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Failed to fetch league standings."}, {status: STATUS.ServerError});
  }
}
