# CulturalDNA Matchmaker — pitch

**One line:** A seven-agent investigation that tells you whether two brands belong together — and exactly how to activate it — using Qloo's taste graph and a score that models cannot touch.

## The insight

Every brand partnership deck argues the same way: category adjacency, a few demographics, a mood board. The result is a $50M sponsorship built on a sentence nobody can audit: *"our audiences overlap."*

Qloo makes a different question answerable: **do these two audiences share a culture, and where does that culture live?** Not "both brands say sustainability" — but whether the same people, in the same cities, care about the same films, foods, artists and places.

That question is answerable only with data. It is also where language models are most dangerous: fluent, persuasive, and happy to invent a city.

So the product is built as an **investigation with an audit trail**, not a chatbot.

## How it works

1. **Scout** resolves both brands as Qloo entities.
2. **Ethnographer** maps each audience's taste tags, demographics and cross-domain signals.
3. **Diplomat** separates shared taste from private taste with `/v2/analysis/compare`.
4. **Cartographer** finds the cities where the combined culture concentrates.
5. **Timekeeper** reads twelve months of brand momentum.
6. **Strategist (Gemini)** records a blind, category-only guess *before* evidence, optionally commissions two extra probes, then writes the memo from the ledger.
7. **Critic (deterministic)** strips financial claims, repairs citations, rejects cities the data never returned.

The **match index** is a published weighted sum — 30% overlap, 15% complementarity, 15% momentum, 15% locality, 25% safety. Tiers and the confidence formula are printed in the app. Gemini can write the verdict, the plays and the risks. It cannot change the number.

## Why this wins on the rubric

**Technological implementation.** Fourteen fixed Qloo probes executed in a paced, cached, retry-safe client; two model-selected probes planned at runtime; SSE streaming of every stage, trace and evidence record; typed error recovery so one failed probe never voids a case; Gemini constrained by JSON schema with a deterministic fallback for every call. The scoring engine is pure and tested.

**Design.** The interface is a strategy memo, not a dashboard: editorial typography, hairline rules, a live investigation console, a score card you can read at a glance, and a ledger where every claim links to the probe that supports it. Archive cases are labelled as illustrations in the UI and in the API stream.

**Potential impact.** Partnership and sponsorship teams spend weeks on diligence that is mostly vibes. This compresses the cultural argument into minutes and — more importantly — makes it falsifiable. The same engine works for sponsorships, co-branded products, retail media, talent pairing and market entry.

**Quality of the idea.** The blind test is the product's spine: the model's prior is recorded before the evidence, then shown next to what the data changed. It is a new ritual for AI-assisted strategy work — confidence earned, not performed.

## Demo script (2 minutes 45 seconds)

| Time | Beat |
| --- | --- |
| 0:00 | Landing page. "Two brands. One culture map." Point at the worked case: 79/100, three plays, 14 probes. |
| 0:15 | "This is not a chatbot. It is an investigation." Scroll the seven-agent ledger. Note the blind test. |
| 0:30 | Open the memo. Show the score card: five published weights, confidence as coverage. |
| 0:45 | Scroll to "What the data changed": the category guess (EV maker, fitness brand, national parks) versus the evidence-led verdict (a culinary, place-based ritual). |
| 1:05 | Taste DNA and cities: Portland, Boulder, Austin. "The food axis is deeper than the outdoor axis — a model would never guess that." |
| 1:20 | The three plays, then the evidence ledger. Click a citation; it jumps to the probe that supports it. |
| 1:40 | Run a fresh pairing. The console streams Scout → Ethnographer → … → Critic. Qloo and Gemini indicators are on. |
| 2:10 | The new memo lands. Point at the critic's note: it removed claims Qloo could not support. |
| 2:25 | Close on the method page: published weights, safety lexicon, failure modes, "what this memo cannot support." "Every number is deterministic. Every claim has a citation. Every memo states its limits." |

## What we deliberately did not build

- No revenue, ROI or audience-size estimates. Qloo returns affinities; pretending otherwise would be dishonest.
- No free-form chat. The product asks a fixed set of questions so the answer can be compared across cases.
- No model-owned scores. The number is computed, tested and published.

## Built with

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Qloo hackathon API · Google Gemini (`@google/genai`) · Zod · Vitest · Vercel

## Next

- Save runs to a workspace so teams can compare pairings over time.
- Let analysts pin a probe they want re-run after a Qloo data refresh.
- Add a sponsorship-fit variant that accepts a budget band — still with no revenue claims.
- Publish the safety lexicon for review by brand-safety teams.
