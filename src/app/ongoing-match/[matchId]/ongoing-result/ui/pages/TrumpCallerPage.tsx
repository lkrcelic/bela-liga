"use client";

import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";
import {ActionPair, ScreenTitle} from "@/app/_ui/sp";
import {discardHand} from "@/app/ongoing-match/ui/handFlow";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import {CallerCards} from "@/app/ongoing-match/ui/WizardParts";
import {useParams} from "next/navigation";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";

export type ActionProps = {
  actionType: "CREATE" | "UPDATE";
};

// Step 1: which team called trumps
export default function TrumpCallerPage({actionType}: ActionProps) {
  const router = useTransitionRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const sides = useMatchSides();
  const caller = useResultStore((s) => s.resultData.trump_caller_team);
  const setTrumpCallerTeam = useResultStore((s) => s.setTrumpCallerTeam);
  const roundLoaded = useRoundStore((s) => s.roundData?.id != null);

  const base = `/ongoing-match/${params.matchId}/ongoing-result/${actionType === "CREATE" ? "new" : params.resultId}`;

  const back = () => {
    discardHand();
    // the wizard is opened from the scoreboard, so going back keeps the history tidy
    if (window.history.length > 1) router.back();
    else router.push(`/ongoing-match/${params.matchId}`, "back");
  };

  return (
    <>
      <ScreenTitle eyebrow="Korak 1 od 3" title="Izaberi tko je zvao" sx={{pt: 0}} />
      <CallerCards
        names={sides.names}
        caller={caller != null && sides.sides.includes(caller) ? (sides.sides.indexOf(caller) as 0 | 1) : null}
        onPick={(i) => setTrumpCallerTeam(sides.sides[i])}
        disabled={!roundLoaded}
      />
      <ActionPair onBack={back} nextLabel="Dalje" onNext={() => router.push(`${base}/announcement`)} nextDisabled={caller == null} />
    </>
  );
}
