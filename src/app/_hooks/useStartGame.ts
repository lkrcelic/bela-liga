"use client";

import {createOngoingMatchAPI} from "@/app/_fetchers/ongoingMatch/create";
import {getOpenRoundByPlayerIdAPI} from "@/app/_fetchers/round/getOpenByPlayerId";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useCallback, useState} from "react";

// "Start Game": opens the running match of the player's open round, or starts it
export default function useStartGame() {
  const router = useTransitionRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const {roundId, ongoingMatchId} = await getOpenRoundByPlayerIdAPI();
      if (ongoingMatchId) {
        router.push(`/ongoing-match/${ongoingMatchId}`, "morph");
      } else {
        const ongoingMatch = await createOngoingMatchAPI({round_id: roundId, score_threshold: 1001});
        router.push(`/ongoing-match/${ongoingMatch.id}`, "morph");
      }
      // stays "starting" until the next page takes over
    } catch (e) {
      setError(e instanceof Error ? e.message : "Igru nije moguće pokrenuti.");
      setStarting(false);
    }
  }, [router, starting]);

  return {start, starting, error, clearError: () => setError(null)};
}
