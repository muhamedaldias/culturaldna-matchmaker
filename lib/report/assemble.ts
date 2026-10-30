import type { BlindTake, Report, SafetyFlag, Scores } from "@/lib/types";
import type { LiveDataset } from "@/lib/qloo/collect";
import type { MemoDraft } from "@/lib/agents/schemas";
import { assessCulturalSafety, computeScores } from "@/lib/scoring";
import { dedupeTags } from "@/lib/qloo/normalize";

/**
 * Live evidence is scored through exactly the same deterministic engine as the
 * demo fixtures. Nothing the model writes can move the number.
 */
export function evaluateLiveDataset(dataset: LiveDataset): {
  safetyFlags: SafetyFlag[];
  scores: Scores;
} {
  const tagsA = dedupeTags([...dataset.shared, ...dataset.tagsA]);
  const tagsB = dedupeTags([...dataset.shared, ...dataset.tagsB]);
  const safetyFlags = assessCulturalSafety(tagsA, tagsB);

  const scores = computeScores({
    shared: dataset.shared,
    uniqueA: dataset.uniqueA,
    uniqueB: dataset.uniqueB,
    cities: dataset.cities,
    trends: dataset.trends,
    safetyFlags,
    mode: "live",
    evidenceCount: dataset.probes.length,
    crossDomainCount: dataset.crossDomain.length,
    demographicsCount: Math.max(
      dataset.demographics.a.length,
      dataset.demographics.b.length,
    ),
  });

  return { safetyFlags, scores };
}

function createId(): string {
  return `live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function assembleLiveReport(input: {
  dataset: LiveDataset;
  memo: MemoDraft;
  blind: BlindTake;
  scores: Scores;
  safetyFlags: SafetyFlag[];
  notes: string[];
  timings: { totalMs: number; modelCalls: number };
  now?: Date;
}): Report {
  const now = input.now ?? new Date();
  const { dataset, memo, scores, safetyFlags } = input;

  const caveats = [
    "Live run — every probe in the ledger was executed against Qloo's taste graph during this analysis; parameters are shown verbatim.",
    "Affinity values are relative signals between 0 and 1. They are not audience sizes, market share, or forecasts.",
    "Cultural-safety screening is lexicon-level. It flags tension; it does not replace legal, compliance or brand review.",
    "The memo contains no revenue, ROI or sales projections by design.",
    ...(dataset.cities.length === 0
      ? ["The locality probe returned no cities, so no activation city is recommended."]
      : []),
    ...(dataset.warnings.length > 0
      ? [
          `${dataset.warnings.length} probe(s) returned partial data; the confidence score reflects the coverage gap.`,
        ]
      : []),
    ...input.notes,
  ];

  return {
    id: createId(),
    createdAt: now.toISOString(),
    mode: "live",
    location: dataset.location,
    pair: { a: dataset.a, b: dataset.b },
    verdict: memo.verdict,
    scores,
    dna: {
      shared: [...dataset.shared].sort((a, b) => b.score - a.score),
      uniqueA: [...dataset.uniqueA].sort((a, b) => b.score - a.score),
      uniqueB: [...dataset.uniqueB].sort((a, b) => b.score - a.score),
    },
    cities: [...dataset.cities].sort((a, b) => b.affinity - a.affinity),
    demographics: dataset.demographics,
    trends: dataset.trends,
    crossDomain: dataset.crossDomain,
    plays: memo.plays.map((play, index) => ({
      index: index + 1,
      title: play.title,
      thesis: play.thesis,
      format: play.format,
      city: play.city,
      audience: play.audience,
      successSignals: play.success_signals,
      evidenceRefs: play.evidence_refs,
      confidence: play.confidence,
    })),
    risks: memo.risks.map((risk) => ({
      title: risk.title,
      severity: risk.severity,
      detail: risk.detail,
      mitigation: risk.mitigation,
      evidenceRefs: risk.evidence_refs,
    })),
    safetyFlags,
    blind: {
      ...input.blind,
      misses: memo.blind_misses,
    },
    informed: memo.informed,
    evidence: [...dataset.probes].sort((a, b) => a.at.localeCompare(b.at)),
    caveats,
    timings: {
      totalMs: input.timings.totalMs,
      probes: dataset.probes.length,
      modelCalls: input.timings.modelCalls,
    },
  };
}
