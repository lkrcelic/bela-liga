import {MatchRequestValidation} from "@/app/lib/interfaces/match";
import {checkPlayersValid, insertPlayerPair} from "@/app/lib/belaValidation/playersValidation";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {prisma} from "@/app/lib/prisma";
import {z} from "zod";

export async function POST(request: Request) {
    try {
        const req_data = await request.json();
        const createRequest = MatchRequestValidation.parse(req_data);
        const seatingOrderIds = createRequest.seating_order_ids!;

        if (!await checkPlayersValid(seatingOrderIds)) {
            return NextResponse.json({error: "Valid players for both teams must be provided!"},
                {status: STATUS.BadRequest});
        }

        const playerPair1 = {player_id1: seatingOrderIds[0], player_id2: seatingOrderIds[2]}
        const playerPair2 = {player_id1: seatingOrderIds[1], player_id2: seatingOrderIds[3]}
        createRequest.player_pair_id1 = await insertPlayerPair(playerPair1);
        createRequest.player_pair_id2 = await insertPlayerPair(playerPair2);

        const ongoingMatch = await prisma.ongoingMatch.create({data: createRequest});

        return NextResponse.json({"match": ongoingMatch}, {status: STATUS.OK});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}