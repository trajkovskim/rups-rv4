# Meridiani

Učna igra iz geografije in zgodovine za 7., 8. in 9. razred osnovne šole. Učenec dobi nalogo, klikne na zemljevid Evrope in vidi pravilni odgovor, točke in zanimivost iz učne snovi.

| Mapa | Vsebina |
| --- | --- |
| `frontend` | Aplikacija (Next.js) in knjižnica komponent |
| `backend` | API (Express) in baza (PostgreSQL z Drizzle) |
| `mock` | Prvi prototip, ni del Dockerja |

## Zagon z Dockerjem

Potrebuješ samo Docker Desktop. V korenu repozitorija zaženi:

```bash
docker compose up --build -d
```

Prvi zagon traja nekaj minut, ker se gradita sliki. Ukaz se konča, ko sta baza in API pripravljena. Backend ob vsakem zagonu sam izvede migracije in napolni vprašanja, datotek `.env` ni treba ustvarjati.

| Storitev | Naslov |
| --- | --- |
| Aplikacija | [http://localhost:3000](http://localhost:3000) |
| API | [http://localhost:8080/api](http://localhost:8080/api/questions?type=cities) |
| Baza | `localhost:5434` |

Po `git pull` isti ukaz zaženi znova, da se sliki posodobita.

## Uporabni ukazi

| Ukaz | Kaj naredi |
| --- | --- |
| `docker compose ps` | Pokaže stanje storitev |
| `docker compose logs -f backend` | Sproti izpisuje dnevnik backenda |
| `docker compose down` | Ustavi vse, podatki v bazi ostanejo |
| `docker compose down -v` | Ustavi vse in **izbriše podatke v bazi** |

## Nastavitve

Privzete vrednosti so primerne za razvoj. Če jih želiš spremeniti, jih zapiši v datoteko `.env` v korenu repozitorija.

| Spremenljivka | Privzeto | Opomba |
| --- | --- | --- |
| `FRONTEND_PORT` | `3000` | Ob spremembi prilagodi tudi `CORS_ORIGIN` |
| `BACKEND_PORT` | `8080` | Ob spremembi prilagodi tudi `PUBLIC_API_URL` |
| `DB_PORT` | `5434` | Vrata baze na tvojem računalniku |
| `PUBLIC_API_URL` | `http://localhost:8080/api` | Naslov API-ja, ki ga kliče brskalnik. Zapeče se ob gradnji, zato je po spremembi potreben `--build` |
| `CORS_ORIGIN` | `http://localhost:3000` | Naslov aplikacije, ki sme klicati API |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `meridiani` | Veljajo ob prvem ustvarjanju baze. Na strežniku nastavi svoje geslo |
| `JWT_SECRET` | Vrednost za razvoj | Ključ za podpisovanje žetonov, vsaj 32 znakov. Na strežniku nastavi svojo naključno vrednost |

## Razvoj brez Dockerja

Med razvojem je priročno, da v Dockerju teče samo baza, backend in frontend pa lokalno. Vsebnika aplikacije in API-ja zasedata vrata 3000 in 8080, zato ju prej ustavi:

```bash
docker compose stop frontend backend
```

Navodila so v [backend/README.md](backend/README.md) in [frontend/README.md](frontend/README.md).
