import { readFileSync } from "node:fs";
import type { LngLat } from "./scoring.js";

type Ring = number[][];
type Polygon = Ring[];

interface GeoData {
  features: {
    properties: { country: string };
    geometry:
      | { type: "Polygon"; coordinates: Polygon }
      | { type: "MultiPolygon"; coordinates: Polygon[] };
  }[];
}

const geoData: GeoData = JSON.parse(
  readFileSync(new URL("./data/europe.geo.json", import.meta.url), "utf8"),
);

const shapes = new Map<string, Polygon[]>();
for (const { properties, geometry } of geoData.features) {
  // Severni Ciper in tamponsko območje sta v podatkih ločena, otok pa je en odgovor
  const country = properties.country.includes("Cyprus") ? "Cyprus" : properties.country;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  shapes.set(country, [...(shapes.get(country) ?? []), ...polygons]);
}

const countryPolygons = (country: string) => {
  const polygons = shapes.get(country);
  if (!polygons) {
    throw new Error(`Država ${country} nima obrisa v europe.geo.json`);
  }
  return polygons;
};

const isInsideRing = ({ lng, lat }: LngLat, ring: Ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngA, latA] = ring[i];
    const [lngB, latB] = ring[j];
    if (latA > lat !== latB > lat && lng < ((lngB - lngA) * (lat - latA)) / (latB - latA) + lngA) {
      inside = !inside;
    }
  }
  return inside;
};

export const isInsideCountry = (point: LngLat, country: string) =>
  countryPolygons(country).some(
    ([outer, ...holes]) => isInsideRing(point, outer) && !holes.some((hole) => isInsideRing(point, hole)),
  );

export const countryBorderPoints = (country: string): LngLat[] =>
  countryPolygons(country).flatMap((polygon) =>
    polygon.flatMap((ring) => ring.map(([lng, lat]) => ({ lng, lat }))),
  );
