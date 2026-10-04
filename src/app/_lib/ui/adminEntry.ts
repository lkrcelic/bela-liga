import {AdminHand, MANUAL_HAND_MAX, PadHand} from "@/app/_interfaces/adminHand";
import {ANNOUNCEMENT_POINTS, AnnouncementName, COMPLETE_VICTORY_POINTS, computeHandTotals, HAND_POINTS, Side} from "@/app/_lib/bela/scoring";

// Hand entry on the admin scorepad. Kept in local state (not the players' persisted stores), so an admin editing
// a table never touches a hand a player is entering on the same device.
//   std: a normal hand (caller, zvanja, game points adding up to 162, or Štiglja)
//   man: "Ručni unos", just each team's points, without zvanja and without the 162 limit

export const ZVANJA = [20, 50, 100, 150, 200] as const;
export type Zvanje = (typeof ZVANJA)[number];
type Counts = Record<Zvanje, number>;

export type EntryState = {
  mode: "std" | "man";
  caller: Side | null;
  active: Side;
  points: [number, number];
  // the next digit starts a new number (after switching team or opening a hand)
  fresh: boolean;
  stiglja: boolean;
  zvanja: {1: Counts; 2: Counts};
};

const noZvanja = (): Counts => ({20: 0, 50: 0, 100: 0, 150: 0, 200: 0});
const CARDS: Record<Zvanje, number> = {20: 3, 50: 4, 100: 4, 150: 4, 200: 4};
const MAX_CARDS = 16; // a team's two players hold 16 cards
const NAMES: Record<Zvanje, AnnouncementName> = {20: "TWENTY", 50: "FIFTY", 100: "ONE_HUNDRED", 150: "ONE_HUNDRED_FIFTY", 200: "TWO_HUNDRED"};

export function blankEntry(mode: EntryState["mode"] = "std"): EntryState {
  return {mode, caller: null, active: 1, points: [0, 0], fresh: true, stiglja: false, zvanja: {1: noZvanja(), 2: noZvanja()}};
}

const idx = (side: Side) => side - 1;

export function typeDigit(s: EntryState, digit: number): EntryState {
  const i = idx(s.active);
  const value = (s.fresh ? 0 : s.points[i]) * 10 + digit;
  if (s.mode === "man") {
    if (value > MANUAL_HAND_MAX) return s;
    const points: [number, number] = [...s.points];
    points[i] = value;
    return {...s, points, fresh: false};
  }
  if (s.stiglja || value > HAND_POINTS) return s;
  const points: [number, number] = [0, 0];
  points[i] = value;
  points[1 - i] = HAND_POINTS - value;
  return {...s, points, fresh: false};
}

export const setActive = (s: EntryState, side: Side): EntryState => ({...s, active: side, fresh: true});
export const setCaller = (s: EntryState, side: Side): EntryState => ({...s, caller: side});
export const clearPoints = (s: EntryState): EntryState => ({...s, points: [0, 0], stiglja: false, fresh: true});

// Štiglja: the active team took every trick (252 : 0)
export function setStiglja(s: EntryState): EntryState {
  if (s.mode !== "std") return s;
  const points: [number, number] = [0, 0];
  points[idx(s.active)] = COMPLETE_VICTORY_POINTS;
  return {...s, points, stiglja: true, fresh: true};
}

export const cardsOf = (c: Counts) => ZVANJA.reduce((sum, v) => sum + c[v] * CARDS[v], 0);
export const zvanjaPoints = (c: Counts) => ZVANJA.reduce((sum, v) => sum + c[v] * v, 0);

export function addZvanje(s: EntryState, v: Zvanje): EntryState {
  if (s.mode !== "std") return s;
  const team = s.zvanja[s.active];
  if (cardsOf(team) + CARDS[v] > MAX_CARDS) return s;
  return {...s, zvanja: {...s.zvanja, [s.active]: {...team, [v]: team[v] + 1}}};
}

export const clearZvanja = (s: EntryState): EntryState => ({...s, zvanja: {...s.zvanja, [s.active]: noZvanja()}});

// Switching between normal and manual entry keeps the points typed so far; zvanja and Štiglja are dropped
export const switchMode = (s: EntryState, mode: EntryState["mode"]): EntryState =>
  mode === s.mode ? s : {...s, mode, stiglja: false, fresh: true, zvanja: {1: noZvanja(), 2: noZvanja()}};

export function canSave(s: EntryState): boolean {
  if (s.mode === "man") return s.points[0] > 0 || s.points[1] > 0;
  if (s.caller == null) return false;
  return s.stiglja || s.points[0] + s.points[1] === HAND_POINTS;
}

// What the totals will be once saved (the server computes the same)
export function previewTotals(s: EntryState): [number, number] {
  if (s.mode === "man") return s.points;
  const totals = computeHandTotals({
    gamePoints1: s.points[0],
    gamePoints2: s.points[1],
    announcementPoints1: zvanjaPoints(s.zvanja[1]),
    announcementPoints2: zvanjaPoints(s.zvanja[2]),
    trumpCaller: s.caller ?? 1,
    completeVictory: s.stiglja,
  });
  return [totals.totalPoints1, totals.totalPoints2];
}

export function toAdminHand(s: EntryState): AdminHand {
  if (s.mode === "man") return {manual: true, points1: s.points[0], points2: s.points[1]};
  const announcements = ([1, 2] as Side[]).flatMap((team) =>
    ZVANJA.flatMap((v) => Array.from({length: s.zvanja[team][v]}, () => ({team, announcement_type: NAMES[v]})))
  );
  const [total1, total2] = previewTotals(s);
  return {
    manual: false,
    player_pair1_game_points: s.points[0],
    player_pair2_game_points: s.points[1],
    player_pair1_announcement_points: zvanjaPoints(s.zvanja[1]),
    player_pair2_announcement_points: zvanjaPoints(s.zvanja[2]),
    player_pair1_total_points: total1,
    player_pair2_total_points: total2,
    trump_caller_team: s.caller ?? 1,
    pass: true,
    complete_victory: s.stiglja,
    announcements,
  };
}

// A saved hand opened for editing
export function fromPadHand(h: PadHand): EntryState {
  if (h.manual) return {...blankEntry("man"), points: [h.total1, h.total2]};
  const zvanja = {1: noZvanja(), 2: noZvanja()};
  for (const a of h.announcements) {
    const v = ANNOUNCEMENT_POINTS[a.type as AnnouncementName] as Zvanje | undefined;
    if (v) zvanja[a.team][v]++;
  }
  return {...blankEntry("std"), caller: h.caller, points: [h.game1, h.game2], stiglja: h.completeVictory, zvanja};
}
