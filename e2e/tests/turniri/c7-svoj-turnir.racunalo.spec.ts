// C7 · on the computer, the organizer's own tournament (tournaments.organizer) has no Otkaži, Vrati or Obriši turnir,
// which stay the admin's (DECISIONS #99): Podaci's Turnir card, and a cancelled tournament's Upravljanje, Prijave and
// its card in the Turniri list (Završeni). The admin on the same screens is the control: their buttons are there.
import {expect, test} from "../../helpers/c7";
import type {Page} from "@playwright/test";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const HINT = "Otkazan greškom ili odgođen? Vrati ga: ide među nadolazeće s istim ekipama, a prijave se ponovo otvaraju.";

// Turniri · Završeni with the tournament picked: its card beside the list
async function pickFinished(page: Page, name: string) {
  await page.goto("/turniri/upravljanje");
  await page.getByRole("tab", {name: /^Završeni/}).click();
  await page.getByRole("region", {name: "Popis turnira"}).getByRole("button", {name: new RegExp(`^${escape(name)}`)}).click();
}

test("Podaci on the computer gives the organizer neither Otkaži nor Obriši turnir, and the admin both", async ({as, world}) => {
  const id = world.tournaments.organizer.id;
  const organizer = await as("organizer");
  await organizer.goto(`/turniri/${id}/upravljanje?view=podaci`);
  await expect(organizer.getByRole("button", {name: "Kopiraj turnir"})).toBeVisible();
  await expect(organizer.getByRole("button", {name: "Otkaži turnir"})).toHaveCount(0);
  await expect(organizer.getByRole("button", {name: "Obriši turnir"})).toHaveCount(0);

  const admin = await as("admin");
  await admin.goto(`/turniri/${id}/upravljanje?view=podaci`);
  await expect(admin.getByRole("button", {name: "Otkaži turnir"})).toBeVisible();
  await expect(admin.getByRole("button", {name: "Obriši turnir"})).toBeVisible();
});

test("a tournament the admin cancelled shows the organizer on the computer no Vrati turnir, and the admin one", async ({as, admin: api, db, world, healthy}) => {
  const {id, name} = world.tournaments.organizer;
  const cancelled = await api.post(`/api/admin/tournaments/${id}/cancel`);
  expect(cancelled.ok(), `Otkaži turnir: ${await cancelled.text()}`).toBeTruthy();
  try {
    const organizer = await as("organizer");
    await organizer.goto(`/turniri/${id}/upravljanje`);
    await expect(organizer.getByText("Turnir je otkazan", {exact: true})).toBeVisible();
    await expect(organizer.getByRole("button", {name: "Vrati turnir"})).toHaveCount(0);
    await organizer.goto(`/turniri/${id}/upravljanje?view=prijave`);
    await expect(organizer.getByText("Turnir je otkazan: prijave se ne mijenjaju.", {exact: true})).toBeVisible();
    // the Turniri list: the picked card says who cancelled it, without Vrati turnir or the hint to use it
    await pickFinished(organizer, name);
    // the list's row and the picked card both say it
    await expect(organizer.getByText(/^Otkazao Ana Adminić, /)).toHaveCount(2);
    await expect(organizer.getByText(HINT)).toHaveCount(0);
    await expect(organizer.getByRole("button", {name: "Vrati turnir"})).toHaveCount(0);
    await healthy(organizer);

    const admin = await as("admin");
    await admin.goto(`/turniri/${id}/upravljanje`);
    await expect(admin.getByRole("button", {name: "Vrati turnir"})).toBeVisible();
    await pickFinished(admin, name);
    await expect(admin.getByText(HINT)).toBeVisible();
    await expect(admin.getByRole("button", {name: "Vrati turnir"})).toBeVisible();
  } finally {
    if ((await db.tournament.findUniqueOrThrow({where: {tournament_id: id}})).cancelled_at) {
      const back = await api.delete(`/api/admin/tournaments/${id}/cancel`);
      expect(back.ok(), `put back: Vrati turnir: ${await back.text()}`).toBeTruthy();
    }
  }
});
