# Scorepad redesign — implementation plan

Source: Claude Design project "Piatnik Bela Liga app refresh"
(`Bela Liga Refresh.dc.html`, `ScorepadPhone.dc.html`, `ScorepadScreens.dc.html`, `Desktop.dc.html`).
Branch: `feat/new-screens`. Decisions are logged in [DECISIONS.md](DECISIONS.md), blockers in [BLOCKERS.md](BLOCKERS.md).

## Stack (discovered)

- Next.js 14 App Router, every page is a client component (`"use client"`), data via `fetch` wrappers in `src/app/_fetchers`.
- Styling: MUI v6 (`sx` prop) + a theme in `src/app/_styles/theme.ts`. Tailwind is installed but unused. Zustand stores for the
  hand-entry wizard (`_store/bela/*`), round and match.
- Tests: `node --test` over `src/app/_lib/__tests__/*.test.ts` (pure logic only). Lint: `next lint` (warnings only).
- Type-check: `tsc --noEmit` has **72 pre-existing errors** on master (builds use `ignoreBuildErrors`). Rule for this
  branch: no new type errors in any file touched; the total must go down, not up.
- Local run: `.claude/launch.json` → `bela-db` (throwaway Postgres on 5433) + `bela-app` (`npm run dev:reset`, seeds
  `admin` / `player` users, league 2 with 8 teams).

## Design inventory

Visual system ("1a" light Scorepad): paper `#F5F2EA` background, white cards (radius 20–24, soft shadow), ink `#1F2433`,
muted `#5E6577`/`#4A5062`, navy primary `#3C4A67`, cream `#EDE0BF`, team green `#386641`, team/live red `#BC4749`.
Display font Bricolage Grotesque (800), body Instrument Sans, Material Symbols Rounded icons. 60 px primary action at
the bottom of phone screens; 48 px round icon buttons; uppercase 13 px eyebrows.
Desktop (≥1024 px): hamburger → overlay nav drawer, header with eyebrow + 44 px title + right-hand controls.

| # | Screen | Phone design | Desktop design | States to cover |
|---|--------|--------------|----------------|-----------------|
| 1 | Login (`/login`) | ✔ | ✔ split hero | password eye, error, submitting |
| 2 | Signup (`/signup`) | ✔ | ✔ split hero, 2-col form | field errors, password mismatch, success |
| 3 | Home (`/`) | ✔ player + admin | ✔ daily + league side by side | start-game loading/error, no open round, admin-only section |
| 4 | Scoreboard (`/ongoing-match/[id]`) | ✔ | ✔ scoreboard + inline hand entry | empty hands, new-hand row-in, count-up, winner celebration, finishing |
| 5 | Hand wizard: a · Tko je zvao | ✔ | (inline on desktop) | none picked (Dalje disabled), picked fill |
| 6 | Hand wizard: b · Zvanja | ✔ | (inline) | badges per team, Nema Zvanja / Dalje |
| 7 | Hand wizard: c · Igra | ✔ | (inline) | keypad, štiglja, save disabled, save error |
| 8 | Kraj kola (`/round/[id]/result`) | ✔ | — (responsive) | loading, winner tint |
| 9 | Daily standings (`/league/[id]/daily-standings`) | ✔ live/done/round tabs, league sheet | ✔ podium + table, round tables in 1/2/3 cols, filters, search | loading, empty day, live, finished day |
| 10 | League standings (`/league/[id]/standings`) | ✔ podium + list, league sheet | ✔ podium + full table | loading, error, empty |
| 11 | Profile (`/profile`) | ✔ | ✔ | loading, no teams |
| 12 | Create Round (`/createRound`) | ✔ league pick → teams | ✔ single view, inactive badges | loading, <2 teams disabled, create error |
| 13 | Create Team (`/teams/new`) | ✔ | ✔ (Teams screen) | picker search, selected chip, success/error |
| 14 | Add Teammate (`/teams/add-teammate`) | ✔ | ✔ (Teams screen) | search results, disabled until valid |
| 15 | Teams (`/teams`, desktop nav target) | — | ✔ both forms side by side | as 13 + 14 |
| 16 | Manage League (`/league/[id]/manage`) — **new** | — | ✔ | filters, search, active toggle, add team, no hits |
| 17 | Create League (`/league/new`) — **new** | — | ✔ | name required, day picker, stepper, team select |
| 18 | Round pairings (`/round/pairings/[n]`) | — (not in design) | — | restyled with the system for consistency |

## Shared foundations (build first)

- [x] Tokens: `src/app/_styles/tokens.ts` (colors, fonts, radii, shadows, motion) + theme update + Google Fonts link
- [x] Primitives in `src/app/_ui/sp/`: Screen, ScreenHeader (eyebrow/title), IconCircleButton, PrimaryButton,
      OutlineButton, ActionPair (Nazad/Dalje), Card, Field/TextInput/SearchInput, Switch, Stepper, PillTabs/Segmented,
      RankBadge/LiveDot/LivePill, Podium, StandingsRows (phone) / StandingsGrid (desktop), Avatar/initials,
      EmptyState/ErrorState/LoadingRows, BottomSheet, Icon (MUI Rounded icons)
- [x] DesktopShell + NavDrawer, `useIsDesktop`, `useSession` (user + isAdmin)
- [x] Pure helpers in `src/app/_lib/ui/*` with unit tests (standings formatting, table filters/columns, initials, dates)
- [ ] Mock repository for features without a backend: `src/app/_mocks/leagueAdmin.ts` (team active status, add team to
      league, create league) — isolated behind one module

## Implementation order

1. Foundations (tokens, theme, root layout, primitives, shell)
2. Login, Signup
3. Home
4. Scoreboard + hand wizard (a, b, c) + desktop inline entry
5. Kraj kola
6. Daily standings, League standings (+ league picker)
7. Profile
8. Create Round
9. Create Team, Add Teammate, Teams
10. Manage League, Create League (mock data)
11. Pairings restyle, polish (motion, reduced motion, a11y pass)

## Definition of done (per screen)

- Matches the design: layout, spacing, type scale, colors, states listed above; phone (390) and desktop (1440) widths,
  no horizontal page scroll at 360–1440
- Real data where an API exists; mock data only through `_mocks/` where it does not
- Loading, empty and error states handled; buttons disabled while submitting
- A11y: semantic elements (`main`, `h1`, `button`, `label`), every icon-only button has `aria-label`, visible focus
  ring, `role="switch"`/`aria-checked` on switches, tabs expose selection, contrast ≥ 4.5:1 for text
- `tsc` introduces no new errors in touched files, `npm run lint` clean of errors, `npm test` passes
- Checked in the running app with screenshots at phone and desktop width

## Status

| Screen | Status | Notes |
|--------|--------|-------|
| Foundations | ✅ | tokens, theme, `_ui/sp` kit, desktop shell + drawer, mount gate (D17) |
| Login | ✅ | phone + desktop split; validation, wrong-password error verified |
| Signup | ✅ | Croatian field validation (unit tested), server field errors mapped |
| Home | ✅ | player (next table) + admin variants, start-game error, desktop dashboard |
| Scoreboard + desktop entry | ✅ | add/edit/celebrate/finish verified with real API; keyboard digits on desktop |
| Wizard a/b/c | ✅ | persistent header, step slide in/back, badges, štiglja |
| Kraj kola | ✅ | verified after finishing a real round |
| Daily standings | ✅ | live/finished/round tabs, league sheet; desktop presentation with 1–3 columns, filters, search; verified with live tables |
| League standings | ✅ | league from URL (was hard-coded to 2), podium + list/table |
| Profile | ✅ | details, teams, empty state |
| Create Round | ✅ | phone two-step, desktop single view; inactive teams excluded (mock status) |
| Create Team / Add Teammate / Teams | ✅ | combobox picker; team created and teammate search verified against the API |
| Manage League (mock) | ✅ | real teams/players/rounds played; status + add team in mock store (D11) |
| Create League (mock) | ✅ | saved to mock store with notice (D11) |
| Pairings | ✅ | restyled; loading/empty/error |

## Verification summary (end of run)

- `npm test`: 28/28 pass (11 new tests for the UI helpers: standings rows, podium split, table filters/columns,
  Croatian plurals, initials, dates, diacritic-insensitive search, signup validation)
- `npm run lint`: 0 errors (remaining warnings are in untouched pre-existing files)
- `tsc --noEmit`: 45 errors, down from 72 on master; none in files written or changed on this branch
- `next build` (run in an isolated copy so the dev server kept running): succeeds, all routes compile
- Browser checks at 375×812, 360×740, 768×1024 and 1440×900 with real data: login (validation, wrong password),
  signup, home (player with next table, admin, start-game error), full game flow (enter hand, zvanja, edit hand,
  winner celebration, finish match 1 → match 2 → Kraj kola), desktop inline entry with keyboard digits, daily
  standings with live tables, league standings, profile, create round (search, filtered select-all, inactive),
  create team (real create), add teammate search, manage league (toggle inactive → reflected in create round),
  create league, pairings. No horizontal scroll at 360 px; focus ring visible on keyboard focus.
