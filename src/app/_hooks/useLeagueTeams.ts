"use client";

import {getLeagueTeamsAPI} from "@/app/_fetchers/league/leagues";
import {PlayBan} from "@/app/_lib/bans";
import {useCallback, useEffect, useState} from "react";

// smokers: how many of its players smoke (counted for the smoking tables in Novo kolo); ban: the ban that keeps it from
// the league's nights (its own or a player's), none for a team just added (a banned one can't be)
export type LeagueTeam = {id: number; name: string; players: string[]; active: boolean; smokers: number; ban?: PlayBan | null};

// Teams of a league with their players' usernames, the active flag and how many of them smoke (admin only)
export default function useLeagueTeams(leagueId: number | null) {
  const [teams, setTeams] = useState<LeagueTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (leagueId == null) return;
    let cancelled = false;
    setError(null);
    getLeagueTeamsAPI(leagueId)
      .then((rows) => {
        if (cancelled) return;
        setTeams(rows.map((t) => ({id: t.team_id, name: t.team_name, players: t.players.map((p) => p.username), active: t.active, smokers: t.smokers ?? 0, ban: t.ban ?? null})));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ekipe se nisu učitale.");
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId, nonce]);

  // a new league starts from a loading state; a reload keeps the list on screen
  useEffect(() => setTeams(null), [leagueId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return {teams, setTeams, error, loading: leagueId != null && teams == null && !error, reload};
}
