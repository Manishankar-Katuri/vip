import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { MorningBriefingDto } from "./dto/morning-briefing.dto";

@Injectable()
export class MorningBriefingService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async getMorningBriefing(
    hospitalId:string
  ):Promise<MorningBriefingDto> {
    const [
      hospital,
      reviews,
      openAlerts,
      priorities,
      recommendations,
      outcomeTrackings,
      socialSignals,
      revenueSignals,
      competitorSignals
    ] = await Promise.all([
      this.prisma.hospitalWorkspace.findUniqueOrThrow({
        where:{ id:hospitalId },
        select:{
          id:true,
          name:true,
          specialty:true,
          city:true,
          updatedAt:true
        }
      }),
      this.prisma.review.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:{ createdAt:"desc" },
        take:100
      }),
      this.prisma.reviewAlert.count({
        where:{
          workspaceId:hospitalId,
          status:"OPEN"
        }
      }),
      this.prisma.intelligencePriority.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { strategicImportance:"desc" },
          { urgency:"desc" }
        ],
        take:5
      }),
      this.prisma.recommendationProvenance.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { confidence:"desc" },
          { createdAt:"desc" }
        ],
        take:5
      }),
      this.prisma.recommendationOutcomeTracking.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:{ updatedAt:"desc" },
        take:5
      }),
      this.prisma.intelligenceSignal.findMany({
        where:{
          workspaceId:hospitalId,
          signalType:{ contains:"SOCIAL" }
        },
        orderBy:{ detectedAt:"desc" },
        take:10
      }),
      this.prisma.intelligenceSignal.findMany({
        where:{
          workspaceId:hospitalId,
          signalType:{ contains:"REVENUE" }
        },
        orderBy:{ detectedAt:"desc" },
        take:10
      }),
      this.prisma.intelligenceSignal.findMany({
        where:{
          workspaceId:hospitalId,
          signalType:{ contains:"COMPETITOR" }
        },
        orderBy:{ detectedAt:"desc" },
        take:10
      })
    ]);

    const reputation = buildReputation(reviews, openAlerts);
    const social = buildSocial(socialSignals);
    const revenue = buildRevenue(revenueSignals, outcomeTrackings);
    const competitor = buildCompetitor(competitorSignals, priorities);
    const actionRecommendations = buildRecommendations(
      recommendations,
      priorities
    );
    const vipHealthScore = buildVipHealthScore(
      reputation.healthScore,
      social.engagement,
      revenue.influencedRevenue,
      openAlerts
    );
    const insightOfTheDay =
      recommendations[0]
        ? {
            title:recommendations[0].title,
            summary:recommendations[0].rationale,
            confidence:Math.round(recommendations[0].confidence * 100)
          }
        : priorities[0]
          ? {
              title:priorities[0].title,
              summary:priorities[0].reason,
              confidence:Math.round(priorities[0].confidence * 100)
            }
          : {
              title:"No critical insight yet",
              summary:"VIP is waiting for enough connected intelligence signals to generate a daily executive insight.",
              confidence:0
            };

    return {
      hospital:{
        id:hospital.id,
        name:hospital.name,
        specialty:hospital.specialty,
        city:hospital.city
      },
      generatedAt:new Date().toISOString(),
      welcome:{
        greeting:"Good Morning",
        currentVipScore:vipHealthScore.overallScore,
        scoreTrend:vipHealthScore.changePercent > 1
          ? "UP"
          : vipHealthScore.changePercent < -1
            ? "DOWN"
            : "STABLE",
        lastUpdated:hospital.updatedAt.toISOString()
      },
      vipHealthScore,
      revenue,
      reputation:{
        averageRating:reputation.averageRating,
        reviewVolume:reputation.reviewVolume,
        positiveTrend:reputation.positiveTrend,
        negativeTrend:reputation.negativeTrend,
        sentimentSummary:reputation.sentimentSummary
      },
      social,
      competitor,
      insightOfTheDay,
      goals:buildGoals(outcomeTrackings),
      recommendations:actionRecommendations
    };
  }
}

function buildReputation(
  reviews:Array<{
    rating:number;
    sentiment:string | null;
    issueDetected:boolean;
  }>,
  openAlerts:number
) {
  const reviewVolume = reviews.length;
  const averageRating = reviewVolume
    ? round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviewVolume, 1)
    : 0;
  const positive = reviews.filter((review) => review.sentiment === "POSITIVE").length;
  const negative = reviews.filter((review) => review.sentiment === "NEGATIVE").length;
  const issueCount = reviews.filter((review) => review.issueDetected).length;
  const healthScore = Math.max(
    20,
    Math.min(
      100,
      Math.round((averageRating / 5) * 100) -
        negative * 3 -
        issueCount * 2 -
        openAlerts * 8
    )
  );

  return {
    averageRating,
    reviewVolume,
    positiveTrend:positive,
    negativeTrend:negative,
    healthScore,
    sentimentSummary:reviewVolume
      ? `${positive} positive and ${negative} negative reviews in the latest stored reputation window.`
      : "No stored reputation reviews yet."
  };
}

function buildRevenue(
  signals:Array<{ direction:string; scores:unknown; summary:string }>,
  outcomes:Array<{ expectedOutcome:string }>
) {
  const latestSignal = signals[0];
  const impactScore = scoreFromJson(latestSignal?.scores, "impact");
  const influencedRevenue = Math.round(impactScore * 10000);

  return {
    influencedRevenue,
    trend:direction(latestSignal?.direction),
    topContributingChannels:[
      { channel:"Recommendations", value:outcomes.length },
      { channel:"Reputation", value:signals.length },
      { channel:"Workflows", value:0 }
    ],
    summary:
      latestSignal?.summary ??
      "Revenue attribution feed is ready; no persisted revenue signal has been emitted yet."
  };
}

function buildSocial(
  signals:Array<{ direction:string; scores:unknown; summary:string }>
) {
  const engagement = Math.round(scoreFromJson(signals[0]?.scores, "impact"));

  return {
    instagramGrowth:scoreFromJson(signals[0]?.scores, "momentum"),
    facebookGrowth:scoreFromJson(signals[1]?.scores, "momentum"),
    engagement,
    bestPerformingContent:
      signals[0]?.summary ??
      "No best-performing content signal stored yet.",
    summary:signals.length
      ? `${signals.length} social intelligence signal${signals.length === 1 ? "" : "s"} available.`
      : "Social intelligence is connected to the briefing but has no stored signal yet."
  };
}

function buildCompetitor(
  signals:Array<{ direction:string; summary:string }>,
  priorities:Array<{ title:string; reason:string; kind:string }>
) {
  const competitorPriority = priorities.find((priority) =>
    `${priority.kind} ${priority.title}`.toLowerCase().includes("compet")
  );

  return {
    currentRanking:signals.length ? "Tracked" : "Awaiting signal",
    topCompetitor:signals[0]?.summary ?? "No competitor leader stored yet",
    movement:signals[0]?.direction ?? "STABLE",
    keyOpportunity:
      competitorPriority?.reason ??
      "Use competitor intelligence once the market signal feed stores a priority."
  };
}

function buildRecommendations(
  recommendations:Array<{
    title:string;
    rationale:string;
    confidence:number;
    executionSteps:unknown;
  }>,
  priorities:Array<{
    title:string;
    reason:string;
    confidence:number;
    recommendedActions:unknown;
  }>
) {
  const fromRecommendations = recommendations.map((recommendation) => ({
    title:recommendation.title,
    action:firstString(recommendation.executionSteps) ?? recommendation.rationale,
    priority:recommendation.confidence >= 0.85 ? "HIGH" : "MEDIUM",
    confidence:Math.round(recommendation.confidence * 100)
  }));
  const fromPriorities = priorities.map((priority) => ({
    title:priority.title,
    action:firstString(priority.recommendedActions) ?? priority.reason,
    priority:priority.confidence >= 0.85 ? "HIGH" : "MEDIUM",
    confidence:Math.round(priority.confidence * 100)
  }));

  return [...fromRecommendations, ...fromPriorities].slice(0, 3);
}

function buildGoals(
  outcomes:Array<{
    expectedOutcome:string;
    measurementWindow:unknown;
    confidenceEvolution:unknown;
    updatedAt:Date;
  }>
) {
  if (!outcomes.length) {
    return [
      {
        title:"Connect first measurable growth goal",
        progress:0,
        targetDate:new Date().toISOString(),
        status:"Foundation ready"
      }
    ];
  }

  return outcomes.slice(0, 3).map((outcome) => ({
    title:outcome.expectedOutcome,
    progress:Math.round(scoreFromJson(outcome.confidenceEvolution, "progress")),
    targetDate:targetDateFrom(outcome.measurementWindow, outcome.updatedAt),
    status:"Tracking"
  }));
}

function buildVipHealthScore(
  reputationScore:number,
  socialEngagement:number,
  revenueValue:number,
  openAlerts:number
) {
  const revenueScore = revenueValue > 0 ? 75 : 50;
  const socialScore = socialEngagement > 0 ? socialEngagement : 50;
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(reputationScore * 0.45 + socialScore * 0.25 + revenueScore * 0.2 + (100 - openAlerts * 10) * 0.1)
    )
  );
  const previousScore = Math.max(0, overallScore - (openAlerts ? -2 : 3));
  const changePercent = previousScore
    ? round(((overallScore - previousScore) / previousScore) * 100, 1)
    : 0;

  return {
    overallScore,
    previousScore,
    changePercent,
    status:overallScore >= 85
      ? "Excellent" as const
      : overallScore >= 70
        ? "Good" as const
        : overallScore >= 50
          ? "Needs Attention" as const
          : "Critical" as const
  };
}

function scoreFromJson(
  value:unknown,
  key:string
) {
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "number") return direct;
  const scores = record.scores;
  if (scores && typeof scores === "object") {
    const nested = (scores as Record<string, unknown>)[key];
    if (typeof nested === "number") return nested;
  }
  return 0;
}

function firstString(
  value:unknown
) {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }

  if (typeof value === "string") return value;

  return undefined;
}

function targetDateFrom(
  value:unknown,
  fallback:Date
) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.endsAt === "string") return record.endsAt;
    if (typeof record.targetDate === "string") return record.targetDate;
  }

  return fallback.toISOString();
}

function direction(
  value:string | undefined
):"UP" | "DOWN" | "STABLE" {
  return value === "UP" || value === "DOWN" ? value : "STABLE";
}

function round(
  value:number,
  digits:number
) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
