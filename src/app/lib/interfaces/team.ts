import { z } from "zod";

const TeamValidation = z.object({
    team_name: z.string().min(1),
    founder_id1: z.number().int().optional(),
    founder_id2: z.number().int().optional(),
    creator_id: z.number().int().optional(),
    created_at: z.date().optional(),
    last_updated_at: z.date().optional()
});

const TeamOutput = z.object({
    team_id: z.number(),
    team_name: z.string()
});

const TeamsOutput = z.array(TeamOutput);

export const teamValidation = TeamValidation;
export const teamOutput = TeamOutput;
export const teamsOutput = TeamsOutput;
