import {RoundResponse, RoundResponseValidation} from "@/app/_interfaces/round";
import {prisma} from "@/app/_lib/prisma";
import {Prisma} from "@prisma/client";

export async function getLastOpenRoundByPlayerId(playerId: number): Promise<RoundResponse | null> {
  const dbRound = await prisma.round.findFirst({
    where: {
      open: true,
      OR: [
        {
          team1: {
            teamPlayers: {
              some: {
                player_id: playerId,
              },
            },
          },
        },
        {
          team2: {
            teamPlayers: {
              some: {
                player_id: playerId,
              },
            },
          },
        },
      ],
    },
    // the earliest open round is the one to play next (several can be created at once)
    orderBy: [{round_number: "asc"}, {id: "asc"}],
  } as Prisma.RoundFindFirstArgs);

  if (!dbRound) return null;
  return RoundResponseValidation.parse(dbRound);
}
