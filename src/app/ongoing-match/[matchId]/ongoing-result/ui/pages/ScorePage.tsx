"use client";

import useResultStore from "@/app/_store/bela/resultStore";
import {ActionPair, ErrorNote} from "@/app/_ui/sp";
import {saveHand, takeWizardOrigin} from "@/app/ongoing-match/ui/handFlow";
import {PointsKeypad} from "@/app/ongoing-match/ui/WizardParts";
import {useParams} from "next/navigation";
import {navigateWithTransition, useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useState} from "react";
import {ActionProps} from "./TrumpCallerPage";

// Step 3: game points for the selected team; the other team gets the rest of 162
export default function ScorePage({actionType}: ActionProps) {
  const router = useTransitionRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const result = useResultStore((s) => s.resultData);
  const {setGamePoints, resetScore, setCompleteVictory} = useResultStore.getState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = !result.player_pair1_game_points && !result.player_pair2_game_points;
  const keysOff = !!result.complete_victory;

  const save = async () => {
    if (saving || empty) return;
    setSaving(true);
    setError(null);
    try {
      await saveHand(Number(params.matchId), actionType === "UPDATE" ? params.resultId : null);
      if (takeWizardOrigin(Number(params.matchId))) navigateWithTransition(() => window.history.go(-3), "back");
      else router.replace(`/ongoing-match/${params.matchId}`, "back");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spremanje nije uspjelo.");
      setSaving(false);
    }
  };

  return (
    <>
      <PointsKeypad onDigit={setGamePoints} onStiglja={setCompleteVictory} stiglja={keysOff} onClear={resetScore} keysOff={keysOff} />
      {error && <ErrorNote sx={{mb: "10px"}}>{error}</ErrorNote>}
      <ActionPair onBack={() => router.back()} nextLabel="Spremi" onNext={save} nextDisabled={empty} nextLoading={saving} />
    </>
  );
}
