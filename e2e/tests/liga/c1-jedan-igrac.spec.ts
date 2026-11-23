// C1 · #41: a league team left with one active player (a teammate deactivated) is marked before the night, in
// Upravljanje ligom · Ekipe and in Novo kolo's Tko igra večeras?, and when its table is opened Tko igra says so above
// Potvrdi, which still confirms the one player. League "E2E · Novo kolo"; the deactivated player is put back after.
import {expect, pickTeams, test} from "../../helpers/c1";
import {publishTable} from "../../helpers/scorepad";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("a team with one active player is marked in Ekipe and Novo kolo, and Tko igra warns above Potvrdi", async ({as, db, night, healthy}) => {
  const leagueId = night.league.id;
  const {home, away} = await pickTeams(db, leagueId);
  const [stays, gone] = away.players;
  await db.player.update({where: {id: gone.id}, data: {active: false}});
  try {
    const page = await as("admin");

    // Upravljanje ligom · Ekipe: the team says it has one active player, a full team doesn't
    await page.goto(`/league/${leagueId}/manage?view=teams`);
    const list = page.getByRole("list", {name: "Ekipe lige"});
    const row = (name: string) => list.getByRole("listitem").filter({hasText: new RegExp(`^${escape(name)}`)});
    await expect(row(away.name)).toContainText("Ekipa ima samo 1 aktivnog igrača");
    await expect(row(home.name)).toBeVisible();
    await expect(row(home.name)).not.toContainText("aktivnog igrača");

    // Novo kolo · Tko igra večeras?: a red "1 igrač" beside the team, which still plays tonight
    await page.goto(`/league/${leagueId}/manage?view=create`);
    await expect(page.getByRole("heading", {name: "Novo kolo"})).toBeVisible();
    await page.getByRole("region", {name: "Tko igra večeras"}).getByRole("button", {name: "Promijeni"}).click();
    const sheet = page.getByRole("dialog", {name: "Tko igra večeras?"});
    await expect(sheet.getByRole("switch", {name: new RegExp(`^${escape(away.name)}\\s*1 igrač$`)})).toBeChecked();
    await expect(sheet.getByRole("switch", {name: home.name, exact: true})).toBeChecked();
    await sheet.getByRole("button", {name: "Gotovo"}).click();
    await expect(sheet).toBeHidden();

    // Tko igra of its table: the one player, the warning above Potvrdi, and Potvrdi saves him alone
    const table = await publishTable(night.admin, db, leagueId, night.night, [home.id, away.id]);
    await page.goto(`/round/lineup/${table.roundId}?league=${leagueId}`);
    await expect(page.getByRole("heading", {name: "Tko igra ovu rundu?"})).toBeVisible();
    await expect(page.getByRole("status", {name: "Ekipa bez dva igrača"})).toHaveText(
      `${away.name} ima samo jednog igrača s računom: dodaj igrača u ekipu ili potvrdi svejedno.`,
    );
    const confirm = page.getByRole("button", {name: "Potvrdi i počni"});
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page).toHaveURL(new RegExp(`/league/${leagueId}/daily-standings/table/${table.roundId}`));
    const saved = await db.roundPlayer.findMany({where: {round_id: table.roundId, team_id: away.id}});
    expect(saved.map((p) => p.player_id)).toEqual([stays.id]);
    await healthy(page);
  } finally {
    await db.player.update({where: {id: gone.id}, data: {active: true}});
  }
});

test("Tko igra has no warning when both teams have two players", async ({as, db, night, healthy}) => {
  const leagueId = night.league.id;
  const {home, away} = await pickTeams(db, leagueId);
  const table = await publishTable(night.admin, db, leagueId, night.night, [home.id, away.id]);
  const page = await as("admin");
  await page.goto(`/round/lineup/${table.roundId}?league=${leagueId}`);
  await expect(page.getByRole("button", {name: "Potvrdi i počni"})).toBeEnabled();
  await expect(page.getByRole("status", {name: "Ekipa bez dva igrača"})).toHaveCount(0);
  await healthy(page);
});
