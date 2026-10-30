"use client";

import type { FormEvent } from "react";
import type { RuntimeStatus } from "@/lib/types";
import { ArrowRight, Spinner } from "@/components/marks";

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function nameMatches(input: string, canonical: string) {
  if (!input) return false;
  if (input === canonical) return true;
  if (input.length >= 4 && canonical.startsWith(`${input} `)) return true;
  if (canonical.length >= 4 && input.startsWith(`${canonical} `)) return true;
  return false;
}

export function findArchivePair(status: RuntimeStatus, a: string, b: string) {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return undefined;

  return status.fixtures.find((fixture) => {
    const first = normalise(fixture.brands[0]);
    const second = normalise(fixture.brands[1]);
    return (
      (nameMatches(left, first) && nameMatches(right, second)) ||
      (nameMatches(left, second) && nameMatches(right, first))
    );
  });
}

export function BrandForm({
  status,
  a,
  b,
  location,
  running,
  onA,
  onB,
  onLocation,
  onSwap,
  onSubmit,
  onArchive,
}: {
  status: RuntimeStatus;
  a: string;
  b: string;
  location: string;
  running: boolean;
  onA: (value: string) => void;
  onB: (value: string) => void;
  onLocation: (value: string) => void;
  onSwap: () => void;
  onSubmit: (fixtureSlug?: string) => void;
  onArchive: (slug: string) => void;
}) {
  const trimmedA = a.trim();
  const trimmedB = b.trim();
  const archive = findArchivePair(status, trimmedA, trimmedB);
  const sameName = trimmedA.toLowerCase() === trimmedB.toLowerCase();
  const filled = trimmedA.length > 0 && trimmedB.length > 0;
  const previewBlocked = status.mode === "demo" && filled && !archive;
  const canRun = filled && !sameName && !previewBlocked && !running;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRun) return;
    onSubmit(status.mode === "demo" ? archive?.slug : undefined);
  };

  return (
    <section
      aria-labelledby="intake-title"
      className="border border-ink bg-paper-2"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <p className="label text-ink-3">Case intake</p>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-3">
          Two brands · 80 chars each
        </p>
      </header>

      <form onSubmit={handleSubmit} aria-busy={running} className="p-5 sm:p-6">
        <h2 id="intake-title" className="display-3 text-balance">
          Name the pairing.
        </h2>
        <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-2">
          No brief required. The agents resolve both brands, read their taste, and build the
          case from evidence before a single line of prose is written.
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="label text-ink-3">The pair</p>
            <button
              type="button"
              onClick={onSwap}
              disabled={running || (!trimmedA && !trimmedB)}
              className="border border-line-strong bg-paper px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            >
              Swap A / B
            </button>
          </div>

          <div className="mt-3 space-y-4">
            <label className="block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="label text-ink-3">Brand A — first party</span>
                <span className="font-mono text-[0.55rem] tabular text-ink-3">
                  {trimmedA.length}/80
                </span>
              </span>
              <input
                name="a"
                value={a}
                onChange={(event) => onA(event.target.value)}
                placeholder="e.g. Patagonia"
                autoComplete="off"
                spellCheck={false}
                maxLength={80}
                disabled={running}
                className="mt-2 w-full border border-line-strong bg-paper px-3 py-2.5 font-display text-xl text-ink transition-colors placeholder:font-display focus:border-ink disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="label text-ink-3">Brand B — second party</span>
                <span className="font-mono text-[0.55rem] tabular text-ink-3">
                  {trimmedB.length}/80
                </span>
              </span>
              <input
                name="b"
                value={b}
                onChange={(event) => onB(event.target.value)}
                placeholder="e.g. Whole Foods Market"
                autoComplete="off"
                spellCheck={false}
                maxLength={80}
                disabled={running}
                className="mt-2 w-full border border-line-strong bg-paper px-3 py-2.5 font-display text-xl text-ink transition-colors placeholder:font-display focus:border-ink disabled:opacity-60"
              />
            </label>
          </div>

          {status.mode === "live" ? (
            <label className="mt-4 block">
              <span className="label text-ink-3">Location focus</span>
              <input
                name="location"
                value={location}
                onChange={(event) => onLocation(event.target.value)}
                placeholder="Global"
                autoComplete="off"
                maxLength={60}
                disabled={running}
                className="mt-2 w-full border border-line-strong bg-paper px-3 py-2 font-mono text-sm text-ink transition-colors focus:border-ink disabled:opacity-60"
              />
              <span className="mt-1.5 block text-[0.7rem] leading-relaxed text-ink-3">
                A city, region or country. The heatmap and locality score are filtered to it.
                Leave blank for a global read.
              </span>
            </label>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!canRun}
          className="btn btn-primary mt-6 h-12 w-full justify-between px-4"
        >
          <span className="flex items-center gap-2">
            {running ? <Spinner className="h-4 w-4" /> : null}
            {running ? "Investigation in progress" : "Run the match"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-3 min-h-[2.5rem]" aria-live="polite">
          {sameName && filled ? (
            <p className="text-xs leading-relaxed text-orange">
              Pick two different brands — a brand cannot be matched with itself.
            </p>
          ) : previewBlocked ? (
            <p className="text-xs leading-relaxed text-ink-2">
              Preview build: this pair has no archived memo. Replay a curated case below, or add
              a Qloo API key to run it live.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-ink-3">
              {status.mode === "live"
                ? "Qloo probes run server-side; the API key never reaches the browser. Results stream into the desk."
                : "Archive replays are fixed illustrations, clearly labelled. Each case uses the same report contract as a live run."}
            </p>
          )}
        </div>
      </form>

      <div className="border-t border-line bg-paper/60 px-5 py-5 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="label text-ink-3">Or replay a case</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
            One click · fixed evidence
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {status.fixtures.map((fixture) => {
            const active = archive?.slug === fixture.slug;
            return (
              <li key={fixture.slug}>
                <button
                  type="button"
                  onClick={() => onArchive(fixture.slug)}
                  disabled={running}
                  className={`group flex w-full items-center justify-between gap-3 border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                    active
                      ? "border-ink bg-lime/25"
                      : "border-line bg-paper-2 hover:border-ink hover:bg-lime/15"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{fixture.label}</span>
                    <span className="mt-0.5 block font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                      {fixture.location} · {fixture.subtitle}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
