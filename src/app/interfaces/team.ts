import {z} from "zod";
import {PlayerPartialResponseValidation} from "@/app/interfaces/player";

export const TeamRequestValidation = z.object({
  team_name: z.string().min(1),
  founder_id1: z.number().int().optional(),
  founder_id2: z.number().int().optional(),
  creator_id: z.number().int().optional(),
  created_at: z.date().optional(),
  last_updated_at: z.date().optional(),
});

export const TeamResponseValidation = z.object({
  team_id: z.number().int(),
  team_name: z.string(),
  teamPlayers: z.array(
    z.object({
      player: PlayerPartialResponseValidation,
    })
  ),
});

export const TeamsResponseValidation = z.array(TeamResponseValidation);

export type TeamResponse = z.infer<typeof TeamResponseValidation>;
