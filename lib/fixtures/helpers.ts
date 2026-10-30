import type {
  AgentId,
  BrandRef,
  CitySignal,
  EvidenceProbe,
  TagDomain,
  TasteTag,
  TrendSeries,
} from "@/lib/types";

export function tag(
  id: string,
  name: string,
  domain: TagDomain,
  score: number,
  note?: string,
): TasteTag {
  return { id, name, domain, score, ...(note ? { note } : {}) };
}

export function brand(input: BrandRef): BrandRef {
  return input;
}

export function city(
  rank: number,
  name: string,
  affinity: number,
  region?: string,
  country = "United States",
): CitySignal {
  return { rank, name, affinity, ...(region ? { region } : {}), country };
}

const START = new Date("2025-11-01T00:00:00Z");

export function trend(
  entity: string,
  domain: string,
  values: number[],
  deltaLabel?: string,
): TrendSeries {
  const points = values.map((value, index) => {
    const date = new Date(START);
    date.setUTCMonth(START.getUTCMonth() + index);
    return {
      date: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`,
      value,
    };
  });
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const raw = ((last - first) / Math.max(first, 1)) * 100;
  const momentum = Math.max(-100, Math.min(100, Math.round(raw)));
  return {
    entity,
    domain,
    points,
    momentum,
    deltaLabel: deltaLabel ?? `${momentum >= 0 ? "+" : ""}${momentum}% · 12 mo`,
  };
}

export type ProbeSeed = Omit<EvidenceProbe, "at" | "mode">;

export function probe(seed: ProbeSeed): ProbeSeed {
  return seed;
}

export function probeId(agent: AgentId, suffix: string) {
  return `p-${agent}-${suffix}`;
}
