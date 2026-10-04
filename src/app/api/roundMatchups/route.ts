import {NextRequest, NextResponse} from "next/server";
import {requireUser} from "@/app/_lib/service/auth/requireUser";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {STATUS} from "@/app/_lib/statusCodes";
import {getCurrentRoundMatchups} from "@/app/_lib/service/round/getRoundMatchups";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  try {
    const leagueId = Number(request.nextUrl.searchParams.get("league_id")) || CURRENT_LEAGUE_ID;
    const rounds = await getCurrentRoundMatchups(leagueId);
    if (!rounds) return NextResponse.json({error: "There was an error fetching rounds."}, {status: STATUS.ServerError});

    return NextResponse.json(rounds, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch rounds."}, {status: STATUS.BadRequest});
  }
}
