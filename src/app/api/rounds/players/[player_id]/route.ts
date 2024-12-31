import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {getActiveRoundByPlayerId} from "@/app/lib/service/round/getActiveByPlayerId";

export async function GET(request: Request, {params}: { params: { player_id: string } }) {
  const {player_id} = params;

  try {
    const round = await getActiveRoundByPlayerId(Number(player_id))

    return NextResponse.json(round, {status: STATUS.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: "Failed to fetch round."}, {status: STATUS.BadRequest});
  }

}
