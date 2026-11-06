
import type { Geometry, Position } from "geojson";
import europeGeoData from "./europe.geo.json";
import type { LngLat } from "./types";

type Ring = Position[];
type Polygon = Ring[];

const countryPolygons = (country: string): Polygon[] => {
  const normalizedCountry = country.includes("Cyprus") ? "Cyprus" : country;

  const polygons: Polygon[] = [];

  for (const feature of europeGeoData.features) {
    const featureCountry = feature.properties?.country;

    if (
      typeof featureCountry !== "string" ||
      (featureCountry.includes("Cyprus") ? "Cyprus" : featureCountry) !== normalizedCountry
    ) {
      continue;
    }

    const geometry = feature.geometry as Geometry;

    if (geometry.type === "Polygon") {
      polygons.push(geometry.coordinates as Polygon);
    } else if (geometry.type === "MultiPolygon") {
      polygons.push(...(geometry.coordinates as Polygon[]));
    }
  }

  if (polygons.length === 0) {
    throw new Error(`Country "${country}" not found in europe.geo.json`);
  }

  return polygons;
};

const isInsideRing = (point: LngLat, ring: Ring): boolean => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngA, latA] = ring[i];
    const [lngB, latB] = ring[j];

    if (
      (latA > point.lat) !== (latB > point.lat) &&
      point.lng <
        ((lngB - lngA) * (point.lat - latA)) / (latB - latA) + lngA
    ) {
      inside = !inside;
    }
  }

  return inside;
};

export const isInsideCountry = (point: LngLat, country: string): boolean =>
  countryPolygons(country).some(([outer, ...holes]) =>
    isInsideRing(point, outer) &&
    !holes.some((hole) => isInsideRing(point, hole))
  );

const distanceInKilometers = (a: LngLat, b: LngLat): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const nearestCountryBoundaryDistance = (
  point: LngLat,
  country: string
): number => {
  let nearest = Infinity;

  for (const polygon of countryPolygons(country)) {
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const [lngA, latA] = ring[i - 1];
        const [lngB, latB] = ring[i];

        const segmentLength = distanceInKilometers(
          { lng: lngA, lat: latA },
          { lng: lngB, lat: latB }
        );

        const steps = Math.max(1, Math.ceil(segmentLength / 2));

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;

          const candidate = {
            lng: lngA + (lngB - lngA) * t,
            lat: latA + (latB - latA) * t,
          };

          nearest = Math.min(
            nearest,
            distanceInKilometers(point, candidate)
          );
        }
      }
    }
  }

  return nearest;
};
