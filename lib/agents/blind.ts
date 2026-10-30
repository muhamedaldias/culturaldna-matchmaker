import type { BlindTake, BrandRef } from "@/lib/types";
import { blindTakeSchema } from "@/lib/agents/schemas";
import { generateJson, GeminiError } from "@/lib/agents/gemini";
import { BLIND_SYSTEM, buildBlindPrompt } from "@/lib/agents/prompts";
import { hasGeminiKey } from "@/lib/env";
import type { AgentNotify } from "@/lib/agents/shared";

export type BlindTakeResult = {
  blind: BlindTake;
  modelCalls: number;
  durationMs: number;
  warning?: string;
};

function subtypeLabel(brand: BrandRef): string {
  const raw = brand.subtype?.replace(/^urn:entity:/, "").replace(/[_-]+/g, " ");
  return raw || "consumer brand";
}

/**
 * The honest baseline: what a strategist can say about a pairing with only
 * category labels and no audience evidence. This is deliberately generic —
 * that is the point of the comparison.
 */
export function heuristicBlindTake(a: BrandRef, b: BrandRef): BlindTake {
  const categoryA = subtypeLabel(a);
  const categoryB = subtypeLabel(b);

  return {
    guess: `${a.name} and ${b.name} would co-sign a seasonal cross-promotion aimed at the customers they appear to share.`,
    rationale: `Reading from category labels alone — ${a.name} as ${categoryA}, ${b.name} as ${categoryB} — the safe answer is a co-branded campaign that borrows each other's reach. That reasoning can describe a media plan. It cannot name the rituals both audiences already keep, rank the cities where the pairing is strongest, or show where the two value systems would collide. This is the heuristic baseline, produced without a model call.`,
    predictedOverlap: [
      "shared customers",
      "cross-promotion",
      "seasonal campaign",
      "category adjacency",
    ],
    misses: [],
    source: "curated",
  };
}

export async function runBlindTake(
  a: BrandRef,
  b: BrandRef,
  options: { signal?: AbortSignal; notify?: AgentNotify } = {},
): Promise<BlindTakeResult> {
  if (!hasGeminiKey()) {
    const blind = heuristicBlindTake(a, b);
    options.notify?.(
      "Blind take recorded from category logic (Gemini not configured).",
      blind.guess,
      "done",
    );
    return {
      blind,
      modelCalls: 0,
      durationMs: 0,
      warning:
        "Gemini is not configured, so the blind take is a category-only heuristic rather than a model guess.",
    };
  }

  const started = Date.now();
  try {
    const result = await generateJson({
      system: BLIND_SYSTEM,
      prompt: buildBlindPrompt(a, b),
      schema: blindTakeSchema,
      temperature: 0.65,
      maxOutputTokens: 900,
      ...(options.signal ? { signal: options.signal } : {}),
    });

    const blind: BlindTake = {
      guess: result.data.guess,
      rationale: result.data.rationale,
      predictedOverlap: result.data.predicted_overlap,
      misses: [],
      source: "gemini",
    };

    options.notify?.(
      `Blind take committed before the evidence (${result.model}).`,
      blind.guess,
      "done",
    );

    return {
      blind,
      modelCalls: 1,
      durationMs: result.durationMs,
    };
  } catch (error) {
    if (error instanceof GeminiError && error.code === "GEMINI_CANCELLED") throw error;

    const message =
      error instanceof GeminiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The blind take failed.";

    options.notify?.(
      "Gemini blind take failed — falling back to category heuristics.",
      message,
      "warn",
    );

    return {
      blind: heuristicBlindTake(a, b),
      modelCalls: 0,
      durationMs: Date.now() - started,
      warning: message,
    };
  }
}
