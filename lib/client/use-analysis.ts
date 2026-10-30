"use client";

import { useCallback, useReducer, useRef } from "react";
import type {
  AgentId,
  AgentTraceEntry,
  AnalyzeEvent,
  EvidenceProbe,
  Mode,
  Report,
} from "@/lib/types";

export const STAGE_AGENTS = [
  "scout",
  "ethnographer",
  "diplomat",
  "cartographer",
  "timekeeper",
  "strategist",
  "critic",
] as const satisfies readonly AgentId[];

export type StageStatus = "pending" | "running" | "done" | "warn" | "error";

export type StageState = {
  status: StageStatus;
  label: string;
};

export type Providers = { qloo: boolean; gemini: boolean };

export type AnalysisError = {
  code: string;
  message: string;
  recovery?: string;
};

export type RunState = {
  status: "idle" | "running" | "done" | "error";
  mode: Mode | null;
  reason: string;
  location: string;
  providers: Providers;
  stages: Record<AgentId, StageState>;
  traces: AgentTraceEntry[];
  evidence: EvidenceProbe[];
  report: Report | null;
  error: AnalysisError | null;
  startedAt: number | null;
};

export type AnalysisRequest = {
  a: string;
  b: string;
  location?: string;
  fixture?: string;
  mode?: Mode;
};

const STAGE_LABELS: Record<AgentId, string> = {
  orchestrator: "Open the case file",
  scout: "Resolve the pair",
  ethnographer: "Map taste",
  diplomat: "Compare overlap",
  cartographer: "Locate the audience",
  timekeeper: "Read momentum",
  strategist: "Guess, probe, write",
  critic: "Check every claim",
};

function emptyStages(): Record<AgentId, StageState> {
  return (Object.keys(STAGE_LABELS) as AgentId[]).reduce(
    (accumulator, agent) => {
      accumulator[agent] = { status: "pending", label: STAGE_LABELS[agent] };
      return accumulator;
    },
    {} as Record<AgentId, StageState>,
  );
}

export function initialRunState(): RunState {
  return {
    status: "idle",
    mode: null,
    reason: "",
    location: "",
    providers: { qloo: false, gemini: false },
    stages: emptyStages(),
    traces: [],
    evidence: [],
    report: null,
    error: null,
    startedAt: null,
  };
}

type Action =
  | { kind: "start" }
  | { kind: "event"; event: AnalyzeEvent }
  | { kind: "failure"; error: AnalysisError }
  | { kind: "reset" };

function reducer(state: RunState, action: Action): RunState {
  switch (action.kind) {
    case "start":
      return { ...initialRunState(), status: "running", startedAt: Date.now() };
    case "reset":
      return initialRunState();
    case "failure":
      return { ...state, status: "error", error: action.error };
    case "event": {
      const event = action.event;
      switch (event.type) {
        case "mode":
          return {
            ...state,
            mode: event.mode,
            reason: event.reason,
            location: event.location,
            providers: event.providers,
          };
        case "stage": {
          const nextStatus: StageStatus =
            event.status === "start" ? "running" : event.status;
          return {
            ...state,
            stages: {
              ...state.stages,
              [event.agent]: { status: nextStatus, label: event.label },
            },
          };
        }
        case "trace":
          return { ...state, traces: [...state.traces, event.entry] };
        case "evidence":
          return { ...state, evidence: [...state.evidence, event.probe] };
        case "report":
          return { ...state, status: "done", report: event.report };
        case "error":
          return {
            ...state,
            status: "error",
            error: {
              code: event.code,
              message: event.message,
              recovery: event.recovery,
            },
          };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, undefined, initialRunState);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ kind: "reset" });
  }, []);

  const start = useCallback(async (input: AnalysisRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ kind: "start" });

    let terminal = false;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        dispatch({
          kind: "failure",
          error: {
            code: `HTTP_${response.status}`,
            message: payload?.error ?? "The analysis could not start.",
            recovery: "Check the two brand names, then run the match again.",
          },
        });
        return;
      }

      if (!response.body) {
        dispatch({
          kind: "failure",
          error: {
            code: "NO_STREAM",
            message: "This browser did not receive the investigation stream.",
            recovery: "Try a current version of Chrome, Safari or Firefox.",
          },
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleFrame = (frame: string) => {
        const payload = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!payload) return;
        let event: AnalyzeEvent;
        try {
          event = JSON.parse(payload) as AnalyzeEvent;
        } catch {
          return;
        }
        if (event.type === "report" || event.type === "error") terminal = true;
        dispatch({ kind: "event", event });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) handleFrame(frame);
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) handleFrame(buffer);

      if (!terminal) {
        dispatch({
          kind: "failure",
          error: {
            code: "STREAM_ENDED",
            message: "The investigation ended before a memo arrived.",
            recovery:
              "Run it again, or open one of the archived memos while the live pipeline recovers.",
          },
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      dispatch({
        kind: "failure",
        error: {
          code: "NETWORK",
          message:
            error instanceof Error
              ? error.message
              : "The connection to the analysis desk was lost.",
          recovery: "Check the connection, then run the match again.",
        },
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  return { state, start, stop, reset: stop };
}
