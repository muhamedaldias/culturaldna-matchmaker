import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  SAFETY_RULE_SUMMARY,
  SCORE_LABELS,
  SCORE_NOTES,
  TIER_META,
  WEIGHTS,
} from "@/lib/scoring";
import type { ScoreKey, ScoreTier } from "@/lib/types";
import { SITE } from "@/lib/site";
import { ArrowRight, ArrowUpRight } from "@/components/marks";

export const metadata: Metadata = {
  title: "Method & limits",
  description:
    "The full method behind CulturalDNA Matchmaker: Qloo endpoints, scoring weights, confidence, the blind test, the safety lexicon, failure modes and reproduction steps.",
};

const PROBES = [
  ["01", "Scout", "Resolve brand A", "/search", "query = {brand A} · types = urn:entity:brand · take = 5"],
  ["02", "Scout", "Resolve brand B", "/search", "query = {brand B} · types = urn:entity:brand · take = 5"],
  ["03", "Scout", "Confirm both records", "/entities", "entity_ids = {A.id, B.id}"],
  ["04", "Ethnographer", "Taste tags — A", "/v2/insights", "filter.type = urn:tag · entities = {A.id} · take = 40"],
  ["05", "Ethnographer", "Taste tags — B", "/v2/insights", "filter.type = urn:tag · entities = {B.id} · take = 40"],
  ["06", "Ethnographer", "Audience — A", "/v2/insights", "filter.type = urn:demographics · entities = {A.id} · take = 25"],
  ["07", "Ethnographer", "Audience — B", "/v2/insights", "filter.type = urn:demographics · entities = {B.id} · take = 25"],
  ["08", "Diplomat", "Shared vs unique taste", "/v2/analysis/compare", "a/b.signal.interests.entities = A, B · urn:tag · take = 40"],
  ["09", "Cartographer", "City affinity", "/v2/insights", "filter.type = urn:heatmap · entities = A, B · location · take = 50"],
  ["10", "Timekeeper", "Momentum — A", "/v2/trending", "urn:entity:brand · entities = {A.id} · 12-month window · take = 50"],
  ["11", "Timekeeper", "Momentum — B", "/v2/trending", "urn:entity:brand · entities = {B.id} · 12-month window · take = 50"],
  ["12", "Ethnographer", "Cross-domain — artists", "/v2/insights", "filter.type = urn:entity:artist · entities = A, B · take = 8"],
  ["13", "Ethnographer", "Cross-domain — film", "/v2/insights", "filter.type = urn:entity:movie · entities = A, B · take = 8"],
  ["14", "Ethnographer", "Cross-domain — places", "/v2/insights", "filter.type = urn:entity:destination · entities = A, B · take = 8"],
] as const;

const FAILURES = [
  [
    "QLOO_API_KEY missing",
    "The run switches to the curated archive, clearly labelled. A custom pair is refused with a recovery message instead of a fabricated memo.",
  ],
  [
    "GEMINI_API_KEY missing",
    "The blind take falls back to a category heuristic, probe planning is skipped, and the deterministic strategist writes the memo from the same ledger.",
  ],
  [
    "Gemini timeout or schema failure",
    "The 45-second memo call is abandoned and the deterministic memo is used; a warning is written into the memo caveats and the run trace.",
  ],
  [
    "A single Qloo probe fails",
    "The probe is logged as a warning and the run continues with a typed fallback (e.g. neutral momentum), so one failure never voids the whole case.",
  ],
  [
    "A brand cannot be resolved",
    "A QLOO_CONTRACT error stops the run with a recovery prompt. Nothing is inferred from the brand name.",
  ],
  [
    "Rate limit or upstream outage",
    "The client retries with backoff (four attempts, 15-second timeout), then surfaces a typed error. Archive cases remain available.",
  ],
  [
    "The model invents a city or citation",
    "The critic rebuilds citations from the ledger and canonicalises cities to the returned locality list, or refuses the claim.",
  ],
  [
    "Financial or audience-size claims",
    "The critic removes sentences containing revenue, ROI, market-share, audience-size or percentage-of-population claims, and strips hype phrasing.",
  ],
] as const;

function MethodSection({
  id,
  index,
  kicker,
  title,
  note,
  children,
}: {
  id: string;
  index: string;
  kicker: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-12 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="label text-ink-3">
            {index} · {kicker}
          </p>
          <h2 className="display-3 mt-3 text-balance">{title}</h2>
          {note ? <p className="mt-3 text-sm leading-relaxed text-ink-2">{note}</p> : null}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export default function MethodPage() {
  const tierOrder: ScoreTier[] = [
    "exceptional",
    "strong",
    "promising",
    "cautious",
    "misaligned",
  ];
  const tierRange: Record<ScoreTier, string> = {
    exceptional: "85–100",
    strong: "76–84",
    promising: "66–75",
    cautious: "52–65",
    misaligned: "0–51",
  };
  const weights = Object.keys(WEIGHTS) as ScoreKey[];

  return (
    <div className="shell py-10 sm:py-14">
      <div className="border-b border-line pb-8">
        <p className="label text-ink-3">Method & limits</p>
        <h1 className="display-2 mt-3 max-w-[20ch] text-balance">How the match is made.</h1>
        <p className="mt-4 max-w-[68ch] text-[0.98rem] leading-relaxed text-ink-2">
          CulturalDNA is built to be audited: fourteen fixed Qloo probes, five published weights,
          a blind take frozen before evidence, and a deterministic critic that removes anything
          the data cannot support. This page is the whole method — including what it cannot do.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Next.js 16",
            "Qloo hackathon API",
            "Gemini · gemini-2.5-flash default",
            "Zod schemas",
            "Vitest",
            "MIT licence",
          ].map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
        </div>
      </div>

      <nav
        aria-label="Method sections"
        className="flex gap-6 overflow-x-auto border-b border-line py-3.5"
      >
        {[
          ["#pipeline", "Pipeline"],
          ["#scoring", "Scoring"],
          ["#blind", "Blind test"],
          ["#safety", "Safety"],
          ["#limits", "Failure modes"],
          ["#reproduce", "Reproduce"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="font-mono text-[0.6rem] uppercase tracking-[0.14em] whitespace-nowrap text-ink-3 transition-colors hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      <MethodSection
        id="pipeline"
        index="01"
        kicker="Pipeline"
        title="Fourteen probes, fixed in order."
        note="Every live run issues the same queries. Two more probes may be chosen by the Strategist model; they appear in the ledger marked MODEL."
      >
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <caption className="sr-only">
              Fixed Qloo probes issued by the live pipeline
            </caption>
            <thead>
              <tr className="bg-paper-3">
                {["#", "Agent", "Probe", "Endpoint", "Key parameters"].map((heading) => (
                  <th key={heading} scope="col" className="label px-3 py-2.5 text-ink-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROBES.map(([id, agent, probe, endpoint, params]) => (
                <tr key={id} className="border-t border-line align-top">
                  <td className="px-3 py-2.5 font-mono text-[0.58rem] tabular text-ink-3">{id}</td>
                  <td className="px-3 py-2.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-3">
                    {agent}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink">{probe}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[0.6rem] text-ink-2">
                    {endpoint}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[0.56rem] leading-relaxed text-ink-3">
                    {params}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-line bg-lime/20 align-top">
                <td className="px-3 py-2.5 font-mono text-[0.58rem] tabular text-ink-3">+</td>
                <td className="px-3 py-2.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-3">
                  Strategist
                </td>
                <td className="px-3 py-2.5 text-xs text-ink">
                  Up to two model-selected probes
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[0.6rem] text-ink-2">
                  /v2/insights
                </td>
                <td className="px-3 py-2.5 font-mono text-[0.56rem] leading-relaxed text-ink-3">
                  urn:entity:book · podcast · tv_show · video_game · place · person · take = 8
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Base URL", "https://hackathon.api.qloo.com"],
            ["Concurrency", "3 in flight · 230 ms between starts"],
            ["Resilience", "15 s timeout · 4 attempts · backoff"],
            ["Cache", "6 h in-memory, server only"],
          ].map(([label, value]) => (
            <div key={label} className="bg-paper-2 px-3 py-3">
              <p className="label-sm text-ink-3">{label}</p>
              <p className="mt-1 font-mono text-[0.62rem] leading-relaxed text-ink-2">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-ink-2">
          <p>
            Requests are GET-only with the <code className="font-mono text-xs">X-Api-Key</code>{" "}
            header, sent from the server. The browser never sees the key or a raw Qloo response;
            it receives the derived memo and the probe ledger through an SSE stream.
          </p>
          <p>
            The heatmap omits{" "}
            <code className="font-mono text-xs">filter.location.query</code> when the requested
            location is Global. A failed probe is tolerated: the run continues with a typed
            fallback and a visible warning, so partial evidence never masquerades as complete
            evidence.
          </p>
        </div>
      </MethodSection>

      <MethodSection
        id="scoring"
        index="02"
        kicker="Scoring"
        title="One number, five published weights."
        note="The score is computed in TypeScript from the collected affinities. No model sets, adjusts or rounds it."
      >
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">Match index components and weights</caption>
            <thead>
              <tr className="bg-paper-3">
                {["Component", "Weight", "What it measures"].map((heading) => (
                  <th key={heading} scope="col" className="label px-3 py-2.5 text-ink-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weights.map((key) => (
                <tr key={key} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-medium">
                    {SCORE_LABELS[key]}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm tabular">
                    {Math.round(WEIGHTS[key] * 100)}%
                  </td>
                  <td className="px-3 py-3 text-xs leading-relaxed text-ink-2">
                    {SCORE_NOTES[key]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <pre className="mt-5 overflow-x-auto border border-ink bg-ink p-4 font-mono text-[0.66rem] leading-relaxed text-paper-2">
{`overall = round(
    0.30 × cultural overlap
  + 0.15 × complementarity
  + 0.15 × momentum
  + 0.15 × locality
  + 0.25 × cultural safety
)`}
        </pre>

        <div className="mt-6">
          <p className="label text-ink-3">Thresholds</p>
          <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-5">
            {tierOrder.map((tier) => (
              <div key={tier} className="bg-paper-2 px-3 py-3">
                <p className="font-mono text-[0.55rem] tabular text-ink-3">{tierRange[tier]}</p>
                <p className="mt-1 font-display text-base leading-tight">{TIER_META[tier].label}</p>
                <p className="mt-1.5 text-[0.68rem] leading-relaxed text-ink-3">
                  {TIER_META[tier].description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border border-line bg-paper-2 p-4">
          <p className="label text-ink-3">Confidence is coverage, not certainty</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Six checks contribute ten points each to a base of 34: at least 8 shared tags, 6
            cities, 2 trend series, 4 demographic segments, 2 cross-domain groups and 8 ledger
            entries. Live runs add 6; the result is clamped to 30–96. The archive is capped at 62
            because its evidence is fixed. Bands:{" "}
            <span className="font-mono text-xs">≥ 78 high</span>,{" "}
            <span className="font-mono text-xs">≥ 58 moderate</span>, otherwise{" "}
            <span className="font-mono text-xs">thin</span>.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            Below 58 the band is thin. A high score with thin coverage is a warning, not a green
            light.
          </p>
        </div>
      </MethodSection>

      <MethodSection
        id="blind"
        index="03"
        kicker="Blind test"
        title="A guess, frozen before the evidence."
        note="The comparison is the point: what a language model would say from names alone, next to what the taste graph actually shows."
      >
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            [
              "Freeze",
              "Before the first Qloo request, Gemini records a category-only guess: the pairing it would predict, the overlap it expects, and why. In the archive, the guess is authored to the same rule.",
            ],
            [
              "Probe",
              "Fourteen fixed queries run against the taste graph. The Strategist may commission up to two more. The blind guess is not shown to any probe.",
            ],
            [
              "Compare",
              "The memo publishes both, plus what the category guess missed. The critic checks the informed text against the same ledger as everything else.",
            ],
          ].map(([title, copy], index) => (
            <li key={title} className="border border-line bg-paper-2 p-4">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
                {String(index + 1).padStart(2, "0")} · {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{copy}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          In live mode the blind take is one of at most three Gemini calls: blind take, probe plan,
          memo. If Gemini is unavailable, a deterministic category heuristic is used and the memo
          says so.
        </p>
      </MethodSection>

      <MethodSection
        id="safety"
        index="04"
        kicker="Safety screen"
        title="A lexicon, not a legal opinion."
        note="Six rules inspect the returned tags. Penalties subtract from a safety score with a floor of 30, and the score carries 25% of the index."
      >
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <caption className="sr-only">Cultural safety rules</caption>
            <thead>
              <tr className="bg-paper-3">
                {["Rule", "Penalty", "Scope", "What triggers it"].map((heading) => (
                  <th key={heading} scope="col" className="label px-3 py-2.5 text-ink-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAFETY_RULE_SUMMARY.map((rule) => (
                <tr key={rule.code} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-medium">{rule.label}</td>
                  <td className="px-3 py-3 font-mono text-sm tabular text-orange-deep">
                    −{rule.penalty}
                  </td>
                  <td className="px-3 py-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-[0.08em] text-ink-3">
                    {rule.crossSide
                      ? "Cross-side only"
                      : rule.skipWhenBothSides
                        ? "Waived if shared"
                        : "Either side"}
                  </td>
                  <td className="px-3 py-3 text-xs leading-relaxed text-ink-2">{rule.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          A cross-side rule only fires when one audience holds the risk signal and the other holds
          the counterpart. A waived rule does not fire when both sides carry the same signal. No
          flag is proof of safety; the brands&apos; own standards and legal review still apply.
        </p>
      </MethodSection>

      <MethodSection
        id="limits"
        index="05"
        kicker="Failure modes"
        title="What breaks, and what the system does."
        note="Every failure has a defined behaviour. None of them is to invent a plausible answer."
      >
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Failure modes and system behaviour</caption>
            <thead>
              <tr className="bg-paper-3">
                {["Condition", "Behaviour"].map((heading) => (
                  <th key={heading} scope="col" className="label px-3 py-2.5 text-ink-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAILURES.map(([condition, behaviour]) => (
                <tr key={condition} className="border-t border-line align-top">
                  <td className="px-3 py-3 text-sm font-medium">{condition}</td>
                  <td className="px-3 py-3 text-xs leading-relaxed text-ink-2">{behaviour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border border-ink bg-paper-2 p-5">
          <p className="label text-ink-3">What this memo cannot support</p>
          <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink-2 sm:grid-cols-2">
            {[
              "No revenue, ROI, market-share or sponsorship valuation.",
              "No audience-size, reach or conversion estimate.",
              "No sales forecast and no claim that affinity implies purchase.",
              "No legal, regulatory or safety certification.",
              "No visibility into either brand's internal strategy or contracts.",
              "No real-time monitoring before the next run.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 bg-orange" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </MethodSection>

      <MethodSection
        id="reproduce"
        index="06"
        kicker="Reproduce"
        title="Run the same pipeline yourself."
        note="The repository is MIT-licensed. Keys are read from the server environment only and are never exposed to the client."
      >
        <div className="flex flex-wrap gap-2">
          {[
            "Next.js 16 App Router",
            "React 19",
            "TypeScript strict",
            "Tailwind CSS 4",
            "@google/genai",
            "Zod 4",
            "Vitest",
          ].map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
        </div>

        <pre className="mt-5 overflow-x-auto border border-ink bg-ink p-4 font-mono text-[0.68rem] leading-relaxed text-paper-2">
{`npm install
cp .env.example .env.local   # add QLOO_API_KEY and GEMINI_API_KEY
npm run dev                  # http://localhost:3000

npm run test                 # scoring, fixtures and safety suites
npm run typecheck
npm run lint
npm run build`}
        </pre>

        <div className="mt-5 overflow-x-auto border border-line">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">Environment variables</caption>
            <thead>
              <tr className="bg-paper-3">
                {["Variable", "Scope", "Purpose"].map((heading) => (
                  <th key={heading} scope="col" className="label px-3 py-2.5 text-ink-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["QLOO_API_KEY", "server only", "Enables live mode and the Qloo pipeline."],
                ["GEMINI_API_KEY", "server only", "Enables the blind take, probe planning and memo."],
                ["GEMINI_MODEL", "server only", "Optional model override. Default: gemini-2.5-flash."],
                ["QLOO_BASE_URL", "server only", "Optional. Must be the official host unless a local mock is explicitly allowed."],
                ["NEXT_PUBLIC_SITE_URL", "public", "Canonical URL used in metadata."],
                ["NEXT_PUBLIC_REPO_URL", "public", "Repository link in the footer."],
              ].map(([name, scope, purpose]) => (
                <tr key={name} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[0.62rem] text-ink">
                    {name}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-3">
                    {scope}
                  </td>
                  <td className="px-3 py-2.5 text-xs leading-relaxed text-ink-2">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-ghost h-10 px-3.5"
          >
            Source on GitHub
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={`${SITE.repoUrl}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer noopener"
            className="label link-underline text-ink-2 hover:text-ink"
          >
            MIT licence
          </a>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-3">
            Qloo Agentic Hackathon · 2026
          </span>
        </div>
      </MethodSection>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-5 border border-ink bg-lime px-5 py-6 sm:px-8">
        <div>
          <p className="label text-ink/60">The desk is open</p>
          <h2 className="display-3 mt-2">Put a pairing on the record.</h2>
        </div>
        <Link href="/match" className="btn btn-primary h-11 px-4">
          Run a match
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
