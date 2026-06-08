import { NextRequest, NextResponse } from "next/server";

import prisma from "@vip/database";

import {
  normalizeHospitalKey,
  resolveHarikaSocialWorkspaceId
} from "@/lib/harika-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOCIAL_WORKSPACE_BY_HOSPITAL: Record<string, string> = {
  "harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "harika-ent-care-hospitals-name": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "dr-harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
};

const INDUSTRY_REFERENCES = [
  {
    label: "Instagram healthcare reference",
    value: 0.5,
    range: "0.40% to 0.60%",
    source: "Configured social engagement reference",
  },
  {
    label: "Facebook healthcare reference",
    value: 0.13,
    range: "0.06% to 0.20%",
    source: "Configured social engagement reference",
  },
];

type MetricRow = {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  reach: number;
  impressions: number;
  videoViews: number;
  engagementRate: number;
};

type PostRow = {
  id: string;
  platform: string;
  caption: string | null;
  contentType: string;
  mediaType: string | null;
  postedAt: Date;
  metrics: MetricRow | null;
  contentCategory: { name: string; type: string } | null;
};

type Bucket = {
  posts: number;
  interactions: number;
  engagementRateTotal: number;
  postsWithMetrics: number;
  saves: number;
  comments: number;
  shares: number;
  topPost: { caption: string | null; engagementRate: number } | null;
};

export async function GET(req: NextRequest) {
  const hospitalId = req.nextUrl.searchParams.get("hospitalId") ?? "";
  const workspaceId = resolveSocialWorkspaceId(hospitalId);

  if (!workspaceId) {
    return NextResponse.json(emptyResponse());
  }

  const [posts, brandMemory, competitors] = await Promise.all([
    prisma.socialPost.findMany({
      where: { workspaceId },
      orderBy: { postedAt: "desc" },
      take: 500,
      select: {
        id: true,
        platform: true,
        caption: true,
        contentType: true,
        mediaType: true,
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
            videoViews: true,
            engagementRate: true,
          },
        },
      },
    }),
    prisma.brandMemory.findFirst({ where: { workspaceId } }),
    prisma.competitorAccount.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const metrics = posts.flatMap((post) => (post.metrics ? [post.metrics] : []));
  const totals = aggregateMetrics(metrics);
  const totalInteractions = interactionTotal(totals);
  const avgEngagementRate = average(metrics.map((metric) => metric.engagementRate));
  const trend = calculateGrowthTrend(posts);
  const contentEngagement = buildContentEngagement(posts);
  const departmentPerformance = buildDepartmentPerformance(posts);
  const doctorInfluence = buildDoctorInfluence(posts, extractDoctorNames(brandMemory?.doctors));
  const audience = estimateAudienceEngagement(totals, totalInteractions);
  const competitorBenchmarks = buildCompetitorBenchmarks(competitors);
  const industryAverage = average(INDUSTRY_REFERENCES.map((item) => item.value));
  const qualityScore = calculateQualityScore({
    avgEngagementRate,
    totalInteractions,
    totals,
    trendChange: trend.percentageChange,
    industryAverage,
  });
  const benchmarking = {
    historical: buildHistoricalBenchmark(posts, avgEngagementRate),
    competitors: competitorBenchmarks,
    industry: {
      current: round(avgEngagementRate, 2),
      average: round(industryAverage, 2),
      label: avgEngagementRate >= industryAverage ? "Above configured industry average" : "Below configured industry average",
      status: avgEngagementRate >= industryAverage ? "STRONG" : "BELOW_BENCHMARK",
      references: INDUSTRY_REFERENCES,
    },
  };

  return NextResponse.json({
    success: true,
    workspaceId,
    overview: {
      engagementRate: round(avgEngagementRate, 2),
      totalInteractions,
      growthTrend: trend,
      postsAnalyzed: posts.length,
    },
    interactionBreakdown: {
      likes: totals.likes,
      comments: totals.comments,
      shares: totals.shares,
      saves: totals.saves,
    },
    contentEngagement,
    audienceEngagement: audience,
    departmentPerformance,
    doctorInfluence,
    qualityScore,
    benchmarking,
    recommendations: buildRecommendations({
      avgEngagementRate,
      contentEngagement,
      departmentPerformance,
      doctorInfluence,
      qualityScore: qualityScore.score,
      benchmarking,
      audienceReturningShare: audience.returningShare,
    }),
    notes: [
      "Audience new/returning engagement is estimated from interaction depth because commenter or engager identity is not stored yet.",
      "Department performance is inferred from content categories and caption signals until a dedicated hospital department schema is connected.",
      "Competitor benchmarks use stored competitor account metrics only; missing or unstructured metrics are shown as data limited.",
    ],
  });
}

function emptyResponse() {
  return {
    success: true,
    workspaceId: null,
    overview: {
      engagementRate: 0,
      totalInteractions: 0,
      growthTrend: { direction: "INSUFFICIENT_DATA", percentageChange: null },
      postsAnalyzed: 0,
    },
    interactionBreakdown: { likes: 0, comments: 0, shares: 0, saves: 0 },
    contentEngagement: [],
    audienceEngagement: {
      returningEngagers: 0,
      newEngagers: 0,
      returningShare: 0,
      newShare: 0,
      confidence: "ESTIMATED",
      basis: "No social workspace is assigned to this hospital.",
    },
    departmentPerformance: [],
    doctorInfluence: [],
    qualityScore: {
      score: 0,
      label: "Data limited",
      drivers: [],
    },
    benchmarking: {
      historical: { current: 0, average: null, label: "Data limited", status: "DATA_LIMITED" },
      competitors: { current: 0, average: null, sampleSize: 0, label: "Data limited", status: "DATA_LIMITED", competitors: [] },
      industry: { current: 0, average: null, label: "Data limited", status: "DATA_LIMITED", references: INDUSTRY_REFERENCES },
    },
    recommendations: [],
    notes: ["No social intelligence workspace is assigned to this hospital yet."],
  };
}

function resolveSocialWorkspaceId(hospitalId: string) {
  const harikaWorkspaceId = resolveHarikaSocialWorkspaceId(hospitalId);

  if (harikaWorkspaceId) return harikaWorkspaceId;

  return SOCIAL_WORKSPACE_BY_HOSPITAL[normalizeHospitalKey(hospitalId)] ?? null;
}

function aggregateMetrics(metrics: MetricRow[]) {
  return metrics.reduce(
    (total, metric) => ({
      likes: total.likes + metric.likes,
      comments: total.comments + metric.comments,
      shares: total.shares + metric.shares,
      saves: total.saves + metric.saves,
      clicks: total.clicks + metric.clicks,
      reach: total.reach + metric.reach,
      impressions: total.impressions + metric.impressions,
      videoViews: total.videoViews + metric.videoViews,
    }),
    { likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, reach: 0, impressions: 0, videoViews: 0 }
  );
}

function interactionTotal(metrics: Pick<MetricRow, "likes" | "comments" | "shares" | "saves" | "clicks">) {
  return metrics.likes + metrics.comments + metrics.shares + metrics.saves + metrics.clicks;
}

function buildContentEngagement(posts: PostRow[]) {
  const buckets = new Map<string, Bucket>();

  for (const post of posts) {
    const format = normalizeFormat(post);
    addToBucket(buckets, format, post);
  }

  return ["Reels", "Posts", "Stories", "Videos"]
    .map((format) => summarizeBucket(format, buckets.get(format)))
    .filter((item) => item.posts > 0 || ["Reels", "Posts", "Videos"].includes(item.format));
}

function buildDepartmentPerformance(posts: PostRow[]) {
  const buckets = new Map<string, Bucket>();

  for (const post of posts) {
    addToBucket(buckets, inferDepartment(post), post);
  }

  return [...buckets.entries()]
    .map(([department, bucket]) => ({
      department,
      ...summarizeBucket(department, bucket),
    }))
    .sort((left, right) => right.engagementRate - left.engagementRate)
    .slice(0, 8);
}

function buildDoctorInfluence(posts: PostRow[], doctorNames: string[]) {
  const buckets = new Map<string, Bucket>();

  for (const post of posts) {
    const doctor = inferDoctor(post.caption, doctorNames);
    if (doctor) addToBucket(buckets, doctor, post);
  }

  return [...buckets.entries()]
    .map(([doctor, bucket]) => ({
      doctor,
      posts: bucket.posts,
      interactions: bucket.interactions,
      engagementRate: averageFromBucket(bucket),
      influenceScore: round(scoreBucket(bucket), 1),
      topPost: bucket.topPost,
    }))
    .sort((left, right) => right.influenceScore - left.influenceScore)
    .slice(0, 6);
}

function addToBucket(buckets: Map<string, Bucket>, key: string, post: PostRow) {
  const bucket =
    buckets.get(key) ??
    {
      posts: 0,
      interactions: 0,
      engagementRateTotal: 0,
      postsWithMetrics: 0,
      saves: 0,
      comments: 0,
      shares: 0,
      topPost: null,
    };
  const metrics = post.metrics;

  bucket.posts += 1;

  if (metrics) {
    const interactions = interactionTotal(metrics);
    bucket.interactions += interactions;
    bucket.engagementRateTotal += metrics.engagementRate;
    bucket.postsWithMetrics += 1;
    bucket.saves += metrics.saves;
    bucket.comments += metrics.comments;
    bucket.shares += metrics.shares;

    if (!bucket.topPost || metrics.engagementRate > bucket.topPost.engagementRate) {
      bucket.topPost = { caption: post.caption, engagementRate: metrics.engagementRate };
    }
  }

  buckets.set(key, bucket);
}

function summarizeBucket(format: string, bucket: Bucket | undefined) {
  const safeBucket =
    bucket ?? {
      posts: 0,
      interactions: 0,
      engagementRateTotal: 0,
      postsWithMetrics: 0,
      saves: 0,
      comments: 0,
      shares: 0,
      topPost: null,
    };

  return {
    format,
    posts: safeBucket.posts,
    interactions: safeBucket.interactions,
    engagementRate: averageFromBucket(safeBucket),
    qualitySignals: {
      saves: safeBucket.saves,
      comments: safeBucket.comments,
      shares: safeBucket.shares,
    },
    topPost: safeBucket.topPost,
  };
}

function normalizeFormat(post: PostRow) {
  const raw = `${post.contentType} ${post.mediaType ?? ""} ${post.caption ?? ""}`.toLowerCase();

  if (raw.includes("story")) return "Stories";
  if (post.contentType === "SHORT_FORM_VIDEO" || raw.includes("reel")) return "Reels";
  if (post.contentType === "VIDEO" || post.contentType === "LIVE" || raw.includes("video")) return "Videos";
  return "Posts";
}

function inferDepartment(post: PostRow) {
  const stored = post.contentCategory?.name;
  const source = `${post.caption ?? ""} ${stored ?? ""}`.toLowerCase();

  const rules = [
    { label: "ENT", terms: ["ent", "ear", "nose", "throat", "sinus", "tonsil", "adenoid", "hearing", "allergy"] },
    { label: "Pediatric ENT", terms: ["child", "children", "pediatric", "paediatric", "kids", "adenoid"] },
    { label: "Hearing Care", terms: ["hearing", "audiology", "ear test", "hearing test"] },
    { label: "Sinus & Allergy", terms: ["sinus", "allergy", "blocked nose", "sneezing"] },
    { label: "Throat & Voice", terms: ["throat", "voice", "vocal", "tonsil"] },
    { label: "Preventive Care", terms: ["prevent", "screening", "checkup", "awareness"] },
  ];

  return rules.find((rule) => rule.terms.some((term) => source.includes(term)))?.label ?? friendlyCategory(post.contentCategory?.type);
}

function friendlyCategory(value: string | null | undefined) {
  if (!value) return "General Engagement";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractDoctorNames(doctors: unknown) {
  if (!doctors) return [];
  if (Array.isArray(doctors)) {
    return doctors.flatMap((doctor) => {
      if (typeof doctor === "string") return [doctor];
      if (doctor && typeof doctor === "object" && "name" in doctor && typeof doctor.name === "string") {
        return [doctor.name];
      }
      return [];
    });
  }
  return [];
}

function inferDoctor(caption: string | null, doctorNames: string[]) {
  const normalized = (caption ?? "").toLowerCase();
  const matchedDoctor = doctorNames.find((name) => normalized.includes(name.toLowerCase()));

  if (matchedDoctor) return matchedDoctor;

  const drMatch = caption?.match(/\bDr\.?\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?/);
  if (drMatch) return drMatch[0].replace(/\s+/g, " ").trim();

  return normalized.includes("doctor") || normalized.includes("specialist") || normalized.includes("surgeon")
    ? "Doctor-led content"
    : null;
}

function estimateAudienceEngagement(
  totals: Pick<MetricRow, "likes" | "comments" | "shares" | "saves">,
  totalInteractions: number
) {
  const returningEngagers = totals.comments + totals.shares + totals.saves;
  const newEngagers = Math.max(0, totals.likes - Math.round(returningEngagers * 0.15));
  const denominator = Math.max(totalInteractions, 1);

  return {
    returningEngagers,
    newEngagers,
    returningShare: round((returningEngagers / denominator) * 100, 1),
    newShare: round((newEngagers / denominator) * 100, 1),
    confidence: "ESTIMATED",
    basis: "Returning engagement is estimated from deeper actions: comments, shares, and saves. New engagement is estimated from lightweight likes.",
  };
}

function calculateGrowthTrend(posts: PostRow[]) {
  const sorted = [...posts].filter((post) => post.metrics).sort((left, right) => left.postedAt.getTime() - right.postedAt.getTime());

  if (sorted.length < 4) {
    return { direction: "INSUFFICIENT_DATA", percentageChange: null };
  }

  const midpoint = Math.ceil(sorted.length / 2);
  const earlier = average(sorted.slice(0, midpoint).map((post) => post.metrics?.engagementRate ?? 0));
  const later = average(sorted.slice(midpoint).map((post) => post.metrics?.engagementRate ?? 0));
  const percentageChange = earlier === 0 ? (later === 0 ? 0 : 100) : round(((later - earlier) / earlier) * 100, 1);

  return {
    direction: Math.abs(percentageChange) < 3 ? "STABLE" : percentageChange > 0 ? "UP" : "DOWN",
    percentageChange,
  };
}

function calculateQualityScore({
  avgEngagementRate,
  totalInteractions,
  totals,
  trendChange,
  industryAverage,
}: {
  avgEngagementRate: number;
  totalInteractions: number;
  totals: ReturnType<typeof aggregateMetrics>;
  trendChange: number | null;
  industryAverage: number;
}) {
  const denominator = Math.max(totalInteractions, 1);
  const score =
    clamp((avgEngagementRate / Math.max(industryAverage, 0.1)) * 30, 0, 30) +
    clamp(((totals.saves + totals.shares) / denominator) * 200, 0, 25) +
    clamp((totals.comments / denominator) * 180, 0, 20) +
    clamp((totals.shares / denominator) * 220, 0, 15) +
    clamp(((trendChange ?? 0) + 20) / 4, 0, 10);
  const rounded = round(score, 1);

  return {
    score: rounded,
    label: rounded >= 80 ? "Excellent" : rounded >= 65 ? "Strong" : rounded >= 50 ? "Needs focus" : "Low quality",
    drivers: [
      { label: "Engagement vs industry", value: round(clamp((avgEngagementRate / Math.max(industryAverage, 0.1)) * 100, 0, 140), 0) },
      { label: "Depth actions", value: round(((totals.saves + totals.shares + totals.comments) / denominator) * 100, 1) },
      { label: "Growth momentum", value: trendChange ?? 0 },
    ],
  };
}

function buildHistoricalBenchmark(posts: PostRow[], current: number) {
  const now = new Date();
  const older = posts.filter((post) => {
    const ageInDays = (now.getTime() - post.postedAt.getTime()) / 86_400_000;
    return ageInDays > 30 && post.metrics;
  });
  const averageValue = older.length ? average(older.map((post) => post.metrics?.engagementRate ?? 0)) : null;

  if (averageValue === null) {
    return { current: round(current, 2), average: null, label: "Data limited", status: "DATA_LIMITED" };
  }

  return {
    current: round(current, 2),
    average: round(averageValue, 2),
    label: current >= averageValue ? "Above historical performance" : "Below historical performance",
    status: current >= averageValue ? "STRONG" : "BELOW_BENCHMARK",
  };
}

function buildCompetitorBenchmarks(competitors: Array<{ handle: string; displayName: string | null; metrics: unknown }>) {
  const rows = competitors.flatMap((competitor) => {
    const engagementRate = extractEngagementRate(competitor.metrics);
    return engagementRate === null
      ? []
      : [{ name: competitor.displayName ?? competitor.handle, engagementRate }];
  });
  const averageValue = rows.length ? average(rows.map((row) => row.engagementRate)) : null;

  return {
    current: null,
    average: averageValue === null ? null : round(averageValue, 2),
    sampleSize: rows.length,
    label: rows.length ? "Competitor benchmark available" : "Data limited",
    status: rows.length ? "AVAILABLE" : "DATA_LIMITED",
    competitors: rows.slice(0, 5),
  };
}

function extractEngagementRate(metrics: unknown): number | null {
  if (!metrics || typeof metrics !== "object") return null;
  const candidates = ["engagementRate", "avgEngagementRate", "averageEngagementRate"];

  for (const candidate of candidates) {
    const value = (metrics as Record<string, unknown>)[candidate];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return null;
}

function buildRecommendations(input: {
  avgEngagementRate: number;
  contentEngagement: ReturnType<typeof buildContentEngagement>;
  departmentPerformance: ReturnType<typeof buildDepartmentPerformance>;
  doctorInfluence: ReturnType<typeof buildDoctorInfluence>;
  qualityScore: number;
  benchmarking: ReturnType<typeof buildHistoricalBenchmark> extends infer Historical
    ? {
        historical: Historical;
        competitors: ReturnType<typeof buildCompetitorBenchmarks>;
        industry: { average: number | null; status: string };
      }
    : never;
  audienceReturningShare: number;
}) {
  const bestFormat = [...input.contentEngagement].sort((left, right) => right.engagementRate - left.engagementRate)[0];
  const bestDepartment = input.departmentPerformance[0];
  const bestDoctor = input.doctorInfluence[0];
  const recommendations = [];

  if (bestFormat) {
    recommendations.push({
      title: `Shift next week toward ${bestFormat.format.toLowerCase()}`,
      priority: "HIGH",
      rationale: `${bestFormat.format} leads content engagement at ${round(bestFormat.engagementRate, 2)}%.`,
      action: "Create two doctor-reviewed variants in this format and compare saves/comments against the current average.",
    });
  }

  if (bestDepartment) {
    recommendations.push({
      title: `Build a ${bestDepartment.department} engagement series`,
      priority: "HIGH",
      rationale: `${bestDepartment.department} is the strongest specialty signal by engagement rate.`,
      action: "Plan a three-post sequence: common question, doctor explanation, and appointment-safe CTA.",
    });
  }

  if (bestDoctor) {
    recommendations.push({
      title: `Use ${bestDoctor.doctor} as the next trust anchor`,
      priority: "MEDIUM",
      rationale: `Doctor-led posts show ${round(bestDoctor.engagementRate, 2)}% engagement across ${bestDoctor.posts} posts.`,
      action: "Repurpose the best doctor-led topic into a reel, carousel, and story prompt.",
    });
  }

  if (input.audienceReturningShare < 18) {
    recommendations.push({
      title: "Increase deeper engagement prompts",
      priority: "MEDIUM",
      rationale: "Returning engagement is estimated below the target depth threshold.",
      action: "Add save-worthy checklists, comment prompts, and shareable patient education summaries.",
    });
  }

  if (input.qualityScore < 65 || input.benchmarking.industry.status === "BELOW_BENCHMARK") {
    recommendations.push({
      title: "Improve engagement quality before scaling volume",
      priority: "HIGH",
      rationale: `Quality score is ${round(input.qualityScore, 1)} and average engagement is ${round(input.avgEngagementRate, 2)}%.`,
      action: "Prioritize comments, saves, and shares over lightweight likes in the next content sprint.",
    });
  }

  return recommendations.slice(0, 5);
}

function averageFromBucket(bucket: Bucket) {
  return round(bucket.postsWithMetrics ? bucket.engagementRateTotal / bucket.postsWithMetrics : 0, 2);
}

function scoreBucket(bucket: Bucket) {
  return averageFromBucket(bucket) * 10 + bucket.interactions * 0.03 + bucket.saves * 0.6 + bucket.comments * 0.4 + bucket.shares * 0.5;
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals = 4) {
  return Number(value.toFixed(decimals));
}
