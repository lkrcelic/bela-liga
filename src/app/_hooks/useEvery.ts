"use client";

import {useEffect, useRef} from "react";

// Runs `tick` every `ms` while the app is in front (never in the background); off while ms is undefined. One timer for
// everything a page reads again, so its parts come in on the same tick: a tournament's page reads the tournament and
// the player's table together, and never shows a new Kolo without its table (#85).
export default function useEvery(ms: number | undefined, tick: () => void) {
  const latest = useRef(tick);
  latest.current = tick;
  useEffect(() => {
    if (!ms) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") latest.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
}
