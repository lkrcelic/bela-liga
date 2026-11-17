# Playwright suite s agentima — plan

Dio [`E2E_PLAN.md`](E2E_PLAN.md) (pogl. 5: što testiramo) i [`ORKESTRACIJA_AGENATA.md`](ORKESTRACIJA_AGENATA.md).
Ovaj plan kaže **kako** se suite piše: zajednička baza, pa jedan agent po sekciji, paralelno, svaki u svom
worktreeju, sa svojim serverom i svojom bazom.

## 1. Odluke (15.11.)

| Odluka | Izbor |
| --- | --- |
| Sekcije | **11:** A (prolaz kroz stranice), B (dozvole), C1–C9 (glavni tokovi). Svaka sekcija je jedan agent. |
| Redoslijed | **Baza → pilot C1 → ostalih 10 paralelno.** Pilot provjeri pomoćnike prije nego ih koristi deset agenata. |
| Okruženje | **Lokalno:** jedan produkcijski build (`next build`), a svaka sekcija ima svoju bazu u `bela-e2e-pg` i svoj `next start` na svom portu. Compose stack (E2E_PLAN faza 1) dolazi poslije, za noćnu rutinu. |
| Grana | **`e2e-suite`**, lokalna (bez pusha, da Vercel ne gradi preview). Svaki agent radi na grani `e2e/<sekcija>` u svom worktreeju, a ja spajam u `e2e-suite`. Na `development` ide kad cijeli suite prođe `--repeat-each=5`. |

## 2. Kako se ne gaze

| Sekcija | Agent radi u | Port | Baza | Testovi |
| --- | --- | --- | --- | --- |
| baza | `.claude/worktrees/e2e-suite` | 3900 | `bela_e2e_smoke` | `tests/smoke/baza.spec.ts` |
| A | `.claude/worktrees/e2e-a` | 3910 | `bela_e2e_a` | `tests/smoke/a-*` |
| B | `.claude/worktrees/e2e-b` | 3911 | `bela_e2e_b` | `tests/dozvole/b-*` |
| C1 … C9 | `.claude/worktrees/e2e-c1` … `e2e-c9` | 3921 … 3929 | `bela_e2e_c1` … `_c9` | `tests/<područje>/cN-*` |

- **Jedan build** u `e2e-suite` worktreeju. Agenti ne mijenjaju kod aplikacije, pa svi pokreću isti build, svaki sa
  svojom bazom (`e2e/local/app.sh start <sekcija>`).
- **Svoji fileovi:** agent piše samo `tests/<područje>/<sekcija>-*.spec.ts` i `helpers/<sekcija>.ts`. Zajednički
  pomoćnici (`fixtures.ts`, `world.ts`, `db.ts`, `health.ts`, `scorepad.ts`) su njegovi samo u pilotu (C1); poslije
  ih mijenja samo voditelj (ja), na zahtjev iz izvještaja.
- **Generator se ne dira.** Fali li podatak, test ga napravi sam (Prisma ili API aplikacije u fixtureu), a u
  izvještaju predloži scenarij.
- **Bug u aplikaciji:** test ostaje s `test.fail()` i komentarom, a bug ide u izvještaj. Agenti ne otvaraju issuee i ne
  popravljaju aplikaciju: issuee otvaram ja, nakon pregleda, s labelom `e2e`.

## 3. Faze

| Faza | Što | Gotovo kad |
| --- | --- | --- |
| **S0 Baza** (ja) | `@playwright/test`, `e2e/playwright.config.ts`, `e2e/tsconfig.json`, `e2e/local/app.sh`, pomoćnici (prijava po roli, manifest, Prisma i pomak vremena, zdravlje stranice), jedan smoke test, briefovi u `e2e/sekcije/`, `e2e/FLOWS.md` | smoke test zelen `--repeat-each=5`; `tsc -p e2e` čist |
| **S1 Pilot C1** (1 agent) | ligaška večer od Novog kola do Kraja kola; `helpers/scorepad.ts` | C1 zelen `--repeat-each=5`; pregledam pomoćnike i spojim |
| **S2 Ostali** (10 agenata paralelno) | A, B, C2–C9 | svaka sekcija zelena `--repeat-each=5`, izvještaj predan |
| **S3 Spajanje** (ja) | spojim grane, `FLOWS.md`, issuei za nađene bugove, cijeli suite `--repeat-each=5` na svježem svijetu | suite zelen (osim `test.fail` s issueom) |
| **S4 Development** | merge `e2e-suite` → `development`, release review ga pregleda | na developmentu; dalje E2E_PLAN faza 1 (compose) i 5 (noćna rutina) |

## 4. Sekcije

Briefovi za agente su u [`e2e/sekcije/`](e2e/sekcije/README.md): zajednička pravila u `README.md`, a svaka
sekcija u svom fileu (cilj, scenariji iz kataloga, tokovi, gotovo kad).

| Sekcija | Tok | Podaci iz kataloga |
| --- | --- | --- |
| A | sve stranice × gost, igrač, organizator, admin × mobitel i računalo: nema 5xx, grešaka, vodoravnog scrolla, `undefined`/`NaN` | cijeli svijet |
| B | 95 API ruta × 4 role: očekivani status iz `_lib/auth/permissions.ts` | računi |
| C1 | ligaška večer: Novo kolo, Skica, Objavi, Tko igra, upis igre, ispravak, Završi meč, Kraj kola, poredak | `leagues.newRound`, `leagues.scorepad`, `tables.handEntry/correction/finishMatch` |
| C2 | dva telefona za istim stolom šalju istu igru | `tables.twoPhones` |
| C3 | turnirski dan: prijava, lista čekanja, Tu smo, Kolo 1, Nedolazak 4/6/10, Vrati stol, Uredi ishod, Kolo 2, kraj | `tournaments.*` |
| C4 | vrijeme partije: pomaknut `ends_at` zatvara meč | `tables.timeLimit` |
| C5 | adminov ispravak završenog meča | `tables.adminEdit` |
| C6 | prijava, zaključavanje, odjava, registracija, onboarding, deaktiviran račun | `accounts.*` |
| C7 | organizator na svom turniru i 403 na tuđem | `tournaments.organizer`, `accounts.organizer` |
| C8 | Burza: objava, uređivanje, zatvaranje, ponovna objava | `ads.*` |
| C9 | profil: slika (upload i crop) i privatnost | `accounts.player` |

## 5. Rizici

- **Pomoćnici pogrešni za sve:** zato pilot C1 prije ostalih.
- **Testovi koji mijenjaju svijet:** svaki mora proći `--repeat-each=5` bez novog seeda između ponavljanja, pa sam
  napravi ili vrati ono što mijenja.
- **Opterećenje laptopa:** 11 `next start` servera i 11 Chromiuma. Laptop ima 64 GB; Postgres je u Podman VM-u
  (12 GB), svaka baza ~50 MB.
- **Bugovi u aplikaciji** koje agenti nađu ne blokiraju suite: `test.fail()` s opisom, a issue nakon pregleda.
