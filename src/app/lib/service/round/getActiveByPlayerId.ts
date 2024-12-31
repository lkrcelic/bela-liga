import { ExtendedRoundResponseValidation } from "@/app/interfaces/round";
import { prisma } from "@/app/lib/prisma";

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
    },
  });

  if (!dbRound) {
    throw new Error("Round not found.");
  }

  return ExtendedRoundResponseValidation.parse(dbRound);
}
