import {z} from "zod";
import {
    BelaPlayerAnnouncementRequestValidation,
    BelaPlayerAnnouncementResponseValidation,
    TeamSideValidation
} from "./belaPlayerAnnouncement";

export const BelaResultCreateRequestValidation = z.object({
    match_id: z.number().int(),
    player_pair1_game_points: z.number().int(),
    player_pair2_game_points: z.number().int(),
    player_pair1_announcement_points: z.number().int(),
    player_pair2_announcement_points: z.number().int(),
    player_pair1_total_points: z.number().int(),
    player_pair2_total_points: z.number().int(),
    trump_caller_team: TeamSideValidation,
    pass: z.boolean(),
    complete_victory: z.boolean(),
    announcements: z.array(BelaPlayerAnnouncementRequestValidation).optional().nullable(),
    // How many hands the match held when this entry was opened. Several phones follow the same match, so a hand saved
    // on another one in the meantime means this one may be the same hand twice: the save is held back (409) and the
    // phone asks. Left out (an admin's hand, or a re-send the player confirmed) means "save it whatever happened".
    expected_hands: z.number().int().nonnegative().optional().nullable(),
});

export const BelaResultResponseValidation = BelaResultCreateRequestValidation.omit({
    announcements: true,
    expected_hands: true
}).extend({
    trump_caller_team: TeamSideValidation.nullable(),
    result_id: z.number().int().nullable(),
    belaPlayerAnnouncements:  z.array(BelaPlayerAnnouncementResponseValidation).optional().nullable()

});

export const PartialBelaResultResponseValidation = z.object({
    result_id: z.number().int().nullable(), //TODO dodati id na svaki result i napraviti update
    player_pair1_total_points: z.number(),
    player_pair2_total_points: z.number(),
});

export type BelaResultCreateRequest = z.infer<typeof BelaResultCreateRequestValidation>;
export type BelaResultResponse = z.infer<typeof BelaResultResponseValidation>;
