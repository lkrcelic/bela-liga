// C3 · sign-ups for a tournament on the phone (DECISIONS #69, #93): a player signs a team up and off again (as on
// tournaments.open), a full tournament puts the sign-up on the waiting list in its turn and a team leaving lets the first
// waiting team in (as on tournaments.fullWaiting), tournaments.closed and tournaments.cancelled refuse a team with their
// text, and tournaments.hidden (Sakrij broj prijava) shows how many teams and which only to whoever runs it.
// The tests that change sign-ups make their own tournament like the seeded one; the read-only ones use the seeded one.
import {addTeams, day, escape, expect, pickTeams, test} from "../../helpers/c3";

test("a player signs his team up for an open tournament and signs it off again", async ({as, db, admin, tournaments, healthy}) => {
  // like tournaments.open: Martinje kup in five days, Okupljanje 17:30, Početak 18:00, room left
  const [mine, ...others] = await pickTeams(db, 4, {phones: 1});
  const t = await tournaments.make({name: "Martinje kup", date: day(5), gathering_time: "17:30", start_time: "18:00", max_teams: 16});
  await addTeams(admin, t.id, others);
  const player = mine.players.find((p) => p.username === mine.phone)!;

  const page = await as(mine.phone!);
  await page.goto(`/turniri/${t.id}`);
  const open = page.getByRole("region", {name: "Prijave otvorene"});
  await expect(open).toContainText(/3\s*ekipe/);
  await open.getByRole("button", {name: "Prijavi se", exact: true}).click();

  // Koju ekipu prijavljuješ? — one of the player's teams, then Prijavi ekipu
  const sheet = page.getByRole("dialog", {name: "Koju ekipu prijavljuješ?"});
  await sheet.getByRole("radio", {name: new RegExp(`^${escape(mine.name)} `)}).click();
  await sheet.getByRole("button", {name: `Prijavi ekipu ${mine.name}`}).click();

  // what happens on the day, then the team's card and the team in the list
  const joined = page.getByRole("dialog", {name: `${mine.name} su prijavljeni`});
  await expect(joined).toContainText("Od 17:30 potvrdi dolazak");
  await expect(joined).toContainText("Bez potvrde do 18:00 ne igrate 1. kolo");
  await joined.getByRole("button", {name: "Na stranicu turnira"}).click();
  await expect(joined).toBeHidden();
  const card = page.getByRole("region", {name: "Prijavljeni ste"});
  await expect(card).toContainText(mine.name);
  await expect(card).toContainText("Na dan turnira od 17:30 do 18:00 ovdje potvrdi da ste došli.");
  const list = page.getByRole("region", {name: "Prijavljene ekipe"});
  await expect(list.getByRole("heading")).toHaveText("Prijavljene ekipe · 4");
  await expect(list.getByRole("listitem").first()).toContainText(`${player.first_name} ${player.last_name} (ti)`);
  const entry = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: mine.id}}});
  expect([entry.status, entry.registered_by]).toEqual(["REGISTERED", player.id]);
  await healthy(page);

  // Odjavi se s turnira, asked first
  await page.getByRole("button", {name: "Odjavi se s turnira"}).click();
  const ask = page.getByRole("dialog", {name: `Odjaviti ekipu ${mine.name} s turnira?`});
  await ask.getByRole("button", {name: "Odjavi ekipu"}).click();
  await expect(ask).toBeHidden();
  await expect(open.getByRole("button", {name: "Prijavi se", exact: true})).toBeVisible();
  await expect(open).toContainText(/3\s*ekipe/);
  await expect(page.getByRole("region", {name: "Prijavljene ekipe"}).getByRole("heading")).toHaveText("Prijavljene ekipe · 3");
  expect(await db.tournamentTeam.count({where: {tournament_id: t.id, team_id: mine.id}})).toBe(0);
  await healthy(page);
});

test("a full tournament puts a sign-up on the waiting list in its turn, and a team signing off lets the first waiting team in", async ({
  as,
  db,
  admin,
  tournaments,
  healthy,
}) => {
  // like tournaments.fullWaiting, smaller: 4 of 4 in, two teams waiting
  const [leaving, late, ...rest] = await pickTeams(db, 7, {phones: 2});
  const [b, c, d, firstWaiting, secondWaiting] = rest;
  const t = await tournaments.make({name: "Božićni turnir", date: day(12), gathering_time: "17:30", start_time: "18:00", max_teams: 4, entry_fee: 15, rounds: 4});
  await addTeams(admin, t.id, [leaving, b, c, d, firstWaiting, secondWaiting]);

  // the late team signs up: Prijavi se na listu čekanja, and the sheet says its place, third
  const phone = await as(late.phone!);
  await phone.goto(`/turniri/${t.id}`);
  const open = phone.getByRole("region", {name: "Prijave otvorene"});
  await expect(open).toContainText("Turnir je pun: nova prijava ide na listu čekanja.");
  await open.getByRole("button", {name: "Prijavi se na listu čekanja"}).click();
  const sheet = phone.getByRole("dialog", {name: "Koju ekipu prijavljuješ?"});
  await sheet.getByRole("radio", {name: new RegExp(`^${escape(late.name)} `)}).click();
  await sheet.getByRole("button", {name: `Prijavi ekipu ${late.name}`}).click();
  const waiting = phone.getByRole("dialog", {name: "Na listi čekanja ste"});
  await expect(waiting).toContainText(/3\.\s*mjesto/);
  await expect(waiting).toContainText("3. na listi čekanja");
  await waiting.getByRole("button", {name: "U redu"}).click();
  await expect(phone.getByRole("region", {name: "Na listi čekanja"}).getByRole("heading")).toHaveText("Na listi čekanja · 3.");
  await healthy(phone);

  // a team in signs off: the first waiting team takes its place, without a notice
  const other = await as(leaving.phone!);
  await other.goto(`/turniri/${t.id}`);
  await other.getByRole("button", {name: "Odjavi se s turnira"}).click();
  await other.getByRole("dialog", {name: `Odjaviti ekipu ${leaving.name} s turnira?`}).getByRole("button", {name: "Odjavi ekipu"}).click();
  await expect(other.getByRole("region", {name: "Prijave otvorene"})).toContainText("Turnir je pun: nova prijava ide na listu čekanja.");
  const entries = await db.tournamentTeam.findMany({where: {tournament_id: t.id}, orderBy: {registered_at: "asc"}});
  expect(entries.map((e) => [e.team_id, e.status])).toEqual([
    [b.id, "REGISTERED"],
    [c.id, "REGISTERED"],
    [d.id, "REGISTERED"],
    [firstWaiting.id, "REGISTERED"],
    [secondWaiting.id, "WAITING"],
    [late.id, "WAITING"],
  ]);

  // the late team moved up to second
  await phone.reload();
  await expect(phone.getByRole("region", {name: "Na listi čekanja"}).getByRole("heading")).toHaveText("Na listi čekanja · 2.");

  // the admin's Prijave and Čekanje
  const page = await as("admin");
  await page.goto(`/turniri/${t.id}/upravljanje`);
  await expect(page.getByRole("switch", {name: /^Prijave otvorene/})).toHaveAccessibleName("Prijave otvorene 4 od 4 ekipe · 2 na čekanju");
  await expect(page.getByRole("list", {name: "Prijavljene ekipe"}).getByRole("listitem")).toHaveText([b, c, d, firstWaiting].map((e) => new RegExp(`^${escape(e.name)}`)));
  await page.getByRole("tab", {name: "Čekanje"}).click();
  await expect(page.getByRole("list", {name: "Lista čekanja"}).getByRole("listitem")).toHaveText([
    new RegExp(`^1\\s*${escape(secondWaiting.name)}`),
    new RegExp(`^2\\s*${escape(late.name)}`),
  ]);
  await healthy(page);
});

test("sign-ups closed and a cancelled tournament refuse a team, each with its own text", async ({as, api, db, world, healthy}) => {
  const {closed, cancelled} = world.tournaments;
  const [mine] = await pickTeams(db, 1, {phones: 1, notIn: [closed.id, cancelled.id]});
  const page = await as(mine.phone!);
  const phone = await api(mine.phone!);

  // Prijave zatvorene: the card says so and has no Prijavi se; the server refuses a sign-up sent anyway
  await page.goto(`/turniri/${closed.id}`);
  await expect(page.getByRole("heading", {name: closed.name, level: 1})).toBeVisible();
  const card = page.getByRole("region", {name: "Prijave zatvorene"});
  await expect(card).toContainText("Prijave su zatvorene. Turnir možeš pratiti ovdje: poredak i rezultati bit će vidljivi od prvog kola.");
  await expect(page.getByRole("button", {name: /Prijavi se/})).toHaveCount(0);
  const refused = await phone.post(`/api/tournaments/${closed.id}/registrations`, {data: {team_id: mine.id}});
  expect([refused.status(), await refused.json()]).toEqual([400, {error: "Prijave su zatvorene."}]);
  await healthy(page);

  // Otkazan
  await page.goto(`/turniri/${cancelled.id}`);
  await expect(page.getByRole("heading", {name: cancelled.name, level: 1})).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Turnir je otkazan. Prijave su zatvorene i turnir se neće igrati.");
  await expect(page.getByRole("button", {name: /Prijavi se/})).toHaveCount(0);
  const refusedToo = await phone.post(`/api/tournaments/${cancelled.id}/registrations`, {data: {team_id: mine.id}});
  expect([refusedToo.status(), await refusedToo.json()]).toEqual([400, {error: "Turnir je otkazan."}]);
  await healthy(page);

  expect(await db.tournamentTeam.count({where: {team_id: mine.id, tournament_id: {in: [closed.id, cancelled.id]}}})).toBe(0);
});

test("Sakrij broj prijava: whoever runs the tournament sees how many teams signed up and which; a guest, a player, the team signed up and an organizer who doesn't run it see neither", async ({
  as,
  api,
  db,
  world,
  healthy,
}) => {
  const {hidden} = world.tournaments;
  const signedUp = await db.tournamentTeam.findMany({where: {tournament_id: hidden.id}, include: {team: true}});
  expect(signedUp).toHaveLength(6);
  const [outsider] = await pickTeams(db, 1, {phones: 1, notIn: [hidden.id]});

  // a guest, a player of another team, the organizer (not his tournament) and the player whose team is in
  for (const who of ["guest", outsider.phone!, "organizer", "player"]) {
    const page = await as(who);
    await page.goto(`/turniri/${hidden.id}`);
    await expect(page.getByRole("heading", {name: hidden.name, level: 1})).toBeVisible();
    if (who === "player") {
      await expect(page.getByRole("region", {name: "Prijavljeni ste"})).toBeVisible();
    } else {
      const card = page.getByRole("region", {name: "Prijave otvorene"});
      await expect(card).toContainText("Broj mjesta je ograničen");
      await expect(card.getByRole("button", {name: "Prijavi se", exact: true})).toBeVisible();
    }
    await expect(page.getByRole("region", {name: "Prijavljene ekipe"}), who).toHaveCount(0);
    await expect(page.getByRole("main"), who).not.toContainText(/\d+\s*ekip/);
    await page.goto(`/turniri/${hidden.id}/ekipe`);
    await expect(page.getByText("Popis prijavljenih ekipa vidi se od 1. kola."), who).toBeVisible();
    await healthy(page);
    // and nothing that tells it leaves the server
    const answer = await (await api(who)).get(`/api/tournaments/${hidden.id}`);
    expect(answer.ok()).toBeTruthy();
    const body = (await answer.json()) as {teams: number; waiting: number; players: number; avatars: unknown[]; entries: unknown[]};
    expect({teams: body.teams, waiting: body.waiting, players: body.players, avatars: body.avatars, entries: body.entries}, who).toEqual({
      teams: 0,
      waiting: 0,
      players: 0,
      avatars: [],
      entries: [],
    });
  }

  // the admin sees all six, on the players' page and in Upravljanje turnirom
  const page = await as("admin");
  await page.goto(`/turniri/${hidden.id}`);
  const list = page.getByRole("region", {name: "Prijavljene ekipe"});
  await expect(list.getByRole("heading")).toHaveText("Prijavljene ekipe · 6");
  await page.goto(`/turniri/${hidden.id}/upravljanje`);
  await expect(page.getByRole("switch", {name: /^Prijave otvorene/})).toHaveAccessibleName("Prijave otvorene 6 od 12 ekipa");
  await expect(page.getByRole("list", {name: "Prijavljene ekipe"}).getByRole("listitem")).toHaveCount(6);
  for (const e of signedUp) await expect(page.getByRole("list", {name: "Prijavljene ekipe"})).toContainText(e.team.team_name);
  await healthy(page);
});

test("Sakrij broj prijava on the organizer's own tournament: he sees its teams, a player doesn't", async ({as, api, db, admin, tournaments, world, healthy}) => {
  const teams = await pickTeams(db, 4, {phones: 1});
  const [outsider, ...entered] = teams;
  const t = await tournaments.make({name: "Organizatorov tajni kup", date: day(9), hide_entries: true, max_teams: 12}, await api("organizer"));
  expect((await db.tournament.findUniqueOrThrow({where: {tournament_id: t.id}})).created_by).toBe(world.accounts.organizer.id);
  await addTeams(admin, t.id, entered);

  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}`);
  await expect(page.getByRole("region", {name: "Prijavljene ekipe"}).getByRole("heading")).toHaveText("Prijavljene ekipe · 3");
  await page.goto(`/turniri/${t.id}/upravljanje`);
  await expect(page.getByRole("switch", {name: /^Prijave otvorene/})).toHaveAccessibleName("Prijave otvorene 3 od 12 ekipa");
  await expect(page.getByRole("list", {name: "Prijavljene ekipe"}).getByRole("listitem")).toHaveText(entered.map((e) => new RegExp(`^${escape(e.name)}`)));
  await healthy(page);

  const player = await as(outsider.phone!);
  await player.goto(`/turniri/${t.id}`);
  await expect(player.getByRole("region", {name: "Prijave otvorene"})).toContainText("Broj mjesta je ograničen");
  await expect(player.getByRole("region", {name: "Prijavljene ekipe"})).toHaveCount(0);
  const answer = (await (await api(outsider.phone!)).get(`/api/tournaments/${t.id}`).then((r) => r.json())) as {teams: number; entries: unknown[]};
  expect([answer.teams, answer.entries]).toEqual([0, []]);
  await healthy(player);
});
