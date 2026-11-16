// C5 · the admin corrects a finished match that can't go back in play (c826481, DECISIONS #84 and #97): the change
// leaves both teams under 1001, but the table isn't tonight's or something came after the match, or its time is used
// up. "Meč ostaje bez pobjednika?" then says the score it would have and why it can't reopen; Odustani changes nothing,
// and Obriši svejedno leaves the match without a winner, with the table's wins and the standings recounted. A league
// table never offers Otključaj partiju (that is the tournaments' manual way, c5-otkljucaj).
// The tables are the seeded ones of tonight and last week: tables.adminEdit in "E2E · Scorepad", the current league's
// live night (a Kolo still being played, and the Skica waiting after it). Each test uses the deciding hand of a match,
// its last, without which nobody has 1001.
import type {Page} from "@playwright/test";
import {expect, test as base} from "../../helpers/fixtures";
import {
  cantReopen,
  decidingHand,
  deleteHand,
  expectHand,
  finishedMatches,
  lineup,
  moved,
  noWinnerSheet,
  openTable,
  pickMatch,
  putBackDecidingHand,
  ratings,
  standings,
  winnerOf,
} from "../../helpers/c5";
import type {Db} from "../../helpers/db";
import type {World} from "../../helpers/world";
import {expectTotal, handRows} from "../../helpers/scorepad";

type Catalog = World["catalog"];
type Found = {leagueId: number; roundId: number; mec: 1 | 2};

// Tonight's tables of the current league (its Kolos, the Skica after them), table by table
async function tonightOfCurrent(db: Db, world: Catalog) {
  const {id, tonight} = world.leagues.current;
  return db.round.findMany({
    where: {leagueRounds: {some: {league_id: id}}, round_date: new Date(tonight!)},
    orderBy: [{round_number: "asc"}, {table_number: "asc"}],
    include: {matches: true, ongoingMatches: {include: {_count: {select: {belaResults: true}}}}},
  });
}

const CASES: {why: string; table: string; find: (db: Db, world: Catalog) => Promise<Found>; playedMinutes?: number}[] = [
  {
    why: "Za stolom je već odigran sljedeći meč",
    table: "Meč 1 of tonight's played table",
    find: async (_db, world) => ({leagueId: world.leagues.scorepad.id, roundId: world.tables.adminEdit.roundId, mec: 1}),
  },
  {
    why: "Za stolom se već igra sljedeći meč",
    table: "Meč 1 of a table playing its Meč 2",
    find: async (db, world) => {
      const table = (await tonightOfCurrent(db, world)).find((r) => r.status === "PUBLISHED" && r.matches.length === 1 && r.ongoingMatches.some((m) => m._count.belaResults > 0));
      if (!table) throw new Error("the current league has no table tonight with Meč 1 played and Meč 2 under way");
      return {leagueId: world.leagues.current.id, roundId: table.id, mec: 1};
    },
  },
  {
    why: "Sljedeće kolo je već složeno",
    table: "Meč 2 of a played table of the last Kolo out, with only the Skica after it",
    find: async (db, world) => {
      const rounds = await tonightOfCurrent(db, world);
      const published = rounds.filter((r) => r.status === "PUBLISHED");
      const last = Math.max(...published.map((r) => r.round_number!));
      expect(rounds.some((r) => r.status === "DRAFT" && r.round_number! > last), "the current league's Skica waits after its last Kolo").toBe(true);
      const table = published.find((r) => r.round_number === last && !r.open && r.matches.length === 2);
      if (!table) throw new Error(`the current league has no played table in tonight's Kolo ${last}`);
      return {leagueId: world.leagues.current.id, roundId: table.id, mec: 2};
    },
  },
  {
    why: "Stol nije od večeras",
    table: "Meč 2 of a table played last week",
    find: async (db, world) => {
      const {id, tonight} = world.leagues.scorepad;
      const table = await db.round.findFirst({
        where: {leagueRounds: {some: {league_id: id}}, round_date: {lt: new Date(tonight!)}, open: false, matches: {some: {}}},
        orderBy: [{round_date: "desc"}, {round_number: "desc"}, {table_number: "asc"}],
        include: {matches: true},
      });
      if (!table || table.matches.length !== 2) throw new Error("E2E · Scorepad has no table of two matches played last week");
      return {leagueId: id, roundId: table.id, mec: 2};
    },
  },
  {
    why: "Meču je vrijeme već isteklo",
    table: "Meč 2 of tonight's played table, played for 40 minutes of its 35",
    find: async (_db, world) => ({leagueId: world.leagues.scorepad.id, roundId: world.tables.adminEdit.roundId, mec: 2}),
    playedMinutes: 40,
  },
];

// what a test moved in the database, put back afterwards (before the db fixture disconnects, hence its dependency)
const test = base.extend<{undo: (fn: () => Promise<void>) => void}>({
  undo: async ({db}, use) => {
    void db;
    const steps: (() => Promise<void>)[] = [];
    await use((fn) => steps.push(fn));
    for (const fn of steps.reverse()) await fn();
  },
});

// The table on the admin's phone scorepad, on Meč `mec` with its deciding hand in view
async function openMatch(page: Page, db: Db, {leagueId, roundId, mec}: Found) {
  const round = await db.round.findUniqueOrThrow({where: {id: roundId}, include: {team1: true, team2: true}});
  const names: [string, string] = [round.team1.team_name, round.team2.team_name];
  const match = (await finishedMatches(db, roundId))[mec - 1];
  const deciding = decidingHand(match);
  await openTable(page, `/league/${leagueId}/daily-standings/table/${roundId}`);
  await pickMatch(page, mec);
  await expectHand(page, match.belaResults.length, deciding.hand, [match.player_pair1_score, match.player_pair2_score]);
  return {match, names, ...deciding};
}

for (const c of CASES) {
  test(`${c.table}: the warning says "${c.why}" and the score it would have, and Odustani changes nothing`, async ({as, db, world, undo, healthy}) => {
    const found = await c.find(db, world);
    if (c.playedMinutes) {
      const match = (await finishedMatches(db, found.roundId))[found.mec - 1];
      await db.match.update({where: {id: match.id}, data: {start_time: new Date(match.end_time!.getTime() - c.playedMinutes * 60_000)}});
      undo(() => db.match.update({where: {id: match.id}, data: {start_time: match.start_time}}).then(() => undefined));
    }
    const roundBefore = await db.round.findUniqueOrThrow({where: {id: found.roundId}, include: {ongoingMatches: {include: {belaResults: true}}}});
    const page = await as("admin");
    const {match, names, hand, without} = await openMatch(page, db, found);
    const n = match.belaResults.length;

    await deleteHand(page, n);
    const warning = noWinnerSheet(page);
    await expect(warning).toContainText(cantReopen(without, c.why));
    await expect(warning.getByRole("button", {name: "Obriši svejedno"})).toBeVisible();
    await warning.getByRole("button", {name: "Odustani"}).click();
    await expect(warning).toBeHidden();
    // back on the hand's sheet, as it was before Obriši igru (DECISIONS #84)
    const sheet = page.getByRole("dialog", {name: `Igra ${n}`});
    await expect(sheet).toContainText(`${names[0]}${hand.player_pair1_total_points}${names[1]}${hand.player_pair2_total_points}`);
    await sheet.getByRole("button", {name: "Zatvori"}).click();
    await expect(sheet).toBeHidden();

    // the board as it was: every hand, the match finished, nothing in play
    await expect(handRows(page)).toHaveCount(n);
    await expectHand(page, n, hand, [match.player_pair1_score, match.player_pair2_score]);
    await expect(page.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: new RegExp(`^Meč ${found.mec} ${match.player_pair1_score} : ${match.player_pair2_score} · završen$`)})).toBeChecked();
    // and the database: the match, its hands, the table and what is played at it
    const after = (await finishedMatches(db, found.roundId))[found.mec - 1];
    expect([after.id, after.player_pair1_score, after.player_pair2_score, after.belaResults.map((r) => r.result_id)]).toEqual([
      match.id,
      match.player_pair1_score,
      match.player_pair2_score,
      match.belaResults.map((r) => r.result_id),
    ]);
    const roundAfter = await db.round.findUniqueOrThrow({where: {id: found.roundId}, include: {ongoingMatches: {include: {belaResults: true}}}});
    expect(roundAfter).toEqual(roundBefore);
    await healthy(page);
  });
}

type Played = {leagueId: number; roundId: number; names: [string, string]; teamIds: [number, number]};

// tables.adminEdit with its Meč 1's deciding hand put back afterwards (through the admin's own route), if it is gone
const played = base.extend<{played: Played}>({
  played: async ({api, db, world}, use) => {
    const {roundId} = world.tables.adminEdit;
    const round = await db.round.findUniqueOrThrow({where: {id: roundId}, include: {team1: true, team2: true}});
    const [first] = await finishedMatches(db, roundId);
    const {hand} = decidingHand(first);
    await use({
      leagueId: world.leagues.scorepad.id,
      roundId,
      names: [round.team1.team_name, round.team2.team_name],
      teamIds: [round.team1_id, round.team2_id],
    });
    await putBackDecidingHand(await api("admin"), db, roundId, 0, hand, first.belaResults.length);
  },
});

played("Obriši svejedno leaves Meč 1 without a winner: the table counts Meč 2 only, the standings recount its points, the ratings stay, and there is no Otključaj partiju", async ({
  as,
  db,
  played: {leagueId, roundId, names, teamIds},
  healthy,
}) => {
  const [first, second] = await finishedMatches(db, roundId);
  const {playerIds} = await lineup(db, roundId, teamIds[0]);
  const standingsBefore = await standings(db, leagueId, teamIds);
  const ratingsBefore = await ratings(db, playerIds);
  const secondWinner = winnerOf(second.player_pair1_score, second.player_pair2_score)!;
  // the same team won both matches (2 : 0), so without Meč 1's win the round still goes to it: its outcome stays
  expect(winnerOf(first.player_pair1_score, first.player_pair2_score), "tables.adminEdit is a 2 : 0").toBe(secondWinner);

  const page = await as("admin");
  const {without} = await openMatch(page, db, {leagueId, roundId, mec: 1});
  const n = first.belaResults.length;
  await deleteHand(page, n);
  const warning = noWinnerSheet(page);
  await expect(warning).toContainText(cantReopen(without, "Za stolom je već odigran sljedeći meč"));
  await warning.getByRole("button", {name: "Obriši svejedno"}).click();
  await expect(warning).toBeHidden();

  // Meč 1 is finished without a winner; of the table's two matches only Meč 2 is won
  await expect(page.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: `Meč 1 ${without[0]} : ${without[1]} · završen`})).toBeChecked();
  await expect(handRows(page)).toHaveCount(n - 1);
  await expectTotal(page, names[0], without[0]);
  await expectTotal(page, names[1], without[1]);
  await expect(page.getByRole("img", {name: "1 od 2 pobjede u kolu"})).toHaveCount(1);
  await expect(page.getByRole("img", {name: "0 od 2 pobjede u kolu"})).toHaveCount(1);
  await expect(page.getByText("Runda je završena. Izmjene mijenjaju rezultat i poredak.")).toBeVisible();
  // a league table is corrected by entering games, never unlocked (DECISIONS #89)
  await expect(page.getByRole("button", {name: "Otključaj partiju"})).toHaveCount(0);
  await healthy(page);

  // the database: Meč 1 without the hand, the table closed at 0 : 1 (by side), nothing back in play
  const [firstAfter] = await finishedMatches(db, roundId);
  expect([firstAfter.id, firstAfter.player_pair1_score, firstAfter.player_pair2_score, firstAfter.belaResults.length]).toEqual([first.id, ...without, n - 1]);
  const round = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([round.open, round.team1_wins, round.team2_wins]).toEqual([false, secondWinner === 1 ? 1 : 0, secondWinner === 2 ? 1 : 0]);
  expect(await db.ongoingMatch.count({where: {round_id: roundId}})).toBe(0);
  // the round still goes to Meč 2's winner, so only the points difference moves, by what Meč 1 lost
  const shift = without[0] - without[1] - (first.player_pair1_score - first.player_pair2_score);
  const standingsAfter = await standings(db, leagueId, teamIds);
  const only = (pd: number) => ({rounds_played: 0, wins: 0, draws: 0, losses: 0, score: 0, point_difference: pd});
  expect(moved(standingsBefore[teamIds[0]], standingsAfter[teamIds[0]])).toEqual(only(shift));
  expect(moved(standingsBefore[teamIds[1]], standingsAfter[teamIds[1]])).toEqual(only(-shift));
  // the round's outcome didn't change, so the ratings aren't replayed (DECISIONS #84)
  expect(await ratings(db, playerIds)).toEqual(ratingsBefore);
});
