import type {MyLeague, MySchedule} from "@/app/_interfaces/burza";
import {nextNightIndex} from "@/app/_lib/nights";

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

// Whether a league's season is over ("Završeno"; otherwise "U tijeku"): its end date has passed or, for a league
// without an end date (the older ones), its last night has. A league with neither is still running. Dates are
// YYYY-MM-DD; today is the league date (leagueDateString), so the end date itself and tonight still count as running.
export function leagueEnded(end: string | null, lastNight: string | null, today: string): boolean {
  if (end != null) return end < today;
  return lastNight != null && lastNight < today;
}

export type LeaguePage = "daily-standings" | "standings" | "manage";

// The query of a page's searchParams again ("?team=29", "?date=2026-02-17&round=2"; repeated keys kept), "" for none:
// /league/current/<page> passes it on to the league's page
export function searchSuffix(params: Record<string, string | string[] | undefined> | null | undefined): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    for (const v of Array.isArray(value) ? value : value == null ? [] : [value]) query.append(key, v);
  }
  const s = query.toString();
  return s ? `?${s}` : "";
}

// A link to a page of the active league: straight to it once its id is known (useActiveLeagueId), otherwise through
// /league/current, which finds it on the server (a full page load, so only a fallback)
export const currentLeagueHref = (page: LeaguePage, activeId?: number | null) =>
  activeId != null ? `/league/${activeId}/${page}` : `/league/current/${page}`;

// The league a screen opens: the one picked in a league picker (while it exists); otherwise the player's own (Početna:
// the league of the Večeras / Sljedeća večer card, #29); for no own league, the league played now. undefined while
// the leagues or the player's own league (own === undefined) load, null when there are no leagues.
export function homeLeagueId(
  picked: number | null,
  leagues: {id: number; active: boolean}[] | undefined,
  own: number | null | undefined,
): number | null | undefined {
  if (!leagues) return undefined;
  if (picked != null && leagues.some((l) => l.id === picked)) return picked;
  if (own === undefined) return undefined;
  return own ?? leagues.find((l) => l.active)?.id ?? null;
}

// The player's next league night: the soonest one of a league where their team is active, else of one where it is
// inactive (an admin can still switch an inactive team on for a night, so it keeps its league's nights)
export function nextNight(schedule: MySchedule | null): {league: MyLeague; night: string} | null {
  const leagues = schedule?.leagues ?? [];
  for (const league of [...leagues.filter((l) => l.active), ...leagues.filter((l) => !l.active)]) {
    const i = nextNightIndex(league.nights, schedule!.today);
    if (i >= 0) return {league, night: league.nights[i]};
  }
  return null;
}

// The player's own league on Početna (#29): the league of their next night (the Večeras / Sljedeća večer card), null
// for a player with no night ahead or when the schedule failed to load, undefined while it loads
export function ownLeagueId(schedule: MySchedule | null, scheduleError: string | null): number | null | undefined {
  if (!schedule) return scheduleError ? null : undefined;
  return nextNight(schedule)?.league.league_id ?? null;
}
