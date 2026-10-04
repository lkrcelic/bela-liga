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

7. **No `next-view-transitions` / framer-motion.** The design's implementation notes suggest them, but the brief says
   not to add dependencies unless clearly necessary. Motion is done with CSS keyframes + one small rAF count-up hook:
   step body slides in, new hand row flashes in, totals count up over 600 ms, winner panel tints and pulses, zvanja
   badges pop, trump pick fills. Everything collapses to no motion under `prefers-reduced-motion`.

8. **Home shows the "Sljedeći stol" card for anyone who has an open round, and Admin Controls for admins.**
   The design shows them as alternatives (player vs admin), but admins also play; showing both when both apply loses
   nothing. The card only appears when `/api/rounds/open` returns a round.

9. **League picker (daily + league standings) uses `/api/leagues`, which is admin-only.** For non-admins it falls back
   to the league in the URL / the current league only. Alternative: open the endpoint to all users (backend change,
   which the project rules say to make only when asked). Follow-up: allow `GET /api/leagues` for any logged-in user.

10. **Daily standings "finished day" (podium + rest) is shown for any date other than today (Zagreb time).** Today is
    shown as the live list with pulsing ranks for teams that have a running round. Reason: mirrors the design's
    logic (`done = not the latest date`) with real data.

11. **Manage League and Create League have no backend** (no `active` flag on `LeagueTeam`, no endpoints to add a team to
    a league or create a league). They read real data where it exists (league teams, team search) and keep their
    changes in an isolated mock repository (`src/app/_mocks/leagueAdmin.ts`, persisted in `localStorage`). Both screens
    show a small "Pregled · spremljeno samo na ovom uređaju" note so an admin is not misled. Create Round reads the same
    repository, so a team marked inactive is shown with an "Inactive" badge and left out by default, exactly like the
    design. Replace the repository functions with API calls when the endpoints exist.

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

19. **Old components are left in place, unused**, because the brief says not to delete files I did not create:
    `_ui/StandingsTable.tsx`, `_ui/DoubleActionButton.tsx`, `_ui/SingleActionButton.tsx`, `_ui/PlayerName.tsx`,
    `_styles/Form.modules.css`, `league/[leagueId]/daily-standings/ui/{PageHeader,RoundResultCard,RoundResultsPanel,
    StandingsTabContent,TabPanel,index}`, `ongoing-match/[matchId]/ongoing-result/ui/{AnnouncementsSection,DigitGrid,
    TeamScoreBox,TeamsScoreSection,TrumpCallerSection}.tsx`, `ongoing-match/ui/{Action,ResultsDisplay,
    TotalScoreSection}.tsx`, `round/[roundId]/result/LoadingScoreBoard.tsx`. Nothing imports them any more; they can be
    deleted in a follow-up (they account for most of the remaining pre-existing type errors).
