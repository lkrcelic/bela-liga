// A league with no nights yet (a new league without Dan igranja) says so; only a league whose nights are all past says
// its season has ended (#65)
import assert from "node:assert/strict";
import {test} from "node:test";
import {nightsLeftLabel} from "../nights";
import {noNextNight} from "../ui/adminTonight";

test("Datumi: a league with no nights says there are none yet, not that the season has ended", () => {
  assert.equal(nightsLeftLabel(0, 0), "Još nema večeri");
});

test("Datumi: a league whose nights are all past has ended its season", () => {
  assert.equal(nightsLeftLabel(0, 12), "Sezona je završila");
  assert.equal(nightsLeftLabel(3, 12), "još 3 večeri do kraja sezone");
});

test("Večer lige: a league with no nights says so and points to Datumi", () => {
  assert.deepEqual(noNextNight(0), {sub: "Dodaj večeri u Upravljanju ligom · Datumi", card: "Još nema večeri"});
});

test("Večer lige: after the last night the season has ended", () => {
  assert.deepEqual(noNextNight(12), {sub: "Sezona je završila", card: "Nema više večeri"});
});

test("Večer lige: while the nights are still loading it reads as before, never “Još nema večeri”", () => {
  assert.deepEqual(noNextNight(null), {sub: "Sezona je završila", card: "Nema više večeri"});
});
