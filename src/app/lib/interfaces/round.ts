import { z } from 'zod';

export const RoundValidation = z.object({
    id: z.number().int().optional(),
    tournament_id: z.number().int().optional(),
    league_id: z.number().int().optional(),
    round_number: z.number().int(),
    round_date: z.date(),
    team1_id: z.number().int(),
    team2_id: z.number().int(),
});

export const ExtendedRoundValidation = RoundValidation.extend({
    team1: z.object({
        team_id: z.number().int(),
        team_name: z.string(),
        teamPlayers: z.array(
            z.object({
                player: z.object({
                    id: z.number().int(),
                    username: z.string(),
                    first_name: z.string().nullable(),
                    last_name: z.string().nullable(),
                })
            })
        ),
    }).optional(),
    team2: z.object({
        team_id: z.number().int(),
        team_name: z.string(),
        teamPlayers: z.array(
            z.object({
                player: z.object({
                    id: z.number().int(),
                    username: z.string(),
                    first_name: z.string().nullable(),
                    last_name: z.string().nullable(),
                })
            })
        ),
    }).optional(),
});

export type RoundType = z.infer<typeof ExtendedRoundValidation>;


// TODO REMOVE

// Define the player schema
export const PlayerSchema = z.object({
    id: z.number().int(),
    username: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
});

// Define the teamPlayers schema using the PlayerSchema
export const TeamPlayersSchema = z.array(
    z.object({
        player: PlayerSchema,
    })
);

// Optional: Export the inferred type for TypeScript usage
export type PlayerType = z.infer<typeof PlayerSchema>;
export type TeamPlayersType = z.infer<typeof TeamPlayersSchema>;