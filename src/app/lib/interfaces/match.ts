import {z} from "zod";
import {PartialBelaResultResponseValidation} from "@/app/lib/interfaces/belaResult";
import {PlayerPairResponseValidation} from "@/app/lib/interfaces/playerPair";
import {PlayerPartialResponseValidation} from "@/app/lib/interfaces/player";


export const MatchRequestValidation = z.object({
    round_id: z.number().int().nullable().optional(),
    player_pair1_score: z.number().int().optional(),
    player_pair2_score: z.number().int().optional(),
    player_pair_id1: z.number().int().optional(),
    player_pair_id2: z.number().int().optional(),
    score_threshold: z.number().int().optional().nullable(), //TODO nema nullable
    start_time: z.date().nullable().optional(),
    end_time: z.date().nullable().optional(),
    match_date: z.date().optional(),
    seating_order_ids: z.array(z.number().int()).nullable(),
});

export const MatchResponseValidation = MatchRequestValidation
    .omit({
        seating_order_ids: true
    }).extend({
        belaResults: z.array(PartialBelaResultResponseValidation).optional(),
        playerPair1: PlayerPairResponseValidation.optional(),
        playerPair2: PlayerPairResponseValidation.optional(),
        current_shuffler_index: z.number().int().optional().nullable(),
        seating_order: z.array(PlayerPartialResponseValidation).optional().nullable(),
    });


export type MatchResponse = z.infer<typeof MatchResponseValidation>;
export type MatchRequest = z.infer<typeof MatchRequestValidation>
