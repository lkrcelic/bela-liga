// C1 · #41 on the computer: Upravljanje ligom · Ekipe marks a league team left with one active player (a teammate
// deactivated), and a full team's row has no mark. League "E2E · Novo kolo"; the deactivated player is put back after.
import {expect, pickTeams, test} from "../../helpers/c1";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("Ekipe on the computer marks a team with one active player", async ({as, db, night, healthy}) => {
  const leagueId = night.league.id;
  const {home, away} = await pickTeams(db, leagueId);
  const gone = away.players[1];
  await db.player.update({where: {id: gone.id}, data: {active: false}});
  try {
    const page = await as("admin");
    await page.goto(`/league/${leagueId}/manage?view=teams`);
    const row = (name: string) => page.getByRole("listitem").filter({hasText: new RegExp(`^${escape(name)}`)});
    await expect(row(away.name)).toContainText("Ekipa ima samo 1 aktivnog igrača");
    await expect(row(home.name)).toBeVisible();
    await expect(row(home.name)).not.toContainText("aktivnog igrača");
    await healthy(page);
  } finally {
    await db.player.update({where: {id: gone.id}, data: {active: true}});
  }
});
