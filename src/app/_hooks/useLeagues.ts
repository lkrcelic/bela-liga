"use client";

import {getLeaguesAPI} from "@/app/_fetchers/league/leagues";
import {plural} from "@/app/_lib/ui/text";
import {useEffect, useState} from "react";

export type LeagueOption = {id: number; name: string; meta?: string; roundsPerNight: number; active: boolean};

// "na koji dan" for the league meta line: "16 ekipa · utorkom"
const PLAY_DAY = ["ponedjeljkom", "utorkom", "srijedom", "četvrtkom", "petkom", "subotom", "nedjeljom"];

// cached for the session; every page with a league picker asks for the same list, and screens mounting together
// share one request
let cache: LeagueOption[] | null = null;
let inflight: Promise<LeagueOption[]> | null = null;
// mounted pickers, told when a league is renamed
const listeners = new Set<(leagues: LeagueOption[]) => void>();

function loadLeagues(): Promise<LeagueOption[]> {
  inflight ??= getLeaguesAPI()
    .then((data) => {
      cache = data.map((l) => ({
        id: l.league_id,
        name: l.league_name,
        roundsPerNight: l.rounds_per_night,
        active: l.active,
        meta: [`${l.team_count} ${plural(l.team_count, "ekipa", "ekipe", "ekipa")}`, l.play_day != null ? PLAY_DAY[l.play_day] : null, l.active ? "aktivna" : null]
          .filter(Boolean)
          .join(" · "),
      }));
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function useLeagueList(): {leagues: LeagueOption[] | null; error: boolean} {
  const [leagues, setLeagues] = useState<LeagueOption[] | null>(cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listeners.add(setLeagues);
    loadLeagues()
      .then((options) => {
        if (!cancelled) setLeagues(options);
      })
      .catch(() => {
        // keeps whatever is shown
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      listeners.delete(setLeagues);
    };
  }, []);

  return {leagues, error};
}

// All leagues for the league pickers (the list is public, so it also works before logging in). A page showing one
// league passes its id, so its picker has something to show before the list arrives.
export default function useLeagues(currentId?: number): LeagueOption[] {
  const {leagues} = useLeagueList();
  if (leagues?.length) return leagues;
  return currentId != null ? [{id: currentId, name: "Bela Liga", roundsPerNight: 3, active: false}] : [];
}

// The league being played now (the latest round night): undefined while loading, null when there is none
export function useActiveLeagueId(): number | null | undefined {
  const {leagues, error} = useLeagueList();
  if (leagues) return leagues.find((l) => l.active)?.id ?? null;
  return error ? null : undefined;
}

// Clears the cached list after a league was created
export function invalidateLeagues() {
  cache = null;
}

// Shows a league's new name everywhere at once, without fetching the list again
export function renameCachedLeague(id: number, name: string) {
  if (!cache) return;
  cache = cache.map((l) => (l.id === id ? {...l, name} : l));
  listeners.forEach((notify) => notify(cache!));
}
