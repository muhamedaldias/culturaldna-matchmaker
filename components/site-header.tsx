import Link from "next/link";
import { HelixMark, ArrowRight } from "@/components/marks";
import { NAV_LINKS } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="CulturalDNA Matchmaker — home"
        >
          <HelixMark className="h-8 w-auto shrink-0 text-ink transition-transform duration-300 group-hover:-rotate-6" />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[1.18rem] leading-none tracking-[-0.035em]">
              CulturalDNA
            </span>
            <span className="label-sm hidden text-ink-3 sm:inline">Matchmaker</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="label text-ink-2 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://hackathon.qloo.com"
            target="_blank"
            rel="noreferrer noopener"
            className="label text-ink-2 transition-colors hover:text-ink"
          >
            Qloo ↗
          </a>
        </nav>

        <Link href="/match" className="btn btn-primary h-10 px-3.5 text-[0.65rem] sm:px-4 sm:text-[0.7rem]">
          Run a match
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
