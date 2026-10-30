import type {
  CitySignal,
  Mode,
  SafetyFlag,
  ScoreComponent,
  ScoreKey,
  Scores,
  ScoreTier,
  TasteTag,
  TrendSeries,
} from "@/lib/types";

export const WEIGHTS: Record<ScoreKey, number> = {
  overlap: 0.3,
  complementarity: 0.15,
  momentum: 0.15,
  locality: 0.15,
  safety: 0.25,
};

export const SCORE_LABELS: Record<ScoreKey, string> = {
  overlap: "Cultural overlap",
  complementarity: "Complementarity",
  momentum: "Momentum",
  locality: "Locality",
  safety: "Cultural safety",
};

export const SCORE_NOTES: Record<ScoreKey, string> = {
  overlap:
    "Mean of the ten strongest shared Qloo affinities, weighted toward the top of the list.",
  complementarity:
    "Breadth of tag domains each brand brings exclusively, blended with a shared-foundation check. Capped at eight domains.",
  momentum:
    "Mean 90-day trend velocity for both brands, mapped onto 50 ± 50.",
  locality:
    "Mean affinity of the five strongest activation cities from the locality probe.",
  safety:
    "100 minus weighted cultural-safety flags (regulated categories, value conflicts, climate contradictions).",
};

export const TIER_META: Record<
  ScoreTier,
  { label: string; short: string; description: string }
> = {
  exceptional: {
    label: "Exceptional fit",
    short: "Exceptional",
    description: "Rare alignment with a distinct contribution from each side.",
  },
  strong: {
    label: "Strong fit",
    short: "Strong",
    description: "A durable shared culture with enough difference to make it interesting.",
  },
  promising: {
    label: "Promising fit",
    short: "Promising",
    description: "Real overlap, but the activation needs a sharper cultural wedge.",
  },
  cautious: {
    label: "Proceed with care",
    short: "Cautious",
    description: "The pairing can work, but the risks need to be designed around.",
  },
  misaligned: {
    label: "Misaligned",
    short: "Misaligned",
    description: "The cultural distance is too wide for a credible partnership today.",
  },
};

export function tierFor(overall: number): ScoreTier {
  if (overall >= 85) return "exceptional";
  if (overall >= 76) return "strong";
  if (overall >= 66) return "promising";
  if (overall >= 52) return "cautious";
  return "misaligned";
}

export function confidenceBand(confidence: number): "high" | "moderate" | "thin" {
  if (confidence >= 78) return "high";
  if (confidence >= 58) return "moderate";
  return "thin";
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value);

export type ScoreInput = {
  shared: TasteTag[];
  uniqueA: TasteTag[];
  uniqueB: TasteTag[];
  cities: CitySignal[];
  trends: TrendSeries[];
  safetyFlags: SafetyFlag[];
  mode: Mode;
  evidenceCount: number;
  crossDomainCount: number;
  demographicsCount: number;
};

export function computeScores(input: ScoreInput): Scores {
  const overlapValue = (() => {
    if (input.shared.length === 0) return 0;
    const top = [...input.shared].sort((a, b) => b.score - a.score).slice(0, 10);
    const weights = top.map((_, index) => 1 - index * 0.04);
    const weighted = top.reduce((sum, tag, index) => sum + tag.score * weights[index], 0);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return 100 * (weighted / total);
  })();

  const complementarityValue = (() => {
    if (input.uniqueA.length === 0 && input.uniqueB.length === 0) return 0;
    const domainsA = new Set(input.uniqueA.map((tag) => tag.domain));
    const domainsB = new Set(input.uniqueB.map((tag) => tag.domain));
    const exclusive = new Set(
      [...domainsA].filter((domain) => !domainsB.has(domain)).concat(
        [...domainsB].filter((domain) => !domainsA.has(domain)),
      ),
    );
    const breadth = clamp(exclusive.size / 8, 0, 1);
    const foundation = clamp(input.shared.length / 5, 0, 1);
    return 100 * (0.7 * breadth + 0.3 * foundation);
  })();

  const momentumValue = (() => {
    if (input.trends.length === 0) return 50;
    const mean =
      input.trends.reduce((sum, series) => sum + series.momentum, 0) / input.trends.length;
    return clamp(50 + mean / 2, 0, 100);
  })();

  const localityValue = (() => {
    if (input.cities.length === 0) return 0;
    const top = [...input.cities]
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 5);
    const mean = top.reduce((sum, city) => sum + city.affinity, 0) / top.length;
    return clamp(mean * 100, 0, 100);
  })();

  const safetyValue = clamp(
    100 - input.safetyFlags.reduce((sum, flag) => sum + flag.penalty, 0),
    30,
    100,
  );

  const values: Record<ScoreKey, number> = {
    overlap: round(overlapValue),
    complementarity: round(complementarityValue),
    momentum: round(momentumValue),
    locality: round(localityValue),
    safety: round(safetyValue),
  };

  const components: ScoreComponent[] = (
    Object.keys(WEIGHTS) as ScoreKey[]
  ).map((key) => ({
    key,
    label: SCORE_LABELS[key],
    weight: WEIGHTS[key],
    value: values[key],
    note: SCORE_NOTES[key],
  }));

  const overall = round(
    components.reduce((sum, component) => sum + component.value * component.weight, 0),
  );

  const coverage = [
    input.shared.length >= 8,
    input.cities.length >= 6,
    input.trends.length >= 2,
    input.demographicsCount >= 4,
    input.crossDomainCount >= 2,
    input.evidenceCount >= 8,
  ].filter(Boolean).length;

  let confidence = 34 + coverage * 10 + (input.mode === "live" ? 6 : 0);
  confidence = clamp(confidence, 30, 96);
  if (input.mode === "demo") confidence = Math.min(confidence, 62);

  return {
    overall,
    tier: tierFor(overall),
    confidence: round(confidence),
    components,
  };
}

/* -------------------------------------------------------------------------- */
/* Cultural safety lexicon                                                     */
/* -------------------------------------------------------------------------- */

type Rule = {
  code: string;
  label: string;
  penalty: number;
  detail: string;
  /** Risk signal. */
  risk: RegExp;
  /** Opposing signal. When present, the flag only fires across the two sides. */
  counterpart?: RegExp;
  /** Skip the flag when both sides carry the risk signal. */
  skipWhenBothSides?: boolean;
};

const RULES: Rule[] = [
  {
    code: "regulated-substances",
    label: "Regulated category exposure",
    penalty: 5,
    detail:
      "Alcohol, gambling or tobacco-adjacent taste signals invite age-gating, retail restrictions and media-buy limits.",
    risk: /\b(alcohol|spirits|whisk(e)?y|bourbon|tequila|vodka|wine|beer|brewery|distillery|mezcal|sake|cannabis|cbd|tobacco|vaping|gambling|betting|casino)\b/i,
    skipWhenBothSides: true,
  },
  {
    code: "body-and-diet-conflict",
    label: "Body-image tension",
    penalty: 11,
    detail:
      "Weight-loss or detox signals on one side sit in direct tension with body-positivity or intuitive-eating signals held by the other audience.",
    risk: /\b(weight loss|diet culture|calorie counting|detox)\b/i,
    counterpart: /\b(body positivity|intuitive eating|body neutrality)\b/i,
  },
  {
    code: "price-tension",
    label: "Price-positioning gap",
    penalty: 8,
    detail:
      "Luxury signals on one side and value or affordability signals on the other create a credibility gap in joint offers.",
    risk: /\b(luxury|haute couture|ultra-premium)\b/i,
    counterpart: /\b(budget|affordable|discount|value shopping)\b/i,
  },
  {
    code: "climate-contradiction",
    label: "Climate contradiction",
    penalty: 13,
    detail:
      "Fossil-fuel or fast-fashion signals conflict with the climate and sustainability signals held by the other audience.",
    risk: /\b(fossil fuel|oil and gas|oil & gas|fast fashion|private aviation)\b/i,
    counterpart: /\b(sustainability|environmentalism|climate action|regenerative)\b/i,
  },
  {
    code: "labour-scrutiny",
    label: "Labour scrutiny",
    penalty: 7,
    detail:
      "Fast-fashion or gig-economy signals invite supply-chain questions that a partner with a public ethics stance must answer.",
    risk: /\b(fast fashion|gig economy|factory farming|ultra fast delivery)\b/i,
    skipWhenBothSides: true,
  },
  {
    code: "health-claims",
    label: "Health-claim risk",
    penalty: 4,
    detail:
      "Supplements, biohacking and wellness-tech signals carry advertising-claim risk in cross-promotions.",
    risk: /\b(supplements|biohacking|wellness tech|nootropics|detox tea)\b/i,
    skipWhenBothSides: true,
  },
];

export const SAFETY_RULE_SUMMARY = RULES.map((rule) => ({
  code: rule.code,
  label: rule.label,
  penalty: rule.penalty,
  detail: rule.detail,
  crossSide: Boolean(rule.counterpart),
  skipWhenBothSides: Boolean(rule.skipWhenBothSides),
}));

function matches(tags: TasteTag[], pattern: RegExp) {
  return tags.some((tag) => pattern.test(tag.name));
}

export function assessCulturalSafety(
  tagsA: TasteTag[],
  tagsB: TasteTag[],
  extra: SafetyFlag[] = [],
): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  for (const rule of RULES) {
    const riskA = matches(tagsA, rule.risk);
    const riskB = matches(tagsB, rule.risk);

    if (!riskA && !riskB) continue;
    if (rule.skipWhenBothSides && riskA && riskB) continue;

    if (rule.counterpart) {
      const counterA = matches(tagsA, rule.counterpart);
      const counterB = matches(tagsB, rule.counterpart);
      const crossConflict = (riskA && counterB) || (riskB && counterA);
      if (!crossConflict) continue;
    }

    flags.push({
      code: rule.code,
      label: rule.label,
      penalty: rule.penalty,
      detail: rule.detail,
    });
  }

  for (const flag of extra) {
    if (!flags.some((existing) => existing.code === flag.code)) {
      flags.push(flag);
    }
  }

  return flags;
}
