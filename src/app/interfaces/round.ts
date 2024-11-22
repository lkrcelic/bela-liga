import {z} from "zod";
import {TeamResponseValidation} from "@/app/interfaces/team";

export const RoundResponseValidation = z.object({
  id: z.number().int().optional(),
  tournament_id: z.number().int().optional(),
  league_id: z.number().int().optional(),
  round_number: z.number().int(),
  round_date: z.date(),
  team1_id: z.number().int(),
  team2_id: z.number().int(),
  team1_wins: z.number().int(),
  team2_wins: z.number().int(),
});

export const ExtendedRoundResponseValidation = RoundResponseValidation.extend({
  team1: TeamResponseValidation.optional(),
  team2: TeamResponseValidation.optional(),
});

export const CreateRound = z.object({
  league_id: z.number().int(),
  present_teams: z.array(z.number().int()).min(1),
});

export type CreateRoundType = z.infer<typeof CreateRound>;
export type RoundType = z.infer<typeof ExtendedRoundResponseValidation>;
