// #67 · Igrači and Ekipe on the admin's phone: a new search, a cleared search and a new order (A–Ž / Najnoviji) show
// their results from the top of the list, not from where the old list was scrolled to, while Back from a player's page
// still puts the list where it was left (useScrollMemory).
import type {Locator, Page} from "@playwright/test";
import {expect, test} from "../../helpers/fixtures";

// the element that scrolls the list: the list's nearest ancestor with overflow-y auto
function scrollTop(list: Locator): Promise<number> {
  return list.evaluate((el) => {
    let box: HTMLElement | null = el.parentElement;
    while (box && getComputedStyle(box).overflowY !== "auto") box = box.parentElement;
    return box ? box.scrollTop : -1;
  });
}

// loads a second page and scrolls the list to its end, as an admin looking further down does
async function scrollDown(page: Page, list: Locator) {
  const more = page.getByRole("button", {name: /^Učitaj još/});
  if (await more.isVisible()) await more.click();
  await list.getByRole("listitem").last().scrollIntoViewIfNeeded();
  await expect.poll(() => scrollTop(list)).toBeGreaterThan(100);
}

async function expectFromTop(list: Locator) {
  await expect.poll(() => scrollTop(list)).toBe(0);
  await expect(list.getByRole("listitem").first()).toBeInViewport();
}

test("Igrači: a new search, a cleared search and a new order start from the top of the list (#67)", async ({as, healthy}) => {
  const page = await as("admin");
  await page.goto("/players");
  const list = page.getByRole("list", {name: "Igrači"});
  await expect(list.getByRole("listitem").first()).toBeVisible();
  const search = page.getByLabel("Traži igrača");

  await scrollDown(page, list);
  await search.fill("a");
  await expect(search).toHaveValue("a");
  await expectFromTop(list);

  await scrollDown(page, list);
  await page.getByRole("radio", {name: "Najnoviji"}).click();
  await expect(page.getByRole("radio", {name: "Najnoviji"})).toBeChecked();
  await expectFromTop(list);

  // Očisti, the cross in the field
  await scrollDown(page, list);
  await page.getByRole("button", {name: "Očisti"}).click();
  await expect(search).toHaveValue("");
  await expectFromTop(list);
  await healthy(page);
});

test("Ekipe: a new search starts from the top of the list (#67)", async ({as, healthy}) => {
  const page = await as("admin");
  await page.goto("/teams");
  const list = page.getByRole("list", {name: "Ekipe"});
  await expect(list.getByRole("listitem").first()).toBeVisible();

  await scrollDown(page, list);
  await page.getByLabel("Traži ekipu ili igrača").fill("a");
  await expectFromTop(list);
  await healthy(page);
});

test("Igrači: Back from a player's page puts the list where it was left", async ({as, healthy}) => {
  const page = await as("admin");
  await page.goto("/players");
  const list = page.getByRole("list", {name: "Igrači"});
  await expect(list.getByRole("listitem").first()).toBeVisible();
  await scrollDown(page, list);
  const left = await scrollTop(list);

  await list.getByRole("link").last().click();
  await expect(page).toHaveURL(/\/players\/\d+$/);
  await page.goBack();
  await expect(list.getByRole("listitem").first()).toBeAttached();
  await expect.poll(() => scrollTop(list)).toBe(left);
  await healthy(page);
});
