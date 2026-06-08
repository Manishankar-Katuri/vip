import { randomUUID } from "node:crypto";

import type { AnalyticsSeries, Prediction } from "../dto";
import { AnalyticsSeriesSchema, PredictionSchema } from "../schemas";
import { percentChange, trend } from "../utils";

export class PredictiveAnalyticsEngine {
  constructor(private readonly id: () => string = () => randomUUID()) {}

  predict(input: AnalyticsSeries, horizonDays = 7): Prediction[] {
    const series = AnalyticsSeriesSchema.parse(input);
    const latest = series.points[series.points.length - 1];
    const confidence = Math.min(0.95, 0.55 + series.points.length * 0.05);
    const create = (
      metric: Prediction["metric"], currentValue: number, slope: number, rationale: string
    ) => PredictionSchema.parse({
      id: this.id(), workspaceId: series.workspaceId, metric, horizonDays, currentValue,
      predictedValue: Math.max(0, currentValue + slope * horizonDays),
      changePercent: percentChange(Math.max(0, currentValue + slope * horizonDays), currentValue),
      confidence, generatedAt: series.observedAt, rationale,
    });
    const engagementSlope = trend(series.points.map((point) => point.engagementRate));
    const followerSlope = trend(series.points.map((point) => point.followers));
    const contentSlope = trend(series.points.map((point) => point.contentPerformance));
    return [
      create("ENGAGEMENT_TRAJECTORY", latest.engagementRate, engagementSlope, "Projected from recent engagement slope."),
      create("FOLLOWER_GROWTH", latest.followers, followerSlope, "Projected from observed follower growth."),
      create("CAMPAIGN_PERFORMANCE", latest.contentPerformance, contentSlope, "Projected from content performance momentum."),
      create("CONTENT_DECAY", latest.contentPerformance, Math.min(0, contentSlope), "Measures likely content performance decay."),
      create("OPPORTUNITY_WINDOW", latest.engagementRate, Math.max(0, engagementSlope), "Positive momentum indicates an activation window."),
    ];
  }
}
