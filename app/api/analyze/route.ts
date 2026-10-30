import type { AnalyzeEvent, Mode } from "@/lib/types";
import { runAnalysis, AnalysisCancelledError, type EmitFn } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function readString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Send a JSON body with the two brand names." },
      { status: 400 },
    );
  }

  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const a = readString(record.a, 80);
  const b = readString(record.b, 80);

  if (!a || !b) {
    return Response.json(
      { error: "Two brand names are required, between 1 and 80 characters each." },
      { status: 400 },
    );
  }

  const location = readString(record.location, 60) ?? "Global";
  const fixture = readString(record.fixture, 80) ?? undefined;
  const mode: Mode | undefined =
    record.mode === "demo" || record.mode === "live" ? record.mode : undefined;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const emit: EmitFn = (event: AnalyzeEvent) =>
        send(`data: ${JSON.stringify(event)}\n\n`);

      // Proxies close idle streams; a comment every 15s keeps the pipe warm.
      const heartbeat = setInterval(() => send(": keep-alive\n\n"), 15_000);

      try {
        await runAnalysis(
          { a, b, location, fixture, mode },
          { emit, signal: request.signal },
        );
      } catch (error) {
        const cancelled =
          error instanceof AnalysisCancelledError || request.signal.aborted;
        if (!cancelled) {
          emit({
            type: "error",
            code: "STREAM_FAILED",
            message:
              error instanceof Error ? error.message : "The analysis stream failed.",
            recovery: "Run the analysis again, or compare one of the curated demo pairs.",
          });
        }
      } finally {
        clearInterval(heartbeat);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed by the client */
          }
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
