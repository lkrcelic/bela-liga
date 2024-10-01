import { z } from "zod";
import { playerOutput } from "./player";

export const SessionOut = z.object({
    id: z.string(),
    expiresAt: z.date(),
    userId: z.number(),
    player: playerOutput
});

export const SessionsOut = z.array(SessionOut);