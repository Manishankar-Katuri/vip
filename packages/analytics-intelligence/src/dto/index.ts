import { z } from "zod";

import {
  AnalyticsIntelligenceEventSchema, AnalyticsPointSchema, AnalyticsSeriesSchema, CompetitorComparisonSchema,
  CompetitorDatasetSchema, InsightSchema, IntelligenceScoresSchema, IntelligenceSignalSchema, PredictionSchema,
} from "../schemas";

export type AnalyticsPoint = z.infer<typeof AnalyticsPointSchema>;
export type AnalyticsSeries = z.infer<typeof AnalyticsSeriesSchema>;
export type IntelligenceSignal = z.infer<typeof IntelligenceSignalSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
export type CompetitorDataset = z.infer<typeof CompetitorDatasetSchema>;
export type CompetitorComparison = z.infer<typeof CompetitorComparisonSchema>;
export type IntelligenceScores = z.infer<typeof IntelligenceScoresSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type AnalyticsIntelligenceEvent = z.infer<typeof AnalyticsIntelligenceEventSchema>;
