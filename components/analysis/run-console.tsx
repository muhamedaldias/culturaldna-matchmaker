"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/types";
import { STAGE_AGENTS, type RunState, type StageStatus } from "@/lib/client/use-analysis";
import { ModeBadge } from "@/components/mode-badge";
import { formatClock, formatDuration } from "@/lib/format";

const RAIL: AgentId[] = ["orchestrator", ...STAGE_AGENTS];

function StageDot({ status }: { status: StageStatus }) {
  const shared = "h-2 w-2 shrink-0";
  if (status === "running") return <span aria-hidden className={`${shared} blink bg-lime`} />;
  if (status === "done") return <span aria-hidden className={`${shared} bg-lime`} />;
  if (status === "warn") return <span aria-hidden className={`${shared} bg-orange`} />;
  if (status === "error") return <span aria-hidden className={`${shared} bg-orange`} />;
  return <span aria-hidden className={`${shared} border border-paper-2/30`} />;
}

function ProviderChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.52rem] uppercase leading-none tracking-[0.12em] ${
        on
          ? "border-paper-2/30 bg-paper-2/5 text-paper-2/90"
          : "border-paper-2/15 text-paper-2/40"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 ${on ? "bg-lime" : "bg-paper-2/25"}`} />
      {label} {on ? "on" : "off"}
    </span>
  );
}

export function RunConsole({ state, onStop }: { state: RunState; onStop: () => void }) {
  const [tab, setTab] = useState<"trace" | "evidence">("trace");
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "running") return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [state.status]);

  const elapsed =
    state.status === "done" && state.report
      ? state.report.timings.totalMs
      : state.startedAt
        ? Math.max(0, now - state.startedAt)
        : 0;

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [state.traces.length, state.evidence.length, tab]);

  const runningStage = RAIL.map((agent) => state.stages[agent]).find(
    (stage) => stage.status === "running",
  );
  const announcement =
    state.status === "running"
      ? (runningStage?.label ?? "Working")
      : state.status === "done"
        ? "Memo ready."
        : "Run stopped.";

  return (
    <section
      aria-labelledby="desk-title"
      className="flex flex-col border border-ink bg-ink text-paper-2"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-2/15 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-2 w-2 bg-lime" />
          <h2 id="desk-title" className="label text-paper-2/70">
            Investigation desk
          </h2>
          <span className="hidden font-mono text-[0.55rem] uppercase tracking-[0.12em] text-paper-2/35 sm:inline">
            {state.status === "running"
              ? "in session"
              : state.status === "done"
                ? "filed"
                : "halted"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ProviderChip label="Qloo" on={state.providers.qloo} />
          <ProviderChip label="Gemini" on={state.providers.gemini} />
          {state.mode ? <ModeBadge mode={state.mode} tone="dark" /> : null}
        </div>
      </header>

      <div className="grid lg:grid-cols-[252px_minmax(0,1fr)]">
        <div className="border-b border-paper-2/15 lg:border-b-0 lg:border-r">
          <p className="hidden px-4 pb-2 pt-3 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-paper-2/35 lg:block">
            Chain of agents
          </p>
          <ul className="grid grid-cols-2 gap-px bg-paper-2/10 lg:grid-cols-1">
            {RAIL.map((agent, index) => {
              const stage = state.stages[agent];
              return (
                <li
                  key={agent}
                  aria-label={`${stage.label}: ${stage.status}`}
                  className={`flex items-center gap-2.5 bg-ink px-3 py-2.5 ${
                    stage.status === "pending" ? "text-paper-2/40" : "text-paper-2/90"
                  }`}
                >
                  <span className="font-mono text-[0.52rem] tabular text-paper-2/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <StageDot status={stage.status} />
                  <span className="truncate text-[0.72rem] leading-snug">{stage.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col">
          <div
            role="tablist"
            aria-label="Run detail"
            className="flex items-center gap-0 border-b border-paper-2/15"
          >
            {(
              [
                ["trace", "Trace", state.traces.length],
                ["evidence", "Evidence", state.evidence.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`desk-tab-${key}`}
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] transition-colors ${
                  tab === key
                    ? "border-lime text-paper-2"
                    : "border-transparent text-paper-2/45 hover:text-paper-2/80"
                }`}
              >
                {label}
                <span className="tabular text-paper-2/40">{String(count).padStart(2, "0")}</span>
              </button>
            ))}
            {state.status === "running" ? (
              <span className="ml-auto flex items-center gap-2 px-4 font-mono text-[0.58rem] tabular text-paper-2/60">
                <span className="blink h-1.5 w-1.5 bg-orange" />
                {formatDuration(elapsed)}
              </span>
            ) : state.status === "done" ? (
              <span className="ml-auto px-4 font-mono text-[0.58rem] tabular text-paper-2/45">
                {formatDuration(elapsed)}
              </span>
            ) : null}
          </div>

          <div
            role="tabpanel"
            id={`desk-panel-${tab}`}
            aria-labelledby={`desk-tab-${tab}`}
            ref={listRef}
            className="h-[300px] overflow-y-auto sm:h-[330px] lg:h-[342px]"
          >
            {tab === "trace" ? (
              state.traces.length > 0 ? (
                <ul className="divide-y divide-paper-2/10">
                  {state.traces.map((entry) => (
                    <li key={entry.id} className="px-4 py-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[0.52rem] tabular text-paper-2/35">
                          {formatClock(entry.at)}
                        </span>
                        <span className="font-mono text-[0.52rem] uppercase tracking-[0.12em] text-lime/75">
                          {entry.agent}
                        </span>
                        {entry.durationMs !== undefined ? (
                          <span className="ml-auto font-mono text-[0.52rem] tabular text-paper-2/35">
                            {formatDuration(entry.durationMs)}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          entry.status === "warn"
                            ? "text-orange-soft"
                            : entry.status === "error"
                              ? "text-orange"
                              : "text-paper-2/85"
                        }`}
                      >
                        {entry.message}
                      </p>
                      {entry.detail ? (
                        <p className="mt-0.5 text-[0.68rem] leading-relaxed text-paper-2/45">
                          {entry.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-xs text-paper-2/40">
                  Waiting for the first signal.
                </p>
              )
            ) : state.evidence.length > 0 ? (
              <ul className="divide-y divide-paper-2/10">
                {state.evidence.map((probe) => (
                  <li key={probe.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[0.52rem] text-lime/75">{probe.id}</span>
                      <span className="font-mono text-[0.52rem] tabular text-paper-2/35">
                        {formatDuration(probe.durationMs)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-paper-2/85">{probe.label}</p>
                    <p className="mt-0.5 font-mono text-[0.55rem] leading-relaxed text-paper-2/40">
                      {probe.endpoint} · {probe.resultCount} rows
                      {probe.selectedBy === "model" ? " · model-selected" : ""}
                      {probe.mode === "demo" ? " · archive" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-xs text-paper-2/40">
                No probes logged yet. Every query that runs will be listed here.
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-paper-2/15 px-4 py-2.5">
        <p className="max-w-[60ch] text-[0.65rem] leading-relaxed text-paper-2/40">
          {state.mode === "demo"
            ? "Archive replay · no external calls made. Evidence is illustrative, not live Qloo output."
            : state.providers.gemini
              ? "Live run · Qloo taste graph and Gemini narration, streamed from the server."
              : "Live Qloo · Gemini is not configured, so the memo is written deterministically."}
        </p>
        {state.status === "running" ? (
          <button
            type="button"
            onClick={onStop}
            className="border border-paper-2/25 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-paper-2/75 transition-colors hover:border-orange hover:bg-orange hover:text-ink"
          >
            Stop run
          </button>
        ) : null}
      </footer>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
