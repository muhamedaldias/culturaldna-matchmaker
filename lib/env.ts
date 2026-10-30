export function hasQlooKey(): boolean {
  return Boolean(process.env.QLOO_API_KEY?.trim());
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function runtimeMode(): "live" | "demo" {
  return hasQlooKey() ? "live" : "demo";
}

export function runtimeReason(): string {
  if (hasQlooKey() && hasGeminiKey()) {
    return "Live Qloo taste graph with Gemini agents.";
  }
  if (hasQlooKey()) {
    return "Live Qloo taste graph. Gemini is not configured, so the memo uses the deterministic strategist.";
  }
  return "Qloo credentials are not attached, so memos replay from the curated archive. The full live pipeline ships in the repository.";
}
