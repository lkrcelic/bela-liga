import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getActiveRoundByPlayerId} from "@/app/_lib/service/round/getActiveByPlayerId";
import {getAuthorizedUser} from "@/app/_lib/auth";
import {getNewestOngoingMatchByRoundId} from "@/app/_lib/service/match/getNewstByRoundId";

export async function GET(request: NextRequest) {

  const user = await getAuthorizedUser(request);

  try {
    const round = await getActiveRoundByPlayerId(Number(user.id))

    const ongoingMatch = await getNewestOngoingMatchByRoundId(round.id)

    return NextResponse.json({roundId: round.id, ongoingMatchId: ongoingMatch?.id}, {status: STATUS.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: "Failed to fetch round."}, {status: STATUS.BadRequest});
  }
  
}
