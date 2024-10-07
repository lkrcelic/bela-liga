import { BelaResultType } from "../interfaces/belaResult";
import { prisma } from "../prisma";

export async function checkMatchOver(belaResult: BelaResultType) : Promise<boolean> {
  let match = await prisma.ongoingMatch.findUnique({ where: { id: belaResult.match_id }, 
                                                     include: { belaResults: true } });
  if (!match)
    return false;

  let match_sum_t1 = match?.belaResults.reduce((sum, br) => 
    sum + br.player_pair1_game_points + br.player_pair1_announcement_points, 0);
  match_sum_t1 += belaResult.player_pair1_announcement_points + belaResult.player_pair1_game_points;
  let match_sum_t2 = match?.belaResults.reduce((sum, br) => 
    sum + br.player_pair2_game_points + br.player_pair2_announcement_points, 0);
  match_sum_t2 += belaResult.player_pair2_announcement_points + belaResult.player_pair2_game_points;
  if (match_sum_t1 == match_sum_t2)
    return false;

  const score_threshold = match.score_threshold ?? 1001;
  if((match_sum_t1 > score_threshold) || 
      match_sum_t2 > score_threshold) {
    return true;
  }

  return false;
}