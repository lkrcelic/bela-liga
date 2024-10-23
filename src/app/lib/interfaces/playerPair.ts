import { z } from "zod";
import {PlayerResponseValidation} from "@/app/lib/interfaces/player";

export const PlayerPairResponseValidation = z.object({
    id: z.number(),
    player_id1: z.number(),
    player_id2: z.number(),
    player1: PlayerResponseValidation,
    player2: PlayerResponseValidation,
});
