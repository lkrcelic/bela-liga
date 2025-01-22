import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {getActiveRoundByPlayerId} from "@/app/lib/service/round/getActiveByPlayerId";
import {getAuthorizedUser} from "@/app/lib/auth";
import {getNewestOngoingMatchByRoundId} from "@/app/lib/service/match/getNewstByRoundId";

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
