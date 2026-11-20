import {count, NOUN} from "./text";
import {MAX_SMOKING_TABLES} from "@/app/_interfaces/smoking";

// The copy of Novo kolo's Pušački stolovi card and the Pušački raspored (design 12g). Framework free so the counts
// can be unit tested.

// when none of the teams counted has a smoker
const NO_SMOKERS = "nijedna ekipa nema pušača";

// The card's line under its title: "Stolovi 1, 2 · 7 pušača u 6 ekipa", "Stol 3 · 1 pušač u 1 ekipi", and
// "Stolovi 1, 2 · nijedna ekipa nema pušača" when no team switched on has one
export function smokingSummary(on: boolean, tables: number[], smokers: number, smokingTeams: number): string {
  if (!on) return "Isključeno · svi stolovi su nepušački";
  if (!tables.length) return "Nije odabran nijedan stol";
  const who = smokingTeams ? `${count(smokers, NOUN.pušač)} u ${count(smokingTeams, NOUN.ekipaLoc)}` : NO_SMOKERS;
  return `${tables.length === 1 ? "Stol" : "Stolovi"} ${tables.join(", ")} · ${who}`;
}

// The plan's line under its title: "2 pušačka stola × 3 kola · 6 ekipa s pušačima"; before tonight's first round
// "Večeras još nema kola · 6 ekipa s pušačima", and when tonight's rounds have no smoking table "Večeras nema
// pušačkih stolova · 3 kola · 6 ekipa s pušačima"
export function planHeading(smokingTables: number, rounds: number, smokingTeams: number): string {
  const teams = smokingTeams ? `${count(smokingTeams, NOUN.ekipa)} s pušačima` : NO_SMOKERS;
  if (!rounds) return `Večeras još nema kola · ${teams}`;
  if (!smokingTables) return `Večeras nema pušačkih stolova · ${count(rounds, NOUN.kolo)} · ${teams}`;
  return `${count(smokingTables, NOUN.pušačkiStol)} × ${count(rounds, NOUN.kolo)} · ${teams}`;
}

// A team's smokers under its name in the plan: "1 pušač", "2 pušača", "bez pušača"
export const smokersLabel = (n: number): string => (n > 0 ? count(n, NOUN.pušač) : "bez pušača");

// A rotation dot: where the team sat in one of tonight's rounds (null: it had no table); round: what the round is
// called ("Kolo 3", "Skica A")
export const roundDotLabel = (round: string, smoking: boolean | null): string =>
  `${round}: ${smoking == null ? "nije za stolom" : smoking ? "pušački stol" : "običan stol"}`;

// A rotation row's Udio: of tonight's rounds where the team had a table, how many it sat at a smoking table (a round
// without its table doesn't count)
export function tonightShare(tonight: readonly (boolean | null)[]): {smoking: number; rounds: number} {
  return {smoking: tonight.filter((s) => s === true).length, rounds: tonight.filter((s) => s != null).length};
}

// The Udio cell: "2 / 3"
export const tonightShareText = (tonight: readonly (boolean | null)[]): string => {
  const {smoking, rounds} = tonightShare(tonight);
  return `${smoking} / ${rounds}`;
};

// Its tooltip: "Večeras 2 od 3 kola za pušačkim stolom"
export const tonightTitle = (tonight: readonly (boolean | null)[]): string => {
  const {smoking, rounds} = tonightShare(tonight);
  return `Večeras ${smoking} od ${rounds} kola za pušačkim stolom`;
};

// Pušački stolovi in a tournament's form, as typed: numbers and ranges split by commas or spaces ("1, 2, 5",
// "1-4, 7"). Empty: no smoking tables. null: something in it isn't a table number from 1 to MAX_SMOKING_TABLES.
export const SMOKING_TABLES_ERROR = `Upiši brojeve stolova od 1 do ${MAX_SMOKING_TABLES}, npr. 1, 2 ili 1-4.`;

export function parseSmokingTables(text: string): number[] | null {
  const tables = new Set<number>();
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  for (const part of parts) {
    const range = /^(\d+)(?:[-–](\d+))?$/.exec(part);
    if (!range) return null;
    const from = Number(range[1]);
    const to = range[2] == null ? from : Number(range[2]);
    if (from < 1 || to > MAX_SMOKING_TABLES || from > to) return null;
    for (let t = from; t <= to; t++) tables.add(t);
  }
  return Array.from(tables).sort((a, b) => a - b);
}

// The tables back in the form: "1, 2, 3"
export const formatSmokingTables = (tables: readonly number[]): string => [...tables].sort((a, b) => a - b).join(", ");
