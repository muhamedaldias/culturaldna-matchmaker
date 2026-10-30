import Link from "next/link";
import type { Report, TrendSeries } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/qloo/domains";
import { TIER_META, confidenceBand } from "@/lib/scoring";
import { SectionHeader, EmptyNote, ScoreBar } from "@/components/report/parts";
import { formatDate, formatDuration, formatParams } from "@/lib/format";

const BAND_LABEL = {
  high: "High coverage",
  moderate: "Moderate coverage",
  thin: "Thin coverage",
} as const;

/* -------------------------------------------------------------------------- */
/* 01 — Score                                                                  */
/* -------------------------------------------------------------------------- */

export function ScoreSection({ report }: { report: Report }) {
  const { scores } = report;
  const band = confidenceBand(scores.confidence);

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="01"
        title="The match index"
        note="One deterministic score. Five published weights. Models write prose, never the number."
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <div className="border border-ink bg-paper p-5">
          <div className="flex items-end gap-2">
            <span className="font-display text-[5.4rem] leading-[0.75] tracking-[-0.055em] tabular">
              {scores.overall}
            </span>
            <span className="pb-1 font-mono text-xs text-ink-3">/ 100</span>
          </div>
          <p className="mt-5 inline-flex border border-ink bg-lime px-2 py-1 font-mono text-[0.62rem] uppercase leading-none tracking-[0.13em]">
            {TIER_META[scores.tier].label}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            {TIER_META[scores.tier].description}
          </p>
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="label text-ink-3">Confidence</span>
              <span className="font-mono text-sm tabular">{scores.confidence}/100</span>
            </div>
            <div className="mt-2">
              <ScoreBar value={scores.confidence} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-3">
              {BAND_LABEL[band]} — a coverage measure, not model certainty.
              {report.mode === "demo" ? " Capped at 62 in the archive." : ""}
            </p>
          </div>
        </div>

        <div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {scores.components.map((component, index) => (
              <div key={component.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{component.label}</span>
                  <span className="font-mono text-sm tabular">{component.value}</span>
                </div>
                <div className="mt-2">
                  <ScoreBar value={component.value} delay={index * 70} />
                </div>
                <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
                  Weight {Math.round(component.weight * 100)}%
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-3">
            The index is a weighted sum of the five components above.{" "}
            <Link href="/method#scoring" className="link-underline text-ink-2">
              Read the formula and thresholds
            </Link>
            . Affinities remain relative signals between 0 and 1.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 02 — Blind vs informed                                                      */
/* -------------------------------------------------------------------------- */

export function BlindSection({ report }: { report: Report }) {
  const blind = report.blind;
  const sourceLabel = blind.source === "gemini" ? "Gemini, before evidence" : "Category heuristic";

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="02"
        title="What the data changed"
        note="A blind category guess, recorded before any Qloo probe, next to the evidence-led memo."
      />
      <div className="mt-6 grid border border-line md:grid-cols-2">
        <div className="bg-paper-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="label">A — Category-only guess</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
              {sourceLabel}
            </span>
          </div>
          <p className="mt-4 font-display text-xl leading-snug">{blind.guess}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{blind.rationale}</p>
          {blind.predictedOverlap.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {blind.predictedOverlap.map((item) => (
                <span key={item} className="tag bg-paper-2/70">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-line bg-teal-soft p-5 sm:p-6 md:border-l md:border-t-0">
          <span className="label">B — Evidence-led memo</span>
          <p className="mt-4 font-display text-xl leading-snug">{report.informed.headline}</p>
          <div className="mt-3 space-y-3">
            {report.informed.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-ink-2">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {blind.misses.length > 0 ? (
        <div className="mt-5">
          <p className="label text-ink-3">What the category guess missed</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {blind.misses.map((miss, index) => (
              <li
                key={index}
                className="border-l-2 border-orange pl-3 text-sm leading-relaxed text-ink-2"
              >
                {miss}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-3">
        In a live run the blind take is written by Gemini from brand names and category
        descriptions only, then frozen before the first Qloo request. In the archive it is
        authored to the same rule.
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 03 — Taste DNA                                                              */
/* -------------------------------------------------------------------------- */

export function DnaSection({ report }: { report: Report }) {
  const columns = [
    {
      key: "shared",
      label: "Shared culture",
      note: "Held by both audiences",
      tags: report.dna.shared,
      accent: true,
    },
    {
      key: "a",
      label: `Only ${report.pair.a.name}`,
      note: "What the first brand brings",
      tags: report.dna.uniqueA,
      accent: false,
    },
    {
      key: "b",
      label: `Only ${report.pair.b.name}`,
      note: "What the second brand brings",
      tags: report.dna.uniqueB,
      accent: false,
    },
  ];

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="03"
        title="Taste DNA"
        note="Qloo tag affinities, grouped into shared culture and private taste. Values are relative, 0 to 1."
      />
      <div className="mt-6 grid border border-line md:grid-cols-3">
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={`${index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""} flex flex-col`}
          >
            <div
              className={`flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 ${
                column.accent ? "bg-lime" : "bg-paper-3"
              }`}
            >
              <span className="font-display text-lg leading-none">{column.label}</span>
              <span className="font-mono text-[0.65rem] tabular text-ink-2">
                {String(column.tags.length).padStart(2, "0")}
              </span>
            </div>
            <p className="border-b border-line px-4 py-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
              {column.note}
            </p>
            {column.tags.length > 0 ? (
              <ul className="px-4 py-2">
                {column.tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{tag.name}</span>
                      <span className="block font-mono text-[0.56rem] uppercase tracking-[0.1em] text-ink-3">
                        {DOMAIN_LABELS[tag.domain]}
                        {tag.note ? ` · ${tag.note}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular text-ink-2">
                      {tag.score.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-ink-3">No signals returned for this column.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 04 — Places and audiences                                                   */
/* -------------------------------------------------------------------------- */

export function PlaceSection({ report }: { report: Report }) {
  const cities = report.cities.slice(0, 8);
  const maxAffinity = cities[0]?.affinity ?? 1;
  const demographics = [
    { label: report.pair.a.name, items: report.demographics.a },
    { label: report.pair.b.name, items: report.demographics.b },
  ];

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="04"
        title="Where it lives"
        note="City affinity measures cultural concentration, not sales potential. Audience segments are relative indexes."
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="label text-ink-3">Activation cities</p>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-3">
              Top {cities.length || 0}
            </p>
          </div>
          {cities.length > 0 ? (
            <div className="mt-3">
              {cities.map((city, index) => (
                <div
                  key={`${city.name}-${city.rank}`}
                  className="grid grid-cols-[26px_1fr_46px] items-center gap-3 border-b border-line/70 py-2.5 last:border-0"
                >
                  <span className="font-mono text-[0.62rem] text-ink-3 tabular">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-sm">
                        {city.name}
                        {city.region ? (
                          <span className="text-xs text-ink-3">, {city.region}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ScoreBar
                        value={(city.affinity / Math.max(maxAffinity, 0.01)) * 100}
                        accent={index === 0}
                        delay={index * 45}
                        thin
                      />
                    </div>
                  </div>
                  <span className="text-right font-mono text-xs tabular text-ink-2">
                    {city.affinity.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>
              The locality probe returned no cities in this run. The memo does not recommend an
              activation city; treat the thesis as location-agnostic until a second probe.
            </EmptyNote>
          )}
        </div>

        <div className="border border-line bg-paper-3/60 p-4">
          <p className="label text-ink-3">Audience signals</p>
          <div className="mt-4 grid gap-4">
            {demographics.map((group) => (
              <div key={group.label}>
                <p className="font-display text-lg leading-none">{group.label}</p>
                {group.items.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.segment}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs capitalize text-ink-2">{item.segment}</span>
                          <span className="font-mono text-[0.65rem] tabular text-ink-3">
                            {item.affinity.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <ScoreBar value={item.affinity * 100} thin />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-ink-3">No segments returned.</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[0.7rem] leading-relaxed text-ink-3">
            {report.demographics.sharedNote}
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 05 — Momentum                                                               */
/* -------------------------------------------------------------------------- */

function TrendChart({ series }: { series: TrendSeries }) {
  const points = series.points;
  if (points.length < 2) {
    return (
      <div className="mt-4 border border-dashed border-line-strong px-3 py-8 text-center text-xs text-ink-3">
        Not enough points to draw a line.
      </div>
    );
  }

  const width = 320;
  const height = 110;
  const padX = 4;
  const padY = 10;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => ({
    x: padX + (index / (points.length - 1)) * (width - padX * 2),
    y: padY + (1 - (point.value - min) / span) * (height - padY * 2),
  }));

  const line = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L${coords[0].x.toFixed(1)} ${height - padY} Z`;
  const last = coords[coords.length - 1];

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${series.entity}: ${series.deltaLabel}. Population percentile moves from ${values[0]} to ${values[values.length - 1]}.`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = padY + fraction * (height - padY * 2);
          return (
            <line
              key={fraction}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="var(--color-line)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          );
        })}
        <path d={area} fill="var(--color-lime)" opacity="0.32" />
        <path d={line} fill="none" stroke="var(--color-ink)" strokeWidth="1.6" />
        <circle
          cx={last.x}
          cy={last.y}
          r="3"
          fill="var(--color-orange)"
          stroke="var(--color-paper-2)"
          strokeWidth="1.2"
        />
      </svg>
      <figcaption className="mt-2 grid grid-cols-3 items-baseline font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-3">
        <span>{points[0].date}</span>
        <span className="text-center">
          {min}–{max} percentile
        </span>
        <span className="text-right">{points[points.length - 1].date}</span>
      </figcaption>
    </figure>
  );
}

export function MomentumSection({ report }: { report: Report }) {
  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="05"
        title="Twelve months of momentum"
        note="Where Qloo trending data exists, this is relative change over the window. It is not a forecast."
      />
      {report.trends.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {report.trends.map((series) => (
            <div key={series.entity} className="border border-line bg-paper p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg leading-none">{series.entity}</p>
                <span
                  className={`font-mono text-xs tabular ${
                    series.momentum >= 0 ? "text-teal" : "text-orange"
                  }`}
                >
                  {series.deltaLabel}
                </span>
              </div>
              <TrendChart series={series} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyNote>
            No usable trend series returned for this run. Momentum contributes a neutral 50 to the
            index rather than a guess.
          </EmptyNote>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 06 — Cross-domain                                                           */
/* -------------------------------------------------------------------------- */

export function CrossDomainSection({ report }: { report: Report }) {
  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="06"
        title="What else travels with them"
        note="Affinities for the pair in domains neither brand owns. Live runs add probes the Strategist chooses."
      />
      {report.crossDomain.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.crossDomain.map((group) => (
            <div key={`${group.entityType}-${group.domainLabel}`} className="border border-line bg-paper p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="label text-ink-3">{group.domainLabel}</p>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                  {group.entityType.replace(/_/g, " ")}
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm">{item.name}</span>
                      <span className="font-mono text-[0.65rem] tabular text-ink-3">
                        {item.affinity.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <ScoreBar value={item.affinity * 100} thin />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyNote>
            No cross-domain rows survived this run. The memo relies on tag overlap and locality
            only, and says so.
          </EmptyNote>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 07 — Safety                                                                 */
/* -------------------------------------------------------------------------- */

export function SafetySection({ report }: { report: Report }) {
  const safety = report.scores.components.find((component) => component.key === "safety");

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="07"
        title="Cultural safety screen"
        note="A lexicon-level check for regulated categories, value conflicts, price gaps, climate and labour contradictions."
      />
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="border border-line bg-paper p-4">
          <p className="label text-ink-3">Safety score</p>
          <p className="mt-2 font-display text-5xl leading-none tabular">{safety?.value ?? 100}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            Out of 100 after flag penalties. This is a screen, not a legal review.
          </p>
        </div>

        <div>
          {report.safetyFlags.length > 0 ? (
            <ul>
              {report.safetyFlags.map((flag) => (
                <li key={flag.code} className="border-t border-line py-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{flag.label}</span>
                    <span className="font-mono text-xs text-orange">−{flag.penalty}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{flag.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-line bg-teal-soft p-4">
              <p className="text-sm font-medium">No lexicon-level conflicts fired.</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                Regulated categories, value conflicts and climate contradictions did not appear in
                the returned tags. Absence of a flag is not proof of safety; the brands&apos; own
                standards still apply.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 08 — Plays                                                                  */
/* -------------------------------------------------------------------------- */

const CONFIDENCE_STYLE = {
  high: "border-ink bg-lime text-ink",
  medium: "border-line-strong bg-paper-3 text-ink-2",
  low: "border-orange/60 bg-orange-soft text-ink",
} as const;

export function PlaysSection({ report }: { report: Report }) {
  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="08"
        title="Three ways in"
        note="Place-based, product and content plays. Every claim traces to a probe; no revenue or ROI projections."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {report.plays.map((play) => (
          <article key={play.index} className="flex flex-col border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-3">
                Play {String(play.index).padStart(2, "0")}
              </span>
              <span
                className={`border px-2 py-1 font-mono text-[0.55rem] uppercase leading-none tracking-[0.1em] ${CONFIDENCE_STYLE[play.confidence]}`}
              >
                {play.confidence} confidence
              </span>
            </div>
            <h4 className="mt-4 font-display text-2xl leading-tight">{play.title}</h4>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{play.thesis}</p>

            <dl className="mt-4 grid gap-2 border-t border-line pt-3 text-xs">
              <div className="grid grid-cols-[66px_1fr] gap-2">
                <dt className="label-sm text-ink-3">City</dt>
                <dd className="text-ink-2">{play.city}</dd>
              </div>
              <div className="grid grid-cols-[66px_1fr] gap-2">
                <dt className="label-sm text-ink-3">Format</dt>
                <dd className="text-ink-2">{play.format}</dd>
              </div>
              <div className="grid grid-cols-[66px_1fr] gap-2">
                <dt className="label-sm text-ink-3">Audience</dt>
                <dd className="text-ink-2">{play.audience}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="label-sm text-ink-3">Observable signals</p>
              <ul className="mt-2 space-y-1.5">
                {play.successSignals.map((signal) => (
                  <li key={signal} className="flex gap-2 text-xs leading-relaxed text-ink-2">
                    <span aria-hidden className="mt-[0.42rem] h-1 w-1 shrink-0 bg-ink" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-4">
              <p className="label-sm text-ink-3">Evidence</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {play.evidenceRefs.map((ref) => (
                  <a
                    key={ref}
                    href={`#probe-${ref}`}
                    className="tag transition-colors hover:border-ink hover:text-ink"
                  >
                    {ref}
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 09 — Risks                                                                  */
/* -------------------------------------------------------------------------- */

const SEVERITY_COLOR = {
  high: "bg-orange",
  medium: "bg-lime-deep",
  low: "bg-ink-3",
} as const;

export function RisksSection({ report }: { report: Report }) {
  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="09"
        title="What could break it"
        note="Specific to this pairing, with a design response for each risk. No generic marketing warnings."
      />
      <div className="mt-4">
        {report.risks.map((risk, index) => (
          <div
            key={`${risk.title}-${index}`}
            className="grid gap-3 border-t border-line py-5 first:border-t-0 first:pt-0 md:grid-cols-[0.9fr_1.35fr] md:gap-8"
          >
            <div>
              <div className="flex items-center gap-2">
                <span aria-hidden className={`h-2 w-2 ${SEVERITY_COLOR[risk.severity]}`} />
                <span className="label-sm text-ink-3">{risk.severity} severity</span>
              </div>
              <h4 className="mt-2 font-display text-xl leading-snug">{risk.title}</h4>
              {risk.evidenceRefs.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {risk.evidenceRefs.map((ref) => (
                    <a key={ref} href={`#probe-${ref}`} className="tag hover:border-ink hover:text-ink">
                      {ref}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <p className="text-sm leading-relaxed text-ink-2">{risk.detail}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                <span className="label-sm mr-2 text-ink-3">Design response</span>
                {risk.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 10 — Evidence ledger                                                        */
/* -------------------------------------------------------------------------- */

export function EvidenceSection({ report }: { report: Report }) {
  const modelSelected = report.evidence.filter((probe) => probe.selectedBy === "model").length;

  return (
    <section className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="10"
        title="Evidence ledger"
        note="Every query issued during the run, with parameters, row counts and latency. Nothing is hidden."
      />
      {report.evidence.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto border border-line">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-paper-3">
                  {["Id", "Agent", "Probe", "Endpoint", "Rows", "Latency"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`label px-3 py-2 text-ink-3 ${heading === "Rows" || heading === "Latency" ? "text-right" : ""}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.evidence.map((probe) => (
                  <tr
                    key={probe.id}
                    id={`probe-${probe.id}`}
                    className="scroll-mt-24 border-t border-line align-top target:bg-lime/30"
                  >
                    <td className="px-3 py-3 font-mono text-[0.62rem] text-ink-2">{probe.id}</td>
                    <td className="px-3 py-3 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-3">
                      {probe.agent}
                    </td>
                    <td className="max-w-[380px] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs">{probe.label}</span>
                        {probe.selectedBy === "model" ? (
                          <span className="bg-ink px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-lime">
                            model
                          </span>
                        ) : null}
                      </div>
                      {probe.note ? (
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-ink-3">{probe.note}</p>
                      ) : null}
                      <p className="mt-1 break-all font-mono text-[0.56rem] leading-relaxed text-ink-3">
                        {formatParams(probe.params)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[0.6rem] text-ink-2">
                      {probe.endpoint}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs tabular">
                      {probe.resultCount}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-xs tabular">
                      {formatDuration(probe.durationMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-3">
            <span>{report.evidence.length} probes</span>
            <span>{modelSelected} model-selected</span>
            <span>{report.timings.modelCalls} model calls</span>
            <span>{formatDuration(report.timings.totalMs)} wall clock</span>
          </p>
        </>
      ) : (
        <div className="mt-6">
          <EmptyNote>
            The ledger is empty because no probe completed. The memo above should be treated as
            void until a successful run.
          </EmptyNote>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 11 — Limits                                                                 */
/* -------------------------------------------------------------------------- */

export function CaveatsSection({ report }: { report: Report }) {
  return (
    <section className="px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeader
        index="11"
        title="Limits and provenance"
        note="What this memo can and cannot support. Read before quoting it in a boardroom."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {report.caveats.map((caveat, index) => (
          <div key={index} className="flex gap-3 border border-line bg-paper px-4 py-3">
            <span className="font-mono text-[0.6rem] text-ink-3 tabular">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-xs leading-relaxed text-ink-2">{caveat}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-3">
        Prepared {formatDate(report.createdAt)} · {report.evidence.length} probes ·{" "}
        {report.timings.modelCalls} model calls · MIT-licensed
      </p>
    </section>
  );
}
