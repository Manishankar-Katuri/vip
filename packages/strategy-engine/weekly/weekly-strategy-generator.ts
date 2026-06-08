import { DefaultSignalAggregator } from "../aggregation";
import type {
  RecommendationGenerator,
  SignalAggregator,
  SignalProvider,
} from "../interfaces";
import { RuleBasedRecommendationGenerator } from "../recommendations";
import type {
  IntelligenceSignal,
  StrategicRecommendation,
  StrategyGenerationInput,
  WeeklyStrategy,
  WorkspaceStrategyContext,
} from "../types";
import { slug } from "../utils/numbers";

export interface WeeklyStrategyGeneratorOptions {
  aggregator?: SignalAggregator;
  recommendationGenerator?: RecommendationGenerator;
}

export interface ProviderGenerationInput {
  context: WorkspaceStrategyContext;
  providers: SignalProvider[];
  asOf?: Date;
  maxRecommendations?: number;
}

export class WeeklyStrategyGenerator {
  private readonly aggregator: SignalAggregator;
  private readonly recommendationGenerator: RecommendationGenerator;

  constructor(options: WeeklyStrategyGeneratorOptions = {}) {
    this.aggregator = options.aggregator ?? new DefaultSignalAggregator();
    this.recommendationGenerator =
      options.recommendationGenerator ?? new RuleBasedRecommendationGenerator();
  }

  generate(input: StrategyGenerationInput): WeeklyStrategy {
    const asOf = input.asOf ?? new Date();
    const signalSet = this.aggregator.aggregate(input.context, input.signals, asOf);
    const executionContext = { workspace: input.context, signalSet, asOf };
    const recommendations = this.recommendationGenerator
      .generate(executionContext)
      .slice(0, input.maxRecommendations ?? 5);
    const evidenceIds = new Set(
      recommendations.flatMap((recommendation) =>
        recommendation.evidence.map((signal) => signal.id)
      )
    );
    const watchlist = signalSet.signals
      .filter((signal) => !evidenceIds.has(signal.id))
      .slice(0, 5);
    const period = weeklyPeriod(asOf);

    return {
      id: `${input.context.workspaceId}:weekly:${period.startsAt.slice(0, 10)}`,
      workspaceId: input.context.workspaceId,
      generatedAt: asOf.toISOString(),
      period,
      executiveSummary: executiveSummary(input.context, recommendations, signalSet.signals.length),
      signalCoverage: signalSet.groups.map(({ type, count, averageRelevance }) => ({
        type,
        count,
        averageRelevance,
      })),
      recommendations,
      watchlist,
      dashboard: {
        recommendationCount: recommendations.length,
        topPriority: recommendations[0]?.score.priority ?? null,
        categoryDistribution: distribution(recommendations),
        signalCount: signalSet.signals.length,
      },
    };
  }

  async generateFromProviders(input: ProviderGenerationInput): Promise<WeeklyStrategy> {
    const asOf = input.asOf ?? new Date();
    const collections = await Promise.all(
      input.providers.map((provider) => provider.collect({ context: input.context, asOf }))
    );

    return this.generate({
      context: input.context,
      signals: collections.flat(),
      asOf,
      maxRecommendations: input.maxRecommendations,
    });
  }
}

function executiveSummary(
  context: WorkspaceStrategyContext,
  recommendations: StrategicRecommendation[],
  signalCount: number
) {
  const workspace = context.workspaceName ?? slug(context.workspaceId);
  if (recommendations.length === 0) {
    return `${workspace} has ${signalCount} eligible signals, with no rule-triggered strategic actions this week.`;
  }

  const lead = recommendations[0];
  return `${workspace} has ${signalCount} eligible signals and ${recommendations.length} recommended action(s). Highest priority: ${lead.title} (${lead.score.priority.toLowerCase()}, score ${lead.score.total}).`;
}

function weeklyPeriod(asOf: Date) {
  const start = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function distribution(recommendations: StrategicRecommendation[]) {
  return recommendations.reduce<WeeklyStrategy["dashboard"]["categoryDistribution"]>(
    (counts, recommendation) => {
      counts[recommendation.category] = (counts[recommendation.category] ?? 0) + 1;
      return counts;
    },
    {}
  );
}
