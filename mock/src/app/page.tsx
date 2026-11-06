import Link from "next/link";
import { ArrowIcon, KindIcon } from "@/components/icons";
import Logo from "@/components/Logo";
import MapPreview from "@/components/MapPreview";
import { distanceKm, formatKm, MAX_POINTS, pointsFor, TIERS, tierColor, tierFor, type LonLat } from "@/lib/geo";
import { KINDS, QUESTIONS, type QuestionKind } from "@/lib/questions";

const tint = (color: string, amount = 12) => `color-mix(in oklab, ${color} ${amount}%, white)`;
const shade = (color: string) => `color-mix(in oklab, ${color} 60%, black)`;

// Izmišljena odigrana igra, samo za predogled na uvodni strani
const SAMPLE: { kind: QuestionKind; prompt: string; answer: string; at: LonLat; guess: LonLat; regionIds?: string[] }[] = [
  { kind: "mesto", prompt: "Glavno mesto Španije", answer: "Madrid", at: [-3.7038, 40.4168], guess: [-5.0, 39.0] },
  { kind: "regija", prompt: "Kje je Skandinavija?", answer: "Skandinavija", at: [15.5, 63.5], guess: [14.6, 60.4], regionIds: ["578", "752", "208"] },
  { kind: "zgodovina", prompt: "Kje se je začela francoska revolucija?", answer: "Pariz", at: [2.3522, 48.8566], guess: [4.6, 47.4] },
];

const sampleRows = SAMPLE.map((s) => {
  const km = s.regionIds ? 0 : distanceKm(s.guess, s.at);
  const tier = tierFor(km);
  return { ...s, km, points: pointsFor(km), tier: s.regionIds ? { ...tier, label: "Zadetek" } : tier };
});
const sampleTotal = sampleRows.reduce((sum, r) => sum + r.points, 0);

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <span className="rounded-md border border-line px-2.5 py-1 text-[12px] font-medium text-ink-soft">
            Delovna različica
          </span>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-12 pb-10 text-center sm:px-8 lg:pt-16">
          <p className="eyebrow rise">Geografija in zgodovina, od 7. do 9. razreda</p>
          <h1 className="rise mt-4 text-[clamp(44px,7vw,64px)] leading-none font-bold tracking-[-0.045em] text-ink">
            Meridiani
          </h1>
          <p className="rise mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            Učna igra na zemljevidu Evrope. Preberi nalogo, klikni na zemljevid in takoj vidiš, kako
            blizu je bil tvoj odgovor.
          </p>
          <div className="rise mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/igra" className="btn-primary">
              Začni igro
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
          <div className="rise grid overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-40px_rgba(13,14,17,0.35)] lg:grid-cols-[1.25fr_1fr]">
            <div className="border-b border-line lg:border-r lg:border-b-0">
              <MapPreview
                marks={SAMPLE.map((s) => ({
                  at: s.at,
                  guess: s.guess,
                  label: s.answer,
                  color: KINDS[s.kind].color,
                  regionIds: s.regionIds,
                }))}
              />
            </div>

            <div className="flex flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Primer odigrane igre</p>
                <span className="font-mono text-[12px] text-muted">3 / 3</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-[44px] leading-none font-bold tracking-[-0.04em] text-ink">
                  {sampleTotal}
                </span>
                <span className="text-[14px] text-muted">od {QUESTIONS.length * MAX_POINTS} točk</span>
              </div>

              <ul className="mt-6 mb-5 flex flex-col gap-2.5">
                {sampleRows.map((r) => {
                  const color = tierColor(r.tier.id);
                  const kind = KINDS[r.kind];
                  return (
                    <li key={r.kind} className="rounded-xl border border-line p-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{ color: kind.color, background: tint(kind.color, 12) }}
                        >
                          <KindIcon kind={r.kind} className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                            {r.prompt}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {r.answer}, {r.regionIds ? "znotraj regije" : formatKm(r.km)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[17px] leading-none font-bold" style={{ color: shade(color) }}>
                            {r.points}
                          </p>
                          <p className="mt-1 text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: shade(color) }}>
                            {r.tier.label}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-paper">
                        <div className="h-full rounded-full" style={{ width: `${(r.points / MAX_POINTS) * 100}%`, background: color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4">
                {TIERS.map((t) => (
                  <span key={t.id} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                    <span className="h-2 w-2 rounded-full" style={{ background: tierColor(t.id) }} />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-muted sm:px-8">
          <span>Meridiani, šolski projekt</span>
          <span>Podatki zemljevida: Natural Earth</span>
        </div>
      </footer>
    </div>
  );
}
