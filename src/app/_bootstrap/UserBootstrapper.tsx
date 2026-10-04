"use client";

import {useEffect} from "react";
import useAuthStore from "@/app/_store/authStore";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";

// Keeps the stored user in sync with the session cookie. The stored user is used right away, then checked against
// the server, so logging in as someone else (or a session expiring) doesn't leave the previous player's data behind.
// The check also renews the login, so it runs again when a phone brings a long-open tab back.
const RECHECK_AFTER_MS = 15 * 60 * 1000;

// pages that work without logging in
function isPublicPath(path: string): boolean {
  return path.startsWith("/login") || path.startsWith("/signup") || /^\/league\/\d+\/standings\/?$/.test(path);
}

export default function UserBootstrapper() {
  const {setUser} = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    let lastCheck = 0;
    const run = async () => {
      lastCheck = Date.now();
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

        // The middleware can only check that a session cookie is there and signed. /api/auth/me has removed the dead
        // cookie by now; send the player to the login page (the season table stays public).
        if (res.status === 401 && !isPublicPath(window.location.pathname)) {
          window.location.replace("/login");
        }
      } catch {
        // offline: keep the stored user
      }
    };
    run();
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck > RECHECK_AFTER_MS) run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setUser]);

  return null;
}
