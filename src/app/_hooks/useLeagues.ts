"use client";

import {getLeaguesAPI} from "@/app/_fetchers/league/leagues";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {plural} from "@/app/_lib/ui/text";
import {useEffect, useState} from "react";

export type LeagueOption = {id: number; name: string; meta?: string; roundsPerNight: number};

// "na koji dan" for the league meta line: "16 ekipa · utorkom"
const PLAY_DAY = ["ponedjeljkom", "utorkom", "srijedom", "četvrtkom", "petkom", "subotom", "nedjeljom"];

// cached for the session; every page with a league picker asks for the same list
let cache: LeagueOption[] | null = null;

// All leagues for the league pickers (the list is public, so it also works before logging in)
export default function useLeagues(currentId: number = CURRENT_LEAGUE_ID): LeagueOption[] {
  const [leagues, setLeagues] = useState<LeagueOption[]>(cache ?? []);

  useEffect(() => {
    let cancelled = false;
    getLeaguesAPI()
      .then((data) => {
        const options = data.map((l) => ({
          id: l.league_id,
          name: l.league_name,
          roundsPerNight: l.rounds_per_night,
          meta: [
            `${l.team_count} ${plural(l.team_count, "ekipa", "ekipe", "ekipa")}`,
            l.play_day != null ? PLAY_DAY[l.play_day] : null,
            l.league_id === CURRENT_LEAGUE_ID ? "aktivna" : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }));
        cache = options;
        if (!cancelled) setLeagues(options);
      })
      .catch(() => {
        // keeps whatever is shown (the fallback below when nothing loaded)
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (leagues.length) return leagues;
  return [{id: currentId, name: "Bela Liga", roundsPerNight: 3}];
}

// Clears the cached list after a league was created
export function invalidateLeagues() {
  cache = null;
}
