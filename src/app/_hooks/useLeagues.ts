"use client";

import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {useEffect, useState} from "react";

export type LeagueOption = {id: number; name: string; meta?: string};

// Leagues for the league pickers. /api/leagues is admin-only, so players get just the league they are looking at.
export default function useLeagues(currentId: number = CURRENT_LEAGUE_ID): LeagueOption[] {
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leagues")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: {league_id: number; league_name: string}[]) => {
        if (cancelled) return;
        setLeagues(
          (Array.isArray(data) ? data : [])
            .map((l) => ({id: l.league_id, name: l.league_name, meta: l.league_id === CURRENT_LEAGUE_ID ? "Aktivna liga" : undefined}))
            .sort((a, b) => b.id - a.id)
        );
      })
      .catch(() => {
        if (!cancelled) setLeagues([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (leagues.length) return leagues;
  return [{id: currentId, name: currentId === CURRENT_LEAGUE_ID ? "Bela Liga" : `Liga ${currentId}`, meta: "Aktivna liga"}];
}
