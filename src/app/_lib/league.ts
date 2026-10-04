// The league being played now is the one with the most recent round night, so a new season's league takes over
// with its first round. Until any league has played, the newest league is the active one.
export function pickActiveLeague<T extends {league_id: number; last_played: string | null}>(leagues: T[]): number | null {
  let best: T | null = null;
  for (const l of leagues) {
    const a = l.last_played ?? "";
    const b = best?.last_played ?? "";
    if (!best || a > b || (a === b && l.league_id > best.league_id)) best = l;
  }
  return best?.league_id ?? null;
}

// Links that always open the active league; /league/current resolves it on the server
export const currentLeagueHref = (page: "daily-standings" | "standings" | "manage") => `/league/current/${page}`;
