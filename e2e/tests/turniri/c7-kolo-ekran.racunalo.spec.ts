// C7 · Kolo preko cijelog ekrana on the computer, for the screen at the club: the view stays open when the page gets
// narrower than the computer's 1024 px, as a TV browser's full screen does (Android TV gives the page 960 × 540), and
// when the page is loaded again; Zatvori cijeli ekran closes it for good.
import {expect, test} from "../../helpers/c7";
import {DESKTOP} from "../../helpers/devices";

// a 1080p TV as an Android TV browser gives it to the page (devicePixelRatio 2)
const TV = {width: 960, height: 540};

test("Kolo preko cijelog ekrana stays open when the page narrows to a TV's 960 px, as a TV browser's full screen does, and after a reload", async ({as, own, healthy}) => {
  const t = await own({teams: 4, kolo1: true});
  const page = await as("organizer");
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  await page.getByRole("button", {name: "Preko cijelog ekrana"}).click();
  const screen = page.getByRole("dialog", {name: /^Kolo 1 od \d+$/});
  const tables = screen.getByRole("list", {name: "Kolo 1: 2 stola"});
  const standings = screen.getByRole("region", {name: "Poredak"});
  await expect(tables).toBeVisible();
  await expect(standings).toBeVisible();

  // the TV browser's full screen: the page is 960 px wide, under the computer's 1024
  await page.setViewportSize(TV);
  // matchMedia reports the new width before the next frame's callbacks, so the page has rendered for 960 px by then
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  await expect(tables).toBeVisible();
  await expect(standings).toBeVisible();

  // a TV browser that loads the page again gets the view back, at 960 px too
  await page.reload();
  await expect(tables).toBeVisible();
  await expect(standings).toBeVisible();

  // closed, it stays closed: back on the computer's Kola, and a reload doesn't open it again
  await screen.getByRole("button", {name: "Zatvori cijeli ekran"}).click();
  await expect(screen).toBeHidden();
  await page.setViewportSize(DESKTOP.viewport);
  await page.reload();
  await expect(page.getByRole("button", {name: "Preko cijelog ekrana"})).toBeVisible();
  await expect(screen).toHaveCount(0);
  await healthy(page);
});
