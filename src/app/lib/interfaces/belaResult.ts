import { z } from "zod";
import { BelaPlayerAnnouncements } from "./belaPlayerAnnouncement";

export const BelaResultValidation = z.object({
    match_id: z.number().int(),
    player_pair1_game_points: z.number().int(),
    player_pair2_game_points: z.number().int(),
    player_pair1_announcement_points: z.number().int(),
    player_pair2_announcement_points: z.number().int(),
    player_pair1_total_points: z.number().int(),
    player_pair2_total_points: z.number().int(),
    card_shuffler_id: z.number().int().optional(),
    trump_caller_id: z.number().int().optional(),
    trump_caller_position: z.union([
        z.literal("FIRST"), z.literal("SECOND"),
        z.literal("THIRD"), z.literal("FOURTH")
    ]).default("FIRST"),
    trump_type: z.union([
        z.literal("PIK"), z.literal("HERC"),
        z.literal("KARO"), z.literal("TREF")
    ]).optional(),
    pass: z.boolean(),
    complete_victory: z.boolean(),
    announcements: BelaPlayerAnnouncements.optional()
});

export type BelaResultType = z.infer<typeof BelaResultValidation>;
