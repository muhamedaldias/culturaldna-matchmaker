/**
 * Minimal, server-only Qloo client for the hackathon API.
 *
 * - GET only, X-Api-Key auth, base URL https://hackathon.api.qloo.com
 * - three concurrent requests, 230 ms minimum gap between starts
 * - exponential backoff on 429/5xx, six-hour in-memory cache
 * - normalised error taxonomy so the orchestrator can recover gracefully
 */

export const QLOO_DEFAULT_BASE_URL = "https://hackathon.api.qloo.com";

export type QlooErrorCode =
  | "QLOO_CONFIG"
  | "QLOO_AUTH"
  | "QLOO_RATE_LIMIT"
  | "QLOO_TIMEOUT"
  | "QLOO_CONNECT"
  | "QLOO_UPSTREAM"
  | "QLOO_CONTRACT"
  | "QLOO_CANCELLED";

export class QlooApiError extends Error {
  readonly code: QlooErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly recovery: string;

  constructor(
    code: QlooErrorCode,
    message: string,
    options: { status?: number; retryable?: boolean; recovery?: string } = {},
  ) {
    super(message);
    this.name = "QlooApiError";
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.recovery =
      options.recovery ??
      "Check the Qloo key and base URL, then try again. Demo mode is always available.";
  }
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 200;
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_IN_FLIGHT = 3;
const START_GAP_MS = 230;

type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

const cache = new Map<string, { expires: number; value: unknown }>();

/** Tiny concurrency + pacing gate shared by every Qloo request in the process. */
class Gate {
  private active = 0;
  private lastStart = 0;
  private queue: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    if (this.active >= MAX_IN_FLIGHT) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    const wait = Math.max(0, START_GAP_MS - (Date.now() - this.lastStart));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastStart = Date.now();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active -= 1;
      const next = this.queue.shift();
      if (next) next();
    };
  }
}

const gate = new Gate();

function baseUrl(): string {
  const raw = (process.env.QLOO_BASE_URL ?? QLOO_DEFAULT_BASE_URL).trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new QlooApiError("QLOO_CONFIG", "QLOO_BASE_URL is not a valid URL.", {
      recovery: "Use https://hackathon.api.qloo.com.",
    });
  }
  const isOfficial = url.hostname === "hackathon.api.qloo.com";
  const allowCustom = process.env.QLOO_ALLOW_CUSTOM_BASE_URL === "1";
  if (!isOfficial && !allowCustom) {
    throw new QlooApiError(
      "QLOO_CONFIG",
      "Refusing to call an untrusted Qloo base URL.",
      {
        recovery:
          "Only https://hackathon.api.qloo.com is allowed. Set QLOO_ALLOW_CUSTOM_BASE_URL=1 for a local mock server.",
      },
    );
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new QlooApiError("QLOO_CONFIG", "Qloo base URL must use HTTPS.", {
      recovery: "Use https://hackathon.api.qloo.com.",
    });
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

function apiKey(): string {
  const key = process.env.QLOO_API_KEY?.trim();
  if (!key) {
    throw new QlooApiError("QLOO_CONFIG", "QLOO_API_KEY is not configured.", {
      recovery:
        "Add QLOO_API_KEY to .env.local (server-side only), or use demo mode with a curated pair.",
    });
  }
  return key;
}

function buildUrl(path: string, params: Record<string, QueryValue> = {}) {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readErrorCode(status: number): { code: QlooErrorCode; message: string; recovery: string } {
  if (status === 401 || status === 403) {
    return {
      code: "QLOO_AUTH",
      message: "Qloo rejected the API key.",
      recovery:
        "Confirm the key is active for hackathon.api.qloo.com and restart the server so the env var is picked up.",
    };
  }
  if (status === 429) {
    return {
      code: "QLOO_RATE_LIMIT",
      message: "Qloo rate limit reached.",
      recovery: "Wait a few seconds; the client already retries with backoff.",
    };
  }
  if (status === 404) {
    return {
      code: "QLOO_CONTRACT",
      message: "Qloo endpoint not found.",
      recovery: "Check the endpoint path against the hackathon API docs.",
    };
  }
  if (status >= 500) {
    return {
      code: "QLOO_UPSTREAM",
      message: "Qloo is unavailable upstream.",
      recovery: "Retry shortly; demo pairs remain available.",
    };
  }
  return {
    code: "QLOO_CONTRACT",
    message: `Qloo request failed with status ${status}.`,
    recovery: "Check the query parameters against the API docs.",
  };
}

export type QlooRequestOptions = {
  signal?: AbortSignal;
  /** Skip the in-memory cache (used by the demo/mock layer only). */
  noCache?: boolean;
};

export async function qlooGet<T = unknown>(
  path: string,
  params: Record<string, QueryValue> = {},
  options: QlooRequestOptions = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new QlooApiError("QLOO_CONTRACT", "Invalid Qloo path.", {
      recovery: "Internal error — report it.",
    });
  }

  const url = buildUrl(path, params);
  const cacheKey = url.toString();
  if (!options.noCache) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) {
      return hit.value as T;
    }
    if (hit) cache.delete(cacheKey);
  }

  const key = apiKey();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) {
      throw new QlooApiError("QLOO_CANCELLED", "Request cancelled.", {
        recovery: "Run the analysis again.",
      });
    }

    const release = await gate.acquire();
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;

    try {
      const response = await fetch(cacheKey, {
        method: "GET",
        headers: { "X-Api-Key": key, Accept: "application/json" },
        signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const mapped = readErrorCode(response.status);
        let detail = "";
        try {
          const body = (await response.json()) as unknown;
          if (isRecord(body) && typeof body.message === "string") detail = ` ${body.message}`;
        } catch {
          /* ignore non-JSON error bodies */
        }
        const error = new QlooApiError(mapped.code, `${mapped.message}${detail}`, {
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
          recovery: mapped.recovery,
        });
        if (error.retryable && attempt < MAX_ATTEMPTS - 1) {
          lastError = error;
          const retryAfter = Number(response.headers.get("retry-after"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 320 * 2 ** attempt + Math.random() * 180;
          await sleep(delay);
          continue;
        }
        throw error;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new QlooApiError("QLOO_CONTRACT", "Qloo returned a non-JSON response.", {
          status: response.status,
          recovery: "Retry; if it persists, confirm the endpoint.",
        });
      }

      const value = (await response.json()) as T;
      if (!options.noCache) {
        if (cache.size >= CACHE_MAX) {
          const oldest = cache.keys().next().value;
          if (oldest) cache.delete(oldest);
        }
        cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value });
      }
      return value;
    } catch (error) {
      lastError = error;
      const isAbort =
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "TimeoutError");

      if (isAbort) {
        if (options.signal?.aborted) {
          throw new QlooApiError("QLOO_CANCELLED", "Request cancelled.", {
            recovery: "Run the analysis again.",
          });
        }
        const timeoutError = new QlooApiError(
          "QLOO_TIMEOUT",
          "Qloo did not respond within 15 seconds.",
          {
            retryable: true,
            recovery: "Retry; the demo pairs remain available.",
          },
        );
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(320 * 2 ** attempt);
          continue;
        }
        throw timeoutError;
      }

      if (error instanceof QlooApiError) {
        if (!error.retryable || attempt >= MAX_ATTEMPTS - 1) throw error;
        await sleep(320 * 2 ** attempt + Math.random() * 180);
        continue;
      }

      const connectError = new QlooApiError(
        "QLOO_CONNECT",
        "Could not reach the Qloo API.",
        {
          retryable: true,
          recovery: "Check network access, then retry.",
        },
      );
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(320 * 2 ** attempt);
        continue;
      }
      throw connectError;
    } finally {
      release();
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new QlooApiError("QLOO_UPSTREAM", "Qloo request failed.");
}

/* -------------------------------------------------------------------------- */
/* Endpoint helpers                                                            */
/* -------------------------------------------------------------------------- */

export const qloo = {
  search(
    query: string,
    types: string | undefined,
    options: QlooRequestOptions & { take?: number } = {},
  ) {
    return qlooGet(
      "/search",
      { query, ...(types ? { types } : {}), take: options.take ?? 5 },
      options,
    );
  },

  entities(ids: readonly string[], options: QlooRequestOptions = {}) {
    return qlooGet("/entities", { entity_ids: ids }, options);
  },

  insights(params: Record<string, QueryValue>, options: QlooRequestOptions = {}) {
    return qlooGet("/v2/insights", params, options);
  },

  compare(params: Record<string, QueryValue>, options: QlooRequestOptions = {}) {
    return qlooGet("/v2/analysis/compare", params, options);
  },

  tags(params: Record<string, QueryValue>, options: QlooRequestOptions = {}) {
    return qlooGet("/v2/tags", params, options);
  },

  trending(params: Record<string, QueryValue>, options: QlooRequestOptions = {}) {
    return qlooGet("/v2/trending", params, options);
  },
};
