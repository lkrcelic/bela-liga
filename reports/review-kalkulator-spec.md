# Brief: review matematike u kalkulatoru turnirskih formata

Ovo je **review, ne popravak.** Ne mijenjaj kalkulator.

## Gdje je kod

    public/static/kalkulator-turnira-bc05b74508.html

Na grani `development`. Sva logika je u jednom `<script>` bloku na dnu te datoteke. Nema vanjskih ovisnosti; Node je dostupan.

## Što stranica radi

Bela turnir; ekipa je par igrača. Uspoređuju se dva formata:

**A) Švicarac s plaćenim repasažom.** Kvalifikacije se igraju švicarski, jedna partija po kolu, svi igraju svako kolo. Ispadaš kad skupiš `L` poraza. Ekipa koja ispadne može platiti repasaž i vratiti se odmah u sljedeće kolo, s tim porazima na računu; sljedeći poraz je konačan. Nakon `k` kola najboljih `T` ekipa ide u playoff (jednostruka eliminacija).

**B) Losers bracket (double elimination).** Plaćeni život znači ulazak u gubitnički dio, fiksno jedan po ekipi, i pretpostavlja se da plate **sve** ekipe koje ispadnu iz pobjedničkog dijela.

Za svaku funkciju provjeri tri stvari: radi li ono što je namjera, je li matematika točna, i što se događa na rubovima.

---

## 1. `sim(M,T,k,L,maxBuys,pBuy,trials,seed)` — Monte Carlo simulacija švicarca

Namjera:

- Svako kolo žive ekipe se pare unutar grupa s istim brojem poraza, a redoslijed unutar grupe mora biti **slučajan** (izvedeno kao Fisher-Yates pa stabilno brojačko sortiranje).
- Neparan broj živih → jedna dobije **slobodnu pobjedu** (ne igra, ne dobiva poraz). Prednost imaju ekipe na zadnjem životu koje je još nisu dobile, pa ostale koje je nisu dobile. Ista ekipa je ne smije dobiti dvaput.
- Prozor za repasaž postoji **samo nakon kola 1..k−1**, nikad nakon zadnjeg, da se vraćena ekipa stigne dokazati barem jednim kolom.
- Na kraju prolazi `T` najboljih preživjelih; poredak po broju poraza uz slučajno razrješenje izjednačenja. Ako preživi manje od `T`, dopunjava se najboljim ispalima.
- Prolaz se pripisuje **svakoj** kupovini te ekipe, ne samo zadnjoj (ekipa koja odlučuje zna da smije kupiti opet).

Provjeri posebno:

- Je li sortiranje doista stabilno i daje li slučajan redoslijed unutar iste grupe poraza.
- `getCtx()` ponovno koristi ista tipizirana polja između poziva kad se `M` ili `k` **smanje**. Može li ostati stara vrijednost i iskriviti rezultat?
- Indeksiranje `offers` / `sold` / `adv` po ključu `nb*100 + kolo`: može li doći do sudara ključeva ili prekoračenja polja za velike `k`?
- `hist` je ravno polje parova; je li veličina `2*M*(k+2)` sigurno dovoljna kad je `maxBuys` neograničen?

## 2. Analitička formula (koristi je `suggestK`, a služi i kao provjera `sim`)

- `C = M · Σ_{j=0}^{L−1} C(k,j) / 2^k` — koliko ekipa završi s manje od `L` poraza
- `E_i = M · C(i−1, L−1) / 2^i` — koliko ekipa ispadne točno nakon `i`-tog kola
- `P = Σ_i E_i · (1/2)^(k−i)` — koliko plaćenih preživi do kraja
- `šansa_i = (1/2)^(k−i) · min(1, (T−C)/P)`

Provjeri izvod i rubni uvjet: ako je `T − C ≤ 0`, repasaž vrijedi 0% i ne smije se prodavati.

## 3. `playoffPlan(T, mode, g)`

Jednostruka eliminacija, `g` minuta po partiji. Krugova `= ceil(log2 T)`. Prvi krug ima `(2T − 2^krugova)/2` mečeva, ostale ekipe imaju slobodan prolaz. **Krug traje dok i najsporiji meč ne završi**, pa bo3 krug s `m` mečeva traje `g·(3 − 0.5^m)`, a bo1 krug `g`.

Provjeri broj krugova i mečeva po krugu za `T` koji **nije** potencija dvojke (5, 6, 12, 20) i zbraja li se ukupan broj mečeva na `T − 1`.

---

## 4. POSEBNA PAŽNJA — `lbPlan(M, mode, g)` i `lbEcon(M)`

Ovo je dio u koji imam najmanje povjerenja. **Izvedi ga od nule, ne vjeruj komentarima u kodu.**

### `lbPlan`

Tvrdnje u kodu:

1. `w = ceil(log2 M)` krugova pobjedničkog dijela.
2. U **nizu** ima `2w` termina, jer se krugovi pobjedničkog i gubitničkog dijela preklapaju, a gubitnički ne može trčati ispred pobjedničkog.
3. Broj mečeva u `i`-tom terminu je `M / 2^ceil(i/2)`, što za 16 ekipa daje `8, 8, 4, 4, 2, 2, 1, 1`.

Provjeri sve tri za 8, 16 i 32 ekipe tako da **nacrtaš stvarni raspored** double eliminationa:

- Prebroji krugove gubitničkog dijela (standardno `2w − 2`).
- Provjeri koji krugovi stvarno mogu ići paralelno, a koji moraju čekati.
- Je li veliko finale uračunato kao vlastiti termin?
- Treba li još jedan termin za revanš u velikom finalu (bracket reset)? **U ovom formatu revanša nema** — provjeri da to kod odražava.

### `lbEcon`

Tvrdnje u kodu:

- Broj ekipa koje ispadnu u `r`-tom kolu pobjedničkog dijela je `M / 2^r`.
- Ekipa koja tu ispadne mora dobiti `wins(r)` mečeva zaredom da dođe do velikog finala, gdje je `wins(r) = 2w − 2` za `r = 1`, inače `2w − 2r + 1`.
- Šansa `= 0.5^wins(r)`.
- Ukupno ponuda `= M − 1`, i računa se da plate sve.

Provjeri `wins(r)` **ručno, brojeći na stvarnom rasporedu**, za 8, 16 i 32 ekipe. Zašto je `r = 1` poseban slučaj? Vrijedi li formula za `r ≥ 2` za sve `r` do `w`? Zbraja li `Σ M/2^r` za `r = 1..w` doista na `M − 1` — i vrijedi li to samo kad je `M` potencija dvojke?

### Rubni slučaj koji me brine: `M` koji nije potencija dvojke

Kalkulator dopušta bilo koji broj ekipa (15, 23, 37…). Tada `M / 2^r` nije cijeli broj, a `lbPlan` zaokružuje. Koliko je rezultat pogrešan? Treba li uopće dopustiti losers bracket za takav `M`, ili bi trebalo modelirati slobodne prolaze u prvom kolu? **Daj konkretan prijedlog.**

---

## 5. Ostalo

- `pBuy`: `p = W + šansa`, ograničeno na 0,95, i 0 kad je šansa ≤ 0. Je li primijenjeno dosljedno? Za losers bracket se **ne** koristi (tamo plate svi) — provjeri da to nigdje nije pomiješano.
- `hm(min)` zaokružuje na 5 minuta. Gubi li se time točnost na dugim turnirima?
- Prag upozorenja "Playoff se puni ispalim ekipama": `gap > 0.5 && gap/T > 0.06`. Je li razuman — pali li se kad treba i šuti kad treba?
- **Je li usporedba dvaju formata poštena?** Švicarčeva "šansa" znači *uđe u playoff*, a losers bracketova *dođe do velikog finala*. To su različite letvice. Koliko to iskrivljuje usporedbu i kako bi se moglo izjednačiti?

---

## Kako provjeravati

Ne na oko:

- Izvuci funkcije iz HTML-a u Node i napiši **nezavisnu** implementaciju svake formule (ne kopiju), pa usporedi rezultate.
- Za losers bracket napravi **stvarnu simulaciju** double eliminationa od nule i usporedi broj termina, mečeva po terminu i `wins(r)` s onim što `lbPlan` / `lbEcon` tvrde.
- Provjeri analitičku formulu protiv `sim()` na više konfiguracija.
- Probaj rubne vrijednosti: `M` = 4, 5, 7, 15, 16, 17, 31, 32, 33; `T` = 2 i `T` = M−1; `L` = 1; `k` = L+1; `g` = 10 i 90.

## Što isporučiti

Izvještaj u `reports/review-kalkulator-2026-11-11.md`:

- Za svaku funkciju: je li točna, a ako nije — u čemu je greška i koja je ispravna formula.
- Rubni slučajevi koji pucaju ili daju besmislene brojeve.
- Nalazi rangirani po važnosti, s jasnom razlikom između **pogrešan rezultat** i **radi, ali bi moglo biti bolje**.
- Uz svaki nalaz konkretan brojčani primjer koji ga pokazuje.
- Ako je sve točno, reci to jasno i pokaži čime si to potvrdio.

Commitaj **samo taj izvještaj** na granu `development` i pushaj. Ne diraj nijednu drugu datoteku, a kalkulator pogotovo ne.
