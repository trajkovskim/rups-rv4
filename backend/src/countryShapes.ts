// @ts-ignore Node.js types are not installed in this project.
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

const distanceKm = (a: LngLat, b: LngLat) => {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Sample every border segment at roughly 2 km intervals. This avoids measuring
// only to sparse GeoJSON vertices, which can be tens of kilometres apart.
export const nearestCountryBoundaryDistance = (point: LngLat, country: string): number => {
  let nearest = Infinity;
  for (const polygon of countryPolygons(country)) {
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const [lngA, latA] = ring[i - 1];
        const [lngB, latB] = ring[i];
        const segmentLength = distanceKm({ lng: lngA, lat: latA }, { lng: lngB, lat: latB });
        const steps = Math.max(1, Math.ceil(segmentLength / 2));
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const candidate = { lng: lngA + (lngB - lngA) * t, lat: latA + (latB - latA) * t };
          nearest = Math.min(nearest, distanceKm(point, candidate));
        }
      }
    }
  }
  return nearest;
};
