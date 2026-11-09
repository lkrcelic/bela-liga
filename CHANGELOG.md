# Changelog

What the commits changed for the people using the app, newest first. The reasons and details are in DECISIONS.md.

## 09.11.2026 · Kolo preko cijelog ekrana i Otvori u popisu turnira

Na developmentu.

### Admin
- **Kolo preko cijelog ekrana (računalo).** Objavljeno kolo ima u redu statusa novo dugme uz *Uredi stolove*: otvara kolo preko cijelog ekrana, sa stolovima na dvije trećine i **poretkom turnira** na trećini — za ekran u klubu. Zaglavlje kaže koje je kolo, koliko je stolova uživo i koliko je gotovo; **Zatvori** (ili Esc) vraća natrag. Prikaz se sam osvježava dok se igra, a ništa se u njemu ne uređuje.
- **Otvori u popisu turnira (računalo).** Svaki redak u *Turniri* ima dugme **Otvori** koje vodi u upravljanje turnirom; dvoklik na redak radi kao i dosad.

## 09.11.2026 · Broj iz oglasa vide samo prijavljeni igrači

Not deployed yet (DECISIONS #90).

### Players
- **Broj telefona iz Burze više nije javan.** Oglasi se i dalje vide bez prijave (i dalje se mogu dijeliti), ali na oglasu bez prijave stoji „Broj vide igrači s računom.“ i dugme **Prijavi se da vidiš broj**, koje nakon prijave vrati na taj isti oglas. Prijavljeni igrači vide broj, Nazovi i WhatsApp kao i dosad, a svoj oglas i dalje vidiš cijeli.
- Razlog: broj si dao da te nađe suigrač, a ne da ga s interneta pokupi bot (spam, WhatsApp prijevare).

## 08.11.2026 · Poziv za instalaciju ne vraća se svaki put

Not deployed yet.

### Players
- **„Nastavi u pregledniku“ se pamti.** Poziv „Belatronika radi bolje kao aplikacija“ više ne skače preko Početne na svakom povratku — kad ga odbiješ (ili ga odmakneš), miran je **tjedan dana** na tom telefonu. Na večeri lige se nakon svakog kola vraćaš na Početnu i dosad ti je svaki put prekrio **Započni igru**.
- Poziv i dalje stoji na **Prijavi**, pa ga možeš otvoriti kad poželiš instalirati aplikaciju.

## 08.11.2026 · Polja na telefonu više ne zumiraju stranicu

Not deployed yet.

### Admin
- **iPhone više ne zumira stranicu** kad staneš u polje: "Traži ekipu" (Novo kolo · Promijeni, Skica kola), "Dodaj ekipu · ime ekipe", "Dodaj igrača", "Dodaj u ligu", "Dodaj u ekipu", "Traži ekipu ili igrača" u Upravljanju turnirom i **Bilješke lige** sad su 16 px umjesto 15, pa se više ne moraš odzumirati usred večeri lige. Na računalu su polja ista kao prije.

## 09.11.2026 · Ista igra s dva mobitela

Not deployed yet (DECISIONS #91).

### Players
- **Ista igra upisana s dva mobitela više se ne broji dvaput.** Ako je netko za stolom upisao igru dok si ti bio u
  upisu, **Spremi** prvo pita: *"Je li ovo nova igra?"* uz ono što je drugi mobitel upisao ("S drugog mobitela je
  upisana igra 1 (42 : 120)").
- **Odustani** odbaci tvoj upis i vrati te na semafor (igra je već tamo), **Upiši i ovu** upiše i tvoju — za slučaj da
  su se stvarno odigrale dvije iste igre.
- Ako u međuvremenu nitko nije ništa upisao, Spremi radi kao i dosad, bez pitanja.

## 07.11.2026 · Brži upit za nedolazak i Otključaj partiju

Not deployed yet (DECISIONS #89). Needs a migration on the database.

### Players
- **Upit "Jesu li … za stolom?" dolazi brže**: pojavi se **3 minute** nakon što kolo izađe (prije 5), odgovor radi **od 5. minute** (prije od 8.), a stol se preskače u **8. minuti** (prije u 10.). Ukupno čekanje je kraće za dvije minute, a pitanje stigne dok je mobitel još u ruci.

### Admin
- **Otključaj partiju** na svakom zaključanom stolu turnira, u semaforu stola. Iznad dugmeta piše zašto je zaključan: nedolazak, preskočen meč, isteklo Vrijeme partije ili odigrana runda.
- Kod otključavanja biraš **koliko partija traje od sada** (10–45 min ili Drugo); to vrijeme vrijedi za **taj stol**, ne dira vrijeme turnira.
- **Nedolazak**: otključavanje briše upisanih 1001 : 700, **vraća isključenu ekipu u turnir** i **ukida automatsku zabranu prijava** iz 1. kola. Stol je ponovo nov.
- **Preskočen meč**: obje ekipe se vraćaju u turnir, stol je nov.
- **Vrijeme isteklo / Gotovo**: zadnja partija se **nastavlja s upisanim igrama** i novim vremenom, a njena pobjeda se skida s rezultata stola dok se partija ponovo ne završi.
- Upozorenje u potvrdi: **kola složena s tim rezultatom ostaju kakva jesu** — ako treba, složi ih ponovo.
- Ligaški stolovi se ne otključavaju (ispravljaju se upisom igara, kao i dosad).

## 07.11.2026 · Korisničko ime vidljivo svima

Not deployed yet (DECISIONS #88).

### Players
- **Korisničko ime je javno.** Na tuđem profilu u **Osobni podaci** sad piše i **Korisničko ime** (@handle), pored imena i prezimena.
- **Početna · Liga** i **Raspored**: pod imenom svakog igrača tvoje ekipe piše njegov **@username** (na svom redu ti i dalje piše "(ti)").
- **Moje ekipe** i **Ekipe** na profilu igrača: igrači su sad označeni svojim **@username** (puno ime se vidi na hover).
- **Stranica ekipe**: pod imenom svakog igrača piše @username, ne više ime ekipe.
- **Rejting**: detalj igrača otvara se s "@username · ekipa · N rundi", a **pretraga nalazi igrača i po korisničkom imenu**.
- **Prijava ekipe na turnir**: suigrača sad tražiš po **imenu ili korisničkom imenu**, a svaki rezultat pokazuje @username.
- Stranice koje se gledaju bez prijave (turniri, poredak) također pokazuju korisnička imena.

### Changed
- Napomena pod osobnim podacima sad točno kaže što ostaje privatno: **"Email, mobitel, datum rođenja i Pušač vidljivi su samo igraču i administratorima."** Mobitel uz to vidi i organizator.
- Burza ostaje kakva je (oglas nosi ime autora, bez korisničkog imena), a **Tko igra ovu rundu?** za završenu rundu ostaje adminu — jer se tamo potvrđuje ko je igrao.

## 07.11.2026 · Otvoreni turnir: prijave cijelo vrijeme

Not deployed yet (DECISIONS #88). Needs a migration on the database.

### Admin
- U **Podacima** turnira je novi izbor **Prijave · Do početka / Cijeli turnir**, pored **Iduća kola**. Svi postojeći turniri su **Do početka**, dakle rade kao i dosad.
- **Cijeli turnir**: ekipe se mogu prijaviti i dok turnir traje, sve dok se ne složi zadnje kolo. U vrijeme početka i dalje se odlučuje tko je tu (tko nije stisnuo Tu smo postaje neaktivan), samo se prijave ne zatvaraju.
- **Dodaj ekipu** radi i usred takvog turnira, na telefonu i na računalu: ekipa je odmah u turniru ili na listi čekanja i igra od idućeg kola.
- Kod otvorenog turnira **Kolo 1 se slaže bez zatvaranja prijava** — složi se s onima koji su tu, a prijave idu dalje.
- Prekidač **Prijave otvorene/zatvorene** sad radi i dok turnir traje, pa ih možeš zatvoriti ručno kad god.

### Players
- Na turniru s otvorenim prijavama **Prijavi se** stoji i dok se igra. Tko se prijavi usred turnira broji se kao prisutan i igra od idućeg kola — ne mora stiskati Tu smo.
- Ako je turnir pun, prijava ide na listu čekanja i ulazi sama čim se mjesto oslobodi.
- Kad se složi zadnje kolo, prijave se zatvaraju.

## 07.11.2026 · Brisanje bilo kojeg kola turnira

Not deployed yet (DECISIONS #87).

### Admin
- **Kola** na turniru: kanta je sad pored **svakog** kola, u bilo kojem statusu — Čeka, Skica, Objavljeno, Uživo ili Odigrano.
- Turnir uvijek ima jedno kolo manje nakon brisanja, a kola iza obrisanog pomiču se za jedan broj.
- Briše se ono što je složeno: stolovi tog kola i **svih složenih kola iza njega**, jer su ona složena po njegovim rezultatima. Kolo koje još nije složeno zato ne briše ništa — samo skrati plan. A brisanje Kola 1 usred turnira očisti odigrano i ostavi plan spreman da se složi ponovo.
- Svako brisanje pita prije. Kolo koje nije u statusu **Čeka** nosi **upozorenje** i rečenicu po posljedici ("Brišu se i kola 3, 4, jer su složena po rezultatima ovog."). Ako se za nekim od tih stolova stvarno igralo, gumb piše **Obriši s rezultatima** i rejting se računa ponovo.
- Turnir uvijek ostaje s barem jednim kolom.
- Brisanje kola može admin na svim turnirima, a organizator samo na svojima.
- Gumb **Obriši s rezultatima** se pojavi i kad je za stolom odigran meč **bez pobjednika** — prije je potvrda nudila samo **Obriši kolo**, a brisanje bi zatim bilo odbijeno s "Potvrdi brisanje s rezultatima", pa se iz tog dijaloga nije moglo dalje.

## 07.11.2026 · Organizator: nova rola

Not deployed yet (DECISIONS #86). Needs a migration on the database.

### Players
- Beside your name on **Moj profil** there is now a label saying what you are: **Admin** or **Organizator**. A player has none. The same label is on a player's page, on the phone and on the computer, so everyone sees who runs the league and who runs tournaments.

### Admin
- **Rola** replaces the **Admin** switch in "Uredi osobne podatke" and on a player's phone page: **Igrač**, **Organizator** or **Administrator**, with a line under it saying what each one does. The old rules hold — you can't take your own administrator role, and the last administrator stays one.
- An **Organizator** can: make a tournament, and edit, run and cancel **the ones they made** (kola, Skica, Objavi, stolovi, rezultati, prijave, dolasci, Isključi ekipu); make a team and edit any team; open the **Igrači** list with names, teams and phone numbers.
- An **Organizator** cannot: delete a tournament (only **Otkaži**), open or change anyone else's tournament, touch the league (Novo kolo, Upravljanje ligom, večeri, Datumi), delete a team, block a photo, see usernames, emails or birth dates, edit or delete a player, give a role, or open Sponzori, Burza moderation and Rejting.
- The menu now shows each entry to whoever may use it, so an organizer's menu holds **Turniri**, **Ekipe**, **Igrači** and nothing of the league's.
- On the phone the bottom bar shows only the tabs you may use, so an organizer's bar is **Turniri · Ekipe · Igrači**, and their Početna opens on their Turniri (Večer lige is the league's).
- The tournaments made before this have no owner, so they stay the admin's.
- **Zabrana prijava** stays the admin's for now: a ban is league wide and can't yet be tied to one tournament.

## 07.11.2026 · Raspored duge lige se skrola i na Androidu

Live since 07.11. (f1524b2; the deploy 6480d45 carries this entry).

### Players
- **Raspored** on the phone: a league with many nights (the test league has 480) can be scrolled again on Android. The list of nights was a box that could scroll by a fraction of a pixel of its own, and on Android the finger stayed in it, so the page under it didn't move; now the whole page scrolls, as it already did on the iPhone. On the computer the list still scrolls inside its card.

## 07.11.2026 · Vidljivost slike samo klikom na sliku

Live since 07.11. (f1524b2, DECISIONS #85).

### Players
- **Tko vidi sliku** is set by tapping the photo, nowhere else. The separate card under the team's header (**Tko vidi sliku ekipe · Vidljivost ›**) and the **Tko vidi sliku** row in Podaci on Moj profil are gone from the phone, and the **Tko vidi moju sliku** card is gone from the computer's Moj profil — each took a block of screen only to open what the photo opens.
- On the computer, **Profilna slika** now has the choice in the dialog, next to the photo, as **Slika ekipe** already did.
- While an admin has blocked the photo, clicking it on the computer now says so; before, the photo did nothing there and the note sat in the card that is gone.

## 07.11.2026 · Meč bez pobjednika: upozorenje umjesto zabrane

Live since 07.11. (fd45c79, DECISIONS #84).

### Admin
- On a table's scorepad (computer and phone), changing or deleting a hand of a **finished match** so that nobody is left over 1001 is no longer refused: **Meč ostaje bez pobjednika?** says what the score becomes ("Nakon ove promjene meč je 860:640 i nitko nema 1001, pa se ne broji nijednoj ekipi.") and asks first. **Spremi svejedno** / **Obriši svejedno** saves it, **Odustani** keeps what was entered.

## 07.11.2026 · Vrijeme partije: kraj čim vrijeme istekne

Live since 07.11. (fd45c79, DECISIONS #83).

### Players
- When **Vrijeme partije** runs out, the match ends at once with the score entered then (the team with more points wins) and the board moves on to the next match or **Kraj kola** by itself; before, the board waited 2 minutes with no button and looked frozen. A level score still plays one more hand.
- A hand still being entered when the time runs out doesn't count: **Spremi** takes the phone back to the table, which has moved on. The 5-minute warning now says "…a igra koja još nije spremljena ne računa se."

### Admin
- A table's scorepad shows the winner of a match closed by time (the team with more points); before, it showed no winner, since nobody had reached 1001.

## 07.11.2026 · Tu smo: jedan igrač je dovoljan, podebljano

Live since 07.11. (fd45c79).

### Changed
- **Potvrda dolaska**: the part saying one player is enough is now bold: on Početna before the tournament's window ("**jedan igrač stisne "Tu smo"**"), in the league's open window and in the sheet right after signing up for a tournament ("**Dovoljno je da potvrdi jedan od vas.**").

## 07.11.2026 · Natrag zatvara prozor

Live since 07.11. (fd45c79).

### Changed
- On the phone, **Back** (Android's back button or gesture, the browser's Back) closes the open sheet or full-screen window (Profilna slika, Uredi večer, the scorepad's Igra N and Ručni unos, **Pomakni i zumiraj**, a photo opened large) and keeps you on the page; before, it left the page and lost what was typed. With two open (the crop over Novi sponzor) it closes only the top one. While something is saving, Back leaves the sheet open.

## 06.11.2026 · Uredi večer i Nova večer na mobitelu

Live since 07.11. (fd45c79).

### Admin
- **Datumi** on the phone: in **Uredi večer** and **Nova večer** the fields scroll inside the sheet and **Spremi**, **Vrati na zadano**, **Makni večer** and **Dodaj večer** stay under them, so **Drugo mjesto**, an error or the keyboard no longer pushes them off the screen (iPhone SE, 360 px Android).

## 05.11.2026 · Prijava prije registracije

Live since 07.11. (fd45c79, DECISIONS #82).

### Changed
- **Sjedni za stol.** (a guest's Prijavi se on a tournament, or anything locked) has **Prijavi se** as its big button and **Nemaš račun? Registriraj se** under it; before, the big button was Napravi račun and led to Registracija.
- Početna · Liga for a guest: the night's card has **Prijavi se** and **Nemaš račun? Registriraj se** under it, instead of only Napravi račun.

## 05.11.2026 · Turnir s jednom partijom: pobjeda 1 bod

Live since 07.11. (fd45c79).

### Players
- **Turniri**: in a tournament with **1 partija po kolu** a won table counts **1 bod** in Poredak (one partija to 1001 is worth one point); before, it counted 2. With two partije it stays 2 for a win and 1 for a draw. Tournaments already played show the new points too, and the Kolos made from now on are paired by them.

### Admin
- Poredak's note says **pobjeda 1** for a tournament with one partija po kolu, **pobjeda 2, neriješeno 1** for two.

## 05.11.2026 · Registracija: najviše 20 računa na sat s jedne mreže

Live since 07.11. (fd45c79).

### Players
- **Registracija** takes at most 20 new accounts per hour from one address (counted in the database, so it holds on every server), so a script can't fill the player lists with junk accounts. The 21st gets "Previše registracija s ove mreže. Pokušaj ponovno za sat vremena."; a taken username or a wrong field doesn't count.

## 05.11.2026 · Nema uskakanja nakon zadnjeg kola

Live since 07.11. (fd45c79).

### Players
- **Liga**: once the night's last round (Kola po večeri) is published, a team that isn't here no longer gets **Tu smo · Želimo uskočiti** on Početna; the card says "Zadnje kolo večeri je već počelo, pa se više ne može uskočiti." The server refuses it too. A team already here can still press Odlazimo.
- **Turniri**: once the last Kolo is made (a draft too), a team that doesn't play no longer gets **Tu smo · Želimo uskočiti** on the tournament's page or Početna ("Zadnje kolo je već složeno, pa se više ne može uskočiti."); the server refuses it, and the admin's Označi dolazak for a team that doesn't play as well.

## 04.11.2026 · Registracija: datum rođenja i korisničko ime

Live since 07.11. (fd45c79).

### Players
- **Registracija** refuses a birth date that doesn't exist (31. 2.), is in the future or before 1900 ("Neispravan datum rođenja."), and a username with spaces or other signs than a–z, numbers, dot and underscore, as Moj profil does; before, 31. 2. was saved as 3. 3. A username typed with capitals is saved lowercase.

## 04.11.2026 · Najnoviji igrači

Live since 07.11. (fd45c79).

### Admin
- The Igrači list (computer and phone) has **A–Ž | Najnoviji** under the search: Najnoviji puts the newest accounts first and shows on each row when the account was made ("od 03.11.2026"). The choice comes back with Back.

## 03.11.2026 · Odigrani meč ostaje s pobjednikom

Live since 07.11. (fd45c79).

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

Live since 02.11. (1a0eff3).

### Changed
- Početna's Večeras card shows **Nađi zamjenu** only until **Tu smo** opens; from then on (Tu smo, Želimo uskočiti, the night under way) the button is gone.
- **Odlazimo** (once the night or tournament has started) and **Ipak otkazujemo** (before it) are real buttons outlined in cream with an icon, no longer underlined text, in the league and on the tournament page.
- Početna's **Započni igru** card has **Odlazimo** under it (league and tournament), the same outlined cream button on navy as on the cards, so a team at its table can still leave; it asks first.

## 31.10.2026 · Poredak kao popis prisutnih

Live since 02.11. (1a0eff3, DECISIONS #81).

### Changed
- **Dnevni poredak** in the league lists a team as soon as it presses **Tu smo** (or the admin switches it on), with zeros, so players see they are on tonight's list before the first round. A team that leaves without playing drops out.
- A tournament's **Poredak** before Kolo 1 lists only the teams that confirmed arrival, not every signed-up team; empty, it says **Ekipe koje potvrde dolazak bit će ovdje.**

## 31.10.2026 · Datum iza ponoći

Live since 02.11. (1a0eff3).

### Changed
- A tournament cancelled between midnight and 01:00 says the right day in **Otkazao …** (Turnir je otkazan and the list of tournaments, computer and phone); it used to say the day before.
- The same for the times under **Zadnje prijave** on the computer's list of tournaments, and for **Postavio …** on a ban (Ekipa and Igrač).
- **Postavio …** on a ban no longer ends with two periods after the date.

## 31.10.2026 · Liga: Okupljanje i Početak

Live since 02.11. (1a0eff3, DECISIONS #80). The migration 20261101120000_league_gathering_time went with it.

### Added for players
- Raspored's next night and Početna's Sljedeća večer say **Okupljanje od 18:30** beside the start time and place.
- **Tu smo** opens at Okupljanje (without one, half an hour before Početak, as before).

### Added for the admin
- **Okupljanje** and **Početak** side by side in Nova liga, Podaci, Postavke, Dodaj večer and Uredi večer; a night can have its own of either.
- "Okupljanje mora biti prije početka." stops a save with the times the wrong way round.

### Changed
- The league's one time, until now **Vrijeme okupljanja**, is now **Početak**: the main time, shown everywhere as before.

## 31.10.2026 · Datumi: Dodaj večer, premjesti večer, obriši odigranu

Live since 02.11. (1a0eff3, DECISIONS #78, #79).

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

Live since 31.10.2026 (DECISIONS #77); the Kolo's **point difference** since 02.11. (1a0eff3).

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
