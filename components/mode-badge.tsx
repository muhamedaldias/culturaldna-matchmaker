import type { Mode } from "@/lib/types";

export function ModeBadge({
  mode,
  tone = "light",
  className = "",
}: {
  mode: Mode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6rem] uppercase leading-none tracking-[0.14em]";
  const style =
    mode === "live"
      ? "border-ink bg-lime text-ink"
      : tone === "dark"
        ? "border-paper-2/25 bg-transparent text-paper-2/75"
        : "border-line-strong bg-paper-3 text-ink-2";
  const dot =
    mode === "live"
      ? "bg-ink"
      : tone === "dark"
        ? "bg-paper-2/50"
        : "bg-ink-3";

  return (
    <span className={`${base} ${style} ${className}`}>
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 ${dot}`} />
      {mode === "live" ? "Live Qloo" : "Curated archive"}
    </span>
  );
}
