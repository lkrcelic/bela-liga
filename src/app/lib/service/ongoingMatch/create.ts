import {prisma} from "@/app/lib/prisma";
import {checkPlayersValid, insertPlayerPair} from "@/app/lib/validation/playersValidation";

export async function createOngoingMatch(createRequest: any): Promise<any> {
    const seatingOrderIds = createRequest.seating_order_ids!;

    if (!await checkPlayersValid(seatingOrderIds)) {
        throw new Error( "Valid players for both teams must be provided!");
    }

    const playerPair1 = {player_id1: seatingOrderIds[0], player_id2: seatingOrderIds[2]}
    const playerPair2 = {player_id1: seatingOrderIds[1], player_id2: seatingOrderIds[3]}
    createRequest.player_pair_id1 = await insertPlayerPair(playerPair1);
    createRequest.player_pair_id2 = await insertPlayerPair(playerPair2);

    return prisma.ongoingMatch.create({data: createRequest});
}