import { isInsideCountry, nearestCountryBoundaryDistance } from "./countryShapes.js";

export interface LngLat {
  lng: number;
  lat: number;
}

export type Correctness = "yes" | "partially" | "no";
export const MAX_POINTS = 1000;

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

export const pointsForDistance = (distanceKm: number) =>
  distanceKm <= 25
    ? MAX_POINTS
    : Math.round(MAX_POINTS * Math.exp(-(distanceKm - 25) / 600));

const correctnessForDistance = (distanceKm: number): Correctness =>
  distanceKm <= 50 ? "yes" : distanceKm <= 250 ? "partially" : "no";

const resultForDistance = (distanceKm: number) => ({
  distanceKm,
  correctness: correctnessForDistance(distanceKm),
  points: pointsForDistance(distanceKm),
});

export const scoreAnswer = (answer: LngLat, correctAnswer: LngLat) =>
  resultForDistance(distanceInKilometers(answer, correctAnswer));

export const scoreCountryAnswer = (answer: LngLat, _correctAnswer: LngLat, country: string) => {
  if (isInsideCountry(answer, country)) {
    return { distanceKm: 0, correctness: "yes" as const, points: MAX_POINTS };
  }

  return resultForDistance(nearestCountryBoundaryDistance(answer, country));
};
