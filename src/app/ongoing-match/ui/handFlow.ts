"use client";

import {createOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/create";
import {getOngoingMatchAPI, OngoingMatchGoneError} from "@/app/_fetchers/ongoingMatch/getOne";
import {getOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/getOne";
import {updateOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/updateOne";
import {BelaPlayerAnnouncementResponse} from "@/app/_interfaces/belaPlayerAnnouncement";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";

// Hand entry shared by the phone wizard and the desktop entry panel. The entered hand lives in the result and
// announcement stores (persisted, so a reload mid-entry keeps it).

// `hands`: how many hands the board showed when the entry was opened. It rides along to the server, which holds the
// save back (HandsChangedError) when another phone at the table saved a hand meanwhile, so the same hand can't be
// counted twice without the player's word. Left out: no check (the desktop panel, which has the board next to it).
export function startNewHand(matchId: number, hands?: number) {
  useResultStore.getState().resetResult();
  useAnnouncementStore.getState().resetAnnouncements();
  useResultStore.getState().setMatchId(matchId);
  useResultStore.getState().setExpectedHands(hands ?? null);
}

// the hand count this entry started from (null: no check), e.g. to name the hand another phone added
export function handsAtOpen(): number | null {
  return useResultStore.getState().resultData.expected_hands ?? null;
}

// Loads a saved hand into the stores for editing
export async function openHandForEdit(resultId: number) {
  const result = await getOngoingBelaResultAPI(resultId);
  useResultStore.getState().setResultData(result);
  useAnnouncementStore.getState().setTeamsAnnouncements((result.belaPlayerAnnouncements ?? []) as BelaPlayerAnnouncementResponse[]);
  return result;
}

// The phone wizard has three steps (trump caller, zvanja, score). When the scoreboard opens it, the scoreboard is three
// history entries behind the score step, and saving goes back there instead of pushing the scoreboard again, so the
// phone's back button doesn't lead into the finished wizard. Not known after a reload mid-entry.
let wizardOpenedFrom: number | null = null;

export function markWizardOpened(matchId: number) {
  wizardOpenedFrom = matchId;
}

// true once per wizard: the caller may go back three entries to reach the scoreboard
export function takeWizardOrigin(matchId: number): boolean {
  const fromBoard = wizardOpenedFrom === matchId;
  wizardOpenedFrom = null;
  return fromBoard;
}

export function discardHand() {
  useResultStore.getState().resetResult();
  useAnnouncementStore.getState().resetAnnouncements();
}

// Saves the entered hand (new, or an update of `resultId`). Throws with the server's message when it is refused.
// `force`: the player answered "Upiši i ovu" to a hand saved from another phone, so the hand count is left out and
// the hand is saved as it is.
export async function saveHand(matchId: number, resultId?: number | string | null, {force = false}: {force?: boolean} = {}) {
  const result = useResultStore.getState();
  // the announcements entered on the zvanja step, so the saved hand always matches them
  result.updateAnnouncementPoints(useAnnouncementStore.getState().teamsAnnouncements);
  result.setTotalPoints();
  const entry = useResultStore.getState().resultData;
  const data = {...entry, match_id: matchId, expected_hands: force ? null : entry.expected_hands ?? null};

  const saved = resultId
    ? await updateOngoingBelaResultAPI({resultId: String(resultId), result: data})
    : await createOngoingBelaResultAPI({result: data});

  markHand(matchId, resultId ? {flash: Number(resultId)} : {added: saved?.result_id ?? null});
  discardHand();
  return saved;
}

// A hand that wasn't saved: is the match over (Vrijeme partije ran out, or a teammate finished it)? Reading it closes
// it when its time is up.
export async function matchClosed(matchId: number): Promise<boolean> {
  try {
    await getOngoingMatchAPI(matchId);
    return false;
  } catch (error) {
    return error instanceof OngoingMatchGoneError;
  }
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
