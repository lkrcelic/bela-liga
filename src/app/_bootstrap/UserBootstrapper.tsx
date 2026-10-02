"use client";

import {useEffect} from "react";
import useAuthStore from "@/app/_store/authStore";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";

// Keeps the stored user in sync with the session cookie. The stored user is used right away, then checked against
// the server, so logging in as someone else (or a session expiring) doesn't leave the previous player's data behind.
export default function UserBootstrapper() {
  const {setUser} = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", {credentials: "include"});
        if (cancelled) return;
        // a server error says nothing about the session, so keep what we have
        if (res.status >= 500) return;

        const json = res.ok ? await res.json() : null;
        const freshUser = json?.user ?? null;
        const storedUser = useAuthStore.getState().user;

        if (storedUser?.id !== freshUser?.id) {
          useOngoingMatchStore.getState().resetOngoingMatch();
          useAnnouncementStore.getState().resetAnnouncements();
          useResultStore.getState().resetResult();
          useRoundStore.getState().resetRound();
        }
        if (!cancelled) setUser(freshUser);
      } catch {
        // offline: keep the stored user
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return null;
}
