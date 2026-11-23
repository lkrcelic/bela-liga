// A tournament's day. Potvrda dolaska: a team confirms it has come (Tu smo) from Okupljanje until Početak; at the start
// time the teams that didn't become inactive (still signed up) and the confirmed teams of the waiting list come in, in
// waiting-list order, as long as there are fewer active teams than the limit. Nedolazak za stol: a published table where
// no game has started gets the question "Jesu li … za stolom?" 4 minutes after its Kolo went out, Da, tu su
// works at once and Ne, nisu došli from 6 minutes, and at 10 minutes the match is skipped. All times are the server's. Framework free so it can be unit
// tested.
import {leagueDateString, leagueMoment, leagueNightString} from "@/app/_lib/dates";
import {isStartTime} from "@/app/_lib/nights";

export const TIME_ERROR = "Vrijeme mora biti od 00:00 do 23:59.";
export const GATHERING_REQUIRED = "Upiši vrijeme okupljanja.";
export const START_REQUIRED = "Upiši vrijeme početka.";
export const GATHERING_AFTER_START = "Okupljanje mora biti prije početka.";

// Every tournament has an Okupljanje and a Početak ("HH:MM"), the gathering before the start (the user, 16.11.2026),
// so every tournament has Potvrda dolaska. The form and the server say the same, field by field; {} when both are fine
export function tournamentTimesErrors(gathering: string | null | undefined, start: string | null | undefined): {gathering?: string; start?: string} {
  const e: {gathering?: string; start?: string} = {};
  const g = gathering?.trim() ?? "";
  const s = start?.trim() ?? "";
  if (!g) e.gathering = GATHERING_REQUIRED;
  else if (!isStartTime(g)) e.gathering = TIME_ERROR;
  if (!s) e.start = START_REQUIRED;
  else if (!isStartTime(s)) e.start = TIME_ERROR;
  if (!e.gathering && !e.start && g >= s) e.gathering = GATHERING_AFTER_START;
  return e;
}

// The days a tournament can be played on now (as stored, UTC midnight): the calendar day, and until 08:00 also the
// league night before, so a tournament that runs past midnight keeps its clock
export function tournamentDays(now: Date = new Date()): Date[] {
  return Array.from(new Set([leagueDateString(now), leagueNightString(now)])).map((d) => new Date(`${d}T00:00:00.000Z`));
}

export const isTournamentDay = (date: Date, now: Date = new Date()) => tournamentDays(now).some((d) => d.getTime() === date.getTime());

// without an Okupljanje the confirmation opens this long before the start
export const ARRIVAL_DEFAULT_MS = 30 * 60_000;

export type ArrivalWindow = {opens: Date; closes: Date};

// When Tu smo can be pressed; null for a tournament without a start time (one made before 16.11.2026: no confirmation)
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

// Složi Kolo with fewer than two of them (koloTeams)
export const TOO_FEW_TEAMS = "Za kolo trebaju barem dvije aktivne ekipe s potvrđenim dolaskom.";

// The teams a Kolo is made from, in sign-up order: playing and confirmed (Tu smo, or the admin's Označi dolazak). A team
// that hasn't confirmed is never paired, whenever the Kolo is made (DECISIONS 103). Before the start time's switch has
// run (a Kolo 1 made before Početak) that is who the switch would leave playing: the confirmed teams in, and the
// confirmed waiting ones while there is room; publishing that Kolo runs the switch. A tournament without a start time
// has no Potvrda dolaska (nobody can confirm), so its playing teams are paired as they are.
export function koloTeams(entries: DayEntry[], maxTeams: number | null, at: {confirmation: boolean; switched: boolean}): number[] {
  if (!at.confirmation) return entries.filter(playing).sort(byTime).map((e) => e.teamId);
  let after = entries;
  if (!at.switched) {
    const {inactive, admitted} = startSwitch(entries, maxTeams);
    after = entries.map((e) =>
      inactive.includes(e.teamId) ? {...e, active: false} : admitted.includes(e.teamId) ? {...e, status: "REGISTERED" as const, active: true} : e
    );
  }
  return after.filter((e) => playing(e) && e.arrived).sort(byTime).map((e) => e.teamId);
}

// There is room for one more playing team
export function hasRoom(entries: DayEntry[], maxTeams: number | null): boolean {
  return maxTeams == null || entries.filter(playing).length < maxTeams;
}

// ---------- Nedolazak za stol ----------

// The question comes early because the team that is at the table waits for it, and the two minutes before Ne, nisu došli
// are the whole buffer against an impatient answer: a team walking to its table is still in time (DECISIONS #89)
export const NO_SHOW_ASK_MS = 4 * 60_000;
export const NO_SHOW_UNLOCK_MS = 6 * 60_000;
export const NO_SHOW_SKIP_MS = 10 * 60_000;

export type NoShowTimes = {ask: Date; unlock: Date; skip: Date};

// From the moment the table's Kolo went out
export function noShowTimes(publishedAt: Date): NoShowTimes {
  const at = (ms: number) => new Date(publishedAt.getTime() + ms);
  return {ask: at(NO_SHOW_ASK_MS), unlock: at(NO_SHOW_UNLOCK_MS), skip: at(NO_SHOW_SKIP_MS)};
}

// waiting: before the question; asking: the question is up, only Da works; answerable: Da / Ne work; due: no
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
