import {
  ExplanationsResponseSchema,
  InsightsResponseSchema,
  OpportunitiesResponseSchema,
  RecommendationsResponseSchema,
  type RecommendationDto,
  type RecommendationFilter,
  type RecommendationQuery,
  type SummaryQuery,
} from "./contracts";
import { TransientAiRepositoryError, type AiRecommendationQueryRepository } from "./ports";
import { serializeRecommendation } from "./serialization";

export class AiRecommendationReadService {
  constructor(private readonly repository: AiRecommendationQueryRepository) {}

  async recommendations(query: RecommendationQuery) {
    const result = await retryRead(() => this.repository.list(query));
    return RecommendationsResponseSchema.parse({
      success: true,
      data: result.rows.map(serializeRecommendation),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.pageSize),
      },
    });
  }

  async insights(query: SummaryQuery) {
    const data = await this.summaryRecommendations(query);
    const priorities = countBy(data, (item) => item.priority);
    const statuses = countBy(data, (item) => item.status);
    const risk = data.filter((item) => item.explanation.riskLevel === "HIGH");
    const engagement = data
      .filter((item) => isEngagementOpportunity(item))
      .slice(0, query.limit);
    return InsightsResponseSchema.parse({
      success: true,
      data: {
        summary: summarize(data, priorities),
        counts: { total: data.length, byStatus: statuses, byPriority: priorities },
        riskSummary: {
          highRiskCount: risk.length,
          criticalCount: priorities.CRITICAL ?? 0,
          decliningEngagementCount: data.filter(hasDecliningEngagement).length,
        },
        engagementOpportunities: engagement,
      },
    });
  }

  async explanations(query: SummaryQuery) {
    const data = (await this.summaryRecommendations(query)).slice(0, query.limit);
    return ExplanationsResponseSchema.parse({
      success: true,
      data: data.map((item) => ({
        recommendationId: item.id,
        type: item.type,
        title: item.title,
        explanation: item.explanation,
      })),
    });
  }

  async opportunities(query: SummaryQuery) {
    const data = await this.summaryRecommendations(query);
    return OpportunitiesResponseSchema.parse({
      success: true,
      data: {
        highestValue: data.slice(0, query.limit),
        growthOpportunities: data.filter(isGrowthOpportunity).slice(0, query.limit),
        criticalRecoveryActions: data.filter(isCriticalRecovery).slice(0, query.limit),
        automationReady: data.filter((item) => item.automationReady).slice(0, query.limit),
      },
    });
  }

  private async summaryRecommendations(filters: RecommendationFilter) {
    const records = await retryRead(() => this.repository.summarize(filters));
    return records.map(serializeRecommendation).sort((left, right) => right.score - left.score);
  }
}

async function retryRead<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let failure: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      failure = error;
      if (!(error instanceof TransientAiRepositoryError) || attempt === attempts) throw error;
    }
  }
  throw failure;
}

function countBy(items: RecommendationDto[], value: (item: RecommendationDto) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = value(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function summarize(data: RecommendationDto[], priorities: Record<string, number>) {
  if (data.length === 0) return "No recommendations match the requested filters.";
  const urgent = (priorities.CRITICAL ?? 0) + (priorities.HIGH ?? 0);
  return `${data.length} recommendations available; ${urgent} require high or critical attention.`;
}

function hasDecliningEngagement(item: RecommendationDto) {
  return item.explanation.supportingMetrics.some(
    (metric) => metric.metric === "ENGAGEMENT" && metric.direction === "DECREASED"
  );
}

function isEngagementOpportunity(item: RecommendationDto) {
  return item.type === "ENGAGEMENT_RECOVERY" || hasDecliningEngagement(item);
}

function isGrowthOpportunity(item: RecommendationDto) {
  return item.type === "GROWTH_ACCELERATION" || item.type === "GROWTH_OPPORTUNITY";
}

function isCriticalRecovery(item: RecommendationDto) {
  return item.priority === "CRITICAL" && isEngagementOpportunity(item);
}
