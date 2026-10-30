import { describe, expect, it } from "vitest";
import { FIXTURES, resolveFixture } from "@/lib/fixtures";
import { buildDemoReport } from "@/lib/fixtures/build";
import { tierFor } from "@/lib/scoring";

describe("demo fixtures", () => {
  it("ships three curated pairs", () => {
    expect(FIXTURES).toHaveLength(3);
  });

  it.each(FIXTURES.map((fixture) => [fixture.slug, fixture] as const))(
    "%s builds a complete report",
    (_slug, fixture) => {
      const report = buildDemoReport(fixture, new Date("2026-10-30T12:00:00Z"));

      expect(report.mode).toBe("demo");
      expect(report.pair.a.name).toBe(fixture.a.name);
      expect(report.pair.b.name).toBe(fixture.b.name);
      expect(report.scores.overall).toBeGreaterThan(0);
      expect(report.scores.overall).toBeLessThanOrEqual(100);
      expect(report.scores.tier).toBe(tierFor(report.scores.overall));
      expect(report.scores.components).toHaveLength(5);
      expect(report.dna.shared.length).toBeGreaterThanOrEqual(8);
      expect(report.dna.uniqueA.length).toBeGreaterThanOrEqual(4);
      expect(report.dna.uniqueB.length).toBeGreaterThanOrEqual(4);
      expect(report.cities.length).toBeGreaterThanOrEqual(6);
      expect(report.trends.length).toBeGreaterThanOrEqual(2);
      expect(report.crossDomain.length).toBeGreaterThanOrEqual(2);
      expect(report.plays).toHaveLength(3);
      expect(report.risks.length).toBeGreaterThanOrEqual(3);
      expect(report.blind.misses.length).toBeGreaterThan(0);
      expect(report.informed.paragraphs.length).toBeGreaterThan(0);
      expect(report.caveats[0]).toContain("Demo mode");
      expect(report.scores.confidence).toBeLessThanOrEqual(62);
    },
  );

  it("keeps evidence ids unique and referenced by plays", () => {
    for (const fixture of FIXTURES) {
      const report = buildDemoReport(fixture);
      const ids = report.evidence.map((probe) => probe.id);
      expect(new Set(ids).size).toBe(ids.length);
      const referenced = [
        ...report.plays.flatMap((play) => play.evidenceRefs),
        ...report.risks.flatMap((risk) => risk.evidenceRefs),
      ];
      for (const ref of referenced) {
        expect(ids).toContain(ref);
      }
      expect(report.evidence.some((probe) => probe.selectedBy === "model")).toBe(true);
    }
  });

  it("sorts shared tags by affinity", () => {
    for (const fixture of FIXTURES) {
      const report = buildDemoReport(fixture);
      const scores = report.dna.shared.map((tag) => tag.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    }
  });

  it("resolves pairs in either order without changing the fixture", () => {
    const forward = resolveFixture("Patagonia", "Whole Foods Market");
    const reverse = resolveFixture("Whole Foods Market", "Patagonia");
    expect(forward?.fixture.slug).toBe("patagonia-whole-foods");
    expect(forward?.swapped).toBe(false);
    expect(reverse?.fixture.slug).toBe("patagonia-whole-foods");
    expect(reverse?.swapped).toBe(true);
  });

  it("normalises punctuation and ampersands", () => {
    expect(resolveFixture("whole foods", "PATAGONIA")?.fixture.slug).toBe(
      "patagonia-whole-foods",
    );
    expect(resolveFixture("Nike", "Spotify")?.fixture.slug).toBe("nike-spotify");
  });

  it("returns undefined for an unknown pair", () => {
    expect(resolveFixture("Patagonia", "Ferrari")).toBeUndefined();
  });
});
