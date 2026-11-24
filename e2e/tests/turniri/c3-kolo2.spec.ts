// C3 · Kolo 2 by the standings and the end of the tournament (DECISIONS #69; tournamentPairing.ts): from Kolo 2 the
// teams are paired as in a Swiss system — neighbours in the standings meet, nobody meets twice while another pairing is
// possible, and with an odd number of teams the lowest team that hasn't had a bye gets Slobodna runda (301 : 0, a win).
// A table won is a point (one match per table), then the difference counts. Once the last Kolo is played the
// tournament is over: Pobjednici, Konačni poredak and Vaš rezultat; tournaments.finished shows the same to a guest.
// The first test makes its own tournament of five teams and plays its tables through the app (Tko igra, the hands,
// Završi meč); removing it deletes its Kolos with their results, so the ratings are counted again without them.
import type {Page} from "@playwright/test";
import {escape, expect, koloTables, makeReady, openTable, pickTeams, playTable, publishNextKolo, runClock, test, type Entry} from "../../helpers/c3";

const byId = (teams: Entry[], id: number) => teams.find((t) => t.id === id)!;

// a table won by team1 1064 : 70 (seven hands of 152 : 10, +994), or 1080 : 378 (nine of 120 : 42, +702)
const BIG = Array<number>(7).fill(152);
const SMALL = Array<number>(9).fill(120);

// the page's first read of the player's table has come back (none between the Kolos), so a table published after it
// can only come up through a later read
const firstTableRead = (page: Page) => page.waitForResponse((r) => new URL(r.url()).pathname === "/api/rounds/open");

test("Kolo 2 pairs the neighbours of the standings with the bye for the lowest team, and after it the tournament is over", async ({
  as,
  api,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 5, {phones: 5});
  const t = await makeReady(tournaments.make, admin, teams, {name: "Dvokolni kup", rounds: 2});
  const kolo1 = await publishNextKolo(admin, db, t.id);
  // Kolo 1 drawn at random: two tables and, the count being odd, the last one drawn with Slobodna runda
  expect(kolo1.tables.map((r) => r.team2_id === 0)).toEqual([false, false, true]);
  const [first, second, bye] = kolo1.tables;
  await playTable(admin, first.id, BIG);
  await playTable(admin, second.id, SMALL);
  // after Kolo 1: W1 1 point +994, W2 1 point +702, the bye's team 1 point +301, L2 0 points −702, L1 0 points −994
  const [w1, l1, w2, l2, y] = [first.team1_id, first.team2_id, second.team1_id, second.team2_id, bye.team1_id].map((id) => byId(teams, id));

  // the last table closed made Kolo 2's Skica by itself; the admin sees it from the navy card
  const page = await as("admin");
  await page.goto(`/turniri/${t.id}/upravljanje`);
  await page.getByRole("tab", {name: "Poredak"}).click();
  await expect(page.getByRole("tabpanel", {name: "Poredak"})).toContainText("Nakon 1 od 2 kola");
  const order = [w1, w2, y, l2, l1];
  await expect(page.getByRole("tabpanel", {name: "Poredak"}).getByRole("listitem")).toHaveText(order.map((e) => new RegExp(escape(e.name))));
  await page.getByRole("button", {name: /^Skica Kola 2/}).click();
  await expect(page.getByRole("heading", {name: "Skica kola", level: 1})).toBeVisible();
  await expect(page.getByText("Po poretku nakon 1 kola")).toBeVisible();
  // 1st with 2nd, 3rd with 4th (neither has met), and the bye for the last, who hasn't had one
  await expect(page.getByRole("list", {name: "Skica Kola 2, stolovi"}).getByRole("listitem")).toHaveText([
    new RegExp(`^1\\s*${escape(w1.name)}\\s*vs\\s*${escape(w2.name)}$`),
    new RegExp(`^2\\s*${escape(y.name)}\\s*vs\\s*${escape(l2.name)}$`),
    new RegExp(`^3\\s*${escape(l1.name)}\\s*1:0\\s*Slobodna runda$`),
  ]);
  await healthy(page);
  await page.getByRole("button", {name: "Objavi kolo"}).click();
  await expect(page.getByRole("heading", {name: "Kolo 2", level: 1})).toBeVisible();
  const kolo2 = await koloTables(db, t.id, 2);
  expect(kolo2.map((r) => [r.table_number, r.team1_id, r.team2_id, r.status])).toEqual([
    [1, w1.id, w2.id, "PUBLISHED"],
    [2, y.id, l2.id, "PUBLISHED"],
    [3, l1.id, 0, "PUBLISHED"],
  ]);

  // Kolo 2 played: W1 wins again, the bye's team beats L2
  await playTable(admin, kolo2[0].id, BIG);
  await playTable(admin, kolo2[1].id, SMALL);
  await runClock(admin, t.id);

  // over: W1 2 points +1988, Y 2 points +1003, W2 1 point −292, L1 1 point −693, L2 0 points −1404
  const player = await as(w1.phone!);
  await player.goto(`/turniri/${t.id}`);
  const winners = player.getByRole("region", {name: "Pobjednici"});
  await expect(winners).toContainText(w1.name);
  await expect(winners).toContainText(/2\s*POB\s*0\s*NER\s*0\s*IZG/);
  const mine = player.getByRole("region", {name: "Vaš rezultat"});
  await expect(mine.getByLabel("1. mjesto od 5")).toBeVisible();
  await expect(mine).toContainText(/2\s*POB\s*0\s*NER\s*0\s*IZG/);
  expect(await openTable(await api(w1.phone!)), "no table of the tournament is left to play").toBeNull();
  await healthy(player);
  await player.getByRole("link", {name: /^Poredak i rezultati/}).click();
  await expect(player).toHaveURL(new RegExp(`/turniri/${t.id}/poredak$`));
  await expect(player.getByText("Konačni poredak", {exact: true})).toBeVisible();
  await expect(player.getByLabel("Poredak turnira").getByRole("listitem")).toHaveText(
    [w1, y, w2, l1, l2].map((e) => new RegExp(escape(e.name))),
  );
  await expect(player.getByRole("tab")).toHaveText(["Poredak", "Kolo 1", "Kolo 2"]);
  // the bye is a table like any other (DECISIONS 106): Kolo 1's Slobodna runda reads its Stol, not Bez stola
  await player.getByRole("tab", {name: /^Kolo 1/}).click();
  await expect(player.getByRole("tabpanel", {name: /^Kolo 1/}).getByRole("listitem").filter({hasText: "Slobodna runda"})).toContainText(`Stol ${bye.table_number}`);
  await healthy(player);

  const theirs = await as(l2.phone!);
  await theirs.goto(`/turniri/${t.id}`);
  await expect(theirs.getByRole("region", {name: "Vaš rezultat"}).getByLabel("5. mjesto od 5")).toBeVisible();
  await healthy(theirs);
});

// #85: the tournament's page reads the player's table again on the tick it reads the tournament on (every 20 s while
// it is played), so a Kolo published while the page is open shows the player's new table without a reload. Nobody
// touches the page: its clock is a fake one the test moves
test("with the tournament's page open, the player's table of a Kolo just published comes up on the next refresh, without a reload", async ({
  as,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 4, {phones: 4});
  const t = await makeReady(tournaments.make, admin, teams, {name: "Kup otvorene stranice", rounds: 2});
  const kolo1 = await publishNextKolo(admin, db, t.id);
  for (const table of kolo1.tables) await playTable(admin, table.id, BIG);
  const me = byId(teams, kolo1.tables[0].team1_id);

  const page = await as(me.phone!);
  await page.clock.install();
  const read = firstTableRead(page);
  await page.goto(`/turniri/${t.id}`);
  await read;
  // between the Kolos the team waits, with no table to play
  await expect(page.getByRole("region", {name: "Tvoja ekipa"})).toBeVisible();
  await expect(page.getByRole("button", {name: /Započni igru$/})).toHaveCount(0);

  const kolo2 = await publishNextKolo(admin, db, t.id);
  const mine = kolo2.tables.find((r) => r.team1_id === me.id || r.team2_id === me.id);
  expect(mine, "Kolo 2 seats every team").toBeDefined();
  await page.clock.fastForward(20_000);
  await expect(page.getByRole("button", {name: new RegExp(`^STOL ${mine!.table_number} .*Započni igru$`)})).toBeVisible();
  await expect(page.getByRole("region", {name: "Tvoja ekipa"})).toHaveCount(0);
  await healthy(page);
});

// #85: coming back to the app reads the player's table at once. The check runs within seconds of the page opening,
// long before its 20 s refresh, so only the return to the app can bring the table
test("a player who comes back to the app sees the table of a Kolo published meanwhile at once", async ({as, db, admin, tournaments, healthy}) => {
  const teams = await pickTeams(db, 4, {phones: 4});
  const t = await makeReady(tournaments.make, admin, teams, {name: "Kup povratka u aplikaciju", rounds: 2});
  const kolo1 = await publishNextKolo(admin, db, t.id);
  for (const table of kolo1.tables) await playTable(admin, table.id, BIG);
  const me = byId(teams, kolo1.tables[0].team1_id);

  const page = await as(me.phone!);
  const read = firstTableRead(page);
  await page.goto(`/turniri/${t.id}`);
  await read;
  await expect(page.getByRole("region", {name: "Tvoja ekipa"})).toBeVisible();

  const kolo2 = await publishNextKolo(admin, db, t.id);
  const mine = kolo2.tables.find((r) => r.team1_id === me.id || r.team2_id === me.id);
  expect(mine, "Kolo 2 seats every team").toBeDefined();
  // the phone was in a pocket, and the app comes back to the front
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("button", {name: new RegExp(`^STOL ${mine!.table_number} .*Započni igru$`)})).toBeVisible({timeout: 5_000});
  await healthy(page);
});

// #85: Početna · Turniri reads the tournaments every 30 s, and the player's table with them on the same tick
test("Turniri reads the player's table again with the tournaments every 30 s, so a Kolo published meanwhile shows its table", async ({
  as,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 4, {phones: 4});
  const t = await makeReady(tournaments.make, admin, teams, {name: "Kup na Turnirima", rounds: 2});
  const kolo1 = await publishNextKolo(admin, db, t.id);
  for (const table of kolo1.tables) await playTable(admin, table.id, BIG);
  const me = byId(teams, kolo1.tables[0].team1_id);

  const page = await as(me.phone!);
  await page.clock.install();
  const read = firstTableRead(page);
  await page.goto("/turniri");
  await read;
  await expect(page.getByRole("button", {name: /Započni igru$/})).toHaveCount(0);

  const kolo2 = await publishNextKolo(admin, db, t.id);
  const mine = kolo2.tables.find((r) => r.team1_id === me.id || r.team2_id === me.id);
  expect(mine, "Kolo 2 seats every team").toBeDefined();
  await page.clock.fastForward(30_000);
  await expect(page.getByRole("button", {name: new RegExp(`^STOL ${mine!.table_number} ${escape(me.name)} .*Započni igru$`)})).toBeVisible();
  await healthy(page);
});

// #85: Poredak i rezultati reads the results every 30 s while the tournament is played, and the player's table with
// them, so the new Kolo's own table offers Započni igru instead of only opening the table
test("Poredak i rezultati reads the player's table again with the results every 30 s, so the new Kolo's own table offers Započni igru", async ({
  as,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 4, {phones: 4});
  const t = await makeReady(tournaments.make, admin, teams, {name: "Kup u rezultatima", rounds: 2});
  const kolo1 = await publishNextKolo(admin, db, t.id);
  for (const table of kolo1.tables) await playTable(admin, table.id, BIG);
  const me = byId(teams, kolo1.tables[0].team1_id);

  const page = await as(me.phone!);
  await page.clock.install();
  const read = firstTableRead(page);
  await page.goto(`/turniri/${t.id}/poredak`);
  await read;
  await expect(page.getByRole("tab", {name: /^Kolo 1/})).toBeVisible();

  const kolo2 = await publishNextKolo(admin, db, t.id);
  const mine = kolo2.tables.find((r) => r.team1_id === me.id || r.team2_id === me.id);
  expect(mine, "Kolo 2 seats every team").toBeDefined();
  await page.clock.fastForward(30_000);
  await page.getByRole("tab", {name: /^Kolo 2/}).click();
  await expect(page.getByRole("button", {name: new RegExp(`^Stol ${mine!.table_number}: .*\\. Započni igru$`)})).toBeVisible();
  await healthy(page);
});

// #85: a guest has no table, so Turniri never asks for one: not when it opens, not on its 30 s refresh (each such
// request would only answer 401 and start the session check)
test("a guest on Turniri never asks for a table to play, also on the 30 s refresh", async ({as}) => {
  const page = await as("guest");
  const asked: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/rounds/open") asked.push(r.url());
  });
  await page.clock.install();
  const isList = (r: {url(): string; ok(): boolean}) => new URL(r.url()).pathname === "/api/tournaments" && r.ok();
  const listed = page.waitForResponse(isList);
  await page.goto("/turniri");
  await listed;
  const again = page.waitForResponse(isList);
  await page.clock.fastForward(30_000);
  await again;
  expect(asked).toEqual([]);
});

test("a finished tournament (tournaments.finished) as a guest sees it: Pobjednici, Konačni poredak of every team and its five Kolos", async ({
  as,
  db,
  world,
  healthy,
}) => {
  const {finished} = world.tournaments;
  // the winner by the rules: tables won, then the difference (a skipped table counts for nobody)
  const tables = await db.round.findMany({where: {tournamentRounds: {some: {tournament_id: finished.id}}, status: "PUBLISHED"}, include: {matches: true}});
  const totals = new Map<number, {points: number; diff: number}>();
  for (const r of tables.filter((x) => x.attendance !== "SKIPPED")) {
    const diff = r.matches.reduce((s, m) => s + m.player_pair1_score - m.player_pair2_score, 0);
    for (const [team, won, lost, d] of [
      [r.team1_id, r.team1_wins, r.team2_wins, diff],
      [r.team2_id, r.team2_wins, r.team1_wins, -diff],
    ]) {
      if (team === 0) continue;
      const row = totals.get(team) ?? {points: 0, diff: 0};
      totals.set(team, {points: row.points + (won > lost ? 1 : 0), diff: row.diff + d});
    }
  }
  const ranked = Array.from(totals.entries()).sort(([, a], [, b]) => b.points - a.points || b.diff - a.diff);
  expect(ranked[0][1], "the seeded winner is clear on points and difference").not.toEqual(ranked[1][1]);
  const winner = await db.team.findUniqueOrThrow({where: {team_id: ranked[0][0]}});
  const teams = await db.tournamentTeam.count({where: {tournament_id: finished.id}});

  const page = await as("guest");
  await page.goto(`/turniri/${finished.id}`);
  await expect(page.getByRole("heading", {name: finished.name, level: 1})).toBeVisible();
  await expect(page.getByRole("main")).toContainText(new RegExp(`Završeno .* · ${teams} ekipa`));
  await expect(page.getByRole("region", {name: "Pobjednici"})).toContainText(winner.team_name);
  await expect(page.getByRole("region", {name: "Vaš rezultat"})).toHaveCount(0);
  await expect(page.getByRole("region", {name: /^Prijave/})).toHaveCount(0);
  await healthy(page);
  await page.getByRole("link", {name: "Poredak i rezultati Konačni poredak i sva kola"}).click();
  await expect(page).toHaveURL(new RegExp(`/turniri/${finished.id}/poredak$`));
  await expect(page.getByText("Konačni poredak", {exact: true})).toBeVisible();
  const rows = page.getByLabel("Poredak turnira").getByRole("listitem");
  await expect(rows).toHaveCount(teams);
  await expect(rows.first()).toContainText(winner.team_name);
  await expect(page.getByRole("tab")).toHaveText(["Poredak", "Kolo 1", "Kolo 2", "Kolo 3", "Kolo 4", "Kolo 5"]);
  await page.getByRole("tab", {name: "Kolo 1"}).click();
  await expect(page.getByRole("heading", {name: "Kolo 1"})).toBeVisible();
  // every table of Kolo 1 played to the end (a guest reads them, nothing to open)
  await expect(page.getByRole("tabpanel", {name: "Kolo 1"}).getByRole("listitem", {name: /^Stol \d+: .*, završeno, razlika /})).toHaveCount(
    tables.filter((r) => r.round_number === 1).length,
  );
  await healthy(page);
});
