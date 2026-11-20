# Section agents: shared rules

You write one section of the Bela Playwright suite. Your section file (`e2e/sekcije/<id>.md`) says what to cover; this file says how. The plan behind it is `E2E_SUITE_PLAN.md`. Read both, plus the Playwright part of the `testovi` skill (`.claude/skills/testovi/SKILL.md`) and `E2E_PLAN.md` chapter 5 (its rules for tests).

## Where you work

- **Your worktree:** `/Users/lovro/projects/github/Bela-Treseta-Tournamnet-app/.claude/worktrees/e2e-<id>`, on branch `e2e/<id>`. Run every command from there. Other agents work in their own worktrees at the same time: never touch a path outside yours, and never run `git stash`, `checkout` or `reset` on anything but your own branch.
- **Your files:** `e2e/tests/<area>/<id>-*.spec.ts` (the area is in your section file) and `e2e/helpers/<id>.ts` for helpers only your section needs. Everything else is read-only for you: the shared helpers (`e2e/helpers/fixtures.ts`, `world.ts`, `db.ts`, `health.ts`, `scorepad.ts`), `e2e/playwright.config.ts`, `e2e/seed/`, and all app code (`src/`, `prisma/`). The pilot section C1 is the one exception: its file says what it may change.
- **Your app:** one server and one database of your own, started from the shared production build:
  - `e2e/local/app.sh start <id>`: a fresh database `bela_e2e_<id>` with the generated world, then `next start` on your port (about 20 s). Run it outside the sandbox (podman and localhost).
  - `e2e/local/app.sh stop <id>` when you are done, and before a fresh start.
  - `e2e/local/app.sh status <id>`: port, database, pid.
  The world is built around the real "now" and is the same for every section; its ids are in `e2e/local/run/<id>/seed-manifest.json`, which the `world` fixture reads.
- **Running tests:** `E2E_ID=<id> npx playwright test -c e2e <your spec files>` (outside the sandbox). Typecheck: `npx tsc -p e2e --noEmit`.

## How tests are written here

- Use the fixtures from `e2e/helpers/fixtures.ts`: `world` (the manifest's catalog), `as(role or username)` (a page in its own logged-in context, phone-sized by default), `db` (a Prisma client on your database, for setup, time shifts and asserts), `healthy(page)` (no console errors, no 5xx, no horizontal scroll).
- Find elements by role and Croatian label (`getByRole`, `getByLabel`, `getByText` for plain text). `data-testid` doesn't exist in the app and you can't add it.
- Wait for outcomes with `expect(...)`; never `waitForTimeout`, never `force: true`.
- Assert the outcome a person cares about (the hand is in the list, the standing moved, the table closed), and check it in the database too when the screen alone could lie.
- Expected values come from intent: the Bela rules, DECISIONS.md, CHANGELOG.md, the section file. Write them before you run the app.
- Time never passes for real: move it in the database (`db.shift…` helpers, or SQL on `published_at`, `ends_at`, …), then reload or call `/api/cron/tick` with `Authorization: Bearer e2e-cron`.
- **Repeatable:** every spec must pass `--repeat-each=5` in one run against your server without a new seed between repetitions. A test that changes the world either makes its own piece first (a league night, a table, an ad, through the app's API or Prisma in a fixture) or puts back what it changed.
- Phone first: player and admin flows run on the `mobitel` project (390×844, touch). A spec meant for the desktop too is named `*.racunalo.spec.ts`. Landscape is not supported: never test it.

## From the pilot (C1)

The fixtures and `e2e/helpers/scorepad.ts` were built and proven by C1; its specs in `e2e/tests/liga/c1-*.spec.ts` show them in use.

- **Setup through the app:** `api(who)` is a logged-in request context with no page. Make your own piece through the app's routes with it, as the admin or a phone would (scorepad.ts: `publishTable` → `startMatch` → `addHands`, and `removeKolo(table.roundNumber)` afterwards: the server recounts standings and replays ratings in ~100 ms).
- **The scorepad helper** names teams, never left/right (the viewer's own team is on the left): `enterHand(page, {caller, points: {team, game} | {stiglja: team}, zvanja: {[team]: [20, 50]}})` on the players' board and on the admin's phone scorepad alike; `fillHand` without saving, for a test that looks at what Spremi answers; `correctHand`, `finishMatch`, `handRow(page, n)`. The hand rows' accessible names ("Igra n: L prema R, ukupno …") are the steadiest assertions.
- **Shared seeded tables:** on `leagues.scorepad` and the current league, take a fresh table with `publishTable` rather than reuse a seeded one; a corrected seeded hand goes back with `savedHand`/`putHand`. `removeNight` is only for a league your section owns.
- **Clocks:** the seeded open matches have no Vrijeme partije, so nothing closes by time while you work. A test about the clock gives its match one with `freshClock(db, matchId, minutes)` and then moves `ends_at`. Other states are relative to the seed's "now" (the arrival window, start times, Kolo publish times): for a state as seeded, `app.sh start` again or move its times in the database.
- **Players:** a player who isn't onboarded gets the birth-date or "Pušiš li?" sheet over Početna (never on the scorepad, Tko igra or /round/). Pick one with `ONBOARDED` (db.ts); every scenario team has one.
- **Rate limit:** each `as()`/`api()` context has its own X-Forwarded-For, because the app counts /api requests per address. Keep it that way: reuse contexts, never strip the header.
- **App quirks:**
  - textContent drops the spaces between spans ("8 / 8ekipa igra večeras"): use `\s*` in text regexes.
  - "Zvanje 20" also matches "Zvanje 200": use `exact` or an anchored regex.
  - The players' step 2 says "Nema Zvanja", the admin's "Nema zvanja".
  - Standings use a real minus "−". Dnevni poredak rows start with the team's initial (an avatar letter).
  - The admin's table opens on Tko igra every time.
  - The players' Početna "Dnevni poredak" tile points at the selected league, so go to `/league/<id>/…` directly.
  - A tap right after a save can land during a view transition: use locator actions (they wait), or `tap({trial: true})` before a raw touchscreen tap.
  - Steps that change only the query string (`&korak=` on the admin's scorepad) wait ~1.5 s for a view transition: a known bug the lead is reporting. Don't assert on it or work around it with timeouts.

## When the app is wrong

Leave the app alone. Keep the test as it should be, mark it `test.fail()` with a comment `// BUG: <one line>`, and put the bug in your report (steps, expected, actual, the screenshot path). The lead checks it and opens the issue. A flake you can't explain is a finding too: report it, don't hide it behind a retry.

## Done

- Every flow in your section file has a test, or a line in your report saying why not.
- Every spec of yours passes `--repeat-each=5` (bugs marked `test.fail()` count as passing).
- `npx tsc -p e2e --noEmit` is clean.
- Committed on your branch `e2e/<id>` (the pre-commit hook runs `npm test`; a commit that only touches `e2e/tests` and `e2e/helpers` still runs it). No push. Your server stopped.

## Report (your final message)

```
Section <id>: <✅ done | ⏸ partly | ❌ blocked>
Branch e2e/<id> @ <short sha>; specs: <files>
Tests: <test name → flow it covers>, one per line
repeat-each=5: <passed n/n | which failed>
Bugs (test.fail): <title – steps – expected – actual – screenshot>, one per line, or "none"
Helper requests: <what the shared helpers should gain, and why>, or "none"
Scenario requests: <what the generator should add>, or "none"
FLOWS.md lines: <flow | test file › test name>, one per line
```
