import { z } from "zod";

const TeamIds = z.object({
  player1Id: z.number(),
  player2Id: z.number()
});

const GameIds = z.object({
  team1Ids: TeamIds,
  team2Ids: TeamIds
});

export type TeamIdsType = z.infer<typeof TeamIds>;
export type GameIdsType = z.infer<typeof GameIds>;

export const MatchValidation = z.object({
  round_id: z.number().int().optional(),
  player_pair_id1: z.number().int().optional(),
  player_pair_id2: z.number().int().optional(),
  score_threshold: z.number().int().default(1001),
  start_time: z.date().optional(),
  end_time: z.date().optional(),
  match_date: z.date().optional(),
  players: GameIds.optional()
});
