// C3 · Potvrda dolaska on the tournament's day (DECISIONS #69): the player's Tu smo, the admin's arrival screen (who is
// here, Označi dolazak for a waiting team, what the start time will do), and the start time's switch: the team in that
// didn't confirm becomes inactive (still signed up) and the confirmed team of the waiting list comes in, while the
// unconfirmed waiting team keeps waiting. As tournaments.arrival, on a tournament of the test's own: today, Okupljanje
// 00:00 and Početak 23:59, so the window is open whenever the test runs; the start time comes by moving it to 00:00.
import {addTeams, clock, day, escape, expect, markArrived, pickTeams, test} from "../../helpers/c3";

test("Tu smo, the admin's arrival screen and the start time: the unconfirmed team is inactive and the confirmed waiting team comes in", async ({
  as,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  const [hh, mm] = clock(new Date()).split(":").map(Number);
  test.skip(hh * 60 + mm >= 23 * 60 + 58, "the window of this test's tournament closes at 23:59");
  const [mine, late, a, b, firstWaiting, secondWaiting] = await pickTeams(db, 6, {phones: 2});
  const t = await tournaments.make({name: "Večernji turnir", date: day(), gathering_time: "00:00", start_time: "23:59", max_teams: 4});
  await addTeams(admin, t.id, [mine, late, a, b, firstWaiting, secondWaiting]);
  await markArrived(admin, t.id, [a, b]);
  const player = mine.players.find((p) => p.username === mine.phone)!;

  // the player's Tu smo
  const page = await as(mine.phone!);
  await page.goto(`/turniri/${t.id}`);
  const unconfirmed = page.getByRole("region", {name: "Dolazak nije potvrđen"});
  await expect(unconfirmed).toContainText("Jeste li stigli? Potvrdite do 23:59, inače ekipa ne igra prvo kolo.");
  await unconfirmed.getByRole("button", {name: "Tu smo"}).click();
  const here = page.getByRole("region", {name: "Tu ste"});
  await expect(here.getByRole("button", {name: "Ipak otkazujemo"})).toBeVisible();
  const entry = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: mine.id}}});
  expect([entry.arrived_at != null, entry.arrived_by, entry.arrived_by_admin]).toEqual([true, player.id, false]);
  await expect(here).toContainText(`Potvrdio ${player.first_name} u ${clock(entry.arrived_at!)}. Prvo kolo počinje u 23:59.`);
  await healthy(page);

  // the admin's day: three here, one not; the start time will leave that one inactive
  const desk = await as("admin");
  await desk.goto(`/turniri/${t.id}/upravljanje`);
  const summary = desk.getByRole("button", {name: /^Potvrda dolaska/});
  await expect(summary).toContainText(/^Potvrda dolaska do 23:59\s*3 tu · 1 nije potvrdilo · još \d+ min$/);
  const inList = desk.getByRole("list", {name: "Prijavljene ekipe"});
  const row = (list: typeof inList, team: string) => list.getByRole("listitem").filter({hasText: new RegExp(`^${escape(team)}`)});
  await expect(inList.getByRole("listitem")).toHaveText([mine, late, a, b].map((e) => new RegExp(`^${escape(e.name)}\\s*(Tu|Nije potvrdila)`)));
  await expect(row(inList, mine.name)).toContainText(new RegExp(`^${escape(mine.name)}\\s*Tu`));
  await expect(row(inList, late.name)).toContainText(new RegExp(`^${escape(late.name)}\\s*Nije potvrdila`));
  await expect(row(inList, late.name).getByRole("button", {name: "Označi dolazak"})).toBeVisible();
  await expect(desk.getByRole("switch", {name: `${late.name} igra sljedeće kolo`})).toBeChecked();
  const atStart = desk.getByRole("region", {name: "U 23:59"});
  await expect(atStart).toContainText("1 nepotvrđena ekipa postaje Neaktivna (ostaju prijavljene).");
  await expect(atStart).not.toContainText("lista čekanja");

  // Označi dolazak for the first waiting team (it has no phone): now it will come in at the start time
  await desk.getByRole("tab", {name: "Čekanje"}).click();
  const waitList = desk.getByRole("list", {name: "Lista čekanja"});
  await expect(waitList.getByRole("listitem")).toHaveText([
    new RegExp(`^1\\s*${escape(firstWaiting.name)}\\s*Nije potvrdila`),
    new RegExp(`^2\\s*${escape(secondWaiting.name)}\\s*Nije potvrdila`),
  ]);
  await row(waitList, `1${firstWaiting.name}`).getByRole("button", {name: "Označi dolazak"}).click();
  await expect(waitList.getByRole("listitem").first()).toHaveText(new RegExp(`^1\\s*${escape(firstWaiting.name)}\\s*Tu`));
  await desk.getByRole("tab", {name: "Prijave"}).click();
  await expect(atStart).toContainText(`${firstWaiting.name} (lista čekanja, tu) postaje Aktivna umjesto neaktivnih.`);
  await healthy(desk);

  // Početak: the start time has come (moved to 00:00); the admin's next read runs the switch
  await db.tournament.update({where: {tournament_id: t.id}, data: {gathering_time: null, start_time: "00:00"}});
  await desk.reload();
  await expect(summary).toContainText(/^Potvrda dolaska zatvorena u 0:00\s*4 tu · 1 nije potvrdilo$/);
  await expect(inList.getByRole("listitem")).toHaveText([mine, late, a, b, firstWaiting].map((e) => new RegExp(`^${escape(e.name)}`)));
  await expect(desk.getByRole("switch", {name: `${late.name} igra sljedeće kolo`})).not.toBeChecked();
  await expect(desk.getByRole("switch", {name: `${firstWaiting.name} igra sljedeće kolo`})).toBeChecked();
  await expect(atStart).toBeHidden();
  await desk.getByRole("tab", {name: "Čekanje"}).click();
  await expect(waitList.getByRole("listitem")).toHaveText([new RegExp(`^1\\s*${escape(secondWaiting.name)}\\s*Nije potvrdila`)]);
  await healthy(desk);

  const after = await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}, include: {tournamentTeams: true}});
  expect([after.arrival_closed_at != null, after.registrations_open, after.started_at]).toEqual([true, false, null]);
  const state = new Map(after.tournamentTeams.map((e) => [e.team_id, [e.status, e.active]]));
  expect([mine, late, a, b, firstWaiting, secondWaiting].map((e) => state.get(e.id))).toEqual([
    ["REGISTERED", true],
    ["REGISTERED", false],
    ["REGISTERED", true],
    ["REGISTERED", true],
    ["REGISTERED", true],
    ["WAITING", true],
  ]);

  // the team that didn't confirm sees it, and that it can still join from the next Kolo
  const lateOne = await as(late.phone!);
  await lateOne.goto(`/turniri/${t.id}`);
  const out = lateOne.getByRole("region", {name: "Niste potvrdili dolazak"});
  await expect(out).toContainText("Turnir počinje bez vas. Ako ste stigli, uskočite: igrate od sljedećeg kola. Propuštena kola se ne broje.");
  await expect(out.getByRole("button", {name: "Tu smo · Želimo uskočiti"})).toBeVisible();
  await healthy(lateOne);
});

// BUG: a tournament without Početak (as tournaments.ready) gives a team the admin marked here "Prvo kolo počinje u ."
// on its card: the start time the sentence quotes is empty
test.fail("a team marked here at a tournament without a start time is not told that the first Kolo starts at an empty time", async ({as, db, admin, tournaments}) => {
  const teams = await pickTeams(db, 2, {phones: 1});
  const t = await tournaments.make({name: "Turnir spreman za start", date: day(), rounds: 3, max_teams: 8});
  await addTeams(admin, t.id, teams);
  await markArrived(admin, t.id, teams);
  const page = await as(teams[0].phone!);
  await page.goto(`/turniri/${t.id}`);
  const card = page.getByRole("region", {name: "Tu ste"});
  await expect(card).toContainText(`Organizator je označio dolazak u `);
  expect(await card.innerText()).not.toMatch(/počinje u\s*\./);
});
