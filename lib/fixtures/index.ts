import type { DemoFixture } from "@/lib/fixtures/type";
import { patagoniaWholeFoods } from "@/lib/fixtures/patagonia-whole-foods";
import { nikeSpotify } from "@/lib/fixtures/nike-spotify";
import { rolexRedBull } from "@/lib/fixtures/rolex-red-bull";

export const FIXTURES: DemoFixture[] = [
  patagoniaWholeFoods,
  nikeSpotify,
  rolexRedBull,
];

export function getFixture(slug: string): DemoFixture | undefined {
  return FIXTURES.find((fixture) => fixture.slug === slug);
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Match a free-text pair to a curated fixture in either order. Returns the
 * fixture plus whether the caller's order had to be normalised.
 */
function nameMatches(input: string, canonical: string) {
  if (!input) return false;
  if (input === canonical) return true;
  if (input.length >= 4 && canonical.startsWith(`${input} `)) return true;
  if (canonical.length >= 4 && input.startsWith(`${canonical} `)) return true;
  return false;
}

export function resolveFixture(
  a: string,
  b: string,
): { fixture: DemoFixture; swapped: boolean } | undefined {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return undefined;

  for (const fixture of FIXTURES) {
    const nameA = normalise(fixture.a.name);
    const nameB = normalise(fixture.b.name);
    if (nameMatches(left, nameA) && nameMatches(right, nameB)) {
      return { fixture, swapped: false };
    }
    if (nameMatches(left, nameB) && nameMatches(right, nameA)) {
      return { fixture, swapped: true };
    }
  }
  return undefined;
}

export const FIXTURE_OPTIONS = FIXTURES.map((fixture) => ({
  slug: fixture.slug,
  label: `${fixture.a.name} × ${fixture.b.name}`,
  brands: [fixture.a.name, fixture.b.name] as [string, string],
  subtitle: fixture.subtitle,
  location: fixture.location,
}));

export { patagoniaWholeFoods, nikeSpotify, rolexRedBull };
