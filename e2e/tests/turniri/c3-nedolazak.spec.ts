// C3 · Kolo 1 and Nedolazak za stol (DECISIONS #69, #97: 4, 6 and 10 minutes). The admin makes Kolo 1 of a ready
// tournament (as tournaments.ready) and publishes it; then at a table where no game starts the Kolo's published_at is
// moved back: the question "Jesu li … za stolom?" comes at 4 minutes with Da, tu su working at once, Ne, nisu došli
// works from 6 (1001 : 700 for the answering team, the other team out and banned from sign-ups for a month, since it is
// Kolo 1), and a table with neither a game nor an answer is skipped at 10 minutes (both teams out and banned).
// Each test makes its own tournament of six teams through the admin's routes and removes it afterwards.
import {clock, day, escape, expect, koloOutFor, koloTables, makeReady, monthLater, openAndAsk, openTable, pickTeams, publishNextKolo, runClock, test, tick, type Entry} from "../../helpers/c3";

type Table = Awaited<ReturnType<typeof koloTables>>[number];

const byId = (teams: Entry[], id: number) => teams.find((t) => t.id === id)!;

test("the admin makes Kolo 1 of a ready tournament with Složi Kolo 1, publishes it, and every team has its table", async ({as, api, db, admin, tournaments, healthy}) => {
  const teams = await pickTeams(db, 6, {phones: 1});
  const t = await makeReady(tournaments.make, admin, teams);

  const page = await as("admin");
  await page.goto(`/turniri/${t.id}/upravljanje`);
  await page.getByRole("tab", {name: "Kola"}).click();
  await expect(page.getByRole("tabpanel", {name: "Kola"})).toContainText("Prijave su zatvorene: Kolo 1 se slaže nasumično.");
  await page.getByRole("button", {name: "Složi Kolo 1"}).click();

  // Skica kola: three tables drawn at random, every team at one; players don't see it yet
  await expect(page.getByRole("heading", {name: "Skica kola", level: 1})).toBeVisible();
  const draftRows = page.getByRole("list", {name: "Skica Kola 1, stolovi"}).getByRole("listitem");
  await expect(draftRows).toHaveCount(3);
  const drafts = await koloTables(db, t.id, 1);
  expect(drafts.map((r) => r.status)).toEqual(["DRAFT", "DRAFT", "DRAFT"]);
  expect(drafts.flatMap((r) => [r.team1_id, r.team2_id]).sort((a, b) => a - b)).toEqual(teams.map((e) => e.id).sort((a, b) => a - b));
  await expect(draftRows).toHaveText(drafts.map((r) => new RegExp(`^${r.table_number}\\s*${escape(r.team1.team_name)}\\s*vs\\s*${escape(r.team2.team_name)}$`)));
  const phone = await api(teams[0].phone!);
  expect(await openTable(phone), "a draft's table is not offered to its players").toBeNull();

  // Objavi kolo: the tables go out and the tournament has started
  await page.getByRole("button", {name: "Objavi kolo"}).click();
  await expect(page.getByRole("heading", {name: "Kolo 1", level: 1})).toBeVisible();
  await expect(page.getByText("0/3 gotovo")).toBeVisible();
  const published = await koloTables(db, t.id, 1);
  expect(published.map((r) => [r.id, r.status, r.published_at != null, r.open])).toEqual(drafts.map((r) => [r.id, "PUBLISHED", true, true]));
  const started = await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}});
  expect([started.started_at != null, started.registrations_open]).toEqual([true, false]);
  for (const r of published) {
    await expect(page.getByRole("link", {name: new RegExp(`^Stol ${r.table_number}: `)})).toHaveAccessibleName(
      `Stol ${r.table_number}: ${r.team1.team_name} 0, ${r.team2.team_name} 0, nije počelo. Otvori stol`,
    );
  }
  await healthy(page);

  // the player's page now holds the team's table
  const mine = published.find((r) => r.team1_id === teams[0].id || r.team2_id === teams[0].id)!;
  const opponent = mine.team1_id === teams[0].id ? mine.team2.team_name : mine.team1.team_name;
  expect(await openTable(phone)).toBe(mine.id);
  const player = await as(teams[0].phone!);
  await player.goto(`/turniri/${t.id}`);
  await expect(player.getByRole("button", {name: `STOL ${mine.table_number} ${teams[0].name} ${opponent} Započni igru`})).toBeVisible();
  await healthy(player);
});

test("Nedolazak za stol: no question before 4 minutes, the question at 4 with Ne, nisu došli locked until 6, then 1001 : 700, the other team out and banned for a month", async ({
  as,
  api,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 6, {phones: 6});
  const t = await makeReady(tournaments.make, admin, teams);
  const {tables} = await publishNextKolo(admin, db, t.id);
  // the table of the test: team1 answers, team2 didn't come
  const table: Table = tables[0];
  const [here, absent] = [byId(teams, table.team1_id), byId(teams, table.team2_id)];
  const page = await as(here.phone!);
  const phone = await api(here.phone!);
  const answer = (a: "PRESENT" | "NO_SHOW") => phone.post(`/api/rounds/${table.id}/attendance`, {data: {answer: a}});
  const publishedAt = async () => (await db.round.findUniqueOrThrow({where: {id: table.id}})).published_at!;

  // 3:30 after the Kolo went out: nothing is asked yet, and the server takes no answer
  await koloOutFor(db, t.id, 1, 3.5);
  expect((await openAndAsk(page, `/turniri/${t.id}`)).prompt).toBeNull();
  await expect(page.getByRole("button", {name: `STOL ${table.table_number} ${here.name} ${absent.name} Započni igru`})).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  const early = await answer("PRESENT");
  expect([early.status(), await early.json()]).toEqual([400, {error: `Odgovor je moguć od ${clock(new Date((await publishedAt()).getTime() + 4 * 60_000))}.`}]);

  // 4 minutes: the question covers the page; Da, tu su works, Ne, nisu došli is locked until 6 minutes
  await koloOutFor(db, t.id, 1, 4);
  const unlockAt = clock(new Date((await publishedAt()).getTime() + 6 * 60_000));
  expect((await openAndAsk(page, `/turniri/${t.id}`)).prompt).toMatchObject({round_id: table.id});
  const question = page.getByRole("alertdialog", {name: `Jesu li ${absent.name} za stolom?`});
  await expect(question).toContainText(`Kolo 1 · Stol ${table.table_number}`);
  await expect(question).toContainText("Kolo je počelo prije 4 minute, a igra za vašim stolom još nije započela.");
  await expect(question.getByRole("button", {name: "Da, tu su · započni igru"})).toBeEnabled();
  await expect(question.getByRole("button", {name: "Ne, nisu došli"})).toBeDisabled();
  await expect(question).toContainText(`„Ne, nisu došli” je moguće od ${unlockAt}. Pričekajte protivnika.`);
  await healthy(page);

  // 5:30: the server still refuses Ne, nisu došli
  await koloOutFor(db, t.id, 1, 5.5);
  const tooSoon = await answer("NO_SHOW");
  expect([tooSoon.status(), await tooSoon.json()]).toEqual([400, {error: `„Ne, nisu došli” je moguće od ${clock(new Date((await publishedAt()).getTime() + 6 * 60_000))}.`}]);
  expect((await db.round.findUniqueOrThrow({where: {id: table.id}})).attendance).toBeNull();

  // 6 minutes: Ne, nisu došli, and once more what it means (Kolo 1: a ban for them)
  await koloOutFor(db, t.id, 1, 6);
  await openAndAsk(page, `/turniri/${t.id}`);
  await question.getByRole("button", {name: "Ne, nisu došli"}).click();
  const confirm = page.getByRole("alertdialog", {name: `${absent.name} nisu došli?`});
  await expect(confirm).toContainText(`${here.name} pobjeđuju`);
  await expect(confirm).toContainText(`${absent.name} dobivaju i zabranu prijava na turnire na mjesec dana`);
  await confirm.getByRole("button", {name: "Potvrđujem, nisu došli"}).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  // the table: closed, won 1001 : 700 without play; the absent team out after Kolo 1 and banned with its players
  const closed = await db.round.findUniqueOrThrow({where: {id: table.id}, include: {matches: true}});
  expect([closed.attendance, closed.attendance_team_id, closed.open, closed.team1_wins, closed.team2_wins]).toEqual(["NO_SHOW", here.id, false, 1, 0]);
  expect(closed.matches.map((m) => [m.player_pair1_score, m.player_pair2_score])).toEqual([[1001, 700]]);
  const out = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: absent.id}}});
  expect([out.excluded_reason, out.excluded_kolo]).toEqual(["NO_SHOW", 1]);
  const stays = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: here.id}}});
  expect(stays.excluded_at).toBeNull();
  const bans = await db.signupBan.findMany({where: {tournament_id: t.id}, orderBy: {id: "asc"}});
  const teamBan = bans.find((b) => b.team_id != null)!;
  expect(bans.filter((b) => b.team_id != null).map((b) => b.team_id)).toEqual([absent.id]);
  expect([teamBan.until?.toISOString().slice(0, 10), teamBan.reason, teamBan.created_by, teamBan.lifted_at]).toEqual([
    monthLater(day()),
    `Nedolazak u 1. kolu · ${t.name}`,
    null,
    null,
  ]);
  const roster = await db.teamPlayer.findMany({where: {team_id: absent.id}, select: {player_id: true}});
  expect(bans.filter((b) => b.via_ban_id === teamBan.id).map((b) => b.player_id).sort()).toEqual(roster.map((p) => p.player_id).sort());

  // the winners' page: Pobjeda bez igre while the Kolo is played; the absent team's: out, with the ban
  await page.goto(`/turniri/${t.id}`);
  const won = page.getByRole("region", {name: "Pobjeda bez igre"});
  await expect(won.getByRole("heading")).toHaveText(`Pobjeda bez igre · Stol ${table.table_number}`);
  await expect(won).toContainText(`${absent.name} nisu došli. Dobivate 1001 : 700.`);
  await expect(won).toContainText(/Partija\s*1001 : 700/);
  await healthy(page);
  const theirs = await as(absent.phone!);
  await theirs.goto(`/turniri/${t.id}`);
  const excluded = theirs.getByRole("region", {name: "Isključeni ste iz turnira"});
  await expect(excluded).toContainText(`${here.name} su u ${clock(closed.attendance_at!)} prijavili da niste došli za Stol ${table.table_number} u Kolu 1.`);
  await expect(excluded).toContainText("Ne igrate ostala kola ovog turnira. Dobili ste i zabranu prijava na turnire na mjesec dana.");
  await healthy(theirs);
});

test("a table with neither a game nor an answer is skipped at 10 minutes, not before: both teams out and banned, and its players are told once", async ({
  as,
  api,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const teams = await pickTeams(db, 6, {phones: 6});
  const t = await makeReady(tournaments.make, admin, teams);
  const {tables} = await publishNextKolo(admin, db, t.id);
  const [first, skipped, third] = tables;
  // the other two tables said Da, tu su at 4 minutes, so only the middle one waits
  await koloOutFor(db, t.id, 1, 4);
  for (const r of [first, third]) {
    const res = await (await api(byId(teams, r.team1_id).players[0].username)).post(`/api/rounds/${r.id}/attendance`, {data: {answer: "PRESENT"}});
    expect(await res.json()).toEqual({outcome: "PRESENT"});
  }

  // 9:30: the clock leaves it alone
  await koloOutFor(db, t.id, 1, 9.5);
  await runClock(admin, t.id);
  expect((await db.round.findUniqueOrThrow({where: {id: skipped.id}})).attendance).toBeNull();

  // 10 minutes: the scheduler's tick skips it (the clock runs once per tournament every few seconds, so it is asked
  // again until it has run)
  await koloOutFor(db, t.id, 1, 10);
  await expect
    .poll(async () => {
      await tick(admin);
      return (await db.round.findUniqueOrThrow({where: {id: skipped.id}})).attendance;
    })
    .toBe("SKIPPED");
  const after = await koloTables(db, t.id, 1);
  expect(after.map((r) => [r.id, r.attendance, r.open])).toEqual([
    [first.id, "PRESENT", true],
    [skipped.id, "SKIPPED", false],
    [third.id, "PRESENT", true],
  ]);
  expect(await db.match.count({where: {round_id: skipped.id}})).toBe(0);
  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id, excluded_at: {not: null}}});
  expect(entries.map((e) => [e.team_id, e.excluded_reason, e.excluded_kolo]).sort()).toEqual(
    [skipped.team1_id, skipped.team2_id].map((id) => [id, "SKIPPED", 1]).sort(),
  );
  const teamBans = await db.signupBan.findMany({where: {tournament_id: t.id, team_id: {not: null}}});
  expect(teamBans.map((b) => [b.team_id, b.until?.toISOString().slice(0, 10)]).sort()).toEqual(
    [skipped.team1_id, skipped.team2_id].map((id) => [id, monthLater(day())]).sort(),
  );

  // a player of the skipped table is told once (Razumijem), then sees the team out of the tournament
  const [one, two] = [byId(teams, skipped.team1_id), byId(teams, skipped.team2_id)];
  const page = await as(one.phone!);
  expect((await openAndAsk(page, `/turniri/${t.id}`)).notices.map((n) => n.round_id)).toContain(skipped.id);
  const told = page.getByRole("alertdialog", {name: "Meč je preskočen"});
  await expect(told).toContainText(`Kolo 1 · Stol ${skipped.table_number}`);
  await expect(told).toContainText(`${one.name} i ${two.name} ispadaju iz turnira`);
  await told.getByRole("button", {name: "Razumijem"}).click();
  await expect(told).toBeHidden();
  const excluded = page.getByRole("region", {name: "Isključeni ste iz turnira"});
  await expect(excluded).toContainText(`Meč za Stolom ${skipped.table_number} u Kolu 1 nije započeo ni 10 minuta nakon početka kola i nitko nije prijavio nedolazak.`);
  await expect(excluded).toContainText("Dobili ste i zabranu prijava na turnire na mjesec dana.");
  // once: the phone remembers it was told, so the notice the server still sends isn't shown again
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("bela.skippedSeen") ?? "[]") as number[])).toContain(skipped.id);
  expect((await openAndAsk(page, `/turniri/${t.id}`)).notices.map((n) => n.round_id)).toContain(skipped.id);
  await expect(excluded).toBeVisible();
  await expect(told).toHaveCount(0);
  await healthy(page);
});

// BUG: answering Ne, nisu došli on the tournament's own page leaves its Započni igru for the table just closed (the open
// table is read once, when the page opens); tapping it says "Trenutno nemaš otvorenu rundu."
// BUG #85: useOpenTable reads the open table once, so the closed table's Započni igru stays after the answer
test.fail("after Ne, nisu došli on the tournament's page, the page shows Pobjeda bez igre instead of the closed table's Započni igru", async ({
  as,
  db,
  admin,
  tournaments,
}) => {
  const teams = await pickTeams(db, 6, {phones: 6});
  const t = await makeReady(tournaments.make, admin, teams);
  const {tables} = await publishNextKolo(admin, db, t.id);
  const [here, absent] = [byId(teams, tables[0].team1_id), byId(teams, tables[0].team2_id)];
  await koloOutFor(db, t.id, 1, 6);
  const page = await as(here.phone!);
  await page.goto(`/turniri/${t.id}`);
  await expect(page.getByRole("button", {name: new RegExp(`^STOL ${tables[0].table_number} .*Započni igru$`)})).toBeVisible();
  await page.getByRole("alertdialog", {name: `Jesu li ${absent.name} za stolom?`}).getByRole("button", {name: "Ne, nisu došli"}).click();
  await page.getByRole("button", {name: "Potvrđujem, nisu došli"}).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("region", {name: "Pobjeda bez igre"})).toBeVisible();
  await expect(page.getByRole("button", {name: /Započni igru$/})).toHaveCount(0);
});
