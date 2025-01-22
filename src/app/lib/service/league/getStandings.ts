import {prisma} from "@/app/lib/prisma";

export async function getLeagueStandings(league_id: number): Promise<unknown> {
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
