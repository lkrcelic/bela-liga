import {z} from "zod";

const AnnouncementValidation = z.union([
    z.literal("TWENTY"),
    z.literal("FIFTY"),
    z.literal("ONE_HUNDRED"),
    z.literal("ONE_HUNDRED_FIFTY"),
    z.literal("TWO_HUNDRED")])

// 1 = team1 (round.team1), 2 = team2 (round.team2)
export const TeamSideValidation = z.union([z.literal(1), z.literal(2)]);

export const BelaPlayerAnnouncementRequestValidation = z.object({
    team: TeamSideValidation,
    announcement_type: AnnouncementValidation,
});

export const BelaPlayerAnnouncementResponseValidation = BelaPlayerAnnouncementRequestValidation.extend({
        announcement_id: z.number().int(),
        result_id: z.number().int(),
    }
);

export type TeamSide = z.infer<typeof TeamSideValidation>;
export type BelaPlayerAnnouncementsRequest = z.infer<typeof BelaPlayerAnnouncementRequestValidation>;
export type BelaPlayerAnnouncementResponse = z.infer<typeof BelaPlayerAnnouncementResponseValidation>;
export type AnnouncementType = z.infer<typeof AnnouncementValidation>;
