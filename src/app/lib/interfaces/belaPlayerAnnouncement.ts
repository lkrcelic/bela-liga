import { z } from "zod";

export const belaPlayerAnnouncement = z.object({
    result_id: z.number().int().default(0),
    player_id: z.number().int(),
    announcement_type: z.union([
        z.literal("TWENTY"), z.literal("FIFTY"),
        z.literal("ONE_HUNDRED"), z.literal("ONE_HUNDRED_FIFTY"),
        z.literal("TWO_HUNDRED")])
});

export const belaAnnouncements = z.array(belaPlayerAnnouncement);