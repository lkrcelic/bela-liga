import {z} from "zod";
import {PartialBelaResultResponseValidation} from "@/app/lib/interfaces/belaResult";
import {PlayerPairResponseValidation} from "@/app/lib/interfaces/playerPair";
import {PlayerPartialResponseValidation} from "@/app/lib/interfaces/player";

const parseDate = z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
    }
    return arg;
}, z.date());

const MatchRequestValidation = z.number();

export const OngoingMatchRequestValidation = z.object({
    round_id: z.number().int().nullable().optional(),
    player_pair1_score: z.number().int().optional(),
    player_pair2_score: z.number().int().optional(),
    player_pair_id1: z.number().int().optional(),
    player_pair_id2: z.number().int().optional(),
    score_threshold: z.number().int().optional().nullable(), //TODO nema nullable
    start_time: parseDate.nullable().optional(),
    end_time: parseDate.nullable().optional(),
    match_date: parseDate.optional(),
    current_shuffler_index: z.number().int().optional().nullable(),
    seating_order_ids: z.array(z.number().int()).optional().nullable(),
});

export const MatchResponseValidation = OngoingMatchRequestValidation.omit({
    current_shuffler_index: true,
    seating_order_ids: true,
}).extend({
    belaResults: z.array(PartialBelaResultResponseValidation).optional(),
    playerPair1: PlayerPairResponseValidation.optional(),
    playerPair2: PlayerPairResponseValidation.optional(),
    seating_order: z.array(PlayerPartialResponseValidation).optional().nullable(),
});

export const OngoingMatchResponseValidation = OngoingMatchRequestValidation.omit({
    seating_order_ids: true,
}).extend({
    belaResults: z.array(PartialBelaResultResponseValidation).optional(),
    playerPair1: PlayerPairResponseValidation.optional(),
    playerPair2: PlayerPairResponseValidation.optional(),
    seating_order: z.array(PlayerPartialResponseValidation.nullable()).optional(),
});


export type MatchResponse = z.infer<typeof MatchResponseValidation>;
export type OngoingMatchResponse = z.infer<typeof OngoingMatchResponseValidation>;
export type MatchRequest = z.infer<typeof MatchRequestValidation>
