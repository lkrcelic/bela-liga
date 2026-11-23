# Liga na dvije lokacije u Beli: plan of the port (15.11.2026)

The user's message of 15.11.: "pogledaj zadnjih par commitova na trešetu vezano za igru na dvije lokacije, želim da to
preuzmemo". This **reverses DECISIONS #95** ("To nam ne treba u beli", 14.11.). #96 (no conferences in Bela) stays.

**Source**: Treseta's branch `feat/locations`, two commits on top of Treseta `master` `86e5154`:

- `0d30eb90` **Liga na dvije lokacije**: 122 files, +6 900 / −800. Places become one list (Lokacije), a league night
  can be played at two places, the admin splits the teams (Podjela), each place runs its own Tu smo, Novo kolo, Skica,
  Objavi and tables.
- `7ae6a7a9` **Lokacije: the old place text columns go**: one migration, drops `location_name/address/url` from
  League, LeagueNight and Tournament. Must reach production one deploy after the first.

`origin/feat/locations` (`894fad8a`, `15f93606`) is the same pair before a rebase (`git range-diff`: identical). The
branch is **not on Treseta's master yet**. Treseta's `LOCATIONS_PLAN.md` (in the commit) holds the 22 decisions, the
data model, every screen and the design canvas
[Liga na dvije lokacije](https://claude.ai/code/artifact/e6e7ca8b-5c7f-4f55-b669-5f33a271de57) (option A of each board).
This plan doesn't repeat them. It says what changes for Bela and how the port runs.

**Status (23.11.):** A and B live since the 16.11. deploy (d77d5cd). C is split in two (found 23.11.): the build
migrates before `next build`, and the live deployment's Prisma client still selects the three columns (Prisma reads
every field of a model), so dropping them while it serves breaks every league, night and tournament read (P2022) until
the new deployment is live, and for good if the build fails after migrating. **C1** (the fields leave
`schema.prisma`, no migration) is on `development` since 23.11. and goes out with the next deploy. **C2** (the
migration `locations_drop_text`) waits on the local branch `lokacije-stupci` and goes to `development` once C1 is live.
Left: C2, and the Treseta side.

## What comes over as Treseta has it

- **Lokacije**: a `Location` table (name, address, Maps link), the admin's page `/lokacije` (next to Sponzori), and
  one `LocationPicker` in place of the three text fields in Podaci lige, Nova liga, Uredi večer and the tournament
  form. An organizer may pick or add a place. Editing and deleting a place is admin-only, and a place in use can't be
  deleted.
- **A night with one or two places** (`LeagueNight.second_location_id`). Okupljanje and Početak are shared.
- **Podjela** (new tab after Novo kolo; on the phone `?view=split`): Neraspoređene | place 1 | place 2, drag or the
  arrow menu, Zamijeni lokacije, Kopiraj raspored. Rows go in `LeagueNightTeam` (slot 1/2). Only the admin moves a
  team. A move counts from the next Kolo.
- **Tu smo per place**: an unplaced team on a two-place night sees *Javi se adminu*, and the server refuses its Tu smo.
- **Novo kolo, Skica, Objavi per place** (`Round.location_slot`, `CreateRoundDraft.slot`). Tables count from Stol 1 at
  each place. Kolo numbers are shared by the night (Kartaš 7, 8, 9; Lanterna 7, 8). The Kola tab merges both places'
  Kolo N into one row.
- **Dnevni poredak**: on a two-place night, a *Sve | place 1 | place 2* switch, and `get_league_standings_by_date`
  gets `p_slot DEFAULT NULL`. Ukupni poredak, rating and Burza stay one league.
- **Početna · Liga**: *Vaša lokacija*, "Kolo 1/3" on the table card, and new cards on **every** league night,
  one-place nights included: *Sljedeći stol*, *Pauza*, *Kraj večeri*, *Nema zakazane večeri* (pure `homeCard()` in
  `_lib/homeCard.ts`). Turniri gets *Nema nadolazećih turnira* in the same style.
- **Raspored**: both places on the night, with the team's place marked "Vi".
- **Admin's phone Večer**: a box per place and "N ekipa bez lokacije".
- **Kola before Ekipe** in Upravljanje ligom.
- A one-place night writes no `LeagueNightTeam` rows and leaves `location_slot` null, so it behaves as today.

## What changes for Bela

| Treseta has | In Bela |
|---|---|
| **Conferences** (#96: Bela has none) | Leave out *Podijeli po konferencijama*, `splitByConference` and its tests, and the conference dots in Podjela (Bela's `TeamChipBadge`). Dnevni poredak on a one-place night keeps no filter (as today). On a two-place night it has only `LocationFilter`. The seed has no conferences. |
| **Tu smo without bans** | Bela's league Tu smo checks bans (#73). `arrival.ts` is the biggest hand-merge: the ban refusal comes first, then *Javi se adminu*. Novo kolo per place keeps the Zabrana chip and `OutReason` `ban`. Podjela shows a banned team with Zabrana and still lets the admin place it (open question 1). |
| **Broj kola from the league** (`rounds_per_night`) | Bela has the night's own Broj kola (#94, `LeagueNight.rounds_per_night`). `placeDone`, *Kraj večeri*, "kolo 2 od 3", `lastRoundLeagues` (no Tu smo / Želimo uskočiti after the last Kolo) and "Večer je završila." (Odlazimo after the end) read the night's ?? the league's value, counted for each place (open question 2). |
| **Treseta's Početna** | Bela's `PhoneHome.tsx` differs (Gost i poziv, brand header, Turniri / Liga tabs, the top card of a tournament in progress, 433c54c). Put the new cards in by hand. A guest or a viewer without a team sees no place on a two-place night (decision 19). |
| **5 : 0, zvanja, `winner_side`** | Nothing in this feature touches scores. Only `hands.ts` changes, by +3/−1 (`location_slot` for "the next Kolo"), and that hunk applies cleanly. |
| **Treseta's migrations** | Bela keeps **Treseta's three folder names** (`20261114120000_locations`, `20261114140000_locations_daily_standings`, `20261115120000_locations_drop_text`). They sort after Bela's last migration (`20261112120000_night_rounds`), and the nightly sync then sees the same migrations instead of a second copy. The standings function body is Bela's (`20261014120000_round_status`) plus `p_slot`. It is the same as Treseta's except for one comment. |
| **Treseta's seed** (Kartaš, Lanterna, 8 teams in two conferences) | Bela's `prisma/seed.ts` is its own (526 lines of drift). Add Bela's version: two Lokacije, the next night on both, Podjela with one team left unplaced. |
| **Design canvas** in Treseta's colours | The screens share components, so Bela's tokens apply on their own. Add the new `color.gold` token. Where a frame drifts from Bela, use the league's components (design-league-patterns). |

**Bela-only places that write the old text columns**: none in `src/`. Every reader there is in Treseta's diff. The
untracked E2E seed in progress (`e2e/seed/scenarios/leagues.ts`, `tournaments.ts`, `tournamentPlay.ts`) writes
`location_name`. It must switch to `Location` + `location_id`, and `npm run seed:verify` must stay green. Coordinate
with the session that owns `e2e/`.

## How the port runs

1. **Worktree** `.claude/worktrees/lokacije`, branch `feat/lokacije` from `development`, with its own copy of
   `node_modules` (`prisma generate` must not touch the main checkout, where other sessions run).
2. `git fetch ../Treseta-tournamnet-app feat/locations:refs/tmp/treseta-locations`, then `git cherry-pick -n 0d30eb90`
   (a 3-way merge of trees, as for #97).

   Measured against Bela's `1bb39ea`, of the 84 files that already exist in Bela:
   - **29** are identical to Treseta's base and apply as they are;
   - **22** differ but take Treseta's hunks cleanly;
   - **33** conflict.

   Most conflicts are small. The real hand-merges are `service/league/arrival.ts` (bans), `_ui/round/CreateRound.tsx`
   (bans, conferences), `manage/page.tsx` (Treseta's conference tab), `daily-standings/page.tsx` (conference filter),
   `_ui/home/PhoneHome.tsx`, `GatheringForm.tsx`, `schema.prisma`, `seed.ts`, `service/admin/tables.ts`,
   `service/league/nights.ts` and `_interfaces/league.ts`. The 37 new files come in as they are, minus their
   conference code.

   Not copied: `BELA_SYNC.md`, `LOCATIONS_PLAN.md` (this file is Bela's), the hunk in Treseta's
   `tournamentZvanja.test.ts`.
3. Then the Bela changes from the table above, file by file, with their tests.
4. **Commits** (as with #97, one Bela commit per Treseta commit, so the sync maps them 1 : 1):
   - **A** `Liga na dvije lokacije (iz Trešete, 0d30eb9)`: the feature, migrations 1 and 2, tests, seed.
   - **B** `DECISIONS #98 i CHANGELOG`: #98 replaces #95 ("Liga na dvije lokacije dolazi u Belu", with the Bela
     changes above), and UX bullets go into CHANGELOG (players / admin / changed).
   - **C** `Lokacije: stari stupci mjesta odlaze (iz Trešete, 7ae6a7a)`, in two commits, each going to `development`
     only once the one before it is live on production. A deploy takes all of development's tree and migrates before
     `next build`, while the old deployment keeps serving with its own Prisma client:
     - **C1** (after A is live): the three fields leave `schema.prisma`, no migration. The columns stay in the
       database, which Prisma doesn't mind; the client just stops selecting them. Until C2, `prisma migrate diff`
       shows the three columns, and a local `prisma migrate dev` would make its own drop migration under a Prisma
       name: don't commit that, C2 keeps Treseta's folder name.
     - **C2** (after C1 is live): the migration `20261115120000_locations_drop_text`, Treseta's, unchanged. Prisma
       applies it although newer migrations are already applied.

## Checks

- **Unit** (Treseta's, adapted): `locations.test.ts` (without the conference cases), `homeCard`, `nightTimes`,
  `adminTonight`, `leagueArrival`, `permissions`. New Bela cases:
  - a banned, unplaced team gets the ban refusal, not *Javi se adminu*;
  - a night whose Broj kola differs from the league's ends each place's night (*Kraj večeri*, last Kolo) at its own
    value.
- **db** on a throwaway Postgres (`scripts/test-db-local.sh`): `split`, `arrivalPlaces` (+ a banned team),
  `placeRounds`, `dailyPlaces`, `homeTonight`.
- **No Playwright yet** (`e2e/playwright.config.ts` doesn't exist), so commit A says "no E2E yet". Later flows for
  `e2e/FLOWS.md`: Podjela → Tu smo at a place → Novo kolo → Objavi per place.
- `npm test`, `npx tsc --noEmit`, ESLint, `next build`, then the `e2e-reviewer` agent on the staged diff.
- **Migration on a copy of Bela's production** (`pg_dump`, read only, as in local-test-database). With a
  before/after query:
  - every league, night and tournament keeps the same name, address and link;
  - every played night's Dnevni poredak is identical with two arguments and with a NULL slot;
  - spellings that differ only in case or spaces merge into one place.
- **Browser** at 390 × 844 and 1440 × 900 on that copy and on the seed:
  - Treseta's step-15 walk: Lokacije, a second place, Podjela, Tu smo placed / unplaced / inactive, Novo kolo →
    Skica → Objavi at both places with shared numbers, Dnevni poredak's switch, every home card, Raspored, the
    admin's Večer;
  - Bela's own: a banned team, a night with its own Broj kola, a guest's Početna, a tournament's place;
  - a one-place night that looks exactly as today.
- After the push, the development deployment (Neon copy of the real data).

## Deploy (only on the user's request)

1. Commits A and B: migrations `locations` and `locations_daily_standings`, both additive. Take a `pg_dump` first
   (production-database).
2. Once that is live: C1 goes to `development` and out with the next deploy (done 23.11.: on `development`).
3. Once C1 is live: C2 goes to `development`, then a deploy with `locations_drop_text` (`pg_dump` first: the columns'
   text is gone after it, though A copied every place into Lokacije). Before it, count on production (read only) the
   rows of League, LeagueNight and Tournament with `location_name IS NOT NULL AND location_id IS NULL`: the code
   before A could still write the text columns while A deployed, and such a place would be lost. Any found get a
   Lokacija first. Pushing C2 also drops the columns on the development database (the Neon copy), where only C1's
   preview and later ones keep working.

## Treseta side, after Bela has it

- In `BELA_SYNC.md`, *Lokacije* stops being "Treseta's own" and becomes "once Bela has it, take Bela's", like Vrati
  stol and Uredi ishod.
- Bela's commits A, B, C1 and C2 are marked as already in Treseta, so the nightly `bela-nightly-sync` skips them instead of
  stopping on them. This has to happen **before** A reaches Bela's master.
- If Treseta changes `feat/locations` before merging it, those follow-ups are ported the same way.

## Answers (the user, 15.11.)

1. **A banned team on a two-place night** ("može, ali na ekipi mora biti znak zabrane"): the admin can place it in
   Podjela, and its row there **carries the ban sign** (Novo kolo's Zabrana chip). Tu smo refuses it with the ban
   message first, as today.
2. **Broj kola** ("svaka lokacija može zasebno, ali generalno će imati isto"): each place can have its own Broj kola,
   and by default both have the same. The night keeps `rounds_per_night` (place 1, and the default for both). A new
   `LeagueNight.second_rounds_per_night` (null: the same as place 1) is set in Uredi večer under *Druga lokacija*,
   shown only when the night has a second place, with the hint that it is the same unless changed. Kraj večeri, the
   last Kolo (no Tu smo / Želimo uskočiti), "Večer je završila." and "kolo 2 od 3" read the team's place's value.
   Taking the second place away clears it. It goes in migration 1 (`locations`), so Treseta can take it back.
3. **The new home cards** on every Bela league night, one-place nights too: yes.
4. **Port now**, from the branch.
