import {Game, initialRating, PlayerRating, ratePeriod} from "./glicko2";

// The whole rating history from the rated rounds: one Glicko-2 period per league night, every match a game.
// Framework free; the replay (service/admin/recalc.ts) loads the rounds and writes the result.

export type RatedRound = {
  night: string; // YYYY-MM-DD
  teamA: number[]; // the players rated for team1
  teamB: number[];
  // each match's points, team1 first; a round without stored matches falls back to its wins
  matches: [number, number][];
  wins: [number, number];
};

export type NightRating = {playerId: number; night: string; rating: number; rd: number; change: number; rounds: number};

export type SeasonRatings = {ratings: Map<number, PlayerRating>; history: NightRating[]};

// The games of a round: a win, loss or draw per match
export function roundGames(r: RatedRound): Game[] {
  const game = (scoreA: number): Game => ({teamA: r.teamA, teamB: r.teamB, scoreA});
  if (r.matches.length > 0) return r.matches.map(([a, b]) => game(a > b ? 1 : a < b ? 0 : 0.5));
  return [...Array(r.wins[0]).fill(1), ...Array(r.wins[1]).fill(0)].map(game);
}

/**
 * Every player starts at the defaults; the nights are rated in date order. Returns everyone's rating after the
 * last night, and one history row per player for each night they played.
 */
export function replaySeason(playerIds: number[], rounds: RatedRound[]): SeasonRatings {
  let ratings = new Map<number, PlayerRating>(playerIds.map((id) => [id, initialRating()]));
  const known = new Set(playerIds);
  const history: NightRating[] = [];

  const nights = new Map<string, RatedRound[]>();
  for (const r of rounds) {
    const teamA = r.teamA.filter((id) => known.has(id));
    const teamB = r.teamB.filter((id) => known.has(id));
    if (teamA.length === 0 || teamB.length === 0) continue;
    nights.set(r.night, [...(nights.get(r.night) ?? []), {...r, teamA, teamB}]);
  }

  for (const night of Array.from(nights.keys()).sort()) {
    const nightRounds = nights.get(night)!;
    const after = ratePeriod(ratings, nightRounds.flatMap(roundGames));
    const roundsPlayed = new Map<number, number>();
    for (const r of nightRounds) for (const id of [...r.teamA, ...r.teamB]) roundsPlayed.set(id, (roundsPlayed.get(id) ?? 0) + 1);
    roundsPlayed.forEach((count, playerId) => {
      const now = after.get(playerId)!;
      const was = ratings.get(playerId)!;
      history.push({
        playerId,
        night,
        rating: Math.round(now.rating),
        rd: now.rd,
        change: Math.round(now.rating) - Math.round(was.rating),
        rounds: count,
      });
    });
    ratings = after;
  }

  return {ratings, history};
}

// RD and volatility equal up to floating point noise: the database gives a round's players in no fixed order, so the
// same replay can sum them in another order and differ in the last digits; writing that would rewrite every row again
const sameFloat = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// A player's rating as the Player row stores it (the rating rounded)
export type StoredRating = {id: number; rating: number; rd: number; vol: number};

// The Player rows a replay has to write: only the players whose stored rating, RD or volatility differs from the
// replay's, so a round close doesn't rewrite every player
export function changedRatings(stored: StoredRating[], ratings: ReadonlyMap<number, PlayerRating>): StoredRating[] {
  const byId = new Map(stored.map((s) => [s.id, s]));
  const changed: StoredRating[] = [];
  ratings.forEach((r, id) => {
    const now = {id, rating: Math.round(r.rating), rd: r.rd, vol: r.vol};
    const was = byId.get(id);
    if (!was || was.rating !== now.rating || !sameFloat(was.rd, now.rd) || !sameFloat(was.vol, now.vol)) changed.push(now);
  });
  return changed;
}

// What turns the stored history into the replay's: the rows to remove (a night the player no longer has) and the
// rows to write (new or different). Earlier nights come out of the replay the same, so a round close only writes
// tonight's rows instead of deleting and inserting the whole history.
export function historyChanges(stored: NightRating[], computed: NightRating[]): {remove: NightRating[]; write: NightRating[]} {
  const key = (h: NightRating) => `${h.playerId}|${h.night}`;
  const was = new Map(stored.map((h) => [key(h), h]));
  const write: NightRating[] = [];
  for (const h of computed) {
    const old = was.get(key(h));
    was.delete(key(h));
    if (!old || old.rating !== h.rating || !sameFloat(old.rd, h.rd) || old.change !== h.change || old.rounds !== h.rounds) write.push(h);
  }
  return {remove: Array.from(was.values()), write};
}
