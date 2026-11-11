# Review matematike u kalkulatoru turnirskih formata — 11. 11. 2026.

Datoteka: `public/static/kalkulator-turnira-bc05b74508.html` (grana `development`, commit `433c54c`).
Ovo je samo review: kalkulator nije mijenjan.

## Kako je provjereno

Nijedna tvrdnja ovdje nije provjerena samo čitanjem koda:

1. **Funkcije su izvučene u Node** bez izmjena: tijelo `<script>` bloka od `"use strict"` do DOM dijela izvršeno je kroz `new Function`, pa se testiraju `sim`, `suggestK`, `playoffPlan`, `hm`, `lbPlan`, `lbEcon` i `getCtx` iz same datoteke.
2. **Nezavisna simulacija švicarca**, napisana od nule (objekti i `Array.sort` sa slučajnim ključem, bez tipiziranih polja i brojačkog sortiranja). Na 13 konfiguracija uspoređena je s `sim()`.
3. **Nezavisna simulacija double eliminationa**, također od nule. Pobjednički dio ima standardni raspored nositelja i slobodne prolaze kad `M` nije potencija dvojke. Gubitnički dio ima 2w−2 kruga: neparni krugovi su unutarnji, a u parnima se ubacuju gubitnici pobjedničkog dijela. Veliko finale je jedna utakmica, bez revanša. Svaki meč dobiva najraniji termin u kojem su oba sudionika slobodna, uz neograničen broj stolova, pa je to najkraći mogući niz termina. Za svaku ekipu broje se pobjede od ispadanja iz pobjedničkog dijela do velikog finala. Po 20 000 turnira za M = 4, 5, 7, 8, 15, 16, 17, 23, 31, 32, 33, 37, a broj termina je provjeren za svaki M od 4 do 128.
4. **Analitička formula** iz briefa izračunata je zasebno i uspoređena sa `sim()` i s nezavisnom simulacijom.
5. **Instrumentirana kopija** `sim()` (kopija se mijenja samo u memoriji, datoteka ne) provjerila je stabilnost sortiranja nakon svakog poziva `arrange` i najveće punjenje polja `hist`.
6. **Cijela stranica je pokrenuta u Chromiumu (Playwright)** s rubnim postavkama, a tekst koji korisnik vidi iščitan je iz DOM-a.

Skripte su u scratchpadu ove sesije i nisu commitane. Jezgra simulatora double eliminationa je u Dodatku.

---

## Sažetak

| # | Nalaz | Vrsta | Važnost |
|---|---|---|---|
| 1 | Kad se playoff dopunjava ispalima, kupljeni repasaž **smanjuje** šansu za prolaz, a kalkulator ga i dalje prikazuje kao dobitak i "prodaje" | **pogrešan rezultat** | visoka |
| 2 | `lbEcon` i `lbPlan` za M koji nije potencija dvojke: razlomljene ekipe (na ekranu "14.0625"), krivi `wins(1)`, jedan termin previše za dio M | **pogrešan rezultat** | visoka |
| 3 | Usporedba formata nije poštena: "do velikog finala" protiv "u playoff". Na istoj letvici šanse su **jednake** | **pogrešan zaključak** u tekstu | visoka |
| 4 | `lbPlan`: broj mečeva po terminu je kriv i za potencije dvojke (8,8,4,4,… umjesto 8,8,6,3,…). Broj termina je točan | **pogrešan rezultat**, ali samo bo3 trajanje, ±8–14 min | srednja |
| 5 | Prikazana šansa dolazi iz simulacije u kojoj kupe svi, a stvarna (uz Spremnost) je do 2× veća | **pogrešan rezultat** (sustavno prenizak) | srednja |
| 6 | Prag upozorenja "Playoff se puni ispalim ekipama" šuti u slučajevima gdje rani repasaž već ima negativnu vrijednost | radi, ali bi moglo biti bolje | srednja |
| 7 | Analitička formula ne uzima u obzir slobodne pobjede, dopunu ni varijancu, pa `suggestK` za neparan M ponekad preporuči kolo manje. Rubno pravilo iz briefa "T−C ≤ 0 ⇒ 0 %" je prestrogo | radi, ali bi moglo biti bolje | niska |
| 8 | Sitnice: dvostruka slobodna pobjeda kad je neizbježna, `hm` zbroj dijelova, boja "Preživi" i nota imaju različite pragove | radi, ali bi moglo biti bolje | niska |

Što je **točno** i čime je to potvrđeno: `sim()` (svih 13 konfiguracija se s nezavisnom simulacijom slaže unutar Monte Carlo šuma), `arrange` (stabilno i slučajno), `getCtx` (ponovna upotreba ne kvari rezultat), `hist` i ključevi (nema prekoračenja ni sudara), `playoffPlan` (svi T), bo3 formula `3 − 0.5^m`, `lbEcon.wins(r)` i Σ = M−1 za potencije dvojke, broj termina `2w` za potencije dvojke, veliko finale kao vlastiti termin, nema revanša. Detalji su po funkcijama niže.

---

## Nalazi po važnosti

### 1. [POGREŠAN REZULTAT] Repasaž može imati negativnu vrijednost, a kalkulator to ne vidi

**Što se događa.** Kad preživi manje od `T` ekipa, playoff se dopunjava ispalima po broju poraza. Ekipa koja je kupila repasaž i opet izgubila ima `L+1` poraz, a ekipa koja nije kupila ima `L`. Dopuna zato uzima ekipe koje **nisu** platile, a one koje jesu ostavlja vani. Pravilo dopune iz briefa kod provodi točno, ali kalkulator kao "šansu" prikazuje P(prolaz | kupio). Za odluku je važna razlika P(prolaz | kupio) − P(prolaz | nije kupio), a nju nigdje ne računa.

Brojevi su iz nezavisne simulacije. Svaka ponuda prihvaćena je s vjerojatnošću 0,5 (odnosno 0,6), pa se obje skupine mogu izmjeriti u istim turnirima:

| Postavke | Nakon kola | Kupi → prolaz | Ne kupi → prolaz | Dobitak | Kalkulator prikazuje |
|---|---|---|---|---|---|
| M=16, T=8, k=5, L=2 | 2 | 18,8 % | 39,7 % | **−20,9 pp** | 15 % |
| | 3 | 33,2 % | 40,5 % | **−7,3 pp** | 29 % |
| | 4 | 59,1 % | 42,3 % | +16,8 pp | 58 % |
| M=128, T=32, k=6, L=2 (to je **`suggestK`-ova preporuka**) | 2 | 6,8 % | 10,8 % | **−4,0 pp** | 5 % |
| M=64, T=16, k=8, L=3 (`suggestK` preporuka) | 3 | 4,1 % | 6,0 % | **−1,9 pp** | 2 % |
| M=33, T=32, k=5, L=2 | 2 | 89,1 % | 100 % | **−10,9 pp** | 95 % |
| M=16, T=8, k=4, L=2 (zadano) | 2 | 35,0 % | 16,2 % | +18,7 pp | 25 % |

U zadanoj konfiguraciji vrijednost je pozitivna, pa problem tamo ne iskače. U konfiguracijama koje `suggestK` sam preporučuje za veće turnire (M=64 i M=128) prvi prozor već prodaje proizvod s negativnom vrijednošću. `pBuy` ekipi i tada daje vjerojatnost kupnje W + šansa ≈ 0,47–0,50.

**Ispravka (jedna od dvije):**
- *Model:* za svaki ključ računati i P(prolaz | ponuđeno, nije kupio), u istoj simulaciji A ili u kontrolnoj simulaciji bez kupnje za tu ekipu. Prikazivati **dobitak** = P(kupio) − P(nije kupio), a `pBuy` vratiti 0 kad je dobitak ≤ 0. Upozorenje "Repasaž u ovom prozoru smanjuje šansu" treba se paliti kad je dobitak < 0.
- *Pravilo turnira:* pri dopuni rangirati plaćene ekipe ispred neplaćenih s istim brojem "pravih" poraza, ili im zadnji poraz ne brojati. To je odluka organizatora, ne matematike.

### 2. [POGREŠAN REZULTAT] Losers bracket za M koji nije potencija dvojke

`lbEcon` uzima `teams = M / 2^r`, što za M koji nije potencija dvojke nije cijeli broj. Zbroj je M·(1 − 2^−w), a ne M − 1. `lbPlan` zaokružuje `M/2^ceil(i/2)` i uvijek uzima `2w` termina. Stvarni raspored sa slobodnim prolazima:

| M | KOD: ponuda | STVARNO | KOD: wins(1) | STVARNO wins(1) | KOD: P(VF) za r=1 | STVARNO | KOD termina | STVARNO termina | KOD Σ mečeva | STVARNO (2M−2) |
|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4,375 | 4 | 4 | 3 | 6,25 % | 12,5 % | 6 | **5** | 10 | 8 |
| 7 | 6,125 | 6 | 4 | 3 ili 4 | 6,25 % | 8,4 % | 6 | 6 | 14 | 12 |
| 15 | 14,0625 | 14 | 6 | 5 ili 6 | 1,56 % | 1,77 % | 8 | 8 | 30 | 28 |
| 17 | 16,469 | 16 | 8 | **7** | 0,39 % | 0,83 % | 10 | **9** | 34 | 32 |
| 23 | 22,281 | 22 | 8 | 7 | 0,39 % | 0,82 % | 10 | 10 | 46 | 44 |
| 33 | 32,484 | 32 | 10 | **9** | 0,10 % | 0,22 % | 12 | **11** | 66 | 64 |
| 37 | 36,422 | 36 | 10 | 9 | 0,10 % | 0,19 % | 12 | 11 | 74 | 72 |

Stvarni broj ispalih po kolu pobjedničkog dijela je `M − 2^(w−1)` za r = 1 i `2^(w−r)` za r ≥ 2. Za M=17 to je 1, 8, 4, 2, 1, a kod daje 8,5, 4,25, 2,125, 1,06, 0,53. Kod zbog toga u retku r=1, koji ide u `lbHint`, prikazuje 8,5 ekipa sa šansom 0,4 %, a stvarno je to **jedna** ekipa sa šansom 0,8 %.

**Termin viška.** Za M u intervalu (2^(w−1), 1,25·2^(w−1)], to jest za M = 5, 9–10, 17–20, 33–40 i 65–80, stvarni raspored ima `2w − 1` termina, a ne `2w`. Za sve ostale M od 4 do 128 `2w` je točno. Ekipe sa slobodnim prolazom igraju 2. kolo pobjedničkog dijela već u prvom terminu, a u gubitničkom dijelu prvo kolo nestaje jer su gotovo svi u njemu na slobodnom prolazu. Primjeri:
- M=17, g=30: losers bracket ispada 30 min duži nego što stvarno jest (bo1 5 h umjesto 4 h 30; bo3 821 min umjesto 749 min, dakle +72 min).
- M=33: bo1 6 h umjesto 5 h 30.

U tablici usporedbe "Trajanje turnira" je presudan redak, pa ovo mijenja ishod usporedbe.

**Prikaz.** `String(le.offers)` ispisuje broj s decimalnom točkom i bez zaokruživanja. U pregledniku za M=15 piše "Ponuda za plaćeni život … 14.0625", "Prodano … 14.0625" i u tekstu "(14.0625 od 15)". Za M=17 piše "16.46875". Zarada je izračunata od tih razlomljenih brojeva, ali je greška manja od jedne cijene repasaža.

**Konkretan prijedlog.** Losers bracket za takav M treba dopustiti, jer se u praksi igra sa slobodnim prolazima, ali ga treba **modelirati sa slobodnim prolazima, a ne zaokruživanjem**. Struktura ne ovisi o rezultatima, pa se deterministički izgrađuje u ~40 redaka (kao simulator u Dodatku):
1. Izgradi bracket veličine `S = 2^w` sa standardnim rasporedom nositelja, a mjesta `> M` su slobodni prolazi.
2. Kroz bracket proguraj "prazne" protivnike: slobodan prolaz ne troši ni meč ni termin.
3. Svakom meču dodijeli termin = max(termin u kojem su oba sudionika slobodna) + 1. Odatle dobivaš broj termina, mečeve po terminu i Σ = 2M−2.
4. Za svako mjesto ulaska u gubitnički dio prebroji pravi meč do velikog finala. To je `wins`, a slobodni prolazi u gubitničkom dijelu ga smanjuju (npr. M=15: 7 ekipa iz 1. kola, od toga jedna treba 5 pobjeda, ostale 6).
5. Ponuda = M − 1 točno, s retkom r=1 = `M − S/2`.

Ako to nije vrijedno truda, minimalna ispravka je: `teams` za r=1 postaviti na `M − 2^(w−1)`, a za r ≥ 2 na `2^(w−r)`; `offers = M − 1`; prikaz kroz `fmt(…,0)`. U napomeni treba pisati da su termini i `wins(1)` za M koji nije potencija dvojke gornja granica. Zabranjivati losers bracket za takav M ne preporučujem: format postoji i igra se.

### 3. [POGREŠAN ZAKLJUČAK] Usporedba formata mjeri različite letvice

`lbHint` kaže: "Šanse su u losers bracketu ipak puno gore — tko ispadne u 1. kolu mora dobiti 6 mečeva zaredom da dođe do velikog finala, 1,6 %". Švicarčeva šansa (25 % i 50 % u zadanoj konfiguraciji) znači *uđe među 8 od 16*, a ova od 1,6 % znači *dođe među 2 od 16*. Takva usporedba je pristrana prema švicarcu za faktor 2^(broj LB krugova između tih dviju letvica).

Na istoj letvici, *završi među 8 od 16*, gubitnik 1. kola pobjedničkog dijela mora dobiti krugove 1 i 2 gubitničkog dijela (gubitnici 2. kruga završe 9.–12., a 1. kruga 13.–16.). Šansa mu je 0,5² = **25 %**. Gubitnik 2. kola mora dobiti krug 2, pa mu je šansa **50 %**. To su **iste brojke** kao u švicarcu nakon 2. i 3. kola (25 % i 50 %). Tvrdnja "puno gore" na usporedivoj letvici ne stoji.

**Kako izjednačiti (bilo koje):**
- (a) Za oba formata računati **P(osvoji turnir)**, za švicarac kao P(playoff) · P(osvoji playoff s tog mjesta). Uz bacanje novčića: švicarac nakon 2. kola 25 % · 1/8 ≈ 3,1 %, a losers bracket nakon 1. kola 1,6 % · 1/2 = 0,8 %. Razlika postoji, ali je 4×, a ne 16×.
- (b) Za losers bracket računati **P(završi među T)** istim T kao u švicarcu. Za M = 2^w i T = M/2^j to je 0,5^(broj LB krugova koje ekipa mora preživjeti da ne ispadne prije zadnjih T).

### 4. [POGREŠAN REZULTAT, malen] `lbPlan`: mečevi po terminu

Broj termina `2w` je točan za potencije dvojke, uz veliko finale kao zaseban termin i bez revanša. Kritični put je: 1. kolo pobjedničkog dijela, pa 2w−2 kruga gubitničkog dijela koji moraju ići jedan za drugim, pa veliko finale, što daje 1 + (2w−2) + 1 = 2w. Obrazloženje u komentaru ("gubitnički ne može trčati ispred pobjedničkog") nije pravi razlog. Pobjednički dio završi već u terminu `w`, a niz produljuje lanac gubitničkog dijela.

Raspodjela `M/2^ceil(i/2)` ne odgovara stvarnom rasporedu:

| M | KOD | STVARNO (WB + LB po terminu) |
|---|---|---|
| 8 | 4,4,2,2,1,1 | 4, 2+2, 1+2, 1, 1, VF 1 → **4,4,3,1,1,1** |
| 16 | 8,8,4,4,2,2,1,1 | 8, 4+4, 2+4, 1+2, 2, 1, 1, VF 1 → **8,8,6,3,2,1,1,1** |
| 32 | 16,16,8,8,4,4,2,2,1,1 | **16,16,12,6,5,2,2,1,1,1** |

Zbroj je i u kodu i stvarno 2M−2, a bo1 trajanje je točno (svaki termin traje g). U bo3 trajanje termina ovisi o broju mečeva (`3 − 0.5^n`), pa kod precijeni: M=16, g=30, bo3 daje 671,0 min umjesto 663,1 min (+8 min). M=32 daje +12 min, M=128 +15 min, a M=23 −7 min. Ispravna formula za M = 2^w, termin s:
- s = 1: M/2
- 2 ≤ s ≤ w: M/2^s (pobjednički dio) + LB krug s−1
- w < s ≤ 2w−1: LB krug s−1
- s = 2w: 1 (veliko finale)

Pritom LB krug m ima M/2^(ceil(m/2)+1) mečeva.

### 5. [POGREŠAN REZULTAT, sustavno prenizak] Prikazana šansa iz simulacije "svi kupe"

`chance` se računa iz simulacije A u kojoj je `pBuy = 1`, a prodaja i prikaz idu iz simulacije B u kojoj kupuje samo dio. Manje kupaca znači manju konkurenciju, pa je stvarna šansa u B veća od prikazane:

| Postavke | Prozor | Prikazano (A) | Stvarno u B |
|---|---|---|---|
| M=16 T=8 k=4 L=2, srednja | nakon 2. kola | 25,2 % | 30,6 % |
| M=32 T=8 k=5 L=2, srednja | nakon 2. kola | 4,2 % | **8,8 %** |
| | nakon 4. kola | 16,7 % | 27,6 % |
| M=64 T=16 k=7 L=3, srednja | nakon 3. kola | 0,8 % | 2,2 % |

Zbog toga se okida i "Prvi prozor je skoro mrtav (x %)" s prenisko procijenjenim x. **Ispravka:** 2–3 iteracije fiksne točke (A → chance → B → chance iz B → B′ …) ili barem prikaz `adv/sold` iz B. Ovo vrijedi uz napomenu iz nalaza 1: i tada treba prikazivati *dobitak*, a ne apsolutnu šansu.

### 6. [MOGLO BI BOLJE] Prag "Playoff se puni ispalim ekipama"

`gap > 0.5 && gap/T > 0.06` gleda **prosjek** preživjelih. Dopuna se događa i kad je prosjek blizu T, jer je broj preživjelih slučajan. Upravo tada repasaž gubi vrijednost (nalaz 1).
- *Šuti kad ne bi trebao:* M=64, T=16, k=8, L=3 (preporuka `suggestK`): na ekranu "Preživi 15,8 / 16" i nema upozorenja. Uz kupnju s vjerojatnošću 0,5 dopuna se ipak događa u 93 % turnira, a repasaž nakon 3. kola ima dobitak −1,9 pp.
- *Pali se kad treba:* M=16, T=8, k=5, L=2: preživi 5,4 / 8, gap 2,6, upozorenje se pali.
- *Nedosljednost:* broj u podnožju je crven već kod `gap > 0.5`, a nota traži i `gap/T > 0.06`. Za T=32 i gap = 1,5 broj je crven, a objašnjenja nema.

**Prijedlog:** temeljiti upozorenje na `B.shortfall`, udjelu turnira s dopunom (koji `sim` već vraća), npr. `shortfall > 0.25`, i na dobitku iz nalaza 1.

### 7. [MOGLO BI BOLJE] Analitička formula i `suggestK`

Izvod je točan uz pretpostavke: svaka partija je bacanje novčića, nema slobodnih pobjeda, kupuju svi i samo jednom. `C` je očekivani broj ekipa s manje od L poraza nakon k partija (binomna razdioba), `E_i` je negativno-binomna vjerojatnost da L-ti poraz padne baš u i-tom kolu, a `P` je ono što od toga preživi k−i kola na zadnjem životu. Za paran M simulacija se slaže **točno**: M=16, T=8, k=4, L=2 daje preživjelih 8,00 / 8,00 / 8,00 (kod / nezavisno / analitički), M=128, T=32, k=8, L=3 daje 36,00 / 36,00 / 36,00, a šanse po prozoru se slažu na 0,1 pp. `suggestK` za sve testirane parne M bira isti k kao simulacija.

Gdje odstupa:
- **Neparan M:** slobodne pobjede smanjuju poraze. M=15, T=6, k=5, L=2 daje 6,49 (sim) prema 5,63 (formula), a M=17, T=4, k=6, L=2 daje 5,26 prema 4,52. `suggestK` zato ponekad preporuči kolo manje nego što treba: M=17/T=8/L=2 preporuči 4, a simulacija daje 5. Isto vrijedi za M=33/T=8 (6 umjesto 7), M=9/T=4 (4 umjesto 5) i M=5/T=2/L=1 (3 umjesto 4).
- **`suggestK` pretpostavlja da kupe svi.** Uz srednju spremnost preživi manje: M=128, T=32, L=2, k=6 daje 29,0 / 32, pa kalkulator na vlastitoj preporuci pali svoje upozorenje "Playoff se puni".
- **Formula šanse `(1/2)^(k−i) · min(1,(T−C)/P)`** je omjer očekivanja. Ne uzima u obzir varijancu ni dopunu. M=16, T=8, k=5, L=2 daje 12,5 % prema 14,5 % u simulaciji, a M=33, T=32, k=5 daje 12,5 % prema 94,7 % (dopuna).
- **Rubni uvjet "T − C ≤ 0 ⇒ 0 %, ne prodavati" je prestrog.** C je očekivanje. M=4, T=2, k=3, L=2 daje C = 2 = T, pa formula kaže 0 %, a stvarna šansa je 26 % (24 % u nezavisnoj simulaciji), jer u dijelu turnira preživi manje od dvije neplaćene ekipe. Kod ovo pravilo **ne** primjenjuje (šansu uzima iz simulacije, uz prag od 25 prodaja), i to je dobro. Pravilo treba glasiti "≤ 0 u simulaciji", ne u formuli. Uz min treba dodati i `max(0, …)` jer bi formula inače dala negativnu šansu.

### 8. [MOGLO BI BOLJE] Sitnice

- **Slobodna pobjeda "na zadnjem životu"** u kodu znači samo plaćene ekipe (`st===1`). Neplaćena ekipa s L−1 porazom također je na zadnjem životu, a ne dobiva prednost. Treba odlučiti što je namjera.
- **Dvostruka slobodna pobjeda:** kad je svi živi već imaju, kod je dodijeli opet (`mode 3`). Za M=5, k=14, L=8 to se događa u prosjeku 8,8 puta po turniru. To je neizbježno i fallback je razuman, ali krši tvrdnju iz briefa "ne smije dvaput", pa bi to trebalo zapisati kao iznimku.
- **`hm`** zaokružuje svaki iznos posebno na 5 min, pa pogreška nije veća od 2,5 min po vrijednosti i ne gomila se, jer se zbraja nezaokruženo. Prikazani dijelovi se ipak ne moraju zbrojiti, jer `readInt` ne poštuje `step=5`. Primjer: g=31, k=3, T=8, bo1 prikaže "1 h 35 + 1 h 35 = 3 h 05". Na dugim turnirima točnost se ne gubi.
- **`getCtx` vraća ista polja** `offers/sold/adv` za A i B. Danas je to bezopasno jer se `chance` kopira prije poziva B, ali je krhko: tko kasnije pročita `A.sold`, dobit će B-ove brojeve.
- **`pBuy`** je primijenjen dosljedno: 0 kad je šansa ≤ 0, inače `min(0,95, W + šansa)`. U losers bracketu se ne koristi (`lbEcon` ima `sold = offers`, a "Spremnost" ne ulazi u `lbPlan` ni `lbEcon`), pa tu nije ništa pomiješano.

---

## Po funkcijama

### `sim` — točna
- **Usporedba s nezavisnom simulacijom**, 6000 turnira, `pBuy=1`, `maxBuys=1`. Preživjeli, prodani, ponude po prozoru i udio turnira s dopunom slažu se u svih 13 konfiguracija (M = 4, 5, 7, 15, 16, 17, 24, 32, 33, 64, 128; L = 1, 2, 3; T = 2 … M−1), a šanse po prozoru unutar ±0,6 pp. Primjeri:
  - M=15, T=6, k=5, L=2: preživjeli 6,49 / 6,50, prodano 9,94 / 9,94.
  - M=5, T=2, k=4, L=1: šansa nakon 1. kola 23,2 % / 22,8 %.
- **`arrange`** provjeren je u 21 000 poziva: 0 povreda poretka po porazima i 0 povreda stabilnosti (redoslijed unutar grupe jednak je redoslijedu nakon Fisher-Yatesa). U 1. kolu (svi s 0 poraza) svaka od 16 ekipa je prva otprilike jednako često (525–611 od ≈ 9000), pa je redoslijed jednoliko slučajan.
- **Prozor za repasaž** postoji samo za `kolo ≤ k−1`, što potvrđuju ponude u svim testovima. Prolaz se pripisuje svakoj kupovini ekipe (petlja po `hist`).
- **`getCtx` pri smanjenju M ili k:** 30 parova poziva (veliki pa mali i obrnuto, uključujući M=128/k=14 i M=5) daje identične rezultate kao svježe učitan modul. Polja se ponovno alociraju kad bilo koja dimenzija naraste, stara vrijednost ne može procuriti jer se `loss/buys/st/fw/pass` resetiraju za `i < M` svaki turnir, `cnt` se resetira u `arrange`, a `offers/sold/adv` su `.fill(0)` u cijeloj duljini.
- **Ključevi `nb*100 + kolo`:** `kolo ≤ k−1 ≤ 13 < 100`, pa sudara nema. `nb ≤ k−1` jer svaka kupovina traži novo ispadanje, a ono traži poraz u novom kolu. Najveći ključ (k=14, L=1, neograničeno) je 1313 < span 1600.
- **`hist`:** broj kupovina po turniru je najviše (k−1)·⌊M/2⌋, pa je najviše (k−1)·2·⌊M/2⌋ mjesta. Izmjereno je točno toliko (1664 za M=128, k=14, L=1, neograničeno), a polje ima 2·M·(k+2) = 4096. Ima mjesta i za neograničen `maxBuys`.

### Analitička formula / `suggestK` — izvod točan, pretpostavke preuske (nalaz 7)

### `playoffPlan` — točan
Uspoređen s nezavisnim brojanjem slobodnih prolaza za T = 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 31, 63, 64, 127. Sve se slaže i zbroj je uvijek T−1. Primjeri:
- T=5: 1, 2, 1
- T=6: 2, 2, 1
- T=12: 4, 4, 2, 1
- T=20: 4, 8, 4, 2, 1

Bo3 trajanje `g·(3 − 0,5^m)` potvrđeno je Monte Carlom (200 000 krugova): m=1 daje 2,502 prema 2,500, m=4 daje 2,938 prema 2,9375, m=8 daje 2,996 prema 2,996. To je **očekivano** trajanje. Za planiranje dvorane realnije je računati 3g po krugu, jer je za m ≥ 4 to ionako 94–100 %.

### `lbPlan` — broj termina točan za potencije dvojke, mečevi po terminu krivi (nalaz 4), za dio ostalih M jedan termin viška (nalaz 2)
Veliko finale je uračunato kao vlastiti, zadnji termin (u `fin` načinu samo on je bo3). Revanša nema, kao što i treba.

### `lbEcon` — točan za potencije dvojke, kriv za ostale (nalaz 2)
Simulacijom je potvrđeno `wins(r)` za M = 8, 16 i 32:
- M=8: 4, 3, 1
- M=16: 6, 5, 3, 1
- M=32: 8, 7, 5, 3, 1

P(VF) iz simulacije odgovara `0,5^wins` (npr. M=16, r=1: 0,0161 prema 0,0156). Slučaj r=1 je poseban jer gubitnici 1. kola ulaze u **unutarnji** 1. krug gubitničkog dijela. Gubitnici r-tog kola (r ≥ 2) ulaze u krug 2r−2, gdje dočekuju preživjele, pa im ostaje (2w−2) − (2r−2) + 1 = 2w − 2r + 1 pobjeda. To vrijedi za sve r od 2 do w (r=w daje 1, finale gubitničkog dijela). Opća formula za r=1 dala bi 2w−1, jednu pobjedu previše. Σ M/2^r za r = 1..w iznosi M − 1 **samo** za M = 2^w, a inače M(1 − 2^−w).

---

## Dodatak: jezgra nezavisnog simulatora double eliminationa

```js
// ASAP raspored: mec se igra u terminu max(slobodni termini sudionika)+1; slobodni prolaz ne trosi termin.
function play(a,b,stage){ if(!a&&!b)return{win:null,lose:null}; if(!a)return{win:b,lose:null}; if(!b)return{win:a,lose:null};
  const slot=Math.max(a.t,b.t)+1; matches.push({slot,stage}); const aw=rng()<.5,W=aw?a:b,L=aw?b:a;
  W.team.wins.push(stage); return {win:{team:W.team,t:slot},lose:{team:L.team,t:slot}}; }
// WB: S=2^w, standardni raspored nositelja, mjesta >M su slobodni prolazi; r=1..w, gubitnici u wbLosers[r-1]
// LB R1: gubitnici WB R1 medjusobno; za j=1..w-1: LB R(2j) = pobjednici vs gubitnici WB R(j+1) (obrnutim redom);
//        ako j<w-1: LB R(2j+1) = pobjednici medjusobno. Veliko finale: prvak WB vs prvak LB, jedan mec, bez revansa.
```
