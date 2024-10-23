import { z } from "zod";

export const TeamRequestValidation = z.object({
    team_name: z.string().min(1),
    founder_id1: z.number().int().optional(),
    founder_id2: z.number().int().optional(),
    creator_id: z.number().int().optional(),
    created_at: z.date().optional(),
    last_updated_at: z.date().optional()
});

export const TeamResponseValidation = z.object({
    team_id: z.number(),
    team_name: z.string()
});

export const TeamsResponseValidation = z.array(TeamResponseValidation);

