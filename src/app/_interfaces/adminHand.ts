import {z} from "zod";
import {BelaResultCreateRequestValidation} from "@/app/_interfaces/belaResult";

// A hand entered by an admin on the Daily scorepad: either a normal hand (caller, zvanja, game points), or a manual
// one that only says how many points each team got ("Ručni unos": no zvanja, not limited to 162).
export const MANUAL_HAND_MAX = 9999;

export const AdminHandValidation = z.discriminatedUnion("manual", [
  z.object({
    manual: z.literal(true),
    points1: z.number().int().min(0).max(MANUAL_HAND_MAX),
    points2: z.number().int().min(0).max(MANUAL_HAND_MAX),
  }),
  BelaResultCreateRequestValidation.omit({match_id: true}).extend({manual: z.literal(false)}),
]);
export type AdminHand = z.infer<typeof AdminHandValidation>;

export const AdminHandTargetValidation = z.discriminatedUnion("kind", [
  // the match being played at the table (started when the table hasn't started yet)
  z.object({kind: z.literal("ongoing")}),
  // a finished match of the table
  z.object({kind: z.literal("finished"), matchId: z.number().int()}),
]);

export const AdminHandCreateValidation = z.object({target: AdminHandTargetValidation, hand: AdminHandValidation});

export const HandKindValidation = z.enum(["ongoing", "finished"]);
export type HandKind = z.infer<typeof HandKindValidation>;

export type PadHand = {
  id: number;
  total1: number;
  total2: number;
  game1: number;
  game2: number;
  caller: 1 | 2 | null;
  completeVictory: boolean;
  // entered by hand (no caller): only the totals mean something
  manual: boolean;
  announcements: {team: 1 | 2; type: string}[];
};

export type PadMatch = {
  kind: HandKind;
  id: number;
  number: number;
  score1: number;
  score2: number;
  threshold: number;
  winner: 1 | 2 | null;
  hands: PadHand[];
};

export type TablePad = {
  roundId: number;
  leagueId: number;
  roundNumber: number | null;
  date: string | null;
  table: number | null;
  team1: {id: number; name: string};
  team2: {id: number; name: string};
  // the round is finished (both matches played, or settled by hand)
  done: boolean;
  bye: boolean;
  matches: PadMatch[];
};
