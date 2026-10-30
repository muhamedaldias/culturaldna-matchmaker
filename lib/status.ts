import type { RuntimeStatus } from "@/lib/types";
import { hasGeminiKey, hasQlooKey, runtimeMode, runtimeReason } from "@/lib/env";
import { FIXTURE_OPTIONS } from "@/lib/fixtures";

export function buildRuntimeStatus(): RuntimeStatus {
  return {
    mode: runtimeMode(),
    qloo: hasQlooKey(),
    gemini: hasGeminiKey(),
    reason: runtimeReason(),
    fixtures: FIXTURE_OPTIONS,
  };
}
