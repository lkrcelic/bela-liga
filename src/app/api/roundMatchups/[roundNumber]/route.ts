import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {getRoundMatchups} from "@/app/lib/service/round/getRoundMatchups";

export async function GET(request: NextRequest, {params}: {params: {roundNumber: string}}) {
  try {
    // TODO: Decide on who can access this data (admin or everyone)

    const roundNumber = parseInt(params.roundNumber);

    const rounds = await getRoundMatchups(roundNumber);
    if (!rounds) return NextResponse.json({error: "There was an error fetching rounds."}, {status: STATUS.ServerError});

    return NextResponse.json(rounds, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch rounds."}, {status: STATUS.BadRequest});
  }
}
