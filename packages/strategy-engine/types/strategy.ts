import type { IntelligenceSignal, SignalType } from "./signals";
import type { StrategicRecommendation } from "./recommendations";

export interface WorkspaceStrategyContext {
  workspaceId: string;
  workspaceName?: string;
  industry?: string;
  objectives?: string[];
  constraints?: string[];
  attributes?: Record<string, unknown>;
}

export interface StrategyGenerationInput {
  context: WorkspaceStrategyContext;
  signals: IntelligenceSignal[];
  asOf?: Date;
  maxRecommendations?: number;
}

export interface WeeklyStrategy {
  id: string;
  workspaceId: string;
  generatedAt: string;
  period: {
    startsAt: string;
    endsAt: string;
  };
  executiveSummary: string;
  signalCoverage: Array<{ type: SignalType; count: number; averageRelevance: number }>;
  recommendations: StrategicRecommendation[];
  watchlist: IntelligenceSignal[];
  dashboard: {
    recommendationCount: number;
    topPriority: StrategicRecommendation["score"]["priority"] | null;
    categoryDistribution: Partial<Record<StrategicRecommendation["category"], number>>;
    signalCount: number;
  };
}
