// Potvrda dolaska in the league (DECISIONS #73): on a night of the league that has a start time, a team says it has
// come (Tu smo) from Okupljanje (without one, half an hour before the start; #80) until the night is over: when its
// Broj kola are all finished (#94), at 08:00 at the latest. Novo kolo pairs the teams that
// are here, and the admin's switches there mark a team here or not (a team without a phone). Before the start a team
// takes its confirmation back (Ipak otkazujemo), after it it leaves (Odlazimo) and is out of the next Novo kolo; Tu smo
// again brings it back. Framework free so it can be unit tested.
import {leagueMoment, NIGHT_ENDS_AT_HOUR} from "@/app/_lib/dates";

// without an Okupljanje, Tu smo opens this long before the night's start
export const LEAGUE_ARRIVAL_OPENS_MS = 30 * 60_000;

export type LeagueArrivalWindow = {opens: Date; start: Date; closes: Date};

const nextDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

// When Tu smo can be pressed on a night (YYYY-MM-DD) that starts at startTime ("HH:MM") and gathers from gatheringTime
// (an Okupljanje that isn't before the start doesn't count); null for a night without a start time, which has no
// confirmation (as a tournament without Početak)
export function leagueArrivalWindow(night: string, startTime: string | null | undefined, gatheringTime?: string | null): LeagueArrivalWindow | null {
  if (!startTime) return null;
  const start = leagueMoment(night, startTime);
  const gathering = gatheringTime ? leagueMoment(night, gatheringTime) : null;
  const opens = gathering && gathering.getTime() < start.getTime() ? gathering : new Date(start.getTime() - LEAGUE_ARRIVAL_OPENS_MS);
  const ends = `${String(NIGHT_ENDS_AT_HOUR).padStart(2, "0")}:00`;
  return {opens, start, closes: leagueMoment(nextDay(night), ends)};
}

// before: Tu smo isn't open yet; open: until the start (Tu smo, Ipak otkazujemo); started: the night is on (Tu smo ·
// Želimo uskočiti, Odlazimo); over: the night has ended
export type LeagueArrivalPhase = "before" | "open" | "started" | "over";

type Moment = Date | string;
const ms = (m: Moment) => new Date(m).getTime();

export function leagueArrivalPhase(w: {opens: Moment; start: Moment; closes: Moment}, now: Date): LeagueArrivalPhase {
  const t = now.getTime();
  if (t < ms(w.opens)) return "before";
  if (t < ms(w.start)) return "open";
  if (t < ms(w.closes)) return "started";
  return "over";
}

// The night's published rounds reach its Broj kola: its last round is out
export const lastRoundOut = (publishedRounds: number, roundsPerNight: number): boolean => publishedRounds >= roundsPerNight;

// The night's finished rounds (every table closed) reach its Broj kola and no published round is still being played (a
// Kolo beyond Broj kola keeps the night going: DECISIONS 104): the night is over for Potvrda dolaska before 08:00, so no
// team sees Odlazimo or Tu smo · Želimo uskočiti any more. publishedRounds: left out, every round counted is finished.
export const nightPlayedOut = (finishedRounds: number, roundsPerNight: number, publishedRounds: number = finishedRounds): boolean =>
  finishedRounds >= roundsPerNight && finishedRounds === publishedRounds;

// a table is closed only when open is false (a row read without the field counts as open)
type NightTable = {round_number?: number | null; open?: boolean; location_slot?: number | null};

// A place's Kolos tonight (slot null: every table of the night, as on a one-place night): how many are published and
// how many are finished (every table closed). A place's Kolos are its own numbers.
export function placeKolos(tables: NightTable[], slot: number | null): {published: number; finished: number} {
  const open = new Map<number | null, boolean>();
  for (const t of tables) {
    if (slot != null && t.location_slot !== slot) continue;
    open.set(t.round_number ?? null, (open.get(t.round_number ?? null) ?? false) || t.open !== false);
  }
  return {published: open.size, finished: Array.from(open.values()).filter((o) => !o).length};
}

// Tonight's night is over at the place shown, before 08:00 makes it an earlier night (DECISIONS 104): it has played its
// Broj kola (Kolos beyond it count too), as Potvrda dolaska ends there; Sve on a two-place night once both places have.
// Between two Kolos every table is closed too, so that alone isn't the end. night: the night's planned rounds at the
// first place and the second place's own (null: the same); without the night's row (tables but no night) every table
// closed is the end, as before.
export function tonightOver(
  tables: NightTable[],
  night: {planned_rounds: number; second_rounds_per_night: number | null; two_places: boolean} | null,
  place: number | null,
): boolean {
  if (tables.length === 0) return false;
  if (!night) return tables.every((t) => t.open === false);
  const slots = place != null ? [place] : night.two_places ? [1, 2] : [null];
  return slots.every((slot) => {
    const {published, finished} = placeKolos(tables, slot);
    return nightPlayedOut(finished, slot === 2 ? night.second_rounds_per_night ?? night.planned_rounds : night.planned_rounds, published);
  });
}

// A team is here: it came (a row) and hasn't left since
export const isHere = (a: {left_at: Moment | null} | null | undefined): boolean => a != null && a.left_at == null;

// A team waits for the admin (Javi se adminu) on a night played at two places until Podjela puts it at one of them
// (slot null: not assigned); on a one-place night every team of the league can press Tu smo, as before
export const asksAdmin = (twoPlaces: boolean, slot: number | null | undefined): boolean => twoPlaces && slot == null;

// What a team's own button does: confirm is Tu smo (arrive, or nothing for a team already here); leave is Ipak
// otkazujemo before the start (withdraw: as if it never confirmed) and Odlazimo after it (leave: it is out of the next
// Novo kolo). not_open and over: the button doesn't work now. no_place: the night has two places and the team isn't
// at either yet (Javi se adminu); it can still leave.
export type LeagueArrivalAction = "confirm" | "leave";
export type LeagueArrivalEffect = "arrive" | "withdraw" | "leave" | "none" | "not_open" | "over" | "last_round" | "no_place";

export function arrivalEffect(phase: LeagueArrivalPhase, action: LeagueArrivalAction, here: boolean, lastRound = false, noPlace = false): LeagueArrivalEffect {
  if (phase === "over") return "over";
  if (action === "confirm") {
    if (noPlace) return "no_place";
    if (phase === "before") return "not_open";
    if (here) return "none";
    return lastRound ? "last_round" : "arrive";
  }
  if (!here) return "none";
  return phase === "started" ? "leave" : "withdraw";
}
