import assert from "node:assert/strict";
import {test} from "node:test";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {firstKoloPairs, KoloPair, SwissTeam, swissPairs} from "@/app/_lib/matching/tournamentPairing";
import {Entry, playersInOtherEntries, rebalance, signUpStatus, waitingList} from "@/app/_lib/tournamentEntries";
import {
  capacityLabel,
  completedKolos,
  daysUntilLabel,
  feeLabel,
  formatLabel,
  koloSteps,
  liveKolo,
  opponentsOf,
  prizeSummary,
  rankTeams,
  rulesLabel,
  TableResult,
  tournamentPhase,
  tournamentStatus,
  tournamentTotals,
} from "@/app/_lib/tournaments";
import {dateTile} from "@/app/_lib/nights";

// Turniri: pairing the Kolos, the waiting list, the standings and the words of the screens

// a repeatable random number generator for the draws
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const teamsIn = (pairs: KoloPair[]) => pairs.flat().filter((id) => id !== BYE_TEAM_ID).sort((a, b) => a - b);

test("Kolo 1 is a draw: every team plays once, and with an odd number of teams the last one drawn has the bye", () => {
  const ids = [1, 2, 3, 4, 5, 6, 7];
  const pairs = firstKoloPairs(ids, seeded(7));
  assert.deepEqual(teamsIn(pairs), ids);
  assert.equal(pairs.length, 4);
  assert.equal(pairs[3][1], BYE_TEAM_ID);
  assert.equal(pairs.filter((p) => p.includes(BYE_TEAM_ID)).length, 1);
  // the same draw for the same random numbers, another one for others
  assert.deepEqual(firstKoloPairs(ids, seeded(7)), pairs);
  assert.notDeepEqual(firstKoloPairs(ids, seeded(8)), pairs);
  assert.deepEqual(firstKoloPairs([4, 9], () => 0.5).flat().sort(), [4, 9]);
  assert.deepEqual(firstKoloPairs([]), []);
});

const swiss = (id: number, points: number, difference: number, opponents: number[] = []): SwissTeam => ({id, points, difference, opponents});

test("Swiss: neighbours in the standings meet, the better team first, table 1 at the top", () => {
  const plan = swissPairs([swiss(1, 4, 50), swiss(2, 4, 20), swiss(3, 2, 10), swiss(4, 2, -5), swiss(5, 0, -30), swiss(6, 0, -45)]);
  assert.deepEqual(plan.pairs, [[1, 2], [3, 4], [5, 6]]);
  assert.deepEqual(plan.repeats, []);
});

test("Swiss: teams that met already are kept apart when another pairing works", () => {
  const plan = swissPairs([swiss(1, 4, 50, [2]), swiss(2, 4, 20, [1]), swiss(3, 2, 10), swiss(4, 2, -5)]);
  assert.deepEqual(plan.repeats, []);
  assert.ok(!plan.pairs.some(([a, b]) => (a === 1 && b === 2) || (a === 2 && b === 1)));
  assert.deepEqual(teamsIn(plan.pairs), [1, 2, 3, 4]);
});

test("Swiss: the lowest team without a bye gets the bye, never a second one while another team can take it", () => {
  const plan = swissPairs([swiss(1, 4, 10), swiss(2, 2, 0), swiss(3, 2, -2), swiss(4, 0, -5), swiss(5, 2, 300, [BYE_TEAM_ID])]);
  const bye = plan.pairs.find((p) => p[1] === BYE_TEAM_ID)!;
  assert.equal(bye[0], 4);
  assert.deepEqual(plan.pairs[plan.pairs.length - 1], bye);
  // the last team already had one: the one above it takes it
  const again = swissPairs([swiss(1, 4, 10), swiss(2, 2, 0), swiss(3, 0, -5, [BYE_TEAM_ID])]);
  assert.deepEqual(again.pairs.find((p) => p[1] === BYE_TEAM_ID), [2, BYE_TEAM_ID]);
  assert.deepEqual(again.repeats, []);
});

test("Swiss: the bye goes to the lowest team even when that keeps the leaders apart", () => {
  // after Kolo 1 of the click-through of 26.10.: the two teams on 2 points met, so with the bye on the last team the
  // leaders can't meet each other; the bye still goes to the last team, not to the one on 2 points
  const plan = swissPairs([swiss(1, 4, 602, [BYE_TEAM_ID]), swiss(2, 4, 532, [5]), swiss(3, 2, 20, [4]), swiss(4, 2, -20, [3]), swiss(5, 0, -532, [2])]);
  assert.deepEqual(plan.pairs, [[1, 3], [2, 4], [5, BYE_TEAM_ID]]);
  assert.deepEqual(plan.repeats, []);
});

test("Swiss: a meeting nobody can avoid is made and reported", () => {
  // three teams that all met: someone meets again (or takes a second bye)
  const plan = swissPairs([swiss(1, 2, 0, [2, 3]), swiss(2, 2, 0, [1, 3]), swiss(3, 2, 0, [1, 2, BYE_TEAM_ID])]);
  assert.deepEqual(teamsIn(plan.pairs), [1, 2, 3]);
  assert.equal(plan.repeats.length, 1);
  assert.deepEqual(swissPairs([swiss(9, 0, 0)]).pairs, [[9, BYE_TEAM_ID]]);
  assert.deepEqual(swissPairs([]).pairs, []);
});

test("a whole tournament: 23 teams over 9 Kolos, nobody meets twice and no team has two byes", () => {
  const ids = Array.from({length: 23}, (_, i) => i + 1);
  const random = seeded(42);
  const tables: TableResult[] = [];
  const play = (pairs: KoloPair[], kolo: number) => {
    for (const [a, b] of pairs) {
      const bye = b === BYE_TEAM_ID;
      const wins1 = bye ? 2 : Math.floor(random() * 3);
      tables.push({kolo, team1Id: a, team2Id: b, team1Wins: wins1, team2Wins: 2 - wins1, open: false, started: true, diff: bye ? 602 : Math.round((random() - 0.5) * 400)});
    }
  };
  play(firstKoloPairs(ids, random), 1);
  for (let kolo = 2; kolo <= 9; kolo++) {
    const totals = tournamentTotals(ids, tables);
    const opponents = opponentsOf(tables);
    const standings = rankTeams(ids.map((id) => ({id, name: `Ekipa ${id}`, totals: totals.get(id)!})));
    const plan = swissPairs(standings.map((t) => swiss(t.id, t.totals.points, t.totals.difference, opponents.get(t.id) ?? [])));
    assert.deepEqual(plan.repeats, [], `Kolo ${kolo}`);
    assert.deepEqual(teamsIn(plan.pairs), ids);
    play(plan.pairs, kolo);
  }
  const met = new Set<string>();
  for (const t of tables) {
    if (t.team2Id === BYE_TEAM_ID) continue;
    const key = [t.team1Id, t.team2Id].sort((a, b) => a - b).join("-");
    assert.ok(!met.has(key), `${key} met twice`);
    met.add(key);
  }
  const byes = tables.filter((t) => t.team2Id === BYE_TEAM_ID).map((t) => t.team1Id);
  assert.equal(new Set(byes).size, byes.length);
});

const entry = (teamId: number, status: Entry["status"], minute: number): Entry => ({teamId, status, registeredAt: new Date(Date.UTC(2026, 9, 20, 10, minute))});

test("signing up: in while there is room, then the waiting list; no limit is always in", () => {
  assert.equal(signUpStatus(3, 4), "REGISTERED");
  assert.equal(signUpStatus(4, 4), "WAITING");
  assert.equal(signUpStatus(40, null), "REGISTERED");
});

test("the waiting list goes in sign-up order; a free place takes the team waiting longest", () => {
  const entries = [entry(1, "REGISTERED", 1), entry(2, "REGISTERED", 2), entry(5, "WAITING", 9), entry(4, "WAITING", 5)];
  assert.deepEqual(waitingList(entries).map((e) => e.teamId), [4, 5]);
  // team 2 leaves: one place for the first team waiting
  assert.deepEqual(rebalance(entries.filter((e) => e.teamId !== 2), 2), [{teamId: 4, status: "REGISTERED"}]);
  // a higher limit takes in as many as fit, no limit takes them all
  assert.deepEqual(rebalance(entries, 3), [{teamId: 4, status: "REGISTERED"}]);
  assert.deepEqual(rebalance(entries, null).map((c) => c.teamId), [4, 5]);
  assert.deepEqual(rebalance(entries, 2), []);
});

test("a lower limit sends the last teams to sign up to the waiting list", () => {
  const entries = [entry(1, "REGISTERED", 1), entry(2, "REGISTERED", 3), entry(3, "REGISTERED", 2), entry(9, "WAITING", 30)];
  assert.deepEqual(rebalance(entries, 2), [{teamId: 2, status: "WAITING"}]);
  assert.deepEqual(rebalance(entries, 1).map((c) => c.teamId), [3, 2]);
});

test("a player signs up with one team only", () => {
  assert.deepEqual(playersInOtherEntries([1, 2, 3], [{teamId: 7, playerIds: [3, 4]}, {teamId: 8, playerIds: [9]}]), [3]);
  assert.deepEqual(playersInOtherEntries([1, 2], []), []);
});

const table = (kolo: number, a: number, b: number, w1: number, w2: number, diff: number, open = false, started = true): TableResult => ({
  kolo,
  team1Id: a,
  team2Id: b,
  team1Wins: w1,
  team2Wins: w2,
  open,
  started,
  diff,
});

test("the standings count tables played to the end: a win 2, a draw 1, the difference of every match, the bye too", () => {
  const tables = [table(1, 1, 2, 2, 0, 300), table(1, 3, BYE_TEAM_ID, 2, 0, 602), table(2, 1, 3, 1, 1, -20), table(2, 2, 4, 0, 0, 0, true), table(2, 5, 6, 0, 0, 0, true, false)];
  const totals = tournamentTotals([1, 2, 3, 4, 5, 6], tables);
  assert.deepEqual(totals.get(1), {teamId: 1, played: 2, wins: 1, draws: 1, losses: 0, points: 3, difference: 280, live: false});
  assert.deepEqual(totals.get(3), {teamId: 3, played: 2, wins: 1, draws: 1, losses: 0, points: 3, difference: 622, live: false});
  assert.equal(totals.get(2)!.losses, 1);
  assert.equal(totals.get(2)!.live, true);
  assert.equal(totals.get(4)!.played, 0);
  // a table not started yet isn't live
  assert.equal(totals.get(5)!.live, false);
  assert.ok(!totals.has(BYE_TEAM_ID));

  const ranked = rankTeams([1, 2, 3, 4].map((id) => ({id, name: `T${id}`, totals: totals.get(id)!})));
  assert.deepEqual(ranked.map((t) => t.id), [3, 1, 4, 2]);
  assert.deepEqual(opponentsOf(tables).get(3), [BYE_TEAM_ID, 1]);
});

test("equal points and difference go by name, in Croatian order", () => {
  const zero = {played: 0, wins: 0, draws: 0, losses: 0, points: 0, difference: 0, live: false};
  const ranked = rankTeams([{name: "Zagorci", totals: {teamId: 1, ...zero}}, {name: "Čakovčani", totals: {teamId: 2, ...zero}}, {name: "Dalmatinci", totals: {teamId: 3, ...zero}}]);
  assert.deepEqual(ranked.map((t) => t.name), ["Čakovčani", "Dalmatinci", "Zagorci"]);
});

test("a tournament is upcoming until Kolo 1 is out, active while Kolos are played, finished after the last one", () => {
  const t = {startedAt: null, cancelledAt: null, rounds: 2};
  assert.equal(tournamentPhase(t, []), "upcoming");
  assert.equal(tournamentPhase(t, [{number: 1, published: false, tables: 3, done: 0, live: 0}]), "upcoming");
  const started = {...t, startedAt: "2026-10-31T09:00:00Z"};
  const one = {number: 1, published: true, tables: 3, done: 3, live: 0};
  assert.equal(tournamentPhase(started, [one]), "active");
  assert.equal(tournamentPhase(started, [one, {number: 2, published: true, tables: 3, done: 2, live: 1}]), "active");
  assert.equal(tournamentPhase(started, [one, {number: 2, published: true, tables: 3, done: 3, live: 0}]), "finished");
  // the admin lowered Broj kola to the Kolos played: over
  assert.equal(tournamentPhase({...started, rounds: 1}, [one]), "finished");
  assert.equal(tournamentPhase({...t, cancelledAt: "2026-10-20T09:00:00Z"}, []), "cancelled");
});

test("the Kolos played, the one being played and every Kolo's step", () => {
  const kolos = [
    {number: 1, published: true, tables: 3, done: 3, live: 0},
    {number: 2, published: true, tables: 3, done: 1, live: 2},
  ];
  assert.equal(completedKolos(kolos), 1);
  assert.equal(liveKolo(kolos), 2);
  assert.equal(liveKolo([kolos[0]]), null);
  assert.deepEqual(
    koloSteps(4, [...kolos, {number: 3, published: false, tables: 3, done: 0, live: 0}]).map((k) => k.step),
    ["played", "live", "draft", "waiting"]
  );
});

test("the words of the tournament screens", () => {
  assert.equal(daysUntilLabel("2026-10-31", "2026-10-25"), "Za 6 dana");
  assert.equal(daysUntilLabel("2026-10-26", "2026-10-25"), "Sutra");
  assert.equal(daysUntilLabel("2026-10-25", "2026-10-25"), "Danas");
  assert.equal(daysUntilLabel("2026-11-15", "2026-10-25"), "Za 21 dan");
  assert.equal(daysUntilLabel("2026-10-20", "2026-10-25"), "");
  assert.equal(rulesLabel(true), "1001 · zvanja");
  assert.equal(rulesLabel(false), "1001 · bez zvanja");
  assert.equal(formatLabel(9, 2), "9 kola");
  assert.equal(formatLabel(7, 1), "7 kola · 1 partija po kolu");
  assert.deepEqual(feeLabel(20), {title: "Kotizacija 20 € po igraču", sub: "Plaća se na dan turnira", free: false});
  assert.equal(feeLabel(0).title, "Bez stresa, bez obveza");
  assert.equal(capacityLabel(22, 24), "22 / 24");
  assert.equal(capacityLabel(9, null), "9");
  assert.deepEqual(dateTile("2026-10-31"), {weekday: "SUB", day: "31", month: "LIS"});
  assert.deepEqual(dateTile("2027-03-13"), {weekday: "SUB", day: "13", month: "OŽU"});
  assert.equal(dateTile("2026-02-31"), null);
});

test("the prizes' summary: the total of amounts in euros, else the prizes", () => {
  const p = (place: number, prize: string) => ({place, prize, description: ""});
  assert.equal(prizeSummary([p(1, "300 €"), p(2, "200 €"), p(3, "100 €")]), "Ukupno 600 € · prva tri mjesta");
  assert.equal(prizeSummary([p(1, "150€")]), "Ukupno 150 € · prvo mjesto");
  assert.equal(prizeSummary([p(1, "Pehar"), p(2, "Medalje"), p(3, "Medalje")]), "Pehar, Medalje · prva tri mjesta");
  assert.equal(prizeSummary([]), null);
});

test("a tournament's status in the admin's list", () => {
  assert.equal(tournamentStatus("upcoming", true, 3).label, "Lista čekanja · 3");
  assert.equal(tournamentStatus("upcoming", true, 0).label, "Prijave otvorene");
  assert.equal(tournamentStatus("upcoming", false, 0).label, "Prijave zatvorene");
  assert.equal(tournamentStatus("active", false, 2).label, "Uživo");
  assert.equal(tournamentStatus("finished", false, 0).label, "Završeno");
  assert.equal(tournamentStatus("cancelled", false, 0).label, "Otkazan");
});

test("a table bez zvanja takes only one bela (20) a hand; with zvanja anything goes", async () => {
  const {declarationsError, BELA_ONLY_ERROR, ONE_BELA_ERROR} = await import("@/app/_lib/validation/validateResult");
  const z = (team: 1 | 2, announcement_type: string) => ({team, announcement_type});
  assert.equal(declarationsError(false, []), null);
  assert.equal(declarationsError(false, undefined), null);
  assert.equal(declarationsError(false, [z(1, "TWENTY")]), null);
  assert.equal(declarationsError(false, [z(1, "FIFTY")]), BELA_ONLY_ERROR);
  assert.equal(declarationsError(false, [z(1, "TWENTY"), z(2, "TWENTY")]), ONE_BELA_ERROR);
  assert.equal(declarationsError(true, [z(1, "FIFTY"), z(2, "TWO_HUNDRED")]), null);
});

test("a tournament's table of one match shows only Meč 1", async () => {
  const {matchSlots, currentMatchNumber} = await import("@/app/_lib/tableOverview");
  assert.equal(matchSlots([], 1).length, 1);
  assert.equal(matchSlots([]).length, 2);
  assert.equal(currentMatchNumber([{number: 1, kind: "finished"}], 1), 1);
});
