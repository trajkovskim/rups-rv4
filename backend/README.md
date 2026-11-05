# Backend

Zaledje igre Meridiani v Node.js in TypeScriptu. Podatki so v bazi PostgreSQL, do katere dostopamo z [Drizzle ORM](https://orm.drizzle.team). Vsebuje bazo s tabelama uporabnikov in vprašanj ter API na vratih 8080.

## Zagon baze

Potrebuješ Docker Desktop in Node.js 20.9 ali novejši.

V korenu repozitorija zaženi bazo:

```bash
docker compose up -d db
```

Baza teče na vratih **5434**, ker so privzeta vrata 5432 pogosto zasedena z lokalno namestitvijo PostgreSQL. Če želiš druga vrata, jih nastavi z `DB_PORT` (npr. `DB_PORT=5440 docker compose up -d db`) in popravi `DATABASE_URL` v `.env`.

Nato v mapi `backend`:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run db:check
```

V ukazni vrstici Windows (cmd) namesto `cp` uporabi `copy .env.example .env`.

Če je vse v redu, `db:check` izpiše:

```text
Povezava deluje: PostgreSQL 17.9
Tabela users obstaja, uporabnikov: 0
```

## Zagon API-ja

Ko baza teče in so migracije ter seed izvedeni, v mapi `backend` zaženi:

```bash
npm run dev
```

API je na voljo na `http://localhost:8080/api`.

| Endpoint | Kaj naredi |
| --- | --- |
| `POST /api/auth/register` | Ustvari račun in vrne žeton ter uporabnika |
| `POST /api/auth/login` | Preveri e-pošto in geslo ter vrne žeton in uporabnika |
| `GET /api/auth/me` | Vrne prijavljenega uporabnika, potreben je žeton |
| `GET /api/questions?type=cities\|countries` | Vrne 10 naključnih vprašanj brez pravilnega odgovora |
| `POST /api/questions/check` | Preveri odgovor ter vrne pravilni odgovor in točke |
| `GET /api/leaderboard?gameModeId=1` | Za zdaj vrne prazen seznam, ker rezultatov še ne shranjujemo |
| `POST /api/country-guess/games` | Ustvari igro Ugotovi državo z 10 naključnimi državami |
| `POST /api/country-guess/games/:id/guess` | Preveri odgovor za trenutno državo, ime razkrije šele pri pravilnem odgovoru |
| `POST /api/country-guess/games/:id/skip` | Preskoči trenutno državo in razkrije njeno ime |
| `POST /api/country-guess/games/:id/pause`, `/resume` | Ustavi in nadaljuje merjenje časa |
| `POST /api/country-guess/games/:id/finish` | Konča igro, tudi predčasno, in vrne zadetke, čas in odigrane države |

Primeri zahtev so v `frontend/ui/api-examples.http`. Frontend lahko API kliče z naslova v `CORS_ORIGIN`, privzeto `http://localhost:3000`.

## Prijava in registracija

Registracija sprejme e-pošto, uporabniško ime in geslo:

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "ucenec@primer.si", "username": "ucenec", "password": "dolgogeslo" }
```

Prijava sprejme samo `email` in `password`. Oba endpointa vrneta enak odgovor:

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "6f1c1f0e-...",
    "email": "ucenec@primer.si",
    "username": "ucenec",
    "createdAt": "2026-11-05T10:00:00.000Z"
  }
}
```

Žeton velja 7 dni. Pri zaščitenih endpointih ga pošlješ v glavi, na frontendu za to skrbi `addAuthorization`:

```http
Authorization: Bearer eyJhbGciOi...
```

Zahteve za vnos:

- e-pošta mora biti veljavna, shrani se z malimi črkami,
- uporabniško ime ima od 3 do 50 znakov: črke, številke, pike, vezaji in podčrtaji,
- geslo ima od 8 do 128 znakov, v bazi je shranjen samo njegov hash (argon2).

| Status | Kdaj |
| --- | --- |
| `400` | Neveljaven vnos, opis je v polju `error` |
| `401` | Napačna e-pošta ali geslo, manjkajoč ali neveljaven žeton |
| `409` | E-pošta ali uporabniško ime že obstaja |

Nov endpoint zaščitiš z middlewarom `requireAuth` iz `src/auth.ts`, id uporabnika je nato v `res.locals.userId`.

Za podpisovanje žetonov je potrebna nastavitev `JWT_SECRET` z vsaj 32 znaki, brez nje se strežnik ne zažene. Vrednost za razvoj je v `.env.example`.

## Ukazi

| Ukaz | Kaj naredi |
| --- | --- |
| `npm run dev` | Zažene API in ga ob spremembi kode znova naloži |
| `npm start` | Zažene API brez samodejnega nalaganja |
| `npm run db:seed` | V bazo vnese vprašanja in obstoječa posodobi, zato ga lahko poženeš večkrat |
| `npm run db:migrate` | Izvede migracije, ki v bazi še niso izvedene |
| `npm run db:generate -- --name=opis` | Iz sprememb v `src/db/schema.ts` ustvari novo migracijo v mapi `drizzle` |
| `npm run db:studio` | Odpre Drizzle Studio, pregledovalnik baze v brskalniku |
| `npm run db:check` | Preveri povezavo z bazo in tabelo `users` |
| `npm run typecheck` | Preveri tipe v TypeScriptu |

## Sprememba sheme

1. Uredi `src/db/schema.ts`.
2. Ustvari migracijo, npr. `npm run db:generate -- --name=dodaj-vloge`.
3. Preglej nastali SQL v mapi `drizzle`.
4. Izvedi jo z `npm run db:migrate`.
5. Spremembo sheme in nove datoteke v `drizzle` commitaj skupaj, da imajo vsi enako bazo.

Že izvedenih migracij ne spreminjaj, vedno dodaj novo.

## Tabela `users`

| Stolpec | Tip | Opomba |
| --- | --- | --- |
| `id` | uuid | Ustvari ga baza |
| `email` | varchar(255) | Unikaten, ne glede na velike in male črke |
| `username` | varchar(50) | Unikaten, ne glede na velike in male črke |
| `password_hash` | text | Samo hash gesla, ki ga naredi API, nikoli geslo |
| `created_at` | timestamptz | Čas registracije |
| `updated_at` | timestamptz | Čas zadnje spremembe |

## Tabela `questions`

| Stolpec | Tip | Opomba |
| --- | --- | --- |
| `id` | integer | Stalna številka, ki jo določi seed |
| `category` | enum | Razdelek iz dokumenta z vprašanji, glej spodaj |
| `prompt` | text | Besedilo vprašanja |
| `hint` | text | Namig, lahko je prazen |
| `fact` | text | Zanimivost, prikazana po odgovoru, pri `guess_country` je prazna |
| `answer` | text | Besedilni odgovor, samo pri `guess_country` |
| `lng`, `lat` | double precision | Pravilni odgovor, API ga razkrije šele po oddaji |
| `country` | text | Ime v `src/data/europe.geo.json`, ko je odgovor država |

Vprašanja so v `src/db/seedQuestions.ts`. Igra zaenkrat uporablja samo kategoriji `capitals` (način `cities`) in `countries`. Ostale kategorije so `cities`, `landforms`, `seas`, `islands`, `lakes`, `rivers`, `basins` in `guess_country`. Pri rekah, gorstvih, morjih in povodjih so koordinate le približna točka, zato bodo te kategorije za točkovanje potrebovale prave oblike.

Pri mestih je odgovor pravilen do 30 km od mesta in delno pravilen do 150 km. Pri državah je pravilen klik znotraj meja ali do 30 km od točke, delno pravilen pa do 50 km od meje.

## Igra Ugotovi državo

Strežnik vodi celotno igro: izbere države, preverja odgovore, šteje zadetke in meri čas brez pavz. Štoparica na frontendu je samo prikaz, končni čas pride iz `finish`.

| Tabela | Kaj hrani |
| --- | --- |
| `guess_countries` | Države za ugibanje: `name`, sprejeta druga imena `aliases` in imena v zemljevidu `map_countries`. Seznam je v `src/db/seedGuessCountries.ts` |
| `country_guess_games` | Ena igra: začetek, konec in čas pavz |
| `country_guess_rounds` | Države posamezne igre po vrsti, njihov status (`pending`, `correct`, `skipped`) in zadnji odgovor |

Pri preverjanju se ne upoštevajo velike črke, strešice in odvečni presledki. Igralec lahko odgovarja samo na trenutno državo, drugače API vrne 409.

## Ponastavitev baze

Ta ukaz v korenu repozitorija ustavi bazo in **izbriše vse podatke**:

```bash
docker compose down -v
```

Po tem bazo znova zaženeš in izvedeš migracije, kot je opisano zgoraj.
