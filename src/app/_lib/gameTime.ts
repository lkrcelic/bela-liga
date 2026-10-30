// Vrijeme partije: every match has a time limit, 35 minutes unless its league or tournament says otherwise, counted from
// the start of the match (Tko igra · Započni igru for the first, the moment it opens for the second). When the time is
// up the match ends with the score entered then: the team with more points wins it. A hand being entered when the
// time ran out is still taken for a short while; with the score level one more hand is played, and the match ends
// after it (a hand can't leave the score level: the tied hand is a fall for one team). Framework free so it can be
// unit tested.

export const GAME_MINUTES_DEFAULT = 35;
export const GAME_MINUTES_MIN = 5;
export const GAME_MINUTES_MAX = 180;
export const GAME_MINUTES_ERROR = `Vrijeme partije je od ${GAME_MINUTES_MIN} do ${GAME_MINUTES_MAX} minuta.`;

// the warning on the scorepad's main screen ("Još 5:00 do kraja partije"), and the red timer from then on
export const TIME_WARNING_MS = 5 * 60_000;

// a hand whose entry started before the time was up is still taken this long after it; the match is closed by itself
// only after it
export const LATE_HAND_GRACE_MS = 2 * 60_000;

// when a match that starts now runs out of time
export function matchDeadline(startedAt: Date, minutes: number): Date {
  return new Date(startedAt.getTime() + minutes * 60_000);
}

// on_time: before the time is up (or no limit); late_entry: its entry started in time and it comes within the grace;
// extra_hand: the score is level after the time, so one more hand is played; too_late: refused
export type HandTiming = "on_time" | "late_entry" | "extra_hand" | "too_late";

export function handTiming({now, endsAt, tied, entryStartedAt}: {now: Date; endsAt: Date | null; tied: boolean; entryStartedAt?: Date | null}): HandTiming {
  if (!endsAt || now.getTime() <= endsAt.getTime()) return "on_time";
  if (tied) return "extra_hand";
  if (entryStartedAt && entryStartedAt.getTime() <= endsAt.getTime() && now.getTime() <= endsAt.getTime() + LATE_HAND_GRACE_MS) {
    return "late_entry";
  }
  return "too_late";
}

// After a hand is saved past the time: the match ends now unless the score is level (then one more hand)
export function closesAfterHand(timing: HandTiming, tied: boolean): boolean {
  return (timing === "late_entry" || timing === "extra_hand") && !tied;
}

// A match nobody is finishing: closed by itself once the time and the grace are over and the score isn't level
export function closesByTime({now, endsAt, tied}: {now: Date; endsAt: Date | null; tied: boolean}): boolean {
  return endsAt != null && !tied && now.getTime() > endsAt.getTime() + LATE_HAND_GRACE_MS;
}

// The winner of a match closed by time: the team with more points (1 or 2); null when level
export function timeWinner(score1: number, score2: number): 1 | 2 | null {
  if (score1 === score2) return null;
  return score1 > score2 ? 1 : 2;
}

// "23:41", "5:00", "0:07": the time left on the scorepad (never below 0:00)
export function clockLabel(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
