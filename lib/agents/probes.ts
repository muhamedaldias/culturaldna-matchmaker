import type { CrossDomainGroup } from "@/lib/types";
import type { LiveCollector, LiveDataset } from "@/lib/qloo/collect";
import { generateJson, GeminiError } from "@/lib/agents/gemini";
import { PROBE_PLANNER_SYSTEM, buildProbePrompt } from "@/lib/agents/prompts";
import { probePlanSchema, type ProbePlanOutput } from "@/lib/agents/schemas";
import { hasGeminiKey } from "@/lib/env";
import { qloo } from "@/lib/qloo/client";
import { toCrossDomainItems } from "@/lib/qloo/normalize";
import type { AgentNotify } from "@/lib/agents/shared";

export const PROBE_ENTITY_TYPES = [
  "book",
  "podcast",
  "tv_show",
  "video_game",
  "place",
  "person",
] as const;

export type ProbeEntityType = (typeof PROBE_ENTITY_TYPES)[number];

const URN: Record<ProbeEntityType, string> = {
  book: "urn:entity:book",
  podcast: "urn:entity:podcast",
  tv_show: "urn:entity:tv_show",
  video_game: "urn:entity:video_game",
  place: "urn:entity:place",
  person: "urn:entity:person",
};

const LABELS: Record<ProbeEntityType, string> = {
  book: "Books",
  podcast: "Podcasts",
  tv_show: "Television",
  video_game: "Games",
  place: "Places",
  person: "People",
};

export type ProbePlanResult = {
  plan: ProbePlanOutput | null;
  modelCalls: number;
  durationMs: number;
  warning?: string;
};

/**
 * Let Gemini choose the next cross-domain question, then keep only probes in
 * domains the fixed pipeline has not already covered.
 */
export async function planProbes(options: {
  dataset: LiveDataset;
  covered: string[];
  signal?: AbortSignal;
  notify?: AgentNotify;
}): Promise<ProbePlanResult> {
  if (!hasGeminiKey()) {
    return { plan: null, modelCalls: 0, durationMs: 0 };
  }

  const started = Date.now();
  try {
    const result = await generateJson({
      system: PROBE_PLANNER_SYSTEM,
      prompt: buildProbePrompt(options.dataset, options.covered),
      schema: probePlanSchema,
      temperature: 0.55,
      maxOutputTokens: 700,
      ...(options.signal ? { signal: options.signal } : {}),
    });

    const covered = new Set(options.covered.map((value) => value.toLowerCase()));
    const seen = new Set<string>();
    const probes = result.data.probes
      .filter((probe) => {
        if (covered.has(LABELS[probe.entity_type].toLowerCase())) return false;
        if (seen.has(probe.entity_type)) return false;
        seen.add(probe.entity_type);
        return true;
      })
      .slice(0, 2);

    if (probes.length === 0) {
      options.notify?.(
        "The planner proposed covered domains only — the fixed pipeline stands.",
        result.data.rationale,
        "warn",
      );
      return { plan: null, modelCalls: 1, durationMs: result.durationMs };
    }

    const plan: ProbePlanOutput = { rationale: result.data.rationale, probes };
    options.notify?.(
      `Strategist chose ${probes.length} follow-up probe${probes.length > 1 ? "s" : ""} outside the fixed pipeline.`,
      result.data.rationale,
      "done",
    );

    return { plan, modelCalls: 1, durationMs: result.durationMs };
  } catch (error) {
    if (error instanceof GeminiError && error.code === "GEMINI_CANCELLED") throw error;

    const message =
      error instanceof GeminiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Probe planning failed.";

    options.notify?.(
      "Probe planning failed — continuing with the fixed pipeline.",
      message,
      "warn",
    );

    return { plan: null, modelCalls: 0, durationMs: Date.now() - started, warning: message };
  }
}

/** Execute the model's probes through the collector so they stream and log like the rest. */
export async function runModelProbes(options: {
  dataset: LiveDataset;
  collector: LiveCollector;
  plan: ProbePlanOutput;
  signal?: AbortSignal;
}): Promise<CrossDomainGroup[]> {
  const { dataset, collector, plan, signal } = options;
  const groups: CrossDomainGroup[] = [];

  for (const probe of plan.probes) {
    const entityType = probe.entity_type as ProbeEntityType;
    const params: Record<string, string | number> = {
      "filter.type": URN[entityType],
      "signal.interests.entities": `${dataset.a.id},${dataset.b.id}`,
      take: 8,
    };

    const items = await collector.executeProbe({
      id: `live-model-${entityType}`,
      agent: "strategist",
      label: `Model-selected probe — ${LABELS[entityType].toLowerCase()}`,
      endpoint: "/v2/insights",
      params,
      note: probe.question,
      selectedBy: "model",
      run: () =>
        qloo.insights(
          {
            ...params,
            "signal.interests.entities": [dataset.a.id, dataset.b.id],
          },
          { signal },
        ),
      select: (response) => toCrossDomainItems(response, 3),
      fallback: [],
    });

    if (items.length > 0) {
      groups.push({
        entityType,
        domainLabel: LABELS[entityType],
        items,
      });
    }
  }

  return groups;
}
