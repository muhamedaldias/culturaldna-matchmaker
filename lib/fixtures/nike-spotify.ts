import type { DemoFixture } from "@/lib/fixtures/type";
import { brand, city, tag, trend } from "@/lib/fixtures/helpers";

export const nikeSpotify: DemoFixture = {
  slug: "nike-spotify",
  location: "Global",
  subtitle: "Sportswear × audio streaming",
  a: brand({
    id: "demo:brand:nike",
    name: "Nike",
    type: "brand",
    subtype: "Sportswear",
    description:
      "Global sportswear company built on athlete storytelling, performance product and city-level community sport.",
    popularity: 0.97,
  }),
  b: brand({
    id: "demo:brand:spotify",
    name: "Spotify",
    type: "brand",
    subtype: "Audio streaming",
    description:
      "Audio platform whose playlists, podcasts and discovery surfaces shape mainstream music taste.",
    popularity: 0.95,
  }),
  shared: [
    tag("tag:hip-hop", "hip hop", "music", 0.89),
    tag("tag:sneaker-culture", "sneaker culture", "fashion", 0.87),
    tag("tag:running", "running", "sport", 0.86),
    tag("tag:live-music", "live music", "music", 0.82),
    tag("tag:football", "football (soccer)", "sport", 0.79),
    tag("tag:streetwear", "streetwear", "fashion", 0.78),
    tag("tag:fitness-training", "fitness training", "wellness", 0.76),
    tag("tag:basketball", "basketball", "sport", 0.74),
    tag("tag:podcasts", "podcasts", "culture", 0.72),
    tag("tag:festival-culture", "festival culture", "culture", 0.7),
    tag("tag:afrobeats", "afrobeats", "music", 0.65),
    tag("tag:gaming", "gaming", "culture", 0.58),
  ],
  uniqueA: [
    tag("tag:marathon", "marathon running", "sport", 0.82),
    tag("tag:basketball-sneakers", "basketball sneakers", "fashion", 0.81),
    tag("tag:athlete-storytelling", "athlete storytelling", "culture", 0.76),
    tag("tag:performance-apparel", "performance apparel", "fashion", 0.71),
    tag("tag:track-and-field", "track and field", "sport", 0.63),
    tag("tag:sports-marketing", "sports marketing", "culture", 0.58),
  ],
  uniqueB: [
    tag("tag:indie-playlists", "indie playlists", "music", 0.84),
    tag("tag:music-discovery", "music discovery", "tech", 0.79),
    tag("tag:true-crime-podcasts", "true crime podcasts", "culture", 0.73),
    tag("tag:lo-fi-beats", "lo-fi beats", "music", 0.68),
    tag("tag:concert-ticketing", "concert ticketing", "culture", 0.66),
    tag("tag:audiobooks", "audiobooks", "culture", 0.62),
  ],
  cities: [
    city(1, "Atlanta", 0.88, "Georgia"),
    city(2, "London", 0.85, undefined, "United Kingdom"),
    city(3, "Seoul", 0.83, undefined, "South Korea"),
    city(4, "Berlin", 0.8, undefined, "Germany"),
    city(5, "Mexico City", 0.79, undefined, "Mexico"),
    city(6, "Lagos", 0.76, undefined, "Nigeria"),
    city(7, "New York", 0.75, "New York"),
    city(8, "Los Angeles", 0.74, "California"),
    city(9, "São Paulo", 0.72, undefined, "Brazil"),
    city(10, "Tokyo", 0.7, undefined, "Japan"),
  ],
  demographics: {
    a: [
      { segment: "Adults 18–34", affinity: 0.86 },
      { segment: "Urban core", affinity: 0.82 },
      { segment: "Students", affinity: 0.68 },
      { segment: "Household income $50–100k", affinity: 0.63 },
      { segment: "Male-skewed", affinity: 0.61 },
    ],
    b: [
      { segment: "Adults 18–34", affinity: 0.89 },
      { segment: "Urban core", affinity: 0.84 },
      { segment: "Students", affinity: 0.74 },
      { segment: "Household income $50–100k", affinity: 0.66 },
      { segment: "Female-skewed", affinity: 0.57 },
    ],
    sharedNote:
      "The audiences are unusually close in age and geography. The difference is format: Nike's audience gathers around physical events, Spotify's around discovery. A partnership should make discovery physical.",
  },
  trends: [
    trend("Nike", "brand", [72, 72, 73, 74, 73, 75, 76, 75, 77, 78, 77, 79]),
    trend("Spotify", "brand", [70, 71, 70, 72, 73, 74, 73, 75, 76, 75, 77, 78]),
    trend("Afrobeats", "music", [61, 62, 64, 63, 66, 68, 67, 70, 72, 73, 75, 77]),
  ],
  crossDomain: [
    {
      entityType: "artist",
      domainLabel: "Artists",
      items: [
        { name: "Burna Boy", affinity: 0.78 },
        { name: "Kendrick Lamar", affinity: 0.75 },
        { name: "NewJeans", affinity: 0.71 },
      ],
    },
    {
      entityType: "movie",
      domainLabel: "Film",
      items: [
        { name: "Hoop Dreams", affinity: 0.68 },
        { name: "Space Jam", affinity: 0.63 },
        { name: "Amy", affinity: 0.6 },
      ],
    },
    {
      entityType: "destination",
      domainLabel: "Places",
      items: [
        { name: "Atlanta, Georgia", affinity: 0.76 },
        { name: "Seoul, South Korea", affinity: 0.72 },
        { name: "Lagos, Nigeria", affinity: 0.68 },
      ],
    },
  ],
  plays: [
    {
      index: 1,
      title: "Run Club Radio",
      thesis:
        "A weekly city run club with a Spotify soundtrack and Nike pacing crews. Each city gets a resident curator, a route built around local music landmarks, and a playlist that unlocks at the finish line.",
      format: "8 cities · weekly · 12-week season",
      city: "Atlanta, Georgia",
      audience: "18–34 urban runners and music discovery audiences",
      successSignals: [
        "Weekly attendance retention after week four",
        "Playlist saves attributed to the event",
        "New app registrations per city",
      ],
      evidenceRefs: ["p-heatmap", "p-tags-a", "p-cross-artist"],
      confidence: "high",
    },
    {
      index: 2,
      title: "Sonic Sole",
      thesis:
        "Three artists design a shoe and its soundtrack at the same time. The drop is one object in two formats: a physical sneaker and an exclusive audio world with liner notes, demos and a short film.",
      format: "3-artist capsule · global drop · 6 weeks",
      city: "London, United Kingdom",
      audience: "Sneaker collectors and playlist-led listeners",
      successSignals: [
        "Sell-through in the first 72 hours",
        "Streams per capsule track",
        "Secondary-market premium within 30 days",
      ],
      evidenceRefs: ["p-tags-b", "p-compare", "p-cross-artist"],
      confidence: "medium",
    },
    {
      index: 3,
      title: "Halftime Frequency",
      thesis:
        "Micro-concerts inside Nike retail during tournament windows, curated by Spotify's local editors. Small rooms, short sets, and a recording released the same night — a physical moment that feeds the audio platform.",
      format: "5 shows · 300-cap rooms · tournament windows",
      city: "Seoul, South Korea",
      audience: "Basketball and K-pop-adjacent audiences",
      successSignals: [
        "Attendance versus RSVP rate",
        "Same-night stream lift for performing artists",
        "Retail conversion during event hours",
      ],
      evidenceRefs: ["p-cross-movie", "p-tags-a", "p-demo-a"],
      confidence: "medium",
    },
  ],
  risks: [
    {
      title: "Artist compensation scrutiny",
      severity: "high",
      detail:
        "Any artist-linked capsule will be read through the platform's royalty debate. A silent deal invites the story to be written by critics.",
      mitigation:
        "Publish the split and the artist's approval rights up front; let the artist speak first, not the brands.",
      evidenceRefs: ["p-tags-b", "p-compare"],
    },
    {
      title: "Combined data footprint",
      severity: "high",
      detail:
        "Listening and training signals are both sensitive. Cross-brand matching would trigger privacy objections even where it is technically lawful.",
      mitigation:
        "Do not join datasets. Keep personalisation inside each platform and share only aggregate, k-anonymised insight.",
      evidenceRefs: ["p-demo-a", "p-demo-b"],
    },
    {
      title: "Drop fatigue",
      severity: "medium",
      detail:
        "Sneaker and playlist drops are now the default move. A third capsule in the same quarter will read as inventory management, not culture.",
      mitigation:
        "Cap the cadence at three per year and give each drop a distinct city and sound rather than a new colourway.",
      evidenceRefs: ["p-trends"],
    },
  ],
  safetyFlags: [
    {
      code: "artist-labour",
      label: "Artist compensation scrutiny",
      penalty: 7,
      detail:
        "Artist-linked activations are read through the platform's royalty debate; terms must be public and fair.",
    },
    {
      code: "data-privacy",
      label: "Combined data footprint",
      penalty: 8,
      detail:
        "Joining listening and training data would create a sensitive profile and a regulatory conversation.",
    },
    {
      code: "drop-fatigue",
      label: "Drop fatigue",
      penalty: 4,
      detail:
        "The audience has seen many sneaker-playlist capsules; novelty is a finite resource.",
    },
  ],
  blind: {
    guess:
      "A model would pair Nike with Apple, a football club or a luxury fashion house, citing sport, design and celebrity reach.",
    rationale:
      "Both brands are described as global, youthful and culturally fluent, so a model gravitates to status partnerships. It treats 'music' as a marketing channel rather than a taste domain with its own geography.",
    predictedOverlap: ["sports", "celebrity", "youth culture", "fashion"],
    misses: [
      "The strongest shared signals are sneaker culture and running, not general 'sports'.",
      "Seoul and Lagos out-rank Paris and New York once music discovery is included.",
      "Podcast and audiobook taste is a genuine bridge — and an unusual one for a sportswear brand.",
    ],
    source: "curated",
  },
  informed: {
    headline: "A movement brand and a discovery engine, meeting in the street.",
    paragraphs: [
      "Nike and Spotify are not an obvious pair until you look at how their audiences actually spend attention: running, sneakers, live music, football, streetwear. The overlap is physical culture with a soundtrack, not 'sports plus music' in the abstract.",
      "The geography is the surprise. Atlanta, London, Seoul, Berlin, Mexico City and Lagos carry more combined affinity than the traditional luxury capitals. That is a map for a city-by-city rollout, and it argues for local curators rather than a single global anthem.",
      "The risks are structural rather than creative: artist compensation and data privacy. Both are solvable, but only by designing the deal terms before the campaign. If those are handled in public, the partnership has a credible claim to being a new model rather than another capsule.",
    ],
  },
  verdict: {
    headline: "The overlap is physical culture with a soundtrack.",
    summary:
      "This is a stronger pairing than the category logic suggests. Sneaker culture, running and live music bind the audiences, and the city map points to a genuinely global rollout beyond the usual luxury capitals. The deal only works if artist terms and data boundaries are settled in public before launch.",
    posture: "Lead with run clubs; treat capsules as the second act.",
  },
  caveats: [
    "Affinities are relative Qloo signals, not audience sizes.",
    "City affinity measures cultural concentration, not sales potential.",
    "Artist names illustrate taste adjacency; no endorsement is implied.",
  ],
  probes: [
    {
      id: "p-search-a",
      agent: "scout",
      label: "Resolve brand — Nike",
      endpoint: "/search",
      params: { query: "Nike", types: "urn:entity:brand", take: 5 },
      resultCount: 5,
      note: "Top match: Nike, sportswear.",
      durationMs: 274,
    },
    {
      id: "p-search-b",
      agent: "scout",
      label: "Resolve brand — Spotify",
      endpoint: "/search",
      params: { query: "Spotify", types: "urn:entity:brand", take: 5 },
      resultCount: 5,
      note: "Top match: Spotify, audio streaming.",
      durationMs: 288,
    },
    {
      id: "p-entities",
      agent: "scout",
      label: "Confirm entity records",
      endpoint: "/entities",
      params: { entity_ids: "nike,spotify" },
      resultCount: 2,
      durationMs: 176,
    },
    {
      id: "p-tags-a",
      agent: "ethnographer",
      label: "Taste tags — Nike",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:tag",
        "signal.interests.entities": "Nike",
        take: 40,
      },
      resultCount: 40,
      durationMs: 441,
    },
    {
      id: "p-tags-b",
      agent: "ethnographer",
      label: "Taste tags — Spotify",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:tag",
        "signal.interests.entities": "Spotify",
        take: 40,
      },
      resultCount: 40,
      durationMs: 468,
    },
    {
      id: "p-compare",
      agent: "diplomat",
      label: "Shared vs unique taste",
      endpoint: "/v2/analysis/compare",
      params: {
        "a.signal.interests.entities": "Nike",
        "b.signal.interests.entities": "Spotify",
        "filter.type": "urn:tag",
        take: 40,
      },
      resultCount: 28,
      note: "12 shared tags survive the top-40 cut.",
      durationMs: 529,
    },
    {
      id: "p-demo-a",
      agent: "ethnographer",
      label: "Audience profile — Nike",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:demographics",
        "signal.interests.entities": "Nike",
        take: 25,
      },
      resultCount: 25,
      durationMs: 384,
    },
    {
      id: "p-demo-b",
      agent: "ethnographer",
      label: "Audience profile — Spotify",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:demographics",
        "signal.interests.entities": "Spotify",
        take: 25,
      },
      resultCount: 25,
      durationMs: 396,
    },
    {
      id: "p-heatmap",
      agent: "cartographer",
      label: "City affinity",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:heatmap",
        "signal.interests.entities": "Nike,Spotify",
        take: 50,
      },
      resultCount: 50,
      note: "Atlanta, London and Seoul lead; Lagos appears above Paris and New York.",
      durationMs: 812,
    },
    {
      id: "p-trends",
      agent: "timekeeper",
      label: "12-month momentum",
      endpoint: "/v2/trending",
      params: {
        "filter.type": "urn:entity:brand",
        "signal.interests.entities": "Nike,Spotify",
        "filter.start_date": "2025-11-01",
        "filter.end_date": "2026-10-01",
        take: 50,
      },
      resultCount: 24,
      durationMs: 655,
    },
    {
      id: "p-cross-artist",
      agent: "ethnographer",
      label: "Cross-domain — artists",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:artist",
        "signal.interests.entities": "Nike,Spotify",
        take: 8,
      },
      resultCount: 8,
      durationMs: 377,
    },
    {
      id: "p-cross-movie",
      agent: "ethnographer",
      label: "Cross-domain — film",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:movie",
        "signal.interests.entities": "Nike,Spotify",
        take: 8,
      },
      resultCount: 8,
      durationMs: 361,
    },
    {
      id: "p-cross-destination",
      agent: "ethnographer",
      label: "Cross-domain — destinations",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:destination",
        "signal.interests.entities": "Nike,Spotify",
        take: 8,
      },
      resultCount: 8,
      durationMs: 349,
    },
    {
      id: "p-model-venue",
      agent: "strategist",
      label: "Model-selected probe — live venues",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:place",
        "signal.interests.entities": "Nike,Spotify",
        "filter.location.query": "Atlanta",
        take: 6,
      },
      resultCount: 6,
      note: "The Strategist asked for Atlanta venues to test a run-club finish line.",
      durationMs: 402,
      selectedBy: "model",
    },
  ],
};
