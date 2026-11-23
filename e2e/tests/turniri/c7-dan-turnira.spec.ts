// C7 · the organizer runs the day of their own tournament on the phone: Označi dolazak and the Aktivna switch in
// Potvrda dolaska, Složi Kolo 1 before Početak with sign-ups open (only the confirmed teams) → Skica kola → Objavi kolo
// (also with Pušački stolovi), Isključi ekipu and Vrati, a skipped
// table's Uredi ishod and Vrati stol, and a hand on the table's scorepad (on the screen, and through its routes). DECISIONS #86: the organizer runs their own tournament as the admin does
// (kola, Skica, Objavi, stolovi, rezultati, prijave, dolasci). The rules of the day are _lib/tournamentDay.ts: at 10
// minutes without a game the table is skipped and both teams are out (in Kolo 1 with a ban on sign-ups); Uredi ishod
// gives one team every match 1001 : 700 and puts the other out; Vrati stol plays the table as if both had come.
// Each test makes its own tournament of today as the organizer (the `own` fixture: Novi turnir, Dodaj ekipu through the
// organizer's routes) and the fixture removes it afterwards.
import {expect, koloTables, markArrived, tableOutFor, test, tournamentRequest} from "../../helpers/c7";
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

test("before Početak, with sign-ups still open, Složi Kolo 1 draws only the teams that confirmed arrival, a late confirmation makes the Skica stale, and Objavi kolo makes the unconfirmed team Neaktivna", async ({as, own, organizer, db, healthy}) => {
  // DECISIONS 103: a Kolo is made whenever the organizer wants (sign-ups open, Početak at 23:59 still to come), and only
  // a team that confirmed arrival is in it; before, the draft took every team in, the unconfirmed one too
  const t = await own({arrival: true, teams: 5});
  const here = t.teams.slice(0, 4);
  const [away] = t.teams.slice(4);
  const page = await as("organizer");

  // nobody has confirmed yet: no Kolo, and the card says why
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola`);
  await expect(page.getByText("Za kolo trebaju barem dvije aktivne ekipe s potvrđenim dolaskom.")).toBeVisible();
  await expect(page.getByRole("button", {name: "Složi Kolo 1"})).toBeDisabled();

  // four teams are here; the sign-ups stay open ("Prvo zatvori prijave" is gone)
  await markArrived(organizer, t.id, here);
  expect((await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}})).registrations_open).toBe(true);
  await page.reload();
  await expect(page.getByText("Kolo 1 se slaže nasumično, od ekipa koje su potvrdile dolazak.")).toBeVisible();
  await page.getByRole("button", {name: "Složi Kolo 1"}).click();

  // Skica kola: two tables, the four confirmed teams once each, the unconfirmed team at none
  await expect(page.getByRole("heading", {name: "Skica kola"})).toBeVisible();
  const skica = page.getByRole("list", {name: "Skica Kola 1, stolovi"});
  await expect(skica.getByRole("listitem")).toHaveCount(2);
  await expect(skica).not.toContainText(away.name);
  const drafts = await koloTables(db, t.id, 1);
  expect(drafts.flatMap((d) => [d.team1.id, d.team2.id]).sort((a, b) => a - b)).toEqual(here.map((x) => x.id).sort((a, b) => a - b));
  const all = await db.round.findMany({where: {tournamentRounds: {some: {tournament_id: t.id}}}});
  expect(all.map((r) => r.status)).toEqual(["DRAFT", "DRAFT"]);

  // the fifth team confirms after the draw: the Skica is stale and Objavi kolo waits for Složi ponovo
  const stale = page.getByText("Popis ekipa se promijenio nakon što je kolo složeno. Složi ga ponovo pa objavi.");
  await markArrived(organizer, t.id, [away]);
  await page.reload();
  await expect(stale).toBeVisible();
  await expect(page.getByRole("button", {name: "Objavi kolo"})).toBeDisabled();
  // its confirmation taken back (Makni potvrdu), the Skica holds again
  const unmarked = await organizer.patch(`/api/admin/tournaments/${t.id}/teams/${away.id}`, {data: {arrived: false}});
  expect(unmarked.ok(), `Makni potvrdu ${away.name}: ${await unmarked.text()}`).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("button", {name: "Objavi kolo"})).toBeEnabled();
  await expect(stale).toHaveCount(0);

  await page.getByRole("button", {name: "Objavi kolo"}).click();
  await expect(page.getByRole("heading", {name: "Kolo 1", level: 1})).toBeVisible();
  for (const d of drafts) {
    await expect(page.getByRole("link", {name: new RegExp(`^Stol ${d.table}: ${escape(d.team1.name)} 0, ${escape(d.team2.name)} 0, nije počelo\\. Otvori stol$`)})).toBeVisible();
  }
  // published before Početak: the tournament has started, its sign-ups are closed, and what the start time does
  // happened then: the team that didn't confirm is Neaktivna (still signed up)
  const after = await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}});
  expect([after.started_at != null, after.arrival_closed_at != null, after.registrations_open]).toEqual([true, true, false]);
  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id}});
  expect(entries.filter((e) => !e.active).map((e) => e.team_id)).toEqual([away.id]);
  await page.goto(`/turniri/${t.id}/upravljanje?view=prijave`);
  const awayRow = page.getByRole("list", {name: "Prijavljene ekipe"}).getByRole("listitem").filter({has: page.getByText(away.name, {exact: true})});
  await expect(awayRow).toContainText("Neaktivna");
  await healthy(page);
});

test("with Pušački stolovi, Složi Kolo 1 seats the team with the most smokers at the smoking table, marked in Skica and in Kolo 1", async ({as, own, organizer, db, healthy}) => {
  // DECISIONS 100: before, a tournament had no smoking tables, so its tables went in the draw's order whoever smoked
  const t = await own({teams: 4});
  const [smokers] = t.teams;
  // every active player of `smokers` smokes and nobody else in the tournament does; put back afterwards
  const players = await db.player.findMany({where: {teamPlayers: {some: {team_id: {in: t.teams.map((x) => x.id)}}}}, select: {id: true, smoker: true}});
  const smokerIds = (await db.teamPlayer.findMany({where: {team_id: smokers.id, player: {active: true}}, select: {player_id: true}})).map((p) => p.player_id);
  try {
    await db.player.updateMany({where: {id: {in: players.map((p) => p.id)}}, data: {smoker: false}});
    await db.player.updateMany({where: {id: {in: smokerIds}}, data: {smoker: true}});
    // Podaci · Spremi promjene with Stol 2 as the smoking table, Označi dolazak for every team, then Prijave zatvorene
    await markArrived(organizer, t.id, t.teams);
    const saved = await organizer.patch(`/api/admin/tournaments/${t.id}`, {data: {...(await tournamentRequest(db, t.id)), smoking_tables: [2]}});
    expect(saved.ok(), `Spremi promjene: ${await saved.text()}`).toBeTruthy();
    const closed = await organizer.patch(`/api/admin/tournaments/${t.id}/registrations`, {data: {open: false}});
    expect(closed.ok(), `Prijave zatvorene: ${await closed.text()}`).toBeTruthy();

    const page = await as("organizer");
    await page.goto(`/turniri/${t.id}/upravljanje?view=kola`);
    await page.getByRole("button", {name: "Složi Kolo 1"}).click();

    // Skica kola: the draw is random, but the smokers' match sits at Stol 2, the only one with the smoking mark
    const skica = page.getByRole("list", {name: "Skica Kola 1, stolovi"});
    await expect(skica.getByRole("listitem")).toHaveCount(2);
    const smokersRow = skica.getByRole("listitem").filter({has: page.getByText(smokers.name, {exact: true})});
    await expect(smokersRow.getByRole("img", {name: "Pušački stol"})).toBeVisible();
    await expect(skica.getByRole("img", {name: "Pušački stol"})).toHaveCount(1);
    const [stol1, stol2] = await koloTables(db, t.id, 1);
    expect([stol2.table, [stol2.team1.id, stol2.team2.id].includes(smokers.id)]).toEqual([2, true]);

    // published, Kolo 1 says the same to the organizer and to every reader of the table's link
    await page.getByRole("button", {name: "Objavi kolo"}).click();
    await expect(page.getByRole("heading", {name: "Kolo 1", level: 1})).toBeVisible();
    await expect(page.getByRole("link", {name: new RegExp(`^Stol 2, pušački: ${escape(stol2.team1.name)} 0, ${escape(stol2.team2.name)} 0, nije počelo\\. Otvori stol$`)})).toBeVisible();
    await expect(page.getByRole("link", {name: new RegExp(`^Stol 1: ${escape(stol1.team1.name)} 0, ${escape(stol1.team2.name)} 0, nije počelo\\. Otvori stol$`)})).toBeVisible();
    await healthy(page);
  } finally {
    for (const smoker of [true, false]) {
      await db.player.updateMany({where: {id: {in: players.filter((p) => p.smoker === smoker).map((p) => p.id)}}, data: {smoker}});
    }
  }
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
  // #83 (fixed by f0a8b44): the scorepad sends everyone to Tko igra first, and Tko igra let only the table's players and
  // an admin in. The organizer runs their own tournament's tables as the admin does (DECISIONS #86, #99).
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
