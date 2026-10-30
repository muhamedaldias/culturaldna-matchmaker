import type { ReactNode } from "react";

export function SectionHeader({
  index,
  title,
  note,
  id,
}: {
  index: string;
  title: string;
  note?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
    >
      <div className="flex items-baseline gap-3">
        <span className="label tabular text-ink-3">{index}</span>
        <h3 className="font-display text-[1.55rem] leading-tight tracking-[-0.02em]">{title}</h3>
      </div>
      {note ? (
        <p className="max-w-[48ch] text-xs leading-relaxed text-ink-3 sm:text-right">{note}</p>
      ) : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-line-strong bg-paper px-4 py-6 text-sm leading-relaxed text-ink-3">
      {children}
    </p>
  );
}

export function ScoreBar({
  value,
  accent = false,
  delay = 0,
  thin = false,
}: {
  value: number;
  accent?: boolean;
  delay?: number;
  thin?: boolean;
}) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className={`score-bar ${thin ? "score-bar-thin" : ""}`} aria-hidden>
      <span
        style={{
          width,
          animationDelay: `${delay}ms`,
          ...(accent ? { background: "var(--color-orange)" } : {}),
        }}
      />
    </div>
  );
}
