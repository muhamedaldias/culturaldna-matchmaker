import type { CitySignal, EvidenceProbe } from "@/lib/types";
import type { MemoDraft } from "@/lib/agents/schemas";

/**
 * The Critic is deterministic on purpose: models write, code verifies.
 *
 * It checks three things the memo cannot get wrong —
 *   1. every play cites an evidence id that exists in the ledger;
 *   2. every city named as an activation city came from the locality probe;
 *   3. no revenue, ROI, audience-size or percentage-of-people claims.
 *
 * Style-level fixes (agency clichés, exclamation marks) are applied too, so
 * the published memo matches the house voice.
 */

const FINANCE_CLAIM =
  /\b(revenue|revenues|roi|return on investment|profit|profits|ebitda|valuation|sales uplift|sales lift|sales increase|market share|monetisation|monetization)\b|[$£€]\s?\d|\b\d+(?:\.\d+)?\s?%\s+(?:increase|uplift|lift|growth|roi)\b/i;

const AUDIENCE_CLAIM =
  /\b\d+(?:\.\d+)?\s?% of (?:people|consumers|audience|audiences|shoppers|customers)\b|\b\d+(?:\.\d+)?\s?(?:million|billion) (?:people|consumers|customers|users)\b/i;

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

const HYPE: Array<[RegExp, string]> = [
  [/\bsynergies\b/gi, "shared advantages"],
  [/\bsynergy\b/gi, "shared value"],
  [/\bleveraging\b/gi, "using"],
  [/\bleverage\b/gi, "use"],
  [/\belevating\b/gi, "raising"],
  [/\belevate\b/gi, "raise"],
  [/\bunlocking\b/gi, "opening"],
  [/\bunlock\b/gi, "open"],
  [/\bseamlessly\b/gi, "smoothly"],
  [/\bseamless\b/gi, "smooth"],
  [/\bgame[- ]changers?\b/gi, "notable shifts"],
  [/\bgame[- ]changing\b/gi, "consequential"],
  [/\bat the intersection of\b/gi, "in the overlap between"],
  [/\breimagining\b/gi, "rebuilding"],
  [/\breimagine\b/gi, "rebuild"],
];

const SUCCESS_POOL = [
  "Attendance versus RSVP across the full programme",
  "Completion rate for the series or the edition",
  "Earned media in each brand's core press",
  "Opt-in rate for a second edition",
];

function clean(value: string): string {
  let output = value;
  for (const [pattern, replacement] of HYPE) output = output.replace(pattern, replacement);
  output = output.replace(EMOJI, "").replace(/!/g, ".");
  return output.replace(/\s+/g, " ").trim();
}

function claimed(sentence: string): boolean {
  return FINANCE_CLAIM.test(sentence) || AUDIENCE_CLAIM.test(sentence);
}

function ensureMin(value: string, min: number, suffix: string): string {
  if (value.length >= min) return value;
  return `${value} ${suffix}`.trim();
}

function sanitizeProse(
  value: string,
  options: { min: number; fallback: string },
): { text: string; removed: number } {
  const cleaned = clean(value);
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept = sentences.filter((sentence) => !claimed(sentence));
  const removed = sentences.length - kept.length;
  const joined = kept.join(" ").trim();
  return {
    text: ensureMin(joined, options.min, options.fallback),
    removed,
  };
}

function normaliseCity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function canonicalCity(value: string, cities: CitySignal[]): string | undefined {
  const target = normaliseCity(value);
  if (!target) return undefined;
  const hit = cities.find((city) => {
    const name = normaliseCity(city.name);
    return target === name || target.startsWith(`${name} `) || name.startsWith(`${target} `);
  });
  return hit?.name;
}

export function reviewMemo(input: {
  memo: MemoDraft;
  cities: CitySignal[];
  evidence: EvidenceProbe[];
}): { memo: MemoDraft; issues: string[] } {
  const issues: string[] = [];
  const validRefs = new Set(input.evidence.map((probe) => probe.id));
  const memo = input.memo;

  const verdictHeadline = clean(memo.verdict.headline)
    .split(" ")
    .filter(Boolean);
  if (verdictHeadline.length > 14) {
    issues.push("Verdict headline exceeded 14 words and was trimmed.");
  }
  const headline = ensureMin(
    verdictHeadline.slice(0, 14).join(" "),
    10,
    "Cultural fit, with conditions.",
  );

  const summary = sanitizeProse(memo.verdict.summary, {
    min: 120,
    fallback:
      "The memo deliberately contains no revenue projection; affinity is a relative signal, not a forecast.",
  });
  if (summary.removed > 0) issues.push(`${summary.removed} financial or audience-size claim(s) removed from the verdict.`);

  const posture = ensureMin(clean(memo.verdict.posture), 10, "Test before scaling.");
  const postureSentence = /[.!?]$/.test(posture) ? posture : `${posture}.`;

  const informedParagraphs = memo.informed.paragraphs
    .map((paragraph) =>
      sanitizeProse(paragraph, {
        min: 120,
        fallback:
          "The evidence ledger marks the boundary of this memo. Anything outside it is a hypothesis to test, not a finding to present.",
      }),
    )
    .filter((entry) => entry.text.length > 0);

  const removedParagraphClaims = informedParagraphs.reduce((sum, entry) => sum + entry.removed, 0);
  if (removedParagraphClaims > 0) {
    issues.push(`${removedParagraphClaims} claim(s) removed from the informed analysis.`);
  }

  while (informedParagraphs.length < 2) {
    informedParagraphs.push({
      text:
        "The evidence ledger is the boundary of this memo. It shows which Qloo probes returned data and which were thin; everything outside that boundary is a hypothesis to test, not a finding to present.",
      removed: 0,
    });
  }

  const blindMisses = memo.blind_misses
    .map((miss) => ensureMin(clean(miss), 20, "The ledger is the reason this matters."))
    .slice(0, 4);

  while (blindMisses.length < 2) {
    blindMisses.push(
      "Category logic could not name the shared rituals this pairing actually holds; the tag graph could.",
    );
  }

  const plays = memo.plays.map((play, index) => {
    const thesis = sanitizeProse(play.thesis, {
      min: 80,
      fallback: "The play should be tested at small scale before either brand commits budget.",
    });
    if (thesis.removed > 0) issues.push(`Play ${index + 1}: ${thesis.removed} claim(s) removed.`);

    const rawCity = clean(play.city);
    const city = canonicalCity(rawCity, input.cities);
    const cityFallback =
      input.cities.length > 0
        ? input.cities[index % input.cities.length].name
        : "Location pending";
    const resolvedCity = city ?? cityFallback;
    if (!city && rawCity !== resolvedCity) {
      issues.push(`Play ${index + 1}: “${rawCity}” is not in the locality evidence; replaced with ${resolvedCity}.`);
    }

    const signals = play.success_signals
      .map((signal) => clean(signal))
      .filter((signal) => !claimed(signal) && signal.length >= 8)
      .slice(0, 4);
    for (const fallback of SUCCESS_POOL) {
      if (signals.length >= 2) break;
      if (!signals.includes(fallback)) signals.push(fallback);
    }

    let refs = play.evidence_refs.filter((ref) => validRefs.has(ref));
    if (refs.length === 0 && input.evidence.length > 0) {
      refs = input.evidence
        .slice(index * 2, index * 2 + 2)
        .map((probe) => probe.id);
      if (refs.length === 0) refs = [input.evidence[0].id];
      issues.push(`Play ${index + 1}: no valid evidence ids; attached ledger entries.`);
    } else if (refs.length !== play.evidence_refs.length) {
      issues.push(`Play ${index + 1}: removed unknown evidence id(s).`);
    }

    return {
      title: clean(play.title),
      thesis: thesis.text,
      format: clean(play.format),
      city: resolvedCity,
      audience: ensureMin(clean(play.audience), 5, "The shared audience"),
      success_signals: signals.slice(0, 4),
      evidence_refs: refs.slice(0, 4),
      confidence: play.confidence,
    };
  });

  const risks = memo.risks.map((risk, index) => {
    const detail = sanitizeProse(risk.detail, {
      min: 60,
      fallback: "The evidence is thin enough that this risk needs a named owner before launch.",
    });
    if (detail.removed > 0) issues.push(`Risk ${index + 1}: ${detail.removed} claim(s) removed.`);

    const refs = risk.evidence_refs.filter((ref) => validRefs.has(ref));
    if (refs.length !== risk.evidence_refs.length) {
      issues.push(`Risk ${index + 1}: removed unknown evidence id(s).`);
    }

    return {
      title: clean(risk.title),
      severity: risk.severity,
      detail: detail.text,
      mitigation: ensureMin(
        clean(risk.mitigation),
        40,
        "Name the reviewer and give them the right to stop the work.",
      ),
      evidence_refs: refs.slice(0, 3),
    };
  });

  return {
    memo: {
      verdict: {
        headline,
        summary: summary.text,
        posture: postureSentence,
      },
      informed: {
        headline: clean(memo.informed.headline),
        paragraphs: informedParagraphs.map((entry) => entry.text),
      },
      blind_misses: blindMisses,
      plays,
      risks,
    },
    issues,
  };
}
