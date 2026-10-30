import type {
  BrandRef,
  CitySignal,
  DemographicSignal,
  TasteTag,
  TrendSeries,
} from "@/lib/types";
import { domainForTag } from "@/lib/qloo/domains";

type Obj = Record<string, unknown>;

export function asRecord(value: unknown): Obj | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Obj)
    : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function resultsRecord(response: unknown): Obj | undefined {
  return asRecord(asRecord(response)?.results);
}

/** Qloo responses are either `results: []` or `results: { key: [] }`. */
export function resultsList(response: unknown, key: string): Obj[] {
  const root = asRecord(response);
  if (!root) return [];
  const results = root.results;
  if (Array.isArray(results)) return results.filter((item): item is Obj => Boolean(asRecord(item)));
  const record = asRecord(results);
  if (!record) return [];
  const direct = record[key];
  if (Array.isArray(direct)) return direct.filter((item): item is Obj => Boolean(asRecord(item)));
  if (Array.isArray(record.entities)) {
    return record.entities.filter((item): item is Obj => Boolean(asRecord(item)));
  }
  return [];
}

export function compareTags(response: unknown): { shared: Obj[]; a: Obj[]; b: Obj[] } {
  const root = asRecord(response);
  const results = root?.results;
  if (Array.isArray(results)) {
    return { shared: results.filter((item): item is Obj => Boolean(asRecord(item))), a: [], b: [] };
  }
  const record = asRecord(results);
  const shared = asArray(record?.tags).filter((item): item is Obj => Boolean(asRecord(item)));
  return {
    shared,
    a: asArray(record?.a).filter((item): item is Obj => Boolean(asRecord(item))),
    b: asArray(record?.b).filter((item): item is Obj => Boolean(asRecord(item))),
  };
}

export function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function affinity(value: unknown): number {
  const parsed = numberValue(value);
  if (parsed === undefined) return 0;
  const normalised = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0, normalised));
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function propertiesOf(raw: Obj): Obj | undefined {
  return asRecord(raw.properties);
}

function tagName(raw: Obj): string | undefined {
  return text(raw.name) ?? text(asRecord(raw.properties)?.name);
}

function tagId(raw: Obj, name: string): string {
  return (
    text(raw.tag_id) ??
    text(raw.id) ??
    text(raw.entity_id) ??
    `tag:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  );
}

function tagScore(raw: Obj): number {
  const query = asRecord(raw.query);
  return affinity(
    query?.score ??
      query?.affinity ??
      raw.affinity ??
      raw.score ??
      raw.popularity,
  );
}

export function toTasteTag(raw: Obj): TasteTag | undefined {
  const name = tagName(raw);
  if (!name) return undefined;
  const typeHint = text(raw.subtype) ?? text(raw.type);
  return {
    id: tagId(raw, name),
    name,
    domain: domainForTag(name, typeHint),
    score: tagScore(raw),
  };
}

export function dedupeTags(tags: TasteTag[]): TasteTag[] {
  const seen = new Map<string, TasteTag>();
  for (const tag of tags) {
    const key = tag.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || existing.score < tag.score) seen.set(key, tag);
  }
  return [...seen.values()];
}

export function toBrand(raw: Obj): BrandRef | undefined {
  const properties = propertiesOf(raw);
  const name = text(raw.name) ?? text(properties?.name);
  if (!name) return undefined;
  const id = text(raw.entity_id) ?? text(raw.id);
  if (!id) return undefined;
  const description =
    text(properties?.description) ?? text(properties?.short_description) ?? undefined;
  const image = properties?.image;
  const imageUrl =
    text(image) ??
    (asRecord(image) ? text(asRecord(image)?.url) ?? text(asRecord(image)?.src) : undefined);

  return {
    id,
    name,
    type: "brand",
    subtype: text(raw.subtype) ?? text(raw.type) ?? undefined,
    description,
    popularity: affinity(raw.popularity ?? properties?.popularity),
    imageUrl,
  };
}

function splitCity(name: string): { city: string; region?: string } {
  const [city, region] = name.split(",").map((part) => part.trim());
  return region ? { city, region } : { city: name };
}

export function toCitySignal(raw: Obj, rank: number): CitySignal | undefined {
  const properties = propertiesOf(raw);
  const address = asRecord(properties?.address);
  const rawName =
    text(raw.name) ??
    text(properties?.name) ??
    text(address?.locality) ??
    text(properties?.locality);
  if (!rawName) return undefined;
  const { city, region } = splitCity(rawName);
  return {
    name: city,
    rank,
    affinity: affinity(asRecord(raw.query)?.affinity ?? raw.affinity),
    region: region ?? text(address?.region) ?? text(properties?.region) ?? undefined,
    country: text(address?.country) ?? text(properties?.country) ?? undefined,
  };
}

export function toDemographic(raw: Obj): DemographicSignal | undefined {
  const name =
    text(raw.name) ??
    text(propertiesOf(raw)?.name) ??
    text(raw.subtype) ??
    text(raw.type);
  if (!name) return undefined;
  return {
    segment: name.replace(/^urn:demographics:/, "").replace(/[-_]/g, " "),
    affinity: affinity(asRecord(raw.query)?.affinity ?? raw.affinity ?? raw.popularity),
  };
}

export type TrendRow = {
  date: string;
  value: number;
  entity?: string;
};

export function toTrendRows(response: unknown): TrendRow[] {
  const rows = resultsList(response, "trending");
  const parsed: TrendRow[] = [];
  for (const row of rows) {
    const date = text(row.date) ?? text(row.created_at) ?? text(row.timestamp);
    const value = numberValue(row.population_percentile ?? row.value ?? row.percentile);
    if (!date || value === undefined) continue;
    parsed.push({
      date: date.slice(0, 10),
      value: value <= 1 ? value * 100 : value,
      entity: text(row.entity) ?? text(row.name) ?? text(row.entity_id),
    });
  }
  return parsed.sort((left, right) => left.date.localeCompare(right.date));
}

export function rowsToTrendSeries(rows: TrendRow[], entity: string, domain: string): TrendSeries {
  const points = rows.slice(-12).map((row) => ({ date: row.date, value: Math.round(row.value) }));
  if (points.length === 0) {
    return { entity, domain, points: [], momentum: 0, deltaLabel: "No data" };
  }
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const momentum = Math.max(-100, Math.min(100, Math.round(((last - first) / Math.max(first, 1)) * 100)));
  return {
    entity,
    domain,
    points,
    momentum,
    deltaLabel: `${momentum >= 0 ? "+" : ""}${momentum}% · ${points.length} mo`,
  };
}

export function pickTop<T>(items: T[], score: (item: T) => number, limit: number): T[] {
  return [...items].sort((left, right) => score(right) - score(left)).slice(0, limit);
}

/** Normalise cross-domain entity rows into the compact list the memo cites. */
export function toCrossDomainItems(
  response: unknown,
  limit: number,
): { name: string; affinity: number }[] {
  const items = resultsList(response, "entities")
    .map((raw) => {
      const properties = propertiesOf(raw);
      const name = text(raw.name) ?? text(properties?.name) ?? "";
      const score = asRecord(raw.query)?.affinity ?? raw.affinity ?? raw.popularity;
      return { name: name.trim(), affinity: affinity(score) };
    })
    .filter((item) => Boolean(item.name));
  return pickTop(items, (item) => item.affinity, limit);
}
