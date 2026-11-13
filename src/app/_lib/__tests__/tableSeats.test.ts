import assert from "node:assert/strict";
import {test} from "node:test";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {meetingOf, newTableNumber, nightMeetings, planSeats, repeatedTables} from "@/app/_lib/tableSeats";

// Re-pairing a table on the Daily screen: who sits where afterwards

const round = () =>
  new Map<number, [number, number]>([
    [1, [1, 2]],
    [2, [3, 4]],
    [3, [5, 6]],
  ]);
const seated = (m: Map<number, [number, number]>) => Array.from(m.values()).flat().sort((a, b) => a - b);

test("taking a team from another table swaps it with the team it replaces", () => {
  const out = planSeats(round(), 1, [1, 4]);
  assert.deepEqual(out.get(1), [1, 4]);
  assert.deepEqual(out.get(2), [3, 2]);
  assert.deepEqual(out.get(3), [5, 6]);
});

test("both teams from other tables: each of those tables gets one of the old pair", () => {
  const out = planSeats(round(), 1, [3, 5]);
  assert.deepEqual(out.get(1), [3, 5]);
  assert.deepEqual(out.get(2), [1, 4]);
  assert.deepEqual(out.get(3), [2, 6]);
  assert.deepEqual(seated(out), [1, 2, 3, 4, 5, 6]);
});

test("a whole pair from another table: the two tables trade pairs", () => {
  const out = planSeats(round(), 1, [3, 4]);
  assert.deepEqual(out.get(1), [3, 4]);
  assert.deepEqual(out.get(2), [1, 2]);
});

test("swapping sides at the same table changes only that table", () => {
  const out = planSeats(round(), 1, [2, 1]);
  assert.deepEqual(out.get(1), [2, 1]);
  assert.deepEqual(out.get(2), [3, 4]);
});

test("a team that isn't playing in the round just takes the seat", () => {
  const out = planSeats(round(), 2, [3, 9]);
  assert.deepEqual(out.get(2), [3, 9]);
  assert.deepEqual(seated(out), [1, 2, 3, 5, 6, 9]);
});

test("the input map is left as it was", () => {
  const input = round();
  planSeats(input, 1, [3, 5]);
  assert.deepEqual(input.get(1), [1, 2]);
});

test("one team of the pair stays and the other comes from another table: the team leaving takes that seat", () => {
  const out = planSeats(round(), 1, [2, 3]);
  assert.deepEqual(out.get(1), [2, 3]);
  assert.deepEqual(out.get(2), [1, 4]);
  assert.deepEqual(seated(out), [1, 2, 3, 4, 5, 6]);
});

test("a team seated with the bye: the team it replaces doesn't play the round, and no other table changes", () => {
  const out = planSeats(round(), 2, [3, BYE_TEAM_ID]);
  assert.deepEqual(out.get(2), [3, BYE_TEAM_ID]);
  assert.deepEqual(out.get(1), [1, 2]);
  assert.deepEqual(out.get(3), [5, 6]);
});

test("the bye at another table stays there: several tables can have it", () => {
  const seats = round();
  seats.set(4, [7, BYE_TEAM_ID]);
  const out = planSeats(seats, 1, [1, BYE_TEAM_ID]);
  assert.deepEqual(out.get(1), [1, BYE_TEAM_ID]);
  assert.deepEqual(out.get(4), [7, BYE_TEAM_ID]);
});

test("a team taken from the bye's table leaves its opponent the bye", () => {
  const seats = round();
  seats.set(4, [7, BYE_TEAM_ID]);
  const out = planSeats(seats, 4, [7, 2]);
  assert.deepEqual(out.get(4), [7, 2]);
  assert.deepEqual(out.get(1), [1, BYE_TEAM_ID]);
});

// Dodaj stol: the number the new table gets
const numbered = (...tables: [number, number, number][]) =>
  tables.map(([team1_id, team2_id, table_number]) => ({team1_id, team2_id, table_number}));

test("a table added after one was removed takes the free number", () => {
  // Stol 2 removed from six tables
  assert.equal(newTableNumber(numbered([1, 2, 1], [5, 6, 3], [7, 8, 4], [9, 10, 5], [11, 12, 6]), false), 2);
  // Stol 12 removed, the bye at 13
  const kolo = numbered(...Array.from({length: 11}, (_, i) => [i * 2 + 1, i * 2 + 2, i + 1] as [number, number, number]), [23, BYE_TEAM_ID, 13]);
  assert.equal(newTableNumber(kolo, false), 12);
});

test("a table added to a full round goes after the last one", () => {
  assert.equal(newTableNumber(numbered([1, 2, 1], [3, 4, 2]), false), 3);
  // the bye's number isn't free
  assert.equal(newTableNumber(numbered([1, 2, 1], [3, BYE_TEAM_ID, 2]), false), 3);
});

test("a table with the bye is added after all the others", () => {
  assert.equal(newTableNumber(numbered([1, 2, 1], [5, 6, 3]), true), 4);
});

// Skica: a re-paired table that repeats a pair of tonight's other rounds
const night = [
  {roundNumber: 1, letter: null, tables: [{table: 9, team1: {id: 1}, team2: {id: 2}}, {table: 10, team1: {id: 3}, team2: {id: BYE_TEAM_ID}}]},
  {roundNumber: 2, letter: "A", tables: [{table: 1, team1: {id: 2}, team2: {id: 1}}, {table: 2, team1: {id: 3}, team2: {id: 4}}]},
  {roundNumber: 3, letter: "B", tables: [{table: null, team1: {id: 4}, team2: {id: 3}}]},
];

test("nightMeetings lists the other rounds' pairs with where they sit, without bye tables", () => {
  assert.deepEqual(nightMeetings(night, 2), [
    {teams: [1, 2], where: "Kolo 1, stol 9"},
    {teams: [4, 3], where: "Skica B, stol 1"},
  ]);
});

test("meetingOf finds a pair in either order and never the bye", () => {
  const met = nightMeetings(night, 2);
  assert.equal(meetingOf(met, 2, 1)?.where, "Kolo 1, stol 9");
  assert.equal(meetingOf(met, 3, 4)?.where, "Skica B, stol 1");
  assert.equal(meetingOf(met, 1, 3), undefined);
  assert.equal(meetingOf(met, 3, BYE_TEAM_ID), undefined);
});

test("repeatedTables marks a round's tables that repeat another round's pair", () => {
  assert.deepEqual(repeatedTables(night, 2), [
    {table: 1, where: "Kolo 1, stol 9"},
    {table: 2, where: "Skica B, stol 1"},
  ]);
  assert.deepEqual(repeatedTables(night, 1), [{table: 9, where: "Skica A, stol 1"}]);
  assert.deepEqual(repeatedTables(night, 7), []);
});
