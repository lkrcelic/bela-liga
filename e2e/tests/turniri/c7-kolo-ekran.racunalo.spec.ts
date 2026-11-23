// C7 · Kolo preko cijelog ekrana on the computer, for the screen at the club: the view stays open when the page gets
// narrower than the computer's 1024 px, as a TV browser's full screen does (Android TV gives the page 960 × 540), and
// when the page is loaded again; Zatvori cijeli ekran closes it for good. It follows the tournament: once the next Kolo
// is out it shows that one, as Dnevni poredak follows the league's round being played. The Kola tab itself moves to a
// Kolo the moment it is published, from whatever Kolo it was on; a draft doesn't move it. In full screen the arrows go
// through the Kolos out, until the next Kolo published takes the screen again.
import type {APIRequestContext} from "@playwright/test";
import {expect, koloTables, test} from "../../helpers/c7";
import {DESKTOP} from "../../helpers/devices";
import type {Db} from "../../helpers/db";
import {addHands, startMatch} from "../../helpers/scorepad";

// a table played to the end through the scorepad's routes: seven hands of 152 : 10 for team1, 1064 : 70, Završi meč
async function playTable(api: APIRequestContext, roundId: number) {
  const matchId = await startMatch(api, roundId);
  await addHands(api, matchId, Array.from({length: 7}, () => ({caller: 1 as const, game1: 152})));
  const ended = await api.post("/api/matches", {data: matchId});
  expect(ended.ok(), `Završi meč: ${await ended.text()}`).toBeTruthy();
}

// Kolo n played to the end and Kolo n + 1 made (the draft the last table made, kept by Složi kolo), from elsewhere
async function playAndDraft(api: APIRequestContext, db: Db, id: number, n: number) {
  for (const table of await koloTables(db, id, n)) await playTable(api, table.id);
  const made = await api.post(`/api/admin/tournaments/${id}/kola`, {data: {}});
  expect(made.ok(), `Složi Kolo ${n + 1}: ${await made.text()}`).toBeTruthy();
}

// Objavi kolo, from elsewhere (the phone)
async function publish(api: APIRequestContext, id: number, n: number) {
  const published = await api.post(`/api/admin/tournaments/${id}/kola/${n}/publish`);
  expect(published.ok(), `Objavi Kolo ${n}: ${await published.text()}`).toBeTruthy();
}

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

test("Kolo preko cijelog ekrana moves on to Kolo 2 by itself once it is out, and closed leaves the Kola tab on it", async ({as, own, organizer, db, healthy}) => {
  const t = await own({teams: 4, rounds: 2, kolo1: true});
  const page = await as("organizer");
  // nobody touches the screen: the page reads the tournament again every 15 s while it is played, on a clock the test
  // moves
  await page.clock.install();
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  await page.getByRole("button", {name: "Preko cijelog ekrana"}).click();
  const kolo1 = page.getByRole("dialog", {name: "Kolo 1 od 2"});
  await expect(kolo1.getByRole("list", {name: "Kolo 1: 2 stola"})).toBeVisible();

  // Kolo 1 played to the end and Kolo 2 made (the draft the last table made, kept by Složi kolo), from elsewhere:
  // between the Kolos the screen keeps Kolo 1 with its results, the draft isn't shown
  for (const table of await koloTables(db, t.id, 1)) await playTable(organizer, table.id);
  const made = await organizer.post(`/api/admin/tournaments/${t.id}/kola`, {data: {}});
  expect(made.ok(), `Složi Kolo 2: ${await made.text()}`).toBeTruthy();
  await page.clock.fastForward(15_000);
  await expect(kolo1).toContainText("Gotovo 2 od 2");

  // Objavi kolo: on the next refresh the screen is on Kolo 2
  const published = await organizer.post(`/api/admin/tournaments/${t.id}/kola/2/publish`);
  expect(published.ok(), `Objavi Kolo 2: ${await published.text()}`).toBeTruthy();
  await page.clock.fastForward(15_000);
  const screen = page.getByRole("dialog", {name: "Kolo 2 od 2"});
  await expect(screen.getByRole("list", {name: "Kolo 2: 2 stola"})).toBeVisible();
  await expect(screen).toContainText("Gotovo 0 od 2");

  await screen.getByRole("button", {name: "Zatvori cijeli ekran"}).click();
  await expect(screen).toBeHidden();
  await expect(page.getByRole("list", {name: "Kolo 2: 2 stola"})).toBeVisible();
  await healthy(page);
});

test("a Kolo published takes the Kola tab picked on another Kolo to it, also from Poredak, and its draft doesn't", async ({as, own, organizer, db, healthy}) => {
  const t = await own({teams: 4, rounds: 3, kolo1: true});
  const page = await as("organizer");
  // the page reads the tournament again every 15 s while it is played, on a clock the test moves
  await page.clock.install();
  // the tab picked on Kolo 1 by the address, as after a click on Kolo 1 or back from a table
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola&kolo=1`);
  const kolos = page.getByRole("tablist", {name: "Kola turnira"});
  await expect(kolos.getByRole("tab", {name: /^Kolo 1, /, selected: true})).toBeVisible();

  // Kolo 2's draft leaves the tab on Kolo 1
  await playAndDraft(organizer, db, t.id, 1);
  await page.clock.fastForward(15_000);
  await expect(kolos.getByRole("tab", {name: "Kolo 2, skica", selected: false})).toBeVisible();
  await expect(kolos.getByRole("tab", {name: "Kolo 1, odigrano", selected: true})).toBeVisible();

  // Objavi kolo, from the phone: on the next refresh the tab is on Kolo 2 and shows its tables
  await publish(organizer, t.id, 2);
  await page.clock.fastForward(15_000);
  await expect(kolos.getByRole("tab", {name: /^Kolo 2, /, selected: true})).toBeVisible();
  await expect(page.getByRole("list", {name: "Kolo 2: 2 stola"})).toBeVisible();

  // Kolo 3 is published while the admin is on Poredak: the page stays on Poredak, and Kola waits on Kolo 3
  await playAndDraft(organizer, db, t.id, 2);
  const views = page.getByRole("tablist", {name: "Upravljanje turnirom"});
  await views.getByRole("tab", {name: "Poredak"}).click();
  await publish(organizer, t.id, 3);
  await page.clock.fastForward(15_000);
  await expect(page.getByText("Nakon 2 od 3 kola · Kolo 3 uživo", {exact: true})).toBeVisible();
  // the refresh is on the screen: React has run its effects by the next frame, a move to Kola would be there
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  await expect(views.getByRole("tab", {name: "Poredak", selected: true})).toBeVisible();
  await views.getByRole("tab", {name: /^Kola/}).click();
  await expect(kolos.getByRole("tab", {name: /^Kolo 3, /, selected: true})).toBeVisible();
  await expect(page.getByRole("list", {name: "Kolo 3: 2 stola"})).toBeVisible();
  await healthy(page);
});

test("the arrows of Kolo preko cijelog ekrana go through the Kolos out, and the next Kolo published still takes the screen", async ({as, own, organizer, db, healthy}) => {
  const t = await own({teams: 4, rounds: 3, kolo1: true});
  // Kolo 1 played and Kolo 2 out before the screen is on
  await playAndDraft(organizer, db, t.id, 1);
  await publish(organizer, t.id, 2);
  const page = await as("organizer");
  await page.clock.install();
  await page.goto(`/turniri/${t.id}/upravljanje?view=kola`);
  await page.getByRole("button", {name: "Preko cijelog ekrana"}).click();
  const screen = page.getByRole("dialog", {name: /^Kolo \d od 3$/});
  const back = screen.getByRole("button", {name: "Prethodno kolo"});
  const on = screen.getByRole("button", {name: "Sljedeće kolo"});
  await expect(page.getByRole("dialog", {name: "Kolo 2 od 3"})).toBeVisible();
  // Kolo 2 is the last out: Kolo 3 isn't made yet, so there is no arrow on
  await expect(on).toBeDisabled();

  await back.click();
  await expect(page.getByRole("dialog", {name: "Kolo 1 od 3"}).getByRole("list", {name: "Kolo 1: 2 stola"})).toBeVisible();
  await expect(screen).toContainText("Gotovo 2 od 2");
  await expect(back).toBeDisabled();
  await on.click();
  await expect(page.getByRole("dialog", {name: "Kolo 2 od 3"}).getByRole("list", {name: "Kolo 2: 2 stola"})).toBeVisible();
  await expect(on).toBeDisabled();

  // left on Kolo 1, the screen goes to Kolo 3 once it is out, on the next refresh
  await back.click();
  await expect(page.getByRole("dialog", {name: "Kolo 1 od 3"})).toBeVisible();
  await playAndDraft(organizer, db, t.id, 2);
  await publish(organizer, t.id, 3);
  await page.clock.fastForward(15_000);
  await expect(page.getByRole("dialog", {name: "Kolo 3 od 3"}).getByRole("list", {name: "Kolo 3: 2 stola"})).toBeVisible();
  await expect(on).toBeDisabled();

  // closed on Kolo 2 by the arrow, the Kola tab is on Kolo 2
  await back.click();
  await expect(page.getByRole("dialog", {name: "Kolo 2 od 3"})).toBeVisible();
  await screen.getByRole("button", {name: "Zatvori cijeli ekran"}).click();
  await expect(screen).toBeHidden();
  await expect(page.getByRole("list", {name: "Kolo 2: 2 stola"})).toBeVisible();
  await healthy(page);
});
