import type { DemoFixture } from "@/lib/fixtures/type";
import { brand, city, tag, trend } from "@/lib/fixtures/helpers";

export const rolexRedBull: DemoFixture = {
  slug: "rolex-red-bull",
  location: "Global",
  subtitle: "Luxury horology × energy & extreme sport",
  a: brand({
    id: "demo:brand:rolex",
    name: "Rolex",
    type: "brand",
    subtype: "Luxury watches",
    description:
      "Swiss watchmaker whose brand is built on precision, sporting patronage and long-horizon heritage.",
    popularity: 0.93,
  }),
  b: brand({
    id: "demo:brand:red-bull",
    name: "Red Bull",
    type: "brand",
    subtype: "Energy drinks & events",
    description:
      "Energy drink company that operates as a global sports and entertainment producer, from Formula 1 to cliff diving.",
    popularity: 0.94,
  }),
  shared: [
    tag("tag:motorsport", "motorsport", "sport", 0.88),
    tag("tag:formula-1", "Formula 1", "sport", 0.86),
    tag("tag:precision-engineering", "precision engineering", "culture", 0.84),
    tag("tag:alpine-sports", "alpine sports", "sport", 0.81),
    tag("tag:endurance-racing", "endurance racing", "sport", 0.79),
    tag("tag:sailing", "sailing", "sport", 0.76),
    tag("tag:aviation", "aviation", "travel", 0.73),
    tag("tag:luxury-craftsmanship", "luxury craftsmanship", "fashion", 0.7),
    tag("tag:adventure-travel", "adventure travel", "travel", 0.69),
    tag("tag:extreme-sports", "extreme sports", "sport", 0.66),
  ],
  uniqueA: [
    tag("tag:haute-horlogerie", "haute horlogerie", "fashion", 0.87, "The proprietary core of the brand."),
    tag("tag:heritage-luxury", "heritage luxury", "values", 0.83),
    tag("tag:yachting", "yachting", "sport", 0.71),
    tag("tag:golf", "golf", "sport", 0.62),
    tag("tag:tennis", "tennis", "sport", 0.58),
    tag("tag:classical-music", "classical music", "music", 0.55),
  ],
  uniqueB: [
    tag("tag:energy-drinks", "energy drinks", "food", 0.85),
    tag("tag:esports", "esports", "culture", 0.72),
    tag("tag:cliff-diving", "cliff diving", "sport", 0.69),
    tag("tag:music-festivals", "music festivals", "music", 0.66),
    tag("tag:breakdancing", "breakdancing", "culture", 0.64),
    tag("tag:aviation-racing", "aviation racing", "sport", 0.61),
  ],
  cities: [
    city(1, "Monaco", 0.86, undefined, "Monaco"),
    city(2, "Dubai", 0.84, undefined, "United Arab Emirates"),
    city(3, "Zermatt", 0.8, undefined, "Switzerland"),
    city(4, "Austin", 0.78, "Texas"),
    city(5, "Salzburg", 0.75, undefined, "Austria"),
    city(6, "Singapore", 0.74, undefined, "Singapore"),
    city(7, "São Paulo", 0.71, undefined, "Brazil"),
    city(8, "Silverstone", 0.69, undefined, "United Kingdom"),
    city(9, "Tokyo", 0.68, undefined, "Japan"),
    city(10, "Miami", 0.66, "Florida"),
  ],
  demographics: {
    a: [
      { segment: "Household income $500k+", affinity: 0.72 },
      { segment: "Adults 35–64", affinity: 0.78 },
      { segment: "Watch collectors", affinity: 0.81 },
      { segment: "Frequent global travellers", affinity: 0.76 },
      { segment: "C-suite and founders", affinity: 0.58 },
    ],
    b: [
      { segment: "Adults 18–34", affinity: 0.83 },
      { segment: "Household income $75–150k", affinity: 0.61 },
      { segment: "Students", affinity: 0.66 },
      { segment: "Extreme-sports fans", affinity: 0.79 },
      { segment: "Gamers and esports viewers", affinity: 0.63 },
    ],
    sharedNote:
      "The overlap is event-led, not demographic. The audiences barely share an income bracket; they share a spectator culture organised around precision and managed risk. Any activation that assumes a shared wallet will misread both.",
  },
  trends: [
    trend("Rolex", "brand", [74, 74, 75, 74, 75, 76, 76, 77, 77, 78, 78, 78]),
    trend("Red Bull", "brand", [71, 72, 71, 72, 73, 72, 73, 74, 73, 74, 75, 75]),
    trend("Formula 1", "sport", [68, 69, 71, 70, 73, 74, 76, 77, 78, 79, 79, 80]),
  ],
  crossDomain: [
    {
      entityType: "artist",
      domainLabel: "Artists",
      items: [
        { name: "Hans Zimmer", affinity: 0.64 },
        { name: "The Weeknd", affinity: 0.58 },
        { name: "Ólafur Arnalds", affinity: 0.55 },
      ],
    },
    {
      entityType: "movie",
      domainLabel: "Film",
      items: [
        { name: "Senna", affinity: 0.72 },
        { name: "Rush", affinity: 0.68 },
        { name: "Free Solo", affinity: 0.63 },
      ],
    },
    {
      entityType: "destination",
      domainLabel: "Places",
      items: [
        { name: "Monaco", affinity: 0.79 },
        { name: "Zermatt, Switzerland", affinity: 0.73 },
        { name: "Silverstone, UK", affinity: 0.66 },
      ],
    },
  ],
  plays: [
    {
      index: 1,
      title: "Altitude Protocol",
      thesis:
        "An invitational alpine endurance race where Rolex owns timekeeping and Red Bull owns production. The format borrows the grammar of both brands: measured, dangerous, beautifully filmed.",
      format: "3 days · 120 athletes · Zermatt · global broadcast cut",
      city: "Zermatt, Switzerland",
      audience: "Alpine sports and motorsport spectators",
      successSignals: [
        "Broadcast reach and completed views",
        "Earned media in sport and luxury press",
        "Invitation acceptance rate for the following year",
      ],
      evidenceRefs: ["p-heatmap", "p-tags-a", "p-cross-movie"],
      confidence: "high",
    },
    {
      index: 2,
      title: "The Long Lap",
      thesis:
        "A four-part documentary on endurance racing: the engineering, the fatigue, the pit crews. Rolex supplies the archive and the timing obsession; Red Bull supplies access and athletes.",
      format: "4 × 24-minute films · streaming + owned channels",
      city: "Silverstone, United Kingdom",
      audience: "Motorsport and engineering audiences",
      successSignals: [
        "Completed views across parts",
        "Distribution deals with two streaming platforms",
        "Watch-model search lift during the run",
      ],
      evidenceRefs: ["p-cross-movie", "p-trends", "p-tags-b"],
      confidence: "medium",
    },
    {
      index: 3,
      title: "Precision Salon",
      thesis:
        "Invitation-only collector dinners around grand-prix weekends. A watchmaker demonstrates a movement; a Red Bull athlete talks about risk; forty guests, no press, no logo wall.",
      format: "6 dinners · 40 guests · Monaco, Austin, Singapore",
      city: "Monaco",
      audience: "Collectors, teams and long-standing partners",
      successSignals: [
        "Attendance of top-tier collectors",
        "Allocation requests following the dinner",
        "Partner renewals attributed to the series",
      ],
      evidenceRefs: ["p-demo-a", "p-demo-b", "p-heatmap"],
      confidence: "medium",
    },
  ],
  risks: [
    {
      title: "Brand dilution",
      severity: "high",
      detail:
        "An energy drink at the centre of a luxury partnership can read as a sponsorship cheque rather than a cultural alliance. The luxury audience is quick to detect a mismatch.",
      mitigation:
        "Keep the energy product out of the creative. Let Red Bull appear as producer and athlete partner, and give Rolex control of the visual and timing language.",
      evidenceRefs: ["p-tags-a", "p-tags-b"],
    },
    {
      title: "Safety incident exposure",
      severity: "high",
      detail:
        "Extreme sport carries real physical risk. A serious incident at a co-branded event would attach to both brands, and the luxury partner has the most to lose.",
      mitigation:
        "Adopt a published safety standard, independent marshals and a pre-agreed communications protocol before the first event.",
      evidenceRefs: ["p-tags-b"],
    },
    {
      title: "Audience mismatch",
      severity: "medium",
      detail:
        "The two audiences barely share an income bracket or an age band. A campaign that assumes one audience will under-serve both.",
      mitigation:
        "Build two distinct audience journeys around a single event, rather than one blended message.",
      evidenceRefs: ["p-demo-a", "p-demo-b"],
    },
  ],
  safetyFlags: [
    {
      code: "brand-dilution",
      label: "Brand dilution",
      penalty: 10,
      detail:
        "The luxury codes are fragile; a mass-market energy brand can erode them even in a well-produced collaboration.",
    },
    {
      code: "safety-incidents",
      label: "Safety incident exposure",
      penalty: 8,
      detail:
        "Extreme sport creates physical risk that attaches to every brand on the event.",
    },
    {
      code: "price-positioning",
      label: "Price-positioning gap",
      penalty: 4,
      detail:
        "A $10k watch and a $3 can sit in the same frame only if the creative is handled with discipline.",
    },
  ],
  blind: {
    guess:
      "A model would pair Rolex with Aston Martin, a luxury hotel group or a private-aviation brand.",
    rationale:
      "Language models associate luxury with other luxury categories and optimise for audience income. That produces a safe, expensive pairing with almost no cultural tension — and almost no story.",
    predictedOverlap: ["luxury", "wealth", "precision", "heritage"],
    misses: [
      "The real bridge is spectator culture around precision and risk, not income.",
      "Red Bull already operates the sporting infrastructure Rolex sponsors around.",
      "Monaco and Zermatt outperform Dubai on combined affinity despite Dubai's wealth signal.",
    ],
    source: "curated",
  },
  informed: {
    headline: "A sponsorship architecture, not a co-brand.",
    paragraphs: [
      "The overlap between Rolex and Red Bull is not a shared customer. It is a shared spectator: people who watch precision being tested under pressure. Motorsport, alpine sport, sailing and aviation all sit in that frame, and both brands already own pieces of the infrastructure.",
      "That makes the partnership an architecture rather than a product. Rolex brings timekeeping, archive and the visual code of measured precision. Red Bull brings production capability, athletes and the willingness to operate the event. The two roles are complementary and rarely overlap.",
      "The danger is dilution. An energy drink at the centre of a luxury story will read as a cheque. The energy product has to stay out of the creative; Red Bull appears as producer, not as beverage. If that discipline holds, the pairing is more credible than a conventional luxury alliance — and considerably more interesting.",
    ],
  },
  verdict: {
    headline: "A sponsorship architecture built on precision and managed risk.",
    summary:
      "The audiences do not share a wallet, but they share a spectator culture: motorsport, alpine sport, sailing and aviation. Rolex owns time and heritage; Red Bull owns production and athletes. The pairing works as an event platform, not as a co-branded product — provided the energy drink stays out of the frame.",
    posture: "Build one flagship event; keep the product out of the creative.",
  },
  caveats: [
    "Affinities are relative Qloo signals, not audience sizes.",
    "No sponsorship valuation is implied by this memo.",
    "City affinity measures cultural concentration, not sales potential.",
  ],
  probes: [
    {
      id: "p-search-a",
      agent: "scout",
      label: "Resolve brand — Rolex",
      endpoint: "/search",
      params: { query: "Rolex", types: "urn:entity:brand", take: 5 },
      resultCount: 5,
      note: "Top match: Rolex, luxury watches.",
      durationMs: 301,
    },
    {
      id: "p-search-b",
      agent: "scout",
      label: "Resolve brand — Red Bull",
      endpoint: "/search",
      params: { query: "Red Bull", types: "urn:entity:brand", take: 5 },
      resultCount: 5,
      note: "Top match: Red Bull, energy drinks.",
      durationMs: 315,
    },
    {
      id: "p-entities",
      agent: "scout",
      label: "Confirm entity records",
      endpoint: "/entities",
      params: { entity_ids: "rolex,red-bull" },
      resultCount: 2,
      durationMs: 181,
    },
    {
      id: "p-tags-a",
      agent: "ethnographer",
      label: "Taste tags — Rolex",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:tag",
        "signal.interests.entities": "Rolex",
        take: 40,
      },
      resultCount: 40,
      durationMs: 434,
    },
    {
      id: "p-tags-b",
      agent: "ethnographer",
      label: "Taste tags — Red Bull",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:tag",
        "signal.interests.entities": "Red Bull",
        take: 40,
      },
      resultCount: 40,
      durationMs: 447,
    },
    {
      id: "p-compare",
      agent: "diplomat",
      label: "Shared vs unique taste",
      endpoint: "/v2/analysis/compare",
      params: {
        "a.signal.interests.entities": "Rolex",
        "b.signal.interests.entities": "Red Bull",
        "filter.type": "urn:tag",
        take: 40,
      },
      resultCount: 22,
      note: "10 shared tags survive the top-40 cut; the overlap is sport-heavy.",
      durationMs: 498,
    },
    {
      id: "p-demo-a",
      agent: "ethnographer",
      label: "Audience profile — Rolex",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:demographics",
        "signal.interests.entities": "Rolex",
        take: 25,
      },
      resultCount: 25,
      durationMs: 379,
    },
    {
      id: "p-demo-b",
      agent: "ethnographer",
      label: "Audience profile — Red Bull",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:demographics",
        "signal.interests.entities": "Red Bull",
        take: 25,
      },
      resultCount: 25,
      note: "Income brackets barely intersect — an event-led, not demographic, pairing.",
      durationMs: 388,
    },
    {
      id: "p-heatmap",
      agent: "cartographer",
      label: "City affinity",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:heatmap",
        "signal.interests.entities": "Rolex,Red Bull",
        take: 50,
      },
      resultCount: 50,
      note: "Monaco, Dubai and Zermatt lead; Austin appears above Miami.",
      durationMs: 795,
    },
    {
      id: "p-trends",
      agent: "timekeeper",
      label: "12-month momentum",
      endpoint: "/v2/trending",
      params: {
        "filter.type": "urn:entity:brand",
        "signal.interests.entities": "Rolex,Red Bull",
        "filter.start_date": "2025-11-01",
        "filter.end_date": "2026-10-01",
        take: 50,
      },
      resultCount: 24,
      note: "Formula 1 is the fastest-moving shared signal.",
      durationMs: 632,
    },
    {
      id: "p-cross-artist",
      agent: "ethnographer",
      label: "Cross-domain — artists",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:artist",
        "signal.interests.entities": "Rolex,Red Bull",
        take: 8,
      },
      resultCount: 8,
      durationMs: 358,
    },
    {
      id: "p-cross-movie",
      agent: "ethnographer",
      label: "Cross-domain — film",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:movie",
        "signal.interests.entities": "Rolex,Red Bull",
        take: 8,
      },
      resultCount: 8,
      note: "Senna and Rush out-rank general adventure films.",
      durationMs: 364,
    },
    {
      id: "p-cross-destination",
      agent: "ethnographer",
      label: "Cross-domain — destinations",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:destination",
        "signal.interests.entities": "Rolex,Red Bull",
        take: 8,
      },
      resultCount: 8,
      durationMs: 347,
    },
    {
      id: "p-model-alpine",
      agent: "strategist",
      label: "Model-selected probe — alpine events",
      endpoint: "/v2/insights",
      params: {
        "filter.type": "urn:entity:destination",
        "signal.interests.entities": "Red Bull",
        "filter.tags": "alpine",
        take: 6,
      },
      resultCount: 6,
      note: "The Strategist tested whether Red Bull's alpine audience overlaps Rolex's event map.",
      durationMs: 411,
      selectedBy: "model",
    },
  ],
};
