# Decisions log

Decisions made while implementing the Scorepad redesign without anyone to ask. Format: decision · alternatives · reason.

1. **Work on branch `feat/new-screens`, not `master`.**
   Alternatives: commit straight to master (the repo's usual habit). Reason: the brief asked for a feature branch and
   to never touch main; nothing is pushed or merged.

2. **Keep MUI + `sx` for all new UI, with the design's values as tokens in `src/app/_styles/tokens.ts`.**
   Alternatives: Tailwind (installed, unused), CSS modules. Reason: every existing screen uses MUI and its theme
   already holds the design's navy, cream and team colors. One styling system is easier to maintain.

3. **Fonts load from Google Fonts via `<link>` in the root layout (Bricolage Grotesque, Instrument Sans).**
   Alternatives: `next/font/google` (downloads at build time, which fails in offline/sandboxed builds), self-hosting.
   Reason: matches what the design file uses, works at runtime, no new dependency.

4. **Icons: `@mui/icons-material` "Rounded" variants instead of the Material Symbols Rounded web font.**
   Alternatives: load the Material Symbols font (~300 KB, flashes ligature text while loading). Reason: same glyph
   family, already installed, tree-shaken, no text flash.

5. **Desktop layout starts at 1024 px (`useIsDesktop`).** Below that the phone layout is used, centred at max 560 px.
   Alternatives: MUI `md` (900) or `lg` (1200). Reason: the desktop game screen needs a 460 px entry panel next to the
   scoreboard; 1024 is the smallest width where both fit. Tablets in portrait get the phone layout, which is what the
   app is built for (one-handed use at the table).

6. **Desktop navigation is an overlay drawer opened from a menu button**, as in the design (the sidebar is never
   docked). Phone keeps Home as the hub with back / "Početni zaslon" buttons, as in the design.

7. **Route transitions use the View Transitions API, without a new dependency** (`src/app/_lib/viewTransitions.tsx`).
   Alternatives: the `next-view-transitions` package the design notes suggest, or framer-motion. Reason: the brief
   asked not to add dependencies unless necessary, and the needed part is small. Navigations go through
   `useTransitionRouter` / `TransitionLink`; the update promise resolves when `<RouteTransitions />` in the root layout
   sees the new pathname committed (with a 1.5 s safety timeout). forward slides in from the right, back reverses,
   morph grows the Start Game card into the scoreboard (`view-transition-name: table`) while the rest crossfades;
   the wizard's team header (`team-header`) stays put. Browsers without the API, the browser back button and reduced
   motion fall back to the CSS step animations (or none). Other motion (count-up, row-in, badges, trump fill) stays
   CSS keyframes + a small rAF hook. Date and league changes navigate without a transition.

8. **Home shows the "Sljedeći stol" card for anyone who has an open round, and Admin Controls for admins.**
   The design shows them as alternatives (player vs admin), but admins also play; showing both when both apply loses
   nothing. The card only appears when `/api/rounds/open` returns a round.

9. **`GET /api/leagues` is public** (follow-up request): every player sees every league in the pickers, and logged-out
   visitors can open the season table (`/league/<id>/standings`) of any league. Daily standings and round dates need a
   login.

10. **Daily standings "finished day" (podium + rest) is shown for any date other than today (Zagreb time).** Today is
    shown as the live list with pulsing ranks for teams that have a running round. Reason: mirrors the design's
    logic (`done = not the latest date`) with real data.

11. **Manage League and Create League have a backend** (follow-up request). Migration
    `20261004120000_league_admin` adds `League.season / start_date / play_day / rounds_per_night / created_at` and
    `LeagueTeam.active`. Admin endpoints: `POST /api/leagues`, `GET|POST /api/leagues/:id/teams`,
    `PATCH /api/leagues/:id/teams/:teamId`. The old `/api/leagueTeams/:id` route and the local mock store were removed.
    Create Round starts with the league's rounds per night and leaves inactive teams out (the client still sends the
    explicit team list, as before).

12. **Teams on desktop is one screen (`/teams`) with Create Team and Add Teammate side by side**; the existing phone
    routes `/teams/new` and `/teams/add-teammate` stay and reuse the same form components.

13. **Root layout no longer imposes the old `top / body / actions` grid.** Every page is rebuilt on the new `Screen`
    primitive, so the grid areas are unused. The old `_ui/StandingsTable`, `DoubleActionButton` and
    `SingleActionButton` are replaced by the new primitives.

14. **Labels follow the design's mixed Croatian/English copy** (e.g. "Start Game", "Daily Standings", "Prijava",
    "Upiši igru") instead of translating everything. Reason: the design is the source of truth and the current app
    already mixes both.

15. **Text contrast:** the design's `#8A8F9C` (≈3.3:1 on white) is used only for placeholders and decorative counts;
    meaningful small text (hand numbers, inactive team names) uses `#686D7D` (5.2:1 on white, 4.6:1 on the paper
    background). Every other text/background pair in the palette was checked and passes 4.5:1.

16. **Pinch-zoom is allowed again** (`maximum-scale=1, user-scalable=no` removed from the viewport meta, WCAG 1.4.4).
    Buttons get `touch-action: manipulation`, so fast taps on the keypad still don't trigger double-tap zoom.

17. **Pages render only after mount** (root layout gate). Layout depends on the viewport width (`useIsDesktop`), which
    the server cannot know; server-rendering the phone layout caused hydration errors and a flash of the wrong layout
    on desktop. Every page already fetches its data on the client, so nothing useful was server-rendered before.

18. **Team boxes in the hand wizard say which team they are for** ("Zvanja · Dalmatinci"), not just "Zvanja".
    The design tells the two boxes apart by color only (green / red), which fails WCAG 1.4.1 for color-blind players.

19. **The components the redesign replaced were removed** (follow-up request), together with the unused
    `createRound/ui` dropdown and table.

20. **Player search matches first and last names too**; every word of the query must match one of username, first or
    last name, results sorted by username and capped at 20.
