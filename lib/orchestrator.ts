import type { AgentId, AnalyzeEvent, Mode, Report } from "@/lib/types";
import { hasGeminiKey, hasQlooKey, runtimeReason } from "@/lib/env";
import { QlooApiError } from "@/lib/qloo/client";
import { LiveCollector } from "@/lib/qloo/collect";
import { buildDemoReport } from "@/lib/fixtures/build";
import { FIXTURES, resolveFixture } from "@/lib/fixtures";
import { runBlindTake } from "@/lib/agents/blind";
import { planProbes, runModelProbes } from "@/lib/agents/probes";
import { generateJson, GeminiError } from "@/lib/agents/gemini";
import { STRATEGIST_SYSTEM, buildStrategyPrompt } from "@/lib/agents/prompts";
import { memoDraftSchema, type MemoDraft } from "@/lib/agents/schemas";
import { fallbackMemo } from "@/lib/agents/fallback";
import { reviewMemo } from "@/lib/agents/critic";
import { assembleLiveReport, evaluateLiveDataset } from "@/lib/report/assemble";
import { withTimeout } from "@/lib/agents/shared";

export type AnalyzeInput = {
  a: string;
  b: string;
  location?: string;
  fixture?: string;
  /** Optional override, used by the UI to preview the archive. */
  mode?: Mode;
};

export type EmitFn = (event: AnalyzeEvent) => void;

export type RunOptions = {
  emit: EmitFn;
  signal?: AbortSignal;
  /** Milliseconds between replayed demo events. */
  pacing?: number;
};

export class AnalysisCancelledError extends Error {
  constructor() {
    super("Analysis cancelled.");
    this.name = "AnalysisCancelledError";
  }
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AnalysisCancelledError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new AnalysisCancelledError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isCancelled(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  if (error instanceof AnalysisCancelledError) return true;
  if (error instanceof QlooApiError) return error.code === "QLOO_CANCELLED";
  if (error instanceof GeminiError) return error.code === "GEMINI_CANCELLED";
  return false;
}

function normaliseLocation(value: string | undefined): string {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim();
  return (trimmed || "Global").slice(0, 60);
}

export async function runAnalysis(
  input: AnalyzeInput,
  options: RunOptions,
): Promise<Report | null> {
  const mode: Mode = !hasQlooKey() || input.mode === "demo" ? "demo" : "live";
  return mode === "demo" ? runDemo(input, options) : runLive(input, options);
}

/* -------------------------------------------------------------------------- */
/* Demo replay                                                                 */
/* -------------------------------------------------------------------------- */

async function runDemo(input: AnalyzeInput, options: RunOptions): Promise<Report | null> {
  const { emit, signal } = options;
  const pacing = options.pacing ?? 70;
  let traceCounter = 0;

  const match = resolveFixture(input.a, input.b);
  const fixture =
    match?.fixture ??
    (input.fixture ? FIXTURES.find((entry) => entry.slug === input.fixture) : undefined);

  if (!fixture) {
    emit({
      type: "error",
      code: "DEMO_PAIR_NOT_FOUND",
      message: `The demo archive has no memo for “${input.a}” × “${input.b}”.`,
      recovery: `Qloo is not configured for this build, so the archive is the evidence source. Try ${FIXTURES.map(
        (entry) => `${entry.a.name} × ${entry.b.name}`,
      ).join(" · ")}.`,
    });
    return null;
  }

  const report = buildDemoReport(fixture);
  const now = () => new Date().toISOString();

  const stage = (agent: AgentId, status: "start" | "done", label: string) =>
    emit({ type: "stage", agent, status, label, at: now() });

  const trace = (
    agent: AgentId,
    message: string,
    detail?: string,
    status: "done" | "warn" = "done",
  ) =>
    emit({
      type: "trace",
      entry: {
        id: `demo-trace-${++traceCounter}`,
        agent,
        message,
        detail,
        status,
        at: now(),
      },
    });

  const emitEvidence = async (agent: AgentId) => {
    const probes = report.evidence.filter((probe) => probe.agent === agent);
    for (const [index, probe] of probes.entries()) {
      emit({ type: "evidence", probe });
      await pause(pacing + (index % 3) * 18, signal);
    }
  };

  emit({
    type: "mode",
    mode: "demo",
    reason:
      input.mode === "demo"
        ? `Demo archive requested. The memo is fixed to ${fixture.location}; no external calls were made.`
        : `${runtimeReason()} The archived memo is fixed to ${fixture.location}.`,
    location: fixture.location,
    providers: { qloo: false, gemini: false },
  });

  stage("orchestrator", "start", "Opening the case file");
  await pause(160, signal);
  trace(
    "orchestrator",
    "Case file opened from the curated archive.",
    `${report.pair.a.name} × ${report.pair.b.name} · ${report.location} · illustrated evidence`,
  );
  stage("orchestrator", "done", "Case file open");

  stage("scout", "start", "Resolving both brands");
  await emitEvidence("scout");
  trace(
    "scout",
    "Both brands resolved from the archive.",
    `${report.pair.a.name} (${report.pair.a.subtype ?? "brand"}) · ${report.pair.b.name} (${report.pair.b.subtype ?? "brand"})`,
  );
  stage("scout", "done", "Brands resolved");
  await pause(90, signal);

  stage("strategist", "start", "Recording a category-only guess");
  await pause(180, signal);
  trace("strategist", "Blind take recorded before any evidence was read.", report.blind.guess);
  stage("strategist", "done", "Blind take recorded");

  stage("ethnographer", "start", "Mapping taste");
  await emitEvidence("ethnographer");
  trace(
    "ethnographer",
    `${report.dna.shared.length} shared signals across ${new Set(report.dna.shared.map((tag) => tag.domain)).size} domains.`,
    report.dna.shared
      .slice(0, 5)
      .map((tag) => `${tag.name} ${tag.score.toFixed(2)}`)
      .join(" · "),
  );
  stage("ethnographer", "done", "Taste mapped");
  await pause(60, signal);

  stage("diplomat", "start", "Comparing taste");
  await emitEvidence("diplomat");
  trace(
    "diplomat",
    "Shared and unique taste separated.",
    `${report.dna.uniqueA.length} unique to ${report.pair.a.name} · ${report.dna.uniqueB.length} unique to ${report.pair.b.name}`,
  );
  stage("diplomat", "done", "Taste compared");

  stage("cartographer", "start", "Mapping places");
  await emitEvidence("cartographer");
  trace(
    "cartographer",
    report.cities[0] ? `${report.cities[0].name} leads combined city affinity.` : "No city signal returned.",
    report.cities
      .slice(0, 3)
      .map((city) => `${city.name} ${city.affinity.toFixed(2)}`)
      .join(" · "),
  );
  stage("cartographer", "done", "Places mapped");

  stage("timekeeper", "start", "Reading momentum");
  await emitEvidence("timekeeper");
  trace(
    "timekeeper",
    "Momentum read across the archive window.",
    report.trends.map((trend) => `${trend.entity} ${trend.deltaLabel}`).join(" · "),
  );
  stage("timekeeper", "done", "Momentum read");

  stage("strategist", "start", "Drafting the memo");
  await emitEvidence("strategist");
  await pause(220, signal);
  trace(
    "strategist",
    "Memo drafted: three plays, three risks, one verdict.",
    report.verdict.headline,
  );
  stage("strategist", "done", "Memo drafted");

  stage("critic", "start", "Checking the memo");
  await pause(200, signal);
  trace(
    "critic",
    `Cleared ${report.evidence.length} ledger entries; no financial projections found.`,
    `Match index ${report.scores.overall}/100 · confidence capped at ${report.scores.confidence}/100 in demo mode`,
  );
  stage("critic", "done", "Memo cleared");

  await pause(120, signal);
  emit({ type: "report", report });
  return report;
}

/* -------------------------------------------------------------------------- */
/* Live pipeline                                                               */
/* -------------------------------------------------------------------------- */

async function runLive(input: AnalyzeInput, options: RunOptions): Promise<Report | null> {
  const { emit, signal } = options;
  const started = Date.now();
  const location = normaliseLocation(input.location);
  let traceCounter = 0;

  const now = () => new Date().toISOString();

  const stage = (
    agent: AgentId,
    status: "start" | "done" | "warn" | "error",
    label: string,
  ) => emit({ type: "stage", agent, status, label, at: now() });

  const trace = (
    agent: AgentId,
    message: string,
    detail?: string,
    status: "done" | "warn" | "error" = "done",
    durationMs?: number,
  ) =>
    emit({
      type: "trace",
      entry: {
        id: `live-trace-${++traceCounter}`,
        agent,
        message,
        detail,
        status,
        at: now(),
        ...(durationMs !== undefined ? { durationMs } : {}),
      },
    });

  const collector = new LiveCollector(
    {
      stage,
      trace: (entry) =>
        emit({
          type: "trace",
          entry: {
            id: `live-trace-${++traceCounter}`,
            at: now(),
            ...entry,
          },
        }),
      probe: (probe) => emit({ type: "evidence", probe }),
    },
    location,
    signal,
  );

  try {
    emit({
      type: "mode",
      mode: "live",
      reason: runtimeReason(),
      location,
      providers: { qloo: true, gemini: hasGeminiKey() },
    });

    stage("orchestrator", "start", "Opening a live investigation");
    trace("orchestrator", "Live investigation opened.", `Location focus: ${location}`);

    stage("scout", "start", "Resolving both brands");
    const a = await collector.resolveBrand(input.a, "a");
    const b = await collector.resolveBrand(input.b, "b");
    await collector.confirmEntities([a.id, b.id]);
    stage("scout", "done", "Brands resolved");

    stage("strategist", "start", "Recording a category-only guess");
    const blindPromise = runBlindTake(a, b, {
      signal,
      notify: (message, detail, status) => trace("strategist", message, detail, status),
    });

    const dataset = await collector.collect(a, b);
    const blindResult = await blindPromise;
    stage("strategist", "done", "Blind take recorded");

    let { scores, safetyFlags } = evaluateLiveDataset(dataset);
    let modelCalls = blindResult.modelCalls;
    const notes: string[] = [];

    if (blindResult.warning) {
      notes.push(
        "The blind take is a category-only heuristic rather than a model guess; the comparison is still valid but less specific.",
      );
    }

    if (hasGeminiKey()) {
      stage("strategist", "start", "Planning follow-up probes");
      const planned = await planProbes({
        dataset,
        covered: dataset.crossDomain.map((group) => group.domainLabel.toLowerCase()),
        signal,
        notify: (message, detail, status) => trace("strategist", message, detail, status),
      });
      modelCalls += planned.modelCalls;

      if (planned.plan) {
        const groups = await runModelProbes({
          dataset,
          collector,
          plan: planned.plan,
          signal,
        });
        if (groups.length > 0) {
          dataset.crossDomain.push(...groups);
          ({ scores, safetyFlags } = evaluateLiveDataset(dataset));
          trace(
            "strategist",
            `Model-selected probes added ${groups.length} domain${groups.length > 1 ? "s" : ""}.`,
            groups.map((group) => group.domainLabel).join(" · "),
          );
        } else {
          trace(
            "strategist",
            "Selected probes returned no usable rows — the fixed pipeline stands.",
            undefined,
            "warn",
          );
        }
      } else if (planned.warning) {
        notes.push(
          "Probe planning did not complete; the fixed fourteen-probe pipeline supplied the memo.",
        );
      }
      stage("strategist", "done", "Probes planned");
    } else {
      notes.push(
        "Gemini was not configured, so probe selection and the memo were written by the deterministic strategist.",
      );
    }

    stage("strategist", "start", "Writing the deal memo");
    let memo: MemoDraft;

    if (hasGeminiKey()) {
      try {
        const result = await generateJson({
          system: STRATEGIST_SYSTEM,
          prompt: buildStrategyPrompt({
            dataset,
            scores,
            safetyFlags,
            evidence: dataset.probes,
            mode: "live",
            warnings: dataset.warnings,
          }),
          schema: memoDraftSchema,
          temperature: 0.85,
          maxOutputTokens: 6144,
          signal: withTimeout(signal, 45_000),
        });
        memo = result.data;
        modelCalls += 1;
        trace(
          "strategist",
          `Memo drafted by ${result.model}.`,
          `${result.durationMs} ms · match index ${scores.overall}/100 · confidence ${scores.confidence}/100`,
          "done",
          result.durationMs,
        );
      } catch (error) {
        if (signal?.aborted) throw error;
        const message =
          error instanceof GeminiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Gemini did not complete the memo.";
        notes.push(
          "Gemini did not complete the memo; the deterministic strategist wrote it from the same evidence ledger.",
        );
        trace("strategist", "Gemini memo failed — deterministic memo used.", message, "warn");
        memo = fallbackMemo(dataset, scores, safetyFlags, blindResult.blind);
      }
    } else {
      memo = fallbackMemo(dataset, scores, safetyFlags, blindResult.blind);
      trace(
        "strategist",
        "Deterministic memo written from the ledger.",
        "Set GEMINI_API_KEY to add a Gemini-authored narrative on the next run.",
      );
    }
    stage("strategist", "done", "Memo drafted");

    stage("critic", "start", "Checking the memo");
    const reviewed = reviewMemo({
      memo,
      cities: dataset.cities,
      evidence: dataset.probes,
    });
    if (reviewed.issues.length > 0) {
      trace(
        "critic",
        `Corrected ${reviewed.issues.length} issue(s) before publication.`,
        reviewed.issues.slice(0, 4).join(" · "),
        "warn",
      );
    } else {
      trace(
        "critic",
        `Checked ${dataset.probes.length} ledger entries; every citation resolves and no financial claims were found.`,
      );
    }
    stage("critic", "done", "Memo cleared");

    const report = assembleLiveReport({
      dataset,
      memo: reviewed.memo,
      blind: blindResult.blind,
      scores,
      safetyFlags,
      notes,
      timings: {
        totalMs: Date.now() - started,
        modelCalls,
      },
    });

    stage("orchestrator", "done", "Investigation complete");
    emit({ type: "report", report });
    return report;
  } catch (error) {
    if (isCancelled(error, signal)) throw error;

    if (error instanceof QlooApiError) {
      emit({
        type: "error",
        code: error.code,
        message: error.message,
        recovery: error.recovery,
      });
      return null;
    }

    emit({
      type: "error",
      code: "ANALYSIS_FAILED",
      message: error instanceof Error ? error.message : "Unknown failure.",
      recovery:
        "Try the curated demo pairs while the problem is investigated. The archive never depends on a live key.",
    });
    return null;
  }
}
