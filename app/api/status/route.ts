import { buildRuntimeStatus } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(buildRuntimeStatus(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
