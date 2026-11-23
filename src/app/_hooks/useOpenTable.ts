"use client";

import {getRoundDataAPI} from "@/app/_fetchers/round/getOne";
import {getOpenRoundByPlayerIdAPI, OpenScope} from "@/app/_fetchers/round/getOpenByPlayerId";
import {RoundExtendedResponse} from "@/app/_interfaces/round";
import {readSaysNothing} from "@/app/_lib/ui/openTable";
import useAuthStore from "@/app/_store/authStore";
import {useTableSignal} from "@/app/_store/tableSignal";
import {useCallback, useEffect, useState} from "react";

export type OpenTable = {
  roundId: number;
  table: number | null;
  // smoking is allowed at the table
  smoking: boolean;
  roundNumber: number | null;
  // the player's own team first
  myTeam: string;
  opponent: string;
  // the running match's points, the player's own team first; null before a match is started
  score: [number, number] | null;
  // the tournament a tournament's table is in; null for a league's
  tournamentId: number | null;
  // a league's table: which of its place's Kola tonight it is ("Kolo 1/3"); null for a tournament's
  kolo: [number, number] | null;
};

// orientation used everywhere: the viewer's team on the left; if they play in neither, team1 stays left
export function myTeamIsTeam1(round: Pick<RoundExtendedResponse, "team1" | "team2">, userId: number | null | undefined): boolean {
  const inTeam2 = userId != null && (round.team2?.teamPlayers ?? []).some((tp) => tp.player?.id === userId);
  const inTeam1 = userId != null && (round.team1?.teamPlayers ?? []).some((tp) => tp.player?.id === userId);
  return inTeam1 || !inTeam2;
}

// The next table the logged-in player sits at, if they have an open round. scope: only a league's table (Početna ·
// Liga) or a tournament's (Početna · Turniri, a tournament's page); any by default.
// It is read when the page opens, again when the app comes back to the front, at once when the player's table changes
// from outside the page (useTableSignal: an answer to "Jesu li … za stolom?"), and on reload(), which a page that reads
// its own data on a timer calls on the same tick (useEvery), so a Kolo published or a table closed meanwhile shows (#85).
// A guest has no table: nothing is read (a read would only answer 401 and start the session check, every refresh).
export default function useOpenTable(scope: OpenScope = "any"): {table: OpenTable | null; loading: boolean; reload: () => void} {
  const userId = useAuthStore((s) => s.user?.id);
  const signal = useTableSignal((s) => s.version);
  const [table, setTable] = useState<OpenTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const wake = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", wake);
    return () => document.removeEventListener("visibilitychange", wake);
  }, [reload]);

  useEffect(() => {
    if (userId == null) {
      setTable(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const {roundId, ongoingScore, tournamentId, nightKolo} = await getOpenRoundByPlayerIdAPI(scope);
        const round = await getRoundDataAPI(roundId);
        if (cancelled) return;
        const left = myTeamIsTeam1(round, userId);
        const t1 = round.team1?.team_name ?? "";
        const t2 = round.team2?.team_name ?? "";
        setTable({
          roundId,
          table: round.table_number ?? null,
          smoking: !!round.smoking_table,
          roundNumber: round.round_number ?? null,
          myTeam: left ? t1 : t2,
          opponent: left ? t2 : t1,
          score: ongoingScore ? (left ? ongoingScore : [ongoingScore[1], ongoingScore[0]]) : null,
          tournamentId: tournamentId ?? null,
          kolo: nightKolo ?? null,
        });
      } catch (e) {
        // no open round (404): no card; offline or a server fault: what is shown stays (none on the first read)
        if (!cancelled) setTable((shown) => (readSaysNothing(e) ? shown : null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, scope, nonce, signal]);

  return {table, loading, reload};
}
