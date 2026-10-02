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
    - klikom na upiši odvijaju se sljedeće stvari:
        1. Spremanje rezultata u bazu i uvećanje konačnog rezultata timova u toj partiji
        2. Provjera je li match gotovo - i to definira koji gumb se pokazuje kasnije na ekranu za match upisi ili završi
           match
        3. Restartira lokalno na frontendu podatke iz rezultata
        4. Nešto se mora desiti sa najavama, spremanje?
        5.  
