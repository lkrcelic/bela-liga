import {z} from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

export const LeagueCreateRequestValidation = z.object({
  league_name: z.string().trim().min(1).max(100),
  season: z.string().trim().max(20).optional().nullable(),
  start_date: isoDate.optional().nullable(),
  // 0 = Monday ... 6 = Sunday
  play_day: z.number().int().min(0).max(6).optional().nullable(),
  rounds_per_night: z.number().int().min(1).max(6).default(3),
  team_ids: z.array(z.number().int()).default([]),
});

export const LeagueTeamAddRequestValidation = z.object({
  team_id: z.number().int(),
});

export const LeagueTeamUpdateRequestValidation = z.object({
  active: z.boolean(),
});

export type LeagueCreateRequest = z.infer<typeof LeagueCreateRequestValidation>;

// A league as the pickers and Create Round see it
export type LeagueSummary = {
  league_id: number;
  league_name: string;
  season: string | null;
  start_date: string | null;
  play_day: number | null;
  rounds_per_night: number;
  team_count: number;
  last_played: string | null; // the latest round night, YYYY-MM-DD
  active: boolean; // the league being played now (see pickActiveLeague)
};

// A team of a league with its players, for Manage League and Create Round
export type LeagueTeamDetails = {
  team_id: number;
  team_name: string;
  active: boolean;
  players: {id: number; username: string}[];
};
