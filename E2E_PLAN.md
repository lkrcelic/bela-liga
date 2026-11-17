# E2E testovi lokalno — plan

Dio [`ORKESTRACIJA_AGENATA.md`](ORKESTRACIJA_AGENATA.md). Unit i db testovi su u [`UNIT_PLAN.md`](UNIT_PLAN.md), a kako agenti pišu
suite (sekcije A, B, C1–C9) u [`E2E_SUITE_PLAN.md`](E2E_SUITE_PLAN.md).

Cilj: jednom naredbom, na laptopu, podići cijelu aplikaciju s bazom punom generiranih podataka i proći kroz nju
kao igrač, organizator, admin i gost, na mobitelu (portrait) i računalu. Isto pokreće noćna rutina na laptopu i
`bela-release-review` prije svakog deploya. Vercel se za testove ne koristi.

## 1. Odluke

| Odluka | Izbor |
| --- | --- |
| Gdje | **Lokalno, na laptopu** (M5 Pro, 18 jezgri, 64 GB). Ne troši Vercel ni Neon. |
| Kontejneri | **Podman** (već instaliran, 6.0) i jedan `compose.e2e.yml` koji radi i s `podman compose` i s `docker compose`. Podman VM ima gornju granicu CPU-a i memorije, pa test ne može zagušiti laptop. |
| Aplikacija | **Produkcijski build** (`next build` + `next start`) kao na Vercelu, ne `next dev`. |
| Vremenske zone | Kontejner aplikacije radi u **UTC-u** kao Vercel, a preglednik u **Europe/Zagreb** s `hr-HR`. Tako se hvataju greške tipa 726b292 (dan iz UTC stringa). |
| Baza | Postgres u kontejneru, **ista major verzija kao produkcija**, podaci na tmpfs-u. Nakon pokretanja ne ostaje ništa. |
| Podaci | **Generirani seed**: deterministički, oblika produkcije, računat pravilima aplikacije i provjeren invarijantama prije testova (poglavlje 4). |
| Drugi izvor podataka | **Kopija produkcije** iz `backups/bela-prod-*.dump`, migrirana, samo za testove koji čitaju (release review). |
| Testovi | **Playwright** (`@playwright/test`), elementi po ulozi i hrvatskom natpisu (`getByRole`). `data-testid` samo gdje se natpis ponavlja (danas ih je 0). |
| Uređaji | Mobitel 390×844 portrait (touch) i računalo 1440×900. **Bez landscapea** (CLAUDE.md). |
| Vrijeme u testovima | Nitko ne čeka prave minute: test pomakne vremena u bazi SQL-om (`published_at`, `ends_at`…) pa pozove `/api/cron/tick` ili samo učita stranicu. Prijelazi se ionako računaju pri čitanju. |
| Izolacija | Jedna baza po pokretanju. Testovi koji mijenjaju podatke dobiju **svoj scenarij** (svoju ligu, turnir, stol) iz kataloga, pa mogu raditi paralelno. |
| Rutina | Lokalni scheduled task na laptopu, plus korak u `bela-release-review`. |

## 2. Kako je sada

- **Testovi:** 80 unit test fileova (`npm test`) i 10 db testova (`npm run test:db`, traže bazu koja se baca).
  E2E testova u repou nema.
- **Release review** (korak 5) svaki put iznova improvizira headless Chrome klikanje. Skripte prijašnjih sesija
  (`crawl.js`, `flow-*.js`, `e2e-v1/`) bile su u scratchpadovima i macOS ih je obrisao s /tmp.
- **Docker:** u repou nema ni Dockerfilea ni compose filea. Podman VM radi (9 CPU, **6 GB**), a portove 5432
  (`support_fan-db_1`) i 5433 (`bela-sync-pg`) drže drugi kontejneri.
- **Seed** (`prisma/seed.ts`): 17 igrača, 8 ekipa, bye ekipa (id 0) i liga 2 sa 16 utoraka. Nema odigranih
  kola, mečeva, igara, rejtinga, turnira, Burze, sponzora ni zabrana. Kola su zakomentirana.
- **Build:** `npm run build` pušta i `prisma migrate deploy`, pa traži bazu. `postinstall` gradi `argon2` iz
  izvora, pa slika treba `python3`, `make` i `g++`.
- **Env:** `DATABASE_URL`, `AUTH_COOKIE`, `GOOGLE_AUTH_COOKIE`, `SECRET_KEY`, `NEXTAUTH_SECRET`, `CRON_SECRET`,
  `BYE_ID`, `GOOGLE_CLIENT_ID/SECRET`.

## 3. Compose

```
e2e/
├── compose.e2e.yml
├── app.Dockerfile        deps (build alati za argon2) → build (prisma generate + next build) → runtime (next start)
├── env.e2e               lažne tajne samo za ovaj stack, u repou
├── run.sh                worktree na SHA → up → testovi → down → izvještaj
├── playwright.config.ts
├── helpers/              auth.setup.ts (storageState po roli), db.ts (pomak vremena), scorepad.ts (upiši igru…)
├── tests/                smoke/, dozvole/, liga/, turniri/, burza/, profil/
├── report/               (gitignored) HTML izvještaj, traceovi, screenshotovi
└── seed/                 generator podataka (poglavlje 4): npm run seed:e2e i npm run seed:verify; prisma/seed.ts ostaje
    ├── index.ts          redoslijed: ljudi → lige → povijest (bulk) → poredak i rejting → zabrane → večeras (servisi) → turniri → Burza
    ├── play.ts, live.ts  igre po pravilima aplikacije; povijest u bulk, večeras kroz servise
    ├── scenarios/        people, leagues, history, tonight, tournaments, tournamentPlay, bans, burza, sponsors
    ├── verify.ts         invarijante (16 pravila); --report za kopiju produkcije
    └── out/              (gitignored) seed-manifest.json: katalog id-jeva za testove
```

Servisi u `compose.e2e.yml`:

| Servis | Što radi |
| --- | --- |
| `db` | `postgres:<verzija produkcije>`, tmpfs, `TZ=UTC`, healthcheck `pg_isready`. Port samo na `127.0.0.1:55432`, za gledanje. |
| `migrate` | `prisma migrate deploy` iz build slike, kad je `db` zdrav. |
| `seed` | profil `seed`: generator i `seed:verify`. Profil `prod-copy`: `pg_restore` dumpa (s obilaskom za `LeagueNight` / `pg_attver`), pa `migrate`. |
| `app` | `next start`, `TZ=UTC`, env iz `env.e2e` (s `CRON_SECRET` i `BYE_ID=0`). Port `127.0.0.1:3900`. Healthcheck `/login`. |
| `tests` | Službena Playwright slika s verzijom pribijenom uz paket. `BASE_URL=http://app:3000` i `DATABASE_URL` za SQL pomoćnike. |

`run.sh`:
1. Napravi `git worktree add --detach` na traženi SHA (zadano `origin/development`). Tuđe necommitane
   promjene u ovom folderu tako ne ulaze u build.
2. Pokrene `compose -p bela-e2e-<sha> up --build --exit-code-from tests`. Vlastito ime projekta znači da se dva
   pokretanja ne sudaraju.
3. Na kraju napravi `down -v` i `worktree remove`. Ostaju samo `e2e/report/` i sažetak u `reports/e2e/<datum>.md`.

Ciljevi brzine (provjeriti u fazi 1): build s cacheom ~2 min, seed < 2 min (generator danas ~10 s), cijeli suite < 15 min.

## 4. Generirani podaci

Ovo je najvažniji dio plana. Testovi su onoliko dobri koliko su dobri podaci.

**Načela**
1. **Deterministički.** Uvijek isti `E2E_SEED` (zadano 20261114), pa isti dan daje isti svijet i greška se može
   ponoviti. Drugog seeda nema: rubni slučajevi su u svijetu namjerno, kao scenariji, a ne slučajno.
2. **Relativno na sat aplikacije.** "Večeras" se računa s `leagueNightString()` iz `_lib/dates.ts`, a "danas" za
   turnire istom logikom. Pokretanje u 03:00 tako poštuje pravilo od 06:00.
3. **Računato pravilima aplikacije.** Igre se računaju funkcijama aplikacije (bodovanje, zvanja, validacija) i
   upisuju u bulk. Ishodi mečeva i kola, poredak (`TeamScore`) i rejting (replay kao `ratings:replay`) računaju
   funkcije aplikacije, ne seed. Ručni SQL samo za ono što nema pravila (igrači, ekipe, oglasi).
4. **Provjereno.** `seed:verify` provjeri invarijante i zaustavi pokretanje ako ijedna padne. Isti `verify`
   radi i nad kopijom produkcije, kao provjera zdravlja pravih podataka.
5. **Imenovano.** Seed piše `e2e/seed/out/seed-manifest.json` s katalogom imenovanih scenarija i njihovih
   id-jeva (`tournaments.fullWaiting`, `tables.twoPhones`…). Testovi nemaju magične brojeve.
6. **Izmišljeni ljudi.** Hrvatska imena i nazivi ekipa iz generatora, nijedna prava osoba. Screenshotovi i
   traceovi zato smiju u GitHub issue.

**Veličina** (odlučeno 14.11.): jedna, bez prekidača `E2E_SCALE`, bez `small` i `large`. Svijet ima oblik
produkcije i nije veći od nje (dump od 14.11.: 416 igrača, 180 ekipa, 3 lige s 58–76 ekipa i 6–7 večeri,
~24.000 igara, turniri od 14 do 24 ekipe). Količina se ne forsira: liga ima najviše ~20 večeri, a dubina dolazi
kroz scenarije i granice iz koda.

| | Generator danas |
| --- | --- |
| Igrači / ekipe | 409 / 181 |
| Lige | dvije završene (7 i 6 večeri); tekuća (5 odigranih, večeras živa, 5 budućih); 3–4 kola po večeri; 3 male lige za testove koji mijenjaju podatke |
| Igre | ~27.000 |
| Turniri | 14 (2 završena, 3 danas, 9 nadolazećih) |
| Trajanje | ~10 s za cijeli svijet |

**Granice iz koda** dobivaju svoj scenarij, granicu i jedan više: profil igrača pokazuje zadnjih 5 večeri
(`service/players/overview.ts`), pa igrač s 0, 5 i 6 večeri; ekipa na profilu pokazuje 2 lige pa "+N"
(`ui/profiles.ts`), pa ekipa u 3 lige; pretraga ekipa za turnir pokazuje najviše 12
(`service/tournament/entries.ts`), pa 13 ekipa za isti upit; poredak ima postolje 3, pa izjednačeni bodovi.

Brzinu na stvarnoj količini podataka provjerava kopija produkcije (D). `npm run dev:reset` na laptopu se ne
koristi, pa `small` nema korisnika; UX patrola prelazi na generator (pitanje 3).

**Što svijet mora sadržavati** (svako je jedan scenarij u `e2e/seed/scenarios/`)
- **Ljudi:** računi `admin`, `organizer` i `player` (stari usernameovi ostaju), igrači bez datuma rođenja i
  odgovora o pušenju (onboarding), igrač bez ekipe, igrač u dvije ekipe, ekipa od 3 igrača, fotografije sa
  svakim `PhotoVisibility`, dugi nazivi ekipa sa svim dijakriticima, zaključan račun (5 krivih lozinki).
- **Liga:** večer s neparnim brojem ekipa (bye), večer preko ponoći, skica (`DRAFT`) i odobreno, a neobjavljeno
  kolo, stol u svakom stanju dolaska (`PRESENT`, `NO_SHOW`, `SKIPPED`), meč zatvoren istekom vremena, meč
  zatvoren s Završi meč, ispravljen meč, pušački stolovi, Tu smo i zabrane.
- **Igre:** sva zvanja (`TWENTY` do `TWO_HUNDRED`) i bela, pad, čista pobjeda (`complete_victory`), zvanja
  objiju ekipa, igra s 0 bodova za jednu ekipu.
- **Turniri u svakom stanju:** otvoren, pun s listom čekanja, prijave zatvorene, sakriven broj prijava
  (`hide_entries`), otvorene prijave tijekom igre (`open_signups`), automatska kola (`auto_publish`), u tijeku
  (Kolo 2 objavljeno, stolovi: čeka dolazak, igra, nedolazak, preskočen, dodijeljena pobjeda, gotov), završen,
  otkazan, organizatorov i adminov.
- **Ostalo:** Burza (svaki `MarketPostKind`, otvoren, zatvoren i istekao), sponzori s dnevnom statistikom,
  zabrane (ekipa, igrač, trajna, istekla).

**Invarijante u `seed:verify`** (primjeri)
- Zbroj igara meča jednak je rezultatu meča, a pobjednik je onaj s 1001 ili onaj koji vodi kad istekne vrijeme.
- `team1_wins` / `team2_wins` kola odgovaraju mečevima, a poredak iz API-ja odgovara poretku iz kola.
- Nijedna ekipa nije za dva stola u istom kolu, a bye je samo kod neparnog broja ekipa.
- Turnir nema više prijavljenih od `max_teams`, a lista čekanja ide redom prijave.
- Svaka večer lige je unutar trajanja lige, a svako objavljeno kolo ima `published_at`.
- Rejting: jedan zapis po igraču po periodu, vrijednosti u razumnim granicama.

## 5. Testovi

**A. Prolaz kroz sve stranice** (~40 stranica × gost, igrač, organizator, admin × mobitel i računalo). Nema 5xx,
ekrana s greškom, grešaka u konzoli ni vodoravnog scrolla na mobitelu, a u tekstu stranice nema `undefined`,
`NaN` ni `Invalid Date`. Zapisuje i vrijeme odgovora svake stranice, a izvještaj pokaže 10 najsporijih. To je
samo podatak: test zbog vremena ne pada.

**B. Dozvole.** Tablica očekivanih statusa za svih 95 API ruta i 4 role, iz `_lib/auth/permissions.ts`.
`adminGuards.test.ts` to provjerava statički, a ovaj test na živom serveru.

**C. Glavni tokovi** (mobitel, mijenjaju podatke, poredani po vrijednosti)
1. **Ligaška večer od početka do kraja.** Admin klikne Novo kolo, pa Skica i Objavi. Igrači kliknu Tu smo i
   Tko igra, pa na scorepadu upišu igru (zvao → zvanja → bodovi), **isprave spremljenu igru** i kliknu Završi
   meč. Test prijeđe na sljedeći meč i provjeri Kraj kola, poredak i rejting. Ovdje su bili 1bb39ea i #74.
2. **Dva telefona za istim stolom** (dva browser contexta) šalju istu igru. Drugi dobije upozorenje, a igra
   se ne upiše dvaput.
3. **Turnirski dan.** Prijave, lista čekanja, odjava, Tu smo i objava Kola 1. Zatim Nedolazak (pomak 4, 6 i
   10 minuta), Vrati stol, Uredi ishod, Kolo 2 (švicarski sustav), poredak i kraj turnira.
4. **Vrijeme partije.** Pomaknut `ends_at` zatvara meč s upisanim rezultatom.
5. **Adminov ispravak završenog meča** vraća meč u igru, ili upozorenje kaže zašto ne može.
6. **Prijava i registracija.** Pogrešna lozinka, zaključavanje nakon 5 pokušaja, odjava. Google se samo vidi,
   ne klika.
7. **Organizator** na svom turniru može sve, a na adminovom dobije 403.
8. **Burza:** objavi oglas, uredi ga, zatvori ga i ponovi ga.
9. **Profil:** fotografija (upload i crop) i privatnost.

**D. Kopija produkcije** (release review): A i B samo čitaju, plus `seed:verify` invarijante nad pravim podacima.

**E. Kasnije, po želji:** usporedba screenshotova (`toHaveScreenshot`) ~15 ključnih ekrana na mobitelu, sa
zamrznutim satom preglednika.

**Pravila za testove** (idu u CLAUDE.md kad se suite složi)
- Elementi se traže s `getByRole` / `getByLabel`, nikad CSS lancima.
- Zabranjeni su `waitForTimeout` i `force: true`.
- Svaki test provjerava ishod (igra je u popisu, poredak se promijenio), ne samo da se stranica otvorila.
- Test koji mijenja podatke koristi samo svoj scenarij iz kataloga.
- Novi test mora proći `--repeat-each=5` prije commita.
- Ako test otkrije bug u aplikaciji, test ostaje crven i bug ide u izvještaj. Test se ne prilagođava bugu.

## 6. Rutina

- **`bela-e2e-nightly`**, lokalni scheduled task u **03:30**, kad ništa drugo ne radi (fixer je u 00:00 i
  12:00, release review u 02:00 i 14:00, sync u 05:00), nad `origin/development`, uvijek s istim `E2E_SEED`.

  Sažetak ide u `reports/e2e/<datum>.md`. Kad nešto padne, otvori se GitHub issue s labelom `e2e`, koracima,
  screenshotom i SHA-om.
- **`bela-release-review`, korak 5:** improvizirano klikanje zamjenjuje se s `e2e/run.sh --data seed` (cijeli
  suite) i `e2e/run.sh --data prod-copy --suite smoke`. **Nema deploya dok je E2E crven.**
- **Laptop** mora biti budan u 03:30, a Claude aplikacija i Podman VM upaljeni (keep-awake u postavkama
  aplikacije).
- **Playwright agenti** (planner, generator, healer) služe za pisanje novih testova sa mnom, interaktivno. Noćna
  rutina samo pokreće suite i nikad sama ne mijenja testove.

## 7. Faze

| Faza | Što | Gotovo kad |
| --- | --- | --- |
| 0 | Podman: memorija VM-a na 12 GB, `docker-compose` kao compose provider, provjera verzije produkcijskog Postgresa | `podman compose version` koristi docker-compose v2, verzija zapisana |
| 1 | `app.Dockerfile`, `compose.e2e.yml`, `run.sh`, Playwright i jedan test (prijava), sa starim seedom | jedna naredba iz čistog checkouta je zelena, a `down` ne ostavlja ništa |
| 2 | Generator (`e2e/seed/`, `npm run seed:e2e`), katalog u `seed-manifest.json`, `seed:verify`, jedna veličina (oblik produkcije) | seed < 2 min (danas ~10 s), `verify` zelen |
| 3 | A (prolaz kroz stranice) i B (dozvole) | zeleno, uz popis pravih bugova koje su našli |
| 4 | C1–C5, pa C6–C9 | svaki prolazi `--repeat-each=5` |
| 5 | Rutina, release review i `prod-copy` | prva noćna rutina i jedan release review prošli s E2E-om |
| 6 | E (screenshotovi) | po želji |

## 8. Otvorena pitanja

1. **Podman ili Docker Desktop?** Prijedlog: Podman, jer je već tu, a compose file radi s oba.
2. **Memorija Podman VM-a s 6 na 12 GB.** VM se mora restartati, pa nakratko staju `support_fan-db_1` i
   `bela-sync-pg`. Može li?
3. **`prisma/seed.ts`.** Odlučeno 14.11.: generator ga za sada ne zamjenjuje. Na laptopu ga nitko ne koristi
   (`dev:reset` cilja `localhost:5432`, koji drži `support_fan-db_1`), a jedini korisnik je UX patrola u cloudu,
   koja danas podatke gradi klikanjem kroz mobitel. Patrola prelazi na `npm run seed:e2e` i čita
   `seed-manifest.json`, pa noć troši samo na gledanje ekrana, a ne na stvaranje podataka. Kad prijeđe,
   `prisma/seed.ts` i `dev:reset` mogu otići. **15.11.:** patrola je prešla (`rutine/bela-mobile-ux-patrol.md`).
4. **Kad E2E padne:** GitHub issue s labelom `e2e` ili samo izvještaj?
5. **Blokira li crveni E2E deploy na produkciju?** Prijedlog: da.

## 9. Kako dodajemo testove

Odlučeno 14.11., izmijenjeno 15.11.: **nema rutine koja piše testove.** Test piše onaj tko piše kod, u istom
commitu. Koji test (unit, db ili Playwright) kaže graf u [`ORKESTRACIJA_AGENATA.md`](ORKESTRACIJA_AGENATA.md)
pogl. 5. Poglavlje 6 vrijedi kako piše: Playwright agenti služe sesijama, a noćna rutina samo pokreće suite.
Ovo dopunjuje zadnje pravilo poglavlja 5 (`test.fail()`, niže) i odgovara na pitanje 4 iz poglavlja 8: pad E2E-a
otvara GitHub issue.

**Dva puta, oba u sesijama**
1. **Glavni tokovi odmah.** A, B i C1–C9 su konačan popis. Pišu ih sesije u fazama 3 i 4, C1 prvi, jer bi on
   uhvatio 1bb39ea i #74. Svaki je zaseban commit.
2. **Promjena toka nosi svoj Playwright test** u istom commitu. Vrijedi za sve sesije i za fixer.

Zašto i 1, a ne samo 2: 3efe0f4 je imao svoj test (db test za dvostruki upis), a pokvario je susjedni tok,
ispravak spremljene igre. Test "za svoj commit" to ne hvata, hvata ga test cijelog toka koji se vrti prije
deploya.
Zašto nema rutine koja dopisuje testove: test koji piše netko tko nije radio promjenu vidi što kod radi, a ne što
treba raditi, pa može zacementirati bug. I stiže tek nakon deploya.

**Pravilo za commit** (ide u CLAUDE.md kad se suite složi)
- **Playwright test treba** kad se mijenja ono što netko u aplikaciji *radi*: upis i ispravak igre, Tu smo, Tko
  igra, Završi meč, objava kola, prijava i odjava s turnira, Nedolazak, Vrati stol, Burza, prijava u aplikaciju.
  Isto za novi tok, novu API rutu koja mijenja podatke i svaki ispravak buga koji se vidi u toku.
- **Logika iza toka** (pravilo, bodovi, datum) dobije i unit test, a servis koji piše u bazu db test.
- **Test ne treba** za tekst, razmak, boju i raspored bez novog gumba. To hvata A (prolaz kroz stranice).
- **Ispravak buga:** test je crven na commitu prije popravka i zelen s popravkom.
- **Namjerna promjena ponašanja** smije promijeniti `expect` postojećeg testa samo u istom commitu, a commit
  poruka kaže zašto (DECISIONS, issue).
- Sesija pokreće samo svoje testove (`--repeat-each=5`). Cijeli suite vrte noćna rutina i release review.

**Tko što provodi**

| Tko | Što radi | Što nikad ne radi |
| --- | --- | --- |
| `CLAUDE.md` | Pravilo za commit i pravila za testove iz poglavlja 5. Upućuje na agente. | — |
| `.claude/agents/` | Playwright agenti za Claude Code (`npx playwright init-agents --loop=claude`: planner, generator, healer) i naš `e2e-reviewer`, koji svaki novi test provjeri prema pravilima i prema namjeri. Kriterij "test treba / ne treba" stoji u agentima, pa pišu samo testove koji nešto hvataju. Koriste ih sesije i fixer. | Healer ne dira postojeći test, samo onaj koji je napisan u istom radu. |
| `bela-github-issue-fixer` | Ispravak buga s testom crven → zelen. Jedini popravlja crven test iz issuea `e2e`: ili popravi aplikaciju, ili promijeni `expect` kad pokaže namjernu promjenu ponašanja. Skida `test.fail()` kad popravi bug. | Ne mijenja `expect` samo da test prođe. |
| `bela-release-review` | Pregleda nove testove kao svaki commit. Cijeli suite crven = nema deploya (poglavlje 6). Commit koji mijenja tok bez testa: nema deploya, nego issue sa SHA-om. | Ne deploya promjenu toka bez testa, ni commit koji mijenja `expect` bez promjene ponašanja koja to objašnjava. |
| `bela-e2e-nightly` | Cijeli suite, izvještaj, issue `e2e` za pad, issue `flaky` za test koji prođe tek u drugom pokušaju. Na kraju pokrene release review (lanac iz ORKESTRACIJA pogl. 3). | Ne mijenja testove ni kod. |

**Izvještaj noćne rutine** čitaju release review i kroničar: `reports/e2e/<datum>.md` i
`e2e/report/coverage.json`.
- Što je palo (s brojem issuea) i koji su testovi flaky.
- **Pokrivenost:** fixture u Playwrightu bilježi svaku stranicu i svaki API poziv (metoda i ruta). Izvještaj
  navodi stranice (od ~40) i rute (od 95) koje nijedan test nije dotaknuo. Ruta za ispravak igre
  (`/api/ongoing-bela-result/[id]`, 1bb39ea) bila bi na tom popisu.
- Rupe ne popunjava rutina. Idu u jutarnju poruku, a ti odlučiš koja postaje zadatak sesije.

**`e2e/FLOWS.md`**: tokovi iz perspektive igrača, organizatora i admina, uz svaki ime testa ili "nema". Sesija
koja doda tok ili test upiše ga ovdje, u istom commitu.

**Kako se piše test, da ne zacementira bug** (sesije i fixer)
- Očekivanja dolaze iz namjere (zadatak, DECISIONS.md, CHANGELOG.md, issue, pravila Bele iz
  `bela-release-review`), i to **prije** nego što se pokrene aplikacija.
- Aplikacija radi drukčije od namjere, a popravak nije dio ovog commita: test se commita s `test.fail()` i brojem
  novog issuea, a ne prilagođava se. Suite tako ostaje zelen, a kad fixer popravi bug, Playwright javi da test
  više ne pada i fixer skine `.fail`.
- Namjera nije jasna (DECISIONS šuti): sesija pita tebe; fixer otvori issue `treba-korisnika`.
- Nedostaje podatak: novi scenarij u `e2e/seed/scenarios/`, a `seed:verify` ostaje zelen.

**Flaky.** Noćna rutina ima `retries: 1`. Test koji prođe tek u drugom pokušaju ne blokira deploy, ali otvara
issue `flaky`. Flaky dvije noći zaredom: fixer ga stavi u `test.fixme()` s brojem issuea i traži uzrok. Flaky
nije uvijek test: drugi dodir na Završi meč iz #74 bio je pravi bug koji ovisi o vremenu.

**Gotovo za jedan test**
1. Pokriva tok iz `FLOWS.md` ili rutu iz izvještaja, a u `FLOWS.md` uz tok stoji ime testa.
2. Provjerava ishod (igra je u popisu, poredak se promijenio, stol je zatvoren), a očekivanje dolazi iz namjere,
   ne iz onoga što aplikacija danas radi.
3. Drži se pravila iz poglavlja 5: `getByRole` / `getByLabel`, bez `waitForTimeout` i `force: true`, samo svoj
   scenarij iz kataloga.
4. Prolazi `--repeat-each=5` na svježem stacku.
5. Kod ispravka buga: crven na commitu prije popravka, zelen s popravkom.
6. `e2e-reviewer` nema primjedbi.
7. Commit poruka kaže koji tok pokriva, a kod buga i da je test bio crven prije popravka.

**Kad kreće.** Do kraja faze 4 pišu se A, B i C1–C9, a promjena toka do tada nosi unit ili db test. S fazom 5
dolaze pravilo u CLAUDE.md, agenti u `.claude/agents/`, `FLOWS.md`, izvještaj s pokrivenošću i noćna rutina, a
fixer i release review dobiju svoje korake.
