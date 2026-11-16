# Unit i db testovi — plan

Dio [`ORKESTRACIJA_AGENATA.md`](ORKESTRACIJA_AGENATA.md). E2E (Playwright) je u [`E2E_PLAN.md`](E2E_PLAN.md).
Ovdje su testovi koji ne trebaju preglednik: čista logika (unit) i servisi koji pišu u bazu (db).

## 1. Kako je sada (14.11.)

- **Unit:** `npm test` pokreće 582 testa iz 80 fileova za ~2 s, sve zeleno.
  - Pisani su s Node-ovim `node:test` i `assert/strict`, bez Jesta i Vitesta. Pokreće ih `ts-node`
    s `tsconfig.test.json`.
  - Imena testova su na engleskom i opisuju pravilo ("a tie is a fall for the calling team").
- **Db:** `npm run test:db` pokreće 42 testa iz 10 fileova (`__tests__/db/`) protiv pravog Postgresa, jedan po
  jedan.
  - Svaki test radi svoje redove s jedinstvenim `tag`-om i briše ih na kraju.
  - Trebaju bazu koja se smije baciti, pa se pokreću rijetko: fixer i release review samo "ako su se mijenjali db
    testovi ili zatvaranje stola".
- **Komponente se ne testiraju izravno.** Nema okruženja koje glumi preglednik. Logika se izvuče iz komponente
  u funkciju u `_lib` i testira se ta funkcija (npr. `smokingUi`, `ratingsUi`, `handRows`).
- **Ispravak buga** obično dobije test koji bez popravka pada (1bb39ea → `db/doubleHand.test.ts`), ali to nije
  zapisano, pa ovisi o sesiji. Od 15.10. testove dira 91 od 184 commita.
- **Rupe:** 59 od 147 modula u `_lib` nijedan test ne uvozi izravno (neki su pokriveni posredno, kroz drugi
  servis).
  - **48 servisa koji pišu u bazu:**
    - `round/` (`publication`, `lineup`, `createRoundDraft`, `smoking`, `getLastOpenByPlayerId`);
    - `ongoingMatch/create`;
    - `admin/` (`tables`, `recalc`);
    - `league/` (`arrival`, `nights`, `leagues`, `schedule`, `getStandingsByDate`);
    - `tournament/` (`day`, `tournaments`, `load`, `views`, `clock`, `attention`);
    - `bans/bans`, `burza/burza`;
    - `team/` (`create`, `update`, `delete`, `addPlayer`, `freezeLineups`);
    - `players/` (`admin`, `overview`, `photos`, `search`);
    - `sponsors/sponsors`.
  - **Čisti moduli:** `bela/declarations`, `helpers/databaseHelpers` (pretvara upis igre u redove za Prismu;
    područje buga 1bb39ea), `rateLimiting/requestLimiting`, `validation/playerUniqueConstraints`.
- **Pokrivenost:** Node je mjeri ugrađeno (`--experimental-test-coverage`, radi s ovim postavom). Fileovi koje
  unit testovi učitaju pokriveni su 74% po linijama. Moduli koje nijedan test ne učita taj broj ni ne vide, pa je
  popis rupa važniji od postotka.

## 2. Odluke (prijedlog)

| Odluka | Izbor |
| --- | --- |
| Alat | **Ostaje `node:test`.** Brz je (2 s), bez ovisnosti, i svi ga agenti već znaju. |
| Komponente | **Bez jsdom-a i React Testing Libraryja.** Logika ide u `_lib` i tamo se testira, a ekran pokriva E2E. |
| Što ide u db test | Sve što ovisi o bazi i što unit test ne može uhvatiti (popis u pogl. 3, pravilo 4). |
| Baza za db testove | Postgres 17 u Podmanu: kontejner `bela-e2e-pg` lokalno, servis `db` u E2E compose stacku noću. Nikad Neon. |
| Kad se vrte | `npm test` prije svakog commita (hook); `test:db` **svaku noć** u E2E noćnoj i u svakom release reviewu, a ne samo "ako se mijenjalo". |
| Pokrivenost | Mjeri se i ide u noćni izvještaj kao popis modula i funkcija bez testa. **Nema praga u postocima**, jer prag tjera na testove koji ništa ne provjeravaju. |
| Podaci za db testove | Kao danas: svaki test svoje redove. Novi `__tests__/helpers/db.ts` daje gotove gradivne blokove iz generatora (`e2e/seed/play.ts` za igru po pravilima, `live.ts` za stol kroz servise), pa db test ima 10 redaka postavljanja umjesto 40. |

## 3. Pravila (u skillu `testovi`, a `CLAUDE.md` upućuje na njega)

1. **Promjena ponašanja logike** donosi novi ili izmijenjeni test u istom commitu, a piše ga autor promjene
   (nema rutine koja piše testove). Koji test (unit, db ili Playwright) kaže graf u `ORKESTRACIJA_AGENATA.md`
   pogl. 5. Tekst, razmak i boja ne trebaju test.
2. **Ispravak buga** ima test koji bez popravka pada. Commit poruka to kaže.
3. **Logika iz komponente** se izvuče u `_lib` (čista funkcija) i testira tamo.
4. **Db test treba** kad ishod ovisi o bazi:
   - transakcije i zaključavanja (`FOR UPDATE`, advisory lock), dva upisa u isto vrijeme;
   - CHECK ograničenja i jedinstveni ključevi;
   - **što servis prosljeđuje Prismi** (1bb39ea: Prisma je odbila nepoznato polje, a to vidi samo db test);
   - SQL procedure (`update_team_score`), replay rejtinga, migracije koje mijenjaju podatke.
5. **Prije commita** prolaze `npm test` i `npx tsc --noEmit`. Hook pokreće `npm test`.
6. **Namjerna promjena ponašanja** smije promijeniti `assert` postojećeg testa samo u istom commitu, a poruka
   kaže zašto (DECISIONS, issue).
7. **Ime testa** opisuje pravilo, ne funkciju: "a team with a lifted ban may sign up", a ne "test banActive".

## 4. Backlog (redom po šteti)

**P1 — gube se igre ili rezultati** (db testovi)
- `ongoingBelaResult/update` i `create` na svim putevima: igrač, admin, ispravak, igra nakon isteka vremena
  (dio je u `doubleHand` i `timeLimit`).
- `helpers/databaseHelpers`: `transformBelaResult` i `transformBelaMatch` prenose sva polja i ništa više (unit).
- `round/publication`: `publishNight` numerira kola iza zadnjeg objavljenog i broji bye u poretku.
- `round/lineup`: `saveLineup` odbija igrača za obje ekipe, krivi broj igrača i neaktivnog igrača; replay kad se
  mijenja postava odigranog stola.
- `ongoingMatch/create`: drugi poziv vraća isti meč; zatvoren ili neobjavljen stol se odbija.
- `admin/tables` i `admin/recalc`: uklanjanje i izmjena stola vraćaju poredak i rejting na točno stanje.

**P2 — turnirski dan**
- `tournament/day`: `closeArrival` (tko ostaje neaktivan, tko ulazi s liste čekanja), `arrivalAction` u svakoj
  fazi, `fillPlaces`.
- `tournament/tournaments`: `applyLimit` pri promjeni limita, `cancelTournament` i `restoreTournament`.
- `tournament/clock`: `syncTournament` (lijeni prijelazi) na granicama 4, 6 i 10 minuta i u 06:00.

**P3 — ostali tokovi**
- `bans/bans`, gdje je unit testom pokriven samo dio: `banTeam` daje igračima zabrane "preko ekipe", a
  `liftBan` ih skida s njima.
- `burza/burza`: blizanac oglasa se ažurira umjesto da se doda; ponovna objava.
- `league/arrival`: Tu smo, Odlazimo i adminov prekidač, uz zabrane.
- `league/nights`: dodavanje i brisanje večeri.
- `team/*`: stvaranje, izmjena i brisanje ekipe, `freezeLineups` prije promjene sastava.

**P4 — čisto i jeftino** (unit): `bela/declarations`, `rateLimiting/requestLimiting`,
`validation/playerUniqueConstraints`.

Backlog pišu sesije koje ti pokreneš. Svaka stavka je jedan commit s testom. Kad test otkrije bug, ostaje crven i otvara se issue, a test se ne
prilagođava bugu.

## 5. Pokretanje

| Gdje | Što |
| --- | --- |
| Sesija, prije commita | `npm test` (hook) i `npx tsc --noEmit`; `test:db` kad je dirala nešto iz pravila 4 |
| Lokalno, `test:db` | nova skripta `npm run test:db:local`: napravi praznu bazu u `bela-e2e-pg`, pusti migracije, pokrene testove i obriše bazu |
| E2E noćna | `npm test`, `test:db` na `db` servisu compose stacka i pokrivenost, sve u izvještaj |
| Release review | `npm test`, `tsc`, lint, `test:db`, uvijek |

## 6. Faze

| Faza | Što | Gotovo kad |
| --- | --- | --- |
| U1 | ~~skill `testovi`, pravilo u `CLAUDE.md`, `pre-commit` hook~~ (15.11.; `test:db` na `bela-e2e-pg` je recept u skillu, 42/42 zeleno); skripta `test:db:local` | sesija bez upute napiše test uz promjenu logike; `test:db` jednom naredbom |
| U2 | `test:db` i pokrivenost u noćnom izvještaju; `__tests__/helpers/db.ts` | noćni izvještaj ima popis modula bez testa |
| U3 | backlog P1, pa P2 | P1 i P2 zeleni, a nađeni bugovi su issuei |
| U4 | release review traži test za svaku promjenu logike | jedan release review vratio commit bez testa |
| U5 | P3 i P4 | po vremenu |
