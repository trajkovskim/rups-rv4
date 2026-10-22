# Meridiani, mock spletne strani

Delovna različica učne igre iz geografije in zgodovine za 7., 8. in 9. razred osnovne šole. Učenec prebere nalogo, klikne na zemljevid Evrope in takoj vidi pravilni odgovor, oddaljenost od njega, točke in zanimivost iz učne snovi.

Mock prikazuje potek igre in videz, zato ima samo tri vzorčne naloge, po eno za vsako vrsto:

- **Mesto:** glavno mesto Španije. Točke so odvisne od oddaljenosti od Madrida.
- **Regija:** Skandinavija. Klikneš znotraj regije, po odgovoru se obarva.
- **Zgodovina:** kje se je začela francoska revolucija (Pariz).

## Zagon

Potrebuješ Node.js 20.9 ali novejši. Ukaze zaženeš v mapi `mock`:

```bash
npm install
npm run dev
```

Nato odpri [http://localhost:3000](http://localhost:3000). Igra je na `/igra`.

Produkcijska gradnja in zagon:

```bash
npm run build
npm start
```

## Struktura

| Pot | Vsebina |
| --- | --- |
| `src/app/page.tsx` | Uvodna stran s primerom odigrane igre |
| `src/app/igra/page.tsx` | Stran z igro |
| `src/components/Game.tsx` | Potek igre: naloga, rezultat, točke, povzetek |
| `src/components/EuropeMap.tsx` | Zemljevid: klik, povečava, bucike, oblaček z zanimivostjo |
| `src/lib/questions.ts` | Naloge, odgovori in zanimivosti |
| `src/lib/geo.ts` | Razdalje, točkovanje in razredi natančnosti |
| `src/lib/atlas.ts`, `map-data.ts`, `projection.ts` | Podatki in projekcija zemljevida |

## Dodajanje naloge

Nalogo dodaš kot nov objekt v seznam `QUESTIONS` v `src/lib/questions.ts`.

- Pri mestu in zgodovini podaš `target` kot `[geografska dolžina, geografska širina]`.
- Pri regiji podaš `countryIds`, to so numerične oznake držav po ISO 3166-1, kot jih uporablja paket `world-atlas` (npr. `"705"` za Slovenijo), in `labelAt`, točko, kjer se pokaže ime regije.

## Tehnologije

Next.js 16, React 19, TypeScript, Tailwind CSS 4, d3-geo in d3-zoom. Podatki zemljevida so iz Natural Earth (paket `world-atlas`).
