import { geoDistance } from "d3-geo";
import world from "world-atlas/countries-50m.json";
import { loadCountries, type CountriesTopology } from "./atlas";

const { countries: all, colorById } = loadCountries(world as unknown as CountriesTopology);

// Obdržimo države, ki vsaj delno segajo v krog, ki ga projekcija še nariše (clipAngle 100°)
const CENTER: [number, number] = [10, 52];
const CLIP = (100 * Math.PI) / 180;

export const countries = all.filter((f) =>
  (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).some((p) =>
    p[0].some((c) => geoDistance(c as [number, number], CENTER) < CLIP),
  ),
);
export const countriesById = new Map(countries.map((c) => [String(c.id), c]));
export { colorById };
