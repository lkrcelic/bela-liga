"use client";

import {DesktopOnlyNote} from "@/app/_ui/sp";

// The admin's phone screens of Turniri come with the phone part of the work; until then the phone says it is edited
// on the computer
export default function ManageTournamentPhone({id}: {id: number}) {
  void id;
  return <DesktopOnlyNote />;
}
