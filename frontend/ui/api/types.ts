import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Position,
} from 'geojson';

export interface LngLat {
  lng: number;
  lat: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginData {
  username: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

export interface Question {
  id: number;
  prompt: string;
  hint: string;
  fact: string;
}

export interface CheckQuestionAnswer {
  questionId: number;
  answer: LngLat;
}

export interface QuestionAnswerFeedback {
  correctAnswer: LngLat;
  correctness: 'yes' | 'no' | 'partially';
  points: number;
}

export interface CountryGuessQuestion extends Question {
  mapCountries: string[];
}

export interface CountryGuessGame {
  id: string;
  questions: CountryGuessQuestion[];
}

export interface CountryGuessRound {
  gameId: string;
  questionId: number;
}

export interface CheckCountryGuess extends CountryGuessRound {
  answer: string;
}

export interface CountryGuessFeedback {
  isCorrect: boolean;
  // Strežnik ime razkrije šele, ko je država uganjena ali preskočena
  correctAnswer: string | null;
  finished: boolean;
}

export interface CountryGuessResult {
  hits: number;
  totalQuestions: number;
  elapsedMs: number;
  rounds: {
    questionId: number;
    correctAnswer: string;
    submittedAnswer: string | null;
    isCorrect: boolean;
  }[];
}

export enum QuestionType {
  COUNTRIES = 'countries',
  CITIES = 'cities',
}

export type GeoJsonPosition = Position;
export type GeoJsonGeometry = Geometry;
export type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;
export type MapGeoData = FeatureCollection<Geometry, GeoJsonProperties>;
