// C3 · Kolo 2 by the standings and the end of the tournament (DECISIONS #69; tournamentPairing.ts): from Kolo 2 the
// teams are paired as in a Swiss system — neighbours in the standings meet, nobody meets twice while another pairing is
// possible, and with an odd number of teams the lowest team that hasn't had a bye gets Slobodna runda (301 : 0, a win).
// A table won is a point (one match per table), then the difference counts. Once the last Kolo is played the
// tournament is over: Pobjednici, Konačni poredak and Vaš rezultat; tournaments.finished shows the same to a guest.
// The first test makes its own tournament of five teams and plays its tables through the app (Tko igra, the hands,
// Završi meč); removing it deletes its Kolos with their results, so the ratings are counted again without them.
import {escape, expect, koloTables, makeReady, openTable, pickTeams, playTable, publishNextKolo, runClock, test, type Entry} from "../../helpers/c3";

const byId = (teams: Entry[], id: number) => teams.find((t) => t.id === id)!;

// a table won by team1 1064 : 70 (seven hands of 152 : 10, +994), or 1080 : 378 (nine of 120 : 42, +702)
const BIG = Array<number>(7).fill(152);
const SMALL = Array<number>(9).fill(120);

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
  await healthy(player);

  const theirs = await as(l2.phone!);
  await theirs.goto(`/turniri/${t.id}`);
  await expect(theirs.getByRole("region", {name: "Vaš rezultat"}).getByLabel("5. mjesto od 5")).toBeVisible();
  await healthy(theirs);
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
