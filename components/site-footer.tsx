import Link from "next/link";
import { HelixMark } from "@/components/marks";
import { SITE } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Run a match", href: "/match" },
      { label: "The memo", href: "/#memo" },
      { label: "Method & weights", href: "/method" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Qloo API", href: "https://hackathon.qloo.com", external: true },
      { label: "GitHub", href: SITE.repoUrl, external: true },
      { label: "MIT licence", href: `${SITE.repoUrl}/blob/main/LICENSE`, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="shell py-14 sm:py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <HelixMark className="h-9 w-auto text-ink" />
              <span className="font-display text-xl tracking-[-0.035em]">CulturalDNA</span>
            </Link>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-ink-2">
              {SITE.tagline} A hackathon build on top of Qloo&apos;s taste graph and Google
              Gemini.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="label text-ink-3">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-underline text-sm text-ink-2 hover:text-ink"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="link-underline text-sm text-ink-2 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="label text-ink-3">Data note</p>
            <p className="mt-4 text-[0.8rem] leading-relaxed text-ink-2">
              Demo analyses are curated illustrations assembled from Qloo&apos;s public entity
              and tag taxonomy — not live API output. Live mode runs the same pipeline against
              the Qloo taste graph in real time.
            </p>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-3">
              No audience-size or revenue figures are estimated. Affinities are relative
              signals, not market forecasts.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-sm text-ink-3">
            © 2026 {SITE.name} · MIT-licensed
          </p>
          <p className="text-xs text-ink-3">
            Built for the Qloo Agentic Hackathon. Not affiliated with Qloo.
          </p>
        </div>
      </div>
    </footer>
  );
}
