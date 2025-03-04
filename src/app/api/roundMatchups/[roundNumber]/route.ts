import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getRoundMatchups} from "@/app/_lib/service/round/getRoundMatchups";

export async function GET(request: NextRequest, {params}: {params: {roundNumber: string}}) {
  try {
    console.log(`API route called with roundNumber: ${params.roundNumber}`);
    
    const roundNumber = parseInt(params.roundNumber);
    console.log(`Parsed roundNumber: ${roundNumber}`);

    const rounds = await getRoundMatchups(roundNumber);
    console.log(`Rounds data retrieved:`, rounds);
    
    if (!rounds) {
      console.log("No rounds data returned");
      return NextResponse.json({error: "There was an error fetching rounds."}, {status: STATUS.ServerError});
    }

    console.log(`Returning ${rounds.length} rounds`);
    return NextResponse.json(rounds, {status: STATUS.OK});
  } catch (error) {
    console.error("Error in roundMatchups API route:", error);
    return NextResponse.json({error: "Failed to fetch rounds."}, {status: STATUS.BadRequest});
  }
}
