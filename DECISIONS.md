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
    - Početna's card counts other teams' substitute ads ("1 ekipa traži igrača"), not the player's own. Burza ·
      Zamjene's date filter counts the same way (#49): other teams only, each team once however many nights it asks
      for, for "Svi datumi" and for the picked night (it used to count every ad, the player's own included).
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
      a malformed id) is a 404 with "Runda ne postoji." / "Meč ne postoji.", not a 500; so is a malformed id of an ad,
      league, team, table or result (#49).
    - A rejected form (zod) answers `{error, issues}`: `error` is the schema's own Croatian message ("Ime lige je
      obavezno."), or the route's sentence ("Liga nije napravljena.") where zod would use its English one.
    - A league's numbered round is "kolo" ("To kolo ne postoji.", "Kolo nije obrisano."); the round a player plays
      at a table is "runda" ("Ne igraš u ovoj rundi.", "Ova runda je već završena."), like the designed "Nema otvorene
      runde" and "Tko igra ovu rundu?".
    - The live pill and label say "UŽIVO" instead of the design's "LIVE". Alternative: keep "LIVE" as in the
      mockups. Reason: the handoff asks for Croatian everywhere, and the Admin upute say "uživo".
    - "Učitaj još · još N ekipa / igrača" under paged lists, and "Pokušaj ponovno" on error notes, as designed.
    - The bye team's side reads "Slobodna runda" wherever it shows (#49: the round's tables and their search, Parovi,
      the admin's re-pairing and table scorepad); the team's row in the database keeps its internal name. The hand
      entry's developer check reads "Prvo odaberi tko je zvao." (#48).

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
      "Oglas nema broja mobitela. Upiši ga na Moj profil."; the profile has had a Mobitel row since #52). A partner ad whose league has ended can't go up
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
      ovu rundu? still shows the usernames under the names to the players of that round, as in design 7c, while the
      round is open; a finished round's lineup is for admins only (a player gets 403 "Ova runda je već završena.",
      #49).
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
      Igrači (on a player's page Ekipe) keeps its own scroll, and the other two cards are stacked in the second column,
      each as tall as its rows, and that column scrolls as a whole (#49; at first each card scrolled on its own, the
      upper one taking up to 60% of the height). An add field that is open keeps its text and its list when the window
      crosses 1360 px. **Open decision for the user:** the handoff asks for three equal columns, each scrolling on its
      own; next to the 290 px list a 1024–1359 px window leaves the three columns 8–30 px for names, so this two-column
      layout is not designed (alternative: three narrow columns with smaller rows, or the list collapsed under 1360 px).
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

49. **The last audit pass** (handoff "Done when"; updates #29, #34, #40 and #46).
    - **Raspored with more than one league:** the switcher shows each league's whole name. Names often differ only at
      their end ("Pitanik Bela Liga Proljeće 25/26" / "… Jesen 25/26"), and both tabs used to be cut at the shared
      start. On the phone the tabs share the width and a name wraps onto a second line (after two lines it ends in
      "…"; the whole name shows on hover); on the desktop the strip is as wide as the names, up to 60% of the window,
      and gives way to the title by wrapping the same way. The eyebrow then names only the team ("PULENI"), since the
      league is in the tabs (it used to lose the team at the end of a long league name); with one league it stays
      "<liga> · <ekipa>".
    - **Burza · Zamjene** counts the teams looking for a player as Početna does (#29), so "3 ekipe traže igrača" on
      Početna opens "Svi datumi · 3 ekipe traže igrača". A night with only the player's own ad reads "0 ekipa traži
      igrača" above that ad.
    - **Croatian error pages** (not designed; copy open for review). An address the app doesn't have, and a page's own
      "not found" (/league/current/<page>), shows "Stranica ne postoji" / "Možda je poveznica pogrešna." with Početni
      zaslon, and the browser tab says "Stranica ne postoji · Piatnik Bela Liga" (before, Next's English "404: This page
      could not be found."). Logged out, most addresses still go to Prijava first (the middleware), so only the public
      ones reach it. A page that breaks while it is shown says "Nešto je pošlo po zlu" / "Pokušaj ponovno ili se vrati
      na početni zaslon." with Pokušaj ponovno (it renders the page again) and Početni zaslon (before, Next's English
      "Application error"); when the app's frame itself breaks, the same page brings its own theme and fonts, and
      Početni zaslon loads the app afresh. On the phone Početni zaslon is at the bottom, as on the other screens; on the
      desktop it is under the message, an outline button under Pokušaj ponovno.
    - **Moj profil's username hint** reads "Po ovom imenu te administrator pronalazi kad te dodaje u ekipu." (it said
      teammates find you, but only admins add players to teams now, #46). Upravljanje ligom's Kola tab has a list
      icon (the design's `event_list`), no longer a calendar like Datumi's next to it.
    - **Team and Player pages next to the admin's lists** under 1360 px: the stacked second column scrolls as a whole
      (#46). On the phone a one-word team name never breaks inside the word: the name gets smaller, down to 22 px
      ("VuglecBrežani" at 320 px); a long word that still doesn't fit breaks as before. A league line breaks before
      "· Završeno", not inside it. The desktop's round scroll arrows go away when a panel covers the list under them.
    - **Standings:** Dnevni poredak breaks ties on points and difference by team name, so places no longer swap
      between loads and live refreshes (Ukupni poredak already did). Phone rows under 390 px have a smaller stats line
      and closer columns so it never runs under RAZ; under 375 px the "21 OK ·" part is left out (screen readers still
      read it) and under 340 px RAZ is a size smaller. The phone Dnevni poredak date is smaller under 360 px, so it ends
      before the arrows. The desktop Dnevni poredak tabs that don't fit fade out at that side, scroll with the mouse
      wheel, and the open or keyboard-focused tab is kept clear of the fade. Početna's Ukupni poredak card has no
      labels row, as in 3a.
    - **The bye** reads "Slobodna runda" (#34). **A finished round's lineup** is for admins only (#40). **A malformed
      id** in an address of an ad, league, team, table or result answers 404 with its "… ne postoji." (#34; the
      /burza/<id> page then says "Ovaj oglas ne postoji."). A login sent without a username or password answers "Upiši
      korisničko ime i lozinku.". API handlers nothing called any more are gone (GET /api/players,
      /api/teams/add-teammate, /api/session, POST /api/rounds and /api/rounds/[id]/finish, GET /api/roundMatchups, PUT
      /api/burza/availability); the /teams/add-teammate page address still forwards to Ekipe.
50. **The play day is optional** (your request). Nova liga and Upravljanje ligom · Podaci show "Dan igranja ·
    neobavezno": no day is picked at first, and tapping the picked day clears it. With a day, the nights fill in from
    the start and end as before; without one, the admin adds the exact nights one by one.
51. **Trebam zamjenu asks who the substitute plays with** (your request). Step 3 was "Tko ne može?", but a team has up
    to six players, so who can't come told the substitute nothing. It is now "Tko traži zamjenu?" with "Zamjena igra s
    tim igračem." under it: the same list of the team's players, the logged-in player first as "Ja · Ime Prezime" and
    already picked (mostly they ask for themselves); a teammate can be picked instead. Deactivated teammates aren't
    offered, and the server refuses one that isn't an active player of the team ("Igrač s kojim zamjena igra mora biti
    u ekipi.", or "… više nije u ekipi." when publishing again). The ad says who the substitute plays with where it
    said whom they replace: "Igra s: Ivan Perić · rejting ekipe oko 1550" on the Burza card, an "Igra s" row on the ad's
    page, "Liga Utorak · uto 13. 10. · igra s: Ivan Perić" on Moji oglasi, and "igra s: Obrisani igrač" for a deleted
    player (names aren't declined, #29). This replaces "umjesto" in #39 and #41. MarketPost.out_player_id is renamed to
    with_player_id (migration 20261013120000_burza_with_player; ads already up keep their player, now read as "igra s"),
    and Objavi ponovno fills in the form with &with= instead of &out=.
52. **Mobitel on Moj profil** (your request). Podaci has a Mobitel row between Prezime and Datum rođenja, edited in
    place like the birth date (typed "091 234 5678", saved "+385 91 234 5678", an empty field removes it). Burza fills it
    into new ads, and an availability ad without a number now points to Moj profil instead of the Dostupan sam form.
53. **"Suigrač" instead of "igra s"** (your request; updates #51). The ad names the player the substitute plays with
    as "Suigrač: Ime Prezime" (card), a "Suigrač" row (ad page) and "suigrač: Ime Prezime" (Moji oglasi), which reads
    naturally without declining the name. The hint under "Tko traži zamjenu?" is gone.
54. **A substitute ad gives the suigrač's rating, not the team's** (your request; updates #29). The card reads
    "Suigrač: Marko Blažević · rejting 1335" (nothing after the name before their first rated round), the line under
    the team name gives only the league, and the ad page's row is "Rejting suigrača" ("Još nema" before a rated round).
55. **When a night starts** (your request). Like the play day it is optional: Nova liga and Upravljanje ligom · Podaci
    have "Početak večeri · neobavezno", a time field with a button that empties it (no time). It is the league's time
    for every night; Datumi has a Početak column with each night's time ("20:00 zadano" for the league's, bold for the
    night's own, "—" without one), and a night still to be played (no rounds, not past) gets a pencil to set its own
    time and a button back to the league's ("Vrati zadani početak (20:00)"). Dodaj večer takes an optional time too; a
    time equal to the league's isn't kept as the night's own, so the night follows a later change in Podaci. The server
    refuses another night's change with "Početak se mijenja samo večerima koje još nisu odigrane." and a wrong time
    with "Početak večeri mora biti vrijeme od 00:00 do 23:59.". Players see it after the date in Raspored ("sri 14. 10.
    · 19:00", in the list and on the Sljedeća večer card) and on Početna's Sljedeća večer card; a night without a time
    shows only its date, as before. League.start_time and LeagueNight.start_time are "HH:MM" text (migration
    20261013150000_night_start_time), not a Postgres TIME, which Prisma would read as a date and time that a time zone
    can shift.

56. **A deactivated smoker doesn't count for smoking tables** (found while checking round creation; adds to #32 and
    #40). Novo kolo, Pušački raspored and a table changed on Dnevni poredak count a team's smokers among its active
    players only. A deactivated player stays on the team (#40) but can't play, so their Pušač no longer sends the
    team's match to a smoking table or shows in the team's smokers. A table already seated keeps the smokers it was
    seated with (#32). A deleted player had already left every team.

57. **Rounds are published after an admin approves them** (your request, design mDraftView). Desktop only, as all of
    Upravljanje ligom: on the phone it still says "Ovo se uređuje na računalu." (you didn't want approving there).
    - **Data:** Round.status (DRAFT, APPROVED, PUBLISHED) and published_at (migration 20261014120000_round_status:
      the rounds that exist become PUBLISHED, without a publish time; a CHECK keeps the time on published rounds only).
      A Round row is one table, and a round ("Kolo 4") is a round number on a night, so every table of a round carries
      the round's status; a table added later takes it from the others. PATCH /api/rounds/:id/approve and /unapprove
      take any table of the round and change all of them. Rounds are created by POST /api/rounds/generate-multiple
      (the old POST /api/rounds went in #49), now as drafts; a bye table is still settled 2:0 at once and counts in
      the standings when its round is published.
    - **Who sees what:** everything players and visitors read takes published rounds only, filtered on the server:
      Dnevni poredak (nights, tables, the night's table), Ukupni poredak and the +/−, Početna (the open table, its
      opponent, Započni igru), the menu's live dot, Raspored's played nights, the Team page's last nights, Rejting and
      which league is the active one. A player gets 404 for an unpublished table (GET /api/rounds/:id and its matches)
      and can't start, confirm the lineup of or enter results in one; an admin is refused too, with "Ovo kolo još nije
      objavljeno.". Admins see unpublished rounds only in Skica and Kola: Dnevni poredak shows them what players see.
    - **Skica:** Kreiraj kolo opens it for tonight's new rounds; it is also there while the league has a night with
      rounds not published yet (the latest such night). The tab counts them and turns into "Objavljeno" with a check
      once they are all out, until the page is left. As designed: the round on the left with its status, its tables
      and "Odobri ovo kolo" / "Odobreno" (a second click takes it back); on the right the night's rounds with their
      approvals, "Odobri sva kola", "Objavi odobrena kola · X/Y" (X approved, Y not published yet; off at X = 0; only
      the approved ones go out, in one transaction) with its note, and "Nešto ne valja?" with "Odbaci skicu", which
      asks first and deletes only the rounds not published yet. When every round is out: "Sva kola su objavljena" with
      the time and Otvori Dnevni poredak.
    - **Round numbers count up through the season** (the second night plays Kolo 4–6, as Dnevni poredak's tabs say),
      so the title is "Kolo 4" and the date line says where it is in the night ("Srijeda · 14.10.2026 · 1. od 3"),
      instead of the design's "Kolo 1 od 3", which would read "Kolo 4 od 6".
    - **Words:** the design's "Igrači i prezentacija vide …" says "Igrači i Dnevni poredak vide …", and the last card
      "… a Dnevni poredak prikazuje sva kola ove večeri." (the app has no presentation view, #58). With some rounds
      already out, "Nešto ne valja?" says "Odbaci neobjavljena kola i vrati se na Novo kolo. Objavljena kola ostaju.".
    - **Kola** shows "Skica" and "Odobreno" for rounds not published yet, then "Nije počelo", "U tijeku" and
      "Odigrano" as before. **Datumi** won't remove a night that has only a draft: "Ova večer ima skicu kola. Prvo je
      odbaci na kartici Skica.".
    - **Gone:** the pairings page shown after Kreiraj kolo (/round/pairings/N) and GET /api/roundMatchups/N: Skica
      shows the tables now, and nothing else linked there.
    - **Colours:** the publish button switched off is lineFill (the design's #E3DED3 isn't a token); the ring of the
      last card is a new tint.green[35] (the design's value), next to tint.red[35].
    - prisma/usefulQueries/round/insertRound.sql inserts its round published, as it was meant to be live.

58. **Promjena mjesta (+/−) on Ukupni poredak** (your request, design is.league). Each team's change of place since
    the league's previous night: green ▲ and the places gained, red ▼ and the places lost, grey "–" for the same place.
    - **Worked out with the standings, no new table.** The server ranks the table as it was after the previous night
      (the published rounds closed by then, counted as update_team_score counts them) and compares it with the table
      now; one query over a season's rounds takes milliseconds. A StandingsSnapshot table would have to be rewritten
      whenever an admin corrects an old result, and the computed table can't drift from the standings. Checked on the
      production copy of 13.10.: the computed table matches TeamScore for every team.
    - **Which nights:** the league's nights with published rounds. The change counts from the night before the last
      one played, so on tonight's night it is "since last week" and moves with every finished table; the note under
      the desktop table names that night ("… od prošle večeri lige (07.10.2026).").
    - **Places:** both tables rank the league's teams now, in Ukupni poredak's order (points, difference, name), so a
      team that joined later doesn't move the others. A team that hadn't played by the previous night wasn't in that
      table: "–", "Prošle večeri još nije bila u poretku".
    - **Not shown** (showMovement false: no column, pills, chips or note, the table as before) on the league's first
      night and once the league is over. Over is the app's "Završeno" (the status line on Ukupni poredak and the Team
      page): the end date has passed or, for a league without one, its last night in Datumi has. The older leagues
      have no end date, so the end date alone would show last April's change on them forever. **Piatnik Bela Liga
      Jesen 2026 has no end date and Datumi has only its played nights**, so between nights it counts as over (and
      the Team pages already say "Završeno"): set its Kraj in Podaci, or its nights in Datumi, and +/− shows between
      nights too.
    - **Desktop:** a "+/−" column right after "#" (tooltip "Promjena mjesta od prošle večeri lige", like the other
      headers), a pill next to each medal and the note under the table; each mark's tooltip is "Gore 2 od prošle
      večeri", "Dolje 1 od prošle večeri" or "Isto mjesto kao prošle večeri", and a click on it opens the team like
      the rest of the row. **Phone:** a chip after the team's name, in the pinned top three too. The arrows are the
      filled icons, not the Rounded ones (#4), whose triangle is a third smaller than the design's.
    - GET /api/leagues/:id/standings answers {standings, showMovement, movementSince}, every row with its movement.
    - The design's presentation view (Prezentacija on Dnevni poredak) isn't in the app, so there is nothing more to
      follow these rules.

59. **Admin na mobitelu** (your request of 15.10., Claude Design "Admin mobilni ekrani", komponente/AdminMobile; plan in
    ADMIN_MOBILNI_PLAN.md). An admin runs the league from the phone too. **This replaces #36 and #57**: the phone no
    longer says "Ovo se uređuje na računalu." to an admin. It is built screen group by screen group; this entry grows
    with each.
    - **Who gets it:** an admin below 1024 px (the app's one breakpoint, #5; the prompt's "< 900 px" would leave
      900–1023 with neither layout). The same addresses as the desktop: a screen is the phone version of its page, so a
      link works on both and crossing 1024 only changes the layout. The server checks every admin call as before.
    - **Prikaz igrača:** Večer lige switches to the app as players see it; Početna then has an "Admin" button next to
      Moj profil that switches back. Kept for the browser tab (sessionStorage), so a reload keeps it.
    - **Bottom bar:** Večer · Rejting · Ekipe · Igrači (the design's four, your answer), on those four screens only;
      the screens under them have Back. A tab starts the page stack afresh, like the desktop menu.
    - **Večer lige (01) is the admin's Početna on the phone.** The league is picked in the eyebrow (the sheet says it
      holds for every screen and ends with "Nova liga"). The navy card follows tonight (the night Novo kolo is for,
      until 06:00 the evening before): "Kolo 1 od 3 · u tijeku" with "7 / 10 stolova završeno" and Dnevni poredak; a
      finished night ("3 / 3 kola odigrano"); a night without published rounds ("Kola još nisu kreirana" with Novo
      kolo, or "Kola čekaju objavu" with Skica kola); a day without a night shows the next one. "od 19:00" is the
      night's start time (the app keeps no time for a round). "Skica čeka objavu" is the latest night with rounds not
      published yet, and it isn't repeated when the navy card already says so. "Još igraju" lists the current
      round's open tables, live points or "Uživo" / "Nije počelo", refreshed every 30 s and with Osvježi. "Bilješke
      lige" are the league notes of Novo kolo (#47), on Večer too as designed.
    - **Novo kolo (06, 07, 07b)** is the desktop's Novo kolo (useCreateRound: the same saved choice for tonight, the
      same rules) laid out for the phone: Broj kola večeras 1–5 (the desktop's limit, your answer; the design has
      1–3), Veličina prozora − 8 +, "20 / 20 ekipa igra večeras" with Promijeni and the teams that sit out (a tap
      puts one back), Pušački stolovi (44 px table buttons, no Pušački raspored, which is a desktop overlay), Bilješke
      lige and "Kreiraj 3 kola · 10 stolova". There is no pairing mode: neither the design nor the app has one.
      "Tko igra večeras?" is a sheet 88% of the screen high whose search field is its last part, kept above the
      on-screen keyboard (visualViewport). An inactive team can be switched on for tonight there, as on the desktop,
      so its note says "Neaktivnu ekipu možeš uključiti samo za večeras." instead of the design's "Neaktivne mijenjaš
      u Upravljanju ligom.".
    - **Skica kola (14–17)** uses the desktop's calls and texts ("Objavi odobrena kola · 1/3", publishNote): Kolo 1 ·
      Kolo 2 · Kolo 3 with their status icons, the round's status, Odobri / Odobreno, its tables, Odobri sva, and the
      bin for "Odbaciti skicu?". Once every round is out: "Sva kola su objavljena · Igrači vide svoje stolove od
      18:42." and Otvori Dnevni poredak. Creating rounds opens Skica in Novo kolo's place, and discarding goes back to
      Novo kolo.
    - **Odobri sva is one request now**, POST /api/leagues/:id/nights/:date/approve (admin, one transaction under the
      league's lock), on the desktop too: a loop of PATCHes could stop halfway on a phone's connection.
    - **Dnevni poredak (18–22)** is the players' phone screen with, for the admin: Back instead of Početni zaslon,
      "Osvježeno 19:42" with Osvježi, and on a round's tab the pencil (a check while editing). A table's card opens
      the table (not the slobodna runda). Editing gives "Dodaj stol s dvije ekipe" and Uredi par / Ukloni stol on
      every card, with the desktop's rules (useTableEdits, planSeats on the server: a team taken from another table
      swaps with the one it replaces) and its notes ("Alz Menš igra za stolom 4. Zamijenit će mjesto s ekipom …").
      The round's eyebrow counts the tables ("Kolo 2 · 10 stolova"). The date arrows stay (the design has none, but
      without them an earlier night can't be reached). The open tab is in the address (?round=), for everyone, so
      Back from a table or a team comes back to it.
    - **No drop-down for a team any more** (your answer): Uredi par picks each team by searching, on the phone in the
      sheet's own list with the search last (above the keyboard), on the desktop in a field that lists the teams on
      focus and narrows them while typing. It was the app's only <select>.
    - **Stol, Tko igra and Meč (23–29)** are the admin's phone screens at the desktop scorepad's address
      (/league/:id/daily-standings/table/:roundId), using its calls (the server recounts standings and ratings, so a
      finished match can be corrected too; this is #59's part of KLIKOVI's §3.3). Stol: both teams with their wins in
      the round, Meč 1 and Meč 2 (Završen / U tijeku / Nije počeo, a tap opens one; the next one only after the one
      before), who plays (or "Nije potvrđeno") with Promijeni igrače, and Nastavi meč N / Potvrdi igrače i počni. A
      table not started doesn't jump to Tko igra by itself as on the desktop: the button says so. Tko igra is the
      players' screen with the admin's shield, and Back to the table; confirming opens Meč 1. Meč is the players'
      scoreboard (?mec=N) with Back to the table and the shield; a hand is entered or corrected in the players' three
      steps (&igra=new|id&korak=1|2|3, so the phone's Back steps back), which now draw with the same parts as the
      players' (WizardParts), and Spremi returns to the board. Added on the admin's steps, as your answer to P3:
      **Ručni unos** on step 1 (each team's points only, no zvanja, not limited to 162; a manual hand opens straight
      in it) and **Obriši igru** with "Obrisati igru?" when correcting. Završi meč (in the winner's colour) after the
      first match opens Meč 2, after the second Kraj kola (?kraj=1, the players' cards, RoundResultCards) with
      Natrag na stol. While the table is played it refreshes every 15 s and when the app comes back to the front.
    - **Upravljanje ligom (05, 08–12)** on the phone: the league in the eyebrow, + for Nova liga, the navy Novo kolo
      card ("čet 15. 10. · 20 ekipa igra": the admin's choice for tonight, else the active teams), then Ekipe · Kola
      · Datumi · Postavke (the tab in the address). The desktop's state and rules moved into hooks both use
      (useLeagueDetails, useLeagueDates). **Ekipe:** "Dodaj ekipu · ime ekipe" lists the teams outside the league on
      focus, each team's switch (active) and its bin, asked in "Obrisati ekipu iz lige?" (the desktop keeps its 8 s
      Poništi). **Kola:** the nights latest first, each round with its tables and status (the desktop's Skica,
      Odobreno, Nije počelo, U tijeku, Odigrano; the design shows Objavljeno for all published ones), the bin asks
      "Obrisati kolo?". **Datumi:** Sljedeća večer, a date with Dodaj, and the nights; a night still to come opens a
      sheet with its own start time (your answer: Datumi and Postavke have the start time too) and "Makni večer" when
      it has no rounds (removing an empty night isn't asked, as in the design). **Postavke** is the desktop's Podaci:
      name, season, dates, the play day (optional, a second press takes it back), Početak večeri, Kola po večeri 1–6
      and Spremi promjene ("Spremljeno" after it).
    - **Nova liga (13)**: the same fields, then the league's nights as chips with × (filled in from the dates and the
      play day, one can be added); Kreiraj ligu makes it the picked league and opens its Ekipe. Teams are added there
      (the desktop's Nova liga picks them in the form).
    - **Rejting, Ekipe and Igrači (30–39).** Rejting is the players' list with the bottom bar instead of Početni
      zaslon. **Ekipe** and **Igrači** are the phone's lists (search, 12 at a time with "Učitaj još", the search and
      scroll back with Back): a team's line is "2 igrača · Liga Utorak, Liga Četvrtak", a player's "Dalmatinci ·
      rejting 1712" with Admin or Neaktivan (GET /api/admin/players now says admin and rating). Ekipe has + for Nova
      ekipa, Igrači "Pozovi igrača" (the desktop's login link, your answer). **Nova ekipa** is a screen of its own
      (×): the name (not another team's), at least two players found by name (your answer; the desktop and the server
      still allow fewer), and the leagues to join, the picked league ticked (the API takes one league, the others are
      added after). **The Team page** gives the admin the desktop's pencil, "Dodaj igrača" with a remove button per
      player (44 px) and "Dodaj u ligu" (useTeamAdmin). **The Player page** gives "Uredi podatke" (the desktop panel's
      fields in a sheet, usePlayerForm), the teams with "Dodaj u ekipu" and their remove buttons, the Administrator
      switch (saved at once here, with the form's Spremi on the desktop; not for oneself) and Račun: "Deaktivirati
      račun?" / "Aktivirati račun?" and "Obrisati igrača?" in sheets with the design's text; after a delete Igrači
      opens.
60. **Ekstra navigacija: a table and a team open from the round** (your request of 15.10., Claude Design "Mobilni
    ekrani" 14a–14ab, komponente/ScorepadScreens, StolPregled and ScorepadPhone admin-edit; admin-mobile 23–25;
    preparation in the untracked KLIKOVI_UPUTE.md). Phone only: the desktop's frames aren't drawn yet, so the desktop
    round view and the admin's desktop "Uredi" stay as they were.
    - **Kolo N card, two targets (14a–14g):** a team's name opens the team, the rest of the card the table. The name's
      area is its text only, 44 px high and at least 44 px wide, so the space beside a short name opens the table. No
      link inside another: the table's link is a layer under the card's content and the names are links over it.
      Pressing a name tints the name (#EFEBE1), pressing the card darkens the card; the keyboard reaches the table's
      link, then both names, with a visible ring. A › at the end of the "Stol N" line, Završeno / Nije počelo next to
      it (– for the wins of a table not started); a bye card is "Bez stola" · Slobodna runda, without a table link and
      with only the real team's name linked. Signed out: nothing opens. In "Uredi" (admin) nothing opens either.
    - **Who gets what for a table:** the player whose open table it is (the one Početna offers) gets the navy pill
      "Nastavi igru ›" / "Započni igru ›" and goes straight into the game as from Početna; a shared link to that table
      goes there too (replacing the link). Anyone else signed in gets **Pregled stola** (14h–14n), and the admin on the
      phone the table's **scorepad** (an admin in Prikaz igrača is a player here). The admin's desktop is unchanged.
    - **Pregled stola** (`GET /api/rounds/:id/overview`, signed in, published rounds only, else 404 "Stol ne
      postoji."; each hand's totals, nothing about callers or zvanja): ‹ STOL ⌂, "Kolo 3 · uto 17. 02.", Stol N with
      the smoking mark and Uživo / Završeno / Nije počelo, the two boards with the wins in the round and the name as a
      link (the viewer's own team cream with a navy ring), Meč 1 · Meč 2 ("1034 : 748 · Purgeri", "u tijeku · 312 :
      480", "nije počeo"), the chosen match's hands read-only, no button at the bottom. A live table refreshes every
      15 s and when the app is back in front ("Osvježava se samo · prije 5 s"). Loading, "Stol se nije učitao" with
      Pokušaj ponovno, and "Stol ne postoji" with Natrag na Kolo N. A team opened from it says "‹ Stol 4".
    - **The admin's scorepad on the phone** (14s–14ab; replaces #59's "Stol · mečevi" centre, which is no longer in
      the flow): the table opens on its board, the current match. ‹ goes back to the round, the shield sits in "Stol 2 ·
      Kolo 3", and Tko igra is the button on the right (confirming there comes back to the board). Meč 1 · Meč 2 once
      the second match is there; a finished match and a finished table say "… je završen(a). Izmjene mijenjaju
      rezultat i poredak." and have no buttons at the bottom. A tap on a hand opens its sheet: both teams' points,
      Ispravi korak po korak (the players' three steps; a hand entered by points starts afresh), Ručni unos, and Obriši
      igru with "Obriši igru 2?" ("Igra 72 : 110 briše se iz Meča 2. …"). Next to Upiši igru / Završi meč, "Ručno"
      opens Ručni unos for a new hand: each team's points 0–9999 typed in two fields, no zvanja, no 162 limit, Spremi
      igru / Spremi ispravak, and "Spremanje nije uspjelo. …" when it fails. A table not started still goes to Tko igra
      first.
    - **Back** follows the existing patterns: the round's tab is in the address, the round's list keeps its scroll
      (as the night's table did), and the Dnevni poredak entry is called "Kolo N" while a round's tab is open, so a
      team's page says "‹ Kolo 3". Tablica okupljanja and Ukupni poredak rows already opened their team (#45) and
      already darken when pressed.

61. **Lokacija okupljanja** (your request of 15.10., Claude Design "Claude Code - lokacija okupljanja.md": Desktop
    ekrani 11b, Admin mobilni ekrani 11–13b, Mobilni ekrani Početna and Raspored). Next to its start time a league
    has an optional place: Ime mjesta, Adresa and Link na Google Mape (League.location_*, migration
    20261015120000_night_location), and a night still to be played can have its own (LeagueNight.location_*; a night
    has its own place when its location_name is set, and then all three are the night's). Nova liga (desktop and
    phone) and Podaci / Postavke have a section **Okupljanje** with "Vrijeme okupljanja · neobavezno" and the three
    fields, saved with the rest of the form. Datumi shows "19:30 · Caffe bar Kartaš" under each date (the night's own
    bold, the league's muted, a gold "!" for a night with its own time or place); a click on a night still to be
    played opens it in **Okupljanje večeri** (desktop card, phone sheet) with Zadano lige · Drugo mjesto, Vrati na
    zadano and Spremi, which sends only what changed (PATCH /api/leagues/:id/nights/:date takes start_time and/or
    location; null goes back to the league's). The link is only checked to be http(s), so a "javascript:" link can't
    run; a wrong one is said in the form's error note. Players see the place on Početna's Sljedeća večer card (Karta
    opens the link in a new tab) and in Raspored (the card's pill, a line under each night, a map button for nights
    to come). A league without a place looks as before. Where the handoff and the mockups differed:
    - With a place, Početna's date pill and Raspored's first line show only the date, as in the mockups, because the
      time is on the place's line; without a place they keep "sri 14. 10. · 19:00" as before (the handoff said to keep
      nightTimeLabel and add the line, which would show the time twice).
    - Raspored's "!" says "Drugo vrijeme ili mjesto": mySchedule's ownPlace (as the handoff defines it) doesn't say
      which of the two differs.
    - The phone sheet keeps Makni večer under Vrati na zadano · Spremi (the mockup 11b doesn't show it, but it was the
      only way to remove a night on the phone).
    - "Kreiraj ligu" already had flex: none (PrimaryButton), so it stays 60 px high when the form scrolls; nothing to
      change there.
    - A league address or link without a name is saved but not shown anywhere (a place needs a name).

62. **Skica: more Kola, no numbers on drafts, seating, Slobodna runda** (your request of 18.10.; desktop first, then the
    admin's phone once you approved it on 19.10.).
    - **One draft at a time.** While tonight's rounds wait in Skica (drafts or approved), Novo kolo shows "Večeras čeka
      skica" with Otvori skicu instead of Kreiraj kolo, and the server refuses a creation (409 DRAFT_WAITING; the page
      then reloads its rounds and shows the note). Once they are published or discarded, Kreiraj kolo works again for
      the same teams: the old guard that took the same teams for a double click (and handed back tonight's rounds not
      started yet, published ones too) is gone, as the draft rule now stops a second click. A draft left from an
      earlier night doesn't block tonight. The phone's Novo kolo shows the same note in place of Kreiraj.
    - **No numbers until publishing.** A round waiting in Skica is Skica A, B, C… (Round.draft_order, migration
      20261019120000_draft_order, which letters the drafts already waiting); its round_number only keeps its tables
      together. Objavi odobrena kola numbers the approved ones after the league's last published round in letter order,
      so publishing only Skica C makes it the next Kolo with no gap; the drafts left keep their letters. Skica (and the
      phone's Skica kola), the Kola list (both) and the smoking plan say Skica A for a draft; the "2. od 3" under the
      date is gone. Skica keeps showing the round it showed after publishing moves it.
    - **Uredi stolove in Skica**, on a round not published yet: the same dialog as Dnevni poredak (a click on a table
      re-pairs it, a team taken from another table swaps places), Novi stol and the bin. Editing an approved round
      leaves it approved; Odobri is hidden while editing. Under 1280 px wide the tables are one column, so names fit.
      On the phone's Skica kola it is the pencil beside the bin, as on Dnevni poredak's phone: the round's tables become
      the edit cards (Uredi par, Ukloni stol, Dodaj stol s dvije ekipe) with the pair sheet; the bin and the publish
      buttons wait until the check ends the editing. A bye table reads 2:0 in the round's list there as on desktop.
    - **Slobodna runda** is first in the team picker of both dialogs (Dnevni poredak and Skica), for an existing table
      or a Novi stol: that table is closed at once 2:0 (two 301:0 matches, as a bye table made by Novo kolo) and a
      published round counts it in the standings straight away. Picking it never takes it from another table: several
      teams can have it in one round, and the team it replaces sits the round out, which the dialog says. A team taken
      from a bye table leaves its opponent the bye; a bye table left with no team is removed.
    - The dialog's notes now come from the same seating plan as the server (_lib/tableSeats.ts), which also fixes a
      re-pairing where one team stays and the other comes from another table ("A vs B" → "B vs C"): B was seated twice
      and A dropped; now A takes C's old seat.

63. **A night runs until 06:00** (found while doing #62; your choice of 19.10.: the 06:00 rule for tonight's rounds).
    Until now two rules lived side by side: Večer lige, the phone's Novo kolo and the saved Novo kolo settings took
    the night until 06:00, but the server put a round created after midnight on the next date, and the repeat check,
    the draft lock, the smoking plan, Dnevni poredak's "večeras" (and its medals), the desktop's live dot and Početna's
    "Večeras" switched at midnight. Now one helper, leagueNightString / leagueNight in _lib/dates.ts (createRoundNight
    is gone), decides tonight's night everywhere a round's night matters: a round created at 00:30 goes on the
    evening's date, the repeat check sees the pairs played before midnight, and the night stays one rating period. A
    bye table's matches take the table's own night (before, the day it was edited). Plain calendar days stay on
    leagueDateString: birth dates, Burza, sponsors, Raspored, Datumi, a league's end. Your real nights (the backup of
    13.10.) never had a match start after midnight, the latest 23:52, so nothing stored needs moving. A test reads the
    round files and fails if one goes back to the midnight day.

64. **Pairing by the teams' average age** (your request of 21.10.: the weakest factor of the pairing, but a factor).
    - A team's age is the average of its active roster players' ages on the night of the pairing (_lib/matching/
      teamAges.ts, service/team/ages.ts); a player without a birth date counts as 24 (your choice of 21.10.), so only
      a team without players has no age. So does a player whose birth date makes them younger than 18 (your choice
      of 22.10.): the backup of 22.10. had one born that very day (the date field allows today) and one aged 2, which
      put a team at 12. With it entered: average 27.9, median 24.8, 167 of 338 active players without a date.
    - The order of the factors is unchanged and the age comes last: the standings make the windows, then the fewest
      earlier meetings (squared) and no pair twice tonight, the bye as before; only between pairings equal in all of
      that do teams of a similar average age meet. Inside the blossom a pair's price is meetings² × ageScale + the age
      gap, where ageScale is above the age gaps of a whole night, so no age difference ever buys an extra meeting.
    - The gap is in whole years, at most 40 (past that, teams are simply far apart). Two teams without an age are 0
      apart, one without an age is 20 from every team with one. Alternative: 0 from everyone. Reason: a team without an
      age then became a wildcard that split two teams of the same age (a test shows the case).
    - `npm run ages:report` (scripts/ageReport.ts, reads only) shows it on a database such as a backup: the ages as
      entered (average, median, by decade, how many players have none), every active team's average, and the next
      rounds planned with and without the ages side by side (earlier meetings, repeats, age gaps, the tables that
      differ). The rounds are planned one after another, so the first round takes the closest pairs and a later one
      can get a wider gap; the night's average gap still goes down.
    - Smoking tables and table numbers don't change: they are decided after the pairing, as before.

65. **Turniri** (your request of 25.10., Claude Design "Natjecanja" and "Turniri admin"; your answers and the plan of
    26.10.). One-day tournaments: teams sign up (with a waiting list), Kolo 1 is drawn at random, every later Kolo is
    paired by the standings, a table plays one or two matches, and the standings are points then difference.
    - **A tournament's table is a league table.** Every table of a Kolo is an ordinary Round (round_number = the Kolo)
      linked through TournamentRound, so the scorepad, Tko igra, Pregled stola, the admin's scorepad, Uredi stolove and
      the rating work as they are. Migration 20261026120000_tournaments fills the empty Tournament tables (date, times,
      place, Kolos, matches per table, zvanja, limit, fee, rules link, sign-ups open, started, cancelled), adds the
      entries' status (REGISTERED, WAITING) with who signed up and when, the prizes (TournamentPrize), and on Round
      matches_per_round (1 or 2) and declarations (false = bela only), copied from the tournament when a Kolo is made.
      Every league table keeps 2 and true. On a copy of the backup of 25.10. only this migration was waiting; the
      1,210 rounds came out at 2 and true, nothing else changed, and a full rating replay gave every rating, deviation,
      volatility and the whole rating history byte for byte as before.
    - **One rating period** (your choice of 25.10.). Every Kolo's tables have the tournament's date as round_date, so
      the replay (which goes by date) rates the whole tournament as one night with no change to the rating code. A
      league night on the same date would fall into the same period. Alternative: a period per Kolo. Reason: your
      answer.
    - **Publishing Kolo 1 starts the tournament** (your choice). It sets started_at and closes sign-ups. Until then
      everything can change. After it, Prijave don't change any more, the date, Partija po kolu and Zvanja are locked,
      and Broj kola can still go down to the Kolos already out, so the admin can end early. Otkaži and Obriši are there
      only before the start; a cancelled tournament stays under Završeni as Otkazan.
    - **Kolo 1 needs sign-ups closed** (C1 shows that state). Reopening sign-ups drops a draft. Objavi refuses Kolo 1
      with 409 STALE_DRAFT ("složi ponovo") if the teams in changed after the draft was made. Alternative: draw while
      sign-ups are open. Reason: a team signing up late would be left out of a draft the admin already checked.
    - **Pairing.** Kolo 1 at random. From Kolo 2 the Swiss system: one maximum-weight matching (the blossom the league
      uses) over all teams, plus the bye when their number is odd. What counts, in this order, each far above all of
      the next: no earlier meeting (and no second bye), then the bye on the lowest team without one, then neighbours
      in the standings (the gap between their places, squared). So nobody meets twice while any other pairing works
      (the Skica names a repeat it couldn't avoid), the last team gets the bye even when that keeps the leaders apart,
      and otherwise 1st meets 2nd, 3rd meets 4th: the Monrad kind of Swiss (FIDE's Dutch rule pairs the top half of a
      points group with its bottom half). The bye is a win, 2:0 (1:0 at a table of one match), as in the league. No
      smoking tables or age factor (stated with the defaults, not objected to). A test plays 23 teams through 9 Kolos
      with no repeat and no second bye. Alternative: the league's windows. Reason: they have no rank distance, so a
      Kolo could pair the first with the tenth.
    - **The next Kolo is drafted by itself** once the last table of a Kolo closes (also when the admin opens the
      tournament, if that was missed); the admin checks it and publishes it. The last Kolo played makes the tournament
      Završen.
    - **Standings** are counted from the tables when they are read (TeamScore is the league's): points (a win 2, a
      draw 1), then the difference over every match played (the bye's 301:0 included), then the team's name, the
      league's order.
    - **Sign-ups.** One team per player in a tournament, the waiting list included. The waiting list goes in sign-up
      order. When a team signs off, is removed or the limit grows, the first team waiting comes in by itself, with no
      notice (the design's rule). Ubaci u turnir lets a waiting team in and raises the limit by one; a lower limit
      sends the last ones signed up to the waiting list. A team needs two active players with an account. A player
      signs up one of their teams, or makes a new one with a teammate found by name (names only, as usernames stay
      private, #40); for a teammate without an account Pošalji poziv shares the sign-up link. A waiting team's players
      see "Na listi čekanja · N." (no frame for it; drawn on R2).
    - **Teams of three or more** say Tko igra before every Kolo, as in the league (your choice).
    - **Bez zvanja means only bela (20)** (your choice of 26.10.). The scorepad has a single Bela button, once a hand
      (the phone's steps, the computer's hand entry and the admin's), and the server refuses 50 to 200 and a second
      bela. A table of one match says Meč, not Meč 1 od 2, has one win circle per team and closes after its match.
    - **Burza igrača stays one board** (your answer): no tournament ads; anyone can post, signed up or not. Početna ·
      Turniri shows its card as Liga does.
    - **Public, read-only pages** (your choice): Turniri, Završeni turniri, a tournament's page, Poredak i rezultati
      and its teams open without logging in, with no ratings, photos or usernames; Prijavi se goes to the login and
      back. The tables' pages stay for players who are logged in.
    - **Players on the computer** get the phone's pages in a centred column inside the menu (your choice).
    - **Početna** has the switch Turniri · Liga under the header, remembered on the phone (bela.homeTab). The first
      time it opens on Liga, or on Turniri for a player in no league or playing a tournament today; while the player's
      tournament is live and Liga is shown, Turniri has a red dot. Liga is the old Početna, its Započni igru for a
      league's table only (the menu's Započni igru takes any). Turniri: the player's table on the day, else the next
      tournament, then Burza igrača, Nadolazeći turniri and Završeni turniri. The rating sits next to the profile and
      opens Rejting. The computer's Početna shows the next tournament above the tables.
    - **The app is Belatronika** (your choice of 26.10.): the header, the page titles, the install sheet and the
      installed app's name. The bell stays as the icon and on the sign-in pages; the leagues' names don't change.

66. **Turniri: where the screens follow the league instead of the frames** (your rule of 26.10.: use the league's
    components and patterns where a frame drifts from them).
    - **Computer, Kola (C1–C4):** the tables are Dnevni poredak's rows without photos (Skica lige has none), so the
      names fit; one column while they fit the card, else two, as Dnevni poredak. Uredi stolove is the league's (the
      pair dialog, Novi stol, the bin) on a draft and on a published Kolo. A table opens the league's admin scorepad
      and Pregled stola, whose links lead back to the tournament. Confirmations are inline, as in Upravljanje ligom.
    - **Phone, Upravljanje turnirom (M2–M9):** as Upravljanje ligom on the phone: the back button, the header, the navy
      card (before the start the card itself is the Prijave otvorene switch; after it the Kolo being played, which it
      opens) and the tabs inside the scrolling column. Dodaj ekipu is the dashed field opening a sheet (M13), since
      the teams come from the server's search with the reason one can't come in (the league's field filters a list it
      already has). Removals, Otkaži and Obriši are asked in sheets (M4, M11, M12).
    - **Phone, Skica (M6)** is the league's Skica kola: the list of tables, and the pencil for Uredi stolove (the edit
      cards and the pair sheet) instead of a ⇄ on every row. The bin (Odbaci skicu) is Složi ponovo, since the app
      drafts a tournament's next Kolo by itself. Long team names take two lines there, in the league too (#67).
    - **Phone, a published Kolo (M7)** is Dnevni poredak's round on the admin's phone: Osvježi, the pencil, the table
      cards with wins and the points of the match being played, each opening the admin scorepad. The ratings in
      brackets beside the teams aren't shown (Dnevni poredak has none).
    - **Phone, Kola (M5):** a played Kolo says Odigrano (the frame has Objavljeno), as on the computer; a published one
      says Objavljeno until a table starts, then Uživo. Složi Kolo 1 sits above the list once sign-ups are closed, the
      only Kolo made by hand.
    - **Phone, Podaci (M9):** the computer's form in one card with its sections (Osnovno, Mjesto, Format i prijave,
      Nagrade), then Spremi promjene and Odbaci promjene and the Turnir card (Kopiraj, Otkaži, Obriši), as Upravljanje
      ligom · Postavke. The frame's cards per section and the Spremi fixed at the bottom aren't used.
    - **The bottom bar** has six tabs (Večer · Turniri · Rejting · Ekipe · Igrači · Sponzori), its pill narrower so they
      fit at 360 px.
    - **Players' pages:** Poredak i rezultati is Dnevni poredak (Poredak and the Kolos as chips, the standings with the
      player's team marked, the player's table first). Vaš rezultat (W1) takes the rating over the day from the rating
      history on the tournament's date.

67. **Fixes found while doing #65.**
    - **A page's tab in its address** (?view= in Upravljanje ligom on the phone, ?round= on Dnevni poredak, and now the
      tournaments' ?view=, ?kolo=): since 13.10. the address helper wrote nothing when only the query changed, so a
      reload and Back came to the first tab, though the pages said otherwise. It now always writes the address and
      swaps the page stack's entry only when the path changes.
    - **Skica kola's list:** a long team name takes up to two lines instead of being cut after a few letters, and the
      smoking column is there only when a table is a smoking one.
    - **The switch on a navy card** (Prijave otvorene) has a light track when off; on navy the grey one disappeared.
    - **Found by clicking a whole tournament through** (26.10., your request: five teams, a waiting list and Odjavi
      se, two Kolos, one table played hand by hand on a player's phone, the rest by Ručni unos on the admin's):
      - Tko igra on the admin's phone (and computer) sent the admin back to itself instead of on to a tournament
        table's scorepad: the pass to the scorepad knew only the league table's address. Now both.
      - The bye went to the team above the last one when that let the leaders meet (2nd on 2 points instead of the
        last on 0). The pairing now puts the bye on the lowest team without one ahead of the neighbours rule (#65).
      - Kraj kola of a tournament's table also opens Poredak i rezultati (the league's only goes home, as before).
      - A team's players list the viewer first on the tournament's pages, as the sign-up sheet does.

68. **Kola: every Kolo, Dodaj kolo and Obriši kolo; Početna's Vidi stranicu** (your requests of 26.10.).
    - **Every Kolo is in the list** (the phone's Kola, the computer's chips). The ones still to come are greyed and
      can't be opened.
    - **Dodaj kolo** (the dashed + under the phone's list, the + beside the computer's chips) adds one Kolo at the end
      in a single tap, up to 20, and Broj kola goes up with it. A tournament played to the end goes on: the new
      Kolo's Skica is drawn at once.
    - **Obriši kolo** (the bin on the last Kolo; on the computer beside the +) makes the tournament one Kolo shorter,
      Broj kola going down with it, but at least one Kolo stays. Only the last Kolo goes. Alternative: any Kolo.
      Reason: every later Kolo was paired by the standings after it, so they would no longer add up.
    - **Before it goes**, a sheet (phone) or a dialog (computer) says what goes: a Kolo still to come, a Skica, or a
      Kolo out with nobody playing yet. A Kolo being played or played gets a warning: its results go too, games
      being played are stopped, and the standings and ratings are counted again. The server deletes results only when
      the request says the admin saw that warning (?rezultati=1), so a screen out of date can't. If every Kolo before
      it is played, the tournament is then over.
    - **Podaci's Broj kola**, when it goes down after the start, now also drops a Skica of a Kolo past the new count.
      Before, it stayed and could be published as a Kolo after the last.
    - **Početna · Turniri says Vidi stranicu**, never Prijavi se: the tournament's page is read first, and Prijavi se
      is on it. A visitor who presses Prijavi se there logs in and comes back with the sign-up sheet open. A
      tournament's card shows two photos and +N, so Vidi stranicu fits beside the players; on a phone under 375 px it
      goes under them.

69. **Turniri, prva verzija** (your instructions of 30.10. "Upute za Claude Code: Turniri (prva verzija)" and the
    Claude Design pages Turniri admin, Vrijeme partije, Nedolazak za stol, Zabrana prijava, Potvrda dolaska and
    Natjecanja; built overnight with no questions asked, so every call below is mine and can be changed). Migration
    20261030120000_turniri_v1 only adds: game_minutes on League and Tournament, the organizer's phone, who cancelled,
    the match's started_at / ends_at, Match.time_expired, Round.attendance, TournamentTeam's arrival, Aktivna and
    exclusion, and SignupBan.
    - **Nothing runs on a timer.** Vercel has no cron worth the name, so whatever is due happens on the next read of
      the tournament (its pages, the admin's, the players' check for the question, the scorepads), once, under the
      tournament's lock: the start time's switch, the skip at 10 minutes, a match out of time, the next Kolo's draft.
      The players' app asks /api/tournaments/attention on every screen, every 5 s while their table waits for an
      answer, every 30 s on the day, every 10 min otherwise. Alternative: a scheduled job. Reason: none needed, and a
      phone asking anyway sees the result at once. A scheduled backup came later: #70.
    - **Vrijeme partije holds for the league too** (your "svaka partija"). A match running when this is deployed has no
      limit (ends_at null), so nothing in progress closes by surprise. At the deadline the board says the time is up;
      a hand whose entry started before it (the phone sends when its entry opened) is still taken for 2 minutes, and
      after those 2 minutes the server closes the match by itself with the team with more points winning (time_expired;
      it is counted so in admin corrections too). With the score level one more hand is played, then the match closes.
      An admin's hands don't depend on the time. The 5-minute warning shows the real time left when the board is
      opened later than at 5:00 ("Još 4:27").
    - **Potvrda dolaska** opens at Okupljanje (without one, 30 minutes before Početak) and closes at Početak; a
      tournament without a start time has none. At the start time sign-ups close, teams in that didn't confirm become
      inactive (still signed up) and the confirmed waiting teams come in, in waiting-list order, up to the limit.
      Publishing Kolo 1 earlier closes the window too (the draft decided who plays). During the tournament a team that
      leaves (Odlazimo) or is excluded frees a place for the first confirmed waiting team. **Želimo uskočiti** when the
      tournament is full puts the team on the waiting list by its sign-up time, so it can be first (as P7 shows).
    - **Kolos are drawn from the active, not excluded teams** (an inactive team that never played isn't in the
      standings either). The Aktivna switch on a waiting team lets it in (Ubaci u turnir).
    - **Nedolazak za stol** applies only to a tournament's tables of its day (the calendar day, or the league night
      until 06:00) that are published with no game started: a table out from another day is never asked or skipped.
      Da, tu su ends the question for the table (no skip later even if the game starts after 10 minutes). Ne, nisu
      došli writes 1001:700 for every match of the table. Both a no-show and a skipped table are left out of the rating
      replay (a forfeit isn't a game). The question isn't shown to the admin as admin; a player of either team sees it.
    - **The ban after Kolo 1**: the team that didn't come gets a ban of **one month** (the instructions give no length),
      as a team ban with all its players ticked, reason "Nedolazak u 1. kolu · <turnir>", set by the app. A **skipped**
      Kolo-1 table bans **both** teams ("nije za stolom ni 10 minuta nakon početka": the system can't tell which one
      was missing). Alternative: no ban for a skipped table. The admin lifts any of them on the team's page.
    - **A team may not sign up when the team or any of its players is banned** (also for a team of three; the message
      names the player). A banned player can't make a new team in the sign-up sheet, nor be picked as a partner. A ban
      "do 8. 11." lets them sign up again on 8. 11. Bans already signed up stay (your rule), and the admin's Dodaj
      ekipu shows a banned team with Zabrana and no Dodaj.
    - **Standings**: points, difference, then the head-to-head among the teams still level (their mutual tables'
      points, then difference), then the name. A skipped table counts for nobody; an excluded team keeps its place and
      Kolos and is listed under the standings with "Isključena nakon Kola N" (the league's rows have no slot for it:
      a deviation from M8b's dimmed row).
    - **After the start everything but the date can change** (your rule for a finished tournament, used for a running
      one too). Partija po kolu and Zvanja then hold for the Kolos made after it (the next Kolo's draft is made again).
      The organizer's phone is required for a new tournament; an older one without it isn't forced until it gets one.
    - **Početna**: the main card is a link as a whole (› in its head) and holds Tu smo; the upcoming cards say Prijavi
      se › again (your new instructions; #68 had Vidi stranicu) and still open the tournament's page. A live
      tournament the player is in comes before an upcoming one on the card, as before.
    - **Admin, deviations from the frames** (#66's rule): the Kolo's statuses (M7b, NA1) are a list of the tables
      whose day went otherwise above the league's table cards (the cards themselves are the league's and stay
      untouched); the computer's day (AD1) is one table for the teams in and waiting, as the frame, with the tiles;
      the computer's Kola and the finished tournament (open in the instructions) follow the phone's M7b and M5z in the
      league's layout: statuses under the side card, "Turnir je završen · nema otvorenih kola" in it.
    - **Links**: Nazovi is tel:+385… (without the plus a Croatian phone would dial a local number), WhatsApp is
      wa.me/385… without the plus, as asked. The rules and map links open in a new window.
    - **Checked**: unit tests (469, new ones for the time limit, the day, the bans, the statuses, the head-to-head),
      an API flow of a whole tournament day and a league regression on the local copy of 25.10., `next build`, and a
      click-through on the phone and the computer (sign-ups, P1, Tu smo on Početna and the page, the admin's day,
      the start time, joining when full, Kolo 1 made and published, the scorepad's timer, Još 5:00, the time up, a
      match closed by time, the question locked and unlocked, Ne, nisu došli, Pobjeda bez igre, Isključeni ste, a
      skipped match, Vrati, the statuses, Poredak, the bans on Ekipa and Igrač, Prijava nije moguća, a banned team in
      the sheet, Otkazan in the lists). **Not checked**: real phones, the Vercel preview, and two phones answering at
      the same moment (the lock makes the first answer count; untested by hand).

70. **/api/cron/tick, the clock's backup** (your "Yes, add it" of 30.10., after #69's "Nothing runs on a timer").
    - **What it does**: the same as #69's reads, for the minutes nobody has the app open. Today's tournaments run
      what is due (the start time's switch, the skip at 10 minutes, matches out of time, the next Kolo's draft), and
      every match whose time and grace are over closes, the league's too. That closes the league's gap: until now a
      league match out of time closed only when its own scorepad was read, so Dnevni poredak could still show it as
      live. A level match stays open for one more hand, as on the scorepad. It answers with the tournaments it ran
      and the tables it closed; calling it twice, or at the same moment as a phone, does nothing more.
    - **Only with the secret**: a request without `Authorization: Bearer <CRON_SECRET>` gets 401, and while
      CRON_SECRET isn't set every request does, so nothing happens until it is switched on.
    - **Switching it on is yours** (nothing is set yet): put CRON_SECRET (a long random string) in the Vercel
      project's environment variables, then let a scheduler call it every minute.
    - **Vercel Cron** would be one line in vercel.json,
      `"crons": [{"path": "/api/cron/tick", "schedule": "* * * * *"}]`. It runs on the production deployment only
      and sends the header by itself, but every minute needs Pro: on Hobby a cron runs at most once a day, and a
      schedule more often than that fails the deploy. Alternative: the line in vercel.json now. Reason: the plan isn't
      visible from here, and on Hobby every deploy would fail.
    - **Any other scheduler** works on Hobby and on the preview too, for example cron-job.org (free): a GET of
      https://<the app>/api/cron/tick every minute with the header `Authorization: Bearer <CRON_SECRET>`.
    - **Checked**: unit tests for the secret check (471 pass), tsc, lint, and on the local copy: refused without the
      right secret; of two league tables out of time that nobody read, the one ahead (100:62) closed by the tick
      alone (time_expired, its second match on a fresh clock) and the level one (162:162) stayed open; a second tick
      closed nothing; the tick took 23 ms there. **Not checked**: a real scheduler calling it on Vercel.

71. **The stale-draft check holds for every Kolo** (your "Yes, fix the stale-draft check" of 30.10., after the test
    of Petak u Pitaniku on development).
    - **The bug**: only Kolo 1 was checked. A later Kolo's draft is made by itself as soon as the Kolo before it
      ends, so a team that came in (Movie Pub, from the waiting list) or was excluded or let back after that was
      left out of, or kept in, a draft that could still be published. Movie Pub got no table in Kolo 2.
    - **Now**: publishing any Kolo whose draft seats other teams than the ones that play now (in, active, not
      excluded; the bye aside) is refused with STALE_DRAFT, and the admin's draft (phone and computer) shows the red
      warning with Objavi kolo off until Složi ponovo. One check, `draftIsStale` in tournaments.ts, for both.
    - **The draft isn't made again by itself** when the teams change. Alternative: remake it on every change.
      Reason: the admin may have moved pairs by hand, and those edits would be lost without a word.
    - **Checked**: a unit test (472 pass), tsc, lint, and on development with Provjera skice (test): after Kolo 1
      the Kolo 2 draft came by itself; excluding a team then gave stale_draft true and Objavi was refused (409
      STALE_DRAFT); after Složi ponovo the draft left the team out (two tables, one the bye) and was published.
      **Not checked**: the warning on the screens (the browser can't reach vercel.app from here).

72. **Automatska kola** (your request of 30.10.: "opcija kod kreiranja turnira da pustim automatsko kreiranje kola po
    završetku prethodnog bez mojeg skica", read each time a draft is made).
    - **Novi turnir and Podaci** have **Iduća kola**: Objavljujem ja (default, as before) or Automatski. It is
      `Tournament.auto_publish` (migration 20261031120000, default false, so every existing tournament stays as it was).
    - **With it on**, when the last table of a Kolo closes, the next Kolo is made by the standings as before and
      published at once (its timers and the no-show question start then). The setting is read right after that draft
      is made, so switching it on or off during the tournament counts from the next Kolo.
    - **Kolo 1 is never published by itself**: publishing it starts the tournament, and the start time's switch and
      the arrival window come first. Alternative: publish it at Početak. Reason: not asked, and the admin should see
      who is in before the start.
    - **A draft already waiting** when the setting is switched on is not published by that: the admin publishes it
      (or it waits for the next Kolo). Reason: the request was about the moment a draft is made.
    - **Rematches**: with Automatski the admin doesn't see the "Ponovo igraju…" warning before the Kolo goes out.
      Accepted: it only happens when no other pairing is possible.
    - **Two requests at once** (two tables closing together): one makes and publishes it, the other finds it done
      and stays quiet.
