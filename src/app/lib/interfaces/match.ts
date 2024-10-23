import {z} from "zod";
import {PartialBelaResultResponseValidation} from "@/app/lib/interfaces/belaResult";
import {PlayerPairResponseValidation} from "@/app/lib/interfaces/playerPair";

const TeamPlayers = z.object({
    player1Id: z.number(),
    player2Id: z.number()
});

const MatchTeamPlayers = z.object({
    team1: TeamPlayers,
    team2: TeamPlayers
});

export const MatchRequestValidation = z.object({
    round_id: z.number().int().nullable().optional(),
    player_pair1_score: z.number().int().optional(),
    player_pair2_score: z.number().int().optional(),
    player_pair_id1: z.number().int().optional(),
    player_pair_id2: z.number().int().optional(),
    score_threshold: z.number().int().default(1001),
    start_time: z.date().nullable().optional(),
    end_time: z.date().nullable().optional(),
    match_date: z.date().optional(),
    players: MatchTeamPlayers.optional(),
});

export const MatchResponseValidation = MatchRequestValidation.extend({
    belaResults: z.array(PartialBelaResultResponseValidation).optional(),
    playerPair1: PlayerPairResponseValidation.optional(),
    playerPair2: PlayerPairResponseValidation.optional(),
});

export type MatchResponse = z.infer<typeof MatchResponseValidation>;
export type TeamPlayersType = z.infer<typeof TeamPlayers>;
export type MatchTeamPlayersType = z.infer<typeof MatchTeamPlayers>;
