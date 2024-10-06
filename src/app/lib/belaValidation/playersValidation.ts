import { prisma } from "../prisma";
import { GameIdsType, TeamIdsType } from "../interfaces/match";

export async function checkPlayersValid(players: GameIdsType | undefined) : Promise<boolean> {
    if (!players)
        return false;

    let playerIds = [players.team1Ids.player1Id, players.team2Ids.player2Id,
                     players.team2Ids.player1Id, players.team2Ids.player2Id];
    
    const dbPlayers = await prisma.player.findMany({
        where: { id: { in: playerIds}}
    });
    if (dbPlayers.length !== 4)
        return false;

    return true;
}

export async function insertPlayerPair(players: TeamIdsType | undefined): Promise<number> {
    if (!players)
        return -1;

    const existingPair = await prisma.playerPair.findMany({
        where: { OR: [{player_id1: players.player1Id, player_id2: players.player2Id},
                      {player_id1: players.player2Id, player_id2: players.player1Id}]
        }
    });

    if (existingPair.length === 0){
        const newPair = await prisma.playerPair.create({
            data: {
                player_id1: players.player1Id,
                player_id2: players.player2Id
            }});
        return newPair.id;
    }

    if (existingPair.length === 2)
        console.log("Multiple playerPair entries detected for same pair!");
    
    return existingPair[0].id;
}