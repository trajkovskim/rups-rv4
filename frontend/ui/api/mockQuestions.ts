import { QuestionType } from "./types";
import type {
  CheckQuestionAnswer,
  LeaderboardEntry,
  LngLat,
  Question,
  QuestionAnswerFeedback,
} from "./types";
import {
  isInsideCountry,
  nearestCountryBoundaryDistance,
} from "./countryShapes";

type MockQuestion = Question & {
  type: QuestionType;
  correctAnswer: LngLat;
  country?: string;
};

const MOCK_QUESTIONS: readonly MockQuestion[] = [
  {
    id: 101,
    type: QuestionType.CITIES,
    prompt: "Katero mesto je glavno mesto Francije?",
    hint: "Išči na severu Francije, v bližini reke Sene.",
    fact: "V Parizu se nahajata Eifflov stolp in muzej Louvre.",
    locationName: "Pariz",
    country: "France",
    correctAnswer: { lng: 2.3522, lat: 48.8566 },
  },
  {
    id: 102,
    type: QuestionType.CITIES,
    prompt: "Katero mesto je glavno mesto Madžarske?",
    hint: "Išči ob reki Donavi v osrednji Evropi.",
    fact: "Budim in Pešta sta se leta 1873 združila v eno mesto.",
    locationName: "Budimpešta",
    country: "Hungary",
    correctAnswer: { lng: 19.0402, lat: 47.4979 },
  },
  {
    id: 103,
    type: QuestionType.CITIES,
    prompt: "Katero mesto je glavno mesto Slovenije?",
    hint: "Išči med Alpami in Jadranskim morjem.",
    fact: "Ljubljanski zmaj je eden najbolj prepoznavnih simbolov mesta.",
    locationName: "Ljubljana",
    country: "Slovenia",
    correctAnswer: { lng: 14.5058, lat: 46.0569 },
  },
  {
    id: 201,
    type: QuestionType.COUNTRIES,
    prompt: "Izberi točko znotraj Portugalske.",
    hint: "Poišči državo na zahodnem robu Iberskega polotoka.",
    fact: "Portugalska je najzahodnejša država celinske Evrope.",
    locationName: "Portugalska",
    country: "Portugal",
    correctAnswer: { lng: -8.2245, lat: 39.3999 },
  },
  {
    id: 202,
    type: QuestionType.COUNTRIES,
    prompt: "Izberi točko znotraj Francije.",
    hint: "Poišči državo zahodno od Nemčije in severno od Španije.",
    fact: "Celinsko Francijo zaradi njene oblike pogosto imenujejo šesterokotnik.",
    locationName: "Francija",
    country: "France",
    correctAnswer: { lng: 2.2137, lat: 46.2276 },
  },
  {
    id: 203,
    type: QuestionType.COUNTRIES,
    prompt: "Izberi točko znotraj Hrvaške.",
    hint: "Poišči državo ob Jadranskem morju, vzhodno od Italije.",
    fact: "Hrvaška ima ob jadranski obali več kot tisoč otokov.",
    locationName: "Hrvaška",
    country: "Croatia",
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
    ({ id, prompt, hint, fact, locationName }) => ({
      id,
      prompt,
      hint,
      fact,
      locationName,
    }),
  );

const MAX_POINTS = 1000;

const pointsForDistance = (distanceKm: number): number =>
  distanceKm <= 25
    ? MAX_POINTS
    : Math.round(MAX_POINTS * Math.exp(-(distanceKm - 25) / 600));

const correctnessForDistance = (
  distanceKm: number,
): "yes" | "partially" | "no" =>
  distanceKm <= 50
    ? "yes"
    : distanceKm <= 250
      ? "partially"
      : "no";

export const checkMockQuestionAnswer = async ({
  questionId,
  answer,
}: CheckQuestionAnswer): Promise<QuestionAnswerFeedback> => {
  const question = MOCK_QUESTIONS.find(({ id }) => id === questionId);

  if (!question) {
    throw new RangeError(`Testno vprašanje ${questionId} ne obstaja.`);
  }

  if (question.type === QuestionType.COUNTRIES && question.country) {
    if (isInsideCountry(answer, question.country)) {
      return {
        correctAnswer: question.correctAnswer,
        distanceKm: 0,
        correctness: "yes",
        points: MAX_POINTS,
      };
    }

    const distanceKm = nearestCountryBoundaryDistance(
      answer,
      question.country,
    );

    return {
      correctAnswer: question.correctAnswer,
      distanceKm,
      correctness: correctnessForDistance(distanceKm),
      points: pointsForDistance(distanceKm),
    };
  }

  const distanceKm = distanceInKilometers(
    answer,
    question.correctAnswer,
  );

  return {
    correctAnswer: question.correctAnswer,
    distanceKm,
    correctness: correctnessForDistance(distanceKm),
    points: pointsForDistance(distanceKm),
  };
};

export const getMockLeaderboard = async (
  gameModeId: number,
): Promise<LeaderboardEntry[]> => {
  const leaderboard = MOCK_LEADERBOARDS[gameModeId];

  if (!leaderboard) {
    throw new RangeError(
      `Testna lestvica za način igre ${gameModeId} ne obstaja.`,
    );
  }

  return leaderboard.map((entry) => ({ ...entry }));
};