import {ExtendedRoundResponseValidation} from "@/app/_interfaces/round";
import {prisma} from "@/app/_lib/prisma";
import {Prisma} from "@prisma/client";

export async function getActiveRoundByPlayerId(playerId: number): Promise<ExtendedRoundResponseValidation> {
  const dbRound = await prisma.round.findFirst({
    where: {
      active: true,
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
    include: {
      team1: {
        include: {
          teamPlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      },
      team2: {
        include: {
          teamPlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      },
        ongoingMatches: {
          orderBy: {
            start_time: 'asc',
          },
          select: {
            id: true,
            start_time: true
          }
        }
    },
  } as Prisma.RoundFindUniqueArgs);

  if (!dbRound) {
    throw new Error("Round not found.");
  }

  return ExtendedRoundResponseValidation.parse(dbRound);
}
