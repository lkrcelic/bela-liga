import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLastOpenRoundByPlayerId} from "@/app/_lib/service/round/getLastOpenByPlayerId";
import {getAuthorizedUser} from "@/app/_lib/auth";
import {getNewestOngoingMatchByRoundId} from "@/app/_lib/service/match/getNewstByRoundId";

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser(request);

  try {
    const round = await getLastOpenRoundByPlayerId(Number(user.id))

    const ongoingMatch = await getNewestOngoingMatchByRoundId(round.id)

    return NextResponse.json({
      roundId: round.id,
      ongoingMatchId: ongoingMatch?.id || null
    }, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: 'No open round found'}, {status: STATUS.NotFound});
  }
}
