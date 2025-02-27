import {prisma} from "@/app/_lib/prisma";
import {TeamScore} from "@prisma/client";

export async function getLeagueDailyStandings(league_id: number): Promise<TeamScore> {
  const standings = await prisma.teamScore.findMany({
    include: {
      team: {
        select: {
          team_name: true,
        },
      },
    },
    where: {
      league_id: league_id,
    },
    orderBy: [
      {score: 'desc'},
      {point_difference: 'desc'},
    ],
  });

  return standings;
}
