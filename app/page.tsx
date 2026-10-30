import Link from "next/link";
import { buildDemoReport } from "@/lib/fixtures/build";
import { FIXTURES, patagoniaWholeFoods } from "@/lib/fixtures";
import { TIER_META } from "@/lib/scoring";
import { ModeBadge } from "@/components/mode-badge";
import { ScoreBar } from "@/components/report/parts";
import { ArrowRight, ArrowUpRight, HelixStrand } from "@/components/marks";
import { formatDate } from "@/lib/format";

const STAMP = new Date("2026-10-30T12:00:00Z");

const AGENTS = [
  {
    name: "Scout",
    role: "Entity resolution",
    question: "Do both brands exist in the graph, and is this the right record?",
    reads: ["/search", "/entities"],
  },
  {
    name: "Ethnographer",
    role: "Taste mapping",
    question: "What does each audience actually like, beyond the category label?",
    reads: ["/v2/insights", "urn:tag"],
  },
  {
    name: "Diplomat",
    role: "Overlap analysis",
    question: "Where do the two taste graphs meet, and where do they refuse to?",
    reads: ["/v2/analysis/compare"],
  },
  {
    name: "Cartographer",
    role: "Locality",
    question: "Which cities carry this pairing, and who lives there?",
    reads: ["urn:heatmap", "urn:demographics"],
  },
  {
    name: "Timekeeper",
    role: "Momentum",
    question: "Is either brand accelerating, flattening or losing the room?",
    reads: ["/v2/trending"],
  },
  {
    name: "Strategist",
    role: "Guessing, probing, writing",
    question: "What would a category-only guess miss — and what should be probed next?",
    reads: ["blind take", "model-selected probes", "memo"],
  },
  {
    name: "Critic",
    role: "Deterministic review",
    question: "Can every sentence be traced to a probe, with no invented numbers?",
    reads: ["citation check", "claim scan", "city match"],
  },
] as const;

const STEPS = [
  ["Probe", "Fourteen fixed Qloo queries cover entities, taste, overlap, places, momentum and cross-domain signals."],
  ["Score", "Five published weights turn the returned affinities into one match index. Models never touch the number."],
  ["Narrate", "Gemini writes the verdict and plays, and can commission up to two probes of its own."],
  ["Check", "A deterministic critic strips financial claims, repairs citations and refuses unsupported cities."],
] as const;

export default function HomePage() {
  const lead = buildDemoReport(patagoniaWholeFoods, STAMP);
  const cases = FIXTURES.map((fixture) => ({
    fixture,
    report: buildDemoReport(fixture, STAMP),
  }));
  const tier = TIER_META[lead.scores.tier];

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <HelixStrand
          className="pointer-events-none absolute right-[-3rem] top-1/2 hidden h-[560px] -translate-y-1/2 text-line-strong/70 lg:block"
          rungs={24}
        />
        <div className="shell relative grid gap-12 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-16 lg:pb-20 lg:pt-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="tag border-ink bg-paper-2">
                <span aria-hidden className="h-1.5 w-1.5 bg-orange" />
                Qloo Agentic Hackathon · 2026
              </span>
              <span className="label-sm text-ink-3">Cultural due diligence</span>
            </div>

            <h1 className="mt-6 font-display text-[clamp(2.9rem,6vw,5.1rem)] font-medium leading-[0.92] tracking-[-0.045em]">
              Two brands.
              <br />
              One <span className="marker">culture</span> map.
            </h1>

            <p className="mt-6 max-w-[54ch] text-[1.02rem] leading-relaxed text-ink-2">
              CulturalDNA Matchmaker runs a seven-agent investigation across Qloo&rsquo;s taste
              graph, then returns a due-diligence memo: whether a pairing belongs together, where
              it should happen, and exactly which evidence supports each claim.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/match" className="btn btn-primary h-12 px-5">
                Run a match
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/method" className="btn btn-ghost h-12 px-5">
                Read the method
              </Link>
            </div>

            <p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
              No sign-up · live pipeline or labelled archive · every probe on the record
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              {[
                ["7", "agents on the case"],
                ["14", "fixed probes · +2 chosen"],
                ["5", "published weights"],
                ["0", "revenue estimates"],
              ].map(([value, label]) => (
                <div key={label} className="bg-paper px-3 py-3">
                  <dd className="font-display text-2xl leading-none tabular">{value}</dd>
                  <dt className="label-sm mt-1.5 leading-snug text-ink-3">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[27rem] lg:mx-0 lg:justify-self-end">
            <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 border border-ink bg-lime" />
            <article className="relative border border-ink bg-paper-2">
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <span className="label text-ink-3">Case file · preview</span>
                <ModeBadge mode="demo" />
              </div>
              <div className="px-4 py-5">
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
                  {lead.location} · {formatDate(lead.createdAt)}
                </p>
                <p className="mt-2 font-display text-[1.75rem] leading-[1.05] tracking-[-0.03em]">
                  {lead.pair.a.name} <span className="mx-[0.06em] text-orange">×</span> {lead.pair.b.name}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{lead.verdict.headline}</p>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-end gap-2">
                    <span className="font-display text-[4rem] leading-[0.7] tabular">
                      {lead.scores.overall}
                    </span>
                    <span className="pb-0.5 font-mono text-[0.6rem] text-ink-3">/ 100</span>
                  </div>
                  <span className="inline-flex border border-ink bg-lime px-2 py-1 font-mono text-[0.55rem] uppercase leading-none tracking-[0.12em]">
                    {tier.label}
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {lead.scores.components.map((component) => (
                    <li key={component.key}>
                      <div className="flex items-baseline justify-between gap-2 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                        <span>{component.label}</span>
                        <span className="tabular text-ink-2">{component.value}</span>
                      </div>
                      <div className="mt-1">
                        <ScoreBar value={component.value} thin />
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border border-ink bg-lime px-3 py-2.5">
                  <p className="label-sm text-ink/65">Recommended posture</p>
                  <p className="mt-1 font-display text-base leading-snug">{lead.verdict.posture}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                  {lead.evidence.length} probes · {lead.plays.length} plays
                </span>
                <Link href="#memo" className="label text-ink-2 hover:text-ink">
                  Open the memo ↓
                </Link>
              </div>
            </article>
            <p className="mt-5 text-right font-mono text-[0.52rem] uppercase leading-relaxed tracking-[0.12em] text-ink-3">
              Curated illustration · not live Qloo output
            </p>
          </div>
        </div>
      </section>

      {/* Investigation */}
      <section id="investigation" className="scroll-mt-20 border-t border-ink bg-paper-2/60">
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="label text-ink-3">The investigation</p>
              <h2 className="display-3 mt-3 max-w-[16ch] text-balance">
                Seven agents. One case file.
              </h2>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-ink-2 lg:justify-self-end">
              The pipeline is deliberately boring where it matters: fixed probes, deterministic
              scoring, published parameters. The agents are specialists with narrow mandates, not
              a chat room. Every step writes to the same evidence ledger.
            </p>
          </div>

          <ol className="mt-10 border-t border-ink">
            {AGENTS.map((agent, index) => (
              <li
                key={agent.name}
                className="grid gap-2 border-b border-line py-5 md:grid-cols-[44px_180px_1fr_250px] md:items-baseline md:gap-6"
              >
                <span className="font-mono text-[0.6rem] tabular text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-xl leading-none">{agent.name}</p>
                  <p className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-ink-3">
                    {agent.role}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-ink-2">{agent.question}</p>
                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  {agent.reads.map((read) => (
                    <span key={read} className="tag">
                      {read}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
              Concurrency 3 · 230 ms between calls · 6-hour cache · retries with backoff
            </p>
            <Link
              href="/method#pipeline"
              className="label link-underline inline-flex items-center gap-2 text-ink-2 hover:text-ink"
            >
              Endpoints and sequence
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blind test */}
      <section className="bg-ink text-paper-2">
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="label text-lime">The blind test</p>
              <h2 className="display-3 mt-3 max-w-[15ch] text-balance">
                What a name-only guess gets wrong.
              </h2>
              <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-paper-2/65">
                Before touching Qloo, the Strategist records the pairing a language model would
                predict from category labels alone. Then the probes run. The distance between
                guess and evidence is the product — shown in every memo, not hidden.
              </p>
              <Link
                href="#memo"
                className="mt-7 inline-flex items-center gap-2 border border-paper-2/25 px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-paper-2 transition-colors hover:border-lime hover:bg-lime hover:text-ink"
              >
                Compare the two
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div>
              <div className="grid border border-paper-2/20 sm:grid-cols-2">
                <div className="bg-paper-2/[0.04] p-5 sm:p-6">
                  <p className="label text-paper-2/45">A · Before evidence</p>
                  <p className="mt-4 font-display text-[1.35rem] leading-snug">{lead.blind.guess}</p>
                  <p className="mt-3 text-xs leading-relaxed text-paper-2/55">
                    {lead.blind.rationale}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {lead.blind.predictedOverlap.map((item) => (
                      <span
                        key={item}
                        className="border border-paper-2/20 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-paper-2/55"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-paper-2/20 bg-teal p-5 text-paper-2 sm:border-l sm:border-t-0 sm:p-6">
                  <p className="label text-paper-2/55">B · After evidence</p>
                  <p className="mt-4 font-display text-[1.35rem] leading-snug">
                    {lead.informed.headline}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-paper-2/65">
                    {lead.informed.paragraphs[0]}
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {lead.blind.misses.map((miss, index) => (
                  <li key={index} className="border-l-2 border-orange pl-3">
                    <p className="label-sm text-orange">Miss {index + 1}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-paper-2/65">{miss}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Memo preview */}
      <section id="memo" className="scroll-mt-20">
        <div className="shell py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-ink-3">The memo</p>
              <h2 className="display-3 mt-3 max-w-[19ch] text-balance">
                A deal memo you can audit.
              </h2>
            </div>
            <p className="max-w-[48ch] text-sm leading-relaxed text-ink-2">
              One worked case from the archive, condensed. The full memo adds momentum charts,
              cross-domain signals, risks and the complete evidence ledger.
            </p>
          </div>

          <article className="mt-9 border border-ink bg-paper-2">
            <header className="grid gap-8 border-b border-line px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.45fr_0.55fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="label text-ink-3">Deal memo · preview</span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <ModeBadge mode="demo" />
                </div>
                <p className="mt-5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
                  {lead.location} · {formatDate(lead.createdAt)} · {lead.evidence.length} probes
                </p>
                <h3 className="display-2 mt-2 text-balance">
                  {lead.pair.a.name} <span className="mx-[0.06em] text-orange">×</span> {lead.pair.b.name}
                </h3>
                <p className="mt-5 max-w-[46ch] font-display text-[clamp(1.3rem,2vw,1.75rem)] leading-[1.2] tracking-[-0.02em]">
                  {lead.verdict.headline}
                </p>
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-ink-2">
                  {lead.verdict.summary}
                </p>
              </div>

              <aside className="self-start border border-ink bg-lime p-4">
                <p className="label text-ink/65">Recommended posture</p>
                <p className="mt-3 font-display text-xl leading-snug">{lead.verdict.posture}</p>
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-ink/20 pt-3">
                  <div>
                    <p className="font-display text-4xl leading-none tabular">
                      {lead.scores.overall}
                      <span className="font-mono text-[0.6rem] text-ink/60"> /100</span>
                    </p>
                    <p className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink/65">
                      {tier.label} · confidence {lead.scores.confidence}
                    </p>
                  </div>
                </div>
              </aside>
            </header>

            <div className="grid border-b border-line md:grid-cols-3">
              {[
                {
                  label: "Shared culture",
                  note: "Held by both audiences",
                  tags: lead.dna.shared.slice(0, 8),
                  accent: true,
                },
                {
                  label: `Only ${lead.pair.a.name}`,
                  note: "What the first brand brings",
                  tags: lead.dna.uniqueA.slice(0, 5),
                  accent: false,
                },
                {
                  label: `Only ${lead.pair.b.name}`,
                  note: "What the second brand brings",
                  tags: lead.dna.uniqueB.slice(0, 5),
                  accent: false,
                },
              ].map((column, index) => (
                <div
                  key={column.label}
                  className={index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""}
                >
                  <div
                    className={`flex items-baseline justify-between gap-2 border-b border-line px-4 py-2.5 ${
                      column.accent ? "bg-lime" : "bg-paper-3"
                    }`}
                  >
                    <p className="font-display text-base leading-none">{column.label}</p>
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                      {column.note}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-4 py-3">
                    {column.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`tag ${column.accent ? "border-ink/30 bg-lime/25" : ""}`}
                      >
                        {tag.name}
                        <span className="font-mono text-[0.55rem] tabular text-ink-3">
                          {tag.score.toFixed(2)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 border-b border-line px-5 py-7 sm:px-8 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="label text-ink-3">Activation cities</p>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                    Relative affinity
                  </span>
                </div>
                <ul className="mt-3">
                  {lead.cities.slice(0, 5).map((city, index) => (
                    <li
                      key={city.name}
                      className="grid grid-cols-[24px_1fr_44px] items-center gap-3 border-b border-line/70 py-2 last:border-0"
                    >
                      <span className="font-mono text-[0.58rem] tabular text-ink-3">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm leading-tight">
                          {city.name}
                          {city.region ? (
                            <span className="text-xs text-ink-3">, {city.region}</span>
                          ) : null}
                        </p>
                        <div className="mt-1">
                          <ScoreBar
                            value={(city.affinity / Math.max(lead.cities[0].affinity, 0.01)) * 100}
                            accent={index === 0}
                            thin
                            delay={index * 45}
                          />
                        </div>
                      </div>
                      <span className="text-right font-mono text-[0.65rem] tabular text-ink-2">
                        {city.affinity.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="label text-ink-3">Three ways in</p>
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                    Plays 01–03
                  </span>
                </div>
                <ul className="mt-3 space-y-3">
                  {lead.plays.map((play) => (
                    <li key={play.index} className="border-b border-line/70 pb-3 last:border-0">
                      <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
                        Play {String(play.index).padStart(2, "0")} · {play.confidence} confidence
                      </p>
                      <p className="mt-1 font-display text-lg leading-tight">{play.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-2">
                        {play.city} · {play.format}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <p className="font-mono text-[0.55rem] uppercase leading-relaxed tracking-[0.1em] text-ink-3">
                {lead.evidence.length} probes · {lead.timings.modelCalls} model calls · confidence
                capped at {lead.scores.confidence} in demo
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/match?fixture=patagonia-whole-foods&autorun=1" className="btn btn-primary h-10 px-3.5">
                  Replay the full memo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/match" className="btn btn-ghost h-10 px-3.5">
                  Run your own pairing
                </Link>
              </div>
            </footer>
          </article>

          <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-3">
            Archive preview. Every memo states its own limits: affinities are relative signals, city
            affinity is cultural concentration rather than sales potential, and no revenue or
            audience-size figure is estimated.
          </p>
        </div>
      </section>

      {/* Archive */}
      <section className="border-t border-ink bg-paper-2/60">
        <div className="shell py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-ink-3">The archive</p>
              <h2 className="display-3 mt-3">Three worked cases.</h2>
            </div>
            <p className="max-w-[46ch] text-sm leading-relaxed text-ink-2">
              Each replay is a full memo built to the live contract — score, blind test, ledger and
              limits. One click, about three seconds, no key required.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {cases.map(({ fixture, report }, index) => (
              <Link
                key={fixture.slug}
                href={`/match?fixture=${fixture.slug}&autorun=1`}
                className="group flex flex-col border border-line bg-paper-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-editorial-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label text-ink-3">Case {String(index + 1).padStart(2, "0")}</span>
                  <span className="inline-flex border border-ink bg-lime px-2 py-1 font-mono text-[0.55rem] uppercase leading-none tracking-[0.1em]">
                    {TIER_META[report.scores.tier].short} · {report.scores.overall}
                  </span>
                </div>
                <p className="mt-5 font-display text-[1.7rem] leading-[1.03] tracking-[-0.03em]">
                  {report.pair.a.name} <span className="mx-[0.06em] text-orange">×</span> {report.pair.b.name}
                </p>
                <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
                  {fixture.subtitle} · {fixture.location}
                </p>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-2">
                  {report.verdict.headline}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {report.dna.shared.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-ink-3">
                    {report.evidence.length} probes · {report.plays.length} plays
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Method */}
      <section className="bg-lime">
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <p className="label text-ink/60">The rules</p>
              <h2 className="display-3 mt-3 max-w-[19ch] text-balance">
                The number is deterministic. The prose is not.
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-ink/80">
                <p>
                  The match index is a weighted sum of five components. Gemini can write the
                  verdict, propose plays and commission two extra probes; it cannot change a score,
                  invent a citation or add a revenue projection.
                </p>
                <p>
                  A deterministic critic removes finance and audience-size claims, repairs broken
                  evidence references and rejects cities the probes did not return. Confidence is a
                  coverage measure, not a model&rsquo;s self-belief — and it is capped in demo mode.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link href="/method" className="btn btn-primary h-11 px-4">
                  Read the method
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/method#limits" className="btn btn-ghost h-11 px-4">
                  What it cannot do
                </Link>
              </div>
            </div>

            <div className="border border-ink bg-paper-2/40">
              <p className="label border-b border-ink/20 px-4 py-3 text-ink/60">
                Published weights · this case
              </p>
              <ul className="px-4 py-3">
                {lead.scores.components.map((component) => (
                  <li key={component.key} className="border-b border-ink/15 py-2.5 last:border-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">{component.label}</span>
                      <span className="font-mono text-[0.6rem] tabular text-ink/70">
                        {Math.round(component.weight * 100)}% · {component.value}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-ink/15">
                      <div className="h-full bg-ink" style={{ width: `${component.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="border-t border-ink/20 px-4 py-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-[0.1em] text-ink/60">
                Thresholds · 85 exceptional · 76 strong · 66 promising · 52 cautious
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section>
        <div className="shell py-16 sm:py-20">
          <div className="grid gap-8 border border-ink bg-paper-2 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="label text-ink-3">One run, one memo</p>
              <h2 className="display-3 mt-3 max-w-[22ch] text-balance">
                Put the next partnership on the record.
              </h2>
              <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map(([title, copy], index) => (
                  <li key={title} className="border-l border-line-strong pl-3">
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
                      {String(index + 1).padStart(2, "0")} · {title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-2">{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
            <Link href="/match" className="btn btn-primary h-12 justify-self-start px-5 lg:justify-self-end">
              Run a match
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
