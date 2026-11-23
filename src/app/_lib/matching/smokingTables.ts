import {isByeTeam} from "@/app/_lib/bye";
import {TeamPair} from "./multipleRoundMatching";

// Smoking tables (DECISIONS 32, 38, 100 and 101). The pairing is made first, by standings; smoking tables only decide
// where a match sits. What is remembered is one competition: a league (all its nights) or a tournament. Nothing from
// another league or a tournament counts. In every round the smoking tables, in the order of their numbers, go to:
//   1. the matches with the most smokers at the table (both teams' smokers together), so as many smokers as possible
//      sit where they may smoke, and a team with more smokers comes before a team with fewer;
//   2. of matches with as many smokers, the one with more missed nights in this league: nights a team had a smoker at
//      a round with smoking tables but sat at none of them. A team's missed nights count until it sits at a smoking
//      table tonight. A tournament is one day, so it has none;
//   3. then the one whose smoking teams sat at a smoking table fewer times in this competition (tonight included), so
//      teams with equal smokers take turns;
//   4. then the pairing's order (the better-ranked table first).
// A smoking table that no match with a smoker needs still gets a match, in the pairing's order.

// What a pair needs to be seated: its two teams (a league's TeamPair, or a tournament's pair of ids)
export type Seatable = {teamOne: {id: number}; teamTwo: {id: number}};

// A team's smoking record in this competition, as it stands before new rounds are seated
export type SmokingRecord = {
  // rounds it sat at a smoking table with a smoker (tonight's included)
  turns: number;
  // of those, tonight's
  tonight: number;
  // earlier nights of this league it had a smoker at a round with smoking tables but sat at none of them
  missedNights: number;
};

export const emptyRecord = (): SmokingRecord => ({turns: 0, tonight: 0, missedNights: 0});

export type SmokingSetup = {
  // the table numbers where smoking is allowed
  tables: readonly number[];
  // smokers on each team's roster now (teams without smokers can be left out)
  smokers: ReadonlyMap<number, number>;
  // the competition so far (a team left out starts empty)
  records: ReadonlyMap<number, SmokingRecord>;
};

export type SeatedPair<P extends Seatable = TeamPair> = P & {table: number; smoking: boolean};

const isByePair = (p: Seatable) => isByeTeam(p.teamOne.id) || isByeTeam(p.teamTwo.id);
const teamsOf = (p: Seatable) => [p.teamOne.id, p.teamTwo.id];

/**
 * Gives every pair of every round its table: 1, 2, ... in the order the pairing made them (best ranked first), the
 * bye after every real table. With smoking tables, the matches that come first by the rule at the top of this file sit
 * there; the other matches keep their order on the other tables. Smoking tables above a round's number of tables are
 * left out of that round. The rounds are seated in order, so a round counts for the rounds after it.
 */
export function seatRounds<P extends Seatable>(rounds: P[][], setup?: SmokingSetup | null): SeatedPair<P>[][] {
  const tables = Array.from(new Set(setup?.tables ?? []))
    .filter((t) => Number.isInteger(t) && t > 0)
    .sort((a, b) => a - b);
  const smokersOf = (id: number) => (isByeTeam(id) ? 0 : Math.max(0, setup?.smokers.get(id) ?? 0));
  // copies, so the rounds seated first count for the ones after them
  const records = new Map<number, SmokingRecord>();
  setup?.records.forEach((r, id) => records.set(id, {...r}));
  const recordOf = (id: number) => records.get(id) ?? emptyRecord();
  const smokingTeamsOf = (p: Seatable) => teamsOf(p).filter((id) => smokersOf(id) > 0);
  const sum = (p: Seatable, f: (r: SmokingRecord) => number) => smokingTeamsOf(p).reduce((s, id) => s + f(recordOf(id)), 0);

  return rounds.map((round) => {
    const real = round.filter((p) => !isByePair(p));
    const byes = round.filter(isByePair);
    const smokingTables = tables.filter((t) => t <= real.length);
    const seats = new Map<P, {table: number; smoking: boolean}>();

    if (smokingTables.length > 0) {
      const chosen = real
        .map((pair, index) => ({
          pair,
          index,
          smokers: teamsOf(pair).reduce((s, id) => s + smokersOf(id), 0),
          // a missed night stops counting once the team sits at a smoking table tonight
          missed: sum(pair, (r) => (r.tonight > 0 ? 0 : r.missedNights)),
          turns: sum(pair, (r) => r.turns),
        }))
        .filter((m) => m.smokers > 0)
        .sort((a, b) => b.smokers - a.smokers || b.missed - a.missed || a.turns - b.turns || a.index - b.index)
        .slice(0, smokingTables.length);
      chosen.forEach((m, i) => seats.set(m.pair, {table: smokingTables[i], smoking: true}));
    }

    // the other matches, in their order, take the free table numbers (also a smoking table no smoking team needed)
    const taken = new Set(Array.from(seats.values(), (s) => s.table));
    const free = Array.from({length: real.length}, (_, i) => i + 1).filter((t) => !taken.has(t));
    real.filter((p) => !seats.has(p)).forEach((p, i) => seats.set(p, {table: free[i], smoking: smokingTables.includes(free[i])}));

    // this round's smoking teams at a smoking table take a turn
    real
      .filter((p) => seats.get(p)!.smoking)
      .forEach((p) =>
        smokingTeamsOf(p).forEach((id) => {
          const r = recordOf(id);
          records.set(id, {...r, turns: r.turns + 1, tonight: r.tonight + 1});
        })
      );

    const seated: SeatedPair<P>[] = real.map((p) => ({...p, ...seats.get(p)!})).sort((a, b) => a.table - b.table);
    byes.forEach((p, i) => seated.push({...p, table: real.length + i + 1, smoking: false}));
    return seated;
  });
}

// One table of the competition as the records read it from the database
export type SmokingTable = {
  date: string; // YYYY-MM-DD, the night (a tournament's tables all carry its date)
  roundNumber: number | null;
  // the place of a two-place night (1 or 2): its Kolo 7 is a round of its own, apart from the other place's Kolo 7
  slot?: number | null;
  team1Id: number;
  team2Id: number;
  // each team's smokers when it was seated
  team1Smokers: number;
  team2Smokers: number;
  smoking: boolean;
};

/**
 * Every team's smoking record in one competition, from its tables up to tonight (`today`, YYYY-MM-DD): a league's
 * tables, or a tournament's published Kolos (all on its date, so none is missed). A team takes a turn at a smoking
 * table while it had a smoker when it was seated there. A night before today is missed when the team had a smoker at
 * a round with a smoking table and sat at no smoking table that night.
 */
export function smokingRecords(tables: SmokingTable[], today: string): Map<number, SmokingRecord> {
  const records = new Map<number, SmokingRecord>();
  const recordOf = (id: number) => {
    if (!records.has(id)) records.set(id, emptyRecord());
    return records.get(id)!;
  };

  const rounds = new Map<string, SmokingTable[]>();
  for (const t of tables) {
    if (t.date > today || isByeTeam(t.team1Id) || isByeTeam(t.team2Id)) continue;
    const key = `${t.date}|${t.slot ?? 0}|${t.roundNumber}`;
    rounds.set(key, [...(rounds.get(key) ?? []), t]);
  }

  // per night: the smoking teams that could have sat at a smoking table, and the ones that did
  const nights = new Map<string, {could: Set<number>; did: Set<number>}>();
  for (const round of Array.from(rounds.values())) {
    if (!round.some((t) => t.smoking)) continue;
    const date = round[0].date;
    if (!nights.has(date)) nights.set(date, {could: new Set(), did: new Set()});
    const night = nights.get(date)!;
    for (const t of round) {
      const seated: [number, number][] = [
        [t.team1Id, t.team1Smokers],
        [t.team2Id, t.team2Smokers],
      ];
      for (const [id, smokers] of seated) {
        if (smokers <= 0) continue;
        night.could.add(id);
        if (!t.smoking) continue;
        night.did.add(id);
        const record = recordOf(id);
        record.turns += 1;
        if (date === today) record.tonight += 1;
      }
    }
  }

  for (const [date, night] of Array.from(nights)) {
    if (date >= today) continue;
    night.could.forEach((id) => {
      if (!night.did.has(id)) recordOf(id).missedNights += 1;
    });
  }
  return records;
}
