"use client";

import {useEffect, useRef} from "react";
import {create} from "zustand";

// The logged-in player's table changed from outside the page that shows it: an answer to "Jesu li … za stolom?"
// (TournamentAttention). Every useOpenTable reads its table again at once, and a page that shows
// what came of it (Pobjeda bez igre) reads its own data again with useTableChanged, instead of waiting for its next
// refresh (#85).
type TableSignal = {version: number; changed: () => void};

export const useTableSignal = create<TableSignal>((set) => ({
  version: 0,
  changed: () => set((s) => ({version: s.version + 1})),
}));

// Runs `then` each time the signal goes off while the page is open (not when it opens: it reads everything then anyway)
export function useTableChanged(then: () => void) {
  const version = useTableSignal((s) => s.version);
  const seen = useRef(version);
  const latest = useRef(then);
  latest.current = then;
  useEffect(() => {
    if (version === seen.current) return;
    seen.current = version;
    latest.current();
  }, [version]);
}
