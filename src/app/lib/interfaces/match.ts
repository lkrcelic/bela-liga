import { z } from "zod";

const TeamPlayers = z.object({
  player1Id: z.number(),
  player2Id: z.number()
});
export type TeamPlayersType = z.infer<typeof TeamPlayers>;

const MatchTeamPlayers = z.object({
  team1: TeamPlayers,
  team2: TeamPlayers
});
export type MatchTeamPlayersType = z.infer<typeof MatchTeamPlayers>;


export const MatchValidation = z.object({
  round_id: z.number().int().optional(),
  player_pair_id1: z.number().int().optional(),
  player_pair_id2: z.number().int().optional(),
  score_threshold: z.number().int().default(1001),
  start_time: z.date().optional(),
  end_time: z.date().optional(),
  match_date: z.date().optional(),
  players: MatchTeamPlayers,
});

export type MatchType = z.infer<typeof MatchValidation>;