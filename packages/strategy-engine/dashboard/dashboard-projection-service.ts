import type { StrategyRepository } from "../interfaces";
import type { OperationalRecommendation, StrategyDashboardProjection } from "../types";

export class DashboardProjectionService {
  constructor(private readonly repository: StrategyRepository) {}

  async project(workspaceId: string, asOf = new Date()): Promise<StrategyDashboardProjection> {
    const [recommendations, snapshot] = await Promise.all([
      this.repository.listRecommendations({
        workspaceId,
        statuses: ["GENERATED", "VIEWED", "ACCEPTED", "IMPLEMENTED"],
      }),
      this.repository.latestSnapshot(workspaceId),
    ]);
    const active = recommendations.filter((item) => item.status !== "IMPLEMENTED");

    return {
      workspaceId,
      generatedAt: asOf.toISOString(),
      priorityRecommendations: active.slice(0, 5),
      growthOpportunities: active.filter((item) => item.category === "GROWTH_OPPORTUNITY"),
      riskAlerts: active.filter((item) => item.category === "RISK_MITIGATION"),
      trendSummaries: snapshot?.signalCoverage ?? [],
      weeklyStrategySummary: snapshot
        ? {
            snapshotId: snapshot.id,
            period: snapshot.period,
            executiveSummary: snapshot.executiveSummary,
          }
        : undefined,
      confidenceIndicators: recommendations.map(confidenceIndicator),
    };
  }
}

function confidenceIndicator(recommendation: OperationalRecommendation) {
  const originalConfidence = recommendation.score.factors.confidence / 100;
  const change = recommendation.adaptiveConfidence - originalConfidence;
  return {
    recommendationId: recommendation.id,
    title: recommendation.title,
    originalConfidence,
    adaptiveConfidence: recommendation.adaptiveConfidence,
    direction: change > 0 ? "UP" as const : change < 0 ? "DOWN" as const : "UNCHANGED" as const,
  };
}
