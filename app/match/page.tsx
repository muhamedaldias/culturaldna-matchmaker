import type { Metadata } from "next";
import Link from "next/link";
import { buildRuntimeStatus } from "@/lib/status";
import { AnalysisExperience, type MatchInitial } from "@/components/analysis/analysis-experience";
import { ModeBadge } from "@/components/mode-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Run a match",
  description:
    "Open a case file for any two brands. Seven agents probe Qloo's taste graph and return a due-diligence memo with a deterministic score and a full evidence ledger.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MatchPage({ searchParams }: { searchParams: SearchParams }) {
  const status = buildRuntimeStatus();
  const params = await searchParams;

  const requestedFixture = first(params.fixture).slice(0, 80);
  const fixture = requestedFixture
    ? status.fixtures.find((entry) => entry.slug === requestedFixture)
    : undefined;

  const fallback = status.fixtures[0];
  const a = (fixture?.brands[0] ?? first(params.a).slice(0, 80)).trim() || fallback?.brands[0] || "";
  const b = (fixture?.brands[1] ?? first(params.b).slice(0, 80)).trim() || fallback?.brands[1] || "";
  const location = (fixture?.location ?? first(params.location).slice(0, 60)).trim();
  const autorunParam = first(params.autorun);
  const autorun = Boolean((fixture || (a && b)) && (autorunParam === "1" || autorunParam === "true"));

  const initial: MatchInitial = {
    a,
    b,
    location,
    ...(fixture ? { fixture: fixture.slug } : {}),
    autorun,
  };

  return (
    <div className="shell py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-8 border-b border-line pb-8">
        <div className="max-w-[38rem]">
          <p className="label text-ink-3">The matchmaker</p>
          <h1 className="display-2 mt-3 text-balance">Put two brands on the stand.</h1>
          <p className="mt-4 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-2">
            One case file, seven agents, a published score and a memo you can defend. The
            evidence arrives first; the prose has to cite it.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <ModeBadge mode={status.mode} />
          <p className="max-w-[36ch] text-xs leading-relaxed text-ink-3 lg:text-right">
            {status.reason}
          </p>
          <Link
            href="/method"
            className="label link-underline text-ink-2 transition-colors hover:text-ink"
          >
            Method & weights
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <AnalysisExperience status={status} initial={initial} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
          Relative affinities · no revenue or audience-size estimates · every probe on the record
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/#memo" className="label link-underline text-ink-2 hover:text-ink">
            See a finished memo
          </Link>
          <Link href="/method#limits" className="label link-underline text-ink-2 hover:text-ink">
            What it cannot do
          </Link>
        </div>
      </div>
    </div>
  );
}
