// C3 · the admin's repairs of a live tournament's day on the phone (DECISIONS #97): Vrati stol brings a no-show table
// back into play as if "Da, tu su" had been answered (its 1001 : 700 gone, the team it put out back in, the Kolo-1 ban
// lifted), and Uredi ishod gives a skipped table to one team (1001 : 700, that team back in and its ban lifted, the other
// still out and banned). As tournaments.live has them (a no-show and a skipped table in a Kolo being played), on a
// tournament of the test's own: six teams, Kolo 1 out, one table answered Ne, nisu došli at 6 minutes, one skipped at 10
// and one that said Da, tu su.
import type {APIRequestContext} from "@playwright/test";
import {clock, expect, koloOutFor, makeReady, openAndAsk, pickTeams, publishNextKolo, runClock, test, type Admin, type Entry} from "../../helpers/c3";
import type {Db} from "../../helpers/db";

const byId = (teams: Entry[], id: number) => teams.find((t) => t.id === id)!;

async function liveKolo1(make: Parameters<typeof makeReady>[0], admin: Admin, db: Db, api: (who: string) => Promise<APIRequestContext>) {
  const teams = await pickTeams(db, 6, {phones: 6});
  const t = await makeReady(make, admin, teams, {name: "Subotnji turnir uživo"});
  const {tables} = await publishNextKolo(admin, db, t.id);
  const [noShow, skipped, present] = tables;
  const answer = async (table: (typeof tables)[number], a: "PRESENT" | "NO_SHOW") => {
    const res = await (await api(byId(teams, table.team1_id).players[0].username)).post(`/api/rounds/${table.id}/attendance`, {data: {answer: a}});
    expect(await res.json()).toEqual({outcome: a});
  };
  await koloOutFor(db, t.id, 1, 4);
  await answer(present, "PRESENT");
  await koloOutFor(db, t.id, 1, 6);
  await answer(noShow, "NO_SHOW");
  await koloOutFor(db, t.id, 1, 10);
  await runClock(admin, t.id);
  expect((await db.round.findUniqueOrThrow({where: {id: skipped.id}})).attendance).toBe("SKIPPED");
  return {t, teams, noShow, skipped};
}

const bansOf = (db: Db, tournamentId: number, teamId: number) => db.signupBan.findMany({where: {tournament_id: tournamentId, team_id: teamId}, include: {playerBans: true}});

test("Vrati stol brings a no-show table back into play: the 1001 : 700 is gone, the team is back and its ban lifted", async ({as, api, db, admin, tournaments, world, healthy}) => {
  const {t, teams, noShow, skipped} = await liveKolo1(tournaments.make, admin, db, api);
  const [here, absent] = [byId(teams, noShow.team1_id), byId(teams, noShow.team2_id)];
  const answeredAt = (await db.round.findUniqueOrThrow({where: {id: noShow.id}})).attendance_at!;

  const page = await as("admin");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  await expect(page.getByRole("heading", {name: "Kolo 1", level: 1})).toBeVisible();
  const states = page.getByRole("region", {name: "Statusi stolova"});
  await expect(states.getByRole("link")).toHaveText([
    `Stol ${noShow.table_number}Nedolazak${here.name} · ${absent.name}${here.name} prijavili u ${clock(answeredAt)} · 1001 : 700 po partiji · ${absent.name} isključeni`,
    `Stol ${skipped.table_number}Preskočen${skipped.team1.team_name} · ${skipped.team2.team_name}Meč se ne boduje, obje ekipe su isključene.`,
  ]);

  await states.getByRole("button", {name: `Vrati Stol ${noShow.table_number} u igru`}).click();
  const ask = page.getByRole("dialog", {name: `Vratiti Stol ${noShow.table_number} u igru?`});
  await expect(ask).toContainText(`${here.name} i ${absent.name} igraju ovaj stol kao da su potvrdili da su tu. Upisani rezultat nedolaska se briše.`);
  await expect(ask).toContainText("Ekipe koje je ovaj stol isključio vraćaju se u turnir, a zabrana prijava im se ukida.");
  await ask.getByRole("button", {name: "Vrati stol"}).click();
  await expect(ask).toBeHidden();
  // only the skipped table is left among the statuses
  await expect(states.getByRole("link")).toHaveText([new RegExp(`^Stol ${skipped.table_number}Preskočen`)]);
  await healthy(page);

  // the table is open, nobody's result, said "Tu su" by the admin; the absent team back, its ban (and its players') lifted
  const table = await db.round.findUniqueOrThrow({where: {id: noShow.id}, include: {matches: true}});
  expect([table.open, table.attendance, table.attendance_by, table.team1_wins, table.team2_wins, table.matches.length]).toEqual([
    true,
    "PRESENT",
    world.accounts.admin.id,
    0,
    0,
    0,
  ]);
  const back = await db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: absent.id}}});
  expect([back.excluded_at, back.excluded_reason, back.active, back.status]).toEqual([null, null, true, "REGISTERED"]);
  const [ban] = await bansOf(db, t.id, absent.id);
  expect([ban.lifted_at != null, ban.lifted_by]).toEqual([true, world.accounts.admin.id]);
  expect(ban.playerBans.length).toBeGreaterThan(0);
  expect(ban.playerBans.every((b) => b.lifted_at != null)).toBe(true);

  // both teams have their table to play again, and nobody is asked any more
  for (const [team, other] of [
    [here, absent],
    [absent, here],
  ]) {
    const phone = await as(team.phone!);
    // the table says Tu su, so the question (which nothing else would stop at 10 minutes) is gone for good
    expect((await openAndAsk(phone, `/turniri/${t.id}`)).prompt).toBeNull();
    await expect(phone.getByRole("button", {name: `STOL ${noShow.table_number} ${team.name} ${other.name} Započni igru`})).toBeVisible();
    await healthy(phone);
  }
});

test("Uredi ishod gives a skipped table to one team: 1001 : 700, that team back in without a ban, the other still out and banned", async ({
  as,
  api,
  db,
  admin,
  tournaments,
  world,
  healthy,
}) => {
  const {t, teams, skipped} = await liveKolo1(tournaments.make, admin, db, api);
  const [winner, loser] = [byId(teams, skipped.team1_id), byId(teams, skipped.team2_id)];

  const page = await as("admin");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  const states = page.getByRole("region", {name: "Statusi stolova"});
  await states.getByRole("button", {name: `Uredi ishod Stola ${skipped.table_number}`}).click();
  const sheet = page.getByRole("dialog", {name: `Ishod Stola ${skipped.table_number}`});
  const choices = sheet.getByRole("radiogroup", {name: "Ishod stola"}).getByRole("radio");
  await expect(choices).toHaveText([`Pobjeda: ${winner.name}`, `Pobjeda: ${loser.name}`, /^Nitko · preskočen\s*sada$/]);
  await expect(sheet.getByRole("radio", {name: "Nitko · preskočen"})).toBeChecked();
  await sheet.getByRole("radio", {name: `Pobjeda: ${winner.name}`}).click();
  await expect(sheet.getByRole("radio", {name: `Pobjeda: ${winner.name}`})).toBeChecked();
  await expect(sheet).toContainText(
    `${winner.name} dobivaju svaku partiju stola 1001 : 700 i ostaju u turniru bez zabrane prijava. ${loser.name} su isključeni i dobivaju zabranu prijava.`,
  );
  await sheet.getByRole("button", {name: "Spremi ishod"}).click();
  await expect(sheet).toBeHidden();
  await expect(states.getByRole("link", {name: new RegExp(`^Stol ${skipped.table_number} `)})).toHaveAccessibleName(
    `Stol ${skipped.table_number} Dodijeljena pobjeda ${winner.name} · ${loser.name} Odluka admina: pobjeđuju ${winner.name} · 1001 : 700 po partiji · ${loser.name} isključeni`,
  );
  await healthy(page);

  // the table: won by the winner 1001 : 700, closed, the admin's result
  const table = await db.round.findUniqueOrThrow({where: {id: skipped.id}, include: {matches: true}});
  expect([table.attendance, table.attendance_team_id, table.attendance_by, table.open, table.team1_wins, table.team2_wins]).toEqual([
    "NO_SHOW",
    winner.id,
    world.accounts.admin.id,
    false,
    1,
    0,
  ]);
  expect(table.matches.map((m) => [m.player_pair1_score, m.player_pair2_score])).toEqual([[1001, 700]]);
  const entry = async (team: Entry) => db.tournamentTeam.findUniqueOrThrow({where: {tournament_id_team_id: {tournament_id: t.id, team_id: team.id}}});
  expect((await entry(winner)).excluded_at).toBeNull();
  expect([(await entry(loser)).excluded_reason, (await entry(loser)).excluded_kolo]).toEqual(["NO_SHOW", 1]);
  // the winner's Kolo-1 ban is lifted with its players'; the loser's stays in force
  const [winnerBan] = await bansOf(db, t.id, winner.id);
  expect([winnerBan.lifted_at != null, winnerBan.playerBans.every((b) => b.lifted_at != null)]).toEqual([true, true]);
  const loserBans = await bansOf(db, t.id, loser.id);
  expect(loserBans.map((b) => [b.lifted_at, b.playerBans.every((p) => p.lifted_at == null)])).toEqual([[null, true]]);

  // the winners' page: the table won without play; the losers': out of the tournament
  const won = await as(winner.phone!);
  await won.goto(`/turniri/${t.id}`);
  await expect(won.getByRole("region", {name: "Pobjeda bez igre"})).toContainText(`${loser.name} nisu došli. Dobivate 1001 : 700.`);
  await healthy(won);
  const lost = await as(loser.phone!);
  await lost.goto(`/turniri/${t.id}`);
  await expect(lost.getByRole("region", {name: "Isključeni ste iz turnira"})).toBeVisible();
  await healthy(lost);
});
