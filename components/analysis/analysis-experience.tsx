"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RuntimeStatus } from "@/lib/types";
import { useAnalysis } from "@/lib/client/use-analysis";
import { BrandForm } from "@/components/analysis/brand-form";
import { RunConsole } from "@/components/analysis/run-console";
import { ReportView } from "@/components/report/report-view";
import { Spinner } from "@/components/marks";

export type MatchInitial = {
  a: string;
  b: string;
  location: string;
  fixture?: string;
  autorun?: boolean;
};

const MEMO_CONTENTS = [
  ["01", "The match index", "One deterministic number with five published weights."],
  ["02", "Blind vs informed", "What a category-only guess missed."],
  ["03", "Taste DNA", "Shared culture and each brand's private taste."],
  ["04", "Where it lives", "City affinity and audience signals."],
  ["05", "Momentum", "Twelve months of relative trend, plotted."],
  ["06", "Cross-domain", "What travels with the pair beyond their category."],
  ["07", "Safety screen", "Regulated categories and value conflicts."],
  ["08", "Three plays", "Place, product and content, each citing probes."],
  ["09", "Risks", "Specific failure modes with design responses."],
  ["10", "Evidence ledger", "Every query, parameter and row count."],
  ["11", "Limits", "What the memo cannot support."],
] as const;

function smoothBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function AnalysisExperience({
  status,
  initial,
}: {
  status: RuntimeStatus;
  initial: MatchInitial;
}) {
  const [a, setA] = useState(initial.a);
  const [b, setB] = useState(initial.b);
  const [location, setLocation] = useState(initial.location);
  const { state, start, stop } = useAnalysis();

  const topRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const autorunRef = useRef(false);
  const previousStatus = useRef(state.status);

  const startRun = useCallback(
    (input: { a: string; b: string; location?: string; fixture?: string; mode?: "demo" }) => {
      void start(input);
    },
    [start],
  );

  const runArchive = useCallback(
    (slug: string) => {
      const fixture = status.fixtures.find((entry) => entry.slug === slug);
      if (!fixture) return;
      setA(fixture.brands[0]);
      setB(fixture.brands[1]);
      setLocation(fixture.location);
      startRun({
        a: fixture.brands[0],
        b: fixture.brands[1],
        location: fixture.location,
        fixture: slug,
        mode: "demo",
      });
    },
    [startRun, status.fixtures],
  );

  const submit = useCallback(
    (fixtureSlug?: string) => {
      const nextA = a.trim();
      const nextB = b.trim();
      if (!nextA || !nextB) return;
      startRun({
        a: nextA,
        b: nextB,
        location: location.trim() || undefined,
        ...(fixtureSlug ? { fixture: fixtureSlug, mode: "demo" as const } : {}),
      });
    },
    [a, b, location, startRun],
  );

  const swap = useCallback(() => {
    setA(b);
    setB(a);
  }, [a, b]);

  const reset = useCallback(() => {
    stop();
    topRef.current?.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
  }, [stop]);

  // Deep links: /match?fixture=…&autorun=1 prefills and starts the replay once.
  useEffect(() => {
    if (!initial.autorun || autorunRef.current) return;
    if (!initial.a || !initial.b) return;
    autorunRef.current = true;
    startRun({
      a: initial.a,
      b: initial.b,
      location: initial.location || undefined,
      ...(initial.fixture ? { fixture: initial.fixture, mode: "demo" as const } : {}),
    });
  }, [initial, startRun]);

  // On small screens the desk sits below the form; bring it into view on start.
  useEffect(() => {
    const was = previousStatus.current;
    previousStatus.current = state.status;
    if (was !== "running" && state.status === "running") {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        window.setTimeout(() => {
          consoleRef.current?.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
        }, 60);
      }
    }
    if (state.status === "done") {
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
      }, 80);
    }
  }, [state.status]);

  const finished = state.status === "done" && state.report;
  const active = state.status === "running" || state.status === "error" || finished;
  const completed = Object.values(state.stages).filter(
    (stage) => stage.status === "done",
  ).length;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26.5rem)_minmax(0,1fr)]">
        <BrandForm
          status={status}
          a={a}
          b={b}
          location={location}
          running={state.status === "running"}
          onA={setA}
          onB={setB}
          onLocation={setLocation}
          onSwap={swap}
          onSubmit={submit}
          onArchive={runArchive}
        />

        {active ? (
          <div ref={consoleRef} className="scroll-mt-24 space-y-4">
            <RunConsole
              key={state.startedAt ?? "run"}
              state={state}
              onStop={reset}
            />

            {state.error ? (
              <div role="alert" className="border border-orange bg-orange-soft">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange/30 px-5 py-3">
                  <p className="label text-ink">Run stopped · {state.error.code}</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-2 underline-offset-4 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="px-5 py-5">
                  <p className="font-display text-xl leading-snug">{state.error.message}</p>
                  {state.error.recovery ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">
                      {state.error.recovery}
                    </p>
                  ) : null}
                  <p className="mt-4 label text-ink-3">Recover with the archive</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {status.fixtures.map((fixture) => (
                      <button
                        key={fixture.slug}
                        type="button"
                        onClick={() => runArchive(fixture.slug)}
                        className="border border-ink bg-paper-2 px-2.5 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] transition-colors hover:bg-lime"
                      >
                        {fixture.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {state.status === "running" ? (
              <div className="border border-line bg-paper-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="label text-ink-3">Memo in progress</p>
                  <span className="flex items-center gap-2 font-mono text-[0.55rem] tabular text-ink-3">
                    <Spinner className="h-3 w-3" />
                    {completed}/{Object.keys(state.stages).length} stages cleared
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  The critic clears the memo before it appears here. Every section will cite its
                  probes, and the ledger keeps the full query trail.
                </p>
                <div className="mt-4 space-y-1.5" aria-hidden>
                  <div className="shimmer h-2 w-3/4" />
                  <div className="shimmer h-2 w-1/2" />
                  <div className="shimmer h-2 w-2/3" />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <aside className="border border-line bg-paper-2">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3.5">
              <p className="label text-ink-3">Inside every memo</p>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
                11 sections
              </span>
            </div>
            <ol className="px-5 py-2">
              {MEMO_CONTENTS.map(([index, title, note]) => (
                <li
                  key={index}
                  className="flex gap-3 border-b border-line/70 py-2.5 last:border-0"
                >
                  <span className="font-mono text-[0.58rem] tabular text-ink-3">{index}</span>
                  <div>
                    <p className="text-sm text-ink">{title}</p>
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-3">{note}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-line px-5 py-3 text-[0.7rem] leading-relaxed text-ink-3">
              A run takes seconds. The archive replays in about three. No revenue, ROI or
              audience-size estimates are produced in either mode.
            </p>
          </aside>
        )}
      </div>

      {finished ? (
        <div ref={reportRef} className="scroll-mt-20 pt-8">
          <ReportView report={state.report!} onRunAgain={reset} className="shadow-lift" />
        </div>
      ) : null}
    </div>
  );
}
