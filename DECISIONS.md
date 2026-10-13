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

8. ~~**Home shows the "Sljedeći stol" card for anyone who has an open round, and Admin Controls for admins.**
   The design shows them as alternatives (player vs admin), but admins also play; showing both when both apply loses
   nothing. The card only appears when `/api/rounds/open` returns a round.~~ — replaced by One Home, no admin editing
   on mobile (36).

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

32. **Smokers and smoking tables** (design "Pušači i pušački stolovi", 12a–12g; the copy and "Kasnije" are updated by #38).
    - A player is a smoker or not (Ne by default): "Pušiš li?" right after the birth date at sign-up, and Smoker
      under Details on the profile, saved when flipped. Players from before the question, and Google sign-ups after
      their birth date, are asked once in a sheet (~~"Kasnije" waits until the app is opened again~~ — now
      "Preskoči", which answers Ne, #38). Alternative: only the profile switch. Reason: no existing player would be a
      smoker until they found it.
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

36. **One Home on the phone, and no admin editing on mobile** (handoff §2; replaces #8). Početna is the Burza home of
    the design: the top card (Započni igru / Nastavi igru with the table on a round night, Sljedeća večer the rest of
    the week, the grey "Nema otvorene runde" card for players without a team or nights, as in #30), the Burza igrača
    card and the four tiles. It has no admin rows and no logout.
    - Admins manage leagues, rounds, nights and teams on the desktop only. On a phone, Novo kolo (`/createRound`),
      Upravljanje ligom, Nova liga, Ekipe (`/teams`, `/teams/new`, `/teams/add-teammate`), a table's admin scorepad and
      the admin's lineup step before it show "Ovo se uređuje na računalu." with a Početni zaslon button. The phone
      versions of these screens are gone, with the league-name card and the smoking plan sheet that only they used, so
      the phone parts of #23 and #32 no longer apply. On the phone an admin plays and sees the league like any player.
    - "Phone" means a window narrower than the desktop layout (1024 px), so a narrowed browser window on a computer
      gets the same note; with a mouse it adds "Prozor preglednika je preuzak, raširi ga.". Crossing that width while
      editing opens the screen afresh: unsaved input is lost and a team removal waiting for Poništi goes through, as
      when leaving the page. Accepted, as it needs a deliberate resize; keeping the desktop screen alive would load
      admin data on phones.
    - Closing another player's Burza ad ("Zatvori oglas (admin)") stays on the phone: it is moderation of an ad, not
      editing the league, and should be quick wherever the admin is.
    - Logout on the phone is an "Odjava" text button at the bottom of Moj profil, under Početni zaslon; the design has
      none once Home lost "Log Out". Alternative: an icon in the Početna header. Reason: logging out is rare and
      belongs with the account, and the design keeps Početna's header to the brand and the profile button.
    - The Burza card always opens Burza on Zamjene, as the handoff says ("opens Burza filtered to substitutes"), also
      when nobody is asking; the tab then says "Nitko ne traži zamjenu." and Partneri and Dostupni are one tap away.
      Before, the card opened all ads when nobody was asking. With nobody asking the card now drops its second line
      ("Pogledaj partnere i dostupne igrače"), which promised what the Zamjene tab doesn't show; it keeps "Nitko ne
      traži zamjenu" and "Objavi oglas kad tebi zatreba igrač ili partner.".
    - While Početna asks whether the player has an open round, the top card is a neutral navy frame; before, it showed
      an active Započni igru for a moment on every visit, also on the days without a round.

37. **League nights in Croatian** (handoff §3, design 11b and "Raspored lige"). Upravljanje ligom · Datumi and Nova liga
    use the design's Croatian copy; the logic of #28 stays.
    - The Datumi summary reads "6 odigrano · još 10" (the design has English "6 played · 10 to go"): played nights
      have rounds, "još" counts the nights from today on. After the season it is only "6 odigrano", and a league
      without nights shows no summary above its empty state.
    - The participle after a count agrees with it: "1 odigrana", "2 odigrane", "6 odigrano" (also Raspored's
      "17 večeri · 2 odigrane"), and Nova liga's "1 odabrana", "2 odabrane", "0 odabrano". The design only shows the
      "odigrano"/"odabrano" form, which is right for 0 and 5+.
    - Nova liga refuses a name another league already has (any case), as Podaci does when renaming: "Druga liga već
      ima to ime." under Ime lige, before sending and from the server. "_" and "%" in a name are plain characters
      in that check (the team-name check too); before, the server read them as wildcards.
    - Below 1200 px Nova liga puts Sezona on a row of its own, so Početak and Kraj are wide enough for
      "01.09.2026."; from 1200 px the three share a row as designed.
    - Raspored's back button is the design's chevron ("Natrag", to Početna) instead of a house. Its list marks
      Odigrano, Sljedeća and Zadnja as designed, plus "Nije odigrano" for a past night without rounds (#28) and
      "Večeras" for the next night on the night itself (kept from before). Alternative: "Sljedeća" also on the night.
      Reason: on a league night "Sljedeća" reads as next week's.
    - Not in the design: after the season Raspored's card reads "Zadnja večer" with the last night's date and
      "Sezona je završila" (before: "Sljedeća večer —"). A league without nights shows no card and no count, only
      "Admin još nije upisao večeri lige." in the list.
    - Kept from before, not in the design: the league switcher shows only for a player in more than one league, and
      "Nađi zamjenu" sits under the list.
    - Burza igrača offers only the league's nights for a substitute (the form lists them, the server refuses any
      other date with "Liga te večeri ne igra."); unchanged.

38. **Smokers and smoking tables in Croatian** (handoff §4; updates #32). Novo kolo's Pušački stolovi card, the
    Pušački raspored and the rest of Novo kolo use the design's Croatian copy, and the counts agree with their number:
    "Stolovi 1, 2 · 7 pušača u 6 ekipa" ("1 pušač u 1 ekipi"), "2 pušačka stola × 3 kola · 6 ekipa s pušačima",
    "Kreiraj kolo · 14 ekipa", "2 ekipe ne igraju", "2 neaktivne · 0 isključenih". The design shows "2 ekipa ne igra",
    "2 neaktivnih" and English leftovers ("Create round · 14 teams", "Smokers", "Share", "Off").
    - The rule that gives out the smoking tables stays as #32 describes, as you asked then: teams that haven't sat at a
      smoking table tonight come first, then the teams with the most missed nights, and only then the points. "Kako se
      biraju stolovi" now says exactly that in three steps: the design's first sentence; then that matches with a team
      that hasn't sat at a smoking table tonight come first, and of those the ones where such a team has the most missed
      nights; then the points that decide between matches with the same priority: ten for every team that hasn't sat at
      a smoking table tonight (the design leaves these out, and they let two such teams beat one team with more
      smokers), one per smoker at the table, and up to three more for a team under its share this season (up to three
      fewer above it), followed by the design's table-order sentence. **Open for you:** the handoff's single score
      instead, without the first two tiers. It is simpler to explain, but when smoking tables are scarce, teams with
      one smoker go more nights without one (the simulation behind #32).
    - The rotation keeps the Propušteno column (nights with a smoker but no smoking table) after the design's Ekipa,
      Pušači, Večeras and Udio, because the rule uses it; the line under the heading explains both Udio and
      Propušteno. The Večeras column widens for a fifth round so its dots don't overlap Udio.
    - Layout changes from the design, so the extra column and a big league fit at 1024 px: Pušači, Udio and Propušteno
      are 56 px (design 64 and 84 px), and the Propušteno header breaks onto two lines ("Propu-šteno"); below 1200 px the
      Pušački raspored splits half and half (design 1.25 : 1), or the team names in the rotation are cut to about
      50 px. In Novo kolo the error and "Kreiraj kolo" stay in view under the left column and only Postavke, the
      smoking card and Bilješke scroll above them, because a 76-team league has five rows of table chips and the button
      fell below the fold at 1024 × 768. Alternative: the design's whole-column scroll with the button at its end.
    - "Označi sve" switches the active teams on the list on or off, as in the design: it shows on when all of them
      play, and an inactive team is added only with its own switch. Before, an inactive team kept it off and one click
      paired the teams that stopped coming.
    - While the Pušački raspored is open, Tab and screen readers can't reach the Novo kolo view under it; closing it
      puts the focus back on the button that opened it.
    - "Pušiš li?" is asked once, as the handoff says: "Preskoči", the backdrop or Escape save Ne (and that it was
      answered), and the Pušač switch on Moj profil changes it; the sheet's line already ends "Možeš promijeniti na
      profilu.". Before, "Kasnije" asked again every time the app was opened. If saving Ne fails, the sheet comes back
      the next time the app opens. Alternative: keep "Kasnije". Reason: "Kasnije" (later) promises another chance to
      answer, but the app never asks again, so a smoker who meant "later" would stay a non-smoker.
    - Copy the design doesn't have: the button that opens the plan "Pušački raspored · rotacija ›", "Uključi barem
      dvije ekipe da odabereš stolove.", "Večeras još nema kola · N ekipa s pušačima", "Večeras nema pušačkih stolova ·
      3 kola · N ekipa s pušačima" (tonight's rounds were made without them), "nijedna ekipa nema pušača" in place of
      "0 pušača u 0 ekipa" and "0 ekipa s pušačima", "Večerašnja kola još nisu napravljena.", "U ovom kolu nema
      pušačkih stolova.", "Nijedna ekipa u ovoj ligi još nema pušača.", the dot labels "Kolo N: pušački stol / običan
      stol / nije za stolom", the chip "Isključena" (design "Off"), and the repeat dialog "Neke ekipe bi se večeras
      srele dvaput" with "Proširi prozor" and "Kreiraj svejedno" (the Admin upute's words).

39. **Moji oglasi** (handoff §5, design 11c; adds to #29). Burza's header has "Moji oglasi" with the number of the
    player's open ads. It opens `/burza/moji`: Aktivni and Prošli tabs, a card per ad with its kind, Aktivan / Istekao /
    Zatvoren and when it closes, Pogledaj and Zatvori oglas on an open ad, Objavi ponovno on a past one, and Novi oglas
    at the bottom (the same "Što objavljuješ?").
    - The button shows only to a logged-in player, since Burza stays public and a visitor has no ads; with no open ads
      it shows without the number. On the desktop it sits next to Objavi. On a phone narrower than 340 px it is only
      the person icon and the number (its name stays for screen readers), so the "Burza" title keeps its room.
    - Objavi ponovno puts the same ad up again: it is reopened and counts as new ("upravo", first in Burza), so the card
      leaves Prošli and the tab switches to Aktivni, as in the design. Alternative: publish a copy and keep the old ad
      in Prošli. A substitute ad whose night has passed or was removed opens Trebam zamjenu filled in with its league,
      team, player, note and phone number, to pick a new night; the old ad then stays in Prošli, and the form's back
      (and the chevron on "Oglas je objavljen") returns to Aktivni, where the new ad is. An old availability ad without
      any phone number opens Dostupan sam the same way (Burza lists no ad without a number; the server refuses it with
      "Oglas nema broja mobitela. Upiši ga u obrascu Dostupan sam."). A partner ad whose league has ended can't go up
      again: instead of the button its card says "Liga je završila" (the server would answer "Ova liga je završila.").
      When the same ad is already open (an availability ad, a partner ad for the same league, a substitute ad for the
      same team, night and player), that one comes up first in Aktivni with "Već imaš ovakav oglas" instead of a copy;
      the tapped ad stays in Prošli. A new ad and one published again go through the same checks
      (`_lib/burzaStatus.ts`), each with its own words.
    - Only the author publishes an ad again, admins included (they can still close anyone's ad, #29). Zatvori oglas
      closes without asking, as in the design; the card moves to Prošli as "Zatvoren upravo", the keyboard moves on to
      the next ad (or the Prošli tab) and a screen reader hears "Oglas je zatvoren.". Each tab opens at its top, where
      a card that has just moved there is.
    - Copy the design doesn't have, written the #29 way: "Ekipa Dalmatinci traži zamjenu" and "Liga Utorak · uto
      13. 10. · umjesto: Ivan Perić" (design "Dalmatinci trebaju zamjenu", "umjesto Ivana Perića"); "Zatvara se sam
      kad liga završi, 15. 12." (a league without an end date: "Aktivan dok ga ne zatvoriš"), "Istekao kad je liga
      završila 15. 12.", "Istekao: večer je uklonjena iz rasporeda"; "Dodaj broj mobitela da se oglas vidi u Burzi."
      (a link to Dostupan sam) on an old availability ad without any number (Burza doesn't list it, so the header's
      count leaves it out while Aktivni counts it); the errors "Odaberi novu večer.", "Više nisi u toj ekipi.", "Ekipa
      više ne igra u toj ligi.", "Igrač kojeg mijenjaš više nije u ekipi." and "Možeš ponovno objaviti samo svoj
      oglas.". Prošli lists the latest 50.
    - The desktop page has no design: the phone's tabs above a grid of cards as in Burza, and Novi oglas in the header.
    - "Oglas je objavljen" gets the design's back chevron on the phone. "Gotovo" (to Burza, on the ad's tab) stays next
      to Podijeli, though the design has only Podijeli. A partner ad's line there is the design's "Ovako ga vide drugi.
      Zatvori ga kad nađeš partnera." (it used to add "a sam se zatvara kad liga završi", which isn't true of a league
      without an end date). The Dostupan sam form now says "Dok si dostupan, oglas stoji u Burzi. Zatvori ga u Mojim
      oglasima." (the profile lost its switch in #29).

40. **Deactivated and deleted players, and who sees whose personal data** (handoff §6 "Privacy" and "Račun"). A player
    now has `active` and `deleted_at` (migration `20261012130000_player_active`; a deleted player is always inactive).
    The admin controls that set them come with the player pages.
    - Another player's personal data goes only to that player and to admins: a regular user gets their first and last
      name and whether the account is active, and the server leaves out the username, email, phone, birth date, smoker
      flag and admin role. Usernames are hidden everywhere else too: team rosters send them only to admins and to the
      player themselves (rosters are in Croatian name order) and a round's teams not at all, Moj profil's team chips show the teammates' first names with both initials (the
      design shows usernames in 13e; the Player page's chips in 13c show first names), Rejting no longer sends them
      and its search looks at names only, and finding a player to add to a team is for admins only. Kept: Tko igra
      ovu rundu? still shows the usernames under the names to the players of that round, as in design 7c.
    - "Neaktivan" is shown to everyone, not only to admins: it isn't on the handoff's private list, and it explains why
      a teammate isn't offered any more.
    - A deactivated player can't log in. With a password, after the right password, the form says "Račun je
      deaktiviran. Javi se administratoru."; with Google they come back to Prijava with the same words. A login that
      is already open ends on the next thing they do: the first request that is refused sends them to Prijava, which
      says the same. Prijava shows such a message once (a reload or a new try clears it). They aren't offered when
      admins search for a player to add to a team, nor in Tko igra ovu rundu? (also not picked by default): when a
      lineup saved before the deactivation names them, the open round's screen puts an active teammate in their
      place, and saving a lineup with them says "<ime> ima deaktiviran račun. Odaberi drugog igrača."; a finished
      round keeps who played. Their results and rating stay, and they stay on Rejting.
    - A deleted player disappears from Rejting (the list, the total and every rank), from player search and the
      admin lists; their page and rating detail answer "Igrač ne postoji." (Rejting shows "Igrač ne postoji · Možda
      je obrisan ili je poveznica pogrešna." instead of the connection error). The rounds they played still count for
      everyone else's rating.
    - A deleted player's row is anonymised and can never log in again (no password, Google unlinked, email replaced).
      If that person signs in with Google again, a new empty account is made; the app keeps nothing of the old email
      to refuse it. Alternative: keep a hash of the old email and refuse it.
    - Copy the design doesn't have: "Prijava s Googleom nije uspjela. Pokušaj ponovno." when a Google login fails or
      is cancelled (before, NextAuth's own English page; a database error while checking the account reads the same,
      not "deaktiviran"), and "Igrač bez imena" for a player without a name on Rejting, Burza and Raspored (there is
      none today; the username was shown before, also to logged-out Burza visitors).

41. **What admins can do to a player, and ratings that stay put when a team's players change** (handoff §6 "Admin
    controls"; adds to #40). This is the server side of the desktop Igrači directory and "Uredi osobne podatke"; their
    screens come with the player pages.
    - Spremi changes the name, username, email, phone, birth date, Pušač and Admin in one go. A username or email
      that another player already has (ignoring case) is refused under that field: "To korisničko ime je zauzeto." or
      "Taj email se već koristi.". An admin can't take the admin role from themselves, and can't deactivate or delete
      themselves. The last active admin keeps the role.
    - Deaktiviraj račun logs the player out on every device (their sessions are deleted, as planned) and closes their
      ads that are still up; an ad that had already expired stays "Istekao" with its own date. Aktiviraj račun doesn't
      reopen the ads; the player can publish them again from Moji oglasi. Because the sessions are gone, a login that
      is open at that moment ends on the player's next request at a plain Prijava, without the "deaktiviran" message
      #40 describes for an open login; they see "Račun je deaktiviran. Javi se administratoru." when they try to log
      in again. Alternative: keep the sessions while the account is inactive (they are refused anyway) and delete them
      on Aktiviraj račun, so the open login ends with that message at once. A deactivated player can't be added to a
      team, old or new ("Igrač je deaktiviran."); adding one who is still in the team changes nothing.
    - Obriši igrača takes the player out of every team, deletes their ads (these hold a phone number and a note), logs
      them out and unlinks Google. The account becomes "Obrisani igrač": username obrisani_<id> and an email address
      that can't receive mail. A teammate's substitute ad that names them reads "umjesto: Obrisani igrač". Adding a
      deleted player to a team reads "Igrač ne postoji.".
    - **Ratings don't change when a team's players change.** All 1013 rounds rated so far are older than lineups. They
      are rated with each team's players as they are today, so adding or removing a player used to change other
      players' ratings at the next recalculation. On a copy of the data, deleting two players, taking one player out
      of a team and adding two would have changed 57 ratings, by up to 170 points. Now, before a team's players change
      (Dodaj, Ukloni, Obriši igrača), the team's current players are saved as the lineup of each of its finished rounds
      that has none. With that, the same changes and a few more left every player's rating and rating history exactly
      as before.
      - The lineup key now includes the team (migration `20261012140000_round_player_team_key`). One old round has a
        player on both teams' rosters and was rated for both sides; the new key keeps them on both sides.
      - Tko igra ovu rundu? still starts from the founders when a team's last lineup is such a saved roster (more
        than two players).
      - A finished table that an admin re-pairs in Dnevni poredak loses its saved lineup along with its result, so
        Tko igra ovu rundu? asks again when it is played (before, a lineup picked on Start Game stayed and the new
        game skipped that step).
    - A new team can start in no league (the directory's "Nova ekipa"). A request that names no league still joins
      the league being played now, as before.

42. **The numbers on the Team and Player pages** (handoff §6 "Data / API"; the pages themselves come next). Both pages
    need a login (Q7); a team or player that doesn't exist, a deleted player and the bye team answer "Ekipa ne
    postoji." / "Igrač ne postoji.".
    - A team's place and points in a league are its row in that league's Ukupni poredak (the same order, so teams
      level on points still get different places, as on the standings page). Before the team has finished a round
      in a league it has no place there ("–"). Najbolje mjesto is its best place over the leagues it has played in;
      on a tie the running league, then the newer one.
    - A league is "U tijeku" until its end date has passed. The older leagues have no end date: they count as ended
      ("Završeno") once their last night has passed, the same way Raspored says "Sezona je završila". A league with
      neither is still running. Running leagues are listed first, then the newest.
    - Zadnje večeri on a Team page are its last 4 nights, one line per night and league, with the rounds won, drawn
      and lost and the point difference exactly as Dnevni poredak counts them (a round against the bye team is a win).
      Draws are shown only when there are some: "2 pob · 1 ner · 1 por".
    - The players of a team are in rating order, with the rating, rounds and Privremeno from Rejting. Their usernames
      reach only admins and the player themself. A player who isn't on Rejting (never on a team, no rated round) has a
      page with their rating (1500 for a new player), Privremeno and no place. Rejting has no detail for them, so on
      their page the rating is not a link (no chevron) instead of opening "Igrač ne postoji". Moj profil keeps its
      existing fallback for the same case (the rating strip opens the Rejting list).
    - A team's avatar is the first letter of its name (Q14). On the Player page the teams are in name order, each
      team's leagues newest first ("Liga A · Liga B +1"), and the chips show every player of the team with their first
      name in the team's rating order, the order of the Team page's Igrači (frame 13c: Ivan 1712, Marko, Krešimir).
      Moj profil's chips stay in name order.

43. **Back and Home on the Team, Player and related pages** (handoff §6 "Pages stack: Back returns to the previous
    page, and the mobile top bar also has Home"). The phone top bar of these pages has Back, the page kind ("EKIPA",
    "IGRAČ") and Home; on the desktop a white pill above the page goes back and names the page it returns to
    ("‹ Puleni"), or says "Natrag" when that page has no name of its own (Ukupni poredak, Početna).
    - Back is the browser's Back: it returns to the page you came from, step by step (Team → Player → Rejting → Back →
      Back), also when you went from a player back to his team by a link (that team page then returns to the player).
      Jumping several pages back at once (the browser's history menu) lands on that page with its own Back. Moj profil
      names itself, so a team opened from it says "‹ Moj profil".
    - A page opened from the desktop menu or by a link from outside the app (a shared link, a new tab) has no Back;
      Home is always there on the phone, the menu on the desktop. Početna and the menu's pages start afresh: Back
      never goes past them, but the phone's own Back gesture still steps back through everything before them.
    - Moj profil gets "Stranica ekipe ›" on every team card, on the phone and on the desktop (the desktop design has
      none; the handoff asks for it on Moj profil). Its rating strip shows "Privremeno" like Rejting, also before the
      player's first rated round (then without a place, still opening the Rejting list). Each desktop column of Moj
      profil scrolls on its own. A team's name is never cut short: in a narrow column the pill moves under the name.
      On a narrow strip (the desktop's 360 px column, phones under 390 px) Privremeno sits under "REJTING".
    - A desktop scroll arrow steps aside while the pointer is on a link or button it would cover (a "Stranica ekipe ›"
      pill at the top of a scrolled column), so the link can still be clicked.

44. **The Team and Player pages** (handoff §6, design 13a–13c, 13f, 13g, 13k–13o). Every logged-in player can open
    them: a team from Moj profil's "Stranica ekipe ›" or a player's page, a player from a team's Igrači. They are the
    same for everyone; the admin's controls come with the Ekipe and Igrači directories (until then an admin sees the
    plain page too).
    - The phone Team page has the three tiles of the desktop (Najbolje mjesto, Igrači, Lige; the handoff lists them
      under the header card, the phone mockups have none) and no "2 igrača · 2 lige" line. Igrači and Lige get a small
      labels row ("IGRAČ · REJTING", "# · LIGA · BOD") as the handoff's columns; Lige shows the place in a circle (gold,
      silver, bronze for 1–3) and the points as a number instead of the mockup's "#2 / 33 bod". Zadnje večeri has no
      labels row.
    - A league row reads "Jesen 2026 · U tijeku" or "Završeno"; a league without a season says only that. League names
      and the leagues under a player's team wrap instead of being cut short (they differ at their end: "… Proljeće
      25/26", "… Jesen 25/26"); a night's result breaks only between counts, and the next line starts with the
      separator ("1 pob · 3 ner" / "· 0 por").
    - On the phone, "Tvoja ekipa" sits in the header card's top-right corner on a line of its own above the name, so a
      long team name keeps the card's whole width and never breaks inside a word ("Balkonski / špijun").
    - A deactivated player's row on a Team page has a small red "Neaktivan" tag on its second line; their own page has
      it next to the name (under it on the phone).
    - A player who isn't on Rejting has "Mjesto –" and "od N igrača", and their rating doesn't open the rating detail
      (#42). The Player page's tiles read "od 25 igrača" for every number (genitive after "od") and "kola · još
      privremeno" while the rating is provisional.
    - A team or player that doesn't exist (or a deleted player) shows "Ekipa ne postoji" / "Igrač ne postoji" with
      "Možda je obrisana/obrisan ili je poveznica pogrešna." and a Početna button. A page that failed to load shows
      "Ekipa se nije učitala" / "Igrač se nije učitao" with Pokušaj ponovno; a page already on screen stays when a later
      refresh fails.
    - In a desktop window under 800 px high (a 1024×640 laptop window) the cream header is smaller and the back pill
      ("‹ Puleni") moves up into the header row next to the menu button, so the columns below keep room for their
      rows; each column scrolls on its own.
    - The phone Najbolje mjesto tile keeps the league name on one line, cut at its end ("Pitanik Bela…"): at about 80 px
      neither two lines nor cutting its start showed the season readably, and the Lige card just below lists every
      league with the team's place.

45. **Links between the pages, and a league's table opened from a team** (handoff §6 "Links between pages", design
    13d). Every row of Dnevni and Ukupni poredak (also on the desktop Početna) and every podium card opens its team's
    page; the team's name is the link and covers the row. On the public Ukupni poredak the rows are links only for a
    logged-in player (the Team pages need a login, Q7).
    - A team's league row opens that league's Ukupni poredak with `?team=<id>`: that team is highlighted instead of the
      player's own (one highlighted row; a cream row with the navy bar, also on the podium; a navy ring around a desktop
      podium card) and scrolled into the middle of the list. The page is then a page of the stack, as in 13d: on the
      phone Back, "LIGA" and Home on top, the league's name, "Ukupni poredak" and the season's state ("Sezona 2025 ·
      završeno", "Jesen 2026 · u tijeku"; "Završeno" / "U tijeku" for a league without a season: the same rule as the
      Team page's "U tijeku / Završeno"), and no Početni zaslon button. On the desktop it is laid out like a Team page
      (Profiles P:145-174, P:320-357): "PIATNIK BELA LIGA" in the header, the back pill ("‹ Puleni") on top of the page
      column (in a short window up in the header row, as on the Team page), then the league's name in navy and
      "Ukupni poredak" at 40 px. In this view there is no league picker (the mockups have none). Someone not logged in
      who opens such a link gets the ordinary public table with the team highlighted.
    - A season stored as numbers only (Nova liga suggests the year, "2026") reads "Sezona 2026", here and in the Team
      page's league rows; a season with words in it ("Jesen 2026") stays as written.
    - The phone Ukupni poredak card has the labels row of 13d ("#  EKIPA … RAZ  BOD") on top, pinned with the podium,
      also without `?team` (13d is the only phone design of the table). Dnevni poredak keeps its design without it.
    - RAZ in the standings is written with a real minus sign ("−42"), as on the Team and Player pages and in 13d.
    - The rating detail's cream card opens the player's page ("Profil ›" on the phone, "Profil igrača ›" on the
      desktop; the pill is the link and covers the card). The phone detail has Back, "REJTING" and Home on top; Back
      returns to wherever the detail was opened from (the list, a Player page, Moj profil), and to the list when it was
      opened from outside the app. The desktop Rejting opened from a Player page has a back pill ("‹ Ivan Perić") where
      the Team and Player pages have it (under the header; in a short window next to the menu button) and scrolls the
      player's row into the middle of the list.
    - Back to a page puts it as it was left: Ukupni and Dnevni poredak, the desktop Početna's two tables and Rejting
      keep their list's scroll position, and the desktop Rejting the player picked in the list (Back from that
      player's page returns to them, not to the player in the address, which doesn't follow the pick yet).
      Arriving by a link starts at the top, or at the highlighted team. A row reached with the keyboard is scrolled
      clear of the pinned labels and podium.
    - The pages name themselves for the next page's back pill: a league's table by the league's name, Dnevni poredak,
      Početna and Rejting by those words (#43 had "Natrag" for Ukupni poredak and Početna).
    - /league/current/<page> keeps the link's query (`?team=`, `?date=`). Opened from outside the app it only forwards,
      so the page it lands on is a fresh start with no Back (it used to count as a step from the forwarding page).

46. **The admin's Ekipe and Igrači, and the admin controls on a Team page** (handoff §6 "Routes and navigation" and
    "Admin controls", design 13h, 13j, 13o, the nav of 3a; replaces Manage Team). Desktop only: on the phone an admin
    gets "Ovo se uređuje na računalu." for /teams and /players and sees the Team and Player pages without controls;
    anyone who isn't an admin is sent from /teams and /players to Početna.
    - The menu's ADMIN group is Upravljanje ligom, Nova liga, **Ekipe** and **Igrači** (as 3a). Burza igrača gets a
      person-with-magnifier icon, so no two items share one. Manage Team and its addresses are gone: /teams/new
      (?league=) and /teams/add-teammate only forward to Ekipe (a real redirect in next.config.mjs, so an old bookmark
      opened in a fresh tab lands there too).
    - Ekipe and Igrači show a 290 px list next to the page of the one picked: every team / every player but the deleted
      ones, in Croatian alphabetical order, with the count of all of them, 12 at a time ("Učitaj još"). A team is found
      by its name or a player's name or username, a player by name or username. A team's line is "3 igrača · 2 lige", a
      player's "@iperic · Dalmatinci" (all their teams; a deactivated player has the small "Neaktivan" tag). /teams and
      /players open the first one of the list, and the address then names it. The picked one is always in the list, with
      at least half a page of rows after it (so the list doesn't seem to end there), scrolled into view when the page
      was opened by a link. The list keeps its search and scroll while the page beside it changes, and Back to it from
      another page (a league's table, a player's page) brings back its search, its pages and its scroll.
    - Picking from the list starts afresh, like a menu item: no back pill, and the page crossfades instead of sliding. A
      link inside the page keeps the page stack: a player opened from a team shows the Igrači list (the menu marks
      Igrači) with "‹ Puleni".
    - On a Team page an admin always sees (no edit mode): the pencil next to the name, which turns it into a field (✓ or
      Enter saves, Escape cancels; an empty name is "Upiši ime ekipe.", another team's name ignoring case "Ekipa s tim
      imenom već postoji.", in a small white note over the tiles under the field with a red icon and ink text, so the
      header card keeps its height and the ✓ stays level with the field); "Dodaj igrača · ime ili korisničko ime", which
      on focus lists the active players who aren't in the team ("Nema takvog igrača." when typing finds none); a remove
      button on every player row ("Ukloni iz ekipe", at once, no confirmation, as designed); "Dodaj u ligu · ime lige"
      with the other leagues, running ones first ("Sezona 2026 · U tijeku"; long league names wrap, since they differ
      only at the end), "Ekipa je već u svim ligama." under it for a team in every league, and "Lige se nisu učitale."
      with Pokušaj ponovno when the list doesn't load. Every change is saved at once and shows at once, here and in both
      lists (a player being added shows with a spinner until the server sends their rating); a change the server refuses
      is undone and its reason shown in that card until the next change. Leaving a league stays in Upravljanje ligom.
    - "Nova ekipa" (not designed; plan Q13) opens an empty team in the page with its name field ready, the columns as
      13o ("0 igrača", the labels rows, empty); ✓ makes the team and opens its page, where players and leagues are
      added. From the list the team is in no league; from Upravljanje ligom's "Nova ekipa" it joins that league, which
      the empty Lige card names. Escape goes back to Upravljanje ligom, or to the team that was open in the list.
    - "Pozovi igrača" (not designed; plan Q12) copies the sign-up link (…/signup) and says "Poveznica za registraciju je
      kopirana." for 4 s on a line over the button; without access to the clipboard it shows the link to copy by hand.
      Players sign up themselves and are added to teams once they have an account.
    - In a window under 800 px high (a 1024×640 laptop) every Team and Player page's header card is smaller (a smaller
      name, and tiles of two lines with the sub line after the number), and in Ekipe / Igrači the header's title too,
      with a back pill in the header row. In a window under 1360 px wide the page next to the list has two columns:
      Igrači (on a player's page Ekipe) keeps its own, the other two cards share the second column, each still scrolling
      on its own: the upper one (Lige, Osobni podaci) takes what it needs up to 60% of the height, the lower one (Zadnje
      večeri) the rest, so both titles are always in view; while the upper card's add field is in use, the lower one
      gives way down to its title. **Open decision for the user:** the handoff asks for three equal columns, each
      scrolling on its own; next to the 290 px list a 1024–1359 px window leaves the three columns 8–30 px for names, so
      this two-column layout is not designed (alternative: three narrow columns with smaller rows, or the list collapsed
      under 1360 px).
    - Copy that no design gives (open for review): "Upiši ime ekipe." (empty name); "Upiši ime nove ekipe i spremi ga."
      (under Nova ekipa's field); "Igrače dodaješ kad spremiš ime ekipe." (Nova ekipa's Igrači); "Ekipa ide u ligu
      {liga} kad spremiš ime." / "Ekipa ide u odabranu ligu kad spremiš ime." (Nova ekipa's Lige from Upravljanje
      ligom); "Dodajem u ekipu…" (a player being added); "Ekipa je već u svim ligama."; "Lige se nisu učitale.";
      "Nijedna ekipa ne odgovara pretrazi." / "Nijedan igrač ne odgovara pretrazi." / "Još nema ekipa." / "Još nema
      igrača." (the lists); "Još nema ekipa" + "Napravi prvu ekipu." and "Još nema igrača" + "Pozovi ih poveznicom za
      registraciju." (/teams and /players with an empty list); "Poveznica za registraciju: {poveznica}" (no clipboard);
      "Ime ekipe nije spremljeno.", "Igrač nije dodan u ekipu.", "Igrač nije uklonjen iz ekipe.", "Ekipa nije dodana u
      ligu.", "Ekipa nije napravljena." (when the server gives no reason).

47. **The admin's controls on a Player page, and "Uredi osobne podatke"** (handoff §6 "Admin controls", design 13j;
    adds to #41 and #46). Desktop only, always visible; on the phone an admin sees the Player page without them.
    - Ekipe: "Dodaj u ekipu · ime ekipe" lists, on focus, the teams the player isn't in ("3 igrača · 2 lige"; "Nema
      takve ekipe." when typing finds none), and every team row has a remove button ("Ukloni iz ekipe", at once, no
      confirmation, as on the Team page). A change shows at once on the page and in the Igrači and Ekipe lists; one the
      server refuses is undone and its reason shown in the card. For a deactivated player the field is greyed with
      "Deaktivirani igrač se ne može dodati u ekipu." (the server refuses it, #41). A team removed with the keyboard
      moves the focus to the next row's remove button (the one before, for the last row; "Dodaj u ekipu" when no team
      is left).
    - "Uredi podatke" opens the panel over the page; the list next to it stays as it is, and picking another player
      closes the panel. Spremi sends only the fields that were changed (a Spremi with no change just closes), so an
      old username that breaks today's rules stays as it is until someone edits it. What is wrong is said under its
      field before anything is sent, in the server's words; a username or email another player has is said under
      that field (both at once). Odustani, Zatvori, Escape and a click on the dimmed page close the panel and drop
      what was typed; while Spremi or a Račun action is on its way they do nothing (Odustani and Zatvori are greyed),
      so the answer, a refusal included, is always seen in the panel. The birth date is a date picker (the mockup has a
      text field); a date with a part missing ("dd.01.1993.") is "Neispravan datum rođenja." under the field, not a
      removal (only a date picker emptied of every part removes the date). The phone is saved as "+385 91 234 5678".
      The panel has its own scrollbar and none of the desktop's round scroll arrows (they covered its switches and
      buttons).
    - An admin editing themself: the Admin switch can't be changed, its note adds "Svoja administratorska prava ne
      možeš ukloniti." to the designed one, and there is no Račun section (the server refuses all three for yourself,
      #41).
    - Račun: each button opens its confirmation in its place (Odustani or Escape cancel only the confirmation). A
      confirmed action applies at once, apart from Spremi. After Deaktiviraj the page and the list show "Neaktivan"
      at once and the buttons read "Aktiviraj račun". After Obriši trajno the next player the list shows opens in the
      page's place (the one before, when it was the last), as if picked from the list (no back pill), and the
      player is gone from the list and from their teams. With a search on, it is the next player the search shows; a
      search that shows no other player is cleared, and the next player of the whole list opens, so the page and the
      selected row are always together. An admin who picked another player while the delete was on its way stays
      there. The plan had Igrači open its first player instead, which would lose the admin's place in a long list.
    - Copy no design gives (open for review): "Deaktivirani igrač se ne može dodati u ekipu.", "Igrač je već u svim
      ekipama." (a player in every team), "Svoja administratorska prava ne možeš ukloniti." (yourself), "Promjena nije
      spremljena." and "Igrač nije obrisan." (when the server gives no reason).
    - The round scroll arrows of the desktop lists now go away when the list under a still pointer does (they stayed
      over the page after the panel was closed with Escape).

48. **Rejting in pages, the picked player in the address, and the last fixes before release** (handoff §7 and "Done
    when"; design 8a–8m; adds to #45).
    - Rejting shows 50 players at a time, with "Učitaj još · još 77 igrača" as the last row of the list (phone and
      desktop). Without a search the first page reaches down to your own row by its place on the list, rounded up to
      ten (the 141st row → 150 rows; players with the same rating share a #, so the place counts, not the #), so your
      highlighted row is always in the list; on the desktop it also reaches the player a /ratings/<id> link opened, and
      the list opens with that row (else your own) in the middle. A search matches names only (usernames are private)
      and keeps each player's place on the whole list; it starts again at the first page and at the top of the list.
      The whole list still comes in one request (a few hundred players at most), so no server paging was needed. When
      "Učitaj još" loads the last page with the keyboard, the focus moves to the first new row (also in the Ekipe and
      Igrači lists).
    - Desktop: picking a row puts the player in the address (/ratings/<id>) without loading a new page, so the search
      and the scroll stay; a reload or a shared link opens that player, and Back from the Player page opened from the
      detail comes back to them. The phone and desktop searches look as designed (white without a border on the
      phone, paper on the desktop) and have an "Očisti" button, as does the Ekipe and Igrači search. While the list or
      a player's detail loads, grey placeholders breathe instead of a spinner. On the desktop, the "no rounds yet" card
      has no icon and no shadow.
    - Under 1280 px wide (1024×640) the desktop list has narrower number columns and a 360 px detail, and "Privremeno"
      moves next to the team under the name, so the names stay readable (they were 2 px wide). On a phone under 380 px
      the detail's rating is a size smaller so "+15 zadnja večer" fits beside it (under 340 px it goes under it).
    - Final pass over every screen at 375×812, 1440×900 and 1024×640: the phone rating detail no longer scrolls
      sideways (a hidden screen-reader text was as wide as the card); on a short window (under 800 px high) the
      desktop scorepad's hand entry and the admin's table scorepad are a little smaller and their keys never squeeze
      into each other, and the admin's panel fits whole at 1024×640, "Spremi igru" included (it scrolls only with an
      error note); Upravljanje ligom · Ekipe has a narrower "Dodaj ekipu" column under 1280 px, a team's name wraps
      and its players go onto more lines; a username too long for a player chip ends in "…" and shows whole on hover;
      the league picker gives way to the rounds in Dnevni poredak's header. The last English error ("Trump caller
      team is not set") now reads "Prvo odaberi tko je zvao.".
