"use client";

import { geoCentroid, geoContains, geoGraticule, geoIdentity, geoInterpolate, geoPath } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import type { LineString, Polygon } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { landFill } from "@/lib/atlas";
import { formatLat, formatLon, type LonLat } from "@/lib/geo";
import { colorById, countries, countriesById } from "@/lib/map-data";
import { motionMs } from "@/lib/motion";
import { PIN_PATH } from "@/lib/pin";
import { europeProjection, NARROW_FRAME, NO_INSETS, type Insets } from "@/lib/projection";

// Postavitev kartic nad zemljevidom; Game uporablja iste mere
export const WIDE_MIN = 1024;
export const PANEL_WIDTH = 380;
export const GAP = 16;

const graticule = geoGraticule().step([10, 10])();
const SCALE_STEPS = [25, 50, 100, 200, 250, 500, 1000];
// Kartica z nalogo je zgoraj na sredini, zato osnovni pogled pusti nad Evropo nekaj prostora
const PROMPT_SPACE = 108;
const NARROW_PROMPT_SPACE = 124;
// Oblaček z zanimivostjo ob pravilnem odgovoru (samo na večjih zaslonih)
const CALLOUT_W = 320;
const CALLOUT_H = 240;
const CALLOUT_GAP = 26;
const CALLOUT_ABOVE = 52;
const FOCUS_MAX = 2.6;
const MIN_ZOOM = 0.8;
// Na telefonu mora biti mogoče pogled bolj oddaljiti, da gresta klik in odgovor med kartici
const NARROW_MIN_ZOOM = 0.45;
const MAX_ZOOM = 8;

const steps = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

// Orientacija za otroke: domača država in imena morij (nobeno ne izda odgovora)
const HOME_ID = "705";
const SEAS: { name: string; at: LonLat }[] = [
  { name: "Atlantski ocean", at: [-19, 47] },
  { name: "Severno morje", at: [3.2, 56.4] },
  { name: "Baltsko morje", at: [18.6, 55.6] },
  { name: "Sredozemsko morje", at: [17.5, 35.2] },
  { name: "Črno morje", at: [34.2, 43.2] },
];

// Približne mere oznak v pikslih: levo, zgoraj, desno, spodaj
type Box = [number, number, number, number];
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const around = (x: number, top: number, halfW: number, h: number): Box => [x - halfW, top, x + halfW, top + h];

export type MapReveal = {
  guess: LonLat;
  // Pri mestu je to pravilna lokacija, pri regiji najbližja točka na meji
  answer: LonLat;
  label: string;
  labelAt: LonLat;
  regionIds?: string[];
  distanceLabel?: string;
  tierColor: string;
  celebrate: boolean;
  fact: string;
  curriculum: string;
};

type Props = {
  accent: string;
  reveal: MapReveal | null;
  // Ob novi nalogi se pogled vrne na celo Evropo
  viewKey: string;
  // Višini kartic z nalogo in rezultatom, da odgovor ne pristane pod njima
  promptHeight: number;
  resultHeight: number;
  onGuess: (point: LonLat) => void;
};

type Cursor = { x: number; y: number; at: LonLat; countryId: string | null };

export default function EuropeMap({
  accent,
  reveal,
  viewKey,
  promptHeight,
  resultHeight,
  onGuess,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<ZoomTransform>(zoomIdentity);
  // Transformacija, s katero je osnovni zemljevid dejansko izrisan. Med premikanjem ga samo
  // raztegujemo s CSS (hitro), na novo ga narišemo šele, ko se premik konča.
  const [committed, setCommitted] = useState<ZoomTransform>(zoomIdentity);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const wide = size.width >= WIDE_MIN;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Osnovni pogled je odvisen samo od velikosti, sicer bi zemljevid poskakoval med nalogami
  const projection = useMemo(() => {
    const { width, height } = size;
    if (!width || !height) return null;
    return width >= WIDE_MIN
      ? europeProjection(width, height, { ...NO_INSETS, top: PROMPT_SPACE })
      : europeProjection(width, height, { ...NO_INSETS, top: NARROW_PROMPT_SPACE }, NARROW_FRAME);
  }, [size]);

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection]);

  useEffect(() => {
    const svg = svgRef.current;
    const { width, height } = size;
    if (!svg || !width) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([width >= WIDE_MIN ? MIN_ZOOM : NARROW_MIN_ZOOM, MAX_ZOOM])
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [-width * 0.3, -height * 0.3],
        [width * 1.3, height * 1.3],
      ])
      // Majhen premik miške med klikom je še vedno klik, ne vlečenje
      .clickDistance(6)
      .on("zoom", (e: { transform: ZoomTransform }) => setView(e.transform))
      .on("end", (e: { transform: ZoomTransform }) => setCommitted(e.transform));
    const sel = select(svg);
    sel.call(behavior).on("dblclick.zoom", null);
    sel.call(behavior.transform, zoomIdentity);
    zoomRef.current = behavior;
    return () => {
      sel.on(".zoom", null);
    };
  }, [size]);

  useEffect(() => {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (!svg || !behavior) return;
    select(svg).transition().duration(motionMs(700)).call(behavior.transform, zoomIdentity);
  }, [viewKey]);

  // Po odgovoru se zemljevid sam premakne in približa, da se lepo vidita klik in rešitev
  useEffect(() => {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (!reveal || !svg || !behavior || !projection || !path) return;

    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of [reveal.guess, reveal.answer, reveal.labelAt]) {
      const xy = projection(p);
      if (xy) {
        xs.push(xy[0]);
        ys.push(xy[1]);
      }
    }
    for (const id of reveal.regionIds ?? []) {
      const f = countriesById.get(id);
      if (!f) continue;
      const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const coordinates of polygons) {
        const polygon: Polygon = { type: "Polygon", coordinates };
        // Svalbard bi pogled po nepotrebnem raztegnil daleč na sever
        if (geoCentroid(polygon)[1] > 72) continue;
        const [[x0, y0], [x1, y1]] = path.bounds(polygon);
        xs.push(x0, x1);
        ys.push(y0, y1);
      }
    }
    if (!xs.length) return;

    const anchor = projection(reveal.labelAt);
    const guessBase = projection(reveal.guess);
    const withCallout = Boolean(wide && anchor);
    // Oblaček gre na stran, kjer ni klika, da ne pokrije tvoje bucike
    const toLeft = Boolean(guessBase && anchor && guessBase[0] > anchor[0]);

    const insets: Insets = wide
      ? { top: promptHeight + GAP * 2, right: PANEL_WIDTH + GAP * 2, bottom: 64, left: GAP }
      : { top: promptHeight + GAP, right: GAP, bottom: resultHeight + GAP, left: GAP };
    // Robovi so v pikslih zaslona: oznaka odgovora na telefonu stoji približno 74 px nad točko,
    // oznaka "Tvoj odgovor" pa do 36 px pod klikom
    const padX = wide ? 56 : 32;
    const padTop = withCallout || reveal.regionIds ? 40 : 84;
    const padBottom = wide ? 56 : 44;
    const areaW = size.width - insets.left - insets.right;
    const areaH = size.height - insets.top - insets.bottom;
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const minK = wide ? MIN_ZOOM : NARROW_MIN_ZOOM;

    // Vsebina pri povečavi k: točke z robovi in oblaček ob odgovoru
    const contentBox = (k: number) => {
      let left = x0 * k - padX;
      let right = x1 * k + padX;
      let top = y0 * k - padTop;
      let bottom = y1 * k + padBottom;
      if (withCallout && anchor) {
        const ax = anchor[0] * k;
        const ay = anchor[1] * k - (reveal.regionIds ? 0 : 24);
        const cx = toLeft ? ax - CALLOUT_GAP - CALLOUT_W : ax + CALLOUT_GAP;
        left = Math.min(left, cx - 12);
        right = Math.max(right, cx + CALLOUT_W + 12);
        top = Math.min(top, ay - CALLOUT_ABOVE - 12);
        bottom = Math.max(bottom, ay - CALLOUT_ABOVE + CALLOUT_H + 12);
      }
      return { left, right, top, bottom };
    };

    let k = Math.min(FOCUS_MAX, areaW / Math.max(1, x1 - x0), areaH / Math.max(1, y1 - y0));
    for (let i = 0; i < 12; i++) {
      const b = contentBox(k);
      const fit = Math.min(areaW / (b.right - b.left), areaH / (b.bottom - b.top));
      if (fit >= 0.995) break;
      k *= fit;
    }
    k = Math.min(FOCUS_MAX, Math.max(minK, k));
    const box = contentBox(k);
    const tx = insets.left + areaW / 2 - (box.left + box.right) / 2;
    const ty = insets.top + areaH / 2 - (box.top + box.bottom) / 2;

    select(svg)
      .transition()
      .delay(motionMs(250))
      .duration(motionMs(900))
      .call(behavior.transform, zoomIdentity.translate(tx, ty).scale(k));
  }, [reveal, projection, path, size, wide, promptHeight, resultHeight]);

  function zoomBy(factor: number) {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (svg && behavior) select(svg).transition().duration(motionMs(250)).call(behavior.scaleBy, factor);
  }

  function resetView() {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (svg && behavior) select(svg).transition().duration(motionMs(500)).call(behavior.transform, zoomIdentity);
  }

  // Za stvari, ki morajo ostati enako velike ne glede na povečavo (črte, bucike)
  const screenPath = useMemo(() => {
    if (!projection) return null;
    const zoomed = geoIdentity().scale(view.k).translate([view.x, view.y]);
    return geoPath({ stream: (s) => projection.stream(zoomed.stream(s)) });
  }, [projection, view]);

  const shapes = useMemo(
    () =>
      path
        ? countries
            .map((c) => {
              const color = colorById.get(String(c.id));
              return {
                id: String(c.id),
                d: path(c) ?? "",
                bounds: path.bounds(c),
                fill: landFill(color),
                europe: color != null && color >= 0,
              };
            })
            .filter((s) => s.d)
        : [],
    [path],
  );

  const homeShape = shapes.find((s) => s.id === HOME_ID);
  const homeAt = useMemo(() => {
    const home = countriesById.get(HOME_ID);
    return home ? (geoCentroid(home) as LonLat) : null;
  }, []);

  // Osnovni sloji se med premikanjem miške ne spreminjajo, zato jih zgradimo enkrat
  const gridLayer = useMemo(
    () => <path d={path?.(graticule) ?? ""} className="map-grid" />,
    [path],
  );
  const haloLayer = useMemo(
    () => shapes.map((s) => <path key={s.id} d={s.d} className="map-halo" />),
    [shapes],
  );
  const shadowLayer = useMemo(
    () => shapes.map((s) => <path key={s.id} d={s.d} className="map-shadow" />),
    [shapes],
  );
  const landLayer = useMemo(
    () =>
      shapes.map((s) => (
        <path
          key={s.id}
          d={s.d}
          fill={s.fill}
          className="map-country"
        />
      )),
    [shapes],
  );

  const hoverLines = useMemo(() => {
    if (!cursor || !screenPath) return null;
    const [lon, lat] = cursor.at;
    const meridian: LineString = {
      type: "LineString",
      coordinates: steps(-88, 88, 2).map((la) => [lon, la]),
    };
    const parallel: LineString = {
      type: "LineString",
      coordinates: steps(-180, 180, 2).map((lo) => [lo, lat]),
    };
    return { meridian: screenPath(meridian) ?? "", parallel: screenPath(parallel) ?? "" };
  }, [cursor, screenPath]);

  const scaleBar = useMemo(() => {
    if (!projection) return null;
    const center = projection.invert?.([size.width / 2, size.height / 2]);
    if (!center) return null;
    const dLon = ((100 / 6371) * (180 / Math.PI)) / Math.cos((center[1] * Math.PI) / 180);
    const a = projection(center);
    const b = projection([center[0] + dLon, center[1]]);
    if (!a || !b) return null;
    const pxPerKm = (Math.hypot(b[0] - a[0], b[1] - a[1]) / 100) * view.k;
    const km = SCALE_STEPS.find((k) => k * pxPerKm >= 56) ?? 1000;
    return { km, px: km * pxPerKm };
  }, [projection, size, view.k]);

  function locate(e: React.MouseEvent<SVGSVGElement>): Cursor | null {
    if (!projection?.invert) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const at = projection.invert(view.invert([x, y]));
    if (!at || !Number.isFinite(at[0]) || !Number.isFinite(at[1])) return null;
    return { x, y, at: [at[0], at[1]], countryId: null };
  }

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType !== "mouse" || reveal) return;
    const hit = locate(e);
    if (!hit) return setCursor(null);
    // Najprej hiter test z mejami, šele nato natančen test z obliko države
    const [bx, by] = view.invert([hit.x, hit.y]);
    const country = shapes.find(
      (s) =>
        s.europe &&
        bx >= s.bounds[0][0] &&
        bx <= s.bounds[1][0] &&
        by >= s.bounds[0][1] &&
        by <= s.bounds[1][1] &&
        geoContains(countriesById.get(s.id)!, hit.at),
    );
    setCursor({ ...hit, countryId: country?.id ?? null });
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (reveal) return;
    const hit = locate(e);
    if (!hit) return;
    setCursor(null);
    onGuess(hit.at);
  }

  const toScreen = (p: LonLat): [number, number] | null => {
    const xy = projection?.(p);
    return xy ? view.apply(xy) : null;
  };

  const isRegion = Boolean(reveal?.regionIds);
  const guessXY = reveal ? toScreen(reveal.guess) : null;
  const answerXY = reveal ? toScreen(reveal.answer) : null;
  const labelXY = reveal ? toScreen(reveal.labelAt) : null;
  const regionShapes = reveal?.regionIds
    ? shapes.filter((s) => reveal.regionIds!.includes(s.id))
    : [];
  const hovered = cursor?.countryId ? shapes.find((s) => s.id === cursor.countryId) : null;
  const arc =
    reveal?.distanceLabel && screenPath
      ? screenPath({ type: "LineString", coordinates: [reveal.guess, reveal.answer] })
      : null;
  const midXY =
    reveal && arc ? toScreen(geoInterpolate(reveal.guess, reveal.answer)(0.5) as LonLat) : null;

  const gap =
    guessXY && answerXY ? Math.hypot(guessXY[0] - answerXY[0], guessXY[1] - answerXY[1]) : Infinity;
  const distanceOnLine = Boolean(reveal?.distanceLabel && midXY && gap > 280);
  const labelLift = isRegion ? 0 : 36;

  // Na večjem zaslonu sta ime odgovora in zanimivost v oblačku ob bucici
  let callout: { left: number; top: number; pointerY: number; toRight: boolean } | null = null;
  if (wide && reveal && labelXY) {
    const ax = labelXY[0];
    const ay = labelXY[1] - (isRegion ? 0 : 24);
    const maxRight = size.width - PANEL_WIDTH - GAP * 2;
    let left = guessXY && guessXY[0] > ax ? ax - CALLOUT_GAP - CALLOUT_W : ax + CALLOUT_GAP;
    if (left + CALLOUT_W > maxRight) left = ax - CALLOUT_GAP - CALLOUT_W;
    if (left < GAP) left = ax + CALLOUT_GAP;
    const top = Math.min(
      Math.max(ay - CALLOUT_ABOVE, promptHeight + GAP * 2),
      size.height - 64 - CALLOUT_H,
    );
    callout = {
      left,
      top,
      pointerY: Math.min(Math.max(ay - top, 20), CALLOUT_H - 20),
      toRight: left > ax,
    };
  }

  // Ko sta klik in pravilna točka blizu skupaj, se oznake ne smejo prekrivati.
  // Oznaka odgovora gre pod točko, če bi sicer pokrila tvojo buciko.
  const pinBox = guessXY ? around(guessXY[0], guessXY[1] - 24, 10, 24) : null;
  const aboveTop = labelXY ? labelXY[1] - labelLift - 38 : 0;
  const labelBelow = Boolean(
    !callout && labelXY && pinBox && overlaps(pinBox, around(labelXY[0], aboveTop, 95, 38)),
  );
  const labelTop =
    labelXY && guessXY && labelBelow ? Math.max(labelXY[1] + 10, guessXY[1] + 6) : aboveTop;
  const labelBox: Box | null = callout
    ? [callout.left, callout.top, callout.left + CALLOUT_W, callout.top + CALLOUT_H]
    : labelXY
      ? around(labelXY[0], labelTop, 95, 38)
      : null;
  const answerPinBox = answerXY && !isRegion ? around(answerXY[0], answerXY[1] - 30, 12, 30) : null;
  const tagFits = (x: number, top: number) =>
    ![labelBox, answerPinBox].some((b) => b && overlaps(around(x, top, 50, 28), b));
  const tagBelowFits = Boolean(guessXY && tagFits(guessXY[0], guessXY[1] + 8));
  const tagAboveFits = Boolean(guessXY && tagFits(guessXY[0], guessXY[1] - 58));
  const guessTagBelow = tagBelowFits || !tagAboveFits;
  const showGuessTag = tagBelowFits || tagAboveFits;
  const confettiAt = reveal?.celebrate ? (isRegion ? guessXY : answerXY) : null;
  const homeXY = !reveal && homeAt ? toScreen(homeAt) : null;
  // Imena morij pokažemo šele, ko je zanje dovolj prostora (na telefonu po povečavi)
  const showSeas = Boolean(scaleBar && scaleBar.px / scaleBar.km >= 0.11);
  const atHome = Math.abs(view.k - 1) < 0.01 && Math.abs(view.x) < 2 && Math.abs(view.y) < 2;
  // Med prikazom rezultata gumbi ne smejo biti pod ploščo ali spodnjim listom
  const controlsShift: React.CSSProperties | undefined = reveal
    ? wide
      ? { right: PANEL_WIDTH + GAP * 2 }
      : { bottom: resultHeight + 12 }
    : undefined;

  // Razlika med trenutnim pogledom in tistim, s katerim je osnovni zemljevid izrisan
  const stretch = view.k / committed.k;
  const baseStyle: React.CSSProperties = {
    transform: `translate(${view.x - stretch * committed.x}px, ${view.y - stretch * committed.y}px) scale(${stretch})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return (
    <div
      ref={wrapRef}
      className="map-sea relative h-full w-full overflow-hidden"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* Osnovni zemljevid je v svoji plasti, da se ob vsakem premiku miške ne riše znova */}
      {projection && (
        <svg
          width={size.width}
          height={size.height}
          className="pointer-events-none absolute top-0 left-0"
          style={baseStyle}
          aria-hidden
        >
          <g transform={committed.toString()}>
            {gridLayer}
            {haloLayer}
            <g transform={`translate(0 ${3 / committed.k})`}>{shadowLayer}</g>
            {landLayer}
            {homeShape && <path d={homeShape.d} className="map-home" />}
            {regionShapes.length > 0 && (
              <>
                {/* Ostale države potemnimo, da regija bolj izstopa */}
                <rect
                  x={-size.width}
                  y={-size.height}
                  width={size.width * 3}
                  height={size.height * 3}
                  className="map-dim"
                />
                {regionShapes.map((s) => (
                  <path key={`hit-${s.id}`} d={s.d} className="map-region" />
                ))}
              </>
            )}
          </g>
        </svg>
      )}

      {projection && (
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className={`absolute top-0 left-0 block select-none ${reveal ? "cursor-grab" : "cursor-crosshair"}`}
          onPointerMove={handleMove}
          onPointerLeave={() => setCursor(null)}
          onClick={handleClick}
          role="img"
          aria-label="Zemljevid Evrope. Klikni na mesto, kjer je po tvojem mnenju odgovor."
        >
          {hovered && (
            <g transform={view.toString()} className="pointer-events-none">
              <path d={hovered.d} className="map-hover-country" />
            </g>
          )}

          {hoverLines && cursor && (
            <g className="pointer-events-none">
              <path d={hoverLines.meridian} className="map-hover-line" />
              <path d={hoverLines.parallel} className="map-hover-line" />
              <circle
                cx={cursor.x}
                cy={cursor.y}
                r={4.5}
                className="fill-[var(--accent)] stroke-white"
                strokeWidth={2}
              />
            </g>
          )}

          <g className="pointer-events-none">
            {arc && (
              <path d={arc} pathLength={1} className="map-arc" style={{ stroke: reveal!.tierColor }} />
            )}

            {answerXY && isRegion && reveal?.distanceLabel && (
              <circle
                cx={answerXY[0]}
                cy={answerXY[1]}
                r={5}
                className="map-pop fill-[var(--accent)] stroke-white"
                strokeWidth={2}
                style={{ animationDelay: "0.55s" }}
              />
            )}

            {guessXY && <Pin x={guessXY[0]} y={guessXY[1]} color="var(--ink)" scale={0.9} />}

            {answerXY && !isRegion && (
              <Pin x={answerXY[0]} y={answerXY[1]} color="var(--accent)" scale={1.15} delay={0.5} pulse />
            )}
          </g>
        </svg>
      )}

      {showSeas &&
        SEAS.map((sea) => {
          const xy = toScreen(sea.at);
          return xy ? (
            <span
              key={sea.name}
              className="map-sea-label pointer-events-none absolute top-0 left-0"
              style={{ transform: `translate(${xy[0]}px, ${xy[1]}px) translate(-50%, -50%)` }}
            >
              {sea.name}
            </span>
          ) : null;
        })}

      {homeXY && (
        <span
          className="pointer-events-none absolute top-0 left-0 rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold text-ink shadow-[0_2px_6px_-3px_rgba(13,14,17,0.4)]"
          style={{ transform: `translate(${homeXY[0]}px, ${homeXY[1] + 9}px) translate(-50%, 0)` }}
        >
          Slovenija
        </span>
      )}

      {confettiAt && <Confetti x={confettiAt[0]} y={confettiAt[1]} />}

      {reveal && callout && (
        <div
          className="pointer-events-none absolute top-0 left-0"
          style={{ transform: `translate(${callout.left}px, ${callout.top}px)`, width: CALLOUT_W }}
        >
          <div className="map-callout relative rounded-2xl border border-line bg-surface p-4 shadow-[0_18px_40px_-18px_rgba(13,14,17,0.45)]">
            <span
              className="absolute h-3.5 w-3.5 rotate-45 border-line bg-surface"
              style={
                callout.toRight
                  ? { left: -7.5, top: callout.pointerY - 7, borderLeftWidth: 1, borderBottomWidth: 1 }
                  : { right: -7.5, top: callout.pointerY - 7, borderTopWidth: 1, borderRightWidth: 1 }
              }
            />
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[18px] leading-none font-bold tracking-[-0.02em] text-ink">
                {reveal.label}
              </span>
              {reveal.distanceLabel && !distanceOnLine && (
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[12px] text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: reveal.tierColor }} />
                  {reveal.distanceLabel}
                </span>
              )}
            </div>
            <p
              className="eyebrow mt-3.5"
              style={{ color: "color-mix(in oklab, var(--accent) 60%, black)" }}
            >
              Ali veš?
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{reveal.fact}</p>
            <p className="mt-2.5 text-[11.5px] font-medium text-ink-soft">{reveal.curriculum}</p>
          </div>
        </div>
      )}

      {/* Oznake so v HTML, ker je tipografija tako lepša in ostro izrisana */}
      {reveal && labelXY && !callout && (
        <MapTag
          x={labelXY[0]}
          y={labelBelow ? labelTop : labelXY[1] - labelLift}
          below={labelBelow}
          delay={0.6}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">{reveal.label}</span>
          {reveal.distanceLabel && !distanceOnLine && (
            <span className="flex items-center gap-1.5 border-l border-line pl-2 font-mono text-[12px] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: reveal.tierColor }} />
              {reveal.distanceLabel}
            </span>
          )}
        </MapTag>
      )}

      {distanceOnLine && midXY && (
        <MapTag x={midXY[0]} y={midXY[1] + 12} delay={0.75} small below>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: reveal!.tierColor }} />
          <span className="font-mono text-[12px]">{reveal!.distanceLabel}</span>
        </MapTag>
      )}

      {reveal && guessXY && showGuessTag && (
        <MapTag
          x={guessXY[0]}
          y={guessXY[1] + (guessTagBelow ? 8 : -30)}
          delay={0.1}
          small
          below={guessTagBelow}
        >
          <span className="text-[12px] font-medium text-ink-soft">Tvoj odgovor</span>
        </MapTag>
      )}

      <div
        className="absolute right-3 bottom-3 flex items-end gap-2 sm:right-4 sm:bottom-4"
        style={controlsShift}
      >
        {!atHome && (
          <button type="button" onClick={resetView} className="map-control h-9 px-3 text-[12.5px] font-semibold">
            Cela Evropa
          </button>
        )}
        <div className="map-control flex flex-col overflow-hidden">
          <button type="button" aria-label="Povečaj" onClick={() => zoomBy(1.7)} className="map-zoom-btn">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Pomanjšaj"
            onClick={() => zoomBy(1 / 1.7)}
            disabled={view.k <= (wide ? MIN_ZOOM : NARROW_MIN_ZOOM) + 0.001}
            className="map-zoom-btn border-t border-line"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
              <path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-3 left-3 hidden items-center gap-3 sm:bottom-4 sm:left-4 sm:flex"
        style={!wide && reveal ? { bottom: resultHeight + 12 } : undefined}
      >
        {scaleBar && (
          <div className="map-control flex flex-col gap-1 px-3 py-1.5 font-mono text-[11px] text-ink-soft">
            <span>{scaleBar.km} km</span>
            <span className="block h-1.5 border-x border-b border-ink-soft" style={{ width: scaleBar.px }} />
          </div>
        )}
        <div className="map-control flex h-[42px] items-center gap-2.5 px-3 font-mono text-[11.5px] text-ink-soft">
          {cursor ? (
            <>
              <span>{formatLat(cursor.at[1])}</span>
              <span className="h-3 w-px bg-line" />
              <span>{formatLon(cursor.at[0])}</span>
            </>
          ) : (
            <span className="font-sans text-[12px] text-muted">
              {reveal ? (
                "Zemljevid lahko premikaš in povečuješ"
              ) : (
                <>
                  <span className="pointer-coarse:hidden">Za povečavo uporabi kolešček ali gumb +</span>
                  <span className="hidden pointer-coarse:inline">Za povečavo razmakni prsta</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Pin({
  x,
  y,
  color,
  scale = 1,
  delay = 0,
  pulse,
}: {
  x: number;
  y: number;
  color: string;
  scale?: number;
  delay?: number;
  pulse?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {pulse && <circle r={18} className="map-pulse" style={{ fill: color }} />}
      <ellipse rx={5 * scale} ry={2 * scale} fill="rgba(13,14,17,0.25)" />
      <g className="map-drop" style={{ animationDelay: `${delay}s` }}>
        <path d={PIN_PATH} transform={`scale(${scale})`} style={{ fill: color }} stroke="#fff" strokeWidth={2 / scale} />
        <circle cy={-17 * scale} r={3.4 * scale} fill="#fff" />
      </g>
    </g>
  );
}

const CONFETTI_COLORS = ["var(--mesto)", "var(--regija)", "var(--zgodovina)", "var(--t1)", "var(--t2)"];

function Confetti({ x, y }: { x: number; y: number }) {
  return (
    <div className="pointer-events-none absolute top-0 left-0" style={{ transform: `translate(${x}px, ${y - 18}px)` }}>
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 42 + (i % 3) * 18;
        return (
          <span
            key={i}
            className="map-confetti"
            style={
              {
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist - 12}px`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                borderRadius: i % 2 ? "999px" : "2px",
                animationDelay: `${1.1 + (i % 4) * 0.03}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function MapTag({
  x,
  y,
  delay,
  small,
  below,
  children,
}: {
  x: number;
  y: number;
  delay: number;
  small?: boolean;
  below?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0"
      style={{ transform: `translate(${x}px, ${y}px) translate(-50%, ${below ? "0" : "-100%"})` }}
    >
      <div
        className={`map-tag flex items-center gap-2 rounded-lg border border-line bg-surface whitespace-nowrap text-ink shadow-[0_6px_18px_-8px_rgba(13,14,17,0.35)] ${small ? "px-2 py-1" : "px-3 py-1.5"}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}
