"use client";

import {createOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/create";
import {getOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/getOne";
import {updateOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/updateOne";
import {BelaPlayerAnnouncementResponse} from "@/app/_interfaces/belaPlayerAnnouncement";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";

// Hand entry shared by the phone wizard and the desktop entry panel. The entered hand lives in the result and
// announcement stores (persisted, so a reload mid-entry keeps it).

export function startNewHand(matchId: number) {
  useResultStore.getState().resetResult();
  useAnnouncementStore.getState().resetAnnouncements();
  useResultStore.getState().setMatchId(matchId);
}

// Loads a saved hand into the stores for editing
export async function openHandForEdit(resultId: number) {
  const result = await getOngoingBelaResultAPI(resultId);
  useResultStore.getState().setResultData(result);
  useAnnouncementStore.getState().setTeamsAnnouncements((result.belaPlayerAnnouncements ?? []) as BelaPlayerAnnouncementResponse[]);
  return result;
}

export function discardHand() {
  useResultStore.getState().resetResult();
  useAnnouncementStore.getState().resetAnnouncements();
}

// Saves the entered hand (new, or an update of `resultId`). Throws with the server's message when it is refused.
export async function saveHand(matchId: number, resultId?: number | string | null) {
  const result = useResultStore.getState();
  // the announcements entered on the zvanja step, so the saved hand always matches them
  result.updateAnnouncementPoints(useAnnouncementStore.getState().teamsAnnouncements);
  result.setTotalPoints();
  const data = {...useResultStore.getState().resultData, match_id: matchId};

  const saved = resultId
    ? await updateOngoingBelaResultAPI({resultId: String(resultId), result: data})
    : await createOngoingBelaResultAPI({result: data});

  markHand(matchId, resultId ? {flash: Number(resultId)} : {added: saved?.result_id ?? null});
  discardHand();
  return saved;
}

// Remembers which hand was just added or edited, so the scoreboard can animate it when it loads again
type Mark = {added?: number | null; flash?: number};
const marks = new Map<number, Mark & {at: number}>();

function markHand(matchId: number, mark: Mark) {
  marks.set(matchId, {...mark, at: Date.now()});
}

// Read once: the mark is cleared, and ignored when older than 10 s
export function takeHandMark(matchId: number): Mark | null {
  const m = marks.get(matchId);
  marks.delete(matchId);
  if (!m || Date.now() - m.at > 10000) return null;
  return m;
}

// Totals shown before leaving the scoreboard, so the count-up starts from them when it comes back
const lastTotals = new Map<number, [number, number]>();
export function rememberTotals(matchId: number, totals: [number, number]) {
  lastTotals.set(matchId, totals);
}
export function previousTotals(matchId: number): [number, number] | undefined {
  return lastTotals.get(matchId);
}
