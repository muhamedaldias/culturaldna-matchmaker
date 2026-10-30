/** Small shared surface for the agent modules. */

export type AgentNotify = (
  message: string,
  detail?: string,
  status?: "done" | "warn" | "error",
) => void;

/**
 * Combine the request signal with a wall-clock budget. The memo call gets
 * this so a stalled model cannot hold the stream open indefinitely.
 */
export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
