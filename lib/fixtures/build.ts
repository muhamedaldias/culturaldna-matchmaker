import type { Report } from "@/lib/types";
import type { DemoFixture } from "@/lib/fixtures/type";
import { assessCulturalSafety, computeScores } from "@/lib/scoring";

export const DEMO_CAVEAT =
  "Demo mode — this memo is a curated illustration built on Qloo's public tag and entity taxonomy, not live API output. Add a Qloo API key for a live analysis.";

export function buildDemoReport(fixture: DemoFixture, now = new Date()): Report {
  const tagsA = [...fixture.shared, ...fixture.uniqueA];
  const tagsB = [...fixture.shared, ...fixture.uniqueB];

  const safetyFlags = assessCulturalSafety(tagsA, tagsB, fixture.safetyFlags);

  const scores = computeScores({
    shared: fixture.shared,
    uniqueA: fixture.uniqueA,
    uniqueB: fixture.uniqueB,
    cities: fixture.cities,
    trends: fixture.trends,
    safetyFlags,
    mode: "demo",
    evidenceCount: fixture.probes.length,
    crossDomainCount: fixture.crossDomain.length,
    demographicsCount: Math.max(fixture.demographics.a.length, fixture.demographics.b.length),
  });

  const evidence = fixture.probes.map((seed, index) => ({
    ...seed,
    mode: "demo" as const,
    at: new Date(now.getTime() - (fixture.probes.length - index) * 1400).toISOString(),
  }));

  const totalMs =
    fixture.probes.reduce((sum, seed) => sum + seed.durationMs, 0) + 2600;

  return {
    id: `demo-${fixture.slug}-${now.getTime().toString(36)}`,
    createdAt: now.toISOString(),
    mode: "demo",
    location: fixture.location,
    pair: { a: fixture.a, b: fixture.b },
    verdict: fixture.verdict,
    scores,
    dna: {
      shared: [...fixture.shared].sort((a, b) => b.score - a.score),
      uniqueA: [...fixture.uniqueA].sort((a, b) => b.score - a.score),
      uniqueB: [...fixture.uniqueB].sort((a, b) => b.score - a.score),
    },
    cities: [...fixture.cities].sort((a, b) => b.affinity - a.affinity),
    demographics: fixture.demographics,
    trends: fixture.trends,
    crossDomain: fixture.crossDomain,
    plays: fixture.plays,
    risks: fixture.risks,
    safetyFlags,
    blind: fixture.blind,
    informed: fixture.informed,
    evidence,
    caveats: [DEMO_CAVEAT, ...fixture.caveats],
    timings: {
      totalMs,
      probes: fixture.probes.length,
      modelCalls: 3,
    },
  };
}
