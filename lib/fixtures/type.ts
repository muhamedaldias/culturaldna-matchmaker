import type {
  BlindTake,
  BrandRef,
  CitySignal,
  CrossDomainGroup,
  DemographicSignal,
  Play,
  Risk,
  SafetyFlag,
  TasteTag,
  TrendSeries,
} from "@/lib/types";
import type { ProbeSeed } from "@/lib/fixtures/helpers";

export type DemoFixture = {
  slug: string;
  location: string;
  subtitle: string;
  a: BrandRef;
  b: BrandRef;
  shared: TasteTag[];
  uniqueA: TasteTag[];
  uniqueB: TasteTag[];
  cities: CitySignal[];
  demographics: {
    a: DemographicSignal[];
    b: DemographicSignal[];
    sharedNote: string;
  };
  trends: TrendSeries[];
  crossDomain: CrossDomainGroup[];
  plays: Play[];
  risks: Risk[];
  safetyFlags: SafetyFlag[];
  blind: BlindTake;
  informed: { headline: string; paragraphs: string[] };
  verdict: { headline: string; summary: string; posture: string };
  caveats: string[];
  probes: ProbeSeed[];
};
