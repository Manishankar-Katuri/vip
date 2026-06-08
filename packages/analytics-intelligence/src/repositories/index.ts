import type {
  AnalyticsIntelligenceEvent, AnalyticsSeries, CompetitorDataset, Insight, IntelligenceScores, Prediction,
} from "../dto";

export interface AnalyticsSnapshotRepository {
  saveSnapshot(snapshot: AnalyticsSeries, scores: IntelligenceScores): Promise<void>;
}

export interface PredictionRepository {
  savePredictions(predictions: Prediction[]): Promise<void>;
  listPredictions(workspaceId: string, limit: number): Promise<Prediction[]>;
}

export interface InsightRepository {
  saveInsights(insights: Insight[], events: AnalyticsIntelligenceEvent[]): Promise<void>;
}

export interface CompetitorDatasetRepository {
  saveCompetitorDataset(dataset: CompetitorDataset): Promise<void>;
  listCompetitorDatasets(workspaceId: string): Promise<CompetitorDataset[]>;
}

export interface AnalyticsIntelligenceRepository extends
  AnalyticsSnapshotRepository, PredictionRepository, InsightRepository, CompetitorDatasetRepository {}
