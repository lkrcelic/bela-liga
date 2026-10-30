# Changelog

What the commits changed for the people using the app, newest first. The reasons and details are in DECISIONS.md.

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
