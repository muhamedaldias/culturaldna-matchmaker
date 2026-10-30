import type { TagDomain } from "@/lib/types";

/**
 * Qloo's tag taxonomy does not ship a presentation domain, so the UI needs a
 * small, deterministic classifier. This is a display layer only — it never
 * changes affinity or scoring.
 */
const KEYWORDS: Array<[TagDomain, string[]]> = [
  ["values", [
    "sustainab", "environment", "climate", "activism", "ethical", "social justice",
    "charity", "philanthropy", "minimalism", "repair", "craftsmanship", "heritage",
    "tradition", "spirituality", "religion", "feminism", "vegan", "animal welfare",
    "food justice", "fair trade", "local sourcing",
  ]],
  ["food", [
    "food", "cook", "cuisine", "restaurant", "wine", "beer", "coffee", "tea",
    "bakery", "baking", "sourdough", "cheese", "farm", "market", "organic",
    "vegetarian", "bbq", "grill", "whisky", "cocktail", "brunch", "ferment",
    "chocolate", "pasta", "sushi", "pizza",
  ]],
  ["music", [
    "music", "hip hop", "hip-hop", "jazz", "rock", "pop", "folk", "indie",
    "electronic", "techno", "house", "classical", "opera", "afrobeat", "amapiano",
    "country", "metal", "punk", "soul", "r&b", "k-pop", "latin", "reggae",
    "playlist", "album", "vinyl", "concert", "festival",
  ]],
  ["film", [
    "film", "movie", "cinema", "documentary", "director", "actor", "actress",
    "horror", "comedy", "drama", "anime", "animation", "sci-fi", "thriller",
    "series", "tv show", "television",
  ]],
  ["sport", [
    "sport", "running", "run ", "marathon", "hiking", "climbing", "surf",
    "ski", "snowboard", "cycling", "football", "soccer", "basketball", "tennis",
    "golf", "boxing", "mma", "yoga", "fitness", "training", "sailing", "rowing",
    "motorsport", "formula", "esports", "gym", "swimming", "trail", "fishing",
  ]],
  ["travel", [
    "travel", "destination", "tourism", "hotel", "flight", "road trip", "backpack",
    "slow travel", "van life", "national park", "adventure", "island", "city break",
    "camping", "aviation",
  ]],
  ["wellness", [
    "wellness", "meditation", "mindfulness", "spa", "self-care", "sleep",
    "nutrition", "supplement", "biohack", "therapy", "mental health", "skincare",
    "beauty", "fragrance", "makeup", "cosmetic",
  ]],
  ["fashion", [
    "fashion", "style", "sneaker", "streetwear", "luxury", "couture", "watch",
    "jewel", "designer", "apparel", "denim", "vintage", "accessor", "shoe",
    "boot", "bag",
  ]],
  ["tech", [
    "tech", "gadget", "software", "hardware", "silicon", "streaming platform",
  ]],
  ["lifestyle", [
    "lifestyle", "home", "interior", "garden", "parenting", "family", "pet",
    "diy", "collecting", "reading", "book", "podcast", "gaming", "board game",
    "photography", "art", "design", "architecture",
  ]],
  ["culture", [
    "culture", "museum", "theatre", "theater", "literature", "poetry", "history",
    "science", "technology", "startup", "crypto", "politics", "news", "comedy",
    "anime", "manga", "gaming", "streaming",
  ]],
];

export function domainForTag(name: string, hint?: string): TagDomain {
  const haystack = `${name} ${hint ?? ""}`.toLowerCase();
  for (const [domain, words] of KEYWORDS) {
    if (words.some((word) => haystack.includes(word))) return domain;
  }
  return "other";
}

export const DOMAIN_LABELS: Record<TagDomain, string> = {
  values: "Values",
  lifestyle: "Lifestyle",
  food: "Food & drink",
  music: "Music",
  film: "Film & TV",
  travel: "Travel",
  wellness: "Wellness",
  sport: "Sport",
  fashion: "Fashion",
  culture: "Culture",
  tech: "Tech",
  other: "Other",
};

export const DOMAIN_ORDER: TagDomain[] = [
  "values",
  "food",
  "music",
  "film",
  "sport",
  "travel",
  "wellness",
  "fashion",
  "tech",
  "lifestyle",
  "culture",
  "other",
];
