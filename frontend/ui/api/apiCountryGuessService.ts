import { requestJson } from './api';
import type {
  CheckCountryGuess,
  CountryGuessFeedback,
  CountryGuessGame,
  CountryGuessQuestion,
  CountryGuessResult,
  CountryGuessRound,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isQuestion = (value: unknown): value is CountryGuessQuestion =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.prompt === 'string' &&
  typeof value.hint === 'string' &&
  typeof value.fact === 'string' &&
  Array.isArray(value.mapCountries) &&
  value.mapCountries.every((country) => typeof country === 'string');

const isFeedback = (value: unknown): value is CountryGuessFeedback =>
  isRecord(value) &&
  typeof value.isCorrect === 'boolean' &&
  (typeof value.correctAnswer === 'string' || value.correctAnswer === null) &&
  typeof value.finished === 'boolean';

const isRoundResult = (value: unknown): value is CountryGuessResult['rounds'][number] =>
  isRecord(value) &&
  typeof value.questionId === 'number' &&
  typeof value.correctAnswer === 'string' &&
  (typeof value.submittedAnswer === 'string' || value.submittedAnswer === null) &&
  typeof value.isCorrect === 'boolean';

const gamePath = (gameId: string) => `/country-guess/games/${encodeURIComponent(gameId)}`;

const postJson = (path: string, body?: unknown) =>
  requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

export const createCountryGuessGame = async (): Promise<CountryGuessGame> => {
  const data = await postJson('/country-guess/games');

  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    !Array.isArray(data.questions) ||
    !data.questions.every(isQuestion)
  ) {
    throw new TypeError('Invalid country guess game returned by the API');
  }

  return { id: data.id, questions: data.questions };
};

export const checkCountryGuess = async ({
  gameId,
  questionId,
  answer,
}: CheckCountryGuess): Promise<CountryGuessFeedback> => {
  const data = await postJson(`${gamePath(gameId)}/guess`, { questionId, answer });

  if (!isFeedback(data)) {
    throw new TypeError('Invalid country guess feedback returned by the API');
  }

  return data;
};

export const skipCountry = async ({ gameId, questionId }: CountryGuessRound): Promise<CountryGuessFeedback> => {
  const data = await postJson(`${gamePath(gameId)}/skip`, { questionId });

  if (!isFeedback(data)) {
    throw new TypeError('Invalid country guess feedback returned by the API');
  }

  return data;
};

export const pauseCountryGuessGame = async (gameId: string): Promise<void> => {
  await postJson(`${gamePath(gameId)}/pause`);
};

export const resumeCountryGuessGame = async (gameId: string): Promise<void> => {
  await postJson(`${gamePath(gameId)}/resume`);
};

export const finishCountryGuessGame = async (gameId: string): Promise<CountryGuessResult> => {
  const data = await postJson(`${gamePath(gameId)}/finish`);

  if (
    !isRecord(data) ||
    typeof data.hits !== 'number' ||
    typeof data.totalQuestions !== 'number' ||
    typeof data.elapsedMs !== 'number' ||
    !Array.isArray(data.rounds) ||
    !data.rounds.every(isRoundResult)
  ) {
    throw new TypeError('Invalid country guess result returned by the API');
  }

  return {
    hits: data.hits,
    totalQuestions: data.totalQuestions,
    elapsedMs: data.elapsedMs,
    rounds: data.rounds,
  };
};
