import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { geminiModel, hasGeminiKey } from "@/lib/env";

export class GeminiError extends Error {
  readonly code: "GEMINI_CONFIG" | "GEMINI_TIMEOUT" | "GEMINI_PARSE" | "GEMINI_UPSTREAM" | "GEMINI_CANCELLED";
  readonly recovery: string;

  constructor(
    code: GeminiError["code"],
    message: string,
    recovery = "The deterministic strategist will write the memo instead.",
  ) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.recovery = recovery;
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!hasGeminiKey()) {
    throw new GeminiError(
      "GEMINI_CONFIG",
      "GEMINI_API_KEY is not configured.",
      "Add GEMINI_API_KEY to .env.local, or continue with the deterministic memo.",
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
  }
  return client;
}

/** Gemini's JSON-schema subset rejects $schema and additionalProperties. */
function sanitiseSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitiseSchema);
  if (node && typeof node === "object") {
    const source = node as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (key === "$schema" || key === "additionalProperties") continue;
      output[key] = sanitiseSchema(value);
    }
    return output;
  }
  return node;
}

function extractJson(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return cleaned;
  return cleaned.slice(start, end + 1);
}

export type GenerateOptions<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

export type GenerateResult<T> = {
  data: T;
  raw: string;
  model: string;
  durationMs: number;
};

export async function generateJson<T>(options: GenerateOptions<T>): Promise<GenerateResult<T>> {
  const ai = getClient();
  const model = geminiModel();
  const started = Date.now();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        systemInstruction: options.system,
        responseMimeType: "application/json",
        responseJsonSchema: sanitiseSchema(z.toJSONSchema(options.schema)),
        temperature: options.temperature ?? 0.75,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        ...(options.signal ? { abortSignal: options.signal } : {}),
      },
    });

    const raw = response.text ?? "";
    if (!raw.trim()) {
      throw new GeminiError("GEMINI_PARSE", "Gemini returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      throw new GeminiError(
        "GEMINI_PARSE",
        "Gemini returned malformed JSON.",
        "Retry the analysis; the deterministic memo is used if it fails again.",
      );
    }

    const validated = options.schema.safeParse(parsed);
    if (!validated.success) {
      throw new GeminiError(
        "GEMINI_PARSE",
        `Gemini output did not match the memo schema: ${validated.error.issues[0]?.message ?? "unknown issue"}`,
        "Retry; the deterministic memo is used if it fails again.",
      );
    }

    return {
      data: validated.data,
      raw,
      model,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if (options.signal?.aborted) {
      throw new GeminiError("GEMINI_CANCELLED", "Gemini call cancelled.", "Run the analysis again.");
    }
    const message = error instanceof Error ? error.message : "Unknown Gemini failure.";
    if (/timeout|aborted|AbortError/i.test(message)) {
      throw new GeminiError("GEMINI_TIMEOUT", "Gemini did not respond in time.");
    }
    throw new GeminiError("GEMINI_UPSTREAM", `Gemini request failed: ${message}`);
  }
}
