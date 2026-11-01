import type { LngLat } from '@/api/types';

export const gameText = {
  metadata: {
    title: 'Meridiani | Razišči Evropo',
    description: 'Razišči Evropo z interaktivnimi kvizi na zemljevidu.',
  },
  modes: {
    capitalCities: {
      name: 'Glavna mesta',
      description: 'Razišči glavna mesta Evrope.',
      icon: '🏙️',
    },
    countriesAndRegions: {
      name: 'Države in regije',
      description: 'Odkrij države in njihove regije.',
      icon: '🗺️',
    },
    historyAndFunFacts: {
      name: 'Zgodovina in zanimivosti',
      description: 'Spoznaj presenetljive zgodbe iz vse Evrope.',
      icon: '✨',
    },
    startAction: 'Začni igrati',
    loadingAction: 'Nalaganje vprašanj…',
    actionArrow: '→',
  },
  leaderboard: {
    tabsLabel: 'Lestvice po načinu igre',
    loadingState: 'Nalaganje lestvice…',
    eyebrow: 'RAZREDNI IZZIV',
    title: 'Najboljši raziskovalci',
    subtitle: 'Vsak kviz te približa vrhu.',
    periodLabel: 'TEDENSKO',
    scoreNote: 'Z raziskovanjem zemljevida zbiraš točke',
    youLabel: 'TI',
    pointsLabel: 'točk',
    emptyState: 'Na lestvici še ni rezultatov. Bodi prvi, ki bo igral!',
    currentPlayerSummary: (rank: number) => `Trenutno si na ${rank}. mestu.`,
  },
  map: {
    loadingState: 'Nalaganje zemljevida…',
  },
  results: {
    heading: 'Konec igre',
    pointsLabel: (maximumPoints: number) => `od ${maximumPoints} točk`,
    resultMessage: (correctAnswers: number, totalQuestions: number, percentage: number) =>
      percentage === 100
        ? 'Odlično — pravilno si odgovoril na vsa vprašanja.'
        : `Pravilno si odgovoril na ${correctAnswers} od ${totalQuestions} vprašanj.`,
    correctLabel: 'Pravilno',
    incorrectLabel: 'Napačno',
    reviewLabel: 'Pregled',
    answersHeading: 'Tvoji odgovori',
    questionLabel: (questionNumber: number) => `Vprašanje ${questionNumber}`,
    correctAnswerLabel: (answer: string) => `Odgovor: ${answer}`,
    pointsUnit: 'točk',
    replayLabel: 'Igraj znova',
  },
  playerName: 'Raziskovalec',
  playerPointsLabel: 'Točke',
  question: {
    label: (questionNumber: number, totalQuestions: number) => `Vprašanje ${questionNumber} od ${totalQuestions}`,
    selectedAnswerLabel: 'Izbrano:',
    checkingAnswerLabel: 'Preverjanje odgovora…',
    submitLabel: 'Oddaj odgovor',
    nextLabel: 'Naslednje vprašanje',
  },
  errors: {
    unknown: 'Prišlo je do napake. Poskusi znova.',
    mapApiFallback: (error: string) =>
      `Podatkov zemljevida ni bilo mogoče naložiti iz API-ja. Uporabljen bo priloženi zemljevid. ${error}`,
    leaderboardUnavailable: (error: string) => `Lestvica trenutno ni na voljo. ${error}`,
    noQuestions: 'Za ta način igre še ni na voljo vprašanj.',
    loadQuestions: (error: string) => `Vprašanj ni bilo mogoče naložiti. ${error}`,
    checkAnswer: (error: string) => `Odgovora ni bilo mogoče preveriti. ${error}`,
  },
  feedback: {
    correct: 'Pravilno!',
    partiallyCorrect: 'Skoraj — odgovor je delno pravilen.',
    correctLocation: (coordinates: string) => `Pravilna lokacija je ${coordinates}.`,
  },
  instructions: {
    backLabel: 'Nazaj',
    eyebrow: 'KAKO IGRATI',
    title: 'Razišči Evropo, vprašanje za vprašanjem.',
    description: 'Izberi izziv, poišči odgovor na zemljevidu in ga oddaj za točke.',
    steps: [
      {
        title: 'Izberi izziv.',
        description: 'Za začetek izberi način igre.',
      },
      {
        title: 'Poišči odgovor.',
        description: 'Preberi vprašanje in namig, nato na zemljevidu izberi kraj.',
      },
      {
        title: 'Oddaj odgovor in zbiraj točke.',
        description: 'Za pravilne odgovore na vprašanja v izbranem načinu igre osvoji točke.',
      },
    ],
  },
  controls: {
    pause: 'Začasno ustavi igro',
    stop: 'Končaj igro',
    back: 'Nazaj',
    pausedEyebrow: 'IGRA JE ZAČASNO USTAVLJENA',
    readyEyebrow: 'SI PRIPRAVLJEN NA RAZISKOVANJE?',
    pausedTitle: 'Igra je začasno ustavljena',
    chooseModeTitle: 'Izberi način igre',
    pausedDescription: 'Nadaljuj trenutno igro ali začni novo.',
    chooseModeDescription: 'Izberi izziv in začni raziskovati Evropo.',
    resume: 'Nadaljuj igro',
    newGame: 'Začni novo igro',
  },
  footer: {
    name: 'Meridiani',
    description: 'Šolski projekt',
  },
} as const;

export const formatCoordinates = ({ lng, lat }: LngLat) => `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

export const formatPlaceName = (city: string | undefined, country: string | undefined, coordinates: LngLat) =>
  city && country ? `${city}, ${country}` : (country ?? formatCoordinates(coordinates));
