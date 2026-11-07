"use client";

import useManagePhone from "@/app/_hooks/useManagePhone";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useAuthStore from "@/app/_store/authStore";
import AdminTonight from "@/app/_ui/admin/AdminTonight";
import DesktopHome from "@/app/_ui/home/DesktopHome";
import GuestHome from "@/app/_ui/home/GuestHome";
import PhoneHome from "@/app/_ui/home/PhoneHome";

// Početna; an admin's phone opens on Večer lige instead (admin-mobile 01), unless they switched to "Prikaz igrača".
// Someone without an account gets the guest's Početna ("Gost i poziv" G1, G2), on the phone and the computer.
export default function Home() {
  const isDesktop = useIsDesktop();
  const adminPhone = useManagePhone("league.manage");
  const signedIn = useAuthStore((s) => s.user != null);
  if (!signedIn) return <GuestHome />;
  if (isDesktop) return <DesktopHome />;
  return adminPhone ? <AdminTonight /> : <PhoneHome />;
}
