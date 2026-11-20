"use client";

import useManagePhone from "@/app/_hooks/useManagePhone";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import {DesktopOnlyNote} from "@/app/_ui/sp";
import ManageTournamentDesktop, {SCREEN_PARAM} from "@/app/_ui/tournaments/admin/ManageTournamentDesktop";
import ManageTournamentPhone from "@/app/_ui/tournaments/admin/ManageTournamentPhone";
import {useParams, useSearchParams} from "next/navigation";

// Upravljanje turnirom (Claude Design "Turniri admin" A3–A5, C1–C5 on the computer, M2–M9 on the admin's phone)
export default function ManageTournamentPage() {
  const params = useParams<{id: string}>();
  const id = Number(params.id);
  const isDesktop = useIsDesktop();
  const adminPhone = useManagePhone("tournament.manage.own");
  // Kolo preko cijelog ekrana keeps the computer's page whatever the width: a TV browser's full screen can be under
  // 1024 px (Android TV gives the page 960), and the phone's page in its place would close the view at once
  const screen = useSearchParams().get(SCREEN_PARAM) === "1";
  if (isDesktop || screen) return <ManageTournamentDesktop id={id} />;
  return adminPhone ? <ManageTournamentPhone id={id} /> : <DesktopOnlyNote />;
}
