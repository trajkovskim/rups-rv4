import { geoAzimuthalEqualArea } from "d3-geo";
import type { MultiPoint } from "geojson";

export type Insets = { top: number; right: number; bottom: number; left: number };
export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

// Območje, ki mora biti vedno vidno: od Islandije do Kavkaza, od Krete do Nordkappa
export const EUROPE_FRAME: MultiPoint = {
  type: "MultiPoint",
  coordinates: [
    [-24, 65],
    [-9.5, 36],
    [26, 71.2],
    [44, 41],
    [42, 64],
    [25, 34.8],
  ],
};

// Na pokončnem zaslonu bi bila cela Evropa premajhna, zato izpustimo Islandijo in Kavkaz
export const NARROW_FRAME: MultiPoint = {
  type: "MultiPoint",
  coordinates: [
    [-9.5, 36.5],
    [-8, 55],
    [25, 71],
    [36, 47],
    [28, 35.5],
  ],
};

// Lambertova azimutna projekcija s središčem v Evropi, ista kot pri uradnih evropskih kartah
export function europeProjection(
  width: number,
  height: number,
  insets: Insets = NO_INSETS,
  frame: MultiPoint = EUROPE_FRAME,
) {
  const pad = Math.max(12, Math.min(width, height) * 0.04);
  return (
    geoAzimuthalEqualArea()
      .rotate([-10, -52])
      .clipAngle(100)
      .fitExtent(
        [
          [insets.left + pad, insets.top + pad],
          [width - insets.right - pad, height - insets.bottom - pad],
        ],
        frame,
      )
      // Rišemo tudi malo čez rob, da se pri premikanju ne vidi odrezanega kopnega
      .clipExtent([
        [-width, -height],
        [width * 2, height * 2],
      ])
  );
}
