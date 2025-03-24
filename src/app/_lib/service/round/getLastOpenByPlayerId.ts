import {ExtendedRoundResponseValidation} from "@/app/_interfaces/round";
import {prisma} from "@/app/_lib/prisma";
import {Prisma} from "@prisma/client";

export async function getLastOpenRoundByPlayerId(playerId: number): Promise<typeof ExtendedRoundResponseValidation._type> {
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
    orderBy: {
      round_number: 'asc',
    },
  } as Prisma.RoundFindFirstArgs);

  return ExtendedRoundResponseValidation.parse(dbRound);
}
