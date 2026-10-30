// A tournament's day. Potvrda dolaska: a team confirms it has come (Tu smo) from Okupljanje until Početak; at the start
// time the teams that didn't become inactive (still signed up) and the confirmed teams of the waiting list come in, in
// waiting-list order, as long as there are fewer active teams than the limit. Nedolazak za stol: a published table where
// no game has started gets the question "Jesu li … za stolom?" 5 minutes after its Kolo went out, it can be answered
// from 8 minutes, and at 10 minutes the match is skipped. All times are the server's. Framework free so it can be unit
// tested.
import {leagueMoment} from "@/app/_lib/dates";

// without an Okupljanje the confirmation opens this long before the start
export const ARRIVAL_DEFAULT_MS = 30 * 60_000;

export type ArrivalWindow = {opens: Date; closes: Date};

// When Tu smo can be pressed; null for a tournament without a start time (it has no confirmation)
export function arrivalWindow(t: {date: string; gathering_time: string | null; start_time: string | null}): ArrivalWindow | null {
  if (!t.start_time) return null;
  const closes = leagueMoment(t.date, t.start_time);
  const gathering = t.gathering_time ? leagueMoment(t.date, t.gathering_time) : null;
  const opens = gathering && gathering.getTime() < closes.getTime() ? gathering : new Date(closes.getTime() - ARRIVAL_DEFAULT_MS);
  return {opens, closes};
}

// none: no confirmation (no start time); before: not open yet; open: Tu smo works; closed: the start time has come
export type ArrivalPhase = "none" | "before" | "open" | "closed";

export function arrivalPhase(window: ArrivalWindow | null, now: Date, closedAt: Date | null = null): ArrivalPhase {
  if (!window) return "none";
  if (closedAt || now.getTime() >= window.closes.getTime()) return "closed";
  return now.getTime() < window.opens.getTime() ? "before" : "open";
}

// A team's entry as the day's rules read it
export type DayEntry = {
  teamId: number;
  status: "REGISTERED" | "WAITING";
  registeredAt: Date;
  arrived: boolean;
  active: boolean;
  excluded: boolean;
};

const byTime = (a: DayEntry, b: DayEntry) => a.registeredAt.getTime() - b.registeredAt.getTime() || a.teamId - b.teamId;

// The teams that play the next Kolo: in, active and not excluded
export const playing = (e: DayEntry) => e.status === "REGISTERED" && e.active && !e.excluded;

// The confirmed teams of the waiting list that come in now, in order, while there are fewer playing teams than the limit
export function admittedFromWaiting(entries: DayEntry[], maxTeams: number | null): number[] {
  const waiting = entries.filter((e) => e.status === "WAITING" && e.arrived && !e.excluded).sort(byTime);
  if (maxTeams == null) return waiting.map((e) => e.teamId);
  const room = maxTeams - entries.filter(playing).length;
  return waiting.slice(0, Math.max(0, room)).map((e) => e.teamId);
}

// The start time's switch: the teams in that didn't confirm become inactive, then the confirmed waiting teams come in
// while there is room (the inactive ones don't take a place)
export function startSwitch(entries: DayEntry[], maxTeams: number | null): {inactive: number[]; admitted: number[]} {
  const inactive = entries.filter((e) => playing(e) && !e.arrived).map((e) => e.teamId);
  const after = entries.map((e) => (inactive.includes(e.teamId) ? {...e, active: false} : e));
  return {inactive, admitted: admittedFromWaiting(after, maxTeams)};
}

// There is room for one more playing team
export function hasRoom(entries: DayEntry[], maxTeams: number | null): boolean {
  return maxTeams == null || entries.filter(playing).length < maxTeams;
}

// ---------- Nedolazak za stol ----------

export const NO_SHOW_ASK_MS = 5 * 60_000;
export const NO_SHOW_UNLOCK_MS = 8 * 60_000;
export const NO_SHOW_SKIP_MS = 10 * 60_000;

export type NoShowTimes = {ask: Date; unlock: Date; skip: Date};

// From the moment the table's Kolo went out
export function noShowTimes(publishedAt: Date): NoShowTimes {
  const at = (ms: number) => new Date(publishedAt.getTime() + ms);
  return {ask: at(NO_SHOW_ASK_MS), unlock: at(NO_SHOW_UNLOCK_MS), skip: at(NO_SHOW_SKIP_MS)};
}

// waiting: before the question; asking: the question is up, its buttons locked; answerable: Da / Ne work; due: no
// answer in time, the match is skipped
export type NoShowStep = "waiting" | "asking" | "answerable" | "due";

export function noShowStep(publishedAt: Date, now: Date): NoShowStep {
  const t = now.getTime() - publishedAt.getTime();
  if (t < NO_SHOW_ASK_MS) return "waiting";
  if (t < NO_SHOW_UNLOCK_MS) return "asking";
  if (t < NO_SHOW_SKIP_MS) return "answerable";
  return "due";
}

// A no-show is answered with these points for every match of the table (the answering team first)
export const NO_SHOW_SCORE: [number, number] = [1001, 700];

// A team that didn't come in Kolo 1 (it had confirmed arrival) can't sign up for tournaments for this long
export const NO_SHOW_BAN_MONTHS = 1;
