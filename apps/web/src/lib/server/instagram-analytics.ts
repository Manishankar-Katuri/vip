import prisma from "@vip/database";

import {
  normalizeHospitalKey,
  resolveHarikaSocialWorkspaceId
} from "@/lib/harika-workspace";
import { buildDataProvenance, type DataProvenance } from "@/lib/phase-e";

type JsonRecord = Record<string, unknown>;

export type BenchmarkStatus =
  | "ABOVE_BENCHMARK"
  | "ON_BENCHMARK"
  | "BELOW_BENCHMARK"
  | "DATA_LIMITED";

export type BenchmarkComparison = {
  label: "Hospital History" | "Local Competitors" | "Industry Average";
  value: number | null;
  status: BenchmarkStatus;
  display: string;
  source: string;
};

export type KpiPayload = {
  key: string;
  label: string;
  value: number | null;
  displayValue: string;
  momChange: number | null;
  displayChange: string;
  benchmarkComparisons: BenchmarkComparison[];
};

export type InstagramAnalyticsPayload = {
  success: boolean;
  workspaceId: string | null;
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  dataFreshness: string | null;
  provenance: DataProvenance;
  overview: {
    kpis: KpiPayload[];
    trend: Array<{ date: string; reach: number; impressions: number; engagementRate: number }>;
    summary: string[];
  };
  audience: {
    growthSeries: Array<{ date: string; followers: number }>;
    ageGroups: Array<{ label: string; value: number }>;
    genderSplit: Array<{ label: string; value: number }>;
    topCities: Array<{ label: string; value: number }>;
    activeHours: Array<{ day: string; hour: number; value: number }>;
  };
  content: {
    topByFormat: Record<string, ContentRow[]>;
    engagementByType: Array<{ label: string; posts: number; engagementRate: number }>;
  };
  engagement: {
    totals: Array<{ label: string; value: number; displayValue: string }>;
    mixTrend: Array<{ date: string; likes: number; comments: number; saves: number; shares: number }>;
    highestIntent: ContentRow[];
  };
  discovery: {
    reachTrend: Array<{ date: string; reach: number }>;
    impressionsTrend: Array<{ date: string; impressions: number }>;
    hashtags: Array<{ tag: string; postCount: number; reach: number; avgEngagementRate: number; benchmark: BenchmarkStatus }>;
    exploreReach: { value: number | null; status: BenchmarkStatus; note: string };
    discoverySplit: Array<{ label: string; value: number }> | null;
  };
  healthcareInsights: {
    departments: HealthcareRow[];
    doctorContent: HealthcareRow[];
    educationalContent: HealthcareRow[];
    awarenessCampaigns: HealthcareRow[];
  };
  benchmarks: Array<{
    metric: string;
    current: string;
    comparisons: BenchmarkComparison[];
  }>;
  recommendations: Array<{
    title: string;
    priority: "High" | "Medium" | "Low";
    expectedImpact: string;
    evidenceMetric: string;
    owner: string;
    nextAction: string;
  }>;
  notes: string[];
};

type ContentRow = {
  id: string;
  title: string;
  format: string;
  postedAt: string;
  mediaUrl: string | null;
  url: string | null;
  reach: number;
  impressions: number;
  engagementRate: number;
  saves: number;
  shares: number;
  comments: number;
  appointmentClicks: number;
  benchmark: BenchmarkStatus;
};

type HealthcareRow = {
  label: string;
  posts: number;
  reach: number;
  engagementRate: number;
  appointmentClicks: number;
  benchmark: BenchmarkStatus;
};

type PostWithMetrics = {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  url: string | null;
  mediaType: string | null;
  contentType: string;
  postedAt: Date;
  contentCategory: { name: string; type: string } | null;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    reach: number;
    impressions: number;
    engagementRate: number;
    rawMetrics: unknown;
  } | null;
  hashtags: Array<{ hashtag: { tag: string } }>;
};

const SOCIAL_WORKSPACE_BY_HOSPITAL: Record<string, string> = {
  "harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "harika-ent-care-hospitals-name": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "dr-harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
};

const INDUSTRY_AVERAGES: Record<string, { value: number; format: "number" | "percent"; source: string }> = {
  followersGrowth: { value: 2.5, format: "percent", source: "Instagram healthcare growth reference" },
  reach: { value: 25000, format: "number", source: "Industry planning reference" },
  impressions: { value: 42000, format: "number", source: "Industry planning reference" },
  engagementRate: { value: 0.55, format: "percent", source: "Adobe Express / social benchmark reference" },
  profileVisits: { value: 900, format: "number", source: "Industry planning reference" },
  websiteClicks: { value: 140, format: "number", source: "Industry planning reference" },
  appointmentClicks: { value: 45, format: "number", source: "VIP healthcare conversion reference" },
  saves: { value: 240, format: "number", source: "Instagram education benchmark reference" },
  shares: { value: 180, format: "number", source: "Instagram discovery benchmark reference" },
};

export async function getInstagramAnalyticsPayload(hospitalId: string, days = 30): Promise<InstagramAnalyticsPayload> {
  const now = new Date();
  const currentStart = addDays(now, -days);
  const previousStart = addDays(currentStart, -days);
  const workspaceId = await resolveSocialWorkspaceId(hospitalId);

  if (!workspaceId) {
    return emptyPayload(null, currentStart, now, previousStart);
  }

  const [posts, audienceInsights, competitors] = await Promise.all([
    prisma.socialPost.findMany({
      where: {
        workspaceId,
        platform: "INSTAGRAM",
        postedAt: { gte: previousStart, lte: now },
      },
      orderBy: { postedAt: "desc" },
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
        url: true,
        mediaType: true,
        contentType: true,
        postedAt: true,
        contentCategory: { select: { name: true, type: true } },
        metrics: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
            clicks: true,
            reach: true,
            impressions: true,
            engagementRate: true,
            rawMetrics: true,
          },
        },
        hashtags: { select: { hashtag: { select: { tag: true } } } },
      },
    }) as Promise<PostWithMetrics[]>,
    prisma.audienceInsight.findMany({
      where: {
        workspaceId,
        platform: "INSTAGRAM",
        capturedAt: { gte: previousStart, lte: now },
      },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.competitorAccount.findMany({
      where: { workspaceId, platform: "INSTAGRAM" },
      select: { metrics: true },
    }),
  ]);

  const currentPosts = posts.filter((post) => post.postedAt >= currentStart);
  const previousPosts = posts.filter((post) => post.postedAt < currentStart);
  const currentTotals = summarizePosts(currentPosts);
  const previousTotals = summarizePosts(previousPosts);
  const historicalTotals = summarizePosts(posts);
  const competitorAverages = averageCompetitorMetrics(competitors.map((competitor) => asRecord(competitor.metrics)));
  const latestAudience = latestAudienceByType(audienceInsights);
  const followerSeries = buildFollowerSeries(audienceInsights);
  const currentFollowers = followerSeries.at(-1)?.followers ?? latestAudience.followerCount ?? null;
  const previousFollowers = followerSeries.find((point) => new Date(point.date) <= currentStart)?.followers ?? null;
  const followerGrowth = currentFollowers !== null && previousFollowers && previousFollowers > 0
    ? ((currentFollowers - previousFollowers) / previousFollowers) * 100
    : null;
  const rawCurrent = summarizeRawMetrics(currentPosts);
  const rawPrevious = summarizeRawMetrics(previousPosts);

  const kpiInputs = [
    metricInput("followersGrowth", "Followers growth", followerGrowth, previousFollowers !== null ? 0 : null, "percent", competitorAverages.followersGrowth),
    metricInput("reach", "Reach", currentTotals.reach, previousTotals.reach, "number", competitorAverages.reach),
    metricInput("impressions", "Impressions / views", currentTotals.impressions, previousTotals.impressions, "number", competitorAverages.impressions),
    metricInput("engagementRate", "Engagement rate", currentTotals.engagementRate, previousTotals.engagementRate, "percent", competitorAverages.engagementRate),
    metricInput("profileVisits", "Profile visits", rawCurrent.profileVisitsAvailable ? rawCurrent.profileVisits : null, rawPrevious.profileVisitsAvailable ? rawPrevious.profileVisits : null, "number", competitorAverages.profileVisits),
    metricInput("websiteClicks", "Website clicks", rawCurrent.websiteClicksAvailable ? rawCurrent.websiteClicks : null, rawPrevious.websiteClicksAvailable ? rawPrevious.websiteClicks : null, "number", competitorAverages.websiteClicks),
    metricInput("appointmentClicks", "Appointment clicks", rawCurrent.appointmentClicksAvailable ? rawCurrent.appointmentClicks : null, rawPrevious.appointmentClicksAvailable ? rawPrevious.appointmentClicks : null, "number", competitorAverages.appointmentClicks),
  ];

  const kpis = kpiInputs.map((input) =>
    buildKpi(input, {
      history: historyValue(input.key, historicalTotals, rawCurrent, followerGrowth),
      competitor: input.competitorAverage,
      industry: INDUSTRY_AVERAGES[input.key]?.value ?? null,
    })
  );

  const trend = buildDailyTrend(currentPosts, currentStart, now);
  const engagementByType = buildEngagementByType(currentPosts);
  const topByFormat = buildTopByFormat(currentPosts);
  const hashtags = buildHashtags(currentPosts);
  const departments = buildHealthcareRows(currentPosts, "department");
  const doctorRows = buildHealthcareRows(currentPosts, "doctor");
  const educationRows = buildHealthcareRows(currentPosts.filter((post) => contentType(post).includes("EDUCATIONAL")), "category");
  const awarenessRows = buildHealthcareRows(currentPosts.filter((post) => contentType(post).includes("AWARENESS") || contentType(post).includes("SEASONAL")), "category");
  const exploreReach = rawCurrent.exploreReach;
  const split = rawCurrent.followerReachAvailable || rawCurrent.nonFollowerReachAvailable
    ? [
        { label: "Followers", value: rawCurrent.followerReach },
        { label: "Non-followers", value: rawCurrent.nonFollowerReach },
      ]
    : null;

  const dataFreshness = posts[0]?.postedAt.toISOString() ?? audienceInsights[0]?.capturedAt.toISOString() ?? null;
  const recordCount = currentPosts.length + audienceInsights.length + competitors.length;

  return {
    success: true,
    workspaceId,
    period: {
      from: currentStart.toISOString(),
      to: now.toISOString(),
      previousFrom: previousStart.toISOString(),
      previousTo: currentStart.toISOString(),
    },
    dataFreshness,
    provenance: buildDataProvenance({
      source: "instagram",
      sourceService: "apps/web/src/lib/server/instagram-analytics",
      fetchedAt: dataFreshness,
      recordCount,
      apiCalled: "/api/admin/instagram-analytics",
      lastSuccessfulSyncAt: dataFreshness,
      mock: recordCount === 0,
      metadata: { days, workspaceId },
    }),
    overview: {
      kpis,
      trend,
      summary: buildSummary(kpis, engagementByType, hashtags),
    },
    audience: {
      growthSeries: followerSeries,
      ageGroups: insightDistribution(audienceInsights, "age"),
      genderSplit: insightDistribution(audienceInsights, "gender"),
      topCities: insightDistribution(audienceInsights, "city").slice(0, 8),
      activeHours: activeHours(audienceInsights, currentPosts),
    },
    content: { topByFormat, engagementByType },
    engagement: {
      totals: [
        { label: "Likes", value: currentTotals.likes, displayValue: integer(currentTotals.likes) },
        { label: "Comments", value: currentTotals.comments, displayValue: integer(currentTotals.comments) },
        { label: "Saves", value: currentTotals.saves, displayValue: integer(currentTotals.saves) },
        { label: "Shares", value: currentTotals.shares, displayValue: integer(currentTotals.shares) },
        { label: "Engagement rate", value: currentTotals.engagementRate, displayValue: percent(currentTotals.engagementRate) },
      ],
      mixTrend: trend.map((point) => ({ date: point.date, likes: pointReachMetric(currentPosts, point.date, "likes"), comments: pointReachMetric(currentPosts, point.date, "comments"), saves: pointReachMetric(currentPosts, point.date, "saves"), shares: pointReachMetric(currentPosts, point.date, "shares") })),
      highestIntent: currentPosts.map(toContentRow).sort((left, right) => intentScore(right) - intentScore(left)).slice(0, 8),
    },
    discovery: {
      reachTrend: trend.map((point) => ({ date: point.date, reach: point.reach })),
      impressionsTrend: trend.map((point) => ({ date: point.date, impressions: point.impressions })),
      hashtags,
      exploreReach: {
        value: rawCurrent.exploreReachAvailable ? exploreReach : null,
        status: rawCurrent.exploreReachAvailable ? classifyBenchmark(exploreReach, currentTotals.reach * 0.2) : "DATA_LIMITED",
        note: rawCurrent.exploreReachAvailable ? "Explore reach is available from stored Meta raw metrics." : "Explore reach is not connected in stored Meta metrics yet.",
      },
      discoverySplit: split,
    },
    healthcareInsights: {
      departments,
      doctorContent: doctorRows,
      educationalContent: educationRows,
      awarenessCampaigns: awarenessRows,
    },
    benchmarks: kpis.concat([
      buildKpi(metricInput("saves", "Saves", currentTotals.saves, previousTotals.saves, "number", competitorAverages.saves), {
        history: historicalTotals.saves,
        competitor: competitorAverages.saves,
        industry: INDUSTRY_AVERAGES.saves.value,
      }),
      buildKpi(metricInput("shares", "Shares", currentTotals.shares, previousTotals.shares, "number", competitorAverages.shares), {
        history: historicalTotals.shares,
        competitor: competitorAverages.shares,
        industry: INDUSTRY_AVERAGES.shares.value,
      }),
    ]).map((kpi) => ({ metric: kpi.label, current: kpi.displayValue, comparisons: kpi.benchmarkComparisons })),
    recommendations: buildRecommendations(kpis, topByFormat, hashtags, latestAudience),
    notes: [
      "Metric definition: engagement rate = (likes + comments + saves + shares + clicks) / reach * 100, falling back to impressions when reach is unavailable.",
      "Profile visits, website clicks, appointment clicks, Explore reach, and discovery split depend on stored Meta raw metrics.",
    ],
  };
}

async function resolveSocialWorkspaceId(hospitalId: string) {
  const normalized = normalizeHospitalKey(hospitalId);
  const harikaWorkspaceId = resolveHarikaSocialWorkspaceId(normalized);

  if (harikaWorkspaceId) return harikaWorkspaceId;

  const mapped = SOCIAL_WORKSPACE_BY_HOSPITAL[normalized];
  if (mapped) return mapped;

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: hospitalId },
        { slug: normalized },
        { name: { equals: hospitalId, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  return workspace?.id ?? null;
}

function emptyPayload(workspaceId: string | null, currentStart: Date, now: Date, previousStart: Date): InstagramAnalyticsPayload {
  return {
    success: true,
    workspaceId,
    period: { from: currentStart.toISOString(), to: now.toISOString(), previousFrom: previousStart.toISOString(), previousTo: currentStart.toISOString() },
    dataFreshness: null,
    provenance: buildDataProvenance({
      source: "instagram",
      sourceService: "apps/web/src/lib/server/instagram-analytics",
      fetchedAt: now,
      recordCount: 0,
      apiCalled: "/api/admin/instagram-analytics",
      mock: true,
      metadata: { reason: "No mapped Instagram workspace" },
    }),
    overview: { kpis: [], trend: [], summary: ["No Instagram account is mapped to this hospital workspace yet."] },
    audience: { growthSeries: [], ageGroups: [], genderSplit: [], topCities: [], activeHours: [] },
    content: { topByFormat: { Posts: [], Reels: [], Carousels: [], Stories: [] }, engagementByType: [] },
    engagement: { totals: [], mixTrend: [], highestIntent: [] },
    discovery: { reachTrend: [], impressionsTrend: [], hashtags: [], exploreReach: { value: null, status: "DATA_LIMITED", note: "Explore reach is not connected yet." }, discoverySplit: null },
    healthcareInsights: { departments: [], doctorContent: [], educationalContent: [], awarenessCampaigns: [] },
    benchmarks: [],
    recommendations: [],
    notes: ["Connect and map an Instagram Business account before using this page for decisions."],
  };
}

function summarizePosts(posts: PostWithMetrics[]) {
  const totals = posts.reduce((total, post) => {
    const metrics = normalizedMetrics(post);
    total.likes += metrics.likes;
    total.comments += metrics.comments;
    total.shares += metrics.shares;
    total.saves += metrics.saves;
    total.clicks += metrics.clicks;
    total.reach += metrics.reach;
    total.impressions += metrics.impressions;
    return total;
  }, { likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, reach: 0, impressions: 0 });
  const denominator = totals.reach || totals.impressions;
  return { ...totals, engagementRate: denominator ? ((totals.likes + totals.comments + totals.shares + totals.saves + totals.clicks) / denominator) * 100 : 0 };
}

function normalizedMetrics(post: PostWithMetrics) {
  const metrics = post.metrics;
  return {
    likes: metrics?.likes ?? 0,
    comments: metrics?.comments ?? 0,
    shares: metrics?.shares ?? 0,
    saves: metrics?.saves ?? 0,
    clicks: metrics?.clicks ?? 0,
    reach: metrics?.reach ?? 0,
    impressions: metrics?.impressions ?? 0,
    engagementRate: metrics?.engagementRate ?? 0,
  };
}

function summarizeRawMetrics(posts: PostWithMetrics[]) {
  return posts.reduce((total, post) => {
    const raw = asRecord(post.metrics?.rawMetrics);
    const profileVisits = readOptionalNumber(raw, ["profile_visits", "profileVisits"]);
    const websiteClicks = readOptionalNumber(raw, ["website_clicks", "websiteClicks", "link_clicks", "linkClicks"]);
    const appointmentClicks = readOptionalNumber(raw, ["appointment_clicks", "appointmentClicks", "booking_clicks", "bookingClicks"]);
    const exploreReach = readOptionalNumber(raw, ["explore_reach", "exploreReach"]);
    const followerReach = readOptionalNumber(raw, ["follower_reach", "followerReach"]);
    const nonFollowerReach = readOptionalNumber(raw, ["non_follower_reach", "nonFollowerReach"]);

    total.profileVisits += profileVisits.value;
    total.websiteClicks += websiteClicks.value;
    total.appointmentClicks += appointmentClicks.value;
    total.exploreReach += exploreReach.value;
    total.followerReach += followerReach.value;
    total.nonFollowerReach += nonFollowerReach.value;
    total.profileVisitsAvailable ||= profileVisits.available;
    total.websiteClicksAvailable ||= websiteClicks.available;
    total.appointmentClicksAvailable ||= appointmentClicks.available;
    total.exploreReachAvailable ||= exploreReach.available;
    total.followerReachAvailable ||= followerReach.available;
    total.nonFollowerReachAvailable ||= nonFollowerReach.available;
    return total;
  }, {
    profileVisits: 0,
    websiteClicks: 0,
    appointmentClicks: 0,
    exploreReach: 0,
    followerReach: 0,
    nonFollowerReach: 0,
    profileVisitsAvailable: false,
    websiteClicksAvailable: false,
    appointmentClicksAvailable: false,
    exploreReachAvailable: false,
    followerReachAvailable: false,
    nonFollowerReachAvailable: false,
  });
}

function buildDailyTrend(posts: PostWithMetrics[], from: Date, to: Date) {
  const points = new Map<string, PostWithMetrics[]>();
  for (const post of posts) {
    const key = isoDay(post.postedAt);
    points.set(key, [...(points.get(key) ?? []), post]);
  }

  const result: Array<{ date: string; reach: number; impressions: number; engagementRate: number }> = [];
  for (let cursor = new Date(from); cursor <= to; cursor = addDays(cursor, 1)) {
    const date = isoDay(cursor);
    const summary = summarizePosts(points.get(date) ?? []);
    result.push({ date, reach: summary.reach, impressions: summary.impressions, engagementRate: round(summary.engagementRate) });
  }
  return result;
}

function buildEngagementByType(posts: PostWithMetrics[]) {
  const grouped = groupBy(posts, formatLabel);
  return Object.entries(grouped).map(([label, rows]) => ({
    label,
    posts: rows.length,
    engagementRate: round(summarizePosts(rows).engagementRate),
  })).sort((left, right) => right.engagementRate - left.engagementRate);
}

function buildTopByFormat(posts: PostWithMetrics[]) {
  const formats = ["Posts", "Reels", "Carousels", "Stories"];
  const grouped = groupBy(posts, formatLabel);
  return Object.fromEntries(
    formats.map((format) => [
      format,
      (grouped[format] ?? []).map(toContentRow).sort((left, right) => right.engagementRate - left.engagementRate).slice(0, 5),
    ])
  ) as Record<string, ContentRow[]>;
}

function buildHashtags(posts: PostWithMetrics[]) {
  const buckets = new Map<string, PostWithMetrics[]>();
  for (const post of posts) {
    for (const entry of post.hashtags) {
      const tag = entry.hashtag.tag.replace(/^#/, "");
      buckets.set(tag, [...(buckets.get(tag) ?? []), post]);
    }
  }

  const values = [...buckets.entries()].map(([tag, rows]) => {
    const summary = summarizePosts(rows);
    return {
      tag,
      postCount: rows.length,
      reach: summary.reach,
      avgEngagementRate: round(summary.engagementRate),
      benchmark: classifyBenchmark(summary.engagementRate, summarizePosts(posts).engagementRate),
    };
  });

  return values.sort((left, right) => right.avgEngagementRate - left.avgEngagementRate).slice(0, 10);
}

function buildHealthcareRows(posts: PostWithMetrics[], mode: "department" | "doctor" | "category") {
  const grouped = groupBy(posts, (post) => {
    if (mode === "doctor") return isDoctorContent(post) ? "Doctor-led content" : "Non-doctor content";
    if (mode === "department") return departmentLabel(post);
    return post.contentCategory?.name ?? friendlyCategory(contentType(post));
  });
  const baseline = summarizePosts(posts).engagementRate;
  return Object.entries(grouped).map(([label, rows]) => {
    const summary = summarizePosts(rows);
    return {
      label,
      posts: rows.length,
      reach: summary.reach,
      engagementRate: round(summary.engagementRate),
      appointmentClicks: summarizeRawMetrics(rows).appointmentClicks,
      benchmark: classifyBenchmark(summary.engagementRate, baseline),
    };
  }).sort((left, right) => right.reach - left.reach).slice(0, 8);
}

function latestAudienceByType(insights: Array<{ type: string; label: string; value: number }>) {
  const follower = insights.find((insight) => ["followers", "follower_count", "total_followers"].includes(insight.type));
  const bestHour = insights.find((insight) => insight.type === "active_hour");
  return { followerCount: follower?.value ?? null, bestHour: bestHour?.label ?? null };
}

function insightDistribution(insights: Array<{ type: string; label: string; value: number }>, type: string) {
  const latestByLabel = new Map<string, number>();
  for (const insight of insights.filter((item) => item.type === type).reverse()) {
    latestByLabel.set(insight.label, insight.value);
  }
  return [...latestByLabel.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value);
}

function buildFollowerSeries(insights: Array<{ type: string; value: number; capturedAt: Date }>) {
  return insights
    .filter((insight) => ["followers", "follower_count", "total_followers", "follower_growth"].includes(insight.type))
    .sort((left, right) => left.capturedAt.getTime() - right.capturedAt.getTime())
    .map((insight) => ({ date: insight.capturedAt.toISOString(), followers: Math.round(insight.value) }));
}

function activeHours(insights: Array<{ type: string; label: string; value: number }>, posts: PostWithMetrics[]) {
  const fromInsights = insights.filter((insight) => insight.type === "active_hour").map((insight) => {
    const match = insight.label.match(/([A-Za-z]+)?\s*([0-9]{1,2})/);
    return { day: match?.[1] ?? "All", hour: Number(match?.[2] ?? 0), value: insight.value };
  });
  if (fromInsights.length) return fromInsights.slice(0, 28);

  return buildEngagementByHour(posts);
}

function buildEngagementByHour(posts: PostWithMetrics[]) {
  const buckets = new Map<string, PostWithMetrics[]>();
  for (const post of posts) {
    const day = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(post.postedAt);
    const key = `${day}-${post.postedAt.getHours()}`;
    buckets.set(key, [...(buckets.get(key) ?? []), post]);
  }
  return [...buckets.entries()].map(([key, rows]) => {
    const [day, hour] = key.split("-");
    return { day, hour: Number(hour), value: round(summarizePosts(rows).engagementRate) };
  }).sort((left, right) => right.value - left.value).slice(0, 28);
}

function buildKpi(input: ReturnType<typeof metricInput>, comparison: { history: number | null; competitor: number | null; industry: number | null }): KpiPayload {
  const industry = INDUSTRY_AVERAGES[input.key];
  return {
    key: input.key,
    label: input.label,
    value: input.current,
    displayValue: input.current === null ? "Data limited" : displayMetric(input.current, input.format),
    momChange: input.previous === null || input.current === null || input.previous === 0 ? null : ((input.current - input.previous) / Math.abs(input.previous)) * 100,
    displayChange: input.previous === null || input.current === null || input.previous === 0 ? "MoM data limited" : `${signedPercent(((input.current - input.previous) / Math.abs(input.previous)) * 100)} MoM`,
    benchmarkComparisons: [
      comparisonFor("Hospital History", input.current, comparison.history, input.format, "Stored VIP history"),
      comparisonFor("Local Competitors", input.current, comparison.competitor, input.format, "Connected competitor profiles"),
      comparisonFor("Industry Average", input.current, comparison.industry, input.format, industry?.source ?? "Industry reference"),
    ],
  };
}

function metricInput(key: string, label: string, current: number | null, previous: number | null, format: "number" | "percent", competitorAverage: number | null) {
  return { key, label, current, previous, format, competitorAverage };
}

function comparisonFor(label: BenchmarkComparison["label"], current: number | null, target: number | null, format: "number" | "percent", source: string): BenchmarkComparison {
  return {
    label,
    value: target,
    status: classifyBenchmark(current, target),
    display: target === null || target === 0 ? "Data limited" : displayMetric(target, format),
    source,
  };
}

function classifyBenchmark(current: number | null, target: number | null): BenchmarkStatus {
  if (current === null || target === null || target <= 0) return "DATA_LIMITED";
  if (current >= target * 1.1) return "ABOVE_BENCHMARK";
  if (current >= target * 0.9) return "ON_BENCHMARK";
  return "BELOW_BENCHMARK";
}

function averageCompetitorMetrics(metrics: JsonRecord[]) {
  const keys = ["followersGrowth", "reach", "impressions", "engagementRate", "profileVisits", "websiteClicks", "appointmentClicks", "saves", "shares"];
  return Object.fromEntries(keys.map((key) => [key, average(metrics.map((metric) => readAnyNumber(metric, [key, snakeCase(key)])).filter(Boolean))])) as Record<string, number | null>;
}

function buildRecommendations(kpis: KpiPayload[], topByFormat: Record<string, ContentRow[]>, hashtags: InstagramAnalyticsPayload["discovery"]["hashtags"], audience: { bestHour: string | null }) {
  const engagement = kpis.find((kpi) => kpi.key === "engagementRate");
  const appointment = kpis.find((kpi) => kpi.key === "appointmentClicks");
  const reels = topByFormat.Reels ?? [];
  const carousels = topByFormat.Carousels ?? [];
  const topHashtag = hashtags[0];

  return [
    {
      title: carousels[0]?.saves ? "Scale educational carousels with stronger save cues" : "Test save-friendly educational carousel posts",
      priority: "High" as const,
      expectedImpact: "Improves high-intent education engagement and creates reusable patient guidance.",
      evidenceMetric: carousels[0] ? `${percent(carousels[0].engagementRate)} engagement on leading carousel` : "Carousel benchmark pending",
      owner: "Content + Doctor review",
      nextAction: "Prepare two clinically reviewed carousel scripts for the strongest department topic.",
    },
    {
      title: audience.bestHour ? `Schedule the next Reel near ${audience.bestHour}` : "Use active-hour evidence before increasing posting volume",
      priority: "Medium" as const,
      expectedImpact: "Improves discovery without adding unnecessary content load.",
      evidenceMetric: reels[0] ? `${integer(reels[0].reach)} reach on leading Reel` : "Reel reach benchmark pending",
      owner: "Production",
      nextAction: "Publish the next Reel in the best available active-hour slot and compare reach after 48 hours.",
    },
    {
      title: appointment?.benchmarkComparisons.some((item) => item.status === "BELOW_BENCHMARK") ? "Turn profile traffic into appointment CTAs" : "Protect appointment CTA consistency",
      priority: "High" as const,
      expectedImpact: "Connects Instagram engagement to hospital inquiry intent.",
      evidenceMetric: appointment?.displayValue ?? "Appointment clicks data limited",
      owner: "Growth lead",
      nextAction: "Add one appointment CTA variant to top-performing education and doctor-led posts.",
    },
    {
      title: topHashtag ? `Refresh hashtag mix around #${topHashtag.tag}` : "Create a measurable healthcare hashtag set",
      priority: "Low" as const,
      expectedImpact: "Improves discovery tracking and competitor comparability.",
      evidenceMetric: topHashtag ? `${percent(topHashtag.avgEngagementRate)} avg hashtag engagement` : "Hashtag data limited",
      owner: "Social strategist",
      nextAction: "Keep high-performing healthcare hashtags and retire tags that stay below benchmark for two cycles.",
    },
    {
      title: engagement?.benchmarkComparisons.some((item) => item.status === "ABOVE_BENCHMARK") ? "Document the current engagement pattern as a playbook" : "Run a two-week engagement recovery sprint",
      priority: "Medium" as const,
      expectedImpact: "Turns measured performance into a repeatable executive operating rhythm.",
      evidenceMetric: engagement?.displayValue ?? "Engagement data limited",
      owner: "Analytics",
      nextAction: "Review the top three posts by saves, comments, and shares in the weekly growth meeting.",
    },
  ];
}

function buildSummary(kpis: KpiPayload[], engagementByType: Array<{ label: string; engagementRate: number }>, hashtags: Array<{ tag: string; avgEngagementRate: number }>) {
  const above = kpis.filter((kpi) => kpi.benchmarkComparisons.some((comparison) => comparison.status === "ABOVE_BENCHMARK"));
  const below = kpis.filter((kpi) => kpi.benchmarkComparisons.some((comparison) => comparison.status === "BELOW_BENCHMARK"));
  return [
    above[0] ? `${above[0].label} is above at least one benchmark this month.` : "Instagram performance needs more connected benchmark data before declaring a lead metric.",
    engagementByType[0] ? `${engagementByType[0].label} currently leads content formats at ${percent(engagementByType[0].engagementRate)} engagement.` : "Content format ranking will appear after Instagram posts are ingested.",
    below[0] ? `${below[0].label} is below at least one benchmark and should be reviewed.` : hashtags[0] ? `#${hashtags[0].tag} is the strongest measured hashtag.` : "Hashtag and discovery signals are still building.",
  ];
}

function toContentRow(post: PostWithMetrics): ContentRow {
  const metrics = normalizedMetrics(post);
  const appointmentClicks = summarizeRawMetrics([post]).appointmentClicks;
  const engagementRate = metrics.engagementRate || summarizePosts([post]).engagementRate;
  return {
    id: post.id,
    title: truncate(post.caption ?? "Untitled Instagram content", 82),
    format: formatLabel(post),
    postedAt: post.postedAt.toISOString(),
    mediaUrl: post.mediaUrl,
    url: post.url,
    reach: metrics.reach,
    impressions: metrics.impressions,
    engagementRate: round(engagementRate),
    saves: metrics.saves,
    shares: metrics.shares,
    comments: metrics.comments,
    appointmentClicks,
    benchmark: classifyBenchmark(engagementRate, 0.55),
  };
}

function pointReachMetric(posts: PostWithMetrics[], date: string, key: "likes" | "comments" | "saves" | "shares") {
  return posts.filter((post) => isoDay(post.postedAt) === date).reduce((total, post) => total + normalizedMetrics(post)[key], 0);
}

function historyValue(key: string, historical: ReturnType<typeof summarizePosts>, raw: ReturnType<typeof summarizeRawMetrics>, followerGrowth: number | null) {
  if (key === "followersGrowth") return followerGrowth;
  if (key === "profileVisits") return raw.profileVisitsAvailable ? raw.profileVisits : null;
  if (key === "websiteClicks") return raw.websiteClicksAvailable ? raw.websiteClicks : null;
  if (key === "appointmentClicks") return raw.appointmentClicksAvailable ? raw.appointmentClicks : null;
  return Number((historical as unknown as Record<string, number>)[key] ?? 0);
}

function formatLabel(post: PostWithMetrics) {
  const mediaType = (post.mediaType ?? "").toUpperCase();
  const content = post.contentType.toUpperCase();
  if (mediaType.includes("STORY") || content.includes("STORY")) return "Stories";
  if (mediaType.includes("CAROUSEL") || content.includes("CAROUSEL")) return "Carousels";
  if (mediaType.includes("REEL") || content.includes("SHORT_FORM") || content.includes("VIDEO")) return "Reels";
  return "Posts";
}

function contentType(post: PostWithMetrics) {
  return post.contentCategory?.type ?? "";
}

function departmentLabel(post: PostWithMetrics) {
  const raw = asRecord(post.metrics?.rawMetrics);
  const fromRaw = typeof raw.department === "string" ? raw.department : typeof raw.serviceLine === "string" ? raw.serviceLine : null;
  if (fromRaw) return fromRaw;
  if (post.contentCategory?.type === "SERVICE_LINE") return post.contentCategory.name;
  return "General hospital content";
}

function isDoctorContent(post: PostWithMetrics) {
  const text = `${post.caption ?? ""} ${post.contentCategory?.name ?? ""} ${post.contentCategory?.type ?? ""}`.toLowerCase();
  return text.includes("doctor") || text.includes("dr.") || text.includes("consultant") || text.includes("specialist") || text.includes("doctor_branding") || text.includes("doctor_spotlight");
}

function friendlyCategory(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Healthcare content";
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}

function intentScore(row: ContentRow) {
  return row.saves * 3 + row.shares * 3 + row.comments * 2 + row.appointmentClicks * 5 + row.engagementRate;
}

function readAnyNumber(record: JsonRecord | null, keys: string[]) {
  if (!record) return 0;
  return readOptionalNumber(record, keys).value;
}

function readOptionalNumber(record: JsonRecord | null, keys: string[]) {
  if (!record) return { value: 0, available: false };
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return { value, available: true };
    if (typeof value === "string" && Number.isFinite(Number(value))) return { value: Number(value), available: true };
  }
  return { value: 0, available: false };
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : null;
}

function displayMetric(value: number, format: "number" | "percent") {
  return format === "percent" ? percent(value) : integer(value);
}

function integer(value: number) {
  return Math.round(value).toLocaleString("en-IN");
}

function percent(value: number) {
  return `${round(value).toFixed(2)}%`;
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${round(value).toFixed(1)}%`;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}...` : value;
}

function snakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
