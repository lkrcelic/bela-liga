// Hands and matches as they are played at a table, scored by the app's own rules (bela/scoring.ts), shaped like
// production (measured 14.11.2026 on 24,077 hands): 8–11 hands a match, ~1 declaration a hand (82% of them 20),
// ~22% of contracts failed (pad), ~5% štiglja, ~0.4% of matches closed by Vrijeme partije.
// History is written in bulk with ids taken here, so 24,000 hands go in in seconds and the ids are the same every run.
import {
  ANNOUNCEMENT_POINTS,
  COMPLETE_VICTORY_POINTS,
  computeHandTotals,
  gamePointsError,
  HAND_POINTS,
  matchWinner,
} from "@/app/_lib/bela/scoring";
import type {Prisma} from "@prisma/client";
import type {Rng} from "./rng";
import type {Ctx} from "./context";

export type AnnouncementType = keyof typeof ANNOUNCEMENT_POINTS;
export type Side = 1 | 2;

export type Hand = {
  gp1: number;
  gp2: number;
  ap1: number;
  ap2: number;
  tp1: number;
  tp2: number;
  caller: Side;
  pass: boolean;
  completeVictory: boolean;
  announcements: {team: Side; type: AnnouncementType}[];
};

export type PlayedMatch = {hands: Hand[]; score1: number; score2: number; timeExpired: boolean};

const THRESHOLD = 1001;

// One hand. edge > 0 favours team 1 (from the teams' hidden strength); declarations false = a tournament "bez
// zvanja", where only bela (20) is entered, at most once.
export function makeHand(rng: Rng, edge: number, declarations: boolean): Hand {
  const caller: Side = rng.chance(0.5) ? 1 : 2;
  const callerEdge = caller === 1 ? edge : -edge;
  const announcements: Hand["announcements"] = [];
  if (declarations) {
    const count = rng.weighted([
      [0, 40],
      [1, 35],
      [2, 17],
      [3, 6],
      [4, 2],
    ] as const);
    for (let i = 0; i < count; i++) {
      const team: Side = rng.chance(0.6) ? caller : caller === 1 ? 2 : 1;
      const type = rng.weighted<AnnouncementType>([
        ["TWENTY", 819],
        ["FIFTY", 116],
        ["ONE_HUNDRED", 49],
        ["TWO_HUNDRED", 9],
        ["ONE_HUNDRED_FIFTY", 7],
      ]);
      announcements.push({team, type});
    }
  } else if (rng.chance(0.25)) {
    announcements.push({team: rng.chance(0.6) ? caller : caller === 1 ? 2 : 1, type: "TWENTY"});
  }
  const ap = (side: Side) => announcements.filter((a) => a.team === side).reduce((s, a) => s + ANNOUNCEMENT_POINTS[a.type], 0);

  const completeVictory = rng.chance(0.053);
  let gpCaller: number;
  if (completeVictory) {
    gpCaller = rng.chance(0.92) ? COMPLETE_VICTORY_POINTS : 0;
  } else {
    // ~N(103, 30) shifted by the edge, kept inside one hand's 162 points
    const normal = Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());
    gpCaller = Math.max(0, Math.min(HAND_POINTS, Math.round(103 + 8 * callerEdge + 30 * normal)));
  }
  const total = completeVictory ? COMPLETE_VICTORY_POINTS : HAND_POINTS;
  const gp1 = caller === 1 ? gpCaller : total - gpCaller;
  const gp2 = total - gp1;
  const error = gamePointsError(gp1, gp2, completeVictory);
  if (error) throw new Error(`generated an impossible hand ${gp1}:${gp2}: ${error}`);
  const ap1 = ap(1);
  const ap2 = ap(2);
  const totals = computeHandTotals({
    gamePoints1: gp1,
    gamePoints2: gp2,
    announcementPoints1: ap1,
    announcementPoints2: ap2,
    trumpCaller: caller,
    completeVictory,
  });
  return {gp1, gp2, ap1, ap2, tp1: totals.totalPoints1, tp2: totals.totalPoints2, caller, pass: totals.pass, completeVictory, announcements};
}

// A match played to 1001 (matchWinner decides when it is over), or now and then closed by time with the score so far
export function playMatch(rng: Rng, edge: number, declarations: boolean): PlayedMatch {
  const byTime = rng.chance(0.004);
  const hands: Hand[] = [];
  let s1 = 0;
  let s2 = 0;
  for (;;) {
    const hand = makeHand(rng, edge, declarations);
    hands.push(hand);
    s1 += hand.tp1;
    s2 += hand.tp2;
    if (matchWinner(s1, s2, THRESHOLD) !== null) return {hands, score1: s1, score2: s2, timeExpired: false};
    if (byTime && hands.length >= 6 && s1 !== s2) return {hands, score1: s1, score2: s2, timeExpired: true};
    if (hands.length > 40) throw new Error("a match that never ends");
  }
}

// Ids for bulk inserts: history takes them in order, then syncSequences moves the sequences past them so the app's own
// inserts (tonight, the tests) carry on from there
export type Ids = {round: number; match: number; result: number; announcement: number};

export function createIds(): Ids {
  return {round: 0, match: 0, result: 0, announcement: 0};
}

export async function syncSequences(ctx: Ctx) {
  for (const [table, column] of [
    ["Round", "id"],
    ["Match", "id"],
    ["BelaResult", "result_id"],
    ["BelaPlayerAnnouncement", "announcement_id"],
  ] as const) {
    await ctx.prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), COALESCE((SELECT MAX("${column}") FROM "${table}"), 0) + 1, false)`,
    );
  }
}

// Collects the rows of finished tables and writes them in a few createMany calls
export class TableWriter {
  rounds: Prisma.RoundCreateManyInput[] = [];
  leagueRounds: {league_id: number; round_id: number}[] = [];
  tournamentRounds: {tournament_id: number; round_id: number}[] = [];
  roundPlayers: {round_id: number; player_id: number; team_id: number}[] = [];
  matches: {
    id: number;
    round_id: number;
    player_pair1_score: number;
    player_pair2_score: number;
    score_threshold: number;
    start_time: Date | null;
    end_time: Date | null;
    match_date: Date;
    time_expired: boolean;
  }[] = [];
  results: {
    result_id: number;
    match_id: number;
    player_pair1_game_points: number;
    player_pair2_game_points: number;
    player_pair1_announcement_points: number;
    player_pair2_announcement_points: number;
    player_pair1_total_points: number;
    player_pair2_total_points: number;
    trump_caller_team: number;
    pass: boolean;
    complete_victory: boolean;
  }[] = [];
  announcements: {announcement_id: number; result_id: number; team: number; announcement_type: AnnouncementType}[] = [];

  constructor(private ids: Ids) {}

  nextRoundId(): number {
    return ++this.ids.round;
  }

  // a match with its hands; times: when it started and ended
  addMatch(roundId: number, day: Date, played: PlayedMatch, start: Date | null, end: Date | null) {
    const matchId = ++this.ids.match;
    this.matches.push({
      id: matchId,
      round_id: roundId,
      player_pair1_score: played.score1,
      player_pair2_score: played.score2,
      score_threshold: THRESHOLD,
      start_time: start,
      end_time: end,
      match_date: day,
      time_expired: played.timeExpired,
    });
    for (const hand of played.hands) {
      const resultId = ++this.ids.result;
      this.results.push({
        result_id: resultId,
        match_id: matchId,
        player_pair1_game_points: hand.gp1,
        player_pair2_game_points: hand.gp2,
        player_pair1_announcement_points: hand.ap1,
        player_pair2_announcement_points: hand.ap2,
        player_pair1_total_points: hand.tp1,
        player_pair2_total_points: hand.tp2,
        trump_caller_team: hand.caller,
        pass: hand.pass,
        complete_victory: hand.completeVictory,
      });
      for (const a of hand.announcements) {
        this.announcements.push({announcement_id: ++this.ids.announcement, result_id: resultId, team: a.team, announcement_type: a.type});
      }
    }
  }

  // a match with no hands: the bye's 301:0, a no-show's 1001:700
  addScoreOnly(roundId: number, day: Date, score1: number, score2: number, at: Date | null) {
    this.matches.push({
      id: ++this.ids.match,
      round_id: roundId,
      player_pair1_score: score1,
      player_pair2_score: score2,
      score_threshold: THRESHOLD,
      start_time: at,
      end_time: at,
      match_date: day,
      time_expired: false,
    });
  }

  async flush(ctx: Ctx) {
    const {prisma} = ctx;
    const chunk = async <T>(rows: T[], write: (part: T[]) => Promise<unknown>) => {
      for (let i = 0; i < rows.length; i += 2000) await write(rows.slice(i, i + 2000));
    };
    await chunk(this.rounds, (part) => prisma.round.createMany({data: part}));
    await chunk(this.leagueRounds, (part) => prisma.leagueRound.createMany({data: part}));
    await chunk(this.tournamentRounds, (part) => prisma.tournamentRound.createMany({data: part}));
    await chunk(this.roundPlayers, (part) => prisma.roundPlayer.createMany({data: part}));
    await chunk(this.matches, (part) => prisma.match.createMany({data: part}));
    await chunk(this.results, (part) => prisma.belaResult.createMany({data: part}));
    await chunk(this.announcements, (part) => prisma.belaPlayerAnnouncement.createMany({data: part}));
    const counts = `${this.rounds.length} tables, ${this.matches.length} matches, ${this.results.length} hands`;
    this.rounds = [];
    this.leagueRounds = [];
    this.tournamentRounds = [];
    this.roundPlayers = [];
    this.matches = [];
    this.results = [];
    this.announcements = [];
    return counts;
  }
}

// Each team's hidden strength, so the standings spread out as in a real league instead of everyone near 50%
export function strengths(rng: Rng, teamIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const id of teamIds) {
    const normal = Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());
    out.set(id, normal);
  }
  return out;
}

export function edgeOf(strength: Map<number, number>, team1: number, team2: number): number {
  return Math.max(-1.5, Math.min(1.5, ((strength.get(team1) ?? 0) - (strength.get(team2) ?? 0)) / 2));
}

// two players of a team for a table (Tko igra): the founders mostly, the third player now and then
export function lineup(rng: Rng, roster: number[]): number[] {
  if (roster.length <= 2) return roster;
  return rng.sample(roster, 2);
}

// Both lineups of a table. Two teams may share a player (production has players in two teams), but nobody plays for
// both sides (saveLineup refuses it): the first team plays without the shared player when it can.
export function lineups(rng: Rng, roster1: number[], roster2: number[]): [number[], number[]] {
  const own1 = roster1.filter((p) => !roster2.includes(p));
  const first = lineup(rng, own1.length >= Math.min(2, roster1.length) ? own1 : roster1);
  const second = lineup(rng, roster2.filter((p) => !first.includes(p)));
  return [first, second];
}
