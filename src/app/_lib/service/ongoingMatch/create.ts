import {prisma} from "@/app/_lib/prisma";
import {checkPlayersValid, insertPlayerPair} from "@/app/_lib/validation/playersValidation";
import {OngoingMatch} from "@prisma/client";
import {CreateOngoingMatchRequest} from "@/app/_interfaces/match";

export async function createOngoingMatch(createRequest: CreateOngoingMatchRequest): Promise<OngoingMatch > {
    const seatingOrderIds = createRequest.seating_order_ids!;

    if (!await checkPlayersValid(seatingOrderIds)) {
        throw new Error( "Valid players for both teams must be provided!");
    }

    const round = await prisma.round.findUnique({
        where: { id: createRequest.round_id },
        include: {
            team1: { include: { teamPlayers: { include: { player: true } } } },
            team2: { include: { teamPlayers: { include: { player: true } } } },
        },
    });
    if (!round) {
        throw new Error("Round not found");
    }

    const team1PlayerIds = round.team1.teamPlayers.map(tp => tp.player.id);
    const team2PlayerIds = round.team2.teamPlayers.map(tp => tp.player.id);

    const team1Seating = seatingOrderIds.filter((id: number) => team1PlayerIds.includes(id));
    const team2Seating = seatingOrderIds.filter((id: number) => team2PlayerIds.includes(id));

    if (team1Seating.length !== 2 || team2Seating.length !== 2) {
        throw new Error("Seating order must contain exactly two players from each team");
    }

    const playerPair1 = { player_id1: team1Seating[0], player_id2: team1Seating[1] };
    const playerPair2 = { player_id1: team2Seating[0], player_id2: team2Seating[1] };
    createRequest.player_pair_id1 = await insertPlayerPair(playerPair1);
    createRequest.player_pair_id2 = await insertPlayerPair(playerPair2);

    const ongoingMatch =  await prisma.ongoingMatch.create({data: createRequest});

    await prisma.round.update({
        where: { id: createRequest.round_id },
        data: { active: true },
    });

    return ongoingMatch;
}