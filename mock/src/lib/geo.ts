import { geoDistance, geoInterpolate } from "d3-geo";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export type LonLat = [number, number];

const EARTH_RADIUS_KM = 6371;
export const MAX_POINTS = 1000;

export function distanceKm(a: LonLat, b: LonLat) {
  return geoDistance(a, b) * EARTH_RADIUS_KM;
}

// Mejo razdelimo na koščke po 2 km, ker so oglišča v podatkih 50m ponekod tudi 60 km narazen
export function nearestOnBoundary(
  point: LonLat,
  features: Feature<Polygon | MultiPolygon>[],
) {
  let best: LonLat = point;
  let bestRad = Infinity;

  for (const f of features) {
    const polygons =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (let i = 1; i < ring.length; i++) {
          const a = ring[i - 1] as LonLat;
          const b = ring[i] as LonLat;
          const n = Math.max(1, Math.ceil((geoDistance(a, b) * EARTH_RADIUS_KM) / 2));
          const at = geoInterpolate(a, b);
          for (let j = 0; j < n; j++) {
            const c = at(j / n) as LonLat;
            const d = geoDistance(point, c);
            if (d < bestRad) {
              bestRad = d;
              best = c;
            }
          }
        }
      }
    }
  }

  return { point: best, km: bestRad * EARTH_RADIUS_KM };
}

// Do 25 km dobiš vse točke, potem točke padajo eksponentno.
export function pointsFor(km: number) {
  if (km <= 25) return MAX_POINTS;
  return Math.round(MAX_POINTS * Math.exp(-(km - 25) / 600));
}

export type TierId = "t1" | "t2" | "t3" | "t4";

export const TIERS: { id: TierId; label: string; maxKm: number }[] = [
  { id: "t1", label: "Odlično", maxKm: 50 },
  { id: "t2", label: "Zelo blizu", maxKm: 250 },
  { id: "t3", label: "Blizu", maxKm: 600 },
  { id: "t4", label: "Daleč", maxKm: Infinity },
];

export function tierFor(km: number) {
  return TIERS.find((t) => km <= t.maxKm) ?? TIERS[TIERS.length - 1];
}

export const tierColor = (id: TierId) => `var(--${id})`;

export function formatKm(km: number) {
  return `${Math.round(km).toLocaleString("sl-SI")} km`;
}

// Slovenščina ima dvojino, zato 1 točka, 2 točki, 3 točke, 5 točk.
export function tockLabel(n: number) {
  const r = Math.abs(n) % 100;
  if (r === 1) return "točka";
  if (r === 2) return "točki";
  if (r === 3 || r === 4) return "točke";
  return "točk";
}

function degMin(value: number) {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let min = Math.round((abs - deg) * 60);
  if (min === 60) {
    deg += 1;
    min = 0;
  }
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

export function formatLat(lat: number) {
  return `${degMin(lat)} ${lat >= 0 ? "s" : "j"}. g. š.`;
}

export function formatLon(lon: number) {
  return `${degMin(lon)} ${lon >= 0 ? "v" : "z"}. g. d.`;
}
