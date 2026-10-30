import type { BlindTake, EvidenceProbe, SafetyFlag, Scores } from "@/lib/types";
import type { LiveDataset } from "@/lib/qloo/collect";
import type { MemoDraft } from "@/lib/agents/schemas";

function refsFor(evidence: EvidenceProbe[], match: (probe: EvidenceProbe) => boolean, limit = 2) {
  const found = evidence.filter(match).slice(0, limit).map((probe) => probe.id);
  if (found.length > 0) return found;
  return evidence.slice(0, 1).map((probe) => probe.id);
}

function tierWord(scores: Scores) {
  switch (scores.tier) {
    case "exceptional":
      return "rare";
    case "strong":
      return "durable";
    case "promising":
      return "promising";
    case "cautious":
      return "fragile";
    default:
      return "misaligned";
  }
}

export function computeBlindMisses(blind: BlindTake, dataset: LiveDataset): string[] {
  const predicted = blind.predictedOverlap.map((item) => item.toLowerCase());
  const mentioned = (name: string) =>
    predicted.some((guess) => guess.includes(name.toLowerCase()) || name.toLowerCase().includes(guess));

  const candidates = [...dataset.shared, ...dataset.uniqueB]
    .filter((tag) => !mentioned(tag.name))
    .slice(0, 3);

  const misses = candidates.map(
    (tag) =>
      `The graph surfaced ${tag.name} (${tag.domain}, affinity ${tag.score.toFixed(2)}) — a signal the category-only guess did not name.`,
  );

  if (misses.length < 2) {
    misses.push(
      "The guess reasoned from category adjacency, so it could not rank Portland above Denver or put a food ritual at the centre of an outdoor brand.",
    );
  }
  return misses.slice(0, 4);
}

export function fallbackMemo(
  dataset: LiveDataset,
  scores: Scores,
  safetyFlags: SafetyFlag[],
  blind: BlindTake,
): MemoDraft {
  const topShared = dataset.shared.slice(0, 3);
  const sharedNames = topShared.map((tag) => tag.name);
  const topCity = dataset.cities[0];
  const secondCity = dataset.cities[1] ?? topCity;
  const thirdCity = dataset.cities[2] ?? topCity;
  const topDomain = dataset.crossDomain[0];

  const city = topCity?.name ?? "the strongest market";
  const cityTwo = secondCity?.name ?? city;
  const cityThree = thirdCity?.name ?? cityTwo;
  const sharedList =
    sharedNames.length > 1
      ? `${sharedNames.slice(0, -1).join(", ")} and ${sharedNames[sharedNames.length - 1]}`
      : (sharedNames[0] ?? "shared taste signals");

  const highConfidence =
    scores.overall >= 78 && dataset.shared.length >= 8 && dataset.cities.length >= 5;
  const confidence: MemoDraft["plays"][number]["confidence"] = highConfidence
    ? "high"
    : scores.confidence >= 55
      ? "medium"
      : "low";

  const verdictHeadline = `A ${tierWord(scores)} fit led by ${sharedNames[0] ?? "shared taste"}.`;
  const summary = `${dataset.a.name} and ${dataset.b.name} share ${dataset.shared.length} taste signals, led by ${sharedList}. ${
    topCity
      ? `Combined affinity concentrates in ${topCity.name}${secondCity ? ` and ${secondCity.name}` : ""}.`
      : "Locality data was thin in this run, so the memo does not recommend a city."
  } ${safetyFlags.length > 0 ? `The main cultural risk is ${safetyFlags[0].label.toLowerCase()}.` : "No lexicon-level safety conflicts were detected."}`;

  const informedHeadline = `The shared signal is ${sharedNames[0] ?? "adjacent taste"}; the activation is ${topDomain?.domainLabel.toLowerCase() ?? "place"}.`;
  const paragraphs = [
    `The overlap between ${dataset.a.name} and ${dataset.b.name} is built on ${sharedList}. ${
      dataset.uniqueA.length > 0
        ? `${dataset.a.name} brings ${dataset.uniqueA.slice(0, 2).map((tag) => tag.name).join(" and ")}`
        : `${dataset.a.name} brings reach`
    }${
      dataset.uniqueB.length > 0
        ? `, while ${dataset.b.name} contributes ${dataset.uniqueB.slice(0, 2).map((tag) => tag.name).join(" and ")}. That difference is the reason a partnership can produce something neither brand owns alone.`
        : "."
    }`,
    topCity
      ? `The geography is specific. ${topCity.name}${topCity.region ? `, ${topCity.region}` : ""} carries the strongest combined affinity, followed by ${secondCity?.name ?? "the next market"} and ${thirdCity?.name ?? "the third"}. A city-by-city rollout will read more credibly than a national campaign, and it gives the partnership a physical place to begin.`
      : "The locality probe returned too little to recommend a city. The partnership should start with a content or product test rather than a live activation.",
    safetyFlags.length > 0
      ? `The risks are cultural, not commercial. ${safetyFlags.map((flag) => flag.label.toLowerCase()).join(", ")} all sit close to this pairing, and each one is easier to design around before launch than to explain afterwards. The memo deliberately contains no revenue projection: affinity is a relative signal, not a forecast.`
      : "No cultural-safety flags were raised by the lexicon, but affinity is still a relative signal. The memo deliberately contains no revenue projection, and the plays should be tested before they are scaled.",
  ];

  return {
    verdict: {
      headline: verdictHeadline,
      summary,
      posture:
        scores.overall >= 76
          ? `Pilot in ${city}, then scale through content.`
          : scores.overall >= 60
            ? `Test in ${city} before committing to a full partnership.`
            : "Do not proceed until the cultural distance is addressed.",
    },
    informed: {
      headline: informedHeadline,
      paragraphs,
    },
    blind_misses: computeBlindMisses(blind, dataset),
    plays: [
      {
        title: "A city-first table",
        thesis: `Bring ${dataset.a.name} and ${dataset.b.name} into one room in ${city}. A two-day format built around ${sharedList}: a morning programme, a long table, and a small stage. The point is not reach; it is to make the shared culture visible to the people who already hold it.`,
        format: `2-day activation · ${[city, secondCity?.name, cityThree]
          .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
          .join(" · ")}`,
        city,
        audience:
          dataset.demographics.a[0] && dataset.demographics.b[0]
            ? `${dataset.demographics.a[0].segment} and ${dataset.demographics.b[0].segment}`
            : "The shared urban audience",
        success_signals: [
          "Attendance versus RSVP across both days",
          "Return rate for a second edition",
          "Earned media in each brand's core press",
        ],
        evidence_refs: refsFor(
          dataset.probes,
          (probe) =>
            probe.endpoint.includes("heatmap") ||
            probe.label.toLowerCase().includes("city") ||
            probe.label.toLowerCase().includes("shared"),
        ),
        confidence,
      },
      {
        title: "A co-created edition",
        thesis: `Pair ${
          dataset.uniqueA[0]?.name ?? "the first brand's craft"
        } with ${dataset.uniqueB[0]?.name ?? "the second brand's daily ritual"} in one limited edition. The object should be ordinary enough to use and specific enough to argue about. Publish the method behind it, not just the campaign.`,
        format: `Limited edition · 2 seasons · ${cityTwo}`,
        city: cityTwo,
        audience: "Existing customers of both brands, plus the adjacent audience each one lacks",
        success_signals: [
          "Sell-through versus the category benchmark",
          "Repeat purchase within 60 days",
          "Method or sourcing documentation published on schedule",
        ],
        evidence_refs: refsFor(
          dataset.probes,
          (probe) =>
            probe.label.toLowerCase().includes("taste tags") ||
            probe.endpoint.includes("compare"),
        ),
        confidence,
      },
      {
        title: "A shared stage",
        thesis: `A short content series anchored in ${topDomain?.items[0]?.name ?? "the strongest cross-domain signal"}. Four episodes, each filmed in a place where the two audiences already overlap, with the brands as producers rather than narrators.`,
        format: `4-part series · ${cityThree} · owned channels`,
        city: cityThree,
        audience: "The combined audience, reached through culture rather than category",
        success_signals: [
          "Completed views across all four parts",
          "Organic shares versus paid reach",
          "A second-season commission from either brand",
        ],
        evidence_refs: refsFor(
          dataset.probes,
          (probe) =>
            probe.label.toLowerCase().includes("cross-domain") ||
            probe.label.toLowerCase().includes("model-selected"),
        ),
        confidence,
      },
    ],
    risks: [
      ...(safetyFlags.length > 0
        ? safetyFlags.slice(0, 2).map((flag) => ({
            title: flag.label,
            severity: flag.penalty >= 9 ? ("high" as const) : ("medium" as const),
            detail: flag.detail,
            mitigation:
              "Design the governance before the creative: publish the standard, name the reviewer, and give them the right to stop the campaign.",
            evidence_refs: refsFor(dataset.probes, (probe) =>
              probe.label.toLowerCase().includes("taste tags"),
            ),
          }))
        : []),
      {
        title: "Affinity is not a shared customer",
        severity: "medium" as const,
        detail: `The audiences overlap culturally, but ${
          dataset.demographics.a[0]?.segment ?? "the first audience"
        } and ${dataset.demographics.b[0]?.segment ?? "the second"} are not the same people. Treating the match index as a media plan would overstate the reach of any joint activity.`,
        mitigation:
          "Keep two audience journeys and one shared idea; measure each brand's audience separately.",
        evidence_refs: refsFor(dataset.probes, (probe) =>
          probe.label.toLowerCase().includes("audience profile"),
        ),
      },
      {
        title: "Coverage risk",
        severity: dataset.probes.length < 8 ? ("high" as const) : ("low" as const),
        detail:
          dataset.probes.length < 8
            ? "This run returned fewer probes than expected, so the memo rests on partial evidence. The recommendation should be treated as directional."
            : "The memo rests on a single query window and a lexicon-level safety screen. It cannot see a brand's internal strategy, pricing or legal constraints.",
        mitigation:
          "Re-run with a second city or season, and validate the safety screen with the brand's own legal and sustainability teams.",
        evidence_refs: [],
      },
    ].slice(0, 4),
  };
}
