import assert from "node:assert/strict";
import {test} from "node:test";
import {addedLabel, CandidateHit, markAdded} from "../ui/tournamentAdd";

// Dodaj ekipu (Upravljanje turnirom): a team just added stays in the search with where it went (in, or its place on the
// waiting list), so the sheet doesn't read "Nema takvih ekipa izvan turnira." after a successful add (#30)

const hit = (team_id: number, team_name: string): CandidateHit => ({team_id, team_name, players: [], reason: null});
const entry = (team_id: number, position: number | null = null) => ({team_id, position});

test("a team added to a tournament with room stays in the hits, marked as in", () => {
  const hits = [hit(1, "Alen Kitasović"), hit(2, "Alenovi")];
  const after = markAdded(hits, 1, {entries: [entry(9), entry(1)], waiting_list: []});
  assert.equal(after?.length, 2);
  assert.deepEqual(after?.[0].added, {position: null});
  assert.equal(after?.[1].added, undefined);
  assert.equal(addedLabel(after![0].added!), "Dodano");
});

test("a team added to a full tournament stays in the hits with its place on the waiting list", () => {
  const after = markAdded([hit(3, "Dalmatinci")], 3, {entries: [entry(1), entry(2)], waiting_list: [entry(7, 1), entry(3, 2)]});
  assert.deepEqual(after?.[0].added, {position: 2});
  assert.equal(addedLabel(after![0].added!), "Na čekanju · 2.");
});

test("the only hit, once added, still leaves a row, so the empty-search text doesn't show", () => {
  const after = markAdded([hit(1, "Alen Kitasović")], 1, {entries: [entry(1)], waiting_list: []});
  assert.equal(after?.length, 1);
});

test("no search yet stays no search", () => {
  assert.equal(markAdded(null, 1, {entries: [entry(1)], waiting_list: []}), null);
});
