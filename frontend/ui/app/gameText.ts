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
    guessCountry: {
      name: 'Ugotovi državo',
      description: 'Na zemljevidu je označena država. Čim hitreje vpiši njeno ime.',
      icon: '⏱️',
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
  countryGuess: {
    label: (questionNumber: number, totalQuestions: number) => `Država ${questionNumber} od ${totalQuestions}`,
    prompt: 'Katera država je označena?',
    inputLabel: 'Ime označene države',
    placeholder: 'Vpiši ime države',
    skipLabel: 'Naprej',
    wrongAnswer: 'To ni prava država. Poskusi znova ali pojdi naprej.',
    previousCorrect: (country: string) => `Pravilno: ${country}`,
    previousSkipped: (country: string) => `Prejšnji odgovor: ${country}`,
    skippedAnswer: 'Brez odgovora',
    submittedAnswer: (answer: string) => `Tvoj odgovor: ${answer}`,
    hitsLabel: 'Zadetki',
    timeLabel: 'Čas',
    results: {
      pointsLabel: (totalQuestions: number) => `od ${totalQuestions} zadetkov`,
      resultMessage: (correctAnswers: number, totalQuestions: number, percentage: number) =>
        percentage === 100
          ? 'Odlično — prepoznal si vse države.'
          : `Prepoznal si ${correctAnswers} od ${totalQuestions} držav.`,
      pointsUnit: 'od 1',
    },
  },
  errors: {
    unknown: 'Prišlo je do napake. Poskusi znova.',
    mapApiFallback: (error: string) =>
      `Podatkov zemljevida ni bilo mogoče naložiti iz API-ja. Uporabljen bo priloženi zemljevid. ${error}`,
    leaderboardUnavailable: (error: string) => `Lestvica trenutno ni na voljo. ${error}`,
    noQuestions: 'Za ta način igre še ni na voljo vprašanj.',
    loadQuestions: (error: string) => `Vprašanj ni bilo mogoče naložiti. ${error}`,
    checkAnswer: (error: string) => `Odgovora ni bilo mogoče preveriti. ${error}`,
    updateGame: (error: string) => `Igre ni bilo mogoče posodobiti. ${error}`,
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
  auth: {
    eyebrow: 'MERIDIANI',
    openLabel: 'Prijava',
    logoutLabel: 'Odjava',
    closeLabel: 'Zapri',
    emailLabel: 'E-pošta',
    usernameLabel: 'Uporabniško ime',
    passwordLabel: 'Geslo',
    passwordHint: 'Vsaj 8 znakov',
    showPassword: 'Pokaži geslo',
    hidePassword: 'Skrij geslo',
    login: {
      title: 'Prijava',
      description: 'Vpiši e-pošto in geslo.',
      submit: 'Prijavi se',
      switchQuestion: 'Še nimaš računa?',
      switchAction: 'Ustvari ga',
    },
    register: {
      title: 'Nov račun',
      description: 'Igraj pod svojim uporabniškim imenom.',
      submit: 'Ustvari račun',
      switchQuestion: 'Že imaš račun?',
      switchAction: 'Prijavi se',
    },
    errors: {
      email: 'Vpiši veljaven e-poštni naslov.',
      username: 'Uporabniško ime ima od 3 do 50 znakov: črke, številke, pike, vezaje in podčrtaje.',
      passwordRequired: 'Vpiši geslo.',
      passwordLength: 'Geslo mora imeti od 8 do 128 znakov.',
      unavailable: 'Strežnik trenutno ni dosegljiv. Poskusi znova.',
    },
  },
  footer: {
    name: 'Meridiani',
    description: 'Šolski projekt',
  },
} as const;

export const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${Math.floor(totalSeconds / 60)}:${seconds}`;
};

export const formatCoordinates = ({ lng, lat }: LngLat) => `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

export const formatPlaceName = (city: string | undefined, country: string | undefined, coordinates: LngLat) =>
  city && country ? `${city}, ${country}` : (country ?? formatCoordinates(coordinates));
