import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@vip/database";
import {
  AIInsightGenerator,
  IntelligenceScoringService,
  PredictiveAnalyticsEngine,
  TrendDetectionEngine,
  type Insight,
  type IntelligenceScores,
  type IntelligenceSignal,
  type Prediction,
} from "@vip/analytics-intelligence";
import { analyzeCompetitorPatterns, type CompetitorIntelligence, type MarketContext } from "@vip/market-intelligence";
import { getAnalyticsOverview } from "@vip/social-engine";
import type { SocialAnalyticsOverview } from "@vip/social-engine";
import type { Tone } from "@/design-system/theme";

export type SupportingMetric = {
  metric: string;
  direction: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
};

export type OperationalRecommendation = {
  id: string;
  title: string;
  narrative: string;
  evidence: string;
  confidence: number;
  type: string;
  status: "Persisted" | "Proposed from analytics";
  sourceStatus: string;
  sourceBasis: string;
  sourceCategory: "VIP_RECOMMENDATION" | "SOCIAL_ANALYTICS" | "MARKET_CONTEXT" | "SEARCH_CONTEXT" | "REPUTATION_CONTEXT";
  priority: "Critical" | "High" | "Medium" | "Low";
  score: number;
  expectedOutcome: string;
  automationReady: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  supportingMetrics: SupportingMetric[];
  nextAction: string;
  generatedAt?: string;
  updatedAt?: string;
};

export type OperationalWorkflow = {
  stage: string;
  title: string;
  detail: string;
  status: string;
  tone: Tone;
};

export type ProductExperience = {
  available: boolean;
  workspaceName: string;
  workspaceId?: string;
  lastMeasuredAt?: string;
  period?: string;
  analytics?: SocialAnalyticsOverview;
  measuredNarrative?: string;
  audienceInsights: Array<{
    type: string;
    label: string;
    value: number;
    confidence: number;
  }>;
  recommendations: OperationalRecommendation[];
  intelligence?: {
    predictions7Day: Prediction[];
    predictions30Day: Prediction[];
    signals: IntelligenceSignal[];
    scores?: IntelligenceScores;
    briefs: Insight[];
    forecastBasis: string;
    marketContext?: MarketContext;
    competitors: CompetitorIntelligence;
  };
  workflows: OperationalWorkflow[];
  operationalCounts: {
    recommendations: number;
    plans: number;
    approvals: number;
    automations: number;
    members: number;
  };
};

const emptyCounts = {
  recommendations: 0,
  plans: 0,
  approvals: 0,
  automations: 0,
  members: 0,
};

const getCachedProductExperience = unstable_cache(async (): Promise<ProductExperience> => {
  try {
    const candidates = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            socialPosts: true,
            aiRecommendations: true,
            actionPlans: true,
            approvalRequests: true,
            automationExecutions: true,
            members: true,
          },
        },
      },
    });
    const workspace = candidates.sort((left, right) => right._count.socialPosts - left._count.socialPosts)[0];

    if (!workspace || workspace._count.socialPosts === 0) {
      return {
        available: false,
        workspaceName: "No connected analytics workspace",
        audienceInsights: [],
        recommendations: [],
        workflows: [],
        operationalCounts: emptyCounts,
      };
    }

    const [analytics, audienceInsights, persistedRecommendations, plans, approvals, automations, marketSnapshot, competitors] = await Promise.all([
      getAnalyticsOverview({ workspaceId: workspace.id }),
      prisma.audienceInsight.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { capturedAt: "desc" },
        take: 8,
        select: { type: true, label: true, value: true, confidence: true },
      }),
      prisma.aIRecommendation.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { generatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          summary: true,
          rationale: true,
          confidence: true,
          type: true,
          status: true,
          priority: true,
          score: true,
          actions: true,
          expectedOutcome: true,
          explanation: true,
          evidence: true,
          generatedAt: true,
          updatedAt: true,
        },
      }),
      prisma.actionPlan.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { name: true, status: true, type: true, scheduledFor: true },
      }),
      prisma.approvalRequest.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { requestedAt: "desc" },
        take: 5,
        include: { actionPlan: { select: { name: true } } },
      }),
      prisma.automationExecution.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { queuedAt: "desc" },
        take: 5,
        select: { status: true, queuedAt: true, attempt: true, lastFailure: true },
      }),
      prisma.marketContextSnapshot.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { generatedAt: "desc" },
        select: { context: true },
      }),
      analyzeCompetitorPatterns(workspace.id),
    ]);

    const lastMeasuredAt = analytics.postingFrequency
      .map((point) => point.date)
      .sort()
      .at(-1);
    const recommendations = persistedRecommendations.length
      ? persistedRecommendations.map(mapRecommendation)
      : deriveRecommendations(analytics);
    const intelligence = buildAnalyticsIntelligence(
      workspace.id,
      analytics,
      competitors,
      asMarketContext(marketSnapshot?.context),
    );

    return {
      available: true,
      workspaceName: workspace.name,
      workspaceId: workspace.id,
      lastMeasuredAt,
      period: measuredPeriod(analytics),
      analytics,
      measuredNarrative: trendNarrative(analytics),
      audienceInsights,
      recommendations,
      intelligence,
      workflows: buildWorkflows(recommendations, plans, approvals, automations),
      operationalCounts: {
        recommendations: workspace._count.aiRecommendations,
        plans: workspace._count.actionPlans,
        approvals: workspace._count.approvalRequests,
        automations: workspace._count.automationExecutions,
        members: workspace._count.members,
      },
    };
  } catch {
    return {
      available: false,
      workspaceName: "Analytics temporarily unavailable",
      audienceInsights: [],
      recommendations: [],
      workflows: [],
      operationalCounts: emptyCounts,
    };
  }
}, ["product-experience"], { revalidate: 60, tags: ["product-experience"] });

export const getProductExperience = cache(getCachedProductExperience);

function deriveRecommendations(analytics: SocialAnalyticsOverview): OperationalRecommendation[] {
  const trend = analytics.engagementTrend;
  const top = analytics.topPosts[0];
  const format = analytics.contentTypeBreakdown.formats
    .slice()
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0];
  const time = analytics.bestPostingTimes[0];
  const tag = analytics.hashtagPerformance[0];

  const recommendations: OperationalRecommendation[] = [];
  if (trend.percentageChange !== null) {
    const movement = Math.abs(trend.percentageChange).toFixed(1);
    recommendations.push({
      id: "analytics-engagement-cadence",
      title: trend.direction === "DOWN" ? "Recover declining engagement cadence" : "Sustain improving engagement cadence",
      narrative: trend.direction === "DOWN"
        ? `Measured engagement is down ${movement}% across the evaluated periods. Review posting consistency before committing new campaign spend.`
        : `Measured engagement is up ${movement}% across the evaluated periods. Continue the content pattern while monitoring clinical accuracy.`,
      evidence: `${analytics.totalPosts} Instagram posts analyzed; average engagement is ${analytics.avgEngagementRate.toFixed(2)}%.`,
      confidence: 90,
      type: "Engagement recovery",
      status: "Proposed from analytics",
      sourceStatus: "Analytics fallback",
      sourceBasis: "Measured Instagram/social analytics from stored post performance. This fallback appears only when no persisted VIP AIRecommendation records are available.",
      sourceCategory: "SOCIAL_ANALYTICS",
      priority: trend.direction === "DOWN" ? "High" : "Medium",
      score: trend.direction === "DOWN" ? 86 : 72,
      expectedOutcome: trend.direction === "DOWN" ? "Restore engagement stability through consistent, clinically reviewed posts." : "Preserve positive engagement direction.",
      automationReady: false,
      riskLevel: trend.direction === "DOWN" ? "HIGH" : "LOW",
      reasoning: `Engagement direction was classified as ${trend.direction.toLowerCase()} from measured post performance over the selected period.`,
      nextAction: trend.direction === "DOWN" ? "Create a recovery content brief and route it through clinical review before scheduling." : "Keep the current cadence and measure whether the positive direction holds after the next approved posts.",
      supportingMetrics: [{
        metric: "Engagement rate",
        direction: trend.direction,
        currentValue: analytics.avgEngagementRate,
        previousValue: analytics.avgEngagementRate / (1 + trend.percentageChange / 100),
        changePercent: trend.percentageChange,
      }],
    });
  }
  if (top) {
    recommendations.push({
      id: `analytics-top-content-${top.id}`,
      title: "Extend the highest-response clinical story format",
      narrative: `${format ? label(format.contentType) : label(top.contentType)} content is generating the strongest engagement signal. Develop a patient-safe follow-up from the highest-performing theme.`,
      evidence: `"${shortCaption(top.caption)}" reached ${integer(top.reach)} people with ${top.engagementRate.toFixed(2)}% engagement.`,
      confidence: 92,
      type: "Campaign suggestion",
      status: "Proposed from analytics",
      sourceStatus: "Analytics fallback",
      sourceBasis: "Measured Instagram/social analytics from stored post performance. This fallback appears only when no persisted VIP AIRecommendation records are available.",
      sourceCategory: "SOCIAL_ANALYTICS",
      priority: "High",
      score: 84,
      expectedOutcome: "Test a clinically reviewed extension of the best-performing education format.",
      automationReady: false,
      riskLevel: "LOW",
      reasoning: "The highest-response published format is an observable signal for the next safe content test.",
      nextAction: "Draft one follow-up content brief using the same format, then send it for production and doctor review.",
      supportingMetrics: [],
    });
  }
  if (time) {
    recommendations.push({
      id: `analytics-posting-window-${time.dayOfWeek}-${time.hourOfDay}`,
      title: "Align review-ready posts to observed publishing window",
      narrative: `Schedule approved education assets near ${time.dayLabel} ${hourLabel(time.hourOfDay)}, when recorded performance is strongest.`,
      evidence: `${time.postCount} measured post${time.postCount === 1 ? "" : "s"} in this window averaged ${time.avgEngagementRate.toFixed(2)}% engagement.`,
      confidence: time.postCount > 2 ? 84 : 68,
      type: "Posting-time optimization",
      status: "Proposed from analytics",
      sourceStatus: "Analytics fallback",
      sourceBasis: "Measured Instagram/social analytics from stored publishing windows. This fallback appears only when no persisted VIP AIRecommendation records are available.",
      sourceCategory: "SOCIAL_ANALYTICS",
      priority: "Medium",
      score: time.postCount > 2 ? 76 : 58,
      expectedOutcome: "Increase the chance that approved education content reaches active audiences.",
      automationReady: true,
      riskLevel: "LOW",
      reasoning: "The suggested time window has the highest observed average engagement among stored posts.",
      nextAction: "Reserve the publishing window only after the content brief receives clinical approval.",
      supportingMetrics: [],
    });
  }
  if (tag) {
    recommendations.push({
      id: `analytics-hashtag-${tag.tag}`,
      title: `Evaluate #${tag.tag} in the next approved education brief`,
      narrative: "Use only where clinically relevant and consistent with hospital communication policy.",
      evidence: `${tag.postCount} measured posts using this tag averaged ${tag.avgEngagementRate.toFixed(2)}% engagement.`,
      confidence: tag.postCount > 2 ? 78 : 62,
      type: "Hashtag optimization",
      status: "Proposed from analytics",
      sourceStatus: "Analytics fallback",
      sourceBasis: "Measured Instagram/social analytics from stored hashtag performance. This fallback appears only when no persisted VIP AIRecommendation records are available.",
      sourceCategory: "SOCIAL_ANALYTICS",
      priority: "Low",
      score: tag.postCount > 2 ? 63 : 48,
      expectedOutcome: "Measure discoverability impact on a clinically relevant education brief.",
      automationReady: false,
      riskLevel: "LOW",
      reasoning: "The hashtag is ranked by measured engagement on existing content; relevance still requires review.",
      nextAction: "Check relevance against the content brief and include the tag only if it supports patient-safe communication.",
      supportingMetrics: [],
    });
  }
  return recommendations;
}

function mapRecommendation(item: {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  confidence: number;
  type: string;
  status: string;
  priority: number;
  score: number;
  actions: unknown;
  expectedOutcome: string | null;
  explanation: unknown;
  evidence: unknown;
  generatedAt?: Date;
  updatedAt?: Date;
}): OperationalRecommendation {
  const explanation = objectValue(item.explanation);
  const confidence = Math.round(item.confidence * (item.confidence <= 1 ? 100 : 1));
  return {
    id: item.id,
    title: item.title,
    narrative: item.summary,
    evidence: stringValue(explanation.reason) ?? item.rationale,
    confidence,
    type: label(item.type),
    status: "Persisted",
    sourceStatus: label(item.status),
    sourceBasis: sourceBasis(item.type, item.status),
    sourceCategory: sourceCategory(item.type),
    priority: priorityLabel(item.priority),
    score: Math.round(item.score),
    expectedOutcome: stringValue(explanation.expectedImpact) ?? item.expectedOutcome ?? "Outcome will be measured after adoption.",
    automationReady: Array.isArray(item.actions) && item.actions.length > 0,
    riskLevel: riskLevel(explanation.riskLevel, item.priority, confidence),
    reasoning: stringValue(explanation.reasoningSummary) ?? stringValue(explanation.explanation) ?? item.rationale,
    supportingMetrics: metricsFrom(explanation.supportingMetrics ?? item.evidence),
    nextAction: nextActionFor(item.type, item.actions),
    generatedAt: item.generatedAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  };
}

function buildAnalyticsIntelligence(
  workspaceId: string,
  analytics: SocialAnalyticsOverview,
  competitors: CompetitorIntelligence,
  marketContext?: MarketContext,
) {
  const series = analytics.engagementTrend.series;
  if (series.length < 3) {
    return {
      predictions7Day: [],
      predictions30Day: [],
      signals: [],
      briefs: [],
      forecastBasis: "Forecasting requires at least three measured engagement observations.",
      marketContext,
      competitors,
    };
  }

  const followerByDate = analytics.followerGrowth.available
    ? new Map(analytics.followerGrowth.series.map((point) => [point.date.slice(0, 10), point.followers]))
    : new Map<string, number>();
  const points = series.map((point) => ({
    capturedAt: `${point.date.slice(0, 10)}T00:00:00.000Z`,
    engagementRate: point.avgEngagementRate,
    reach: Math.round(point.reach),
    followers: followerByDate.get(point.date.slice(0, 10)) ?? 0,
    postsPublished: point.postCount,
    contentPerformance: Math.max(0, Math.min(100, point.avgEngagementRate)),
    audienceSegments: {},
    categories: {},
  }));
  const input = {
    workspaceId,
    source: "social-analytics-overview",
    points,
    observedAt: points.at(-1)?.capturedAt ?? new Date().toISOString(),
  };
  const predictionEngine = new PredictiveAnalyticsEngine();
  const signals = new TrendDetectionEngine().detect(input);
  const predictions7Day = visiblePredictions(predictionEngine.predict(input, 7), analytics.followerGrowth.available);
  const predictions30Day = visiblePredictions(predictionEngine.predict(input, 30), analytics.followerGrowth.available);
  const scores = new IntelligenceScoringService().score(input, signals, predictions7Day);
  const briefs = new AIInsightGenerator().generate(workspaceId, signals, predictions7Day, scores, input.observedAt);
  const followerBasis = analytics.followerGrowth.available
    ? "Follower projections use stored audience observations."
    : "Follower forecasts await measured follower observations.";
  return {
    predictions7Day,
    predictions30Day,
    signals,
    scores,
    briefs,
    forecastBasis: `Predictions use engagement and content-response history. ${followerBasis}`,
    marketContext,
    competitors,
  };
}

function visiblePredictions(predictions: Prediction[], followersAvailable: boolean) {
  return followersAvailable ? predictions : predictions.filter((prediction) => prediction.metric !== "FOLLOWER_GROWTH");
}

function asMarketContext(value: unknown) {
  if (!value || typeof value !== "object" || !("opportunitySignals" in value) || !("healthcareSignals" in value)) return undefined;
  return value as MarketContext;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function metricsFrom(value: unknown): SupportingMetric[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((metric) => {
    const record = objectValue(metric);
    if (typeof record.metric !== "string" || typeof record.currentValue !== "number" || typeof record.previousValue !== "number" || typeof record.changePercent !== "number") return [];
    return [{
      metric: label(record.metric),
      direction: typeof record.direction === "string" ? label(record.direction) : "Observed",
      currentValue: record.currentValue,
      previousValue: record.previousValue,
      changePercent: record.changePercent,
    }];
  });
}

function priorityLabel(priority: number): OperationalRecommendation["priority"] {
  return ({ 1: "Critical", 2: "High", 3: "Medium", 4: "Low" }[priority] ?? "Low") as OperationalRecommendation["priority"];
}

function riskLevel(value: unknown, priority: number, confidence: number): OperationalRecommendation["riskLevel"] {
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH") return value;
  if (priority === 1 || confidence < 70) return "HIGH";
  return priority === 2 ? "MEDIUM" : "LOW";
}

function sourceCategory(type: string): OperationalRecommendation["sourceCategory"] {
  const normalized = type.toUpperCase();
  if (normalized.includes("MARKET") || normalized.includes("COMPETITOR")) return "MARKET_CONTEXT";
  if (normalized.includes("SEARCH") || normalized.includes("SEO") || normalized.includes("DISCOVERABILITY")) return "SEARCH_CONTEXT";
  if (normalized.includes("REPUTATION") || normalized.includes("REVIEW")) return "REPUTATION_CONTEXT";
  return "VIP_RECOMMENDATION";
}

function sourceBasis(type: string, status: string) {
  const category = sourceCategory(type);
  if (category === "MARKET_CONTEXT") return `Persisted VIP AIRecommendation (${label(status)}) with market or competitor intelligence context where connected.`;
  if (category === "SEARCH_CONTEXT") return `Persisted VIP AIRecommendation (${label(status)}) with search and discoverability context where connected.`;
  if (category === "REPUTATION_CONTEXT") return `Persisted VIP AIRecommendation (${label(status)}) with reputation or review intelligence context where connected.`;
  return `Persisted VIP AIRecommendation (${label(status)}) generated from VIP's internal recommendation intelligence.`;
}

function nextActionFor(type: string, actions: unknown) {
  if (Array.isArray(actions) && actions.length > 0) return "Convert the approved recommendation into an action plan, then track execution and measurement.";
  const normalized = type.toUpperCase();
  if (normalized.includes("TIME")) return "Hold the suggested publishing window until an approved content asset is ready.";
  if (normalized.includes("HASHTAG")) return "Validate clinical relevance before attaching the hashtag to an approved education brief.";
  if (normalized.includes("CAMPAIGN") || normalized.includes("CONTENT")) return "Create a production-ready content brief and route it for clinical approval.";
  if (normalized.includes("ENGAGEMENT")) return "Prioritize a recovery brief, then measure response against the current baseline.";
  return "Review the evidence, assign an owner, and decide whether to convert this into a tracked workflow.";
}

function buildWorkflows(
  recommendations: OperationalRecommendation[],
  plans: Array<{ name: string; status: string; type: string; scheduledFor: Date | null }>,
  approvals: Array<{ status: string; reason: string; requestedAt: Date; actionPlan: { name: string } }>,
  automations: Array<{ status: string; queuedAt: Date; attempt: number; lastFailure: string | null }>,
): OperationalWorkflow[] {
  if (plans.length || approvals.length || automations.length) {
    return [
      ...plans.map((plan) => ({
        stage: "Production review",
        title: plan.name,
        detail: plan.scheduledFor ? `Scheduled ${formatDate(plan.scheduledFor.toISOString())}` : label(plan.type),
        status: label(plan.status),
        tone: statusTone(plan.status),
      })),
      ...approvals.map((approval) => ({
        stage: "Doctor approval",
        title: approval.actionPlan.name,
        detail: approval.reason,
        status: label(approval.status),
        tone: statusTone(approval.status),
      })),
      ...automations.map((automation) => ({
        stage: "Automation execution",
        title: "Publishing orchestration",
        detail: automation.lastFailure ?? `Queued ${formatDate(automation.queuedAt.toISOString())}; attempt ${automation.attempt}.`,
        status: label(automation.status),
        tone: statusTone(automation.status),
      })),
    ];
  }
  const title = recommendations[0]?.title ?? "Awaiting measured signal";
  return [
    { stage: "AI recommendation", title, detail: "Derived from recorded Instagram performance.", status: "Proposed", tone: "info" },
    { stage: "Production review", title: "Create clinically appropriate content brief", detail: "No action plan has been created yet.", status: "Not started", tone: "neutral" },
    { stage: "Doctor approval", title: "Clinical and reputation review", detail: "Required before any scheduled publishing.", status: "Awaiting brief", tone: "neutral" },
    { stage: "Scheduled campaign", title: "Publishing slot assignment", detail: "Will follow approval and content readiness.", status: "Pending", tone: "neutral" },
    { stage: "Analytics tracking", title: "Measure engagement response", detail: "Post-level tracking begins after publishing.", status: "Ready", tone: "success" },
  ];
}

function trendNarrative(analytics: SocialAnalyticsOverview) {
  const trend = analytics.engagementTrend;
  if (trend.percentageChange === null) return `${analytics.totalPosts} Instagram posts are available for performance review.`;
  const direction = trend.direction === "DOWN" ? "declined" : trend.direction === "UP" ? "improved" : "remained stable";
  return `Engagement ${direction} ${Math.abs(trend.percentageChange).toFixed(1)}% across measured periods. ${analytics.totalPosts} Instagram posts generated ${integer(analytics.totalReach)} recorded reach at ${analytics.avgEngagementRate.toFixed(2)}% average engagement.`;
}

function measuredPeriod(analytics: SocialAnalyticsOverview) {
  if (!analytics.postingFrequency.length) return "No measured posts";
  const dates = analytics.postingFrequency.map((point) => point.date).sort();
  return `${formatDate(dates[0])} - ${formatDate(dates.at(-1) ?? dates[0])}`;
}

export function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function shortCaption(caption: string | null) {
  if (!caption) return "Untitled Instagram post";
  const cleaned = caption.replace(/\s+/g, " ").trim();
  return cleaned.length > 68 ? `${cleaned.slice(0, 66)}...` : cleaned;
}

function hourLabel(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(status: string): Tone {
  if (["COMPLETED", "APPROVED", "IMPLEMENTED"].includes(status)) return "success";
  if (["FAILED", "DEAD_LETTERED", "REJECTED"].includes(status)) return "danger";
  if (["PENDING", "WAITING_APPROVAL", "RETRY_SCHEDULED"].includes(status)) return "warning";
  return "info";
}
