# Changelog

What the commits changed for the people using the app, newest first. The reasons and details are in DECISIONS.md.

## 30.10.2026 · Liga: Tu smo i zabrane

On development, not live yet (DECISIONS #73).

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

On development, not live yet (DECISIONS #71, #72).

### Added for the admin
- Novi turnir and Podaci: **Iduća kola**, **Objavljujem ja** or **Automatski**. With Automatski, every Kolo after the first goes out by itself as soon as the one before it ends, with no Skica.

### Changed
- A draft of any Kolo, not only Kolo 1, shows the red **Popis ekipa se promijenio…** and can't be published until **Složi ponovo**.

## 30.10.2026 · Turniri, prva verzija

On development, not live yet. Commits 14f988f..faf4836 (DECISIONS #69, #70).

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

On development, not live yet. Commits 79d735a..c354458 except 8eaf904, which is already live (DECISIONS #65–#68).

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
