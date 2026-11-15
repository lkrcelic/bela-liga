// C6 · Prijava and Odjava on the phone: logging in with the username or the email in any case (phone keyboards
// capitalize the first letter), a wrong password, a deactivated account (DECISIONS #40), the Google button that is
// only looked at, and Odjava, after which the old session is refused and a page that needs a login opens Prijava,
// which brings the player back to it.
// The logins use bez.ekipe (accounts.noTeam): onboarded and in no team, so Početna opens without a sheet or a table.
// Every wrong password is followed by the right one, which clears the account's failed-login counts again.
import {PASSWORD} from "../../helpers/fixtures";
import {
  capitalised,
  DEACTIVATED_NOTE,
  expect,
  logIn,
  note,
  openLogin,
  test,
  uniqueUsername,
  whoIsLoggedIn,
  WRONG_API,
  WRONG_NOTE,
  WRONG_PASSWORD,
} from "../../helpers/c6";

// what the player types, made from the account as stored
for (const {how, field, typed} of [
  {how: "the username", field: "username", typed: (stored: string) => stored},
  {how: "the username with capitals and spaces around it", field: "username", typed: (stored: string) => `  ${capitalised(stored)} `},
  {how: "the email in any case", field: "email", typed: (stored: string) => capitalised(stored)},
] as const) {
  test(`logging in with ${how} opens Početna as that player`, async ({as, db, world, healthy}) => {
    const account = await db.player.findUniqueOrThrow({where: {id: world.accounts.noTeam.id}});
    const login = typed(account[field]);
    expect(login.trim().toLowerCase()).toBe(account[field]);
    const page = await as("guest");
    await openLogin(page);
    const answer = await logIn(page, login, PASSWORD);
    expect(answer.status()).toBe(200);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", {name: "Moj profil"})).toBeVisible();
    expect(await whoIsLoggedIn(page)).toBe(account.username);
    await healthy(page);
  });
}

test("a wrong password or an unknown username is refused with the same words, and the right password then logs in", async ({as, world, loginCounts, healthy}) => {
  const {username} = world.accounts.noTeam;
  const page = await as("guest");
  await openLogin(page);

  const wrong = await logIn(page, username, WRONG_PASSWORD);
  expect(wrong.status()).toBe(404);
  expect(await wrong.json()).toEqual({error: WRONG_API});
  await expect(note(page, WRONG_NOTE)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(await whoIsLoggedIn(page)).toBeNull();

  // a username nobody has reads the same, so Prijava doesn't tell which usernames exist
  // (its failure is counted under the name, and no right password ever clears it)
  const nobody = uniqueUsername();
  loginCounts.forget(`login:${nobody}`);
  const unknown = await logIn(page, nobody, WRONG_PASSWORD);
  expect(unknown.status()).toBe(404);
  expect(await unknown.json()).toEqual({error: WRONG_API});
  await expect(note(page, WRONG_NOTE)).toBeVisible();

  const right = await logIn(page, username, PASSWORD);
  expect(right.status()).toBe(200);
  await expect(page.getByRole("button", {name: "Moj profil"})).toBeVisible();
  expect(await whoIsLoggedIn(page)).toBe(username);
  await healthy(page);
});

test("Prijava and Registracija offer Google first, above the form (the button is only looked at, never pressed)", async ({as, healthy}) => {
  const page = await as("guest");
  await openLogin(page);
  const google = page.getByRole("button", {name: "Prijava s Googleom"});
  await expect(google).toBeEnabled();
  const username = page.getByLabel("Korisničko ime ili Email");
  expect((await google.boundingBox())!.y).toBeLessThan((await username.boundingBox())!.y);
  await healthy(page);

  // Registracija on the phone opens with the two ways, Google first (DECISIONS #76)
  await page.goto("/signup");
  const googleSignup = page.getByRole("button", {name: "Registriraj se s Googleom"});
  await expect(googleSignup).toBeEnabled();
  const withEmail = page.getByRole("button", {name: "Registriraj se emailom"});
  expect((await googleSignup.boundingBox())!.y).toBeLessThan((await withEmail.boundingBox())!.y);
  await healthy(page);
});

test("a deactivated account can't log in: the right password says so, a wrong one doesn't tell (DECISIONS #40)", async ({as, db, world, healthy}) => {
  const {id, username} = world.accounts.inactive;
  const sessions = () => db.luciaSession.count({where: {userId: id}});
  const before = await sessions();
  const page = await as("guest");
  await openLogin(page);

  const wrong = await logIn(page, username, WRONG_PASSWORD);
  expect(wrong.status()).toBe(404);
  await expect(note(page, WRONG_NOTE)).toBeVisible();

  const right = await logIn(page, username, PASSWORD);
  expect(right.status()).toBe(403);
  await expect(note(page, DEACTIVATED_NOTE)).toBeVisible();
  await expect(note(page, WRONG_NOTE)).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  expect(await whoIsLoggedIn(page)).toBeNull();
  expect(await sessions()).toBe(before);
  await healthy(page);
});

test("Odjava on Moj profil ends the session: the old cookie is refused, a page that needs a login opens Prijava, and Prijava brings the player back to it", async ({
  as,
  api,
  world,
  healthy,
}) => {
  const page = await as("noTeam");
  // the session as this phone holds it, to try it again after Odjava
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const elsewhere = await api("guest");
  expect((await elsewhere.get("/api/auth/me", {headers: {Cookie: cookie}})).status()).toBe(200);

  await page.goto("/profile");
  await page.getByRole("button", {name: "Odjava"}).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", {name: "Prijava", exact: true})).toBeVisible();
  expect(await whoIsLoggedIn(page)).toBeNull();
  // ended on the server too, not only forgotten by this phone
  expect((await elsewhere.get("/api/auth/me", {headers: {Cookie: cookie}})).status()).toBe(401);

  // Rejting needs a login: Prijava opens with the way back, and logging in lands on Rejting
  await openLogin(page, "/ratings");
  await expect(page).toHaveURL(/\/login\?next=%2Fratings$/);
  expect((await logIn(page, world.accounts.noTeam.username, PASSWORD)).status()).toBe(200);
  await expect(page).toHaveURL(/\/ratings$/);
  expect(await whoIsLoggedIn(page)).toBe(world.accounts.noTeam.username);
  await healthy(page);
});
