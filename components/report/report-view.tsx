"use client";

import { useState } from "react";
import type { Report } from "@/lib/types";
import { ModeBadge } from "@/components/mode-badge";
import { TIER_META } from "@/lib/scoring";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { ArrowRight, ArrowUpRight } from "@/components/marks";
import {
  BlindSection,
  CaveatsSection,
  CrossDomainSection,
  DnaSection,
  EvidenceSection,
  MomentumSection,
  PlaceSection,
  PlaysSection,
  RisksSection,
  SafetySection,
  ScoreSection,
} from "@/components/report/sections";

export function ReportView({
  report,
  onRunAgain,
  className = "",
}: {
  report: Report;
  onRunAgain?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const { pair, verdict, scores } = report;

  const copySummary = async () => {
    const text = [
      `${pair.a.name} × ${pair.b.name} — CulturalDNA Matchmaker`,
      `Match index ${scores.overall}/100 · ${TIER_META[scores.tier].label} · confidence ${scores.confidence}/100`,
      `Verdict: ${verdict.headline}`,
      `Posture: ${verdict.posture}`,
      "",
      `Shared signals: ${report.dna.shared.slice(0, 6).map((tag) => tag.name).join(", ")}`,
      `Cities: ${report.cities.slice(0, 5).map((city) => city.name).join(", ")}`,
      "",
      ...report.plays.map((play) => `${play.index}. ${play.title} — ${play.city}`),
      "",
      "Affinities are relative Qloo signals, not audience sizes, market share or forecasts.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 2400);
  };

  return (
    <article
      aria-labelledby="memo-title"
      className={`border border-line bg-paper-2 ${className}`}
    >
      <header className="px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label text-ink-3">Deal memo</span>
          <span aria-hidden className="hidden h-px flex-1 bg-line sm:block" />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
            {report.location}
          </span>
          <ModeBadge mode={report.mode} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.55fr_0.45fr]">
          <div>
            <p className="label text-ink-3">
              {formatDate(report.createdAt)} · {formatTime(report.createdAt)} ·{" "}
              {report.evidence.length} probes
            </p>
            <h2 id="memo-title" className="display-2 mt-3 text-balance">
              {pair.a.name} <span className="mx-[0.06em] text-orange">×</span> {pair.b.name}
            </h2>
            <p className="mt-6 max-w-[44ch] font-display text-[clamp(1.4rem,2.2vw,2rem)] leading-[1.15] tracking-[-0.02em]">
              {verdict.headline}
            </p>
            <p className="mt-4 max-w-[64ch] text-[0.95rem] leading-relaxed text-ink-2">
              {verdict.summary}
            </p>
          </div>

          <aside className="self-start border border-ink bg-lime p-4">
            <p className="label text-ink/70">Recommended posture</p>
            <p className="mt-3 font-display text-xl leading-snug">{verdict.posture}</p>
            <p className="mt-5 border-t border-ink/20 pt-3 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/70">
              CulturalDNA desk · {scores.overall}/100 · {TIER_META[scores.tier].short}
            </p>
          </aside>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line text-center sm:grid-cols-4">
          {[
            ["Match index", `${scores.overall}/100`],
            ["Confidence", `${scores.confidence}/100`],
            ["Probes", String(report.evidence.length)],
            ["Model calls", String(report.timings.modelCalls)],
          ].map(([label, value]) => (
            <div key={label} className="bg-paper px-3 py-3">
              <dt className="label-sm text-ink-3">{label}</dt>
              <dd className="mt-1 font-mono text-sm tabular">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <ScoreSection report={report} />
      <BlindSection report={report} />
      <DnaSection report={report} />
      <PlaceSection report={report} />
      <MomentumSection report={report} />
      <CrossDomainSection report={report} />
      <SafetySection report={report} />
      <PlaysSection report={report} />
      <RisksSection report={report} />
      <EvidenceSection report={report} />
      <CaveatsSection report={report} />

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-5 sm:px-8 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copySummary} className="btn btn-ghost h-10 px-3.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {copied === "ok" ? "Copied" : copied === "fail" ? "Copy blocked" : "Copy summary"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-ghost h-10 px-3.5"
          >
            Print memo
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-3">
            {report.id.slice(-8).toUpperCase()} · {formatDuration(report.timings.totalMs)}
          </span>
          {onRunAgain ? (
            <button type="button" onClick={onRunAgain} className="btn btn-primary h-10 px-3.5">
              Run another match
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
