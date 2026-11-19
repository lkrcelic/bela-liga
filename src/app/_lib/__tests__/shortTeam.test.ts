import assert from "node:assert/strict";
import {test} from "node:test";
import {shortLineupNotes, shortTeamChip, shortTeamText, withShortTeam} from "@/app/_lib/ui/shortTeam";

// #41: a league team with fewer than two active players is marked in Novo kolo and Ekipe, and Tko igra says so

test("a team with two or more active players gets no warning", () => {
  assert.equal(shortTeamChip(2), null);
  assert.equal(shortTeamChip(3), null);
  assert.equal(shortTeamText(2), null);
});

test("a team whose count isn't known yet gets no warning", () => {
  assert.equal(shortTeamChip(undefined), null);
  assert.equal(shortTeamText(undefined), null);
});

test("a team with one active player is marked as one player", () => {
  assert.equal(shortTeamChip(1), "1 igrač");
  assert.equal(shortTeamText(1), "Ekipa ima samo 1 aktivnog igrača");
});

test("a team with no active player is marked as having none", () => {
  assert.equal(shortTeamChip(0), "Bez igrača");
  assert.equal(shortTeamText(0), "Ekipa nema aktivnih igrača");
});

test("Tko igra warns about each team of an open round that can't field two players", () => {
  const teams = [
    {name: "Kontra rekontra", members: [1]},
    {name: "Zvanje pedeset", members: [2, 3]},
  ];
  assert.deepEqual(shortLineupNotes(teams, false), ["Kontra rekontra ima samo jednog igrača s računom: dodaj igrača u ekipu ili potvrdi svejedno."]);
  assert.deepEqual(shortLineupNotes([{name: "A", members: []}, {name: "B", members: [4]}], false), [
    "A nema nijednog igrača s računom: dodaj igrača u ekipu.",
    "B ima samo jednog igrača s računom: dodaj igrača u ekipu ili potvrdi svejedno.",
  ]);
});

test("Tko igra says nothing when both teams have two players, or when the round is finished", () => {
  assert.deepEqual(shortLineupNotes([{name: "A", members: [1, 2]}, {name: "B", members: [3, 4, 5]}], false), []);
  assert.deepEqual(shortLineupNotes([{name: "A", members: [1]}, {name: "B", members: [3, 4]}], true), []);
});

test("in Novo kolo the one-player warning stands alone, or beside an arrival or Neaktivna chip, which stays", () => {
  assert.deepEqual(withShortTeam(null, 1, false), {label: "1 igrač", tone: "red", title: "Ekipa ima samo 1 aktivnog igrača · dodaj igrača na stranici ekipe"});
  assert.deepEqual(withShortTeam({label: "Tu · 19:42", tone: "green", title: "Potvrdio ana"}, 1, false), {
    label: "Tu · 19:42 · 1 igrač",
    tone: "red",
    title: "Potvrdio ana · Ekipa ima samo 1 aktivnog igrača · dodaj igrača na stranici ekipe",
  });
  assert.deepEqual(withShortTeam({label: "Neaktivna", tone: "muted"}, 0, false), {label: "Neaktivna · Bez igrača", tone: "red", title: "Ekipa nema aktivnih igrača · dodaj igrača na stranici ekipe"});
});

test("a ban's chip stays alone, and a full team's chip is unchanged", () => {
  const ban = {label: "Zabrana", tone: "red" as const, title: "x"};
  assert.equal(withShortTeam(ban, 1, true), ban);
  const tu = {label: "Tu · 19:42", tone: "green" as const};
  assert.equal(withShortTeam(tu, 2, false), tu);
  assert.equal(withShortTeam(null, 2, false), null);
});
