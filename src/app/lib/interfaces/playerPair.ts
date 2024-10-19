import { z } from "zod";
import {PlayerOutput} from "@/app/lib/interfaces/player";

export const OutputPlayerPair = z.object({
    id: z.number(),
    player_id1: z.number(),
    player_id2: z.number(),
    player1: PlayerOutput,
    player2: PlayerOutput,
});
