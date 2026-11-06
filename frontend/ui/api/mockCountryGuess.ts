import type {
  CheckCountryGuess,
  CountryGuessFeedback,
  CountryGuessGame,
  CountryGuessResult,
  CountryGuessRound,
} from "./types";

const QUESTIONS_PER_GAME = 10;

type MockCountry = {
  id: number;
  name: string;
  // Imena držav v europe.geo.json. Ciper je tam razdeljen na tri dele.
  mapCountries: string[];
  aliases?: string[];
};

// Mikrodržave (Monako, Vatikan, San Marino, Lihtenštajn) so na zemljevidu premajhne za označevanje
const MOCK_COUNTRIES: readonly MockCountry[] = [
  { id: 1, name: "Albanija", mapCountries: ["Albania"] },
  { id: 2, name: "Andora", mapCountries: ["Andorra"] },
  { id: 3, name: "Avstrija", mapCountries: ["Austria"] },
  { id: 4, name: "Belgija", mapCountries: ["Belgium"] },
  { id: 5, name: "Belorusija", mapCountries: ["Belarus"], aliases: ["Belarus"] },
  { id: 6, name: "Bolgarija", mapCountries: ["Bulgaria"] },
  { id: 7, name: "Bosna in Hercegovina", mapCountries: ["Bosnia and Herzegovina"], aliases: ["BiH", "Bosna"] },
  {
    id: 8,
    name: "Ciper",
    mapCountries: ["Cyprus", "Northern Cyprus", "Cyprus No Mans Area"],
  },
  { id: 9, name: "Črna gora", mapCountries: ["Montenegro"] },
  { id: 10, name: "Češka", mapCountries: ["Czechia"], aliases: ["Češka republika"] },
  { id: 11, name: "Danska", mapCountries: ["Denmark"] },
  { id: 12, name: "Estonija", mapCountries: ["Estonia"] },
  { id: 13, name: "Finska", mapCountries: ["Finland"] },
  { id: 14, name: "Francija", mapCountries: ["France"] },
  { id: 15, name: "Grčija", mapCountries: ["Greece"] },
  { id: 16, name: "Hrvaška", mapCountries: ["Croatia"] },
  { id: 17, name: "Irska", mapCountries: ["Ireland"] },
  { id: 18, name: "Islandija", mapCountries: ["Iceland"] },
  { id: 19, name: "Italija", mapCountries: ["Italy"] },
  { id: 20, name: "Kosovo", mapCountries: ["Kosovo"] },
  { id: 21, name: "Latvija", mapCountries: ["Latvia"] },
  { id: 22, name: "Litva", mapCountries: ["Lithuania"] },
  { id: 23, name: "Luksemburg", mapCountries: ["Luxembourg"] },
  { id: 24, name: "Madžarska", mapCountries: ["Hungary"] },
  { id: 25, name: "Malta", mapCountries: ["Malta"] },
  { id: 26, name: "Moldavija", mapCountries: ["Moldova"], aliases: ["Moldova"] },
  { id: 27, name: "Nemčija", mapCountries: ["Germany"] },
  { id: 28, name: "Nizozemska", mapCountries: ["Netherlands"], aliases: ["Holandija"] },
  { id: 29, name: "Norveška", mapCountries: ["Norway"] },
  { id: 30, name: "Poljska", mapCountries: ["Poland"] },
  { id: 31, name: "Portugalska", mapCountries: ["Portugal"] },
  { id: 32, name: "Romunija", mapCountries: ["Romania"] },
  { id: 33, name: "Rusija", mapCountries: ["Russia"], aliases: ["Ruska federacija"] },
  { id: 34, name: "Severna Makedonija", mapCountries: ["North Macedonia"], aliases: ["Makedonija"] },
  { id: 35, name: "Slovaška", mapCountries: ["Slovakia"] },
  { id: 36, name: "Slovenija", mapCountries: ["Slovenia"] },
  { id: 37, name: "Srbija", mapCountries: ["Republic of Serbia"] },
  { id: 38, name: "Španija", mapCountries: ["Spain"] },
  { id: 39, name: "Švedska", mapCountries: ["Sweden"] },
  { id: 40, name: "Švica", mapCountries: ["Switzerland"] },
  { id: 41, name: "Turčija", mapCountries: ["Turkey"] },
  { id: 42, name: "Ukrajina", mapCountries: ["Ukraine"] },
  {
    id: 43,
    name: "Združeno kraljestvo",
    mapCountries: ["United Kingdom"],
    aliases: ["Velika Britanija", "VB"],
  },
];

// Velike črke, strešice in odvečni presledki ne štejejo kot napaka
const normalizeAnswer = (answer: string) =>
  answer
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const shuffled = <T,>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

type MockGame = {
  countries: MockCountry[];
  rounds: CountryGuessResult["rounds"];
  lastAnswer: string | null;
  startedAt: number;
  pausedAt: number | null;
  pausedMs: number;
  finishedAt: number | null;
};

const mockGames = new Map<string, MockGame>();
let lastMockGameId = 0;

const findGame = (gameId: string): MockGame => {
  const game = mockGames.get(gameId);
  if (!game) {
    throw new RangeError(`Mock game ${gameId} does not exist.`);
  }
  return game;
};

const endRound = (game: MockGame, country: MockCountry, isCorrect: boolean): CountryGuessFeedback => {
  game.rounds.push({
    questionId: country.id,
    correctAnswer: country.name,
    submittedAnswer: game.lastAnswer,
    isCorrect,
  });
  game.lastAnswer = null;
  const finished = game.rounds.length === game.countries.length;
  if (finished) {
    game.finishedAt = Date.now();
  }
  return { isCorrect, correctAnswer: country.name, finished };
};

const currentCountry = (game: MockGame, questionId: number): MockCountry => {
  const country = game.countries[game.rounds.length];
  if (game.finishedAt !== null || game.pausedAt !== null || country?.id !== questionId) {
    throw new RangeError(`Mock country ${questionId} is not the current question.`);
  }
  return country;
};

export const createMockCountryGuessGame = async (): Promise<CountryGuessGame> => {
  const id = String(++lastMockGameId);
  const countries = shuffled(MOCK_COUNTRIES).slice(0, QUESTIONS_PER_GAME);
  mockGames.set(id, {
    countries,
    rounds: [],
    lastAnswer: null,
    startedAt: Date.now(),
    pausedAt: null,
    pausedMs: 0,
    finishedAt: null,
  });
  return {
    id,
    questions: countries.map(({ id: questionId, mapCountries }) => ({
      id: questionId,
      prompt: "Katera država je označena?",
      hint: "",
      fact: "",
      mapCountries,
    })),
  };
};

export const checkMockCountryGuess = async ({
  gameId,
  questionId,
  answer,
}: CheckCountryGuess): Promise<CountryGuessFeedback> => {
  const game = findGame(gameId);
  const country = currentCountry(game, questionId);
  game.lastAnswer = answer;
  const accepted = [country.name, ...(country.aliases ?? [])].map(normalizeAnswer);
  return accepted.includes(normalizeAnswer(answer))
    ? endRound(game, country, true)
    : { isCorrect: false, correctAnswer: null, finished: false };
};

export const skipMockCountry = async ({ gameId, questionId }: CountryGuessRound): Promise<CountryGuessFeedback> => {
  const game = findGame(gameId);
  return endRound(game, currentCountry(game, questionId), false);
};

export const pauseMockCountryGuessGame = async (gameId: string): Promise<void> => {
  const game = findGame(gameId);
  game.pausedAt ??= Date.now();
};

export const resumeMockCountryGuessGame = async (gameId: string): Promise<void> => {
  const game = findGame(gameId);
  if (game.pausedAt !== null) {
    game.pausedMs += Date.now() - game.pausedAt;
    game.pausedAt = null;
  }
};

export const finishMockCountryGuessGame = async (gameId: string): Promise<CountryGuessResult> => {
  const game = findGame(gameId);
  await resumeMockCountryGuessGame(gameId);
  game.finishedAt ??= Date.now();
  return {
    hits: game.rounds.filter(({ isCorrect }) => isCorrect).length,
    totalQuestions: game.countries.length,
    elapsedMs: game.finishedAt - game.startedAt - game.pausedMs,
    rounds: game.rounds,
  };
};
