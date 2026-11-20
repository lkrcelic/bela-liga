// Smoking tables (DECISIONS 100): each round's smoking tables go to the matches with the most smokers at the table;
// of matches with as many, to the one whose smoking teams sat at one fewer times in this event (a league night or a
// tournament), then to the better-ranked one. Nothing from an earlier night or tournament counts.
import {test} from "node:test";
import assert from "node:assert/strict";
import {Prisma} from "@prisma/client";
import {Team, TeamPair} from "@/app/_lib/matching/multipleRoundMatching";
import {seatRounds, SeatedPair, SmokingTable, smokingTurns} from "@/app/_lib/matching/smokingTables";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {teamSmokers} from "@/app/_lib/service/team/smokers";

const team = (id: number): Team => ({id, name: `Team ${id}`, score: 0, point_difference: 0, played_against: []});
const bye: Team = {id: BYE_TEAM_ID, name: "Bye", score: 0, point_difference: 0, played_against: []};
// pairs in the order the pairing gives them: [1, 2] is the best-ranked table
const round = (...pairs: [number, number][]): TeamPair[] =>
  pairs.map(([a, b]) => ({teamOne: a === BYE_TEAM_ID ? bye : team(a), teamTwo: b === BYE_TEAM_ID ? bye : team(b)}));
const smokers = (entries: Record<number, number>) => new Map(Object.entries(entries).map(([id, n]) => [Number(id), n]));
// turns at a smoking table earlier in the event, per team
const turns = smokers;

// "1-2@3": teams 1 and 2 at table 3, with "*" when it is a smoking table
const show = (seated: SeatedPair[]) => seated.map((p) => `${p.teamOne.id}-${p.teamTwo.id}@${p.table}${p.smoking ? "*" : ""}`);
const smokingTeams = (seated: SeatedPair[]) =>
  seated.filter((p) => p.smoking).flatMap((p) => [p.teamOne.id, p.teamTwo.id]).sort((a, b) => a - b);

test("without smoking tables every round keeps its order: tables 1, 2, ... and the bye last", () => {
  const rounds = [round([1, 2], [3, 4], [5, BYE_TEAM_ID])];
  assert.deepEqual(show(seatRounds(rounds)[0]), ["1-2@1", "3-4@2", `5-${BYE_TEAM_ID}@3`]);
  assert.deepEqual(show(seatRounds(rounds, {tables: [], smokers: smokers({1: 2}), turns: new Map()})[0]), ["1-2@1", "3-4@2", `5-${BYE_TEAM_ID}@3`]);
});

test("a match with smokers sits at the smoking table, the others keep their order on the rest", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {tables: [2], smokers: smokers({7: 1}), turns: new Map()})[0];
  assert.deepEqual(show(seated), ["1-2@1", "7-8@2*", "3-4@3", "5-6@4"]);
});

test("the smoking tables go in the order of their numbers, the match with more smokers first", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {
    tables: [4, 1],
    smokers: smokers({2: 1, 5: 1, 6: 2}),
    turns: new Map(),
  })[0];
  assert.deepEqual(show(seated), ["5-6@1*", "3-4@2", "7-8@3", "1-2@4*"]);
});

test("a smoking table no smoking team needs still gets a match, and is still a smoking table", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [1, 2], smokers: smokers({5: 1}), turns: new Map()})[0];
  assert.deepEqual(show(seated), ["5-6@1*", "1-2@2*", "3-4@3"]);
});

test("smoking tables above the round's number of tables are left out, and the bye never gets one", () => {
  const seated = seatRounds([round([1, 2], [3, BYE_TEAM_ID])], {tables: [2, 5], smokers: smokers({3: 3}), turns: new Map()})[0];
  assert.deepEqual(show(seated), ["1-2@1", `3-${BYE_TEAM_ID}@2`]);
});

test("equal smokers and equal turns keep the pairing's order", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [3], smokers: smokers({2: 1, 3: 1, 6: 1}), turns: new Map()})[0];
  assert.deepEqual(show(seated), ["3-4@1", "5-6@2", "1-2@3*"]);
});

test("a team with more smokers gets the smoking table, also when it already sat at one tonight", () => {
  // team 1 has three smokers and sat at the smoking table in tonight's first round; team 3 has one and hasn't
  const seated = seatRounds([round([1, 2], [3, 4])], {tables: [1], smokers: smokers({1: 3, 3: 1}), turns: turns({1: 1})})[0];
  assert.deepEqual(smokingTeams(seated), [1, 2]);
});

test("the smokers of both teams count together: two teams with one smoker beat one team with one", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {tables: [1], smokers: smokers({1: 1, 5: 1, 6: 1}), turns: new Map()})[0];
  assert.deepEqual(show(seated), ["5-6@1*", "1-2@2", "3-4@3"]);
});

test("with as many smokers, the match whose smoking teams sat at a smoking table fewer times goes first", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6])], {
    tables: [1, 2],
    // every match has two smokers: 1-2 sat twice, 3-4 once, 5-6 not yet
    smokers: smokers({1: 2, 3: 1, 4: 1, 5: 2}),
    turns: turns({1: 2, 3: 1}),
  })[0];
  assert.deepEqual(show(seated), ["5-6@1*", "3-4@2*", "1-2@3"]);
});

test("teams with as many smokers take turns over the rounds of one event", () => {
  // teams 1, 3 and 5 have one smoker each; each round they play a different non-smoking team
  const rounds = [round([1, 2], [3, 4], [5, 6]), round([1, 4], [3, 6], [5, 2]), round([1, 6], [3, 2], [5, 4])];
  const seated = seatRounds(rounds, {tables: [1], smokers: smokers({1: 1, 3: 1, 5: 1}), turns: new Map()});
  assert.deepEqual(seated.map(smokingTeams), [[1, 2], [3, 6], [4, 5]]);
});

test("a team with two smokers keeps the smoking table every round over teams with one", () => {
  const rounds = [round([1, 2], [3, 4], [5, 6]), round([1, 4], [3, 6], [5, 2]), round([1, 6], [3, 2], [5, 4])];
  const seated = seatRounds(rounds, {tables: [1], smokers: smokers({1: 2, 3: 1, 5: 1}), turns: new Map()});
  assert.deepEqual(seated.map(smokingTeams), [[1, 2], [1, 4], [1, 6]]);
});

test("as many smoking tables as smoking matches: every smoker sits at one, whatever the turns", () => {
  const seated = seatRounds([round([1, 2], [3, 4], [5, 6], [7, 8])], {
    tables: [1, 2, 3],
    smokers: smokers({2: 1, 4: 1, 8: 2}),
    turns: turns({2: 5, 4: 3, 8: 4}),
  })[0];
  // the turns only order them: 3-4 (3 turns) before 1-2 (5)
  assert.deepEqual(show(seated), ["7-8@1*", "3-4@2*", "1-2@3*", "5-6@4"]);
});

test("a tournament's pairs of ids are seated like a league's teams", () => {
  const pairs = [[{teamOne: {id: 11}, teamTwo: {id: 12}}, {teamOne: {id: 13}, teamTwo: {id: 14}}, {teamOne: {id: 15}, teamTwo: {id: BYE_TEAM_ID}}]];
  const seated = seatRounds(pairs, {tables: [1], smokers: smokers({14: 2, 15: 2}), turns: new Map()})[0];
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

// A table of the event: "1-2*" is teams 1 and 2 at a smoking table
const tables = (smokersOf: Record<number, number>, ...list: string[]): SmokingTable[] =>
  list.map((t) => {
    const [a, b] = t.replace("*", "").split("-").map(Number);
    return {team1Id: a, team2Id: b, team1Smokers: smokersOf[a] ?? 0, team2Smokers: smokersOf[b] ?? 0, smoking: t.endsWith("*")};
  });

test("turns count each smoking team's rounds at a smoking table; teams without smokers and the bye take none", () => {
  const s = {1: 1, 3: 2, 5: 1};
  const turnsSoFar = smokingTurns([
    ...tables(s, "1-2*", "3-4", "5-6"),
    ...tables(s, "3-2*", "1-4", "5-6"),
    ...tables(s, "3-1*", `5-${BYE_TEAM_ID}`, "2-4"),
  ]);
  assert.deepEqual(turnsSoFar, new Map([[1, 2], [3, 2]]));
});

test("a team takes no turn at a table where it had no smoker when it was seated", () => {
  // team 7 had no smoker when it sat at the smoking table; it has one now, but that table doesn't count for it
  assert.deepEqual(smokingTurns(tables({8: 1}, "7-8*")), new Map([[8, 1]]));
});
