import {z} from "zod";
import {playersOutput} from "./player";

export const SessionOut = z.object({
  id: z.string(),
  expiresAt: z.date(),
  userId: z.number(),
  player: playersOutput
});

export const SessionsOut = z.array(SessionOut);