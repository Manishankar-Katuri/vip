import type { RecommendationFilter, RecommendationQuery } from "./contracts";

export interface RecommendationRecord {
  id: string;
  workspaceId: string;
  type: string;
  category: string | null;
  title: string;
  summary: string;
  rationale: string;
  priority: number;
  confidence: number;
  score: number;
  actions: unknown;
  expectedOutcome: string | null;
  explanation: unknown;
  evidence: unknown;
  status: string;
  generatedAt: Date;
  updatedAt: Date;
}

export interface PagedRecords {
  rows: RecommendationRecord[];
  total: number;
}

export interface AiRecommendationQueryRepository {
  list(query: RecommendationQuery): Promise<PagedRecords>;
  summarize(filters: RecommendationFilter): Promise<RecommendationRecord[]>;
}

export class TransientAiRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientAiRepositoryError";
  }
}
