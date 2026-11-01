import { QuestionType } from "./types";
import type {
  CheckQuestionAnswer,
  LeaderboardEntry,
  LngLat,
  Question,
  QuestionAnswerFeedback,
} from "./types";

type MockQuestion = Question & {
  type: QuestionType;
  correctAnswer: LngLat;
};

const MOCK_QUESTIONS: readonly MockQuestion[] = [
  {
    id: 101,
    type: QuestionType.CITIES,
    prompt: "Which city is the capital of France?",
    hint: "Look in northern France, near the Seine.",
    fact: "Paris is home to the Eiffel Tower and the Louvre.",
    correctAnswer: { lng: 2.3522, lat: 48.8566 },
  },
  {
    id: 102,
    type: QuestionType.CITIES,
    prompt: "Which city is the capital of capital of Hungary?",
    hint: "Look along the Danube in central Europe.",
    fact: "Buda and Pest became one city in 1873.",
    correctAnswer: { lng: 19.0402, lat: 47.4979 },
  },
  {
    id: 103,
    type: QuestionType.CITIES,
    prompt: "Which city is the capital of Slovenia?",
    hint: "Look between the Alps and the Adriatic Sea.",
    fact: "Ljubljana's dragon is a well-known symbol of the city",
    correctAnswer: { lng: 14.5058, lat: 46.0569 },
  },
  {
    id: 201,
    type: QuestionType.COUNTRIES,
    prompt: "Select a point inside Portugal.",
    hint: "Find the country on the western edge of the Iberian Peninsula.",
    fact: "Portugal is the westernmost country on mainland Europe.",
    correctAnswer: { lng: -8.2245, lat: 39.3999 },
  },
  {
    id: 202,
    type: QuestionType.COUNTRIES,
    prompt: "Select a point inside France.",
    hint: "Look west of Germany and north of Spain.",
    fact: "Mainland France is often called the Hexagon because of its shape.",
    correctAnswer: { lng: 2.2137, lat: 46.2276 },
  },
  {
    id: 203,
    type: QuestionType.COUNTRIES,
    prompt: "Select a point inside Croatia.",
    hint: "Look along the Adriatic Sea, east of Italy.",
    fact: "Croatia has more than a thousand islands along its Adriatic coast.",
    correctAnswer: { lng: 16.0, lat: 45.1 },
  },
];

const MOCK_LEADERBOARDS: Record<number, LeaderboardEntry[]> = {
  1: [
    { name: "Atlas", score: 80, rank: 1 },
    { name: "Compass", score: 60, rank: 2 },
    { name: "Globetrotter", score: 40, rank: 3 },
  ],
  2: [
    { name: "Compass", score: 90, rank: 1 },
    { name: "Atlas", score: 70, rank: 2 },
    { name: "Wayfinder", score: 50, rank: 3 },
  ],
};

const distanceInKilometers = (first: LngLat, second: LngLat) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(second.lat - first.lat);
  const longitudeDifference = radians(second.lng - first.lng);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(first.lat)) *
      Math.cos(radians(second.lat)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const getMockQuestionsForType = async (
  type: QuestionType,
): Promise<Question[]> =>
  MOCK_QUESTIONS.filter((question) => question.type === type).map(
    ({ id, prompt, hint, fact }) => ({ id, prompt, hint, fact }),
  );

export const checkMockQuestionAnswer = async ({
  questionId,
  answer,
}: CheckQuestionAnswer): Promise<QuestionAnswerFeedback> => {
  const question = MOCK_QUESTIONS.find(({ id }) => id === questionId);

  if (!question) {
    throw new RangeError(`Mock question ${questionId} does not exist.`);
  }

  const distance = distanceInKilometers(answer, question.correctAnswer);
  const correctness =
    distance <= 30 ? "yes" : distance <= 150 ? "partially" : "no";

  return {
    correctAnswer: question.correctAnswer,
    correctness,
    points: correctness === "yes" ? 10 : correctness === "partially" ? 5 : 0,
  };
};

export const getMockLeaderboard = async (
  gameModeId: number,
): Promise<LeaderboardEntry[]> => {
  const leaderboard = MOCK_LEADERBOARDS[gameModeId];
  if (!leaderboard) {
    throw new RangeError(`Mock leaderboard for game mode ${gameModeId} does not exist.`);
  }
  return leaderboard.map((entry) => ({ ...entry }));
};
