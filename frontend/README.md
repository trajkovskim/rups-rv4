# Meridiani

Učna igra iz geografije in zgodovine za 7., 8. in 9. razred osnovne šole. Učenec dobi nalogo, na primer »Glavno mesto Španije«, klikne na zemljevid Evrope in takoj vidi pravilni odgovor, oddaljenost od njega, točke in zanimivost iz učne snovi.

Trenutno je v repozitoriju mock spletne strani v mapi [`mock`](mock), ki prikazuje potek igre in videz na treh vzorčnih nalogah. Podrobnosti so v [mock/README.md](mock/README.md).

## Zagon po kloniranju

Potrebuješ [Node.js](https://nodejs.org) 20.9 ali novejši.

```bash
cd mock
npm install
npm run dev
```

Nato odpri [http://localhost:3000](http://localhost:3000).

Če si repozitorij samo posodobil (`git pull`), zaženi `npm install` v mapi `mock` še enkrat, ker so lahko vmes prišle nove odvisnosti.
