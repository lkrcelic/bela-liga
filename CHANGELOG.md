# Changelog

What the commits changed for the people using the app, newest first. The reasons and details are in DECISIONS.md.

## 31.10.2026 · Nađi zamjenu do Tu smo

On development, not live yet.

### Changed
- Početna's Večeras card shows **Nađi zamjenu** only until **Tu smo** opens; from then on (Tu smo, Želimo uskočiti, the night under way) the button is gone.

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
