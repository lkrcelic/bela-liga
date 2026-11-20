import {isByeTeam} from "@/app/_lib/bye";
import {TeamPair} from "./multipleRoundMatching";

// Smoking tables (DECISIONS 32, 38 and 100). The pairing is made first, by standings; smoking tables only decide where a
// match sits. Every event starts afresh: a league night, or a tournament. Nothing from earlier nights or tournaments
// counts. In every round the smoking tables, in the order of their numbers, go to:
//   1. the matches with the most smokers at the table (both teams' smokers together), so as many smokers as possible
//      sit where they may smoke, and a team with more smokers comes before a team with fewer;
//   2. of matches with as many smokers, the one whose smoking teams sat at a smoking table fewer times in this event so
//      far, so teams with equal smokers take turns;
//   3. then the pairing's order (the better-ranked table first).
// A smoking table that no match with a smoker needs still gets a match, in the pairing's order.

// What a pair needs to be seated: its two teams (a league's TeamPair, or a tournament's pair of ids)
export type Seatable = {teamOne: {id: number}; teamTwo: {id: number}};

export type SmokingSetup = {
  // the table numbers where smoking is allowed
  tables: readonly number[];
  // smokers on each team's roster now (teams without smokers can be left out)
  smokers: ReadonlyMap<number, number>;
  // rounds each team already sat at a smoking table in this event: tonight's earlier rounds of the league, or the
  // tournament's earlier Kolos (a team left out has none)
  turns: ReadonlyMap<number, number>;
};

export type SeatedPair<P extends Seatable = TeamPair> = P & {table: number; smoking: boolean};

const isByePair = (p: Seatable) => isByeTeam(p.teamOne.id) || isByeTeam(p.teamTwo.id);
const teamsOf = (p: Seatable) => [p.teamOne.id, p.teamTwo.id];

/**
 * Gives every pair of every round its table: 1, 2, ... in the order the pairing made them (best ranked first), the
 * bye after every real table. With smoking tables, the matches with the most smokers sit there (see the top of this
 * file); the other matches keep their order on the other tables. Smoking tables above a round's number of tables are
 * left out of that round. The rounds are seated in order, so a round's turns count for the rounds after it.
 */
export function seatRounds<P extends Seatable>(rounds: P[][], setup?: SmokingSetup | null): SeatedPair<P>[][] {
  const tables = Array.from(new Set(setup?.tables ?? []))
    .filter((t) => Number.isInteger(t) && t > 0)
    .sort((a, b) => a - b);
  const smokersOf = (id: number) => (isByeTeam(id) ? 0 : Math.max(0, setup?.smokers.get(id) ?? 0));
  // a copy, so the rounds seated first count for the ones after them
  const turns = new Map(setup?.turns ?? []);
  const smokingTeamsOf = (p: Seatable) => teamsOf(p).filter((id) => smokersOf(id) > 0);

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
          smokers: teamsOf(pair).reduce((sum, id) => sum + smokersOf(id), 0),
          turns: smokingTeamsOf(pair).reduce((sum, id) => sum + (turns.get(id) ?? 0), 0),
        }))
        .filter((m) => m.smokers > 0)
        .sort((a, b) => b.smokers - a.smokers || a.turns - b.turns || a.index - b.index)
        .slice(0, smokingTables.length);
      chosen.forEach((m, i) => seats.set(m.pair, {table: smokingTables[i], smoking: true}));
    }

    // the other matches, in their order, take the free table numbers (also a smoking table no smoking team needed)
    const taken = new Set(Array.from(seats.values(), (s) => s.table));
    const free = Array.from({length: real.length}, (_, i) => i + 1).filter((t) => !taken.has(t));
    real.filter((p) => !seats.has(p)).forEach((p, i) => seats.set(p, {table: free[i], smoking: smokingTables.includes(free[i])}));

    // this round's smoking teams at a smoking table take a turn
    real.filter((p) => seats.get(p)!.smoking).forEach((p) => smokingTeamsOf(p).forEach((id) => turns.set(id, (turns.get(id) ?? 0) + 1)));

    const seated: SeatedPair<P>[] = real.map((p) => ({...p, ...seats.get(p)!})).sort((a, b) => a.table - b.table);
    byes.forEach((p, i) => seated.push({...p, table: real.length + i + 1, smoking: false}));
    return seated;
  });
}

// One table of the event as the turns read it from the database: its teams, each team's smokers when it was seated,
// and whether it is a smoking table
export type SmokingTable = {
  team1Id: number;
  team2Id: number;
  team1Smokers: number;
  team2Smokers: number;
  smoking: boolean;
};

/**
 * The turns at a smoking table each team took in the event so far (its tables, from the caller: tonight's tables of a
 * league, or a tournament's published Kolos). A team takes a turn at a smoking table while it had a smoker when it was
 * seated there; a team without smokers takes none.
 */
export function smokingTurns(tables: SmokingTable[]): Map<number, number> {
  const turns = new Map<number, number>();
  for (const t of tables) {
    if (!t.smoking || isByeTeam(t.team1Id) || isByeTeam(t.team2Id)) continue;
    const seated: [number, number][] = [
      [t.team1Id, t.team1Smokers],
      [t.team2Id, t.team2Smokers],
    ];
    seated.forEach(([id, smokers]) => {
      if (smokers > 0) turns.set(id, (turns.get(id) ?? 0) + 1);
    });
  }
  return turns;
}
