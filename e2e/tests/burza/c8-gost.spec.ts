// C8 · Burza igrača for a guest (nobody logged in). The list and each ad are public (DECISIONS #29, #75), the numbers
// aren't (#11, DECISIONS #90, 3eb80df): GET /api/burza and an ad's page give a guest no phone number, and the ad's page
// offers "Prijavi se da vidiš broj", which opens "Sjedni za stol." and comes back to the ad, number and all, after
// logging in. Publishing needs a login: a form opened by a guest goes to Prijava and back (?next=).
import {expect, test} from "../../helpers/fixtures";
import {PASSWORD} from "../../helpers/fixtures";

type Post = {id: number; phone: string | null; phone_hidden: boolean};

test("a guest reads every open ad of the public Burza, has no Moji oglasi, and is sent to Prijava to publish", async ({as, world, healthy}) => {
  const open = Object.values(world.ads)
    .filter((a) => a.open)
    .map((a) => `/burza/${a.id}`)
    .sort();
  const page = await as("guest");
  await page.goto("/burza");
  const list = page.getByRole("tabpanel", {name: "Sve"}).getByRole("link");
  await expect(list).toHaveCount(open.length);
  expect((await list.evaluateAll((links) => links.map((l) => l.getAttribute("href")))).sort()).toEqual(open);
  await expect(page.getByRole("link", {name: /^Moji oglasi/})).toHaveCount(0);
  await healthy(page);

  await page.getByRole("button", {name: "Objavi", exact: true}).click();
  await page.getByRole("dialog", {name: "Što objavljuješ?"}).getByRole("button", {name: /^Dostupan sam/}).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fburza%2Fnovi%2Fdostupan$/);
  await expect(page.getByRole("heading", {name: "Prijava"})).toBeVisible();
});

// #79: Objavi opens the form by a client-side navigation, which the middleware answers with a redirect to Prijava, and
// the router keeps that answer for 30 s. Logging in within them used to replay it: Prijava again, Prijavi se spinning.
test("a guest sent to Prijava from Objavi comes back to the form once logged in (#79)", async ({as, world, healthy}) => {
  const page = await as("guest");
  await page.goto("/burza");
  await page.getByRole("button", {name: "Objavi", exact: true}).click();
  await page.getByRole("dialog", {name: "Što objavljuješ?"}).getByRole("button", {name: /^Dostupan sam/}).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fburza%2Fnovi%2Fdostupan$/);
  // the phone login page always offers to install the app first
  await page.getByRole("button", {name: "Nastavi u pregledniku"}).click();
  await page.getByLabel("Korisničko ime ili Email").fill(world.accounts.player.username);
  await page.getByLabel("Lozinka", {exact: true}).fill(PASSWORD);
  await page.getByRole("button", {name: "Prijavi se", exact: true}).click();

  await expect(page).toHaveURL(/\/burza\/novi\/dostupan$/);
  await expect(page.getByRole("heading", {name: "Dostupan sam", level: 1})).toBeVisible();
  await expect(page.getByRole("button", {name: "Zamjena", exact: true})).toBeVisible();
  await healthy(page);
});

test("a guest gets no phone number, and logging in from an ad brings its number back to the ad (#11)", async ({as, api, db, world, healthy}) => {
  // the seeded availability ad with a number of its own
  const ad = world.ads.availablePartner;
  const row = await db.marketPost.findUniqueOrThrow({where: {id: ad.id}, include: {player: true}});
  const number = row.phone!;
  expect(number).toMatch(/^\+385 /);

  // the API: every open ad, none with its number, each saying a login shows it
  const guest = await api("guest");
  const res = await guest.get("/api/burza");
  expect(res.status()).toBe(200);
  const {posts} = (await res.json()) as {posts: Post[]};
  expect(posts.map((p) => p.id).sort((a, b) => a - b)).toEqual(
    Object.values(world.ads)
      .filter((a) => a.open)
      .map((a) => a.id)
      .sort((a, b) => a - b)
  );
  expect(posts.filter((p) => p.phone != null)).toEqual([]);
  expect(posts.every((p) => p.phone_hidden)).toBe(true);
  const one = (await (await guest.get(`/api/burza/${ad.id}`)).json()) as Post;
  expect([one.phone, one.phone_hidden]).toEqual([null, true]);

  // the ad's page: everything but the number
  const page = await as("guest");
  await page.goto(`/burza/${ad.id}`);
  await expect(page.getByRole("region", {name: "Oglas"}).getByRole("heading", {name: `${row.player.first_name} ${row.player.last_name}`})).toBeVisible();
  await expect(page.getByText("Broj vide igrači s računom.", {exact: true})).toBeVisible();
  await expect(page.getByText(number)).toHaveCount(0);
  await expect(page.getByRole("link", {name: "Nazovi"})).toHaveCount(0);
  await healthy(page);

  await page.getByRole("button", {name: "Prijavi se da vidiš broj"}).click();
  const sheet = page.getByRole("dialog", {name: "Sjedni za stol."});
  await sheet.getByRole("link", {name: "Prijavi se"}).click();
  await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fburza%2F${ad.id}$`));
  // the phone login page always offers to install the app first
  await page.getByRole("button", {name: "Nastavi u pregledniku"}).click();
  await page.getByLabel("Korisničko ime ili Email").fill(world.accounts.player.username);
  await page.getByLabel("Lozinka", {exact: true}).fill(PASSWORD);
  await page.getByRole("button", {name: "Prijavi se", exact: true}).click();

  await expect(page).toHaveURL(new RegExp(`/burza/${ad.id}$`));
  await expect(page.getByText(number, {exact: true})).toBeVisible();
  await expect(page.getByRole("link", {name: "Nazovi"})).toHaveAttribute("href", `tel:+${number.replace(/\D/g, "")}`);
  await expect(page.getByText("Broj vide igrači s računom.", {exact: true})).toHaveCount(0);
  await healthy(page);
});
