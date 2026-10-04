import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getRoundMatchups} from "@/app/_lib/service/round/getRoundMatchups";
import {requireUser} from "@/app/_lib/service/auth/requireUser";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";

export async function GET(request: NextRequest, {params}: {params: {roundNumber: string}}) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  try {
    const roundNumber = parseInt(params.roundNumber);
    const leagueId = Number(request.nextUrl.searchParams.get("league_id")) || CURRENT_LEAGUE_ID;
    const rounds = await getRoundMatchups(roundNumber, leagueId);

    if (!rounds) {
      return NextResponse.json({error: "There was an error fetching rounds."}, {status: STATUS.ServerError});
    }

    return NextResponse.json(rounds, {status: STATUS.OK});
  } catch (error) {
    console.error("Error in roundMatchups API route:", error);
    return NextResponse.json({error: "Failed to fetch rounds."}, {status: STATUS.BadRequest});
  }
}
