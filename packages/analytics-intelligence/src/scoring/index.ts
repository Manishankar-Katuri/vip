import type { AnalyticsSeries, IntelligenceScores, IntelligenceSignal, Prediction } from "../dto";
import { AnalyticsSeriesSchema, IntelligenceScoresSchema } from "../schemas";
import { clampScore, percentChange, trend } from "../utils";

export class IntelligenceScoringService {
  score(input: AnalyticsSeries, signals: IntelligenceSignal[], predictions: Prediction[]): IntelligenceScores {
    const series = AnalyticsSeriesSchema.parse(input);
    const latest = series.points[series.points.length - 1];
    const first = series.points[0];
    const growth = clampScore(50 + percentChange(latest.followers, first.followers));
    const contentHealth = clampScore(latest.contentPerformance);
    const momentum = clampScore(50 + trend(series.points.map((point) => point.engagementRate)) * 10);
    const opportunities = signals.filter((signal) => ["VIRAL_SPIKE", "MOMENTUM_ACCELERATION"].includes(signal.kind)).length;
    const positivePredictions = predictions.filter((prediction) => prediction.changePercent > 0).length;
    const risks = signals.filter((signal) => ["DECLINING_PERFORMANCE", "ENGAGEMENT_ANOMALY", "STAGNATION"].includes(signal.kind)).length;
    return IntelligenceScoresSchema.parse({
      growth,
      contentHealth,
      opportunity: clampScore(30 + opportunities * 25 + positivePredictions * 5),
      audienceMomentum: momentum,
      risk: clampScore(risks * 25 + (contentHealth < 40 ? 25 : 0)),
    });
  }
}
