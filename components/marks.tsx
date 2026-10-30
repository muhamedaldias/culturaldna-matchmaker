import type { SVGProps } from "react";

export function HelixMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 2c-4.2 5.6-4.2 11.2 0 16.8s4.2 11.2 0 16.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M23 2c4.2 5.6 4.2 11.2 0 16.8s-4.2 11.2 0 16.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {[6.4, 10.6, 14.8, 19, 23.2, 27.4, 31.6].map((y, index) => {
        const width = index === 3 ? 3.2 : 5.4 + Math.abs(3 - index) * 1.9;
        const x = 16 - width / 2;
        return (
          <line
            key={y}
            x1={x}
            y1={y}
            x2={x + width}
            y2={y}
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={index === 3 ? 0.35 : 0.65}
          />
        );
      })}
      <circle cx="16" cy="14.8" r="2.1" fill="var(--color-lime)" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

type StrandProps = {
  className?: string;
  rungs?: number;
};

/**
 * Decorative double helix. Deterministic geometry so it renders identically
 * on the server and the client.
 */
export function HelixStrand({ className, rungs = 26 }: StrandProps) {
  const height = 520;
  const pad = 26;
  const amplitude = 52;
  const mid = 100;

  const pathFor = (phase: 0 | 1) => {
    const points: string[] = [];
    const samples = 80;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const y = pad + t * (height - pad * 2);
      const x = mid + amplitude * Math.sin(t * Math.PI * 3.2 + phase * Math.PI);
      points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(" ");
  };

  return (
    <svg
      viewBox={`0 0 200 ${height}`}
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={pathFor(0)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      <path d={pathFor(1)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      {Array.from({ length: rungs }, (_, index) => {
        const t = (index + 1) / (rungs + 1);
        const y = pad + t * (height - pad * 2);
        const x1 = mid + amplitude * Math.sin(t * Math.PI * 3.2);
        const x2 = mid + amplitude * Math.sin(t * Math.PI * 3.2 + Math.PI);
        const accent = index === Math.floor(rungs * 0.42);
        return (
          <line
            key={index}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke={accent ? "var(--color-lime-deep)" : "currentColor"}
            strokeWidth={accent ? 2.4 : 0.9}
            opacity={accent ? 1 : 0.32}
          />
        );
      })}
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" opacity="0.2" />
      <path d="M18 10a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
