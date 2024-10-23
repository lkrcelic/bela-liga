import {z} from "zod";
import {PartialBelaResultResponseValidation} from "@/app/lib/interfaces/belaResult";
import {PlayerPairRequestValidation, PlayerPairResponseValidation} from "@/app/lib/interfaces/playerPair";

export const OngoingMatchCreateRequestValidation = z.object({
    player_pair1: PlayerPairRequestValidation,
    player_pair2: PlayerPairRequestValidation,
    player_pair_id1: z.number().int().optional(),
    player_pair_id2: z.number().int().optional(),
});

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
});

export const MatchResponseValidation = MatchRequestValidation.extend({
    belaResults: z.array(PartialBelaResultResponseValidation).optional(),
    playerPair1: PlayerPairResponseValidation.optional(),
    playerPair2: PlayerPairResponseValidation.optional(),
});

export type MatchResponse = z.infer<typeof MatchResponseValidation>;
export type OngoingMatchCreateRequest = z.infer<typeof OngoingMatchCreateRequestValidation>
