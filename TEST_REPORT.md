# Test report — full pass on `feat/new-screens`

Date: 2026-10-04. Dev server with a freshly seeded database (`npm run dev:reset`), seed accounts `admin` and
`player`, in the browser at phone (375 × 812) and desktop (1440 × 900) sizes. A separate code review of the whole
branch diff ran in parallel; its findings were checked against the code and fixed (below).

## Result

| Check | Result |
|-------|--------|
| Type check (`tsc`) | 5 errors, all on `master` already (seedHelpers, ongoingBelaResult fetchers, googleAuth, players/getAll); none in new code |
| Lint (`next lint`) | 0 errors, 0 warnings |
| Unit tests (`npm test`) | 37 / 37 pass |
| Production build | passes; every API route stays dynamic (only client pages are prerendered) |
| Prisma schema | valid |

## What was tested

**Signed out**
- `/`, `/teams`, `/createRound`, `/profile`, daily standings, Manage League, a match → redirect to `/login`.
- Season tables of every league are public. `GET /api/leagues` and `/api/leagues/:id/standings` give 200.
- Every other API answers 401.
- A dead session (database reset) is sent to `/login` on the first load.

**Login / sign-up**
- Wrong password shows an error; the correct one logs in.
- Login ignores case.
- Sign-up checks required fields and refuses a taken username; a new account then logs in.
- No birth-date prompt for password accounts.
- Logout clears the stored player, and protected pages redirect.

**Login limit**
- Five wrong passwords per account lock it; username, email and different capitalisation count together.
- Of 8 parallel wrong attempts, exactly 5 get through.
- Six successful logins in a row all pass.
- The form says "Previše neuspjelih pokušaja…" ("too many failed attempts") when locked.

**Player permissions**
- Every admin API answers 403: leagues, league teams, teams, teammates, rounds, all players, another player's
  profile, sessions.

**Game, end to end**
1. Create Round (phone, admin): 8 teams, 3 rounds, no rematches; a second identical request creates nothing.
2. Home shows the next table.
3. Start Game (phone, player) → match 1 of 2.
4. Wizard hands:
   - Announcements (50 / 20) + 92 : 70 → 142 : 90.
   - A caller who falls gets 0 : 162.
   - Editing a hand (changing the caller) recomputes it to 60 : 102.
5. The server refuses hands whose game points don't add up to 162, negative points, and a match the player isn't in.
6. The last hand was entered on the desktop panel: 1014 wins. "Završi meč" starts match 2.
7. The opponent wins match 2. The round result shows 1 : 1 with both scores, and match times are on the right day.
8. Daily and league standings for that night: a draw is 1 point each, difference ±284.

**Phone back button**
- After saving a hand, back goes home, not into the wizard.
- Tested with real taps. Script clicks are skipped by Chrome's history and can't test this.

**Byes**
- An odd number of teams gives one team a bye.
- The bye round closes itself at 2 : 0, so Start Game never picks it.

**Admin screens**
- Create League (desktop): name, day, rounds per night and two teams are saved; the league picker lists it.
- Manage League:
  - Adding an existing team and switching a team inactive both save.
  - "Create new team" puts the new team in that league.
- Create Round:
  - An inactive team starts off and can be switched on; the defaults come from the league.
  - 4 rounds for 3 teams is refused with a message.
  - Round numbers count per league.
- Manage Team (tested the round before): rename, a duplicate name refused, add and remove teammates, new team.
- Phone home admin controls reach Create Round, Manage League, Create League and Manage Team.

## Bugs found and fixed in this pass

| # | Bug | Fix |
|---|-----|-----|
| 1 | After a password login the app didn't know who was logged in until a reload. The desktop menu showed a signed-out player (no Start Game, no admin items), and a shared phone kept the previous player's name and match data. | The login form refreshes the stored player before leaving the page. |
| 2 | Desktop hand entry jumped back to the viewer's team every time the board refreshed (15 s), so digits could land on the wrong team. | The effect depends on the side, not on a new array every render. |
| 3 | Parallel login attempts got past the limit, and username and email were counted separately. | Counted per account, before the password check. |
| 4 | "Create new team" in Manage League put the team in the current league. On the first try the fix still didn't work, because the page read the address before the URL changed. | The league is passed along and read with `useSearchParams`. |
| 5 | The match date came from the database time zone, so after local midnight a match could "start" the next day. | Set by the app in UTC, like the start time. |
| 6 | Start Game from the desktop menu while already on that scoreboard spun forever. | Stops when there is nowhere to go. |
| 7 | Daily standings could keep a spinner forever when a background refresh overtook a load; Retry after a failed dates request did nothing. | Fixed both. |
| 8 | The phone back button after saving a hand reopened the finished wizard. | Saving goes back through history to the scoreboard. |
| 9 | A locked or failed login was shown as a wrong password. | Separate messages. |
| 10 | The teammate search could show old results under an emptied box; a created team could be reported as failed when only the list reload failed. | Fixed both. |
| 11 | On a phone there was no way to reach Manage League or Create League. | Added to phone home's admin controls. |
| 12 | Desktop daily standings with six rounds squeezed the date to "0…". | The title keeps its width and the round tabs scroll. |
| 13 | Daily standings before a league's first night had a dash as its title. | "Dnevni poredak" ("Daily standings"). |

## Observations, not changed

- Server error messages are in English (e.g. "Someone is using this username already...", the pairing error) while
  the app is in Croatian. Translating them means touching every route; worth a separate pass.
- A bye shows as a table in the pairings ("Stol 5 · Lavovi – bye").
- Phone home says "Tvoj sljedeći meč" ("your next match") on the Start Game card even when there is no next match.
- The login limit and the API limit live in memory, so they reset on a server restart and aren't shared between
  server instances. X-Forwarded-For is trusted for the address when the platform gives none; this was already so on
  `master`.
- View transitions still can't be watched in this browser pane (it skips them when hidden); see BLOCKERS 2.
