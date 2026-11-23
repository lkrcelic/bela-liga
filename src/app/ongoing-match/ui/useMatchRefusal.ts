"use client";

import {getOngoingMatchAPI, NotYourMatchError} from "@/app/_fetchers/ongoingMatch/getOne";
import {useEffect, useState} from "react";

// Matches the board has read in this visit of the app: the server sends a match only to who may play its table, so
// the hand steps opened from the board need not ask again. Kept in memory only, never in the persisted stores, which
// hold what any earlier version of the app put there.
const readByBoard = new Set<number>();

export function boardReadMatch(matchId: number) {
  readByBoard.add(matchId);
}

// Upiši igru's steps work from what the board left in the stores and ask the server nothing until Spremi, so opened by
// their address they would let a player who doesn't play at the table go through every step (#88). Unless the board
// has just read the match, the wizard asks once when it opens and shows nothing of the steps until the answer:
// "checking", then the refusal ("Ne igraš u ovoj rundi.", 403) or null. Any other failure (a match just finished, no
// connection) leaves the steps to handle it, as before.
export default function useMatchRefusal(matchId: number): "checking" | string | null {
  const known = readByBoard.has(matchId);
  const [answer, setAnswer] = useState<"checking" | string | null>(known ? null : "checking");

  useEffect(() => {
    if (readByBoard.has(matchId)) {
      setAnswer(null);
      return;
    }
    let cancelled = false;
    setAnswer("checking");
    getOngoingMatchAPI(matchId)
      .then(() => {
        if (cancelled) return;
        boardReadMatch(matchId);
        setAnswer(null);
      })
      .catch((error) => {
        if (!cancelled) setAnswer(error instanceof NotYourMatchError ? error.message : null);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return answer;
}
