import { z } from "zod";

export const blindTakeSchema = z.object({
  guess: z.string().min(20).max(280),
  rationale: z.string().min(40).max(900),
  predicted_overlap: z.array(z.string().min(2).max(60)).min(3).max(7),
});

export type BlindTakeOutput = z.infer<typeof blindTakeSchema>;

export const probePlanSchema = z.object({
  rationale: z.string().min(20).max(500),
  probes: z
    .array(
      z.object({
        entity_type: z.enum([
          "book",
          "podcast",
          "tv_show",
          "video_game",
          "place",
          "person",
        ]),
        question: z.string().min(10).max(180),
      }),
    )
    .min(1)
    .max(2),
});

export type ProbePlanOutput = z.infer<typeof probePlanSchema>;

const playSchema = z.object({
  title: z.string().min(3).max(70),
  thesis: z.string().min(80).max(700),
  format: z.string().min(10).max(160),
  city: z.string().min(2).max(80),
  audience: z.string().min(5).max(140),
  success_signals: z.array(z.string().min(8).max(150)).min(2).max(4),
  evidence_refs: z.array(z.string().min(2).max(60)).min(1).max(4),
  confidence: z.enum(["high", "medium", "low"]),
});

const riskSchema = z.object({
  title: z.string().min(3).max(80),
  severity: z.enum(["high", "medium", "low"]),
  detail: z.string().min(60).max(600),
  mitigation: z.string().min(40).max(500),
  evidence_refs: z.array(z.string().min(2).max(60)).min(0).max(3),
});

export const memoDraftSchema = z.object({
  verdict: z.object({
    headline: z.string().min(10).max(120),
    summary: z.string().min(120).max(900),
    posture: z.string().min(10).max(160),
  }),
  informed: z.object({
    headline: z.string().min(10).max(140),
    paragraphs: z.array(z.string().min(120).max(1100)).min(2).max(4),
  }),
  blind_misses: z.array(z.string().min(20).max(240)).min(2).max(4),
  plays: z.array(playSchema).length(3),
  risks: z.array(riskSchema).min(3).max(4),
});

export type MemoDraft = z.infer<typeof memoDraftSchema>;
