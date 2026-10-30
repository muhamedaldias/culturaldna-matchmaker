import { describe, expect, it } from "vitest";
import {
  WEIGHTS,
  assessCulturalSafety,
  computeScores,
  confidenceBand,
  tierFor,
} from "@/lib/scoring";
import type { CitySignal, SafetyFlag, TasteTag, TrendSeries } from "@/lib/types";

const shared: TasteTag[] = [
  { id: "1", name: "environmentalism", domain: "values", score: 0.9 },
  { id: "2", name: "hiking", domain: "sport", score: 0.8 },
  { id: "3", name: "organic food", domain: "food", score: 0.7 },
];

const uniqueA: TasteTag[] = [
  { id: "4", name: "rock climbing", domain: "sport", score: 0.8 },
  { id: "5", name: "repair culture", domain: "values", score: 0.7 },
];

const uniqueB: TasteTag[] = [
  { id: "6", name: "home cooking", domain: "food", score: 0.8 },
  { id: "7", name: "meditation", domain: "wellness", score: 0.6 },
];

const cities: CitySignal[] = Array.from({ length: 8 }, (_, index) => ({
  rank: index + 1,
  name: `City ${index + 1}`,
  affinity: 0.9 - index * 0.05,
}));

const trends: TrendSeries[] = [
  {
    entity: "A",
    domain: "brand",
    points: [],
    momentum: 20,
    deltaLabel: "+20%",
  },
  {
    entity: "B",
    domain: "brand",
    points: [],
    momentum: 10,
    deltaLabel: "+10%",
  },
];

const noFlags: SafetyFlag[] = [];

function score(overrides: Partial<Parameters<typeof computeScores>[0]> = {}) {
  return computeScores({
    shared,
    uniqueA,
    uniqueB,
    cities,
    trends,
    safetyFlags: noFlags,
    mode: "live",
    evidenceCount: 12,
    crossDomainCount: 3,
    demographicsCount: 5,
    ...overrides,
  });
}

describe("weights", () => {
  it("sum to one", () => {
    const total = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 6);
  });
});

describe("tierFor", () => {
  it.each([
    [95, "exceptional"],
    [85, "exceptional"],
    [84, "strong"],
    [76, "strong"],
    [75, "promising"],
    [66, "promising"],
    [65, "cautious"],
    [52, "cautious"],
    [51, "misaligned"],
  ])("maps %i to %s", (value, tier) => {
    expect(tierFor(value)).toBe(tier);
  });
});

describe("computeScores", () => {
  it("produces every weighted component and an overall inside 0-100", () => {
    const result = score();
    expect(result.components).toHaveLength(5);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    const manual = Math.round(
      result.components.reduce((sum, component) => sum + component.value * component.weight, 0),
    );
    expect(result.overall).toBe(manual);
  });

  it("weights overlap more than complementarity", () => {
    const result = score();
    const overlap = result.components.find((component) => component.key === "overlap");
    const complementarity = result.components.find(
      (component) => component.key === "complementarity",
    );
    expect(overlap?.weight).toBe(0.3);
    expect(complementarity?.weight).toBe(0.15);
  });

  it("returns zero overlap with no shared taste", () => {
    const result = score({ shared: [] });
    expect(result.components.find((component) => component.key === "overlap")?.value).toBe(0);
  });

  it("rewards breadth of exclusive domains but keeps a shared foundation", () => {
    const narrow = score({
      uniqueA: [uniqueA[0]],
      uniqueB: [uniqueB[0]],
    });
    const broad = score({
      uniqueA: [
        ...uniqueA,
        { id: "8", name: "film photography", domain: "culture", score: 0.6 },
        { id: "9", name: "surfing", domain: "travel", score: 0.6 },
      ],
      uniqueB: [
        ...uniqueB,
        { id: "10", name: "natural wine", domain: "lifestyle", score: 0.6 },
        { id: "11", name: "sourdough", domain: "other", score: 0.6 },
      ],
    });
    const value = (input: typeof narrow) =>
      input.components.find((component) => component.key === "complementarity")?.value ?? 0;
    expect(value(broad)).toBeGreaterThan(value(narrow));
  });

  it("keeps momentum neutral without trend data", () => {
    const result = score({ trends: [] });
    expect(result.components.find((component) => component.key === "momentum")?.value).toBe(50);
  });

  it("uses only the five strongest cities for locality", () => {
    const result = score();
    const expected = Math.round(((0.9 + 0.85 + 0.8 + 0.75 + 0.7) / 5) * 100);
    expect(result.components.find((component) => component.key === "locality")?.value).toBe(
      expected,
    );
  });

  it("caps demo confidence and rewards live coverage", () => {
    const live = score({ mode: "live" });
    const demo = score({ mode: "demo" });
    expect(demo.confidence).toBeLessThanOrEqual(62);
    expect(live.confidence).toBeGreaterThan(demo.confidence);
  });

  it("applies safety penalties and floors at 30", () => {
    const flagged = score({
      safetyFlags: [
        { code: "a", label: "A", penalty: 30, detail: "" },
        { code: "b", label: "B", penalty: 60, detail: "" },
      ],
    });
    expect(flagged.components.find((component) => component.key === "safety")?.value).toBe(30);
  });
});

describe("confidenceBand", () => {
  it("bands confidence", () => {
    expect(confidenceBand(90)).toBe("high");
    expect(confidenceBand(60)).toBe("moderate");
    expect(confidenceBand(20)).toBe("thin");
  });
});

describe("assessCulturalSafety", () => {
  it("flags regulated categories held by only one side", () => {
    const flags = assessCulturalSafety(
      [{ id: "1", name: "natural wine", domain: "food", score: 0.7 }],
      [{ id: "2", name: "yoga", domain: "wellness", score: 0.7 }],
    );
    expect(flags.map((flag) => flag.code)).toContain("regulated-substances");
  });

  it("does not flag a regulated category shared by both sides", () => {
    const flags = assessCulturalSafety(
      [{ id: "1", name: "craft beer", domain: "food", score: 0.7 }],
      [{ id: "2", name: "craft beer", domain: "food", score: 0.7 }],
    );
    expect(flags.map((flag) => flag.code)).not.toContain("regulated-substances");
  });

  it("detects a cross-side climate contradiction but not an aligned pair", () => {
    const aligned = assessCulturalSafety(
      [
        { id: "1", name: "sustainability", domain: "values", score: 0.9 },
        { id: "2", name: "environmentalism", domain: "values", score: 0.9 },
      ],
      [
        { id: "3", name: "sustainability", domain: "values", score: 0.9 },
        { id: "4", name: "organic food", domain: "food", score: 0.7 },
      ],
    );
    expect(aligned.map((flag) => flag.code)).not.toContain("climate-contradiction");

    const conflicting = assessCulturalSafety(
      [{ id: "5", name: "fossil fuel", domain: "other", score: 0.7 }],
      [{ id: "6", name: "climate action", domain: "values", score: 0.9 }],
    );
    expect(conflicting.map((flag) => flag.code)).toContain("climate-contradiction");
  });

  it("merges curated flags without duplicating codes", () => {
    const flags = assessCulturalSafety(
      [{ id: "1", name: "natural wine", domain: "food", score: 0.7 }],
      [{ id: "2", name: "yoga", domain: "wellness", score: 0.7 }],
      [{ code: "regulated-substances", label: "Custom", penalty: 2, detail: "" }],
    );
    expect(flags.filter((flag) => flag.code === "regulated-substances")).toHaveLength(1);
  });
});
