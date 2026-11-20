import {z} from "zod";

// the most smoking tables Create Round sends (a window of 200 teams has 100 tables)
export const MAX_SMOKING_TABLES = 100;

export const SmokingTablesValidation = z
  .array(z.number().int().min(1).max(MAX_SMOKING_TABLES))
  .max(MAX_SMOKING_TABLES)
  .transform((tables) => Array.from(new Set(tables)).sort((a, b) => a - b));

export type SmokingPlanSide = {id: number; name: string; smokers: number};

// A team in the rotation (Manage League · Create round · Smoking plan). Only tonight counts: every night starts afresh
// (DECISIONS 100).
export type SmokingPlanTeam = {
  id: number;
  name: string;
  // smokers on the roster now
  smokers: number;
  // per round of tonight (roundNumbers): at a smoking table, at another table, or not at a table (null)
  tonight: (boolean | null)[];
};

export type SmokingPlan = {
  date: string; // YYYY-MM-DD, tonight
  // the smoking tables Create Round starts with: the ones of the league's last round creation
  tables: number[];
  // tonight's round numbers, ascending
  roundNumbers: number[];
  // what each of them is called: "Kolo 7", or "Skica A" for a round not published yet
  roundNames: string[];
  // tonight's smoking tables, round by round
  rounds: {roundNumber: number; name: string; tables: {table: number; teams: [SmokingPlanSide, SmokingPlanSide]}[]}[];
  // teams with smokers, or with a smoker at one of tonight's tables; most smokers first
  teams: SmokingPlanTeam[];
};
