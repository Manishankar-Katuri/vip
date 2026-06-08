import { CompetitorAnalyticsDashboard, scoreCompetitor, uniqueCompetitors } from "@/competitors/competitor-analytics-dashboard";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { loadIntegrationHealth, loadPlaceLocations } from "@/lib/acquisition/live-client-data";
import { findCompetitorsForLocations, type PlaceCompetitorLocationGroup } from "@/lib/acquisition/places";
import { getProductExperience } from "@/lib/product-experience";
import { analyzeCompetitors, type SocialAnalyticsOverview } from "@vip/social-engine";
import {
  generateCompetitorAnalysisReport,
  type CompetitorAnalysisReportInput,
  type CompetitorReportCompetitor,
  type CompetitorReportSource,
  type CompetitorReportSourceImports,
} from "@vip/market-intelligence/competitors";

export const dynamic = "force-dynamic";

export default async function CompetitorPage() {
  const [data, places, integrations] = await Promise.all([
    getProductExperience(),
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);

  if (!data.available || !data.analytics || !data.workspaceId) {
    const fallbackData = {
      ...data,
      available: true as const,
      workspaceName: data.workspaceName,
      analytics: emptyAnalytics(data.workspaceId ?? "unavailable"),
    } satisfies LiveData;

    return (
      <CompetitorAnalyticsDashboard
        data={fallbackData}
        places={places}
        scoredGroups={[]}
        competitors={[]}
        socialCompetitors={{ workspaceId: data.workspaceId ?? "unavailable", competitors: [], gaps: [] }}
        integrations={integrations}
        competitorReport={generateCompetitorAnalysisReport({
          workspaceId: data.workspaceId ?? "unavailable",
          hospital: buildHospitalBaseline(fallbackData, places),
          competitors: [],
        })}
      />
    );
  }

  const [competitorGroups, socialCompetitors] = await Promise.all([
    findCompetitorsForLocations(places, "Hyderabad", "ENT"),
    analyzeCompetitors(data.workspaceId),
  ]);
  const scoredGroups = scoreGroups(competitorGroups);
  const competitors = uniqueCompetitors(scoredGroups);
  const reportInput = buildCompetitorReportInput({
    workspaceId: data.workspaceId,
    data,
    places,
    competitors,
    socialCompetitors,
  });
  const competitorReport = generateCompetitorAnalysisReport(reportInput);
  const liveData = {
    ...data,
    available: true as const,
    analytics: data.analytics,
    workspaceId: data.workspaceId,
  } satisfies LiveData;

  return (
    <CompetitorAnalyticsDashboard
      data={liveData}
      places={places}
      scoredGroups={scoredGroups}
      competitors={competitors}
      socialCompetitors={socialCompetitors}
      integrations={integrations}
      competitorReport={competitorReport}
    />
  );
}

function scoreGroups(groups: PlaceCompetitorLocationGroup[]) {
  return groups.map((group) => ({
    ...group,
    competitors: group.competitors.map((competitor) => scoreCompetitor(competitor, group.centre)),
  }));
}

function emptyAnalytics(workspaceId: string): SocialAnalyticsOverview {
  const emptyAggregate = {
    totalPosts: 0,
    postsWithMetrics: 0,
    avgEngagementRate: 0,
    totalReach: 0,
    totalImpressions: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSaves: 0,
  };

  return {
    workspaceId,
    period: { from: null, to: null },
    totalPosts: 0,
    totalReach: 0,
    totalImpressions: 0,
    avgEngagementRate: 0,
    engagementTrend: {
      direction: "STABLE",
      percentageChange: null,
      series: [],
      anomalies: [],
    },
    postingFrequency: [],
    topPosts: [],
    contentTypeBreakdown: {
      pillars: [],
      formats: [],
    },
    followerGrowth: {
      available: false,
      currentFollowers: null,
      change: null,
      percentageChange: null,
      series: [],
      reason: "Connected social analytics are unavailable.",
    },
    rolling7Day: emptyAggregate,
    rolling30Day: emptyAggregate,
    bestByFormat: [],
    bestPostingTimes: [],
    hashtagPerformance: [],
    meta: { sampledPosts: 0, truncated: false },
  };
}

function buildCompetitorReportInput({
  workspaceId,
  data,
  places,
  competitors,
  socialCompetitors,
}: {
  workspaceId: string;
  data: { analytics?: SocialAnalyticsOverview | null };
  places: Awaited<ReturnType<typeof loadPlaceLocations>>;
  competitors: ReturnType<typeof uniqueCompetitors>;
  socialCompetitors: Awaited<ReturnType<typeof analyzeCompetitors>>;
}): CompetitorAnalysisReportInput {
  const socialByName = new Map(
    socialCompetitors.competitors.map((competitor) => [
      normalizeKey(competitor.displayName ?? competitor.handle),
      competitor,
    ])
  );
  const reportCompetitors: CompetitorReportCompetitor[] = competitors.map((competitor) => {
    const social = socialByName.get(normalizeKey(competitor.name));
    const imported = extractSourceImports(social?.metrics);

    return {
      id: competitor.placeId,
      name: competitor.name,
      location: competitor.address,
      domain: competitor.website,
      sourceLabels: uniqueSources(["Google Places", ...(imported.labels ?? [])]),
      marketVisibility: competitor.marketStrength,
      localSearchPresence: localSearchScore(competitor),
      reputation: {
        rating: competitor.rating,
        reviewVolume: competitor.reviews,
        sentiment: sentimentFromReviews(competitor.reviewSnippets),
      },
      social: socialMetrics(social?.metrics),
      socialPresence: socialPresenceScore(social?.metrics),
      seo: seoMetrics(social?.metrics),
      seoVisibility: numericMetric(social?.metrics, ["seoVisibility", "keywordVisibility", "organicVisibility"]),
      content: contentMetrics(social?.metrics),
      contentStrength: numericMetric(social?.metrics, ["contentStrength", "contentGapScore", "contentScore"]),
      movement: imported.movement,
    };
  });

  const placesOnly = new Set(reportCompetitors.map((competitor) => competitor.id));
  for (const social of socialCompetitors.competitors) {
    if ([...placesOnly].some((id) => normalizeKey(id) === normalizeKey(social.id))) continue;
    const imported = extractSourceImports(social.metrics);
    reportCompetitors.push({
      id: social.id,
      name: social.displayName ?? `@${social.handle}`,
      sourceLabels: uniqueSources(["Sprout Social", ...(imported.labels ?? [])]),
      social: socialMetrics(social.metrics),
      socialPresence: socialPresenceScore(social.metrics),
      seo: seoMetrics(social.metrics),
      seoVisibility: numericMetric(social.metrics, ["seoVisibility", "keywordVisibility", "organicVisibility"]),
      content: contentMetrics(social.metrics),
      contentStrength: numericMetric(social.metrics, ["contentStrength", "contentGapScore", "contentScore"]),
      movement: imported.movement,
    });
  }

  return {
    workspaceId,
    hospital: buildHospitalBaseline(data, places),
    competitors: reportCompetitors,
    imports: mergeStoredImports(socialCompetitors.competitors.map((competitor) => competitor.metrics)),
  };
}

function buildHospitalBaseline(data: { analytics?: SocialAnalyticsOverview | null }, places: Awaited<ReturnType<typeof loadPlaceLocations>>) {
  const matched = places.filter((place) => place.status === "Matched");
  const reviewVolume = matched.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const rating = weightedRating(matched);
  const analytics = data.analytics ?? undefined;

  return {
    name: "Harika ENT Care Hospitals",
    socialPresence: analytics ? Math.min(100, analytics.avgEngagementRate * 10 + Math.min(40, analytics.totalReach / 1000)) : undefined,
    localSearchPresence: matched.length ? Math.min(100, matched.length * 18 + Math.min(40, reviewVolume / 20)) : undefined,
    reputation: {
      rating: rating ?? undefined,
      reviewVolume,
      sentiment: undefined,
    },
    social: analytics ? {
      followers: analytics.followerGrowth.currentFollowers ?? undefined,
      reach: analytics.totalReach,
      engagementRate: analytics.avgEngagementRate,
      postsPerWeek: postsPerWeek(analytics),
    } : undefined,
    content: analytics ? {
      themes: analytics.contentTypeBreakdown.pillars.map((pillar) => pillar.pillar).slice(0, 6),
      frequencyPerWeek: postsPerWeek(analytics),
      topContentTypes: analytics.bestByFormat.map((format) => format.contentType).slice(0, 4),
    } : undefined,
    contentStrength: analytics ? Math.min(100, analytics.avgEngagementRate * 10 + analytics.bestByFormat.length * 8) : undefined,
  };
}

function extractSourceImports(value: unknown): { labels?: CompetitorReportSource[]; movement?: CompetitorReportCompetitor["movement"] } {
  if (!isRecord(value)) return {};
  const labels: CompetitorReportSource[] = [];
  for (const key of ["similarweb", "semrush", "ahrefs", "sproutSocial"]) {
    if (isRecord(value[key])) labels.push(sourceLabelForKey(key));
  }
  const movement = Array.isArray(value.movement)
    ? value.movement.filter((item): item is NonNullable<CompetitorReportCompetitor["movement"]>[number] =>
      isRecord(item) &&
      typeof item.metric === "string" &&
      typeof item.changePercent === "number" &&
      ["growth", "decline", "emerging"].includes(String(item.trend))
    )
    : undefined;

  return { labels, movement };
}

function mergeStoredImports(metrics: unknown[]): CompetitorReportSourceImports {
  const imports: CompetitorReportSourceImports = {};
  for (const metric of metrics) {
    if (!isRecord(metric)) continue;
    appendImport(imports, "similarweb", metric.similarweb);
    appendImport(imports, "semrush", metric.semrush);
    appendImport(imports, "ahrefs", metric.ahrefs);
    appendImport(imports, "sproutSocial", metric.sproutSocial);
  }
  return imports;
}

function appendImport(imports: CompetitorReportSourceImports, key: keyof CompetitorReportSourceImports, value: unknown) {
  if (!isRecord(value)) return;
  imports[key] = [
    ...(imports[key] ?? []),
    {
      competitorId: typeof value.competitorId === "string" ? value.competitorId : undefined,
      name: typeof value.name === "string" ? value.name : undefined,
      domain: typeof value.domain === "string" ? value.domain : undefined,
      confidence: typeof value.confidence === "number" ? value.confidence : undefined,
      metrics: isRecord(value.metrics) ? value.metrics : value,
      movement: Array.isArray(value.movement) ? value.movement as NonNullable<CompetitorReportSourceImports[typeof key]>[number]["movement"] : undefined,
    },
  ];
}

function socialMetrics(value: unknown) {
  return {
    followers: numericMetric(value, ["followers", "followerCount", "currentFollowers"]),
    reach: numericMetric(value, ["reach", "totalReach", "audienceReach"]),
    engagementRate: numericMetric(value, ["engagementRate", "avgEngagementRate", "engagement_rate"]),
    postsPerWeek: numericMetric(value, ["postsPerWeek", "postingFrequencyPerWeek", "postingFrequency"]),
  };
}

function seoMetrics(value: unknown) {
  return {
    keywordVisibility: numericMetric(value, ["keywordVisibility", "organicVisibility", "organicKeywords"]),
    servicePageVisibility: numericMetric(value, ["servicePageVisibility", "servicePages"]),
    localSeoStrength: numericMetric(value, ["localSeoStrength", "localSearchPresence", "mapPackVisibility"]),
  };
}

function contentMetrics(value: unknown) {
  return {
    themes: stringArrayMetric(value, ["themes", "contentThemes", "topThemes"]),
    frequencyPerWeek: numericMetric(value, ["frequencyPerWeek", "contentFrequency", "postingFrequencyPerWeek"]),
    topContentTypes: stringArrayMetric(value, ["topContentTypes", "contentTypes", "formats"]),
  };
}

function socialPresenceScore(value: unknown) {
  return numericMetric(value, ["socialPresence", "socialScore", "shareOfVoice"]);
}

function localSearchScore(competitor: { marketStrength: number; relevanceSignals: string[]; website?: string; weekdayText?: string[]; photoCount?: number }) {
  return Math.min(100, competitor.marketStrength * 0.65 + competitor.relevanceSignals.length * 7 + (competitor.website ? 8 : 0) + (competitor.weekdayText?.length ? 5 : 0) + Math.min(10, competitor.photoCount ?? 0));
}

function sentimentFromReviews(reviews: Array<{ rating: number }>) {
  if (!reviews.length) return undefined;
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length / 5 * 100;
}

function postsPerWeek(analytics: SocialAnalyticsOverview) {
  if (!analytics.period.from || !analytics.period.to) return undefined;
  const days = Math.max(1, (new Date(analytics.period.to).getTime() - new Date(analytics.period.from).getTime()) / (24 * 60 * 60 * 1000));
  return analytics.totalPosts / days * 7;
}

function numericMetric(value: unknown, keys: string[]): number | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const direct = value[key];
    if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  }
  for (const nested of ["similarweb", "semrush", "ahrefs", "sproutSocial", "metrics"]) {
    const candidate = numericMetric(value[nested], keys);
    if (candidate !== undefined) return candidate;
  }
  return undefined;
}

function stringArrayMetric(value: unknown, keys: string[]): string[] | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const direct = value[key];
    if (Array.isArray(direct)) return direct.filter((item): item is string => typeof item === "string");
  }
  for (const nested of ["similarweb", "semrush", "ahrefs", "sproutSocial", "metrics"]) {
    const candidate = stringArrayMetric(value[nested], keys);
    if (candidate?.length) return candidate;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceLabelForKey(key: string): CompetitorReportSource {
  if (key === "similarweb") return "Similarweb";
  if (key === "semrush") return "SEMrush";
  if (key === "ahrefs") return "Ahrefs";
  return "Sprout Social";
}

function uniqueSources(values: CompetitorReportSource[]) {
  return [...new Set(values)];
}

function weightedRating(places: Awaited<ReturnType<typeof loadPlaceLocations>>) {
  const weighted = places.reduce(
    (total, place) => {
      const reviews = place.reviews ?? 0;
      const rating = place.rating ?? 0;
      return { reviews: total.reviews + reviews, score: total.score + rating * reviews };
    },
    { reviews: 0, score: 0 },
  );
  return weighted.reviews ? weighted.score / weighted.reviews : null;
}
