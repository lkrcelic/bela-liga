import {array, z} from "zod";
import {BelaPlayerAnnouncementRequestValidation} from "./belaPlayerAnnouncement";

export const BelaResultValidationRequestValidation = z.object({
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
        z.literal("FIRST"),
        z.literal("SECOND"),
        z.literal("THIRD"),
        z.literal("FOURTH"),
    ])
        .default("FIRST"),
    trump_type: z.union([
        z.literal("PIK"),
        z.literal("HERC"),
        z.literal("KARO"),
        z.literal("TREF")])
        .optional(),
    pass: z.boolean(),
    complete_victory: z.boolean(),
    announcements: z.array(BelaPlayerAnnouncementRequestValidation).optional().nullable(),
});

export const BelaResultValidationResponseValidation = BelaResultValidationRequestValidation.extend({
    result_id: z.number().int().nullable(),
});

export const PartialBelaResultResponseValidation = z.object({
    player_pair1_total_points: z.number(),
    player_pair2_total_points: z.number(),
});

export type BelaResultRequest = z.infer<typeof BelaResultValidationRequestValidation>;
export type BelaResultResponse = z.infer<typeof BelaResultValidationResponseValidation>;
