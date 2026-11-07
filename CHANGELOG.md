# Changelog

What the commits changed for the people using the app, newest first. The reasons and details are in DECISIONS.md.

## 07.11.2026 · Vrijeme partije: kraj čim vrijeme istekne

On development, not live yet (DECISIONS #83).

### Players
- When **Vrijeme partije** runs out, the match ends at once with the score entered then (the team with more points wins) and the board moves on to the next match or **Kraj kola** by itself; before, the board waited 2 minutes with no button and looked frozen. A level score still plays one more hand.
- A hand still being entered when the time runs out doesn't count: **Spremi** takes the phone back to the table, which has moved on. The 5-minute warning now says "…a igra koja još nije spremljena ne računa se."

### Admin
- A table's scorepad shows the winner of a match closed by time (the team with more points); before, it showed no winner, since nobody had reached 1001.

## 07.11.2026 · Tu smo: jedan igrač je dovoljan, podebljano

On development, not live yet.

### Changed
- **Potvrda dolaska**: the part saying one player is enough is now bold: on Početna before the tournament's window ("**jedan igrač stisne "Tu smo"**"), in the league's open window and in the sheet right after signing up for a tournament ("**Dovoljno je da potvrdi jedan od vas.**").

## 07.11.2026 · Natrag zatvara prozor

On development, not live yet.

### Changed
- On the phone, **Back** (Android's back button or gesture, the browser's Back) closes the open sheet or full-screen window (Profilna slika, Uredi večer, the scorepad's Igra N and Ručni unos, **Pomakni i zumiraj**, a photo opened large) and keeps you on the page; before, it left the page and lost what was typed. With two open (the crop over Novi sponzor) it closes only the top one. While something is saving, Back leaves the sheet open.

## 06.11.2026 · Uredi večer i Nova večer na mobitelu

On development, not live yet.

### Admin
- **Datumi** on the phone: in **Uredi večer** and **Nova večer** the fields scroll inside the sheet and **Spremi**, **Vrati na zadano**, **Makni večer** and **Dodaj večer** stay under them, so **Drugo mjesto**, an error or the keyboard no longer pushes them off the screen (iPhone SE, 360 px Android).

## 05.11.2026 · Prijava prije registracije

On development, not live yet (DECISIONS #82).

### Changed
- **Sjedni za stol.** (a guest's Prijavi se on a tournament, or anything locked) has **Prijavi se** as its big button and **Nemaš račun? Registriraj se** under it; before, the big button was Napravi račun and led to Registracija.
- Početna · Liga for a guest: the night's card has **Prijavi se** and **Nemaš račun? Registriraj se** under it, instead of only Napravi račun.

## 05.11.2026 · Turnir s jednom partijom: pobjeda 1 bod

On development, not live yet.

### Players
- **Turniri**: in a tournament with **1 partija po kolu** a won table counts **1 bod** in Poredak (one partija to 1001 is worth one point); before, it counted 2. With two partije it stays 2 for a win and 1 for a draw. Tournaments already played show the new points too, and the Kolos made from now on are paired by them.

### Admin
- Poredak's note says **pobjeda 1** for a tournament with one partija po kolu, **pobjeda 2, neriješeno 1** for two.

## 05.11.2026 · Registracija: najviše 20 računa na sat s jedne mreže

On development, not live yet.

### Players
- **Registracija** takes at most 20 new accounts per hour from one address (counted in the database, so it holds on every server), so a script can't fill the player lists with junk accounts. The 21st gets "Previše registracija s ove mreže. Pokušaj ponovno za sat vremena."; a taken username or a wrong field doesn't count.

## 05.11.2026 · Nema uskakanja nakon zadnjeg kola

On development, not live yet.

### Players
- **Liga**: once the night's last round (Kola po večeri) is published, a team that isn't here no longer gets **Tu smo · Želimo uskočiti** on Početna; the card says "Zadnje kolo večeri je već počelo, pa se više ne može uskočiti." The server refuses it too. A team already here can still press Odlazimo.
- **Turniri**: once the last Kolo is made (a draft too), a team that doesn't play no longer gets **Tu smo · Želimo uskočiti** on the tournament's page or Početna ("Zadnje kolo je već složeno, pa se više ne može uskočiti."); the server refuses it, and the admin's Označi dolazak for a team that doesn't play as well.

## 04.11.2026 · Registracija: datum rođenja i korisničko ime

On development, not live yet.

### Players
- **Registracija** refuses a birth date that doesn't exist (31. 2.), is in the future or before 1900 ("Neispravan datum rođenja."), and a username with spaces or other signs than a–z, numbers, dot and underscore, as Moj profil does; before, 31. 2. was saved as 3. 3. A username typed with capitals is saved lowercase.

## 04.11.2026 · Najnoviji igrači

On development, not live yet.

### Admin
- The Igrači list (computer and phone) has **A–Ž | Najnoviji** under the search: Najnoviji puts the newest accounts first and shows on each row when the account was made ("od 03.11.2026"). The choice comes back with Back.

## 03.11.2026 · Odigrani meč ostaje s pobjednikom

On development, not live yet.

### Admin
- On a table's scorepad, changing or deleting a hand of a **finished match** is refused when the match would be left without a winner (e.g. "Meč bi ostao bez pobjednika (860:640, nitko nema 1001)."); before, the match silently counted for nobody and a 2:0 win could turn into a draw in the standings. Moving the win to the other team is still allowed.

## 02.11.2026 · Natrag na kolo nakon osvježavanja

Live since 02.11. (1a0eff3).

### Admin
- On a table's scorepad, **Natrag na kolo N** goes to Dnevni poredak on that Kolo also after the page was reloaded in the middle of entering a hand; it no longer opens an empty Korak 2 whose Spremi can never be pressed. An old step reached with Back or Forward opens the table's board instead.

## 02.11.2026 · Broj ekipa umjesto igrača

Live since 02.11. (1a0eff3).

### Changed
- A tournament shows how many **teams** signed up ("1 ekipa", "12 ekipa"), not how many players, on its page, its card in the list, Početna's next-tournament card and Prijavljene ekipe; a team with more than two players no longer looks like several teams.

## 31.10.2026 · Nađi zamjenu do Tu smo

On development, not live yet.

### Changed
- Početna's Večeras card shows **Nađi zamjenu** only until **Tu smo** opens; from then on (Tu smo, Želimo uskočiti, the night under way) the button is gone.
- **Odlazimo** (once the night or tournament has started) and **Ipak otkazujemo** (before it) are real buttons outlined in cream with an icon, no longer underlined text, in the league and on the tournament page.
- Početna's **Započni igru** card has **Odlazimo** under it (league and tournament), the same outlined cream button on navy as on the cards, so a team at its table can still leave; it asks first.

## 31.10.2026 · Poredak kao popis prisutnih

On development, not live yet (DECISIONS #81).

### Changed
- **Dnevni poredak** in the league lists a team as soon as it presses **Tu smo** (or the admin switches it on), with zeros, so players see they are on tonight's list before the first round. A team that leaves without playing drops out.
- A tournament's **Poredak** before Kolo 1 lists only the teams that confirmed arrival, not every signed-up team; empty, it says **Ekipe koje potvrde dolazak bit će ovdje.**

## 31.10.2026 · Datum iza ponoći

On development, not live yet.

### Changed
- A tournament cancelled between midnight and 01:00 says the right day in **Otkazao …** (Turnir je otkazan and the list of tournaments, computer and phone); it used to say the day before.
- The same for the times under **Zadnje prijave** on the computer's list of tournaments, and for **Postavio …** on a ban (Ekipa and Igrač).
- **Postavio …** on a ban no longer ends with two periods after the date.

## 31.10.2026 · Liga: Okupljanje i Početak

On development, not live yet (DECISIONS #80). Needs the migration 20261101120000_league_gathering_time on deploy.

### Added for players
- Raspored's next night and Početna's Sljedeća večer say **Okupljanje od 18:30** beside the start time and place.
- **Tu smo** opens at Okupljanje (without one, half an hour before Početak, as before).

### Added for the admin
- **Okupljanje** and **Početak** side by side in Nova liga, Podaci, Postavke, Dodaj večer and Uredi večer; a night can have its own of either.
- "Okupljanje mora biti prije početka." stops a save with the times the wrong way round.

### Changed
- The league's one time, until now **Vrijeme okupljanja**, is now **Početak**: the main time, shown everywhere as before.

## 31.10.2026 · Datumi: Dodaj večer, premjesti večer, obriši odigranu

On development, not live yet (DECISIONS #78, #79).

### Added for the admin
- Upravljanje ligom · Datumi: **Dodaj večer** is a button (computer: over the list; phone: under Sljedeća večer) that opens **Nova večer**: date, time and place.
- Nova večer starts filled in from the league: its play day after the last night, its time and its place; any of them can be changed.
- A click (tap) on any night opens it: an upcoming one in **Uredi večer**, a passed or played one with its time, place and rounds.
- An upcoming night can move to another date (**Datum večeri** in Uredi večer); a team's Burza ad for a substitute moves with it.
- A played night can be removed: **Obriši večer i kola** opens **Obrisati odigranu večer?**, and only then its rounds and results go too.
- A night that has passed without rounds can be removed (**Makni večer**, or the bin on the computer).

### Changed
- The night's card and sheet are called **Uredi večer** (they were Okupljanje večeri).
- Computer: the card on the right starts at its top when another night opens.

## 31.10.2026 · Admin: popis turnira i Vrati turnir

Live since 31.10.2026 (DECISIONS #77), except the Kolo's **point difference**, which is on development, not live yet.

### Added for the admin
- Turniri (computer), Nadolazeći: the card shows the **last 5 sign-ups**, with **Prijave** and **Stranica**.
- Aktivni: the Kolo being played (**N od M stolova gotovo**) and **Trenutno vode**, with **Kola** and **Stranica**.
- Završeni: **Pobjednici** (top 3), with **Poredak** and **Stranica**.
- **Vrati turnir** for a cancelled tournament: back to Nadolazeći with its teams, sign-ups open.
- A double click on a tournament opens it.
- **Novi turnir** starts with **Link na pravila** filled in: Bela pravila igre v1.5 (Macaklin Social Club). It can be changed or cleared.

### Changed
- A tournament's **Kolo** shows each finished table's **point difference** (+/−) beside the wins, as in the league; players and admin.
- A finished tournament's **Prijave** and **Lista čekanja** can't be changed any more; Kola, Poredak and Podaci can.
- The list's card no longer has the sign-ups switch, Uredi, Kopiraj, Otkaži and Obriši: they are in the tournament's page.

## 30.10.2026 · Registracija s Googleom

Live since 31.10.2026 (DECISIONS #76).

### Added for players
- **Registracija** starts with **Registriraj se s Googleom**: no new password, the name and email come from Google, then the app asks the birth date and **Pušiš li?**.
- After a Google sign-up you land back where you started (an invitation's tournament included).

### Changed
- On the phone, Registracija opens with two buttons, **Registriraj se s Googleom** and **Registriraj se emailom**; the form opens after the second.
- The phone's Registracija has **Već imaš profil? Prijavi se** at the bottom.

## 30.10.2026 · Gost i poziv

Live since 31.10.2026 (DECISIONS #75).

### Added for players
- Without an account: **Početna** opens with **Prijava** in the header, the tournaments and **Burza igrača**.
- Liga, **Raspored**, **Dnevni** and **Ukupni poredak** and **Rejting** show locked; a tap opens **Sjedni za stol.** with **Napravi račun** and **Prijavi se**.
- After making an account and logging in, the app goes back to where you started (a tournament's sign-up included).
- Nova ekipa: **S kim igraš?**, **Nema računa** and **Poziv je poslan**, with **WhatsApp** and **Ostalo** to invite a teammate.
- The **Sljedeći turnir** card has **Stranica turnira** as a wide button under **Prijavljeno**, like the tournament page's sign-up card; a guest signs up from the tournament's page.

### Changed
- **Ukupni poredak** needs an account now.
- A link to a page that needs an account goes to Prijava and back to that page.
- A tournament whose day passed without starting no longer shows as **Sljedeći turnir** or under **Nadolazeći turniri** (the admin still sees it).

## 30.10.2026 · Liga: međusobni omjer

Live since 31.10.2026 (DECISIONS #74).

### Changed
- Ukupni and Dnevni poredak: teams level on points and difference are ordered by their tables against each other (points, then difference), then by name, as in tournaments.
- Ukupni poredak counts every meeting of the season; Dnevni poredak only that night's.
- The **+/−** compares with the previous night ranked the same way.

## 30.10.2026 · Liga: Tu smo i zabrane

Live since 31.10.2026 (DECISIONS #73).

### Added for players
- Početna · Liga, **Večeras**: **Tu smo** from 30 min before the night's start until the night ends.
- **Ipak otkazujemo** before the start, **Odlazimo** after it (out of the next Novo kolo).
- After the start, a team that isn't here gets **Tu smo · Želimo uskočiti**.
- A banned team sees **Zabrana** with the date instead of Tu smo.

### Added for the admin
- Novo kolo: the teams that pressed Tu smo switch on by themselves; each team shows **Tu · 19:42**, **Otišla · 22:10** or **Nije potvrdila**.
- Switching a team on in Novo kolo marks it here (a team without a phone); off takes it out of the next Novo kolo.
- Banned teams show **Zabrana · 8. 11.** in Novo kolo and Uredi stolove and can't be switched on or seated.

### Changed
- A ban (the team's or one of its players') also keeps the team from league nights: no Tu smo, Novo kolo, Novi stol, Dodaj ekipu or Nova liga.
- A Skica with a team banned after it was made can't be published until that table is changed.
- Tables already published and their results stay.
- The ban card on Ekipa and Igrač says **Ne igra ni u ligi**.
- A night without a start time works as before: Novo kolo starts from the active teams.

## 30.10.2026 · Kola: zastarjela skica i automatska kola

Live since 31.10.2026 (DECISIONS #71, #72).

### Added for the admin
- Novi turnir and Podaci: **Iduća kola**, **Objavljujem ja** or **Automatski**. With Automatski, every Kolo after the first goes out by itself as soon as the one before it ends, with no Skica.

### Changed
- A draft of any Kolo, not only Kolo 1, shows the red **Popis ekipa se promijenio…** and can't be published until **Složi ponovo**.

## 30.10.2026 · Turniri, prva verzija

Live since 31.10.2026. Commits 14f988f..faf4836 (DECISIONS #69, #70).

### Added for players
- **Tu smo** on Početna and the tournament page, from Okupljanje to Početak; **Ipak otkazujemo** undoes it.
- A three-step "what happens next" sheet right after signing up.
- The organizer's card: **Nazovi** and **WhatsApp**.
- During the tournament: **Tu smo · Želimo uskočiti** (or the waiting list when full) and **Odlazimo**.
- **Jesu li … za stolom?** over any screen 5 min after a Kolo is published; the answers unlock at 8 min.
- **Ne, nisu došli**: the team at the table gets **Pobjeda bez igre** (1001:700), the other team is out.
- **Isključeni ste** on the tournament page when your team is out.
- **Prijava nije moguća** for a banned player; a banned team is marked in the sign-up sheet.
- Scorepad: a match timer in the header, red in the last 5 minutes.
- Scorepad: **Još 5:00 do kraja partije**, once per match.

### Added for the admin
- Novi turnir: **Telefon organizatora** (required, your number filled in) and **Vrijeme partije** (35 min).
- Prijave on the day: **Tu** / **Nije potvrdila**, **Označi dolazak**, the **Aktivna** switch and a summary card.
- **Isključi ekipu** (asks first) and **Vrati**, after the start.
- Kola: each table's status with a line: **Upit · m:ss**, **Nedolazak**, **Vrijeme isteklo**, **Preskočen**.
- **Zabrana prijava** on Ekipa and Igrač, phone and computer: 1 tjedan to Trajno, or Prilagođeno, with the end date.
- Bans: **Vrijedi i za igrače**, a reason only admins see, **Promijeni**, **Ukini** (also for the players).
- League settings: **Vrijeme partije**.

### Changed
- League and tournament matches have a time limit (35 min); the team ahead wins, a tie plays one more hand.
- At Početak, teams that didn't confirm become inactive and confirmed waiting teams come in.
- No answer and no game 10 min after a Kolo is published: the table is skipped, both teams are out.
- Missing Kolo 1 (or a skipped Kolo-1 table) bans the team from signing up for a month.
- Poredak: a tie on points and difference goes to head-to-head; excluded teams are listed under it.
- After the start, everything but the date can be changed.
- Lowering the team limit moves the last sign-ups to the waiting list, with a red line saying so.
- Otkaži moves the tournament to Završeni and shows who cancelled it.
- Aktivni lists today's tournament.
- Početna: the whole tournament card opens the tournament; upcoming cards say **Prijavi se**.
- Once a scheduler calls /api/cron/tick, overdue matches close even with no scorepad open.

## 26.10.2026 · Turniri

Live since 31.10.2026 (8eaf904 went live earlier). Commits 79d735a..c354458 (DECISIONS #65–#68).

### Added for players
- **Turniri**: one-day tournaments of teams, with a waiting list.
- Početna: the **Turniri · Liga** switch under the header, with a red dot on Turniri while your tournament is live.
- Početna · Turniri: your table on the day, else the next tournament; then Burza igrača, upcoming and finished ones.
- The tournament's page: details, prizes, the teams in, **Prijavi se** and **Odjavi se**.
- On the waiting list: **Na listi čekanja · N.**; the first team waiting comes in by itself when a place frees up.
- **Prijava ekipe**: one of your teams, or a new team with a teammate found by name.
- **Pošalji poziv** shares the sign-up link with a teammate who has no account.
- On the day: your table, and **Poredak i rezultati** with every Kolo, like Dnevni poredak.
- **Kraj kola** of a tournament table opens Poredak i rezultati.
- When it's over: **Pobjednici**, **Vaš rezultat** with the rating change over the day, and **Vaši mečevi**.
- The tournament pages are public and read-only for visitors (no ratings, photos or usernames).
- A tournament counts for the rating as one night.
- Teams of three or more say **Tko igra** before every Kolo.
- A tournament **bez zvanja** has a single **Bela** button on the scorepad.
- A table of one match says **Meč** and closes after it.
- On the computer, players get the phone's pages in a centred column.

### Added for the admin
- **Turniri** in the computer's menu and the phone's bottom bar: Nadolazeći, Aktivni, Završeni.
- **Novi turnir**: date, times, place, Kolos, matches per table, Zvanja, team limit, fee, rules link, prizes.
- **Kopiraj turnir** starts a new tournament from an old one.
- **Upravljanje turnirom**: Prijave, Lista čekanja, Kola, Poredak, Podaci.
- Prijave: **Dodaj ekipu**, **Makni ekipu**, and **Ubaci u turnir** for a waiting team (the limit grows by one).
- The **Prijave otvorene** switch; Kolo 1 is drawn once sign-ups are closed.
- Kolo 1 is drawn at random; later Kolos are paired by the standings, with no repeat meetings.
- Kola: **Skica**, **Složi ponovo**, **Objavi kolo** and **Uredi stolove**, as in the league.
- Publishing Kolo 1 starts the tournament; each next Kolo is drafted by itself.
- Kola lists every Kolo (the ones to come greyed), with **Dodaj kolo** and **Obriši kolo** (the last one, with a warning).
- **Otkaži** and **Obriši** before the start; a cancelled tournament stays in Završeni as **Otkazan**.
- A tournament table opens the league's scorepad and Pregled stola, with links back to the tournament.

### Changed
- The app is called **Belatronika**: the header, the titles, the install sheet and the installed app.
- Početna's league content is under **Liga**; the rating sits next to the profile.
- The computer's Početna shows the next tournament above the tables.
- The admin phone's bottom bar has six tabs: Večer · Turniri · Rejting · Ekipe · Igrači · Sponzori.
- Reload and Back keep the tab you were on (Upravljanje ligom on the phone, Dnevni poredak).
- Skica kola: long team names take two lines instead of being cut, in the league too.
