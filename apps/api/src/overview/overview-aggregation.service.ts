import {
  Inject,
  Injectable
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { Permission } from "../auth/permissions/permissions.enum";
import { PermissionService } from "../auth/permissions/permission.service";
import { AIUsageTracker } from "../ai-audit/ai-usage-tracker.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  OVERVIEW_OPENAI_CLIENT,
  type OverviewOpenAIClient
} from "./overview-openai.provider";
import type {
  OverviewCard,
  OverviewCacheStatus,
  OverviewInsightDto,
  OverviewMetricDto,
  OverviewModuleType,
  OverviewQuickAction,
  OverviewResponseDto,
  OverviewSummaryStatus,
  OverviewTrendDirection
} from "./overview.dto";

type GenerateInput = {
  hospitalId:string;
  userId:string;
  roleId:UserRole;
  refresh?:boolean;
};

type OverviewFact = {
  module:OverviewModuleType;
  label:string;
  value:string;
  importance:number;
};

type OverviewCacheEntry = {
  payload:OverviewResponseDto;
  refreshedAt:number;
  refreshPromise?:Promise<OverviewResponseDto>;
};

const FRESH_TTL_MS = 2 * 60 * 1000;
const STALE_TTL_MS = 10 * 60 * 1000;
const OPENAI_MODEL = process.env.OVERVIEW_OPENAI_MODEL ?? "gpt-4.1-mini";

const OVERVIEW_MODULE_PERMISSIONS:Record<
  OverviewModuleType,
  readonly Permission[]
> = {
  analytics:[
    Permission.VIEW_MORNING_BRIEFING,
    Permission.VIEW_VIP_SCORE,
    Permission.VIEW_REVENUE,
    Permission.VIEW_REPUTATION,
    Permission.VIEW_AI_INSIGHTS
  ],
  intelligence:[
    Permission.VIEW_AI_INSIGHTS,
    Permission.VIEW_SOCIAL_INTELLIGENCE,
    Permission.VIEW_MARKET_INTELLIGENCE,
    Permission.VIEW_COMPETITORS
  ],
  strategy:[
    Permission.VIEW_STRATEGY
  ],
  recommendations:[
    Permission.VIEW_RECOMMENDATIONS
  ],
  automation:[
    Permission.VIEW_WORKFLOWS,
    Permission.MANAGE_WORKFLOWS
  ]
};

const MODULE_ORDER:OverviewModuleType[] = [
  "analytics",
  "intelligence",
  "strategy",
  "recommendations",
  "automation"
];

@Injectable()
export class OverviewAggregationService {
  private readonly cache = new Map<string, OverviewCacheEntry>();

  constructor(
    private readonly prisma:PrismaService,
    private readonly permissions:PermissionService,
    private readonly aiUsageTracker:AIUsageTracker,
    @Inject(OVERVIEW_OPENAI_CLIENT)
    private readonly openai:OverviewOpenAIClient | null
  ) {}

  async generate(
    input:GenerateInput
  ):Promise<OverviewResponseDto> {
    const cacheKey = [
      input.hospitalId,
      input.roleId,
      input.userId
    ].join(":");
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (!input.refresh && cached && now - cached.refreshedAt <= FRESH_TTL_MS) {
      return {
        ...cached.payload,
        source:{
          ...cached.payload.source,
          cacheStatus:"fresh"
        }
      };
    }

    if (!input.refresh && cached && now - cached.refreshedAt <= STALE_TTL_MS) {
      if (!cached.refreshPromise) {
        cached.refreshPromise = this.generateFresh(input)
          .then((payload) => {
            this.cache.set(cacheKey, {
              payload,
              refreshedAt:Date.now()
            });

            return payload;
          })
          .catch(() => cached.payload)
          .finally(() => {
            const latest = this.cache.get(cacheKey);

            if (latest?.refreshPromise) {
              delete latest.refreshPromise;
            }
          });
      }

      return {
        ...cached.payload,
        source:{
          ...cached.payload.source,
          cacheStatus:"stale"
        }
      };
    }

    const payload = await this.generateFresh(input);

    this.cache.set(cacheKey, {
      payload,
      refreshedAt:Date.now()
    });

    return payload;
  }

  clearCache() {
    this.cache.clear();
  }

  private async generateFresh(
    input:GenerateInput
  ):Promise<OverviewResponseDto> {
    const [permissions, data] = await Promise.all([
      this.permissions.getRoleAccess({
        roleId:input.roleId,
        hospitalId:input.hospitalId
      }),
      this.collectData(input.hospitalId)
    ]);
    const visibleModules = this.getVisibleModules(permissions);
    const cards:OverviewCard[] = [];
    const facts:OverviewFact[] = [];

    if (visibleModules.includes("analytics")) {
      const card = this.buildAnalyticsCard(data);

      cards.push(card);
      facts.push(...card.metrics.map((metric) => ({
        module:"analytics" as const,
        label:metric.label,
        value:`${metric.value} (${metric.detail})`,
        importance:70
      })));
    }

    if (visibleModules.includes("intelligence")) {
      const card = this.buildIntelligenceCard(data);

      cards.push(card);
      facts.push(...card.insights.map((insight, index) => ({
        module:"intelligence" as const,
        label:insight.label,
        value:`${insight.title}: ${insight.detail}`,
        importance:90 - index * 5
      })));
    }

    if (visibleModules.includes("strategy")) {
      const card = this.buildStrategyCard(data);

      cards.push(card);
      facts.push(
        {
          module:"strategy",
          label:"Strategic focus",
          value:card.focus,
          importance:85
        },
        {
          module:"strategy",
          label:"Priority action",
          value:card.highestPriorityAction,
          importance:80
        }
      );
    }

    if (visibleModules.includes("recommendations")) {
      const card = this.buildRecommendationsCard(data);

      cards.push(card);
      facts.push(...card.recommendations.map((recommendation, index) => ({
        module:"recommendations" as const,
        label:recommendation.title,
        value:recommendation.action,
        importance:75 - index * 5
      })));
    }

    if (visibleModules.includes("automation")) {
      const card = this.buildAutomationCard(data);

      cards.push(card);
      facts.push({
        module:"automation",
        label:"Automation attention",
        value:card.detail,
        importance:card.attentionRequired > 0 ? 88 : 55
      });
    }

    const quickActions = this.buildQuickActions(cards);
    const summaryResult = await this.generateExecutiveSummary({
      input,
      facts
    });
    const generatedAt = new Date().toISOString();

    return {
      hospital:data.hospital,
      generatedAt,
      source:{
        generatedAt,
        cacheStatus:"refreshed" as OverviewCacheStatus
      },
      permissions,
      visibleModules,
      executiveSummary:summaryResult.summary,
      summaryStatus:summaryResult.status,
      cards,
      quickActions
    };
  }

  private async collectData(
    hospitalId:string
  ) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [
      hospital,
      reviews,
      openAlerts,
      signals,
      priorities,
      recommendations,
      outcomes,
      calendarItems,
      generatorRuns
    ] = await Promise.all([
      this.prisma.hospitalWorkspace.findUniqueOrThrow({
        where:{ id:hospitalId },
        select:{
          id:true,
          name:true,
          slug:true,
          specialty:true,
          city:true,
          status:true
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
      this.prisma.intelligenceSignal.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { severity:"desc" },
          { detectedAt:"desc" }
        ],
        take:25
      }),
      this.prisma.intelligencePriority.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { strategicImportance:"desc" },
          { urgency:"desc" }
        ],
        take:10
      }),
      this.prisma.recommendationProvenance.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { confidence:"desc" },
          { createdAt:"desc" }
        ],
        take:10
      }),
      this.prisma.recommendationOutcomeTracking.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:{ updatedAt:"desc" },
        take:10
      }),
      this.prisma.contentCalendarItem.findMany({
        where:{
          hospitalId,
          deletedAt:null
        },
        orderBy:{ updatedAt:"desc" },
        take:50
      }),
      this.prisma.contentGeneratorRun.findMany({
        where:{
          hospitalId,
          createdAt:{ gte:since }
        },
        orderBy:{ createdAt:"desc" },
        take:50
      })
    ]);

    return {
      hospital,
      reviews,
      openAlerts,
      signals,
      priorities,
      recommendations,
      outcomes,
      calendarItems,
      generatorRuns
    };
  }

  private getVisibleModules(
    permissions:readonly Permission[]
  ) {
    return MODULE_ORDER.filter((module) =>
      OVERVIEW_MODULE_PERMISSIONS[module].some((permission) =>
        permissions.includes(permission)
      )
    );
  }

  private buildAnalyticsCard(
    data:Awaited<ReturnType<OverviewAggregationService["collectData"]>>
  ):Extract<OverviewCard, { type:"analytics" }> {
    const reviewCount = data.reviews.length;
    const averageRating = reviewCount
      ? round(data.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount, 1)
      : 0;
    const positive = data.reviews.filter((review) =>
      review.sentiment === "POSITIVE"
    ).length;
    const negative = data.reviews.filter((review) =>
      review.sentiment === "NEGATIVE"
    ).length;
    const conversionSignals = data.signals.filter((signal) =>
      includesAny(signal.signalType, ["CONVERSION", "LEAD", "REVENUE"])
    );
    const patientGrowthSignals = data.signals.filter((signal) =>
      includesAny(signal.signalType, ["PATIENT", "GROWTH"])
    );

    const metrics:OverviewMetricDto[] = [
      {
        label:"Revenue Trend",
        value:trendLabel(conversionSignals[0]?.direction),
        trend:direction(conversionSignals[0]?.direction),
        detail:conversionSignals[0]?.summary ?? "No revenue signal emitted yet."
      },
      {
        label:"Leads Generated",
        value:String(conversionSignals.length),
        trend:conversionSignals.length > 0 ? "UP" : "STABLE",
        detail:"Recent lead and conversion intelligence signals."
      },
      {
        label:"Patient Growth",
        value:String(patientGrowthSignals.length || positive),
        trend:patientGrowthSignals.length || positive > negative ? "UP" : negative > positive ? "DOWN" : "STABLE",
        detail:patientGrowthSignals[0]?.summary ?? `${positive} positive and ${negative} negative reviews in the latest window.`
      },
      {
        label:"Conversion Rate",
        value:reviewCount ? `${Math.round((positive / reviewCount) * 100)}%` : "0%",
        trend:positive >= negative ? "UP" : "DOWN",
        detail:`Average reputation rating is ${averageRating}/5 across ${reviewCount} reviews.`
      }
    ];

    return {
      type:"analytics",
      title:"Analytics Summary",
      description:"Top operating metrics from accessible analytics signals.",
      dataStatus:reviewCount || data.signals.length ? "live" : "empty",
      metrics
    };
  }

  private buildIntelligenceCard(
    data:Awaited<ReturnType<OverviewAggregationService["collectData"]>>
  ):Extract<OverviewCard, { type:"intelligence" }> {
    const fromSignals = data.signals.slice(0, 5).map((signal) => ({
      label:this.intelligenceLabel(signal.signalType, signal.severity),
      title:sentence(signal.signalType),
      detail:signal.summary,
      tone:toneFromSeverity(signal.severity)
    }));
    const fallback = data.priorities.slice(0, 5).map((priority) => ({
      label:"Opportunity",
      title:priority.title,
      detail:priority.reason,
      tone:"info" as const
    }));
    const insights:OverviewInsightDto[] = [
      ...fromSignals,
      ...fallback
    ].slice(0, 5);

    if (insights.length === 0) {
      insights.push({
        label:"Key Insight",
        title:"Intelligence feed is ready",
        detail:"No stored intelligence signal has been emitted for this hospital yet.",
        tone:"neutral"
      });
    }

    return {
      type:"intelligence",
      title:"Intelligence Summary",
      description:"Ranked alerts, opportunities, and trends from intelligence engines.",
      dataStatus:data.signals.length || data.priorities.length ? "live" : "empty",
      insights
    };
  }

  private buildStrategyCard(
    data:Awaited<ReturnType<OverviewAggregationService["collectData"]>>
  ):Extract<OverviewCard, { type:"strategy" }> {
    const priority = data.priorities[0];
    const completed = data.outcomes.length;
    const total = Math.max(
      completed,
      data.priorities.length,
      10
    );

    return {
      type:"strategy",
      title:"Strategy Summary",
      description:"Current strategic focus and highest-impact next move.",
      dataStatus:priority ? "live" : "empty",
      focus:priority?.title ?? "No strategic priority is available yet.",
      topOpportunity:priority?.reason ?? "VIP will surface the top opportunity after strategy signals are generated for this hospital.",
      highestPriorityAction:firstString(priority?.recommendedActions) ?? "Review connected strategy inputs.",
      progress:{
        completed,
        total,
        label:`${completed}/${total} strategic actions completed.`
      }
    };
  }

  private buildRecommendationsCard(
    data:Awaited<ReturnType<OverviewAggregationService["collectData"]>>
  ):Extract<OverviewCard, { type:"recommendations" }> {
    const recommendations = data.recommendations.slice(0, 3).map((item) => ({
      title:item.title,
      action:firstString(item.executionSteps) ?? item.rationale,
      confidence:Math.round(item.confidence * 100)
    }));

    if (recommendations.length === 0) {
      recommendations.push({
        title:"No recommendations ready yet",
        action:"VIP will surface the top three recommendations once enough signals are available.",
        confidence:0
      });
    }

    return {
      type:"recommendations",
      title:"Recommendations Summary",
      description:"Top ranked recommendations for the selected hospital.",
      dataStatus:data.recommendations.length ? "live" : "empty",
      recommendations
    };
  }

  private buildAutomationCard(
    data:Awaited<ReturnType<OverviewAggregationService["collectData"]>>
  ):Extract<OverviewCard, { type:"automation" }> {
    const running = data.calendarItems.filter((item) =>
      ["PLANNED", "IN_PRODUCTION", "SCRIPT_READY", "READY_TO_POST"].includes(
        item.status
      )
    ).length;
    const completedThisWeek = data.generatorRuns.filter((run) =>
      ["COMPLETED", "APPROVED", "PUBLISHED"].includes(run.status)
    ).length;
    const attentionRequired = data.generatorRuns.filter((run) =>
      ["FAILED", "REJECTED", "CANCELLED"].includes(run.status)
    ).length;

    return {
      type:"automation",
      title:"Automation Summary",
      description:"Workflow and production automation activity.",
      dataStatus:data.calendarItems.length || data.generatorRuns.length ? "live" : "empty",
      activeAutomations:running,
      completedThisWeek,
      attentionRequired,
      detail:attentionRequired > 0
        ? `${attentionRequired} workflow item${attentionRequired === 1 ? "" : "s"} need attention.`
        : "No failed workflows require attention."
    };
  }

  private buildQuickActions(
    cards:OverviewCard[]
  ):OverviewQuickAction[] {
    const actions:OverviewQuickAction[] = [];

    for (const card of cards) {
      if (card.type === "strategy") {
        actions.push({
          id:"strategy-priority",
          label:card.highestPriorityAction,
          detail:card.topOpportunity,
          href:"/strategy",
          module:"strategy",
          priority:"HIGH"
        });
      }

      if (card.type === "intelligence") {
        const alert = card.insights.find((insight) =>
          insight.tone === "warning" || insight.tone === "danger"
        ) ?? card.insights[0];

        if (alert) {
          actions.push({
            id:"review-intelligence",
            label:"Review intelligence changes",
            detail:alert.detail,
            href:"/local-market",
            module:"intelligence",
            priority:alert.tone === "danger" ? "HIGH" : "MEDIUM"
          });
        }
      }

      if (card.type === "recommendations") {
        const recommendation = card.recommendations[0];

        if (recommendation && recommendation.confidence > 0) {
          actions.push({
            id:"approve-recommendation",
            label:"Approve recommendation",
            detail:recommendation.action,
            href:"/opportunities",
            module:"recommendations",
            priority:"MEDIUM"
          });
        }
      }

      if (card.type === "automation" && card.attentionRequired > 0) {
        actions.push({
          id:"fix-workflows",
          label:"Review failed workflows",
          detail:card.detail,
          href:"/governance",
          module:"automation",
          priority:"HIGH"
        });
      }
    }

    return actions
      .sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority))
      .slice(0, 3);
  }

  private async generateExecutiveSummary(
    input:{
      input:GenerateInput;
      facts:OverviewFact[];
    }
  ):Promise<{
    summary:string;
    status:OverviewSummaryStatus;
  }> {
    const fallback = deterministicSummary(input.facts);

    if (!this.openai || input.facts.length === 0) {
      return {
        summary:fallback,
        status:"fallback"
      };
    }

    try {
      const response = await this.aiUsageTracker.execute({
        hospitalId:input.input.hospitalId,
        userId:input.input.userId,
        roleId:input.input.roleId,
        feature:"overview.executive_summary",
        provider:"openai",
        model:OPENAI_MODEL,
        operation:() => this.openai!.responses.create({
          model:OPENAI_MODEL,
          input:[
            {
              role:"system",
              content:"Write a healthcare growth dashboard executive summary. Use only the provided facts. Keep it under 100 words. Do not mention modules or facts that are not provided."
            },
            {
              role:"user",
              content:JSON.stringify({
                facts:input.facts
                  .sort((left, right) => right.importance - left.importance)
                  .slice(0, 12)
              })
            }
          ],
          text:{
            format:{
              type:"json_schema",
              name:"overview_executive_summary",
              strict:true,
              schema:{
                type:"object",
                additionalProperties:false,
                properties:{
                  summary:{
                    type:"string",
                    description:"Executive summary under 100 words."
                  }
                },
                required:["summary"]
              }
            }
          }
        })
      });
      const summary = parseSummary(response);

      return {
        summary:limitWords(summary || fallback, 100),
        status:summary ? "generated" : "fallback"
      };
    } catch {
      return {
        summary:fallback,
        status:"fallback"
      };
    }
  }

  private intelligenceLabel(
    signalType:string,
    severity:string
  ) {
    if (severity === "HIGH" || severity === "CRITICAL") return "Alert";
    if (includesAny(signalType, ["TREND"])) return "Trend";
    if (includesAny(signalType, ["OPPORTUNITY", "GROWTH"])) return "Opportunity";

    return "Key Insight";
  }
}

function parseSummary(
  response:unknown
) {
  const record = response as {
    output_text?:string;
    output?:Array<{
      content?:Array<{
        text?:string;
      }>;
    }>;
  };
  const text =
    record.output_text ??
    record.output?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .find((value): value is string => typeof value === "string");

  if (!text) return "";

  try {
    const parsed = JSON.parse(text) as { summary?:unknown };

    return typeof parsed.summary === "string"
      ? parsed.summary
      : "";
  } catch {
    return text;
  }
}

function deterministicSummary(
  facts:OverviewFact[]
) {
  if (facts.length === 0) {
    return "No accessible overview signals are available yet. VIP will surface the most important updates once connected modules generate new activity.";
  }

  const topFacts = facts
    .sort((left, right) => right.importance - left.importance)
    .slice(0, 3)
    .map((fact) => `${fact.label}: ${fact.value}`);

  return limitWords(topFacts.join(" "), 100);
}

function firstString(
  value:unknown
) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");

    return typeof first === "string"
      ? first
      : undefined;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const first = Object.values(record).find((item) =>
      typeof item === "string"
    );

    return typeof first === "string"
      ? first
      : undefined;
  }

  return undefined;
}

function trendLabel(
  value:string | undefined
) {
  const normalized = direction(value);

  if (normalized === "UP") return "Up";
  if (normalized === "DOWN") return "Down";

  return "Stable";
}

function direction(
  value:string | undefined
):OverviewTrendDirection {
  return value === "UP" || value === "DOWN"
    ? value
    : "STABLE";
}

function toneFromSeverity(
  severity:string
) {
  if (severity === "CRITICAL") return "danger" as const;
  if (severity === "HIGH") return "warning" as const;
  if (severity === "LOW") return "neutral" as const;

  return "info" as const;
}

function includesAny(
  value:string,
  terms:string[]
) {
  const upper = value.toUpperCase();

  return terms.some((term) => upper.includes(term));
}

function sentence(
  value:string
) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function priorityRank(
  priority:OverviewQuickAction["priority"]
) {
  if (priority === "HIGH") return 3;
  if (priority === "MEDIUM") return 2;

  return 1;
}

function limitWords(
  value:string,
  maxWords:number
) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  return words.length > maxWords
    ? `${words.slice(0, maxWords).join(" ")}.`
    : value.trim();
}

function round(
  value:number,
  digits:number
) {
  const multiplier = 10 ** digits;

  return Math.round(value * multiplier) / multiplier;
}
