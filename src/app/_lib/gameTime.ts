// Vrijeme partije: every match has a time limit, 35 minutes unless its league or tournament says otherwise, counted from
// the start of the match (Tko igra · Započni igru for the first, the moment it opens for the second). When the time is
// up the match ends at once with the score entered then: the team with more points wins it, and a hand still being
// entered isn't taken. With the score level one more hand is played, and the match ends after it (a hand can't leave
// the score level: the tied hand is a fall for one team). Framework free so it can be unit tested.

export const GAME_MINUTES_DEFAULT = 35;
export const GAME_MINUTES_MIN = 5;
export const GAME_MINUTES_MAX = 180;
export const GAME_MINUTES_ERROR = `Vrijeme partije je od ${GAME_MINUTES_MIN} do ${GAME_MINUTES_MAX} minuta.`;

// the warning on the scorepad's main screen ("Još 5:00 do kraja partije"), and the red timer from then on
export const TIME_WARNING_MS = 5 * 60_000;

// when a match that starts now runs out of time
export function matchDeadline(startedAt: Date, minutes: number): Date {
  return new Date(startedAt.getTime() + minutes * 60_000);
}

// on_time: before the time is up (or no limit); extra_hand: the score is level after the time, so one more hand is
// played; too_late: refused (the match ends with the score entered when the time was up)
export type HandTiming = "on_time" | "extra_hand" | "too_late";

export function handTiming({now, endsAt, tied}: {now: Date; endsAt: Date | null; tied: boolean}): HandTiming {
  if (!endsAt || now.getTime() <= endsAt.getTime()) return "on_time";
  return tied ? "extra_hand" : "too_late";
}

// After the extra hand of a level score: the match ends now unless the score is still level (then one more hand)
export function closesAfterHand(timing: HandTiming, tied: boolean): boolean {
  return timing === "extra_hand" && !tied;
}

// A match nobody is finishing: closed by itself as soon as the time is up, unless the score is level
export function closesByTime({now, endsAt, tied}: {now: Date; endsAt: Date | null; tied: boolean}): boolean {
  return endsAt != null && !tied && now.getTime() > endsAt.getTime();
}

// The winner of a match closed by time: the team with more points (1 or 2); null when level
export function timeWinner(score1: number, score2: number): 1 | 2 | null {
  if (score1 === score2) return null;
  return score1 > score2 ? 1 : 2;
}

// "0:07", "23:41", "1:05:12": how long a Kolo has been going (the admin's Kolo timer; never below 0:00)
export function elapsedLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

// "52 min", "1 h 7 min", "2 h": how long a played Kolo lasted, to the minute
export function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

// "23:41", "5:00", "0:07": the time left on the scorepad (never below 0:00)
export function clockLabel(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
