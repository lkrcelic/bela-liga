# Logic refinements (October 2026)

A review of the app's logic, area by area. Each section says what was wrong, what changed, and how it was checked.
Everything below **Done** is committed on `master` (not pushed). **Still open** lists what needs a decision or your
access.

Checked with:
- `npm test`: 17 unit tests for scoring, pairing and ratings. This is a new script using Node's built-in test runner.
- A full round played against a local Postgres through the API and the UI.
- No new TypeScript errors, and `next lint` shows no errors.
- `next build` on Next 14.2.35.

---

## 1. API access control

**Problem.** The middleware lets every `/api` request through, and most routes never checked who was calling. Without
logging in, anyone could:
- post hands with any score;
- finish matches and rounds (each finish re-ran the rating update);
- add players to teams: `add-teammate` called the admin check but ignored its result.

On top of that:
- signup returned the password hash;
- player emails were public;
- `/api/session` returned usable session tokens.

**Done**
- `requireUser`, `requireAdmin` and `canPlayRound` in `src/app/_lib/service/auth/requireUser.ts`; every route uses them.
- Public routes: league standings, daily standings, round dates, login, signup, logout, auth.
- Admin only:
  - creating rounds and teams;
  - adding teammates;
  - finishing a round by hand;
  - listing all matches and all players;
  - sessions.
- Only the players of the two teams in a round, or an admin, can start, score or finish its matches.
- Player email and role are returned only to that player and to admins. The signup response no longer contains the
  password hash, and session listings drop the ids and tokens.
- Unused routes are removed: `/api/results` (a copy of `/api/ongoing-bela-result`), `/api/belaAnnouncement` and
  `/api/rounds/active`.
- Next.js is upgraded from 14.2.13 to 14.2.35. This fixes the middleware authorization bypass (GHSA-f82v-jwr5-mffw).
- Cookie signatures are compared in constant time, and there is no hardcoded `SECRET_KEY` fallback in production.
- The login rate limit is per IP and username, so nobody can lock a player out. Both rate limiters now drop old
  entries.

## 2. Hand scoring and validation

**Problem.** The server trusted the client's totals: it never checked total = game points + announcements, or the pad
rule. If a hand had no announcement list, the server accepted any announcement points.

**Done**
- The scoring rules (pad, štiglja, announcements, when a match is over) live in one module, `src/app/_lib/bela/scoring.ts`. The
  score keypad and the API both use it.
- The server rejects hands it can't accept, with a readable message shown on the score screen:
  - game points that don't add up to 162;
  - a štiglja that isn't 252:0;
  - negative points;
  - announcement points that don't match the announcements.
- It then **recomputes** totals and `pass` itself.
- Saving or editing a hand and moving the match score happen in one locked transaction.
- An edit now applies to the hand's own match. Before, the score change went to whatever `match_id` the request body
  named. Before, the score was also moved before validation, so a rejected edit left the score permanently off.
- A new hand is refused once the match is already over (≥ 1001 with a lead).

## 3. Finishing matches and rounds

**Problem.** The phone ran the finish as separate calls: store match → delete ongoing match → add a win → maybe create
the next match → maybe finish the round. The decision used round wins cached on the phone. Two phones tapping
"Završi meč" created a duplicate match and doubled the standings. If finishing the round failed, the app had already
navigated away. Separately, `/api/rounds/:id/finish` could be called again and again, updating ratings each time.

**Done**
- `POST /api/matches` is now one server transaction holding a lock on the match (`finishOngoingMatch.ts`). It:
  - checks the match is really over;
  - stores it;
  - adds the win;
  - then either starts the second match or closes the round, recomputing both teams' standings and the ratings.
- It returns `{roundId, roundFinished, nextOngoingMatchId}` and the phone just follows that.
- A second tap from another phone gets `409`, and that phone follows to wherever the round is now.
- "Start Game" locks the round. Simultaneous starts share one match, and closed or fully played rounds can't get a new
  one.
- The admin finish endpoint does nothing if the round is already closed, and refuses rounds with fewer than 2 played
  matches. Before, an unplayed round counted as a draw.
- Removed the broken `updateScores` (it threw on every call and the error was swallowed) and the unused
  `recompute/teamScore`.

## 4. Several phones on one match (Task.md: "zabrani unos u isto vrijeme preko dva uređaja")

**Done**
- The server side is safe; see sections 2 and 3.
- The match screen refreshes every 15 s and when the app returns to the foreground, so hands entered on a teammate's
  phone appear.
- If the match was finished elsewhere, the screen moves to the next match or the round result.

## 5. Ratings

**Problem.**
- Every player's rating deviation was overwritten with the team average.
- Volatility was reset each time.
- A team with a substitute (3+ players) made the update throw. That happened after the round had already been closed.
- The service opened its own database connection pool.

**Done**
- Ratings work with any roster size.
- Each player keeps their own RD, which still shrinks per round, and their own volatility.
- The service uses the shared Prisma client and runs inside the round-closing transaction.

**Still open (your call).** The update formula is not real Glicko-2: there is no volatility iteration, and the change is
`Q·φ·g` scaled by 16. Ratings also use the whole roster, since seating is no longer tracked. Both are product choices,
so I left them as they are.

## 6. Creating rounds and pairing

**Problem.**
- Going back and pressing "Create round" again created a second batch with the same teams (the Task.md bug).
- `matchTeams` threw for 24–31 and 40–47 teams because the window size came out odd.
- "Already played against" counted rounds from every league.
- Rounds were inserted, then read back without an order, so the bye matches could land on the wrong round.
- Rounds created between 00:00 and 02:00 got yesterday's date.

**Done**
- Round creation is one transaction with a per-league lock (`insertPairRounds.ts`). It creates rounds one by one, with
  their league link and bye matches.
- If the same teams are submitted again while that batch hasn't started, it returns the existing round number
  (`already_created: true`) instead of creating duplicates.
- The Create Round button is disabled while it works, shows errors, and uses `router.replace`.
- The window size is always even: `matchTeams` rounds it up and the form only allows even values.
- "Already played against" only counts this league's rounds, and teams with no score yet count as 0.
- Round dates, and the default daily-standings date, use Zagreb time (`src/app/_lib/dates.ts`).
- Round-date and league filters use `some` instead of `every`; `every` also matched rounds with no league at all.
- The bye team id is in one place (`src/app/_lib/bye.ts`).

## 7. Teams and accounts

**Done**
- "Create Team" adds the team to the current league. Before, a new team never showed up when creating rounds.
- Duplicate names and two identical founders get a clear error, and the form validates and reports the result.
- The current league is no longer a fixed id. It is the league with the latest round night (with no rounds anywhere,
  the newest league), see `pickActiveLeague` in `src/app/_lib/league.ts`. Home, the menus and Create Round open it,
  and `/league/current/<page>` redirects to it.
- Logging in while another session cookie is still there replaces that session. Before, it failed with a generic error,
  which mattered for a shared phone.
- Login is case-insensitive (exact match first). Signup refuses usernames and emails that differ only in case.
- Google sign-up picks a free username when the email prefix is already taken.
- The stored user is rechecked against the server on every load. Stores from a previous player are cleared, and the
  round store resets to an empty object instead of `null`.

## 8. Smaller UI logic

- "Start Game" with no open round now says so ("Trenutno nemaš otvorenu rundu.") instead of doing nothing.
- `/api/rounds/open` no longer crashes for a missing user.
- Admin controls only show when the admin check actually returns `true`.
- On the score keypad, the first digit after switching team, or after opening a saved hand, starts a new number.
  Editing 90 → 85 works without pressing X first.
- The score page always sends the announcements from the previous step, so a saved hand matches what was entered.
- "Current ongoing match" picks the newest one; it used to pick the oldest.

## 9. Tooling

- `npm run dev` no longer wipes the database. `npm run dev:reset` does the old reset-and-seed.
- `npm test` runs the unit tests in `src/app/_lib/__tests__`.
- Untracked the app zip, `tmp-file.ts`, a `node_modules` .pyc and an `.idea` folder under `src`. They are still on disk
  and now ignored.

---

## Still open

**Needs you (access or a decision I shouldn't make overnight)**
1. **Secrets.**
   - `.env` is committed, and the history has it 9 times.
   - `SECRET_KEY` is `"zbla"`.
   - `prisma/seed.ts` contains a real (expired) Google id_token with a real email.

   Rotate `SECRET_KEY` and any reused DB password, move `.env` out of git, and consider scrubbing history. I left `.env`
   tracked because deployment may depend on it.
2. **Push and deploy.**
   - Nothing is pushed.
   - The first deploy runs the `remove_seating_order` migration, which permanently drops the seating, dealer and
     player-caller data. Back up the production DB first.
   - Phones that have the app open from before the deploy should reload it once. The old screens finish matches in
     the old way, and the server now refuses part of that.
3. **Remaining framework advisories.** Some Next.js advisories are only fixed in 15.x. `next-auth` is on beta.29 and
   has open advisories. Both upgrades are bigger and need a test pass.
4. **Rating formula** (section 5): keep it as is, or move to proper Glicko-2 / per-match updates.

**Smaller, not done**
- The page middleware accepts any value in the Google session cookie, because it can't reach the DB at the edge. APIs
  check properly now, so this only exposes empty page shells.
- Round pairings (`/round/pairings/:n`) and "current round matchups" are not filtered by league. That's fine with one
  league and wrong with two.
- The bye team is still hardcoded as `0` in the SQL standings functions. `BYE_ID` must stay 0.
- The match screen still calls `localStorage.clear()` on load. That's heavy-handed but harmless now that the stores
  reset themselves.
- There's no undo for a finished match. An admin has to fix it in the DB.
- About 72 pre-existing TypeScript errors remain, and `ignoreBuildErrors` is still on.
