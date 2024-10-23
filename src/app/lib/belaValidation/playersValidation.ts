import {prisma} from "../prisma";
import {OngoingMatchCreateRequest} from "../interfaces/match";
import {PlayerPairRequestValidation} from "@/app/lib/interfaces/playerPair";

export async function checkPlayersValid(createRequest: OngoingMatchCreateRequest): Promise<boolean> {
    let playerIds = [
        createRequest.player_pair1.player_id1,
        createRequest.player_pair1.player_id2,
        createRequest.player_pair2.player_id1,
        createRequest.player_pair2.player_id2,
    ];

    const dbPlayers = await prisma.player.findMany({
        where: {id: {in: playerIds}}
    });

    return dbPlayers.length === 4;
}

export async function insertPlayerPair(playerPair: PlayerPairRequestValidation): Promise<number> {
    const existingPair = await prisma.playerPair.findMany({
        where: {
            OR: [{player_id1: playerPair.player_id1, player_id2: playerPair.player_id2},
                {player_id1: playerPair.player_id2, player_id2: playerPair.player_id1}]
        }
    });

    if (existingPair.length != 0) {
        console.log("PlayerPair already exists!");
        return existingPair[0].id;
    }

    const newPair = await prisma.playerPair.create({
        data: {
            player_id1: playerPair.player_id1,
            player_id2: playerPair.player_id2,
        }
    });

    return newPair.id;
}