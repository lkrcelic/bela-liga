import assert from "node:assert/strict";
import {test} from "node:test";
import {formatSmokingTables, parseSmokingTables, planHeading, roundDotLabel, smokersLabel, smokingSummary, tonightShareText, tonightTitle} from "../ui/smoking";

test("Pušački stolovi card line: off, none picked, no smokers, and counts that agree after 'u'", () => {
  assert.equal(smokingSummary(false, [1, 2], 7, 6), "Isključeno · svi stolovi su nepušački");
  assert.equal(smokingSummary(true, [], 7, 6), "Nije odabran nijedan stol");
  assert.equal(smokingSummary(true, [1, 2], 7, 6), "Stolovi 1, 2 · 7 pušača u 6 ekipa");
  assert.equal(smokingSummary(true, [3], 1, 1), "Stol 3 · 1 pušač u 1 ekipi");
  assert.equal(smokingSummary(true, [1, 2, 4], 3, 2), "Stolovi 1, 2, 4 · 3 pušača u 2 ekipe");
  assert.equal(smokingSummary(true, [1], 0, 0), "Stol 1 · nijedna ekipa nema pušača");
  assert.equal(smokingSummary(true, [1, 2], 0, 0), "Stolovi 1, 2 · nijedna ekipa nema pušača");
  assert.equal(smokingSummary(true, [1], 21, 21), "Stol 1 · 21 pušač u 21 ekipi");
});

test("Pušački raspored heading, before and after tonight's rounds", () => {
  assert.equal(planHeading(2, 3, 6), "2 pušačka stola × 3 kola · 6 ekipa s pušačima");
  assert.equal(planHeading(1, 1, 1), "1 pušački stol × 1 kolo · 1 ekipa s pušačima");
  assert.equal(planHeading(5, 4, 2), "5 pušačkih stolova × 4 kola · 2 ekipe s pušačima");
  assert.equal(planHeading(2, 0, 6), "Večeras još nema kola · 6 ekipa s pušačima");
  assert.equal(planHeading(0, 0, 0), "Večeras još nema kola · nijedna ekipa nema pušača");
  assert.equal(planHeading(2, 3, 0), "2 pušačka stola × 3 kola · nijedna ekipa nema pušača");
});

test("Pušački raspored heading when tonight's rounds were made without smoking tables", () => {
  assert.equal(planHeading(0, 3, 6), "Večeras nema pušačkih stolova · 3 kola · 6 ekipa s pušačima");
  assert.equal(planHeading(0, 1, 1), "Večeras nema pušačkih stolova · 1 kolo · 1 ekipa s pušačima");
});

test("smokers under a team name", () => {
  assert.equal(smokersLabel(0), "bez pušača");
  assert.equal(smokersLabel(1), "1 pušač");
  assert.equal(smokersLabel(2), "2 pušača");
  assert.equal(smokersLabel(5), "5 pušača");
});

test("rotation dots and tonight's share (DECISIONS 100: only tonight counts)", () => {
  assert.equal(roundDotLabel("Kolo 3", true), "Kolo 3: pušački stol");
  assert.equal(roundDotLabel("Kolo 3", false), "Kolo 3: običan stol");
  assert.equal(roundDotLabel("Skica A", null), "Skica A: nije za stolom");
  // a round without the team's table doesn't count among its rounds
  assert.equal(tonightShareText([true, null, false, true]), "2 / 3");
  assert.equal(tonightShareText([null, null]), "0 / 0");
  assert.equal(tonightTitle([true, false, true]), "Večeras 2 od 3 kola za pušačkim stolom");
  assert.equal(tonightTitle([false, null]), "Večeras 0 od 1 kola za pušačkim stolom");
  assert.equal(tonightTitle([]), "Večeras 0 od 0 kola za pušačkim stolom");
});

test("a tournament's Pušački stolovi as typed: numbers and ranges, in any order, once each", () => {
  assert.deepEqual(parseSmokingTables(""), []);
  assert.deepEqual(parseSmokingTables("   "), []);
  assert.deepEqual(parseSmokingTables("1, 2, 5"), [1, 2, 5]);
  assert.deepEqual(parseSmokingTables("5 1 2"), [1, 2, 5]);
  assert.deepEqual(parseSmokingTables("1-4, 7"), [1, 2, 3, 4, 7]);
  // an en dash, as a phone keyboard may put it, and a range that overlaps a number
  assert.deepEqual(parseSmokingTables("2–3; 3"), [2, 3]);
  assert.deepEqual(parseSmokingTables("100"), [100]);
});

test("Pušački stolovi that aren't table numbers are refused", () => {
  for (const text of ["0", "101", "1, x", "4-2", "1.5", "-3", "1-", "stol 1"]) assert.equal(parseSmokingTables(text), null, text);
});

test("the tables back in the form read as typed", () => {
  assert.equal(formatSmokingTables([3, 1, 2]), "1, 2, 3");
  assert.equal(formatSmokingTables([]), "");
  assert.deepEqual(parseSmokingTables(formatSmokingTables([1, 2, 7])), [1, 2, 7]);
});
