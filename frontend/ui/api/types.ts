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

export interface CheckCountryGuess {
  questionId: number;
  answer: string;
}

export interface CountryGuessFeedback {
  isCorrect: boolean;
  correctAnswer: string;
}

export enum QuestionType {
  COUNTRIES = 'countries',
  CITIES = 'cities',
}

export type GeoJsonPosition = Position;
export type GeoJsonGeometry = Geometry;
export type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;
export type MapGeoData = FeatureCollection<Geometry, GeoJsonProperties>;
