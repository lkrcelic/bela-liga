import {z} from "zod";
import {BasicBelaResultValidation} from "@/app/lib/interfaces/belaResult";
import {OutputPlayerPair} from "@/app/lib/interfaces/playerPair";

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
  round_id: z.number().int().nullable().optional(),
  player_pair1_score: z.number().int().optional(),
  player_pair2_score: z.number().int().optional(),
  player_pair_id1: z.number().int().optional(),
  player_pair_id2: z.number().int().optional(),
  score_threshold: z.number().int().default(1001),
  start_time: z.date().nullable().optional(),
  end_time: z.date().nullable().optional(),
  match_date: z.date().optional(),
  players: MatchTeamPlayers.optional(),
});

export const OutputMatch = MatchValidation.extend({
  belaResults: z.array(BasicBelaResultValidation).optional(),
  playerPair1: OutputPlayerPair.optional(),
  playerPair2: OutputPlayerPair.optional(),
});

export type MatchType = z.infer<typeof OutputMatch>;
