import type {
  AgentId,
  AgentTraceEntry,
  BrandRef,
  CitySignal,
  CrossDomainGroup,
  DemographicSignal,
  EvidenceProbe,
  TasteTag,
  TrendSeries,
} from "@/lib/types";
import { QlooApiError, qloo } from "@/lib/qloo/client";
import {
  asRecord,
  compareTags,
  dedupeTags,
  pickTop,
  resultsList,
  rowsToTrendSeries,
  toBrand,
  toCitySignal,
  toCrossDomainItems,
  toDemographic,
  toTasteTag,
  toTrendRows,
} from "@/lib/qloo/normalize";

export type LiveHooks = {
  stage: (agent: AgentId, status: "start" | "done" | "warn" | "error", label: string) => void;
  trace: (entry: Omit<AgentTraceEntry, "id" | "at">) => void;
  probe: (probe: EvidenceProbe) => void;
};

export type LiveDataset = {
  a: BrandRef;
  b: BrandRef;
  tagsA: TasteTag[];
  tagsB: TasteTag[];
  shared: TasteTag[];
  uniqueA: TasteTag[];
  uniqueB: TasteTag[];
  cities: CitySignal[];
  demographics: { a: DemographicSignal[]; b: DemographicSignal[]; sharedNote: string };
  trends: TrendSeries[];
  crossDomain: CrossDomainGroup[];
  warnings: string[];
  probes: EvidenceProbe[];
  location: string;
};

export type ProbeRun<T> = {
  id: string;
  agent: AgentId;
  label: string;
  endpoint: string;
  params: Record<string, string | number>;
  note?: string;
  selectedBy?: "pipeline" | "model";
  run: () => Promise<unknown>;
  select: (response: unknown) => T;
  fallback: T;
};

function countResults(response: unknown): number {
  const results = asRecord(response)?.results;
  if (Array.isArray(results)) return results.length;
  const record = asRecord(results);
  if (!record) return 0;
  const candidate = record.entities ?? record.tags ?? record.trending ?? record.results;
  return Array.isArray(candidate) ? candidate.length : 0;
}

function cancelError(error: unknown): boolean {
  return error instanceof QlooApiError && error.code === "QLOO_CANCELLED";
}

export class LiveCollector {
  private hooks: LiveHooks;
  private signal?: AbortSignal;
  private warnings: string[] = [];
  private probes: EvidenceProbe[] = [];
  private location: string;

  constructor(hooks: LiveHooks, location: string, signal?: AbortSignal) {
    this.hooks = hooks;
    this.location = location;
    this.signal = signal;
  }

  private async run<T>(probe: ProbeRun<T>): Promise<T> {
    const started = Date.now();
    try {
      const response = await probe.run();
      const selected = probe.select(response);
      const record: EvidenceProbe = {
        id: probe.id,
        agent: probe.agent,
        label: probe.label,
        endpoint: probe.endpoint,
        params: probe.params,
        resultCount: countResults(response),
        note: probe.note,
        durationMs: Date.now() - started,
        at: new Date().toISOString(),
        mode: "live",
        selectedBy: probe.selectedBy ?? "pipeline",
      };
      this.probes.push(record);
      this.hooks.probe(record);
      return selected;
    } catch (error) {
      if (cancelError(error)) throw error;
      const message =
        error instanceof QlooApiError
          ? `${error.message} (${error.code})`
          : error instanceof Error
            ? error.message
            : "Unknown Qloo failure.";
      this.warnings.push(`${probe.label}: ${message}`);
      this.hooks.trace({
        agent: probe.agent,
        message: `${probe.label} failed — continuing with partial evidence.`,
        detail: message,
        status: "warn",
      });
      return probe.fallback;
    }
  }

  async resolveBrand(name: string, key: "a" | "b"): Promise<BrandRef> {
    const query = name.trim();
    const id = `live-search-${key}`;

    const candidates = await this.run<BrandRef[]>({
      id,
      agent: "scout",
      label: `Resolve brand — ${query}`,
      endpoint: "/search",
      params: { query, types: "urn:entity:brand", take: 5 },
      run: () => qloo.search(query, "urn:entity:brand", { take: 5, signal: this.signal }),
      select: (response) =>
        resultsList(response, "entities")
          .map(toBrand)
          .filter((brand): brand is BrandRef => Boolean(brand)),
      fallback: [],
    });

    const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const exact = candidates.find((candidate) => normalise(candidate.name) === normalise(query));
    const chosen = exact ?? candidates[0];

    if (!chosen) {
      throw new QlooApiError(
        "QLOO_CONTRACT",
        `Qloo could not resolve “${query}” as a brand.`,
        {
          recovery:
            "Use the brand's official name, or try one of the curated demo pairs. Qloo resolves entities, not product names.",
        },
      );
    }

    this.hooks.trace({
      agent: "scout",
      message: `Matched ${chosen.name}${chosen.subtype ? ` — ${chosen.subtype.replace("urn:entity:", "")}` : ""}.`,
      detail: `entity_id ${chosen.id}`,
      status: "done",
      durationMs: 0,
    });

    return chosen;
  }

  async confirmEntities(ids: string[]): Promise<void> {
    await this.run<boolean>({
      id: "live-entities",
      agent: "scout",
      label: "Confirm entity records",
      endpoint: "/entities",
      params: { entity_ids: ids.join(",") },
      run: () => qloo.entities(ids, { signal: this.signal }),
      select: () => true,
      fallback: false,
    });
  }

  /** Run an extra probe chosen by the Strategist model, streamed like any other. */
  async executeProbe<T>(probe: ProbeRun<T>): Promise<T> {
    return this.run(probe);
  }

  async collect(a: BrandRef, b: BrandRef): Promise<LiveDataset> {
    const tagLimit = 40;

    this.hooks.stage("ethnographer", "start", "Mapping taste");
    const [tagsARaw, tagsBRaw] = await Promise.all([
      this.run<TasteTag[]>({
        id: "live-tags-a",
        agent: "ethnographer",
        label: `Taste tags — ${a.name}`,
        endpoint: "/v2/insights",
        params: {
          "filter.type": "urn:tag",
          "signal.interests.entities": a.id,
          take: tagLimit,
        },
        run: () =>
          qloo.insights(
            {
              "filter.type": "urn:tag",
              "signal.interests.entities": a.id,
              take: tagLimit,
            },
            { signal: this.signal },
          ),
        select: (response) =>
          pickTop(
            dedupeTags(
              resultsList(response, "entities")
                .map(toTasteTag)
                .filter((tag): tag is TasteTag => Boolean(tag)),
            ),
            (tag) => tag.score,
            24,
          ),
        fallback: [],
      }),
      this.run<TasteTag[]>({
        id: "live-tags-b",
        agent: "ethnographer",
        label: `Taste tags — ${b.name}`,
        endpoint: "/v2/insights",
        params: {
          "filter.type": "urn:tag",
          "signal.interests.entities": b.id,
          take: tagLimit,
        },
        run: () =>
          qloo.insights(
            {
              "filter.type": "urn:tag",
              "signal.interests.entities": b.id,
              take: tagLimit,
            },
            { signal: this.signal },
          ),
        select: (response) =>
          pickTop(
            dedupeTags(
              resultsList(response, "entities")
                .map(toTasteTag)
                .filter((tag): tag is TasteTag => Boolean(tag)),
            ),
            (tag) => tag.score,
            24,
          ),
        fallback: [],
      }),
    ]);

    this.hooks.stage("ethnographer", "done", "Taste mapped");

    const [demographicsA, demographicsB] = await Promise.all([
      this.run<DemographicSignal[]>({
        id: "live-demo-a",
        agent: "ethnographer",
        label: `Audience profile — ${a.name}`,
        endpoint: "/v2/insights",
        params: {
          "filter.type": "urn:demographics",
          "signal.interests.entities": a.id,
          take: 25,
        },
        run: () =>
          qloo.insights(
            {
              "filter.type": "urn:demographics",
              "signal.interests.entities": a.id,
              take: 25,
            },
            { signal: this.signal },
          ),
        select: (response) =>
          pickTop(
            resultsList(response, "entities")
              .map(toDemographic)
              .filter((item): item is DemographicSignal => Boolean(item)),
            (item) => item.affinity,
            5,
          ),
        fallback: [],
      }),
      this.run<DemographicSignal[]>({
        id: "live-demo-b",
        agent: "ethnographer",
        label: `Audience profile — ${b.name}`,
        endpoint: "/v2/insights",
        params: {
          "filter.type": "urn:demographics",
          "signal.interests.entities": b.id,
          take: 25,
        },
        run: () =>
          qloo.insights(
            {
              "filter.type": "urn:demographics",
              "signal.interests.entities": b.id,
              take: 25,
            },
            { signal: this.signal },
          ),
        select: (response) =>
          pickTop(
            resultsList(response, "entities")
              .map(toDemographic)
              .filter((item): item is DemographicSignal => Boolean(item)),
            (item) => item.affinity,
            5,
          ),
        fallback: [],
      }),
    ]);

    this.hooks.stage("diplomat", "start", "Comparing taste");
    const compare = await this.run<TasteTag[]>({
      id: "live-compare",
      agent: "diplomat",
      label: "Shared vs unique taste",
      endpoint: "/v2/analysis/compare",
      params: {
        "a.signal.interests.entities": a.id,
        "b.signal.interests.entities": b.id,
        "filter.type": "urn:tag",
        take: tagLimit,
      },
      run: () =>
        qloo.compare(
          {
            "a.signal.interests.entities": a.id,
            "b.signal.interests.entities": b.id,
            "filter.type": "urn:tag",
            take: tagLimit,
          },
          { signal: this.signal },
        ),
      select: (response) =>
        pickTop(
          dedupeTags(
            compareTags(response)
              .shared.map(toTasteTag)
              .filter((tag): tag is TasteTag => Boolean(tag)),
          ),
          (tag) => tag.score,
          16,
        ),
      fallback: [],
    });

    const shared = this.reconcileShared(tagsARaw, tagsBRaw, compare);
    const sharedNames = new Set(shared.map((tag) => tag.name.toLowerCase()));
    const uniqueA = tagsARaw.filter((tag) => !sharedNames.has(tag.name.toLowerCase())).slice(0, 8);
    const uniqueB = tagsBRaw.filter((tag) => !sharedNames.has(tag.name.toLowerCase())).slice(0, 8);

    this.hooks.trace({
      agent: "diplomat",
      message:
        shared.length > 0
          ? `${shared.length} shared taste signals survived the top-${tagLimit} cut.`
          : "No shared tags returned; falling back to brand-level signals.",
      status: shared.length > 0 ? "done" : "warn",
    });
    this.hooks.stage("diplomat", "done", "Taste compared");

    this.hooks.stage("cartographer", "start", "Mapping places");
    const cities = await this.run<CitySignal[]>({
      id: "live-heatmap",
      agent: "cartographer",
      label: "City affinity",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:heatmap",
        "signal.interests.entities": `${a.id},${b.id}`,
        ...(this.location.toLowerCase() === "global"
          ? {}
          : { "filter.location.query": this.location }),
        take: 50,
      },
      run: () =>
        qloo.insights(
          {
            "filter.type": "urn:heatmap",
            "signal.interests.entities": [a.id, b.id],
            ...(this.location.toLowerCase() === "global"
              ? {}
              : { "filter.location.query": this.location }),
            take: 50,
          },
          { signal: this.signal },
        ),
      select: (response) => {
        const seen = new Set<string>();
        const mapped = resultsList(response, "entities")
          .map((raw, index) => toCitySignal(raw, index + 1))
          .filter((city): city is CitySignal => Boolean(city))
          .filter((city) => {
            const key = city.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        return pickTop(mapped, (city) => city.affinity, 10).map((city, index) => ({
          ...city,
          rank: index + 1,
        }));
      },
      fallback: [],
    });
    this.hooks.stage("cartographer", "done", "Places mapped");

    this.hooks.stage("timekeeper", "start", "Reading momentum");
    const end = new Date();
    const start = new Date(end);
    start.setUTCFullYear(end.getUTCFullYear() - 1);
    const dateParams = {
      "filter.type": "urn:entity:brand",
      "filter.start_date": start.toISOString().slice(0, 10),
      "filter.end_date": end.toISOString().slice(0, 10),
      take: 50,
    };

    const trendSeries = await Promise.all(
      [
        { brand: a, key: "a" },
        { brand: b, key: "b" },
      ].map(async ({ brand, key }) => {
        const rows = await this.run<ReturnType<typeof toTrendRows>>({
          id: `live-trends-${key}`,
          agent: "timekeeper",
          label: `12-month momentum — ${brand.name}`,
          endpoint: "/v2/trending",
          params: { ...dateParams, "signal.interests.entities": brand.id },
          run: () =>
            qloo.trending(
              { ...dateParams, "signal.interests.entities": brand.id },
              { signal: this.signal },
            ),
          select: (response) => toTrendRows(response),
          fallback: [],
        });
        return rowsToTrendSeries(rows, brand.name, "brand");
      }),
    );

    this.hooks.stage("timekeeper", "done", "Momentum read");

    this.hooks.stage("ethnographer", "start", "Cross-domain scan");
    const crossDomainSpecs: Array<{
      type: string;
      label: string;
      entityType: CrossDomainGroup["entityType"];
      key: string;
    }> = [
      { type: "urn:entity:artist", label: "Artists", entityType: "artist", key: "artists" },
      { type: "urn:entity:movie", label: "Film", entityType: "movie", key: "film" },
      { type: "urn:entity:destination", label: "Destinations", entityType: "destination", key: "places" },
    ];

    const crossDomain: CrossDomainGroup[] = [];
    for (const spec of crossDomainSpecs) {
      const group = await this.run<CrossDomainGroup["items"]>({
        id: `live-cross-${spec.key}`,
        agent: "ethnographer",
        label: `Cross-domain — ${spec.label.toLowerCase()}`,
        endpoint: "/v2/insights",
        params: {
          "filter.type": spec.type,
          "signal.interests.entities": `${a.id},${b.id}`,
          take: 8,
        },
        run: () =>
          qloo.insights(
            {
              "filter.type": spec.type,
              "signal.interests.entities": [a.id, b.id],
              take: 8,
            },
            { signal: this.signal },
          ),
        select: (response) => toCrossDomainItems(response, 3),
        fallback: [],
      });
      if (group.length > 0) {
        crossDomain.push({
          entityType: spec.entityType,
          domainLabel: spec.label,
          items: group,
        });
      }
    }
    this.hooks.stage("ethnographer", "done", "Cross-domain scan complete");

    return {
      a,
      b,
      tagsA: tagsARaw,
      tagsB: tagsBRaw,
      shared,
      uniqueA,
      uniqueB,
      cities,
      demographics: {
        a: demographicsA,
        b: demographicsB,
        sharedNote: this.demographicNote(demographicsA, demographicsB),
      },
      trends: trendSeries.filter((series) => series.points.length > 1),
      crossDomain,
      warnings: this.warnings,
      probes: this.probes,
      location: this.location,
    };
  }

  private reconcileShared(
    tagsA: TasteTag[],
    tagsB: TasteTag[],
    compare: TasteTag[],
  ): TasteTag[] {
    if (compare.length > 0) return compare.slice(0, 12);
    const byName = new Map(tagsB.map((tag) => [tag.name.toLowerCase(), tag]));
    const derived: TasteTag[] = [];
    for (const tag of tagsA) {
      const other = byName.get(tag.name.toLowerCase());
      if (!other) continue;
      derived.push({ ...tag, score: (tag.score + other.score) / 2 });
    }
    return pickTop(derived, (tag) => tag.score, 12);
  }

  private demographicNote(a: DemographicSignal[], b: DemographicSignal[]): string {
    if (a.length === 0 || b.length === 0) {
      return "Demographic coverage was thin in this run; the partnership thesis does not rely on it.";
    }
    const topA = a[0];
    const topB = b[0];
    return `The strongest shared audience signal is ${topA.segment.toLowerCase()} for ${topA.segment === topB.segment ? "both brands" : "the first brand"}, while the second brand indexes highest on ${topB.segment.toLowerCase()}. Treat these as relative affinities, not audience sizes.`;
  }
}
