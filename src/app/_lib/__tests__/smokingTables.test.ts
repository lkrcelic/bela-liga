// Smoking tables (DECISIONS 100, 101): each round's smoking tables go to the matches with the most smokers at the table;
// of matches with as many, to the one with more missed nights in this league, then to the one whose smoking teams sat
// at a smoking table fewer times in this competition, then to the better-ranked one. Only one competition is
// remembered: a league, or a tournament.
import {test} from "node:test";
import assert from "node:assert/strict";
import {Prisma} from "@prisma/client";
import {Team, TeamPair} from "@/app/_lib/matching/multipleRoundMatching";
import {emptyRecord, seatRounds, SeatedPair, SmokingRecord, SmokingTable, smokingRecords} from "@/app/_lib/matching/smokingTables";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {teamSmokers} from "@/app/_lib/service/team/smokers";

const team = (id: number): Team => ({id, name: `Team ${id}`, score: 0, point_difference: 0, played_against: []});
const bye: Team = {id: BYE_TEAM_ID, name: "Bye", score: 0, point_difference: 0, played_against: []};
// pairs in the order the pairing gives them: [1, 2] is the best-ranked table
const round = (...pairs: [number, number][]): TeamPair[] =>
  pairs.map(([a, b]) => ({teamOne: a === BYE_TEAM_ID ? bye : team(a), teamTwo: b === BYE_TEAM_ID ? bye : team(b)}));
const smokers = (entries: Record<number, number>) => new Map(Object.entries(entries).map(([id, n]) => [Number(id), n]));
const records = (entries: Record<number, Partial<SmokingRecord>> = {}) =>
  new Map(Object.entries(entries).map(([id, r]) => [Number(id), {...emptyRecord(), ...r}]));

// "1-2@3": teams 1 and 2 at table 3, with "*" when it is a smoking table
const show = (seated: SeatedPair[]) => seated.map((p) => `${p.teamOne.id}-${p.teamTwo.id}@${p.table}${p.smoking ? "*" : ""}`);
const smokingTeams = (seated: SeatedPair[]) =>
  seated.filter((p) => p.smoking).flatMap((p) => [p.teamOne.id, p.teamTwo.id]).sort((a, b) => a - b);

test("without smoking tables every round keeps its order: tables 1, 2, ... and the bye last", () => {
  const rounds = [round([1, 2], [3, 4], [5, BYE_TEAM_ID])];
  assert.deepEqual(show(seatRounds(rounds)[0]), ["1-2@1", "3-4@2", `5-${BYE_TEAM_ID}@3`]);
  assert.deepEqual(show(seatRounds(rounds, {tables: [], smokers: smokers({1: 2}), records: records()})[0]), ["1-2@1", "3-4@2", `5-${BYE_TEAM_ID}@3`]);
});

test("a match with smokers sits at the smoking table, the others keep their order on the rest", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {tables: [2], smokers: smokers({7: 1}), records: records()})[0];
  assert.deepEqual(show(seated), ["1-2@1", "7-8@2*", "3-4@3", "5-6@4"]);
});

test("the smoking tables go in the order of their numbers, the match with more smokers first", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {tables: [4, 1], smokers: smokers({2: 1, 5: 1, 6: 2}), records: records()})[0];
  assert.deepEqual(show(seated), ["5-6@1*", "3-4@2", "7-8@3", "1-2@4*"]);
});

test("a smoking table no smoking team needs still gets a match, and is still a smoking table", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [1, 2], smokers: smokers({5: 1}), records: records()})[0];
  assert.deepEqual(show(seated), ["5-6@1*", "1-2@2*", "3-4@3"]);
});

test("smoking tables above the round's number of tables are left out, and the bye never gets one", () => {
  const seated = seatRounds([round([1, 2], [3, BYE_TEAM_ID])], {tables: [2, 5], smokers: smokers({3: 3}), records: records()})[0];
  assert.deepEqual(show(seated), ["1-2@1", `3-${BYE_TEAM_ID}@2`]);
});

test("equal smokers, missed nights and turns keep the pairing's order", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [3], smokers: smokers({2: 1, 3: 1, 6: 1}), records: records()})[0];
  assert.deepEqual(show(seated), ["3-4@1", "5-6@2", "1-2@3*"]);
});

test("a team with more smokers gets the smoking table over a team with fewer that missed nights in this league", () => {
  // team 1 has two smokers and missed no night; team 3 has one and missed two nights of this league
  const seated = seatRounds([round([3, 4], [1, 2])], {tables: [1], smokers: smokers({1: 2, 3: 1}), records: records({3: {missedNights: 2}})})[0];
  assert.deepEqual(show(seated), ["1-2@1*", "3-4@2"]);
});

test("a team with more smokers gets the smoking table, also when it already sat at one tonight", () => {
  // team 1 has three smokers and sat at the smoking table in tonight's first round; team 3 has one and hasn't
  const seated = seatRounds([round([1, 2], [3, 4])], {tables: [1], smokers: smokers({1: 3, 3: 1}), records: records({1: {turns: 1, tonight: 1}})})[0];
  assert.deepEqual(smokingTeams(seated), [1, 2]);
});

test("the smokers of both teams count together: two teams with one smoker beat one team with one", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [1], smokers: smokers({1: 1, 5: 1, 6: 1}), records: records()})[0];
  assert.deepEqual(show(seated), ["5-6@1*", "1-2@2", "3-4@3"]);
});

test("with as many smokers, the match with more missed nights in this league goes first, whatever the turns", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {
    tables: [1, 2],
    smokers: smokers({1: 1, 3: 1, 5: 1}),
    // team 5 missed two nights and team 3 one, though both sat at a smoking table more often than team 1
    records: records({3: {missedNights: 1, turns: 4}, 5: {missedNights: 2, turns: 6}}),
  })[0];
  assert.deepEqual(show(seated), ["5-6@1*", "3-4@2*", "1-2@3"]);
});

test("a team's missed nights stop counting once it sits at a smoking table tonight", () => {
  const seated = seatRounds([round([1, 2], [3, 4])], {
    tables: [1],
    smokers: smokers({1: 1, 3: 1}),
    // team 1 missed three nights but sat at the smoking table earlier tonight; team 3 missed one and hasn't
    records: records({1: {missedNights: 3, turns: 1, tonight: 1}, 3: {missedNights: 1, turns: 1}}),
  })[0];
  assert.deepEqual(smokingTeams(seated), [3, 4]);
});

test("with as many smokers and missed nights, the match whose teams sat at a smoking table fewer times goes first", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {
    tables: [1, 2],
    // every match has two smokers: 1-2 sat twice in this competition, 3-4 once, 5-6 not yet
    smokers: smokers({1: 2, 3: 1, 4: 1, 5: 2}),
    records: records({1: {turns: 2}, 3: {turns: 1}}),
  })[0];
  assert.deepEqual(show(seated), ["5-6@1*", "3-4@2*", "1-2@3"]);
});

test("teams with as many smokers take turns over the rounds of one night", () => {
  // teams 1, 3 and 5 have one smoker each; each round they play a different non-smoking team
  const rounds = [round([1, 2], [3, 4], [5, 6]), round([1, 4], [3, 6], [5, 2]), round([1, 6], [3, 2], [5, 4])];
  const seated = seatRounds(rounds, {tables: [1], smokers: smokers({1: 1, 3: 1, 5: 1}), records: records()});
  assert.deepEqual(seated.map(smokingTeams), [[1, 2], [3, 6], [4, 5]]);
});

test("a team with two smokers keeps the smoking table every round over teams with one", () => {
  const rounds = [round([1, 2], [3, 4], [5, 6]), round([1, 4], [3, 6], [5, 2]), round([1, 6], [3, 2], [5, 4])];
  const seated = seatRounds(rounds, {tables: [1], smokers: smokers({1: 2, 3: 1, 5: 1}), records: records({3: {missedNights: 4}})});
  assert.deepEqual(seated.map(smokingTeams), [[1, 2], [1, 4], [1, 6]]);
});

test("as many smoking tables as smoking matches: every smoker sits at one", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {
    tables: [1, 2, 3],
    smokers: smokers({2: 1, 4: 1, 8: 2}),
    records: records({2: {turns: 5}, 4: {turns: 3}, 8: {turns: 4}}),
  })[0];
  // the turns only order them: 3-4 (3 turns) before 1-2 (5)
  assert.deepEqual(show(seated), ["7-8@1*", "3-4@2*", "1-2@3*", "5-6@4"]);
});

test("a tournament's pairs of ids are seated like a league's teams", () => {
  const pairs = [[{teamOne: {id: 11}, teamTwo: {id: 12}}, {teamOne: {id: 13}, teamTwo: {id: 14}}, {teamOne: {id: 15}, teamTwo: {id: BYE_TEAM_ID}}]];
  const seated = seatRounds(pairs, {tables: [1], smokers: smokers({14: 2, 15: 2}), records: records()})[0];
  assert.deepEqual(
    seated.map((p) => [p.teamOne.id, p.teamTwo.id, p.table, p.smoking]),
    [
      [13, 14, 1, true],
      [11, 12, 2, false],
      // the bye has no smokers and no smoking table, whoever plays it
      [15, BYE_TEAM_ID, 3, false],
    ]
  );
});

// the roster query answered as Prisma would, over players given as [team, smoker, active]
const rosterDb = (players: [number, boolean, boolean][]) =>
  ({
    teamPlayer: {
      findMany: async ({where}: {where: {team_id: {in: number[]}; player: {smoker?: boolean; active?: boolean}}}) =>
        players
          .map(([team_id, smoker, active]) => ({team_id, player: {smoker, active}}))
          .filter((r) => where.team_id.in.includes(r.team_id))
          .filter((r) => Object.entries(where.player).every(([field, value]) => r.player[field as "smoker" | "active"] === value)),
    },
  }) as unknown as Prisma.TransactionClient;

test("a team's smokers are its players with Pušač on, but not deactivated ones, and the bye has none", async () => {
  const db = rosterDb([
    [1, true, true],
    [1, true, false], // deactivated: still on the roster, but can't play
    [1, false, true],
    [2, true, false],
    [3, true, true],
    [3, true, true],
    [4, true, true], // a team that wasn't asked for
  ]);
  assert.deepEqual(await teamSmokers([1, 2, 3, BYE_TEAM_ID], db), new Map([[1, 1], [3, 2]]));
});

// A table of one competition: "1-2*" is teams 1 and 2 at a smoking table
const tables = (date: string, roundNumber: number, smokersOf: Record<number, number>, ...list: string[]): SmokingTable[] =>
  list.map((t) => {
    const [a, b] = t.replace("*", "").split("-").map(Number);
    return {date, roundNumber, team1Id: a, team2Id: b, team1Smokers: smokersOf[a] ?? 0, team2Smokers: smokersOf[b] ?? 0, smoking: t.endsWith("*")};
  });

test("a league's records count turns at a smoking table, tonight's turns and nights without one", () => {
  const s = {1: 1, 3: 1, 5: 2};
  const r = smokingRecords(
    [
      ...tables("2026-10-01", 1, s, "1-2*", "3-4", "5-6"),
      ...tables("2026-10-01", 2, s, "1-4", "3-6", "5-2*"),
      // a night without smoking tables: nobody misses it
      ...tables("2026-10-08", 3, s, "1-2", "3-4", "5-6"),
      // tonight: counts for the turns, not as a missed night yet
      ...tables("2026-10-15", 4, s, "1-6", "3-2*", "5-4"),
    ],
    "2026-10-15"
  );
  assert.deepEqual(r.get(1), {turns: 1, tonight: 0, missedNights: 0});
  // team 3 sat at no smoking table on 1 October
  assert.deepEqual(r.get(3), {turns: 1, tonight: 1, missedNights: 1});
  assert.deepEqual(r.get(5), {turns: 1, tonight: 0, missedNights: 0});
  // teams without smokers have no record
  assert.equal(r.get(2), undefined);
});

test("records skip the bye, rounds where the team had no smoker, and later nights", () => {
  const r = smokingRecords(
    [
      ...tables("2026-10-01", 1, {1: 1}, `1-${BYE_TEAM_ID}`, "2-3*"),
      // team 4 had no smoker that night (it joined later), so it didn't miss it
      ...tables("2026-10-01", 2, {1: 1}, "1-2*", "3-4"),
      ...tables("2026-10-20", 3, {1: 1, 4: 1}, "1-4*"),
    ],
    "2026-10-15"
  );
  assert.deepEqual(r.get(1), {turns: 1, tonight: 0, missedNights: 0});
  assert.equal(r.get(4), undefined);
});

test("at a two-place night a place without smoking tables isn't a missed night for its teams", () => {
  // both places play Kolo 7 last week: Kartaš (slot 1) has the smoking table, Lanterna none
  const s = {1: 1, 3: 1, 5: 1};
  const at = (slot: number, list: SmokingTable[]) => list.map((t) => ({...t, slot}));
  const r = smokingRecords([...at(1, tables("2026-10-08", 7, s, "1-2*", "3-4")), ...at(2, tables("2026-10-08", 7, s, "5-6", "7-8"))], "2026-10-15");
  assert.deepEqual(r.get(1), {turns: 1, tonight: 0, missedNights: 0});
  // team 3 sat at Kartaš without the smoking table; team 5's place had none
  assert.deepEqual(r.get(3), {turns: 0, tonight: 0, missedNights: 1});
  assert.equal(r.get(5), undefined);
});

test("a tournament's Kolos are all on its day: turns, but no missed nights", () => {
  const s = {1: 1, 3: 1};
  const r = smokingRecords([...tables("2026-11-20", 1, s, "1-2*", "3-4"), ...tables("2026-11-20", 2, s, "1-3*")], "2026-11-20");
  assert.deepEqual(r.get(1), {turns: 2, tonight: 2, missedNights: 0});
  assert.deepEqual(r.get(3), {turns: 1, tonight: 1, missedNights: 0});
});

// deterministic pseudo random numbers
const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

// One league's season of random pairings with one smoking table; remember: whether the rule reads the league's records
function season(remember: boolean): Map<number, SmokingRecord> {
  const random = rng(3);
  const ids = Array.from({length: 20}, (_, i) => i + 1);
  // four teams with two smokers, eight with one
  const smokersOf = smokers(Object.fromEntries(ids.map((id) => [id, id <= 4 ? 2 : id <= 12 ? 1 : 0])));
  const history: SmokingTable[] = [];
  for (let night = 1; night <= 24; night++) {
    const date = `2026-${String(Math.ceil(night / 28) + 9).padStart(2, "0")}-${String(night).padStart(2, "0")}`;
    const rounds = Array.from({length: 3}, () => {
      const order = [...ids].sort(() => random() - 0.5);
      return Array.from({length: 10}, (_, k) => ({teamOne: team(order[2 * k]), teamTwo: team(order[2 * k + 1])}));
    });
    const seated = seatRounds(rounds, {tables: [1], smokers: smokersOf, records: remember ? smokingRecords(history, date) : records()});
    seated.forEach((r, k) =>
      r.forEach((p) =>
        history.push({
          date,
          roundNumber: night * 10 + k,
          team1Id: p.teamOne.id,
          team2Id: p.teamTwo.id,
          team1Smokers: smokersOf.get(p.teamOne.id) ?? 0,
          team2Smokers: smokersOf.get(p.teamTwo.id) ?? 0,
          smoking: p.smoking,
        })
      )
    );
  }
  return smokingRecords(history, "2027-01-01");
}

test("over a league's season, teams with one smoker miss about as many nights as each other", () => {
  const one = [5, 6, 7, 8, 9, 10, 11, 12];
  const spread = (r: Map<number, SmokingRecord>) => {
    const missed = one.map((id) => r.get(id)!.missedNights);
    return Math.max(...missed) - Math.min(...missed);
  };
  const remembered = spread(season(true));
  const forgotten = spread(season(false));
  // one smoking table for twelve smoking teams, and the four with two smokers come first, so a team with one smoker
  // misses most nights (16 to 20 of 24); the league's memory keeps them within 4 of each other, where the same
  // pairings without it leave them 14 to 21
  assert.ok(remembered <= 4, `nights without a smoking table, spread ${remembered}`);
  assert.ok(forgotten > remembered, `spread with memory ${remembered}, without ${forgotten}`);
});
