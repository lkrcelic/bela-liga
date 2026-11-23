// #88 · Upiši igru's steps of a table opened by their address: the steps ask the server nothing until Spremi, so the
// wizard asks first whether the player plays at that table and shows nothing of the steps until the answer comes. The
// test holds that answer back to see the steps aren't there in the meantime; then the organizer, who doesn't play at
// the player's table tonight, is told "Ne igraš u ovoj rundi." and still sees no step.
import {idsOf} from "../../helpers/a";
import {expect, test} from "../../helpers/fixtures";

test("a player who doesn't play at a table never sees Upiši igru's steps opened by their address, not even while the app asks", async ({as, app, db, healthy}) => {
  const ids = await idsOf(app, db);
  const page = await as("organizer");
  let release!: () => void;
  const answered = new Promise<void>((done) => (release = done));
  await page.route(`**/api/ongoing-matches/${ids.table.matchId}`, async (route) => {
    await answered;
    await route.continue();
  });
  const step = page.getByRole("heading", {name: "Izaberi tko je zvao"});

  await page.goto(`/ongoing-match/${ids.table.matchId}/ongoing-result/new/trump-caller`);
  await expect(page.getByRole("status", {name: "Učitavanje"})).toBeVisible();
  await expect(step).toHaveCount(0);

  release();
  await expect(page.getByText("Ne igraš u ovoj rundi.")).toBeVisible();
  await expect(page.getByRole("status", {name: "Učitavanje"})).toHaveCount(0);
  await expect(step).toHaveCount(0);
  await expect(page.getByRole("button", {name: "Pokušaj ponovno"})).toHaveCount(0);
  await healthy(page);
});
