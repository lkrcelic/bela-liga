# Process flow

### 1. Pokretanje runde

- Klikom na "Start Game" kreira se match između team1 i team2 iz runde (raspored sjedenja se ne prati)
- Ako match za tu rundu već postoji, otvara se postojeći

### 2. Match

- Prikaz pobjeda u runudama na vrhu
- Prikaz ukupnog score-a
- Prikaz rezulata klikom na rezultat dohvaćaju se detalji
- Gumb za upis rezulltata / završavanje matcha
  ### 2.1. Upis rezultata
  #### 2.1.1. Upis tko je zvao
    - Odabire se koji tim je zvao (team1 / team2), sve se sprema u storage na forntednu
    - gumbovi dalje i nazad
  #### 2.1.2. Upis zvanja
    - Odabire se tim pa njegova zvanja, sve se sprema u storage na forntednu
  #### 2.1.3. Upis bodova igre
    - Upisuju se rezultati jednoj ekipi dok se za drugu računa automatski
    - Prva znamenka nakon promjene ekipe (ili kod uređivanja spremljene igre) počinje novi broj
    - klikom na "Spremi" odvijaju se sljedeće stvari:
        1. Server provjerava igru (zbroj 162 ili štiglja 252:0, zvanja) i sam računa ukupne bodove i pad
           (ista pravila kao na mobitelu, `src/app/_lib/bela/scoring.ts`)
        2. Igra se sprema i rezultat partije se uvećava u jednoj transakciji
        3. Ako je partija već gotova (netko je prešao 1001), nova igra se ne može upisati
        4. Podaci igre i zvanja se brišu lokalno na frontendu
  ### 2.2. Završetak matcha
    - Gumb "Završi meč" se pokazuje kad jedna ekipa ima 1001 ili više i rezultat nije izjednačen
    - Server u jednoj transakciji sprema match, povećava pobjede u rundi i:
        - ako je to bio prvi match runde, odmah kreira drugi i otvara ga
        - ako je to bio drugi match, zatvara rundu, računa tablicu i rejting igrača i otvara rezultat runde
    - Ako dva mobitela stisnu "Završi meč" u isto vrijeme, računa se samo prvi; drugi prati na sljedeći match / rezultat
  ### 2.3. Više mobitela na istom matchu
    - Ekran matcha se osvježava svakih 15 s i kad se aplikacija vrati u prvi plan
    - Ako je match završen na drugom mobitelu, ekran sam prelazi na sljedeći match ili rezultat runde
    - Samo igrači dvaju timova iz runde (i admin) mogu pokrenuti match, upisivati igre i završiti match

### 3. Kreiranje runde (admin)

- Admin bira prisutne timove; parovi se rade po tablici unutar prozora (window) i izbjegavaju se ponovljeni parovi
- Neparan broj timova dobiva "bye" (tim 0), koji se odmah upisuje kao 2:0
- Datum runde je današnji datum po zagrebačkom vremenu
- Ako se isti timovi pošalju ponovno (nazad / dvostruki klik) dok runde još nisu počele, vraćaju se postojeće runde
