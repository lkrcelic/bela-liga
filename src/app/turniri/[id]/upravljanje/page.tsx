"use client";

import useAdminPhone from "@/app/_hooks/useAdminPhone";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import {DesktopOnlyNote} from "@/app/_ui/sp";
import ManageTournamentDesktop from "@/app/_ui/tournaments/admin/ManageTournamentDesktop";
import ManageTournamentPhone from "@/app/_ui/tournaments/admin/ManageTournamentPhone";
import {useParams} from "next/navigation";

// Upravljanje turnirom (Claude Design "Turniri admin" A3–A5, C1–C5 on the computer, M2–M9 on the admin's phone)
export default function ManageTournamentPage() {
  const params = useParams<{id: string}>();
  const id = Number(params.id);
  const isDesktop = useIsDesktop();
  const adminPhone = useAdminPhone();
  if (isDesktop) return <ManageTournamentDesktop id={id} />;
  return adminPhone ? <ManageTournamentPhone id={id} /> : <DesktopOnlyNote />;
}
