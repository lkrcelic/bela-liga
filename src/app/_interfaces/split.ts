import {PlayBan} from "@/app/_lib/bans";
import {Slot} from "@/app/_lib/locations";
import {NightLocation} from "@/app/_lib/nights";
import {z} from "zod";

// Podjela (Upravljanje ligom, Claude Design 05 A): which of a two-place night's places each team of the league plays at

// A team of the league as Podjela shows it; slot null: not assigned (Neraspoređena). ban: the ban that keeps it from
// the league's nights (the Zabrana chip on its card); it can still be placed, and its Tu smo is refused for the ban.
export type SplitTeam = {team_id: number; name: string; active: boolean; ban: PlayBan | null; slot: Slot | null};

// A night's Podjela: its two places (null: a one-place night, which has none) and every team of the league
// alphabetically
export type NightSplit = {
  date: string;
  places: [NightLocation, NightLocation] | null;
  teams: SplitTeam[];
};

// What a move answers: the Podjela as saved, and what the admin should know (a team still in a Skica of the place it
// left)
export type SplitResult = {split: NightSplit; warnings: string[]};

// Teams moved at once: one dragged, or all of them (Zamijeni lokacije); slot null takes a
// team back to Neraspoređene
export const NightSplitRequestValidation = z.object({
  teams: z
    .array(
      z.object({
        team_id: z.number().int().positive(),
        slot: z.union([z.literal(1), z.literal(2)]).nullable(),
      })
    )
    .min(1, "Nema promjene.")
    .max(1000),
});
export type SplitMove = z.infer<typeof NightSplitRequestValidation>["teams"][number];

// Why Podjela can't change
export const SPLIT_ONE_PLACE = "Ova večer ima jednu lokaciju, pa nema podjele ekipa.";
export const SPLIT_PAST_NIGHT = "Prošla večer se više ne dijeli.";
export const SPLIT_NOT_IN_LEAGUE = "Ekipa nije u ovoj ligi.";

// A team that changed place while it is in a Skica of the place it left: the Skica isn't changed
export const inDraftWarning = (team: string, place: string) => `Ekipa ${team} je u skici kola na lokaciji ${place} i ondje ostaje dok ne odbaciš skicu.`;
