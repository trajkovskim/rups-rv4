import { useReducer } from "react";
import type { QuestionFeedback } from "@meridiani/components";
import type { ReactNode } from "react";
import { QuestionType, type LngLat, type Question } from "@/api/types";
import type { EuropeMapDisplay } from "@meridiani/components";
import { gameText } from "./gameText";

export const GAME_MODES = [
  {
    id: 1,
    ...gameText.modes.capitalCities,
    type: QuestionType.CITIES,
    display: { country: true, water: true },
  },
  {
    id: 2,
    ...gameText.modes.countriesAndRegions,
    type: QuestionType.COUNTRIES,
    display: { city: true, water: true },
  },
] satisfies {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: QuestionType;
  display: EuropeMapDisplay;
}[];

export type GameMode = (typeof GAME_MODES)[number];
export type GamePhase = "ready" | "selecting" | "started" | "paused" | "completed";

export type QuestionResult = {
  prompt: ReactNode;
  submittedAnswer: ReactNode;
  correctAnswer: ReactNode;
  isCorrect: boolean;
  pointsEarned: number;
};

export type GameData = {
  phase: GamePhase;
  activeMode: GameMode | null;
  questions: Question[];
  points: number;
  correctAnswers: number;
  questionResults: QuestionResult[];
  answerFeedbacks: QuestionFeedback[];
  selectedAnswer: string | null;
  selectedCoordinates: LngLat | null;
  questionIndex: number;
  loadingModeId: number | null;
  error: string | null;
};

export type GameAction =
  | { type: "reset"; phase: GamePhase }
  | { type: "phase"; phase: GamePhase }
  | { type: "error"; message: string | null }
  | { type: "loading"; modeId: number | null }
  | { type: "modeLoaded"; mode: GameMode; questions: Question[] }
  | { type: "selectAnswer"; coordinates: LngLat; answer: string }
  | {
      type: "submitAnswer";
      result: QuestionResult;
      feedback: QuestionFeedback;
    }
  | { type: "nextQuestion" };

export const initialGameData = (phase: GamePhase = "ready"): GameData => ({
  phase,
  activeMode: null,
  questions: [],
  points: 0,
  correctAnswers: 0,
  questionResults: [],
  answerFeedbacks: [],
  selectedAnswer: null,
  selectedCoordinates: null,
  questionIndex: 0,
  loadingModeId: null,
  error: null,
});

export const gameReducer = (state: GameData, action: GameAction): GameData => {
  switch (action.type) {
    case "reset":
      return initialGameData(action.phase);
    case "phase":
      return { ...state, phase: action.phase };
    case "error":
      return { ...state, error: action.message };
    case "loading":
      return { ...state, loadingModeId: action.modeId };
    case "modeLoaded":
      return {
        ...state,
        phase: "started",
        activeMode: action.mode,
        questions: action.questions,
      };
    case "selectAnswer":
      return {
        ...state,
        selectedCoordinates: action.coordinates,
        selectedAnswer: action.answer,
      };
    case "submitAnswer":
      return {
        ...state,
        questionResults: [...state.questionResults, action.result],
        answerFeedbacks: [...state.answerFeedbacks, action.feedback],
        points: state.points + action.result.pointsEarned,
        correctAnswers:
          state.correctAnswers + Number(action.result.isCorrect),
      };
    case "nextQuestion":
      return {
        ...state,
        questionIndex: state.questionIndex + 1,
        selectedAnswer: null,
        selectedCoordinates: null,
      };
  }
};

export function useGame() {
  return useReducer(gameReducer, initialGameData());
}
