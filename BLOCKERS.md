# Blockers and open items

No screen was blocked. These are the places where the design asks for something the backend cannot do yet, or
where I stopped short on purpose. Each one has a working fallback in the app.

1. **No backend for Manage League / Create League** (see DECISIONS 11).
   Missing: an `active` flag on `LeagueTeam`, `POST /api/leagues` (create), `POST /api/leagues/:id/teams` (add an
   existing team), `PATCH /api/leagues/:id/teams/:teamId` (active). The screens work against
   `src/app/_mocks/leagueAdmin.ts` (this browser only) and say so on screen. Create Round already reads the
   inactive flag from the same place, so only the repository functions need to change.

2. **League picker for players** (DECISIONS 9). `GET /api/leagues` is admin-only, so players see only the league in
   the URL, named "Bela Liga". Opening that GET to logged-in users would give everyone the real names and the full
   list.

3. **Player search matches usernames only** (`/api/players?query=`). The pickers show full names, but typing a
   first or last name finds nothing. A server change (search first/last name too) would fix it.

4. **Desktop "Start Game" lives in the navigation drawer.** The desktop home in the design has no start button,
   so on desktop a player starts a game from the drawer (it uses the same start logic as the phone hero card).

5. **Route transitions** use CSS animations instead of the View Transitions API / framer-motion the design notes
   suggest (DECISIONS 7). The home → scoreboard card morph is therefore not implemented; screens fade/slide in.

6. **Old components left unused** (DECISIONS 19), because the brief said not to delete files I didn't create.
   They can be deleted in one follow-up commit; that also removes most of the remaining pre-existing type errors.

7. **Nothing is pushed.** All work is committed on the local branch `feat/new-screens`; master is untouched.
