import assert from "node:assert/strict";
import {test} from "node:test";
import {homeCard, TonightTeam} from "../homeCard";
import {byTeamName, copyText, isSlot, isTwoPlaceNight, otherSlot, swapSlots} from "../locations";
import {ownSecondRounds, placeOfTeam, placeRounds} from "../nights";
import {nightKolo, placeLastPublished, publishNumbers, RoundStatus} from "../roundStatus";

// Liga na dvije lokacije (LOCATIONS_PLAN.md): slots, Podjela's helpers, the shared Kolo numbers and the home card.

test("a place of a two-place night is slot 1 or 2", () => {
  assert.equal(isSlot(1), true);
  assert.equal(isSlot(2), true);
  for (const v of [0, 3, null, undefined, "1"]) assert.equal(isSlot(v), false);
  assert.equal(otherSlot(1), 2);
  assert.equal(otherSlot(2), 1);
  assert.equal(isTwoPlaceNight({second_location_id: 4}), true);
  assert.equal(isTwoPlaceNight({second_location_id: null}), false);
  assert.equal(isTwoPlaceNight({second_location_id: undefined}), false);
});

test("teams are sorted the Croatian way, case aside", () => {
  const names = ["Špicom u stomak", "Sinjski alkari", "čvorci", "Cvjetići", "Akužavci", "astletičari"];
  assert.deepEqual(
    names.map((name) => ({name})).sort(byTeamName).map((t) => t.name),
    ["Akužavci", "astletičari", "Cvjetići", "čvorci", "Sinjski alkari", "Špicom u stomak"]
  );
});

test("Zamijeni lokacije sends every assigned team to the other place", () => {
  const swapped = swapSlots(
    new Map([
      [1, 1],
      [2, 2],
      [3, 1],
    ])
  );
  assert.deepEqual(Array.from(swapped), [
    [1, 2],
    [2, 1],
    [3, 2],
  ]);
  assert.equal(swapSlots(new Map()).size, 0);
});

test("Kopiraj raspored: each place and its teams alphabetically, a blank line between places", () => {
  const text = copyText([
    {name: "Kartaš", teams: ["Mujo i Haso", "Alen Kitasović", "Špicom u stomak", "Barcelona"]},
    {name: "Lanterna", teams: ["Zadnja ruka", "Akužavci"]},
  ]);
  assert.equal(
    text,
    ["Kartaš", "• Alen Kitasović", "• Barcelona", "• Mujo i Haso", "• Špicom u stomak", "", "Lanterna", "• Akužavci", "• Zadnja ruka"].join("\n")
  );
  // a place without teams is just its name
  assert.equal(copyText([{name: "Kartaš", teams: []}, {name: "Lanterna", teams: ["Akužavci"]}]), "Kartaš\n\nLanterna\n• Akužavci");
});

// a round of tonight at one place: its number now, status and Skica letter order
const r = (roundNumber: number, status: RoundStatus, draftOrder: number | null = null) => ({roundNumber, status, draftOrder});

test("both places of a night share the Kolo numbers: Kartaš 7, 8, 9 and Lanterna 7, 8", () => {
  // the league's last published round before tonight is Kolo 6
  const beforeNight = 6;
  // Kartaš publishes its three Kola first
  const kartas = publishNumbers([r(101, "APPROVED", 1), r(102, "APPROVED", 2), r(103, "APPROVED", 3)], placeLastPublished(beforeNight, []));
  assert.deepEqual([kartas.get(101), kartas.get(102), kartas.get(103)], [7, 8, 9]);
  // Lanterna starts from 7 too, whatever Kartaš published
  const lanterna = publishNumbers([r(201, "APPROVED", 1), r(202, "APPROVED", 2)], placeLastPublished(beforeNight, []));
  assert.deepEqual([lanterna.get(201), lanterna.get(202)], [7, 8]);
});

test("a place that published some Kola tonight goes on after its own", () => {
  // Lanterna published Kolo 7 earlier; its new Skica becomes Kolo 8, not 10 after Kartaš's 9
  const lanterna = publishNumbers([r(301, "APPROVED", 1)], placeLastPublished(6, [7]));
  assert.equal(lanterna.get(301), 8);
  // the place that publishes second in time still starts at 7
  const kartas = publishNumbers([r(401, "APPROVED", 1)], placeLastPublished(6, []));
  assert.equal(kartas.get(401), 7);
});

test("Kolo 1/3: which of the place's published Kola tonight a table is", () => {
  assert.deepEqual(nightKolo(7, [7, 8, 9]), [1, 3]);
  assert.deepEqual(nightKolo(9, [9, 7, 8]), [3, 3]);
  // the numbers come once per table
  assert.deepEqual(nightKolo(8, [7, 7, 8, 8, 9, 9]), [2, 3]);
  // a Kolo added later makes it out of 4
  assert.deepEqual(nightKolo(7, [7, 8, 9, 10]), [1, 4]);
  assert.equal(nightKolo(11, [7, 8, 9]), null);
});

const tonight = (over: Partial<TonightTeam> = {}): TonightTeam => ({started: true, here: true, lastTable: null, lastKoloOut: false, ...over});
const played = (k: number, n: number, bye = false) => ({kolo: [k, n] as [number, number], bye});

test("a table to play or being played comes first", () => {
  assert.equal(homeCard({openTable: true, tonight: tonight({lastTable: played(3, 3), lastKoloOut: true}), nextNight: true}), "table");
});

test("before the team's first table the night's card shows (Tu ste · Igrate u idućem kolu)", () => {
  assert.equal(homeCard({openTable: false, tonight: tonight(), nextNight: true}), "night");
  // before the start and after leaving, the night's card says it
  assert.equal(homeCard({openTable: false, tonight: tonight({started: false}), nextNight: true}), "night");
  assert.equal(homeCard({openTable: false, tonight: tonight({here: false, lastTable: played(1, 3)}), nextNight: true}), "night");
});

test("Sljedeći stol after a table that isn't the place's last", () => {
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(1, 3)}), nextNight: true}), "next");
  // the last of the Kola made so far, while the place hasn't made all of tonight's yet
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(2, 2), lastKoloOut: false}), nextNight: true}), "next");
});

test("Pauza for a bye that isn't in the last Kolo", () => {
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(2, 3, true), lastKoloOut: true}), nextNight: true}), "bye");
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(2, 2, true), lastKoloOut: false}), nextNight: true}), "bye");
});

test("Kraj večeri after the table in the place's last Kolo, or a bye in it", () => {
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(3, 3), lastKoloOut: true}), nextNight: true}), "end");
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(3, 3, true), lastKoloOut: true}), nextNight: false}), "end");
  // the admin made a fourth Kolo: Kolo 3 is no longer the last
  assert.equal(homeCard({openTable: false, tonight: tonight({lastTable: played(3, 4), lastKoloOut: true}), nextNight: true}), "next");
});

test("with no night tonight: the next night's card, else Nema zakazane večeri", () => {
  assert.equal(homeCard({openTable: false, tonight: null, nextNight: true}), "night");
  assert.equal(homeCard({openTable: false, tonight: null, nextNight: false}), "none");
});

test("a place's Broj kola: the second place's own, else the night's, else the league's (Bela)", () => {
  const night = {rounds_per_night: 3, second_rounds_per_night: 2};
  assert.equal(placeRounds(night, 4, 2), 2);
  assert.equal(placeRounds(night, 4, 1), 3);
  // a one-place night counts the night's
  assert.equal(placeRounds(night, 4, null), 3);
  assert.equal(placeRounds({rounds_per_night: 3, second_rounds_per_night: null}, 4, 2), 3);
  assert.equal(placeRounds({rounds_per_night: null}, 4, 2), 4);
  assert.equal(placeRounds(undefined, 4, 1), 4);
});

test("Uredi večer keeps the second place's Broj kola only when it differs from the first place's", () => {
  assert.equal(ownSecondRounds(true, 2, 3), 2);
  // picked the same as the first place: the same, not a number of its own
  assert.equal(ownSecondRounds(true, 3, 3), null);
  assert.equal(ownSecondRounds(true, null, 3), null);
  // a one-place night has none
  assert.equal(ownSecondRounds(false, 2, 3), null);
});

test("a team sees its own place on a two-place night, none before Podjela, and the night's at one place", () => {
  const kartas = {id: 1, name: "Kartaš", address: null, url: null};
  const lanterna = {id: 2, name: "Lanterna", address: null, url: null};
  const league = {places: {n1: kartas, n2: kartas}, secondPlaces: {n2: lanterna}, slots: {} as Record<string, number>};
  assert.equal(placeOfTeam(league, "n1")?.name, "Kartaš");
  assert.equal(placeOfTeam(league, "n2"), null);
  assert.equal(placeOfTeam({...league, slots: {n2: 2}}, "n2")?.name, "Lanterna");
  assert.equal(placeOfTeam({...league, slots: {n2: 1}}, "n2")?.name, "Kartaš");
  assert.equal(placeOfTeam(league, "n3"), null);
});

