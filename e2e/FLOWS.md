# Tokovi i testovi

Svaki tok iz perspektive igrača, organizatora i admina, i test koji ga pokriva (ili "nema"). Sekcije su u
[`sekcije/`](sekcije/README.md), plan u [`../E2E_SUITE_PLAN.md`](../E2E_SUITE_PLAN.md). Voditelj upisuje retke iz
izvještaja sekcija; sesija koja doda tok ili test dopiše svoj redak u istom commitu.

Test je naveden datotekom (u `tests/`) i početkom imena testa. "(bug)" znači da je test označen `test.fail()` s
komentarom `// BUG:`: test opisuje kako bi trebalo biti, a prolazi dok greška postoji.

## Baza i sve stranice

| Tok | Uloga | Test |
| --- | --- | --- |
| Prijava kroz API i Početna | igrač | `smoke/baza.spec.ts` › a player logged in through the API lands on Početna |
| Gost dobije obrazac za prijavu; baza odgovara manifestu | gost | `smoke/baza.spec.ts` › a guest gets the login form; › the database holds the world of the manifest |
| Svaka stranica kao gost: javne se otvore, ostale vode na Prijavu s ?next= | gost | `smoke/a-stranice.spec.ts`, `a-stranice.racunalo.spec.ts` › guest · <stranica> … |
| Svaka stranica kao igrač: svoje stranice, svoja igra, Početna ili odbijanje za tuđe i adminove | igrač | `smoke/a-stranice*.spec.ts` › player · <stranica> … |
| Svaka stranica kao organizator: svoj turnir, Ekipe i Igrači, "Ovo nije tvoj turnir." na tuđem, "Ne igraš u ovoj rundi." na tuđem semaforu (#88), ništa od lige | organizator | `smoke/a-stranice*.spec.ts` › organizer · <stranica> … (bug: /league/new i /turniri/novi na računalu #87, tuđi stol na mobitelu #86) |
| Tuđi semafor po adresi: Upiši igru se ne vidi ni dok aplikacija pita (#88) | organizator | `dozvole/b-tudji-semafor.spec.ts` › a player who doesn't play at a table never sees Upiši igru's steps… |
| Svaka stranica kao admin: adminovi ekrani na mobitelu i računalu, stol vodi na Tko igra | admin | `smoke/a-stranice*.spec.ts` › admin · <stranica> … |
| Zdravlje stranice: 5xx, konzola, vodoravni scroll, undefined/NaN, ekran greške, dio koji se nije učitao | sve | `helpers/health.ts` (svaki `healthy(page)`) |
| Vrijeme do stranice, 10 najsporijih (samo podatak) | sve | `smoke/a-stranice*.spec.ts` › afterAll (`results/a-slowest-<projekt>.txt`) |

## Dozvole (API)

| Tok | Uloga | Test |
| --- | --- | --- |
| Sve API rute × gost, igrač, organizator, admin | sve | `dozvole/b-dozvole.spec.ts` › jedan test po retku ("METHOD /route · guard · note") |
| Server kaže svakoj roli što smije, kao mapa rola | sve | `dozvole/b-dozvole.spec.ts` › /api/auth/me tells each role what the capability map lets it do |
| Svaki API handler ima redak u tablici dozvola | — | `dozvole/b-dozvole.spec.ts` › every handler of src/app/api has a row in the table, and every row a handler |
| Organizator: Tko igra na stolu svog turnira | organizator | `dozvole/b-dozvole.spec.ts` › GET/PUT /api/rounds/[id]/lineup · … · organizer |
| Organizator: Makni ekipu na svom turniru | organizator | `dozvole/b-dozvole.spec.ts` › DELETE /api/admin/tournaments/[id]/teams/[teamId] · … · organizer (bug #84) |

## Prijava i registracija

| Tok | Uloga | Test |
| --- | --- | --- |
| Prijava korisničkim imenom, i u bilo kojim slovima | igrač | `prijava/c6-prijava.spec.ts` › logging in with the username opens Početna…; › …with capitals and spaces… |
| Prijava emailom u bilo kojim slovima | igrač | `prijava/c6-prijava.spec.ts` › logging in with the email in any case… |
| Kriva lozinka / nepostojeće ime | gost | `prijava/c6-prijava.spec.ts` › a wrong password or an unknown username is refused with the same words… |
| Google gumb (samo vidljiv) | gost | `prijava/c6-prijava.spec.ts` › Prijava and Registracija offer Google first… |
| Deaktiviran račun (DECISIONS #40) | igrač | `prijava/c6-prijava.spec.ts` › a deactivated account can't log in… |
| Prijava s turnira kao gost: natrag na turnir, Natrag i dalje vodi istim putem (#79) | gost | `prijava/c6-prijava.spec.ts` › a guest who logs in from a tournament's Prijavi se is back on it… (#79) |
| Odjava na mobitelu | igrač | `prijava/c6-prijava.spec.ts` › Odjava on Moj profil ends the session… |
| Prijava i odjava na računalu | igrač | `prijava/c6-prijava.racunalo.spec.ts` › on the computer, logging in opens Početna… |
| Zaključavanje nakon 5 pokušaja (po adresi) | igrač | `prijava/c6-zakljucavanje.spec.ts` › five wrong passwords lock the account on that phone… |
| Zaključavanje računa (20 u 15 min) | igrač | `prijava/c6-zakljucavanje.spec.ts` › after 20 failed logins in 15 minutes… |
| Registracija: provjere polja, zauzeto ime i email | gost | `prijava/c6-registracija.spec.ts` › Registracija checks every field in Croatian… |
| Registracija: novi račun s dugim hrvatskim imenima | gost | `prijava/c6-registracija.spec.ts` › a new account with long Croatian names… |
| Onboarding: Datum rođenja i Pušiš li? | igrač | `prijava/c6-registracija.spec.ts` › novi.igrac logs in to Datum rođenja and then Pušiš li?… |
| Onboarding: Kasnije i Preskoči (DECISIONS #38) | igrač | `prijava/c6-registracija.spec.ts` › Kasnije puts Datum rođenja off… |

## Liga: večer, stol i upis igre

| Tok | Uloga | Test |
| --- | --- | --- |
| Novo kolo → Tko igra večeras → Kreiraj → Skica kola → Odobri sva → Objavi → Dnevni poredak | admin | `liga/c1-novo-kolo.spec.ts` › the admin creates tonight's Kolo with Novo kolo… |
| Ekipa s jednim aktivnim igračem: oznaka u Ekipe i Novo kolo, upozorenje na Tko igra (#41) | admin | `liga/c1-jedan-igrac.spec.ts` › a team with one active player is marked in Ekipe and Novo kolo…; › Tko igra has no warning when both teams have two players; `liga/c1-jedan-igrac.racunalo.spec.ts` › Ekipe on the computer marks a team with one active player |
| Tko igra i upis igre (zvao → zvanja → igra → Spremi), pad i Štiglja | igrač | `liga/c1-stol.spec.ts` › Tko igra starts the table, and the hands entered on the scorepad are listed… |
| Ispravak spremljene igre na mobitelu (1bb39ea) | igrač | `liga/c1-stol.spec.ts` › a saved hand corrected on the phone is still one hand… (1bb39ea) |
| Završi meč (drugi dodir, #74), Meč 2, Kraj kola, Dnevni/Ukupni poredak, rejting | igrač | `liga/c1-stol.spec.ts` › Završi meč tapped twice opens Meč 2 and no new hand (#74)… |
| Ispravak igre na tables.correction | igrač | `liga/c1-ispravak.spec.ts` › a player corrects hand 2 through its three steps… |
| Ispravi korak po korak na adminovom scorepadu | admin | `liga/c1-ispravak.spec.ts` › the admin corrects hand 2 on the phone scorepad… |
| Dva telefona upišu istu igru: "Je li ovo nova igra?", Odustani je ostavi jednom (#57) | igrač | `liga/c2-dva-telefona.spec.ts` › the same hand from both phones… (#57) |
| Oba telefona stisnu Spremi u istom trenutku: jedna igra, jedno pitanje | igrač | `liga/c2-dva-telefona.spec.ts` › both phones tap Spremi at the same moment… (#57) |
| Zatvori (✕) na pitanju odbaci kopiju kao Odustani | igrač | `liga/c2-dva-telefona.spec.ts` › closing the question with ✕ drops the copy like Odustani (#57) |
| Upiši i ovu: ista igra namjerno dvaput (DECISIONS #91) | igrač | `liga/c2-dva-telefona.spec.ts` › Upiši i ovu saves the same hand again on purpose… (#57) |
| Ispravak na jednom telefonu dok drugi upisuje novu igru (oba redoslijeda) | igrač | `liga/c2-dva-telefona.spec.ts` › a correction saved on one phone while…; › a new hand saved on one phone while… |

## Liga: Vrijeme partije

| Tok | Uloga | Test |
| --- | --- | --- |
| Sat partije na semaforu (Do kraja partije, Još m:ss jednom po meču) | igrač | `liga/c4-sat.spec.ts` › the timer on the scorepad shows the time left that the database holds… |
| Vrijeme isteklo s otvorenom pločom: meč zatvoren s upisanim rezultatom, Meč 2, Kraj kola | igrač | `liga/c4-istek.spec.ts` › the time runs out with the board open… |
| Igra spremljena nakon isteka se ne broji (Meč je već završen, Na meč, e721909) | igrač | `liga/c4-istek.spec.ts` › a hand saved after the time is up isn't counted… (e721909) |
| Ispravak igre spremljen nakon isteka se ne broji (Meč je već završen, Na meč, #45) | igrač | `liga/c4-istek.spec.ts` › a correction saved after the time is up isn't counted either… (#45) |
| /api/cron/tick zatvara istekli meč bez otvorene ploče | sustav | `liga/c4-istek.spec.ts` › with nobody at the scorepad, /api/cron/tick closes the match out of time… |
| Izjednačen rezultat nakon isteka: još jedna igra završava meč | igrač | `liga/c4-istek.spec.ts` › a level score when the time is up plays one more hand… |

## Liga: adminov ispravak odigranog stola

| Tok | Uloga | Test |
| --- | --- | --- |
| Obriši igru vraća večerašnji zadnji meč u igru s preostalim vremenom; poredak i rejting ga ne broje do zatvaranja | admin, igrač | `liga/c5-vraca-u-igru.spec.ts` › Obriši igru on the deciding hand of tonight's last match puts it back in play… |
| Ispravi korak po korak na Meču 1 nakon Završi meč, prazni Meč 2 nestaje | admin, igrač | `liga/c5-vraca-u-igru.spec.ts` › Ispravi korak po korak on Meč 1 right after Završi meč… |
| Meč se ne može vratiti: upozorenje kaže zašto (5 razloga), Odustani ne mijenja ništa | admin | `liga/c5-upozorenje.spec.ts` › …: the warning says "<razlog>"… |
| Obriši svejedno: meč bez pobjednika, ligaški stol bez Otključaj partiju (DECISIONS #84) | admin | `liga/c5-upozorenje.spec.ts` › Obriši svejedno leaves Meč 1 without a winner… |
| Dopiši odigranu igru meču bez pobjednika (računalo) | admin | `liga/c5-dopisi-igru.racunalo.spec.ts` › the admin adds the hand that was played… |
| Otključaj partiju na turnirskom stolu kad se meč ne može vratiti | admin | `liga/c5-otkljucaj.spec.ts` › Kolo 1's table when Kolo 2 is out… |

## Turniri

| Tok | Uloga | Test |
| --- | --- | --- |
| Prijava i odjava ekipe na turnir | igrač | `turniri/c3-prijave.spec.ts` › a player signs his team up for an open tournament and signs it off again |
| Lista čekanja i ulazak prve ekipe nakon odjave | igrač | `turniri/c3-prijave.spec.ts` › a full tournament puts a sign-up on the waiting list in its turn… |
| Prijave zatvorene i otkazan turnir odbijaju ekipu | igrač | `turniri/c3-prijave.spec.ts` › sign-ups closed and a cancelled tournament refuse a team… |
| Sakrij broj prijava (gost, igrač, organizator, admin; DECISIONS #93) | sve | `turniri/c3-prijave.spec.ts` › Sakrij broj prijava: whoever runs the tournament sees…; › …on the organizer's own tournament… |
| Tu smo, adminov dolazak, zatvaranje dolaska | igrač, admin | `turniri/c3-dolazak.spec.ts` › Tu smo, the admin's arrival screen and the start time… |
| Novi turnir traži Okupljanje i Početak (okupljanje prije početka), poslužitelj odbija turnir bez njih | admin | `turniri/c3-dolazak.spec.ts` › Novi turnir asks for Okupljanje and Početak… |
| Složi i objavi Kolo 1 | admin | `turniri/c3-nedolazak.spec.ts` › the admin makes Kolo 1 of a ready tournament with Složi Kolo 1… |
| Nedolazak za stol 4 / 6 (1001 : 700, zabrana) | igrač | `turniri/c3-nedolazak.spec.ts` › Nedolazak za stol: no question before 4 minutes… |
| Nedolazak za stol 10 (preskok) | sustav, igrač | `turniri/c3-nedolazak.spec.ts` › a table with neither a game nor an answer is skipped at 10 minutes… |
| Stranica turnira nakon Ne, nisu došli (#85) | igrač | `turniri/c3-nedolazak.spec.ts` › after Ne, nisu došli on the tournament's page… |
| Javi organizatoru nakon Ne, nisu došli (#60) | igrač | `turniri/c3-nedolazak.spec.ts` › Nedolazak za stol: no question before 4 minutes… |
| Bez Javi organizatoru: turnir bez telefona organizatora (#60) | igrač | `turniri/c3-nedolazak.spec.ts` › a tournament without an organizer's phone… |
| Bez Javi organizatoru: ekipa koju su prvi prijavili da nije došla (#60) | igrač | `turniri/c3-nedolazak.spec.ts` › a team declared absent first… |
| Vrati stol | admin | `turniri/c3-popravci.spec.ts` › Vrati stol brings a no-show table back into play… |
| Uredi ishod | admin | `turniri/c3-popravci.spec.ts` › Uredi ishod gives a skipped table to one team… |
| Kolo 2 (švicarski), poredak i kraj turnira | admin, igrač | `turniri/c3-kolo2.spec.ts` › Kolo 2 pairs the neighbours of the standings… |
| Otvorena stranica turnira dobije stol novog kola bez ponovnog učitavanja (#85) | igrač | `turniri/c3-kolo2.spec.ts` › with the tournament's page open, the player's table of a Kolo just published… |
| Povratak u aplikaciju odmah pokaže stol novog kola (#85) | igrač | `turniri/c3-kolo2.spec.ts` › a player who comes back to the app sees the table of a Kolo published meanwhile… |
| Turniri: stol novog kola na osvježavanju od 30 s (#85) | igrač | `turniri/c3-kolo2.spec.ts` › Turniri reads the player's table again with the tournaments every 30 s… |
| Poredak i rezultati: Započni igru na stolu novog kola (#85) | igrač | `turniri/c3-kolo2.spec.ts` › Poredak i rezultati reads the player's table again with the results every 30 s… |
| Gost na Turnirima ne traži stol (#85) | gost | `turniri/c3-kolo2.spec.ts` › a guest on Turniri never asks for a table to play… |
| Završen turnir kao gost | gost | `turniri/c3-kolo2.spec.ts` › a finished tournament (tournaments.finished) as a guest sees it… |

## Turniri: organizator

| Tok | Uloga | Test |
| --- | --- | --- |
| Početna i traka organizatora na mobitelu (52ef6b3) | organizator | `turniri/c7-svoj-turnir.spec.ts` › Početna opens the organizer's phone on their own Turniri… |
| Novi turnir | organizator | `turniri/c7-svoj-turnir.spec.ts` › the organizer makes a tournament with Novi turnir, and it is theirs |
| Podaci · Spremi promjene (svoj turnir) | organizator | `turniri/c7-svoj-turnir.spec.ts` › the organizer changes their tournament in Podaci… |
| Podaci · Pušački stolovi (svoj turnir): raspon se sprema kao stolovi, stol 0 se ne sprema | organizator | `turniri/c7-svoj-turnir.spec.ts` › the organizer sets Pušački stolovi in Podaci… |
| Prijave otvorene / zatvorene, Dodaj ekipu | organizator | `turniri/c7-svoj-turnir.spec.ts` › the organizer closes and reopens their sign-ups and adds a team… |
| Makni ekipu (svoj turnir) | organizator | `turniri/c7-svoj-turnir.spec.ts` › Makni takes a team off the organizer's own tournament (bug #84) |
| Otkaži i Vrati turnir samo admin (organizator ih nema, poslužitelj ih odbija) | organizator | `turniri/c7-svoj-turnir.spec.ts` › the organizer can neither cancel their tournament nor bring it back…; `turniri/c7-tudi-turnir.spec.ts` › on the admin's tournament (open/live) the organizer's Otkaži turnir / Vrati turnir is refused… |
| Admin otkaže turnir (Otkaži turnir) i vrati ga (Vrati turnir), prijave opet otvorene, ekipe iste | admin | `turniri/c7-svoj-turnir.spec.ts` › the admin cancels the organizer's tournament with Otkaži turnir… |
| Na računalu organizator nema Otkaži, Obriši ni Vrati turnir, admin ih ima | organizator, admin | `turniri/c7-svoj-turnir.racunalo.spec.ts` › Podaci on the computer gives the organizer neither…; › a tournament the admin cancelled shows the organizer… |
| Obriši turnir samo admin | organizator | `turniri/c7-svoj-turnir.spec.ts` › the server refuses the organizer's Obriši turnir…; › Podaci gives the organizer neither Otkaži turnir nor Obriši turnir… |
| Dodaj kolo / Obriši kolo na završenom turniru | organizator | `turniri/c7-svoj-turnir.spec.ts` › on their finished tournament the organizer adds a Kolo… |
| Potvrda dolaska: Označi dolazak, Aktivna | organizator | `turniri/c7-dan-turnira.spec.ts` › on the day the organizer marks the teams that came… |
| Složi Kolo 1 prije Početka s otvorenim prijavama: samo potvrđene ekipe, kasna potvrda čini Skicu zastarjelom → Objavi (nepotvrđena postaje Neaktivna) | organizator | `turniri/c7-dan-turnira.spec.ts` › before Početak, with sign-ups still open, Složi Kolo 1 draws only the teams that confirmed arrival… |
| Složi Kolo 1 s Pušačkim stolovima: ekipa s najviše pušača za pušačkim stolom, oznaka u Skici i Kolu 1 | organizator | `turniri/c7-dan-turnira.spec.ts` › with Pušački stolovi, Složi Kolo 1 seats the team with the most smokers… |
| Isključi ekipu / Vrati | organizator | `turniri/c7-dan-turnira.spec.ts` › once their tournament has started the organizer takes a team out… |
| Uredi ishod preskočenog stola | organizator | `turniri/c7-dan-turnira.spec.ts` › a table skipped at 10 minutes gets the organizer's Uredi ishod… |
| Vrati stol | organizator | `turniri/c7-dan-turnira.spec.ts` › Vrati stol puts the organizer's skipped table back in play… |
| Kolo preko cijelog ekrana (ekran u klubu, i TV od 960 px) | organizator | `turniri/c7-kolo-ekran.racunalo.spec.ts` › Kolo preko cijelog ekrana stays open and fills the screen when the page narrows to a TV's 960 px… |
| Kolo preko cijelog ekrana prati turnir: sljedeće kolo čim je objavljeno | organizator | `turniri/c7-kolo-ekran.racunalo.spec.ts` › Kolo preko cijelog ekrana moves on to Kolo 2 by itself once it is out… |
| Objava novog kola prebacuje odabrani tab Kola na to kolo, i s Poretka (skica ne) | organizator | `turniri/c7-kolo-ekran.racunalo.spec.ts` › a Kolo published takes the Kola tab picked on another Kolo to it, also from Poredak… |
| Strelice u Kolu preko cijelog ekrana (kroz objavljena kola; nova objava i dalje preuzima ekran) | organizator | `turniri/c7-kolo-ekran.racunalo.spec.ts` › the arrows of Kolo preko cijelog ekrana go through the Kolos out… |
| Semafor svog stola (Tko igra, Upiši igru) | organizator | `turniri/c7-dan-turnira.spec.ts` › the organizer opens a table of their Kolo 1…; › the scorepad's routes take the organizer's hands… |
| Tuđi turnir skriven na ekranu | organizator | `turniri/c7-tudi-turnir.spec.ts` › the admin's tournament (open/live) is not in the organizer's Turniri…; › a table of the admin's live tournament shows the organizer no scorepad…; › …tells the organizer it isn't theirs… (bug #86) |
| Tuđi turnir: 403 na svakoj ruti | organizator | `turniri/c7-tudi-turnir.spec.ts` › on the admin's tournament (open/live) the organizer's … is refused with 403 and changes nothing |
| Adminove stranice na mobitelu (liga, Sponzori, igrač) | organizator | `turniri/c7-admin-stranice.spec.ts` › on the phone the league's management…; › a player's page shows the organizer none of the admin's controls…; › …the player's phone number |
| Liga i igrači: 403 | organizator | `turniri/c7-admin-stranice.spec.ts` › the organizer's … is refused with 403 and changes nothing |
| Izbornik i adminove stranice na računalu | organizator | `turniri/c7-admin-stranice.racunalo.spec.ts` › the organizer's menu on the computer…; › Upravljanje ligom / Nova liga by its address refuses the organizer… (bug #87) |

## Burza

| Tok | Uloga | Test |
| --- | --- | --- |
| Objava oglasa Trebam zamjenu (provjere, broj na profil) | igrač | `burza/c8-objava.spec.ts` › Trebam zamjenu: Objavi oglas waits for a whole number… |
| Odbijanje sa servera na obrascu (večer maknuta iz rasporeda) | igrač | `burza/c8-objava.spec.ts` › Trebam zamjenu: a night the league stopped playing while the form was open… |
| Objava oglasa Tražim partnera (broj s profila, Zamijeni i broj na profilu) | igrač | `burza/c8-objava.spec.ts` › Tražim partnera: the profile's number is filled in… |
| Objava oglasa Dostupan sam (Odaberi barem jedno, broj profila) | igrač | `burza/c8-objava.spec.ts` › Dostupan sam: Objavi oglas needs at least one of Zamjena and Novi partner… |
| Uređivanje oglasa ponovnom objavom (sve tri vrste, DECISIONS #29) | igrač | `burza/c8-uredi.spec.ts` › editing Dostupan sam…; › Tražim partnera for the same league again…; › Trebam zamjenu for the same night and teammate again… |
| Zatvori oglas na stranici oglasa | igrač | `burza/c8-uredi.spec.ts` › Zatvori oglas on the ad's page… |
| Objavi ponovno (na mjestu; kad je isti oglas već gore; zamjena kojoj je večer prošla) | igrač | `burza/c8-uredi.spec.ts` › Objavi ponovno puts a closed ad back up in place…; › …when the same ad is already up…; › …on a substitute ad whose night has passed… |
| Moji oglasi: Aktivni i Prošli, stanja i rokovi | igrač | `burza/c8-moji.spec.ts` › Moji oglasi shows each of the player's ads under Aktivni or Prošli… |
| Zatvori oglas u Mojim oglasima | igrač | `burza/c8-moji.spec.ts` › Zatvori oglas on Moji oglasi closes without asking… |
| Kartice Burze i datumi Zamjena, istekli oglasi | igrač | `burza/c8-moji.spec.ts` › Burza's tabs list the open ads of their kind… |
| Javna Burza za gosta, objava traži prijavu | gost | `burza/c8-gost.spec.ts` › a guest reads every open ad of the public Burza… |
| Gost s Objavi na Prijavu i natrag na obrazac (#79) | gost | `burza/c8-gost.spec.ts` › a guest sent to Prijava from Objavi comes back to the form once logged in (#79) |
| Gost bez broja, prijava s oglasa vraća broj (#11) | gost | `burza/c8-gost.spec.ts` › a guest gets no phone number, and logging in from an ad brings its number back… (#11) |

## Profil

| Tok | Uloga | Test |
| --- | --- | --- |
| Dodaj sliku, izrez (zum) i Spremi; slika na Moj profil, u Moje ekipe i na stranici ekipe | igrač | `profil/c9-slika.spec.ts` › Dodaj sliku: the picked photo goes through the crop and Spremi… |
| Odustani u izrezu; igrač sam miče sliku (i iz Mojih ekipa odmah, #80) | igrač | `profil/c9-slika.spec.ts` › Odustani in Pomakni i zumiraj keeps the photo… |
| Nova slika u Moje ekipe odmah (#80) | igrač | `profil/c9-slika.spec.ts` › a new photo shows in Moje ekipe at once… |
| Tko vidi sliku · Svi / Ja i suigrači / Samo ja | igrač, suigrač, drugi igrač, gost | `profil/c9-privatnost.spec.ts` › Tko vidi sliku · Svi…; › · Ja i suigrači…; › · Samo ja… |
| Moj profil: Mobitel | igrač | `profil/c9-podaci.spec.ts` › Mobitel: a number too short can't be saved… |
| Moj profil: Datum rođenja | igrač | `profil/c9-podaci.spec.ts` › Datum rođenja: a day in the future or before 1900 can't be saved… |
| Moj profil: uređivanje s otvorenom tipkovnicom (polje i Spremi na ekranu) | igrač | `profil/c9-podaci.spec.ts` › Mobitel, Korisničko ime, Datum rođenja: with the keyboard open… (#36) |
| Moj profil: Pušač | igrač | `profil/c9-podaci.spec.ts` › Pušač: the switch is saved as soon as it is flipped… |
| Moj profil: Moje ekipe | igrač | `profil/c9-podaci.spec.ts` › Moje ekipe: the player's teams with their players… |
| Odjava s profila | igrač | `profil/c9-podaci.spec.ts` › Odjava: the phone is logged out… |
| Admin: Makni sliku igrača | admin | `profil/c9-admin-slika.spec.ts` › Makni sliku: asked first… |
| Admin: Zabrani novu sliku | admin, igrač | `profil/c9-admin-slika.spec.ts` › Zabrani novu sliku: the photo stays… |
| Admin: Makni sliku sa Zabrani i novu sliku | admin, igrač | `profil/c9-admin-slika.spec.ts` › Makni sliku with Zabrani i novu sliku… |

## Nema testa

| Tok | Zašto |
| --- | --- |
| Istek zaključavanja nakon 5 pokušaja (5 min) | rok živi u memoriji servera, nema sata za pomaknuti; pokriva ga `loginLimiting.test.ts` |
| Profilna slika na računalu (PhotoDialog, ispusti datoteku) i Koristi Google sliku | C9 je samo mobitel; Google traži pravi račun |
| Završi meč na organizatorovu stolu | završen meč mijenja rejting, a čišćenje fixturea ga ne vraća; 403 na tuđem stolu je pokriven |
| Moj profil s iOS tipkovnicom (smanji se samo visual viewport; Početni zaslon i Odjava se sklone) | headless Chromium ne smanjuje samo visual viewport; Android način pokriva `profil/c9-podaci.spec.ts` (#36) |
| /api/auth/[...nextauth] (GET/POST) | pod `next start` bez AUTH_TRUST_HOST odgovara 500 UntrustedHost |
