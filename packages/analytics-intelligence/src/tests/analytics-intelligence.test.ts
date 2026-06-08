import assert from "node:assert/strict";
import test from "node:test";

import { TrendDetectionEngine } from "../analyzers";
import { CompetitorIntelligenceEngine } from "../competitors";
import type { AnalyticsIntelligenceEvent, AnalyticsSeries, CompetitorDataset, Insight, IntelligenceScores, Prediction } from "../dto";
import { AIInsightGenerator } from "../intelligence";
import { PredictiveAnalyticsEngine } from "../predictors";
import type { AnalyticsIntelligenceRepository } from "../repositories";
import { IntelligenceScoringService } from "../scoring";
import { AnalyticsIntelligenceEventSchema } from "../schemas";
import { AnalyticsIntelligenceService } from "../services";

test("detects viral spikes, anomalies, audience shifts, and acceleration", () => {
  const signals = new TrendDetectionEngine({ id: sequence("signal") }).detect(viralSeries());
  assert.ok(signals.some((signal) => signal.kind === "VIRAL_SPIKE"));
  assert.ok(signals.some((signal) => signal.kind === "ENGAGEMENT_ANOMALY"));
  assert.ok(signals.some((signal) => signal.kind === "AUDIENCE_SHIFT"));
  assert.ok(signals.some((signal) => signal.kind === "MOMENTUM_ACCELERATION"));
});

test("predicts engagement, followers, campaign performance, decay, and opportunity windows", () => {
  const predictions = new PredictiveAnalyticsEngine(sequence("prediction")).predict(viralSeries(), 7);
  assert.equal(predictions.length, 5);
  assert.ok(predictions.find((prediction) => prediction.metric === "FOLLOWER_GROWTH")!.predictedValue > 1300);
  assert.ok(predictions.some((prediction) => prediction.metric === "OPPORTUNITY_WINDOW"));
});

test("compares competitor frequency, engagement, adoption, and content categories", () => {
  const comparison = new CompetitorIntelligenceEngine().compare(viralSeries(), competitor(), ["reels"]);
  assert.equal(comparison.competitorId, "competitor-1");
  assert.ok(comparison.trendAdoptionGap.includes("short-video"));
  assert.ok(comparison.leadingCategories.includes("education"));
});

test("scores intelligence and creates event-backed insight reports", async () => {
  const repository = new RecordingRepository();
  const dependencies = [
    new TrendDetectionEngine({ id: sequence("signal") }),
    new PredictiveAnalyticsEngine(sequence("prediction")),
    new IntelligenceScoringService(),
    new AIInsightGenerator(sequence("insight")),
  ] as const;
  const result = await new AnalyticsIntelligenceService(repository, ...dependencies).analyze(viralSeries());
  assert.ok(result.scores.growth > 50);
  assert.ok(result.scores.opportunity >= 50);
  assert.ok(result.insights.some((insight) => insight.type === "OPPORTUNITY_REPORT"));
  assert.ok(result.events.some((event) => event.eventType === "analytics.trend.detected"));
  assert.ok(result.events.some((event) => event.eventType === "analytics.prediction.generated"));
  result.events.forEach((event) => assert.equal(AnalyticsIntelligenceEventSchema.safeParse(event).success, true));
  assert.equal(repository.predictions.length, 5);
});

class RecordingRepository implements AnalyticsIntelligenceRepository {
  readonly predictions: Prediction[] = [];
  readonly insights: Insight[] = [];
  readonly events: AnalyticsIntelligenceEvent[] = [];

  async saveSnapshot(_snapshot: AnalyticsSeries, _scores: IntelligenceScores) {}
  async savePredictions(predictions: Prediction[]) { this.predictions.push(...predictions); }
  async listPredictions() { return this.predictions; }
  async saveInsights(insights: Insight[], events: AnalyticsIntelligenceEvent[]) {
    this.insights.push(...insights);
    this.events.push(...events);
  }
  async saveCompetitorDataset(_dataset: CompetitorDataset) {}
  async listCompetitorDatasets() { return []; }
}

function viralSeries(): AnalyticsSeries {
  return {
    workspaceId: "workspace_social",
    source: "engagement-snapshots",
    observedAt: "2026-05-26T00:00:00.000Z",
    points: [
      point("2026-05-22T00:00:00.000Z", 2, 1000, 1000, 30, { adults: 60 }, { education: 40 }),
      point("2026-05-23T00:00:00.000Z", 2.1, 1050, 1030, 31, { adults: 61 }, { education: 42 }),
      point("2026-05-24T00:00:00.000Z", 2.2, 1080, 1070, 33, { adults: 62 }, { education: 44 }),
      point("2026-05-25T00:00:00.000Z", 3, 1300, 1140, 46, { adults: 65 }, { education: 49 }),
      point("2026-05-26T00:00:00.000Z", 5.5, 2600, 1320, 76, { adults: 90 }, { education: 55 }),
    ],
  };
}

function competitor(): CompetitorDataset {
  return {
    workspaceId: "workspace_social",
    competitorId: "competitor-1",
    label: "Peer",
    capturedAt: "2026-05-26T00:00:00.000Z",
    adoptedTrends: ["reels", "short-video"],
    points: [point("2026-05-26T00:00:00.000Z", 6, 3000, 2000, 85, { adults: 100 }, { education: 80 })],
  };
}

function point(
  capturedAt: string, engagementRate: number, reach: number, followers: number, contentPerformance: number,
  audienceSegments: Record<string, number>, categories: Record<string, number>
) {
  return { capturedAt, engagementRate, reach, followers, postsPublished: 5, contentPerformance, audienceSegments, categories };
}

function sequence(prefix: string) {
  let value = 0;
  return () => `${prefix}-${++value}`;
}
