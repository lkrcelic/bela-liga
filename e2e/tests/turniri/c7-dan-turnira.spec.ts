// C7 · the organizer runs the day of their own tournament on the phone: Označi dolazak and the Aktivna switch in
// Potvrda dolaska, Prijave zatvorene → Složi Kolo 1 → Skica kola → Objavi kolo, Isključi ekipu and Vrati, a skipped
// table's Uredi ishod and Vrati stol, and a hand on the table's scorepad (on the screen, and through its routes). DECISIONS #86: the organizer runs their own tournament as the admin does
// (kola, Skica, Objavi, stolovi, rezultati, prijave, dolasci). The rules of the day are _lib/tournamentDay.ts: at 10
// minutes without a game the table is skipped and both teams are out (in Kolo 1 with a ban on sign-ups); Uredi ishod
// gives one team every match 1001 : 700 and puts the other out; Vrati stol plays the table as if both had come.
// Each test makes its own tournament of today as the organizer (the `own` fixture: Novi turnir, Dodaj ekipu through the
// organizer's routes) and the fixture removes it afterwards.
import {expect, koloTables, tableOutFor, test} from "../../helpers/c7";
import {enterHand, handRow} from "../../helpers/scorepad";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("on the day the organizer marks the teams that came with Označi dolazak and switches off one that didn't", async ({as, own, db, healthy}) => {
  // Okupljanje 00:00, Početak 23:59: Potvrda dolaska is open
  const t = await own({arrival: true, teams: 4});
  const [here1, here2, here3, away] = t.teams;
  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=prijave`);

  const card = page.getByRole("button", {name: /^Potvrda dolaska do 23:59 /});
  await expect(card).toContainText("0 tu · 4 nije potvrdilo");
  const list = page.getByRole("list", {name: "Prijavljene ekipe"});
  const row = (name: string) => list.getByRole("listitem").filter({has: page.getByText(name, {exact: true})});
  for (const team of [here1, here2, here3]) {
    await expect(row(team.name)).toContainText("Nije potvrdila");
    await row(team.name).getByRole("button", {name: "Označi dolazak"}).click();
    // Tu, marked by the organizer (the chip's title says who)
    await expect(row(team.name).getByTitle(/^Označio organizator u \d{1,2}:\d{2}$/)).toBeVisible();
    await expect(row(team.name).getByRole("button", {name: "Označi dolazak"})).toHaveCount(0);
  }
  await expect(card).toContainText("3 tu · 1 nije potvrdilo");
  const atStart = page.getByRole("region", {name: "U 23:59"});
  await expect(atStart).toContainText("1 nepotvrđena ekipa postaje Neaktivna (ostaju prijavljene).");

  // the team that isn't here is switched off: it won't play Kolo 1
  const active = page.getByRole("switch", {name: `${away.name} igra sljedeće kolo`});
  await expect(active).toBeChecked();
  await active.click();
  await expect(active).not.toBeChecked();
  // so the start time makes nobody inactive any more
  await expect(atStart).not.toContainText("postaje Neaktivna");

  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id}});
  const entry = (id: number) => entries.find((e) => e.team_id === id)!;
  expect([here1, here2, here3, away].map((x) => [entry(x.id).arrived_at != null, entry(x.id).arrived_by_admin, entry(x.id).active])).toEqual([
    [true, true, true],
    [true, true, true],
    [true, true, true],
    [false, false, false],
  ]);
  await healthy(page);
});

test("the organizer closes sign-ups, makes Kolo 1 with Složi Kolo 1 and publishes it", async ({as, own, db, healthy}) => {
  // Potvrda dolaska not open yet (Okupljanje 23:58): the sign-ups close with the switch, and Kolo 1 is made after that
  const t = await own({teams: 4});
  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=prijave`);
  const open = page.getByRole("switch", {name: /^Prijave otvorene 4 od 4 ekipe/});
  await expect(open).toBeChecked();
  await open.click();
  await expect(page.getByRole("switch", {name: /^Prijave zatvorene 4 od 4 ekipe/})).not.toBeChecked();

  await page.getByRole("tab", {name: "Kola"}).click();
  await expect(page.getByText("Prijave su zatvorene: Kolo 1 se slaže nasumično.")).toBeVisible();
  await page.getByRole("button", {name: "Složi Kolo 1"}).click();

  // Skica kola: two tables, every team once, nobody sees them yet
  await expect(page.getByRole("heading", {name: "Skica kola"})).toBeVisible();
  await expect(page.getByRole("list", {name: "Skica Kola 1, stolovi"}).getByRole("listitem")).toHaveCount(2);
  const drafts = await koloTables(db, t.id, 1);
  expect(drafts.flatMap((d) => [d.team1.id, d.team2.id]).sort((a, b) => a - b)).toEqual(t.teams.map((x) => x.id).sort((a, b) => a - b));
  expect(await db.round.count({where: {id: {in: drafts.map((d) => d.id)}, status: "DRAFT"}})).toBe(2);

  await page.getByRole("button", {name: "Objavi kolo"}).click();
  await expect(page.getByRole("heading", {name: "Kolo 1", level: 1})).toBeVisible();
  for (const d of drafts) {
    await expect(page.getByRole("link", {name: new RegExp(`^Stol ${d.table}: ${escape(d.team1.name)} 0, ${escape(d.team2.name)} 0, nije počelo\\. Otvori stol$`)})).toBeVisible();
  }
  // published, and the tournament has started with its sign-ups closed
  const tables = await db.round.findMany({where: {id: {in: drafts.map((d) => d.id)}}});
  expect(tables.map((r) => [r.status, r.published_at != null])).toEqual([
    ["PUBLISHED", true],
    ["PUBLISHED", true],
  ]);
  const after = await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}});
  expect([after.started_at != null, after.registrations_open]).toEqual([true, false]);
  await healthy(page);
});

test("once their tournament has started the organizer takes a team out with Isključi ekipu and brings it back with Vrati", async ({as, own, db, healthy}) => {
  const t = await own({teams: 4, kolo1: true});
  const [team] = t.teams;
  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=prijave`);
  const row = page.getByRole("list", {name: "Prijavljene ekipe"}).getByRole("listitem").filter({has: page.getByText(team.name, {exact: true})});
  await row.getByRole("button", {name: `Isključi ${team.name} iz turnira`, exact: true}).click();
  const sheet = page.getByRole("dialog", {name: `Isključiti ${team.name} iz turnira?`});
  await expect(sheet).toContainText("Odigrana kola ostaju u poretku.");
  await sheet.getByRole("button", {name: "Isključi ekipu"}).click();
  await expect(sheet).toBeHidden();

  // out after Kolo 1, by the organizer's hand; Vrati is there while the tournament runs
  await expect(row).toContainText("Isključena · K1");
  let entry = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: team.id}}});
  expect([entry.excluded_at != null, entry.excluded_kolo, entry.excluded_reason]).toEqual([true, 1, "ADMIN"]);

  await row.getByRole("button", {name: "Vrati"}).click();
  await expect(row.getByRole("button", {name: `Isključi ${team.name} iz turnira`, exact: true})).toBeVisible();
  await expect(row).not.toContainText("Isključena");
  entry = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: team.id}}});
  expect([entry.excluded_at, entry.excluded_kolo, entry.excluded_reason, entry.active]).toEqual([null, null, null, true]);
  await healthy(page);
});

test("a table skipped at 10 minutes gets the organizer's Uredi ishod: one team's win, the other out", async ({as, own, organizer, db, world, healthy}) => {
  const t = await own({teams: 4, kolo1: true});
  const [table] = await koloTables(db, t.id, 1);
  // nobody started a game and nobody answered: at 10 minutes the table is skipped, both teams out and banned
  await tableOutFor(db, organizer, table.id, 11);
  expect((await db.round.findUniqueOrThrow({where: {id: table.id}})).attendance).toBe("SKIPPED");

  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  const states = page.getByRole("region", {name: "Statusi stolova"});
  await expect(states.getByRole("link", {name: new RegExp(`^Stol ${table.table} Preskočen `)})).toBeVisible();
  await states.getByRole("button", {name: `Uredi ishod Stola ${table.table}`}).click();
  const sheet = page.getByRole("dialog", {name: `Ishod Stola ${table.table}`});
  await expect(sheet.getByRole("radio", {name: "Nitko · preskočen"})).toBeChecked();
  await sheet.getByRole("radio", {name: `Pobjeda: ${table.team1.name}`}).click();
  await expect(sheet).toContainText(`${table.team1.name} dobivaju svaku partiju stola 1001 : 700 i ostaju u turniru bez zabrane prijava.`);
  await sheet.getByRole("button", {name: "Spremi ishod"}).click();
  await expect(sheet).toBeHidden();
  await expect(states.getByRole("link", {name: new RegExp(`^Stol ${table.table} Dodijeljena pobjeda `)})).toContainText(
    `pobjeđuju ${table.team1.name} · 1001 : 700 po partiji · ${table.team2.name} isključeni`,
  );

  // the table: team1 won its match 1001 : 700; team2 is out with Kolo 1's ban, team1 is in without one
  const round = await db.round.findUniqueOrThrow({where: {id: table.id}, include: {matches: true}});
  expect([round.attendance, round.attendance_team_id, round.attendance_by, round.team1_wins, round.team2_wins, round.open]).toEqual([
    "NO_SHOW",
    table.team1.id,
    world.accounts.organizer.id,
    1,
    0,
    false,
  ]);
  expect(round.matches.map((m) => [m.player_pair1_score, m.player_pair2_score])).toEqual([[1001, 700]]);
  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id, team_id: {in: [table.team1.id, table.team2.id]}}});
  expect(entries.find((e) => e.team_id === table.team1.id)!.excluded_at).toBeNull();
  expect(entries.find((e) => e.team_id === table.team2.id)!.excluded_reason).toBe("NO_SHOW");
  const bans = await db.signupBan.findMany({where: {tournament_id: t.id, team_id: {not: null}, lifted_at: null}});
  expect(bans.map((b) => b.team_id)).toEqual([table.team2.id]);
  await healthy(page);
});

test("Vrati stol puts the organizer's skipped table back in play, with both teams in and their bans lifted", async ({as, own, organizer, db, world, healthy}) => {
  const t = await own({teams: 4, kolo1: true});
  const [table] = await koloTables(db, t.id, 1);
  await tableOutFor(db, organizer, table.id, 11);
  expect(await db.signupBan.count({where: {tournament_id: t.id, team_id: {in: [table.team1.id, table.team2.id]}, lifted_at: null}})).toBe(2);

  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  const states = page.getByRole("region", {name: "Statusi stolova"});
  await states.getByRole("button", {name: `Vrati Stol ${table.table} u igru`}).click();
  const sheet = page.getByRole("dialog", {name: `Vratiti Stol ${table.table} u igru?`});
  await expect(sheet).toContainText("a zabrana prijava im se ukida");
  await sheet.getByRole("button", {name: "Vrati stol"}).click();
  await expect(sheet).toBeHidden();
  // no table of the Kolo is special any more
  await expect(states).toHaveCount(0);

  const round = await db.round.findUniqueOrThrow({where: {id: table.id}, include: {matches: true}});
  expect([round.attendance, round.attendance_by, round.open, round.matches.length]).toEqual(["PRESENT", world.accounts.organizer.id, true, 0]);
  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id, team_id: {in: [table.team1.id, table.team2.id]}}});
  expect(entries.map((e) => [e.excluded_at, e.active])).toEqual([
    [null, true],
    [null, true],
  ]);
  const bans = await db.signupBan.findMany({where: {tournament_id: t.id, team_id: {in: [table.team1.id, table.team2.id]}}});
  expect(bans.map((b) => [b.lifted_at != null, b.lifted_by])).toEqual([
    [true, world.accounts.organizer.id],
    [true, world.accounts.organizer.id],
  ]);
  await healthy(page);
});

test("the organizer opens a table of their Kolo 1, confirms Tko igra and enters a hand on the scorepad", async ({as, own, db, healthy}) => {
  // BUG #83: Tko igra (GET /api/rounds/<id>/lineup) answers the organizer "Ne igraš u ovoj rundi." on their own tournament's
  // table (canPlayRound lets only the table's players and an admin in), and the scorepad sends everyone to Tko igra
  // first, so the organizer can't reach the scorepad of a table of their own tournament being played. The user
  // confirmed on 16.11. that the organizer may do anything with their own tournament but delete or cancel it.
  test.fail();
  const t = await own({teams: 4, kolo1: true});
  const [table] = await koloTables(db, t.id, 1);
  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  await page.getByRole("link", {name: new RegExp(`^Stol ${table.table}: ${escape(table.team1.name)} 0, `)}).click();

  await expect(page.getByRole("heading", {name: "Tko igra ovu rundu?"})).toBeVisible();
  const start = page.getByRole("button", {name: "Potvrdi i počni"});
  await expect(start).toBeEnabled();
  await start.click();

  // the admin's phone scorepad of this table; the first hand starts the match
  await expect(page).toHaveURL(new RegExp(`/turniri/${t.id}/stol/${table.id}`));
  await enterHand(page, {caller: table.team1.name, points: {team: table.team1.name, game: 100}});
  await expect(handRow(page, 1)).toHaveAccessibleName(/^Igra 1: 100 prema 62, ukupno 100 prema 62, razlika 38/);
  const match = await db.ongoingMatch.findFirstOrThrow({where: {round_id: table.id}, include: {belaResults: true}});
  expect([match.player_pair1_score, match.player_pair2_score, match.belaResults.length]).toEqual([100, 62, 1]);
  await healthy(page);
});

test("the scorepad's routes take the organizer's hands on a table of their own tournament: Upiši igru and Ispravi", async ({own, organizer, db}) => {
  const t = await own({teams: 4, kolo1: true});
  const [table] = await koloTables(db, t.id, 1);
  // Upiši igru (Ručni unos): the first hand starts the table's match
  const added = await organizer.post(`/api/admin/tables/${table.id}/hands`, {data: {target: {kind: "ongoing"}, hand: {manual: true, points1: 100, points2: 62}}});
  expect(added.status(), `Upiši igru: ${await added.text()}`).toBe(201);
  const match = await db.ongoingMatch.findFirstOrThrow({where: {round_id: table.id}, include: {belaResults: true}});
  expect([match.player_pair1_score, match.player_pair2_score, match.belaResults.length]).toEqual([100, 62, 1]);

  // Ispravi: the same hand, now 40 : 122
  const hand = match.belaResults[0].result_id;
  const corrected = await organizer.put(`/api/admin/hands/ongoing/${hand}`, {data: {manual: true, points1: 40, points2: 122}});
  expect(corrected.status(), `Ispravi: ${await corrected.text()}`).toBe(200);
  const after = await db.ongoingMatch.findUniqueOrThrow({where: {id: match.id}, include: {belaResults: true}});
  expect([after.player_pair1_score, after.player_pair2_score, after.belaResults.map((r) => r.result_id)]).toEqual([40, 122, [hand]]);
});
