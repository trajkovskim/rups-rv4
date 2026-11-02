# Backend

Zaledje igre Meridiani v Node.js in TypeScriptu. Podatki so v bazi PostgreSQL, do katere dostopamo z [Drizzle ORM](https://orm.drizzle.team). Za zdaj vsebuje bazo s tabelo uporabnikov; API na vratih 8080 pride v naslednjih ticketih.

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
npm run db:check
```

V ukazni vrstici Windows (cmd) namesto `cp` uporabi `copy .env.example .env`.

Če je vse v redu, `db:check` izpiše:

```text
Povezava deluje: PostgreSQL 17.9
Tabela users obstaja, uporabnikov: 0
```

## Ukazi

| Ukaz | Kaj naredi |
| --- | --- |
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

## Ponastavitev baze

Ta ukaz v korenu repozitorija ustavi bazo in **izbriše vse podatke**:

```bash
docker compose down -v
```

Po tem bazo znova zaženeš in izvedeš migracije, kot je opisano zgoraj.
