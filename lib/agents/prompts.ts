import type {
  BrandRef,
  EvidenceProbe,
  Mode,
  SafetyFlag,
  Scores,
} from "@/lib/types";
import type { LiveDataset } from "@/lib/qloo/collect";

export const STRATEGIST_SYSTEM = `You are the Strategist at CulturalDNA Matchmaker, a cultural due-diligence desk for brand partnerships. You write like a senior strategy director at a small, expensive agency: concrete, restrained, allergic to hype.

You are given evidence from Qloo's taste graph. It is the only source of truth about cultural affinity.

Rules, without exception:
- Use only the supplied evidence. Never invent entities, cities, affinity scores, audience sizes, revenue or ROI.
- Every city you name must appear in the activation-city list, written as supplied.
- Every play and risk must cite one to four evidence ids from the ledger.
- Affinity values are relative signals between 0 and 1. Never describe them as market share, percentages of people, or audience size.
- Write in English. No emoji. No exclamation marks.
- Avoid agency clichés: elevate, leverage, synergy, unlock, seamless, game-changer, at the intersection of, reimagine.
- Prefer specific nouns and verbs. A play should be physically imaginable: who stands where, what happens, what gets measured.
- Success signals must be observable and must not be revenue, ROI or sales forecasts. Attendance, retention, completion, applications, participation and earned media are acceptable.
- If the evidence is thin, say so plainly in the verdict summary instead of filling the gap with adjectives.
- The verdict headline is one sentence of at most 14 words. The posture is a single imperative sentence.
- The three plays must be structurally different from each other: one place-based, one product or content, one audience or community. Do not propose three festivals.
- Risks must be specific to this pairing, not generic marketing risks.`;

export const BLIND_SYSTEM = `You are the naive baseline in a controlled experiment. You have NOT seen any taste-graph data. You are given two brand names and their category descriptions, nothing else.

Predict the partnership thesis a competent strategist would produce from category logic alone. Be honest about the limits of that reasoning. Do not pretend to know audience data.

Return JSON only. No emoji. No exclamation marks.`;

export const PROBE_PLANNER_SYSTEM = `You are the Strategist deciding the next move in a Qloo investigation. You can see the evidence gathered so far. Choose one or two additional cross-domain probes from the allowed list that would most reduce uncertainty about whether these two audiences genuinely share a culture.

Choose domains that are NOT already covered. Prefer a domain that could change the recommendation, not one that merely confirms it. One short sentence of rationale.

Return JSON only.`;

const pct = (value: number) => `${Math.round(value * 100)}%`;
const num = (value: number) => value.toFixed(2);

function brandLine(brand: BrandRef) {
  const subtype = brand.subtype ? ` (${brand.subtype.replace("urn:entity:", "")})` : "";
  return `${brand.name}${subtype}${brand.description ? ` — ${brand.description}` : ""}`;
}

export function buildBlindPrompt(a: BrandRef, b: BrandRef): string {
  return [
    "BRAND A",
    brandLine(a),
    "",
    "BRAND B",
    brandLine(b),
    "",
    "Without using any audience or taste data, what partnership would category logic predict?",
    "Return: guess (one sentence), rationale (2-4 sentences), predicted_overlap (3-7 short cultural themes).",
  ].join("\n");
}

export function buildProbePrompt(dataset: LiveDataset, covered: string[]): string {
  const shared = dataset.shared
    .slice(0, 8)
    .map((tag) => `${tag.name} (${tag.domain})`)
    .join(", ");
  return [
    `PAIR: ${dataset.a.name} × ${dataset.b.name}`,
    `SHARED SIGNALS: ${shared || "none returned"}`,
    `UNIQUE TO ${dataset.a.name.toUpperCase()}: ${dataset.uniqueA.slice(0, 5).map((tag) => tag.name).join(", ") || "none"}`,
    `UNIQUE TO ${dataset.b.name.toUpperCase()}: ${dataset.uniqueB.slice(0, 5).map((tag) => tag.name).join(", ") || "none"}`,
    `CITIES: ${dataset.cities.slice(0, 5).map((city) => city.name).join(", ") || "none"}`,
    `ALREADY COVERED DOMAINS: ${covered.join(", ")}`,
    "",
    "Allowed entity types for the next probe: book, podcast, tv_show, video_game, place, person.",
    "Return: rationale (one sentence), probes (1-2 items with entity_type and question).",
  ].join("\n");
}

export function buildStrategyPrompt(input: {
  dataset: LiveDataset;
  scores: Scores;
  safetyFlags: SafetyFlag[];
  evidence: EvidenceProbe[];
  mode: Mode;
  warnings: string[];
}): string {
  const { dataset, scores, safetyFlags, evidence, mode, warnings } = input;

  const shared = dataset.shared
    .slice(0, 12)
    .map((tag) => `- ${tag.name} | ${tag.domain} | ${num(tag.score)}`)
    .join("\n");
  const uniqueA = dataset.uniqueA
    .slice(0, 8)
    .map((tag) => `- ${tag.name} | ${tag.domain} | ${num(tag.score)}`)
    .join("\n");
  const uniqueB = dataset.uniqueB
    .slice(0, 8)
    .map((tag) => `- ${tag.name} | ${tag.domain} | ${num(tag.score)}`)
    .join("\n");
  const cities = dataset.cities
    .map((city) => `- ${city.name}${city.region ? `, ${city.region}` : ""} | ${num(city.affinity)}`)
    .join("\n");
  const trends = dataset.trends
    .map((series) => `- ${series.entity} | ${series.domain} | ${series.deltaLabel} | momentum ${series.momentum}`)
    .join("\n");
  const cross = dataset.crossDomain
    .map(
      (group) =>
        `- ${group.domainLabel}: ${group.items
          .map((item) => `${item.name} (${num(item.affinity)})`)
          .join(", ")}`,
    )
    .join("\n");
  const demographicsA = dataset.demographics.a
    .map((item) => `${item.segment} ${num(item.affinity)}`)
    .join(" · ");
  const demographicsB = dataset.demographics.b
    .map((item) => `${item.segment} ${num(item.affinity)}`)
    .join(" · ");
  const flags = safetyFlags
    .map((flag) => `- ${flag.label} (−${flag.penalty}): ${flag.detail}`)
    .join("\n");
  const ledger = evidence
    .map((probe) => `- ${probe.id} | ${probe.agent} | ${probe.label} | ${probe.endpoint} | ${probe.resultCount} rows`)
    .join("\n");
  const components = scores.components
    .map((component) => `${component.label} ${component.value}/100 (weight ${pct(component.weight)})`)
    .join(" · ");

  return [
    `MODE: ${mode === "live" ? "live Qloo evidence" : "curated demo evidence"}`,
    "",
    "PAIR",
    `A: ${brandLine(dataset.a)}`,
    `B: ${brandLine(dataset.b)}`,
    `LOCATION FOCUS: ${dataset.location}`,
    "",
    `MATCH INDEX: ${scores.overall}/100 · ${scores.tier} · confidence ${scores.confidence}/100`,
    `COMPONENTS: ${components}`,
    "",
    "SHARED TASTE (name | domain | affinity)",
    shared || "- none returned",
    "",
    `UNIQUE TO ${dataset.a.name.toUpperCase()} (name | domain | affinity)`,
    uniqueA || "- none returned",
    "",
    `UNIQUE TO ${dataset.b.name.toUpperCase()} (name | domain | affinity)`,
    uniqueB || "- none returned",
    "",
    "ACTIVATION CITIES (name | affinity) — use these exact names",
    cities || "- none returned",
    "",
    "12-MONTH MOMENTUM",
    trends || "- no trend data",
    "",
    "CROSS-DOMAIN PICKS",
    cross || "- none returned",
    "",
    "AUDIENCE SIGNALS (relative affinity)",
    `A: ${demographicsA || "none"}`,
    `B: ${demographicsB || "none"}`,
    `Note: ${dataset.demographics.sharedNote}`,
    "",
    "CULTURAL SAFETY FLAGS",
    flags || "- none",
    "",
    "EVIDENCE LEDGER — cite these ids only",
    ledger || "- none",
    "",
    warnings.length > 0 ? `WARNINGS: ${warnings.join(" | ")}` : "WARNINGS: none",
    "",
    "TASK",
    "Write the deal memo. Exactly three plays, each with a different structure and a city from the list. Three or four risks specific to this pair.",
    "The three blind_misses must state what a category-only model would have missed, grounded in the shared or unique signals above.",
    "If the match index is below 60, the verdict must recommend against a full partnership and propose a test instead.",
  ].join("\n");
}
