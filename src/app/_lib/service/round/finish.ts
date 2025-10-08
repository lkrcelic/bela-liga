import {prisma} from "@/app/_lib/prisma";
import { updateRatingsAfterMatch } from "../../rating/ratingService";


export async function finishRound(round_id: number): Promise<void> {
   await prisma.round.update({
    where: {
      id: round_id,
    },
    data: {
      open: false,
      active: false,
    },
  });

  const round = await prisma.round.findUnique({
    where: {
      id: round_id,
    },
    include: {
      leagueRounds: {
        select: {
          league_id: true,
        },
      },
      team1: {
        select: {
          teamPlayers: true
        }
      },
      team2: {
        select: {
          teamPlayers: true
        }
      }
    },
  });

  const {team1_id, team2_id, team1_wins, team2_wins, team1, team2, leagueRounds = []} = round;
  const league_id = leagueRounds[0].league_id;

  await prisma.$queryRaw`CALL update_team_score(${team1_id}, ${league_id})`;
  await prisma.$queryRaw`CALL update_team_score(${team2_id}, ${league_id})`;

  const team1Won = team1_wins > team2_wins;
  const isDraw = team1_wins === team2_wins;

  const scoreTeam1 = team1Won ? 1 : isDraw ? 0.5 : 0;

  const teamAPlayerIds = team1.teamPlayers.map(player => player.player_id);
  const teamBPlayerIds = team2.teamPlayers.map(player => player.player_id);

  await updateRatingsAfterMatch(teamAPlayerIds, teamBPlayerIds, scoreTeam1);
}
