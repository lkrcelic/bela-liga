"use client";

import useAdminPhone from "@/app/_hooks/useAdminPhone";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import {DesktopOnlyNote} from "@/app/_ui/sp";
import TournamentsDesktop from "@/app/_ui/tournaments/admin/TournamentsDesktop";
import TournamentsPhone from "@/app/_ui/tournaments/admin/TournamentsPhone";

// The admin's Turniri: the computer's table, or the admin's phone list (Claude Design "Turniri admin" A1, M1)
export default function AdminTournamentsPage() {
  const isDesktop = useIsDesktop();
  const adminPhone = useAdminPhone();
  if (isDesktop) return <TournamentsDesktop />;
  return adminPhone ? <TournamentsPhone /> : <DesktopOnlyNote />;
}
