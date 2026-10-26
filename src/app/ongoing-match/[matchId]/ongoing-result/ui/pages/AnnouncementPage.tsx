"use client";

import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";
import {ActionPair} from "@/app/_ui/sp";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import {ZvanjaButtons} from "@/app/ongoing-match/ui/WizardParts";
import {useParams} from "next/navigation";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {ActionProps} from "./TrumpCallerPage";


// Step 2: zvanja (announcements) for the team selected in the header
export default function AnnouncementPage({actionType}: ActionProps) {
  const router = useTransitionRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const sides = useMatchSides();
  const activeTeam = useResultStore((s) => s.resultData.activeTeam);
  const teamsAnnouncements = useAnnouncementStore((s) => s.teamsAnnouncements);
  const noAnnouncements = useAnnouncementStore((s) => s.noAnnouncements);
  const {setAnnouncement, resetTeamAnnouncements} = useAnnouncementStore.getState();

  // a tournament "bez zvanja": only one bela a hand
  const declarations = useRoundStore((s) => s.roundData?.declarations) ?? true;
  const twenties = ([1, 2] as const).reduce((n, t) => n + (teamsAnnouncements[t]?.announcementCounts?.[20] ?? 0), 0);
  const side = activeTeam === "team2" ? 2 : 1;
  const index = sides.sides.indexOf(side);
  const counts = teamsAnnouncements[side]?.announcementCounts ?? {};
  const base = `/ongoing-match/${params.matchId}/ongoing-result/${actionType === "CREATE" ? "new" : params.resultId}`;

  return (
    <>
      <ZvanjaButtons
        label={`Zvanja: ${sides.names[index]}`}
        counts={counts}
        team={index === 1 ? 1 : 0}
        onAdd={(v) => setAnnouncement(side, v)}
        onClear={() => resetTeamAnnouncements(side)}
        declarations={declarations}
        twenties={twenties}
      />
      <ActionPair
        onBack={() => router.back()}
        nextLabel={noAnnouncements ? "Nema Zvanja" : "Dalje"}
        onNext={() => router.push(`${base}/score`)}
      />
    </>
  );
}
