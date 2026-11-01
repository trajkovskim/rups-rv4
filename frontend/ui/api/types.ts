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

export type GeoJsonPosition = Position;
export type GeoJsonGeometry = Geometry;
export type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;
export type MapGeoData = FeatureCollection<Geometry, GeoJsonProperties>;
