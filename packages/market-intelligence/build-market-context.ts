import prisma from "@vip/database";
import { resolveWorkspace } from "@vip/shared/workspace/resolve-workspace";

import { analyzeCompetitorPatterns } from "./competitors";
import { buildDemographicProfile } from "./demographics";
import { buildHealthcareSignals } from "./healthcare-signals";
import { buildLocalContext } from "./seasonal";
import { persistMarketContextSnapshot } from "./persistence/persist-market-context-snapshot";
import { contentOpportunityScore } from "./social-trends";
import { collectTrendIntelligence } from "./trends";
import {
  BuildMarketContextInput,
  HealthcareSignal,
  MarketContext,
  OpportunitySignal,
  TrendSignal,
} from "./types";
import { buildRegionKey, clamp, rounded } from "./utils";

export async function buildMarketContext(input: BuildMarketContextInput): Promise<MarketContext> {
  const asOf = input.asOf ?? new Date();
  const specialtyFocus = input.specialtyFocus ?? [];
  const regionKey = buildRegionKey(input.region);
  await resolveWorkspace(
    {
      sourceName: "@vip/database",
      socialWorkspace: {
        findUnique: (options) => prisma.workspace.findUnique(options),
      },
      hospitalWorkspace: {
        findUnique: (options) => prisma.hospitalWorkspace.findUnique(options),
      },
    },
    { workspaceId: input.workspaceId, expectedType: "SOCIAL_INTELLIGENCE" }
  );
  const providerRequest = {
    workspaceId: input.workspaceId,
    region: input.region,
    regionKey,
    asOf,
    specialtyFocus,
  };
  const demographics = buildDemographicProfile({ region: input.region, asOf, specialtyFocus });
  const [trendingTopics, healthcareSignals, competitorPatterns] = await Promise.all([
    collectTrendIntelligence({
      ...providerRequest,
      providers: input.trendProviders,
      forceRefresh: input.forceRefresh,
    }),
    buildHealthcareSignals({
      ...providerRequest,
      providers: input.healthcareProviders,
      forceRefresh: input.forceRefresh,
      environmentalContext: input.environmentalContext,
    }),
    analyzeCompetitorPatterns(input.workspaceId),
  ]);
  const localContext = buildLocalContext({
    region: input.region,
    asOf,
    weatherSummary: input.environmentalContext?.weatherSummary,
  });
  const opportunitySignals = buildOpportunities(
    trendingTopics.risingTopics,
    healthcareSignals,
    specialtyFocus
  );
  const context: MarketContext = {
    version: "1.0",
    workspaceId: input.workspaceId,
    hospitalName: input.hospitalName,
    specialtyFocus,
    region: input.region,
    regionKey,
    generatedAt: asOf.toISOString(),
    demographics,
    trendingTopics,
    healthcareSignals,
    competitorPatterns,
    localContext,
    recommendedThemes: recommendedThemes(healthcareSignals, trendingTopics.risingTopics, localContext.items.map((item) => item.suggestedAngle)),
    audienceInsights: [
      `${demographics.primaryLanguages.slice(0, 2).map((language) => language.language).join(" and ")} should anchor regional-language testing.`,
      `${demographics.audienceSegments[0].label} are a priority estimated audience for trustworthy healthcare education.`,
      `Use ${demographics.recommendedContentStyles[0].toLowerCase()} and measure saves, shares and qualified actions against internal analytics.`,
    ],
    opportunitySignals,
    strategyInputs: {
      externalIntelligenceReady: true,
      combineWithInternal: [
        "Engagement analytics",
        "Top post performance",
        "Best posting times",
        "Content pillar performance",
      ],
      caution: "Validate clinical claims and live regional signals before publishing; estimates should guide tests, not replace evidence.",
    },
  };

  if (input.persist ?? true) {
    await persistMarketContextSnapshot(
      (data) => prisma.marketContextSnapshot.create({ data }),
      context,
      asOf
    );
  }

  return context;
}

function buildOpportunities(
  risingTopics: TrendSignal[],
  healthcareSignals: HealthcareSignal[],
  specialties: string[]
): OpportunitySignal[] {
  const trendOpportunities = risingTopics.slice(0, 6).map((topic) => {
    const clinical = specialties.some((specialty) =>
      topic.label.toLowerCase().includes(specialty.toLowerCase())
    ) ? 90 : 60;
    return {
      key: `trend:${topic.key}`,
      title: `Regional trend opportunity: ${topic.label}`,
      reason: `${topic.direction.toLowerCase()} external signal with ${Math.round(topic.confidence * 100)}% source confidence.`,
      score: contentOpportunityScore(topic, 80, clinical),
      confidence: topic.confidence,
      recommendedFormat: topic.category === "CONTENT_FORMAT" ? topic.label : "Doctor-led short explainer",
      relatedTopics: [topic.label],
    };
  });
  const healthOpportunities = healthcareSignals.slice(0, 4).map((signal) => ({
    key: `health:${signal.key}`,
    title: signal.title,
    reason: signal.rationale,
    score: rounded(clamp(signal.score * signal.confidence + 20)),
    confidence: signal.confidence,
    recommendedFormat: "Saveable local-language education reel",
    relatedTopics: [signal.title],
  }));

  return [...trendOpportunities, ...healthOpportunities].sort((a, b) => b.score - a.score);
}

function recommendedThemes(
  health: HealthcareSignal[],
  rising: TrendSignal[],
  localAngles: string[]
) {
  const candidates = [
    ...health.slice(0, 4).map((signal) => signal.title),
    ...rising.slice(0, 4).map((topic) => topic.label),
    ...localAngles.slice(0, 2),
  ];
  return [...new Set(candidates)].slice(0, 10);
}
