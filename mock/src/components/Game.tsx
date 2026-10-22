"use client";

import { geoContains } from "d3-geo";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EuropeMap, { type MapReveal } from "./EuropeMap";
import { ArrowIcon, KindIcon } from "./icons";
import Logo from "./Logo";
import {
  distanceKm,
  formatKm,
  MAX_POINTS,
  nearestOnBoundary,
  pointsFor,
  tierColor,
  tierFor,
  tockLabel,
  type LonLat,
} from "@/lib/geo";
import { countries, countriesById } from "@/lib/map-data";
import { motionMs } from "@/lib/motion";
import { KINDS, QUESTIONS, type Question } from "@/lib/questions";

type Result = {
  guess: LonLat;
  km: number;
  // Razdalja, po kateri določimo barvo in oznako natančnosti
  tierKm: number;
  inside: boolean;
  // Točka, s katero smo primerjali klik (mesto ali najbližja točka na meji regije)
  compareTo: LonLat;
  points: number;
};

function evaluate(q: Question, guess: LonLat): Result {
  if (q.kind === "regija") {
    const region = q.countryIds.flatMap((id) => countriesById.get(id) ?? []);
    const { point, km } = nearestOnBoundary(guess, region);
    // Obala je v podatkih 50m poenostavljena, zato klik v morje tik ob obali regije še šteje
    const onOtherLand = countries.some(
      (c) => !q.countryIds.includes(String(c.id)) && geoContains(c, guess),
    );
    if (region.some((f) => geoContains(f, guess)) || (km <= 8 && !onOtherLand)) {
      return { guess, km: 0, tierKm: 0, inside: true, compareTo: guess, points: MAX_POINTS };
    }
    // Klik tik ob meji še ni zadetek, zato je pri regijah točkovanje malo strožje
    const strictKm = km + 50;
    return { guess, km, tierKm: strictKm, inside: false, compareTo: point, points: pointsFor(strictKm) };
  }
  const km = distanceKm(guess, q.target);
  return { guess, km, tierKm: km, inside: false, compareTo: q.target, points: pointsFor(km) };
}

function tierOf(r: Result) {
  const tier = tierFor(r.tierKm);
  return r.inside ? { ...tier, label: "Zadetek" } : tier;
}

const tint = (color: string, amount = 12) => `color-mix(in oklab, ${color} ${amount}%, white)`;
const shade = (color: string) => `color-mix(in oklab, ${color} 60%, black)`;
const INTRO_MS = 2600;

function useCountUp(value: number, from = value, duration = 800) {
  const [shown, setShown] = useState(from);
  const shownRef = useRef(from);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    const ms = motionMs(duration);
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const t = ms ? Math.min(1, (now - t0) / ms) : 1;
      const v = Math.round(start + (value - start) * (1 - (1 - t) ** 3));
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return shown;
}

export default function Game() {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [promptRef, promptHeight] = useHeight();
  const [resultRef, resultHeight] = useHeight();

  const finished = round >= QUESTIONS.length;
  const question = QUESTIONS[Math.min(round, QUESTIONS.length - 1)];
  const result = results[round] ?? null;
  const total = results.reduce((sum, r) => sum + r.points, 0);

  const reveal = useMemo<MapReveal | null>(() => {
    if (!result) return null;
    const tier = tierOf(result);
    const showLine = !result.inside && result.km > 30;
    return {
      guess: result.guess,
      answer: result.compareTo,
      label: question.answer,
      labelAt: question.kind === "regija" ? question.labelAt : question.target,
      regionIds: question.kind === "regija" ? question.countryIds : undefined,
      distanceLabel: showLine ? formatKm(result.km) : undefined,
      tierColor: tierColor(tier.id),
      celebrate: tier.id === "t1",
      fact: question.fact,
      curriculum: question.curriculum,
    };
  }, [result, question]);

  // Naloga se najprej pokaže velika na sredini, da jo učenec v miru prebere
  const [introSeen, setIntroSeen] = useState<string | null>(null);
  const intro = !finished && !result && introSeen !== question.id;

  useEffect(() => {
    if (!intro) return;
    const id = window.setTimeout(() => setIntroSeen(question.id), INTRO_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      setIntroSeen(question.id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [intro, question.id]);

  function handleGuess(guess: LonLat) {
    setResults((prev) => (prev.length > round ? prev : [...prev, evaluate(question, guess)]));
  }

  function restart() {
    setRound(0);
    setResults([]);
  }

  return (
    <div className="flex h-dvh flex-col">
      <GameHeader round={round} results={results} total={total} finished={finished} />

      {finished ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Summary results={results} total={total} onRestart={restart} />
        </div>
      ) : (
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <EuropeMap
              accent={KINDS[question.kind].color}
              reveal={reveal}
              viewKey={question.id}
              promptHeight={promptHeight}
              resultHeight={resultHeight}
              onGuess={handleGuess}
            />
          </div>

          <div
            className={`intro-backdrop absolute inset-0 z-10 ${intro ? "" : "pointer-events-none opacity-0"}`}
            onClick={() => setIntroSeen(question.id)}
          />

          {/* Kartici plavata nad zemljevidom, da je naloga del igre in ne ločen stolpec */}
          <PromptCard
            ref={promptRef}
            key={question.id}
            question={question}
            round={round}
            intro={intro}
            answered={Boolean(result)}
          />
          {result && (
            <ResultCard
              ref={resultRef}
              key={`r-${question.id}`}
              question={question}
              result={result}
              total={total}
              isLast={round === QUESTIONS.length - 1}
              onNext={() => setRound((r) => r + 1)}
            />
          )}
        </main>
      )}
    </div>
  );
}

// Višina elementa, ki se sproti posodablja (kartice imajo različno dolga besedila)
function useHeight() {
  const [height, setHeight] = useState(0);
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(Math.round(el.offsetHeight)));
    ro.observe(el);
    return () => {
      ro.disconnect();
      setHeight(0);
    };
  }, []);
  return [ref, height] as const;
}

function GameHeader({
  round,
  results,
  total,
  finished,
}: {
  round: number;
  results: Result[];
  total: number;
  finished: boolean;
}) {
  const shown = useCountUp(total);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-4 sm:px-6">
      <Link href="/" aria-label="Na začetno stran" className="shrink-0">
        <Logo />
      </Link>

      <div className="mx-auto hidden items-center gap-4 sm:flex">
        <span className="eyebrow">
          {finished ? "Konec igre" : `Naloga ${round + 1} od ${QUESTIONS.length}`}
        </span>
        <div className="flex gap-1.5">
          {QUESTIONS.map((q, i) => {
            const done = i < results.length;
            const current = i === round && !finished;
            return (
              <span
                key={q.id}
                className="h-1.5 w-10 rounded-full transition-colors duration-500"
                style={{
                  background: done ? KINDS[q.kind].color : current ? "var(--ink)" : "var(--line)",
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5 sm:ml-0">
        <span className="eyebrow">Točke</span>
        <span className="min-w-[4ch] text-right font-mono text-[18px] font-semibold tabular-nums text-ink">
          {shown}
        </span>
      </div>
    </header>
  );
}

function KindPill({ kind }: { kind: Question["kind"] }) {
  const meta = KINDS[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md py-1 pr-2.5 pl-2 text-[12.5px] font-semibold"
      style={{ color: shade(meta.color), background: tint(meta.color, 12) }}
    >
      <KindIcon kind={kind} className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function PromptCard({
  ref,
  question,
  round,
  intro,
  answered,
}: {
  ref: React.Ref<HTMLElement>;
  question: Question;
  round: number;
  intro: boolean;
  answered: boolean;
}) {
  const color = KINDS[question.kind].color;
  return (
    <section
      ref={ref}
      data-intro={intro}
      // Na manjših zaslonih se po odgovoru skrije, da ostane dovolj zemljevida (odgovor je v listu spodaj)
      className={`float-card prompt-card absolute z-20 flex gap-3.5 p-3.5 sm:p-4 ${answered ? "is-answered max-lg:hidden" : ""}`}
      style={{ "--accent": color } as React.CSSProperties}
    >
      {intro && <span className="prompt-timer" />}
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ color, background: tint(color, 14) }}
      >
        <KindIcon kind={question.kind} className="h-[22px] w-[22px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: shade(color) }}>
            {KINDS[question.kind].label}
          </span>
          <span className="font-mono text-[11.5px] text-muted">
            {round + 1} / {QUESTIONS.length}
          </span>
        </div>
        <h1 className="mt-1 text-[20px] leading-[1.15] font-bold tracking-[-0.025em] text-balance text-ink sm:text-[22px]">
          {question.prompt}
        </h1>
        <p className="mt-1 text-[13px] leading-snug text-ink-soft">{question.instruction}</p>
      </div>
    </section>
  );
}

function ResultCard({
  ref,
  question,
  result,
  total,
  isLast,
  onNext,
}: {
  ref: React.Ref<HTMLElement>;
  question: Question;
  result: Result;
  total: number;
  isLast: boolean;
  onNext: () => void;
}) {
  const kindColor = KINDS[question.kind].color;
  const tier = tierOf(result);
  const color = tierColor(tier.id);
  const points = useCountUp(result.points, 0, 900);

  useEffect(() => {
    // Enter pelje naprej, razen če je fokus na gumbu ali povezavi, ki Enter obdela sama
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea")) return;
      onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  return (
    <section
      ref={ref}
      // Na telefonu je to spodnji list, na večjem zaslonu plošča desno zgoraj
      className="float-card sheet-in absolute inset-x-0 bottom-0 flex max-h-[48%] flex-col overflow-hidden rounded-b-none sm:mx-auto sm:max-w-[560px] lg:inset-x-auto lg:top-4 lg:right-4 lg:bottom-auto lg:mx-0 lg:max-h-[calc(100%-2rem)] lg:w-[380px] lg:max-w-none lg:rounded-b-2xl"
      aria-live="polite"
    >
      {/* Vsebina se lahko pomika, gumb naprej pa ostane vedno viden */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-4">
        <span className="mx-auto -mt-2 mb-3 block h-1 w-10 rounded-full bg-line lg:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-bold tracking-[0.12em] uppercase"
              style={{ background: tint(color, 16), color: shade(color) }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {tier.label}
            </span>
            <p className="mt-3 text-[28px] leading-none font-bold tracking-[-0.03em]" style={{ color: kindColor }}>
              {question.answer}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">Pravilni odgovor</p>
          </div>
          {/* Pridobljene točke so glavna številka kartice */}
          <div className="shrink-0 text-right">
            <p
              className="font-mono text-[40px] leading-none font-bold tracking-[-0.05em] tabular-nums"
              style={{ color: shade(color) }}
            >
              +{points}
            </p>
            <p className="mt-1.5 text-[12px] text-muted">{tockLabel(result.points)}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 divide-x divide-line rounded-xl border border-line">
          <Stat
            label={result.inside ? "Znotraj regije" : question.kind === "regija" ? "Do meje" : "Oddaljenost"}
            value={result.inside ? "0 km" : formatKm(result.km)}
          />
          <Stat label="Skupaj" value={String(total)} />
        </dl>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper">
          <div
            className="meter-fill h-full rounded-full"
            style={{ width: `${(result.points / MAX_POINTS) * 100}%`, background: color }}
          />
        </div>

        {/* Na večjem zaslonu je zanimivost v oblačku ob bucici na zemljevidu */}
        <div className="mt-5 rounded-xl p-4 lg:hidden" style={{ background: tint(kindColor, 6) }}>
          <p className="eyebrow" style={{ color: shade(kindColor) }}>
            Ali veš?
          </p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink">{question.fact}</p>
          <p className="mt-3 text-[12px] font-medium text-ink-soft">{question.curriculum}</p>
        </div>
      </div>

      <div className="border-t border-line px-5 pt-3.5 pb-4 lg:border-0 lg:pt-0 lg:pb-5">
        <button onClick={onNext} className="btn-primary w-full">
          {isLast ? "Poglej rezultat" : "Naslednja naloga"}
          <ArrowIcon className="h-4 w-4" />
        </button>
        <p className="mt-2 hidden text-center text-[12px] text-muted lg:block">ali pritisni Enter</p>
      </div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col-reverse px-3 py-3">
      <dt className="mt-1.5 text-[11px] font-medium text-muted">{label}</dt>
      <dd className="font-mono text-[18px] leading-none font-semibold text-ink" style={{ color }}>
        {value}
      </dd>
    </div>
  );
}

function Summary({
  results,
  total,
  onRestart,
}: {
  results: Result[];
  total: number;
  onRestart: () => void;
}) {
  const max = QUESTIONS.length * MAX_POINTS;
  const shown = useCountUp(total, 0, 1200);
  const share = total / max;
  const message =
    share >= 0.85
      ? "Zemljevid Evrope poznaš zelo dobro."
      : share >= 0.6
        ? "Dober rezultat. Še malo vaje in bo odlično."
        : share >= 0.3
          ? "Solidno. Poskusi še enkrat in izboljšaj rezultat."
          : "Začetek je vedno težak. Poskusi še enkrat.";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rise text-center">
        <p className="eyebrow">Konec igre</p>
        <p className="mt-4 font-mono text-[clamp(64px,10vw,96px)] leading-none font-bold tracking-[-0.04em] text-ink tabular-nums">
          {shown}
        </p>
        <p className="mt-2 text-[15px] text-muted">od {max} točk</p>
        <p className="mt-5 text-[17px] font-medium text-ink-soft">{message}</p>
      </div>

      <div className="rise mx-auto mt-8 max-w-xl">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-line/70">
          {results.map((r, i) => (
            <span
              key={QUESTIONS[i].id}
              className="meter-fill h-full"
              style={{
                width: `${(r.points / max) * 100}%`,
                background: KINDS[QUESTIONS[i].kind].color,
                animationDelay: `${0.2 + i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
          {(Object.keys(KINDS) as Question["kind"][]).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
              <span className="h-2 w-2 rounded-full" style={{ background: KINDS[k].color }} />
              {KINDS[k].plural}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {QUESTIONS.map((q, i) => {
          const r = results[i];
          if (!r) return null;
          const tier = tierOf(r);
          const color = tierColor(tier.id);
          return (
            <article
              key={q.id}
              className="rise flex flex-col rounded-2xl border border-line bg-surface p-5"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <div className="flex items-center justify-between">
                <KindPill kind={q.kind} />
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: shade(color) }}>
                  {tier.label}
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-snug font-semibold tracking-[-0.01em] text-ink">
                {q.prompt}
              </p>
              <p className="mt-1 text-[13.5px] text-ink-soft">{q.answer}</p>
              <div className="mt-auto flex items-end justify-between pt-5">
                <div>
                  <p className="font-mono text-[28px] leading-none font-bold" style={{ color: shade(color) }}>
                    {r.points}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted">{tockLabel(r.points)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[14px] font-semibold text-ink">
                    {r.inside ? "0 km" : formatKm(r.km)}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted">
                    {r.inside ? "znotraj regije" : "oddaljenost"}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper">
                <div
                  className="meter-fill h-full rounded-full"
                  style={{ width: `${(r.points / MAX_POINTS) * 100}%`, background: color }}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={onRestart} className="btn-primary">
          Igraj znova
          <ArrowIcon className="h-4 w-4" />
        </button>
        <Link href="/" className="btn-secondary">
          Na začetek
        </Link>
      </div>
    </main>
  );
}
