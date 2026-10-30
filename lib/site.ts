/**
 * Absolute site URL used for metadata and Open Graph. Prefers an explicit
 * NEXT_PUBLIC_SITE_URL, then the stable production domain Vercel provides at
 * build time, and only falls back to localhost when neither exists.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "CulturalDNA Matchmaker",
  short: "CulturalDNA",
  tagline: "Cultural due diligence for brand partnerships.",
  description:
    "A multi-agent investigation across Qloo's taste graph that tells you whether two brands belong together — and exactly how to activate it.",
  repoUrl:
    process.env.NEXT_PUBLIC_REPO_URL ??
    "https://github.com/muhamedaldias/culturaldna-matchmaker",
  siteUrl: resolveSiteUrl(),
} as const;

export const NAV_LINKS = [
  { href: "/#investigation", label: "Investigation" },
  { href: "/#memo", label: "The memo" },
  { href: "/method", label: "Method" },
] as const;
