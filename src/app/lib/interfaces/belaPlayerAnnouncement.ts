import { z } from "zod";

export const BelaPlayerAnnouncement = z.object({
    player_id: z.number().int(),
    announcement_type: z.union([
        z.literal("TWENTY"), z.literal("FIFTY"),
        z.literal("ONE_HUNDRED"), z.literal("ONE_HUNDRED_FIFTY"),
        z.literal("TWO_HUNDRED")])
});

export const BelaPlayerAnnouncements = z.array(BelaPlayerAnnouncement);