"use client";

import useResultStore from "@/app/_store/bela/resultStore";
import {color, font} from "@/app/_styles/tokens";
import {ActionPair, buttonBase, ErrorNote} from "@/app/_ui/sp";
import {saveHand, takeWizardOrigin} from "@/app/ongoing-match/ui/handFlow";
import {Box} from "@mui/material";
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

  const key = {
    ...buttonBase,
    height: 66,
    borderRadius: "16px",
    background: color.card,
    color: color.ink,
    fontFamily: font.display,
    fontSize: 30,
    fontWeight: 700,
    boxShadow: "0 1px 2px rgba(31,36,51,.06)",
    transition: "transform 100ms ease, opacity 200ms ease",
    "&:active:not(:disabled)": {transform: "scale(.95)", background: "#EFEAE0"},
    "&:disabled": {opacity: 0.35},
  } as const;

  return (
    <>
      <Box sx={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", pb: "16px"}}>
        <Box role="group" aria-label="Bodovi igre" sx={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px"}}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <Box key={d} component="button" type="button" onClick={() => setGamePoints(d)} disabled={keysOff} sx={key}>
              {d}
            </Box>
          ))}
          <Box
            component="button"
            type="button"
            onClick={setCompleteVictory}
            aria-pressed={keysOff}
            sx={{...key, background: color.cream, color: color.navy, fontFamily: font.body, fontSize: 17, boxShadow: "none"}}
          >
            Štiglja
          </Box>
          <Box component="button" type="button" onClick={() => setGamePoints(0)} disabled={keysOff} sx={key}>
            0
          </Box>
          <Box
            component="button"
            type="button"
            onClick={resetScore}
            aria-label="Obriši bodove"
            sx={{...key, background: "transparent", border: `2px solid ${color.borderStrong}`, color: color.navy, fontSize: 26, boxShadow: "none"}}
          >
            X
          </Box>
        </Box>
      </Box>
      {error && <ErrorNote sx={{mb: "10px"}}>{error}</ErrorNote>}
      <ActionPair onBack={() => router.back()} nextLabel="Spremi" onNext={save} nextDisabled={empty} nextLoading={saving} />
    </>
  );
}
