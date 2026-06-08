import { randomUUID } from "node:crypto";

import { AnalyticsSeriesSchema, IntelligenceSignalSchema } from "../schemas";
import type { AnalyticsSeries, IntelligenceSignal } from "../dto";
import { average, percentChange, trend } from "../utils";

export interface TrendDetectorDependencies {
  id(): string;
}

export class TrendDetectionEngine {
  constructor(private readonly dependencies: TrendDetectorDependencies = { id: () => randomUUID() }) {}

  detect(input: AnalyticsSeries): IntelligenceSignal[] {
    const series = AnalyticsSeriesSchema.parse(input);
    const latest = series.points[series.points.length - 1];
    const history = series.points.slice(0, -1);
    const signals: IntelligenceSignal[] = [];
    const baselineEngagement = average(history.map((point) => point.engagementRate));
    const engagementChange = percentChange(latest.engagementRate, baselineEngagement);
    const reachChange = percentChange(latest.reach, average(history.map((point) => point.reach)));
    const performanceSlope = trend(series.points.map((point) => point.contentPerformance));
    const recentSlope = trend(series.points.slice(-3).map((point) => point.contentPerformance));

    if (reachChange >= 60 && engagementChange >= 25) {
      signals.push(this.signal(series, "VIRAL_SPIKE", reachChange, "Reach and engagement increased sharply.", { reachChange, engagementChange }));
    }
    if (Math.abs(engagementChange) >= 30) {
      signals.push(this.signal(series, "ENGAGEMENT_ANOMALY", engagementChange, "Engagement moved outside its recent baseline.", { engagementChange }));
    }
    const priorSegments = history[history.length - 1]?.audienceSegments ?? {};
    const shiftedSegment = Object.entries(latest.audienceSegments).find(([key, value]) =>
      Math.abs(percentChange(value, priorSegments[key] ?? 0)) >= 25);
    if (shiftedSegment) {
      signals.push(this.signal(series, "AUDIENCE_SHIFT", percentChange(shiftedSegment[1], priorSegments[shiftedSegment[0]] ?? 0),
        `Audience segment ${shiftedSegment[0]} shifted materially.`, { segment: shiftedSegment[0] }));
    }
    if (performanceSlope <= -4) {
      signals.push(this.signal(series, "DECLINING_PERFORMANCE", performanceSlope, "Content performance is declining.", { performanceSlope }));
    }
    if (recentSlope - performanceSlope >= 4 && recentSlope > 0) {
      signals.push(this.signal(series, "MOMENTUM_ACCELERATION", recentSlope, "Content momentum is accelerating.", { recentSlope }));
    }
    const performanceRange = Math.max(...series.points.map((point) => point.contentPerformance))
      - Math.min(...series.points.map((point) => point.contentPerformance));
    if (performanceRange <= 3 && Math.abs(engagementChange) < 10) {
      signals.push(this.signal(series, "STAGNATION", performanceRange, "Performance has remained flat across the observation window.", { performanceRange }));
    }
    return signals;
  }

  private signal(series: AnalyticsSeries, kind: IntelligenceSignal["kind"], magnitude: number, summary: string, evidence: Record<string, unknown>) {
    const severity = Math.abs(magnitude) >= 60 ? "CRITICAL" : Math.abs(magnitude) >= 30 ? "HIGH" : "MEDIUM";
    return IntelligenceSignalSchema.parse({
      id: this.dependencies.id(), workspaceId: series.workspaceId, kind, severity,
      confidence: Math.min(0.98, 0.65 + series.points.length * 0.04), magnitude, summary,
      detectedAt: series.observedAt, evidence,
    });
  }
}
