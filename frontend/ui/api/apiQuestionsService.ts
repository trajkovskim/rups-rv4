import { requestJson } from './api';
import type {
  CheckQuestionAnswer,
  LeaderboardEntry,
  LngLat,
  Question,
  QuestionAnswerFeedback,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isLngLat = (value: unknown): value is LngLat =>
  isRecord(value) &&
  typeof value.lng === 'number' &&
  Number.isFinite(value.lng) &&
  typeof value.lat === 'number' &&
  Number.isFinite(value.lat);

const isCorrectness = (value: unknown): value is QuestionAnswerFeedback['correctness'] =>
  value === 'yes' || value === 'no' || value === 'partially';

const isQuestion = (value: unknown): value is Question =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  Number.isFinite(value.id) &&
  typeof value.prompt === 'string' &&
  typeof value.hint === 'string' &&
  typeof value.fact === 'string';

const isLeaderboardEntry = (value: unknown): value is LeaderboardEntry =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  typeof value.score === 'number' &&
  Number.isFinite(value.score) &&
  typeof value.rank === 'number' &&
  Number.isFinite(value.rank);

export const checkQuestionAnswer = async (
  checkQuestionAnswer: CheckQuestionAnswer,
): Promise<QuestionAnswerFeedback> => {
  const data = await requestJson('/questions/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkQuestionAnswer),
  });

  if (
    !isRecord(data) ||
    !isLngLat(data.correctAnswer) ||
    !isCorrectness(data.correctness) ||
    typeof data.points !== 'number' ||
    !Number.isFinite(data.points)
  ) {
    throw new TypeError('Invalid question answer feedback returned by the API');
  }

  return {
    correctAnswer: data.correctAnswer,
    correctness: data.correctness,
    points: data.points,
  };
};

export const getQuestionsForGameMode = async (gameModeId: number): Promise<Question[]> => {
  const query = new URLSearchParams({ gameModeId: String(gameModeId) });
  const data = await requestJson(`/questions?${query}`);

  if (!Array.isArray(data) || !data.every(isQuestion)) {
    throw new TypeError('Invalid questions returned by the API');
  }

  return data;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const data = await requestJson('/leaderboard');

  if (!Array.isArray(data) || !data.every(isLeaderboardEntry)) {
    throw new TypeError('Invalid leaderboard returned by the API');
  }

  return data;
};
