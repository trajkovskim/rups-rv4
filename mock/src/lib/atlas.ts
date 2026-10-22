import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature, neighbors } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

type CountryProps = { name: string };
export type Country = Feature<Polygon | MultiPolygon, CountryProps>;
export type CountriesTopology = Topology<{ countries: GeometryCollection<CountryProps> }>;

// Države, ki jih na zemljevidu pobarvamo. Ostali svet je samo v ozadju.
export const EUROPE_IDS = new Set([
  "008", "020", "040", "112", "056", "070", "100", "191", "196", "203", "208", "233",
  "246", "250", "276", "300", "348", "352", "372", "380", "428", "438", "440", "442",
  "470", "498", "492", "499", "528", "807", "578", "616", "620", "642", "643", "674",
  "688", "703", "705", "724", "752", "756", "804", "826", "336", "792", "268", "051",
  "031", "398", "234", "833", "832", "831", "248", "Kosovo", "N. Cyprus",
]);

export const PALETTE_SIZE = 5;

// Barvanje po sosedih: sosednji državi nikoli nimata iste barve, kot v šolskem atlasu
export function loadCountries(topo: CountriesTopology) {
  const geometries = topo.objects.countries.geometries;
  const collection = feature(topo, topo.objects.countries) as FeatureCollection<
    Polygon | MultiPolygon,
    CountryProps
  >;

  // Nekatera ozemlja (npr. Kosovo) nimajo ISO oznake, zato vzamemo kar ime
  const countries: Country[] = collection.features.map((f) => ({
    ...f,
    id: f.id != null ? String(f.id) : f.properties.name,
  }));

  const adjacency = neighbors(geometries);
  const colorOf = new Array<number>(countries.length).fill(-1);
  const used = new Array<number>(PALETTE_SIZE).fill(0);

  const order = countries
    .map((c, i) => i)
    .filter((i) => EUROPE_IDS.has(String(countries[i].id)))
    .sort((a, b) => adjacency[b].length - adjacency[a].length);

  for (const i of order) {
    const taken = new Set(adjacency[i].map((n) => colorOf[n]));
    const free = [...Array(PALETTE_SIZE).keys()].filter((c) => !taken.has(c));
    const pool = free.length ? free : [...Array(PALETTE_SIZE).keys()];
    // Med prostimi vzamemo najmanj uporabljeno barvo, da je zemljevid bolj pester
    const pick = pool.reduce((best, c) => (used[c] < used[best] ? c : best), pool[0]);
    colorOf[i] = pick;
    used[pick] += 1;
  }

  const colorById = new Map(countries.map((c, i) => [String(c.id), colorOf[i]]));
  return { countries, colorById };
}

export const landFill = (color: number | undefined) =>
  color == null || color < 0 ? "var(--land-muted)" : `var(--land-${color + 1})`;
