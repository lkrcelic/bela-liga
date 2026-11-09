"use client";

import {HandsChangedError} from "@/app/_fetchers/ongoingBelaResult/create";
import {getOngoingMatchAPI} from "@/app/_fetchers/ongoingMatch/getOne";
import useResultStore from "@/app/_store/bela/resultStore";
import {ActionPair, ConfirmSheet, ErrorNote} from "@/app/_ui/sp";
import {discardHand, handsAtOpen, matchClosed, saveHand, takeWizardOrigin} from "@/app/ongoing-match/ui/handFlow";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import {PointsKeypad} from "@/app/ongoing-match/ui/WizardParts";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import {useParams} from "next/navigation";
import {navigateWithTransition, useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useState} from "react";
import {ActionProps} from "./TrumpCallerPage";

export const SAME_HAND_TITLE = "Je li ovo nova igra?";

// Step 3: game points for the selected team; the other team gets the rest of 162
export default function ScorePage({actionType}: ActionProps) {
  const router = useTransitionRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const result = useResultStore((s) => s.resultData);
  const {setGamePoints, resetScore, setCompleteVictory} = useResultStore.getState();
  const sides = useMatchSides();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // a hand was saved from another phone at the table while this one was entering its own: ask before saving
  const [sameHand, setSameHand] = useState<string | null>(null);

  const empty = !result.player_pair1_game_points && !result.player_pair2_game_points;
  const keysOff = !!result.complete_victory;

  // The wizard is three history entries deep, so the board is reached by going back; `fromSheet`: the question's sheet
  // has an entry of its own (overlayHistory), so the board is no longer exactly three back and is opened by address.
  const toBoard = (fromSheet = false) => {
    const back = takeWizardOrigin(Number(params.matchId));
    if (back && !fromSheet) navigateWithTransition(() => window.history.go(-3), "back");
    else router.replace(`/ongoing-match/${params.matchId}`, "back");
  };

  // What the other phone entered, in this phone's left/right order, so the player recognises the hand
  const otherPhoneText = async (fallback: string) => {
    const base = handsAtOpen();
    if (base == null) return fallback;
    try {
      const match = await getOngoingMatchAPI(Number(params.matchId));
      const added = (match.belaResults ?? []).slice(base);
      const last = added[added.length - 1];
      if (!last) return fallback;
      const left = sides.left === 1 ? last.player_pair1_total_points : last.player_pair2_total_points;
      const right = sides.left === 1 ? last.player_pair2_total_points : last.player_pair1_total_points;
      const hand = `igra ${base + added.length} (${left} : ${right})`;
      return added.length === 1
        ? `S drugog mobitela je upisana ${hand}. Ako je to ova ista igra, odustani.`
        : `S drugog mobitela su upisane nove igre, zadnja je ${hand}. Ako je ona ova ista, odustani.`;
    } catch {
      return fallback;
    }
  };

  const save = async (force = false) => {
    if (saving || empty) return;
    const fromSheet = sameHand != null;
    setSaving(true);
    setError(null);
    try {
      await saveHand(Number(params.matchId), actionType === "UPDATE" ? params.resultId : null, {force});
      toBoard(fromSheet);
    } catch (e) {
      if (e instanceof HandsChangedError) {
        setSameHand(await otherPhoneText(e.message));
        setSaving(false);
        return;
      }
      // the time ran out while the hand was entered (or a teammate finished the match): the hand doesn't count, and
      // the board follows the match to the next one or the table's result
      if (await matchClosed(Number(params.matchId))) {
        discardHand();
        toBoard(fromSheet);
        return;
      }
      setError(e instanceof Error ? e.message : "Spremanje nije uspjelo.");
      setSaving(false);
    }
  };

  // Odustani (and closing the sheet): the hand was already entered from the other phone, so this copy is dropped
  const dropSameHand = () => {
    setSameHand(null);
    discardHand();
    toBoard(true);
  };

  return (
    <>
      <PointsKeypad onDigit={setGamePoints} onStiglja={setCompleteVictory} stiglja={keysOff} onClear={resetScore} keysOff={keysOff} />
      {error && <ErrorNote sx={{mb: "10px"}}>{error}</ErrorNote>}
      <ActionPair onBack={() => router.back()} nextLabel="Spremi" onNext={() => save()} nextDisabled={empty} nextLoading={saving} />
      <ConfirmSheet
        open={sameHand != null}
        onClose={dropSameHand}
        onConfirm={() => save(true)}
        title={SAME_HAND_TITLE}
        text={sameHand ?? ""}
        action="Upiši i ovu"
        icon={<HelpRoundedIcon />}
        danger={false}
        busy={saving}
      />
    </>
  );
}
