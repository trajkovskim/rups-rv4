import { countryBorderPoints, isInsideCountry } from "./countryShapes.js";

export interface LngLat {
  lng: number;
  lat: number;
}

export type Correctness = "yes" | "partially" | "no";

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

const toScore = (correctness: Correctness) => ({
  correctness,
  points: correctness === "yes" ? 10 : correctness === "partially" ? 5 : 0,
});

export const scoreAnswer = (answer: LngLat, correctAnswer: LngLat) => {
  const distance = distanceInKilometers(answer, correctAnswer);
  return toScore(distance <= 30 ? "yes" : distance <= 150 ? "partially" : "no");
};

// Pri državi šteje klik kjerkoli znotraj meja. Dovoljenih 30 km od točke je za najmanjše
// države, kot sta Vatikan in Monako, ki ju na zemljevidu Evrope skoraj ni mogoče zadeti.
export const scoreCountryAnswer = (answer: LngLat, correctAnswer: LngLat, country: string) => {
  if (isInsideCountry(answer, country) || distanceInKilometers(answer, correctAnswer) <= 30) {
    return toScore("yes");
  }
  const isNearBorder = countryBorderPoints(country).some(
    (point) => distanceInKilometers(answer, point) <= 50,
  );
  return toScore(isNearBorder ? "partially" : "no");
};
