import { z } from "zod";
import { belaResultValidation } from "./belaResult";

const MatchValidation = z.object({
    round_id: z.number().int().optional(),
    player_pair1_score: z.number().int().default(0),
    player_pair_id1: z.number().int().optional(),
    player_pair2_score: z.number().int().default(0),
    player_pair_id2: z.number().int().optional(),
    score_threshold: z.number().int().default(1001),
    start_time: z.date().optional(),
    end_time: z.date().optional(),
    match_date: z.date().optional(),
    results: z.array(belaResultValidation).optional(),
});

export const matchValidation = MatchValidation;