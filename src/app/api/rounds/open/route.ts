import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLastOpenRoundByPlayerId} from "@/app/_lib/service/round/getLastOpenByPlayerId";
import {getNewestOngoingMatchByRoundId} from "@/app/_lib/service/match/getNewstByRoundId";
import {requireUser} from "@/app/_lib/service/auth/requireUser";

// The round the logged-in player should play now, and its running match if one is started (with its score, team1
// first, for the Continue Game card on Home).
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const round = await getLastOpenRoundByPlayerId(auth.user.id);
    if (!round) {
      return NextResponse.json({error: "Trenutno nemaš otvorenu rundu."}, {status: STATUS.NotFound});
    }

    const ongoingMatch = await getNewestOngoingMatchByRoundId(round.id);

    return NextResponse.json({
      roundId: round.id,
      ongoingMatchId: ongoingMatch?.id || null,
      ongoingScore: ongoingMatch ? [ongoingMatch.player_pair1_score ?? 0, ongoingMatch.player_pair2_score ?? 0] : null,
    }, {status: STATUS.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: 'Failed to get open round'}, {status: STATUS.ServerError});
  }
}
