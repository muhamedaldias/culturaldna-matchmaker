/**
 * The report contract. Everything the UI renders comes from this shape, so
 * the demo provider and the live Qloo pipeline produce interchangeable data.
 */

export type Mode = "live" | "demo";

export type AgentId =
  | "orchestrator"
  | "scout"
  | "ethnographer"
  | "diplomat"
  | "cartographer"
  | "timekeeper"
  | "strategist"
  | "critic";

export type BrandRef = {
  id: string;
  name: string;
  type: "brand";
  subtype?: string;
  description?: string;
  popularity?: number;
  imageUrl?: string;
};

export type TagDomain =
  | "values"
  | "lifestyle"
  | "food"
  | "music"
  | "film"
  | "travel"
  | "wellness"
  | "sport"
  | "fashion"
  | "culture"
  | "tech"
  | "other";

export type TasteTag = {
  id: string;
  name: string;
  domain: TagDomain;
  /** Relative Qloo affinity, 0..1. */
  score: number;
  /** Optional human note used sparingly in the DNA panel. */
  note?: string;
};

export type CitySignal = {
  name: string;
  region?: string;
  country?: string;
  /** Relative affinity, 0..1. */
  affinity: number;
  rank: number;
};

export type DemographicSignal = {
  segment: string;
  affinity: number;
  note?: string;
};

export type TrendPoint = {
  date: string;
  /** Population percentile, 0..100. */
  value: number;
};

export type TrendSeries = {
  entity: string;
  domain: string;
  points: TrendPoint[];
  /** Normalised change over the window, -100..100. */
  momentum: number;
  deltaLabel: string;
};

export type CrossDomainGroup = {
  entityType:
    | "artist"
    | "movie"
    | "destination"
    | "book"
    | "podcast"
    | "tv_show"
    | "video_game"
    | "place"
    | "person";
  domainLabel: string;
  items: { name: string; affinity: number; note?: string }[];
};

export type Play = {
  index: number;
  title: string;
  thesis: string;
  format: string;
  city: string;
  audience: string;
  successSignals: string[];
  evidenceRefs: string[];
  confidence: "high" | "medium" | "low";
};

export type Risk = {
  title: string;
  severity: "high" | "medium" | "low";
  detail: string;
  mitigation: string;
  evidenceRefs: string[];
};

export type SafetyFlag = {
  code: string;
  label: string;
  penalty: number;
  detail: string;
};

export type BlindTake = {
  guess: string;
  rationale: string;
  predictedOverlap: string[];
  misses: string[];
  source: "gemini" | "curated";
};

export type ScoreKey =
  | "overlap"
  | "complementarity"
  | "momentum"
  | "locality"
  | "safety";

export type ScoreComponent = {
  key: ScoreKey;
  label: string;
  weight: number;
  value: number;
  note: string;
};

export type ScoreTier = "exceptional" | "strong" | "promising" | "cautious" | "misaligned";

export type Scores = {
  overall: number;
  tier: ScoreTier;
  confidence: number;
  components: ScoreComponent[];
};

export type EvidenceProbe = {
  id: string;
  agent: AgentId;
  label: string;
  endpoint: string;
  params: Record<string, string | number>;
  resultCount: number;
  note?: string;
  durationMs: number;
  at: string;
  mode: Mode;
  selectedBy?: "pipeline" | "model";
};

export type AgentTraceEntry = {
  id: string;
  agent: AgentId;
  message: string;
  detail?: string;
  status: "running" | "done" | "warn" | "error";
  at: string;
  durationMs?: number;
};

export type Report = {
  id: string;
  createdAt: string;
  mode: Mode;
  location: string;
  pair: { a: BrandRef; b: BrandRef };
  verdict: {
    headline: string;
    summary: string;
    posture: string;
  };
  scores: Scores;
  dna: {
    shared: TasteTag[];
    uniqueA: TasteTag[];
    uniqueB: TasteTag[];
  };
  cities: CitySignal[];
  demographics: {
    a: DemographicSignal[];
    b: DemographicSignal[];
    sharedNote: string;
  };
  trends: TrendSeries[];
  crossDomain: CrossDomainGroup[];
  plays: Play[];
  risks: Risk[];
  safetyFlags: SafetyFlag[];
  blind: BlindTake;
  informed: {
    headline: string;
    paragraphs: string[];
  };
  evidence: EvidenceProbe[];
  caveats: string[];
  timings: {
    totalMs: number;
    probes: number;
    modelCalls: number;
  };
};

/** Everything that streams to the client before the final report. */
export type AnalyzeEvent =
  | {
      type: "mode";
      mode: Mode;
      reason: string;
      location: string;
      providers: { qloo: boolean; gemini: boolean };
    }
  | {
      type: "stage";
      agent: AgentId;
      status: "start" | "done" | "warn" | "error";
      label: string;
      at: string;
    }
  | { type: "trace"; entry: AgentTraceEntry }
  | { type: "evidence"; probe: EvidenceProbe }
  | { type: "report"; report: Report }
  | {
      type: "error";
      code: string;
      message: string;
      recovery?: string;
    };

export type RuntimeStatus = {
  mode: Mode;
  qloo: boolean;
  gemini: boolean;
  reason: string;
  fixtures: {
    slug: string;
    label: string;
    brands: [string, string];
    subtitle: string;
    location: string;
  }[];
};
