"use client";

import {getLeagueTeamsAPI} from "@/app/_fetchers/league/getLeagueTeams";
import {TeamExtendedResponse} from "@/app/_interfaces/team";
import {isByeTeam} from "@/app/_lib/bye";
import {useCallback, useEffect, useState} from "react";

export type LeagueTeam = {id: number; name: string; players: string[]};

// Teams of a league with their players' usernames. withPlayers joins /api/teams (one extra request).
export default function useLeagueTeams(leagueId: number | null, withPlayers = false) {
  const [teams, setTeams] = useState<LeagueTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (leagueId == null) return;
    let cancelled = false;
    setTeams(null);
    setError(null);
    (async () => {
      try {
        const [entries, all] = await Promise.all([
          getLeagueTeamsAPI(leagueId),
          withPlayers ? fetch("/api/teams").then((r) => (r.ok ? (r.json() as Promise<TeamExtendedResponse[]>) : [])) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const players = new Map(all.map((t) => [t.team_id, (t.teamPlayers ?? []).map((tp) => tp.player.username)]));
        setTeams(
          entries
            .filter((e) => !isByeTeam(e.team.team_id))
            .map((e) => ({id: e.team.team_id, name: e.team.team_name, players: players.get(e.team.team_id) ?? []}))
            .sort((a, b) => a.name.localeCompare(b.name, "hr"))
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ekipe nije moguće učitati.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leagueId, withPlayers, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return {teams, error, loading: leagueId != null && teams == null && !error, reload};
}
