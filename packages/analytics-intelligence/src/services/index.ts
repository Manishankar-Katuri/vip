import { TrendDetectionEngine } from "../analyzers";
import type { AnalyticsIntelligenceEvent, AnalyticsSeries, Insight, IntelligenceScores, Prediction } from "../dto";
import { AnalyticsEventFactory } from "../events";
import { AIInsightGenerator } from "../intelligence";
import { PredictiveAnalyticsEngine } from "../predictors";
import type { AnalyticsIntelligenceRepository } from "../repositories";
import { IntelligenceScoringService } from "../scoring";

export interface IntelligenceRunResult {
  signals: ReturnType<TrendDetectionEngine["detect"]>;
  predictions: Prediction[];
  scores: IntelligenceScores;
  insights: Insight[];
  events: AnalyticsIntelligenceEvent[];
}

export class AnalyticsIntelligenceService {
  constructor(
    private readonly repository: AnalyticsIntelligenceRepository,
    private readonly trends = new TrendDetectionEngine(),
    private readonly predictor = new PredictiveAnalyticsEngine(),
    private readonly scoring = new IntelligenceScoringService(),
    private readonly insights = new AIInsightGenerator(),
    private readonly events = new AnalyticsEventFactory()
  ) {}

  async analyze(series: AnalyticsSeries): Promise<IntelligenceRunResult> {
    const signals = this.trends.detect(series);
    const predictions = this.predictor.predict(series);
    const scores = this.scoring.score(series, signals, predictions);
    const insights = this.insights.generate(series.workspaceId, signals, predictions, scores, series.observedAt);
    const events = [
      ...signals.map((signal) => this.events.signal(signal)),
      ...predictions.map((prediction) => this.events.prediction(prediction)),
      ...insights.filter((insight) => insight.type === "RISK_ALERT").map((insight) => this.events.risk(insight)),
    ];
    await this.repository.saveSnapshot(series, scores);
    await this.repository.savePredictions(predictions);
    await this.repository.saveInsights(insights, events);
    return { signals, predictions, scores, insights, events };
  }
}
