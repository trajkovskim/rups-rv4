import { geoGraticule, geoPath } from "d3-geo";
import world from "world-atlas/countries-110m.json";
import { landFill, loadCountries, type CountriesTopology } from "@/lib/atlas";
import type { LonLat } from "@/lib/geo";
import { PIN_PATH } from "@/lib/pin";
import { europeProjection, NO_INSETS } from "@/lib/projection";

// Statičen predogled za uvodno stran. Riše se na strežniku, zato vzamemo lažje podatke 110m.
const W = 640;
const H = 500;

const { countries, colorById } = loadCountries(world as unknown as CountriesTopology);
const projection = europeProjection(W, H, NO_INSETS, {
  type: "MultiPoint",
  coordinates: [
    [-10, 36],
    [-8, 58],
    [29, 70],
    [27, 44],
  ],
});
const path = geoPath(projection).digits(1);

export type PreviewMark = {
  at: LonLat;
  guess?: LonLat;
  label: string;
  color: string;
  regionIds?: string[];
};

export default function MapPreview({ marks }: { marks: PreviewMark[] }) {
  const highlighted = new Map(
    marks.flatMap((m) => (m.regionIds ?? []).map((id) => [id, m.color] as const)),
  );
  const xy = (p: LonLat) => projection(p) ?? [0, 0];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="map-sea block h-auto w-full" aria-hidden>
        <path d={path(geoGraticule().step([10, 10])()) ?? ""} className="map-grid" />
        {countries.map((c) => (
          <path key={`h-${c.id}`} d={path(c) ?? ""} className="map-halo" />
        ))}
        <g transform="translate(0 3)">
          {countries.map((c) => (
            <path key={`s-${c.id}`} d={path(c) ?? ""} className="map-shadow" />
          ))}
        </g>
        {countries.map((c) => {
          const id = String(c.id);
          const region = highlighted.get(id);
          return (
            <path
              key={id}
              d={path(c) ?? ""}
              fill={region ?? landFill(colorById.get(id))}
              fillOpacity={region ? 0.9 : 1}
              className="map-country"
            />
          );
        })}

        {marks.map((m) => {
          const [ax, ay] = xy(m.at);
          const guess = m.guess ? xy(m.guess) : null;
          return (
            <g key={m.label}>
              {guess && !m.regionIds && (
                <path
                  d={path({ type: "LineString", coordinates: [m.guess!, m.at] }) ?? ""}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}
              {guess && (
                <g transform={`translate(${guess[0]} ${guess[1]}) scale(0.8)`}>
                  <path d={PIN_PATH} fill="var(--ink)" stroke="#fff" strokeWidth={2.4} />
                  <circle cy={-17} r={3.4} fill="#fff" />
                </g>
              )}
              {!m.regionIds && (
                <g transform={`translate(${ax} ${ay}) scale(1.05)`}>
                  <path d={PIN_PATH} fill={m.color} stroke="#fff" strokeWidth={2} />
                  <circle cy={-17} r={3.4} fill="#fff" />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {marks.map((m) => {
        const [x, y] = xy(m.at);
        return (
          <span
            key={m.label}
            className="absolute flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[12px] font-semibold whitespace-nowrap text-ink shadow-[0_4px_12px_-6px_rgba(13,14,17,0.3)]"
            style={{
              left: `${(x / W) * 100}%`,
              // Dvig v enotah viewBoxa, da se oznaka pomanjša skupaj z buciko
              top: `${((y - (m.regionIds ? 0 : 26)) / H) * 100}%`,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
            {m.label}
          </span>
        );
      })}
    </div>
  );
}
