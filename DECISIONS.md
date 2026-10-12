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

12. ~~Teams on desktop is one screen with Create Team and Add Teammate side by side~~ — replaced by Manage Teams (23).

13. **Root layout no longer imposes the old `top / body / actions` grid.** Every page is rebuilt on the new `Screen`
    primitive, so the grid areas are unused. The old `_ui/StandingsTable`, `DoubleActionButton` and
    `SingleActionButton` are replaced by the new primitives.

14. ~~**Labels follow the design's mixed Croatian/English copy** (e.g. "Start Game", "Daily Standings", "Prijava",
    "Upiši igru") instead of translating everything. Reason: the design is the source of truth and the current app
    already mixes both.~~ — replaced by Croatian everywhere (34, 35).

15. ~~**Text contrast:** the design's `#8A8F9C` (≈3.3:1 on white) is used only for placeholders and decorative counts;
    meaningful small text (hand numbers, inactive team names) uses `#686D7D` (5.2:1 on white, 4.6:1 on the paper
    background). Every other text/background pair in the palette was checked and passes 4.5:1.~~ — replaced by One
    colour palette (33).

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

21. **Logins last 30 days and slide**: renewed on every app load instead of ending after 4 hours (BACKEND_REVIEW.md, A).
    Session checks stay optimistic in the middleware and authoritative in the API routes (I).

22. **A Google login joins the password account with the same email (any case)**, and Google players are asked for
    their birth date once (BACKEND_REVIEW.md, G).

23. **Manage Teams replaces Teams** (`/teams`, design "Manage Teams · edit + new team"). The design is desktop only; on the
    phone the same screen shows the team list first and opens one team at a time, and phone home has one "Manage Teams"
    row instead of "Create Team" and "Add Teammate". `/teams/new` opens a new team, `/teams/add-teammate` the list.
    - An existing team's teammates are added and removed at once (as in the design); its name is saved with
      "Save name". A new team is created with its name and players in one step.
    - The first two players of a new team are its founders (the database keeps two founder columns); a team can start
      without players. Removing a founder keeps the founder columns as history and only takes them out of the team.
    - A new team still joins the current league, as before, so it can be picked for rounds; other leagues are added
      in Manage League. The card lists the team's leagues with Active / Inactive.
    - Team names are unique ignoring case. The bye placeholder team is hidden and can't be edited.

24. **Admins edit a night's tables and results on the desktop Daily screen** (design "Daily · Round 3 · uređivanje
    stolova", "scorepad (admin)", "ručni unos").
    - Any table can be re-paired or removed, also one where something was played (your decision): its matches and
      hands are deleted, with a warning in the dialog. A team picked from another table swaps places with the team
      it replaces. A table with the bye can keep the bye; the bye can't be seated anywhere new.
    - The scorepad edits every hand of the match in progress and of finished matches. "Ručni unos" stores only each
      team's points (no zvanja, not limited to 162; admins only); such a hand has no trump caller.
    - A finished match that an edit leaves without a team over 1001 counts for neither team (your decision); the
      round's wins and the standings follow.
    - The scorepad is desktop only, as designed; on a phone it says so.

25. **Ratings are replayed after a counted result changes** (your decision). Every player starts at 1500 and every
    closed round without a bye is applied again in date order, from the day ratings were introduced (7 Oct 2025),
    so a replay without edits gives the same ratings as the live updates. Today's rosters are used (the app keeps
    no roster history). A replay runs only when a round's outcome (win/draw/loss) changed; a change in points
    only updates the standings.

26. **Manage League has a Rounds view** (desktop): rounds per night with their state, and deleting one. The
    delete waits 8 s for Undo and is sent then, when another round is deleted, or when the page is left. Round
    numbers aren't renumbered after a delete; the next Create Round continues after the highest one.


27. **The app is installable, with no offline mode** (your decision). A web app manifest and the design's BL icon,
    no service worker. On a phone, the login page and Home (in the browser only) show the design's install sheet
    ("Mobile · install prompt flow"): Chrome's install dialog when Chrome offers it, otherwise the menu steps
    (Chrome or Safari) with an arrow at the menu. The design's line that entered hands stay saved without signal is
    left out, since nothing works offline. iPhone can't report an install, so only Android shows the success screen.
    Samsung Internet doesn't get its own install: on a Galaxy it has Samsung's server build the app package, for an
    old Android, and Play Protect blocks it ("Nesigurna aplikacija blokirana"; Samsung's open issue
    SamsungInternet/support#123). Its sheet says so and opens the page in Chrome instead, with a copy-link fallback.
    The manifest and the missing service worker aren't the cause and stay as they are. Drop the detour once Samsung
    fixes its package.

28. **League nights** (design "Burza igrača · spojeno", 11b "Datumi lige").
    - A league keeps its nights (`LeagueNight`). Create League fills them in from the start date, end date and play
      day, where single nights can be removed or added; Manage League · Dates adds and removes them afterwards.
    - The migration filled the nights of the existing leagues the same way, plus every date that already had a
      round. A round created on a date that isn't a night adds that night.
    - A night with rounds can't be removed (delete its rounds first, as the design says). A past night without
      rounds shows "Not played" / "Nije odigrano" instead of "Played", and can be removed.
    - Changing a league's start date, end date or play day in Details doesn't change its nights; Dates is the list.

29. **Burza igrača** (design "Burza igrača · spojeno", 11a).
    - The list and a single ad are public, with the phone number, as decided in the design; publishing and
      closing need a login. A Burza form opened without a login goes to the login page and back (`?next=`, only
      paths of this app).
    - A substitute ad is for the poster's own team (admins may post for any team), on one of the league's nights
      from today on; the form offers the next six. It closes by itself when its night has passed or is removed.
      A partner ad closes when its league's end date passes; "Dostupan sam" stays until it's switched off (your
      decision). The author or an admin closes any ad; a closed ad's page no longer shows the number.
    - Publishing the same ad again (a double tap, the form sent twice) updates the open one.
    - A phone number is required on an ad, at least 9 digits, stored as "+385 91 234 5678". An ad's number goes
      on the profile too (where it is optional) when the profile has none; one that would replace the profile's
      asks first, with a checkbox. The design's "Spremi broj na profil" pill started on and read as a button, so
      tapping it turned saving off.
    - The profile has no Burza section (your decision; the design had "Dostupan sam" and the phone number there):
      "Dostupan sam" is published and closed in Burza, and the profile's number is kept only from ads. An
      availability ad without a number of its own still uses the profile's.
    - "Rejting ekipe oko 1550" is the average rating of the team's players, in tens. A player's own rating shows
      once they have a rated round ("Još nema" before).
    - Team names aren't declined or given a verb: "Ekipa Slavonci traži zamjenu", "Taj dan igraš za ekipu
      Dalmatinci", since names like "Barcelona" or "Mujo i Haso" can't follow the design's "Slavonci trebaju
      zamjenu" / "za Dalmatince".
    - Početna's card counts other teams' substitute ads ("1 ekipa traži igrača"), not the player's own.
    - Croatian addresses, as the links get shared: `/burza`, `/burza/12`, `/burza/novi/zamjena|partner|dostupan`,
      `/raspored`. The design's `front_hand` and `event_upcoming` icons aren't in `@mui/icons-material`; BackHand
      and Event stand in.

30. **Phone Home switches by state** (your decision): on a league night with the player's table open it shows Start
    Game / Continue Game as before; the rest of the week "Sljedeća večer" with the team's next night takes the place
    of the grey "Nema otvorene runde" card, which stays for players without a team or nights. Under it, the Burza
    card and the design's 2×2 tiles (Raspored, Dnevni poredak, Ukupni poredak, Rejting); the rating number is on
    Profil and Rejting.

31. **Burza and Raspored on the desktop** (your decision; the design shows them on the phone only): both are in the
    menu (Burza also when logged out). Burza shows the ads as a grid of cards with the tabs and the date arrows
    above, "Objavi" opens "Što objavljuješ?" as a popover, and an ad or a form is one column. Raspored puts the next
    night and the team next to the list.

32. **Smokers and smoking tables** (design "Pušači i pušački stolovi", 12a–12g).
    - A player is a smoker or not (Ne by default): "Pušiš li?" right after the birth date at sign-up, and Smoker
      under Details on the profile, saved when flipped. Players from before the question, and Google sign-ups after
      their birth date, are asked once in a sheet ("Kasnije" waits until the app is opened again). Alternative: only
      the profile switch. Reason: no existing player would be a smoker until they found it.
    - Create Round (phone and desktop) has the design's Smoking tables card: the switch and a chip per table tonight
      (half the teams switched on). The league remembers the tables of its last round creation and the switch
      starts on with them; the first time it offers 1 and 2, as in the design.
    - The pairing is made as before; smoking tables only decide where a match sits. Round by round, the matches that
      need one most get the smoking tables in the order of their numbers, the other matches keep their order on the
      rest, the bye stays last. First come teams that haven't sat at a smoking table tonight, and of them the teams
      with the most missed nights (a night with a smoker at a round with smoking tables, but at no smoking table),
      which outweighs having more smokers, as asked. Then points: one per smoker at the table, ten for every team
      that hasn't sat at one tonight, and up to three for a team below its fair share this season (each round's
      smoking seats split by smokers, at most one a round per team), minus up to three above it.
      Alternative: the design's single score (smokers + share), with the missed nights but without "tonight first".
      Reason: in a simulated season (24 teams, 2 smoking tables, 4 rounds) it left three times as many missed nights
      (36 against 12), while teams with two smokers sat at a smoking table barely more often (0.32 of their rounds
      against 0.30). With "tonight first" teams with two smokers still sit there more often than teams with one
      (0.30 against 0.27; with 3 smoking tables 0.56 against 0.35), and the missed nights stay close between teams.
    - A table keeps whether it is a smoking table and each team's smokers when it was seated, so a later profile or
      roster change doesn't rewrite the season. Re-pairing a table in Daily keeps it a smoking table and counts the
      new teams' smokers; a table added there isn't a smoking table.
    - The design's "Smoking plan · tonight" (in the Desktop file, with nothing that opens it) opens from the card
      ("Smoking plan · rotation"), as a sheet on the phone: tonight's smoking tables round by round, and every
      smoking team's smokers, tonight's rounds as dots, Share (rounds at a smoking table / rounds played this season)
      and Missed (the nights without one).
    - The smoking mark is on Početna's Start Game card (12c), the round's tables on the phone (12d), the desktop round
      rows (on the table number), the new round's pairings and the re-pair dialog.

33. **One colour palette** (handoff §1; replaces #15). Every colour comes from `_styles/tokens.ts`: the handoff's
    palette, named alpha scales (`tint`) and shadows. No hex or rgba() values anywhere else (a test checks it).
    - faint is the design's `#8A8F9C` (3.2:1 on white), for idle icons, placeholders and decorative counts such as the
      tab counts (2.7:1 on the line-fill track of the Burza tabs, as in the design). Text that used the darker
      `#686D7D` (hand numbers, inactive team names, the Aktivna/Neaktivna and night labels, missed nights) is now
      muted `#5E6577` (5.8:1 on white, 5.2:1 on paper), so it stays readable.
      Alternative: keep a separate readable-text tone. Reason: the handoff removes every near-duplicate.
    - The design's darker red `#A63B3D` ("Treba zamjena", "Zatvori oglas", the "Taj dan igraš" line, a form error)
      is red `#BC4749`, and the success note's `#2B5233` is green (5.0:1 on its tint). Red text on the red tag tint is
      4.4:1 on a white card and 3.4:1 on the cream header of an ad. Alternative: a `redInk` token (5.5:1 on white).
      Reason: the handoff says to use only its tokens.
    - The error note keeps its red tint and red icon, but its text is ink (12:1); red text on the tint would be 4.0:1
      on paper, under AA on every screen that shows an error. Alternative: red text, or the `redInk` token.
    - The Start Game card keeps its lightened team dots `#6FA67A`/`#E07A7C` (token `teamOnNavy`), which the handoff
      table doesn't list but the design uses. Alternative: cream dots.
    - Merged near-duplicates: pressed keys, segmented tracks, rank circles and the "no round" card are line-fill;
      my table, a new row and the plan rows are cream-2; grab handles and the second Burza avatar are hairline. The
      phone podium rows use the medal tints (.26/.26/.24) and my team on the podium gets cream-2 with the bar.
      Backdrops: the white sheets (league picker, Pušiš li?, date of birth) .32; the paper sheets (Burza, smoking
      plan), the install guide and the Rejting sheet .42; dialogs .32; the nav drawer .28.
    - Google's button keeps Google's colours and the install guide the iOS and Android blues (tokens `brand`,
      `platform`).

34. **Croatian messages everywhere** (handoff §1). Every API and service message, every fetcher fallback and the
    validation messages are Croatian, and counts use one plural helper (`count(n, NOUN.ekipa)` in `_lib/ui/text.ts`,
    with the three forms of every noun the app counts: "još 1 ekipa / 2 ekipe / 5 ekipa", "1 igrač / 2 igrača").
    - An error note shows the server's sentence, or the screen's own sentence when the server sent none, never the
      HTTP status text ("Internal Server Error").
    - A request that never reaches the server (no signal at the bar) reads "Provjeri vezu i pokušaj ponovno." (the
      design's sentence for a failed load), never the browser's "Failed to fetch" / "Load failed".
    - An expired session reads "Prijava je istekla. Prijavi se ponovno." A round or match that doesn't exist (also
      a malformed id) is a 404 with "Runda ne postoji." / "Meč ne postoji.", not a 500.
    - A rejected form (zod) answers `{error, issues}`: `error` is the schema's own Croatian message ("Ime lige je
      obavezno."), or the route's sentence ("Liga nije napravljena.") where zod would use its English one.
    - A league's numbered round is "kolo" ("To kolo ne postoji.", "Kolo nije obrisano."); the round a player plays
      at a table is "runda" ("Ne igraš u ovoj rundi.", "Ova runda je već završena."), like the designed "Nema otvorene
      runde" and "Tko igra ovu rundu?".
    - The live pill and label say "UŽIVO" instead of the design's "LIVE". Alternative: keep "LIVE" as in the
      mockups. Reason: the handoff asks for Croatian everywhere, and the Admin upute say "uživo".
    - "Učitaj još · još N ekipa / igrača" under paged lists, and "Pokušaj ponovno" on error notes, as designed.
    - Not shown to anyone, so left as they are: the bye team's internal name and a developer check in the hand entry.

35. **Croatian screen copy** (handoff §1; replaces #14). The desktop menu, Početna, Dnevni poredak, the admin
    scorepad, Započni igru, the pairings, Upravljanje ligom (Ekipe, Kola, Podaci, Bilješke) and Moj profil use the
    design's Croatian copy, and counts go through the plural helper ("7 stolova", "njezinih 12 odigranih kola"), also
    in what screen readers hear ("1 bod", "4 boda", "1521 bod rejtinga").
    - A numbered league round is "Kolo N" everywhere (tabs, titles, back pills, the pairings and the game chip). The
      round a team plays at one table stays "runda", as designed: "Tko igra ovu rundu?", "Stol 4 · Runda 4" and the
      scorepad's "Runda je završena." (it means that table's round, while other tables may still be playing).
      Alternative: "Kolo je završeno.", which would be wrong while the other tables play.
    - The team filters in Upravljanje ligom read "Sve / Aktivne / Neaktivne" (a set of teams); the row status stays
      "Aktivna / Neaktivna". The design shows "All" and the singular.
    - The confirm button for taking a team out of a league keeps the design's "Obriši ekipu"; the question ("Ukloniti
      X iz ove lige?") and the note ("Ekipa i igrači ostaju u aplikaciji.") say what it does.
    - The pairings page after "Kreiraj kolo" reads "Parovi · <liga>" over "Kolo N · dd.mm.", as in the design; the
      table count it showed before is now only in what screen readers hear ("Parovi, kolo 3, 7 stolova").
    - Moj profil on the desktop scrolls each column on its own (hero, Podaci, Moje ekipe), as the handoff asks
      ("desktop columns never clip"), and the Kola tab's right column scrolls too.
