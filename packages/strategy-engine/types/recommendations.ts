import type { IntelligenceSignal, SignalType } from "./signals";

export type RecommendationCategory =
  | "GROWTH_OPPORTUNITY"
  | "RISK_MITIGATION"
  | "PERFORMANCE_OPTIMIZATION"
  | "COMPETITIVE_RESPONSE"
  | "EXPERIMENT";

export type RecommendationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RecommendationLifecycleStatus =
  | "GENERATED"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "IMPLEMENTED"
  | "EXPIRED";

export interface ScoreFactors {
  impact: number;
  urgency: number;
  confidence: number;
  strategicAlignment: number;
  evidenceStrength: number;
}

export interface RecommendationScore {
  total: number;
  priority: RecommendationPriority;
  factors: ScoreFactors;
  weights: ScoreFactors;
}

export interface ExplanationMetadata {
  generatedBy: "RULE_ENGINE" | "LLM_AUGMENTED" | "HYBRID";
  version: string;
  matchedRuleIds: string[];
  evidenceSignalIds: string[];
  evidenceTypes: SignalType[];
  reasoningSummary: string;
  supportingFacts: string[];
  assumptions: string[];
  llmContext?: {
    eligible: boolean;
    promptVariables: Record<string, unknown>;
  };
}

export interface RecommendationCandidate {
  ruleId: string;
  category: RecommendationCategory;
  title: string;
  summary: string;
  rationale: string;
  actions: string[];
  signals: IntelligenceSignal[];
  factors: ScoreFactors;
  expectedOutcome?: string;
  dashboardData?: Record<string, unknown>;
}

export interface StrategicRecommendation {
  id: string;
  workspaceId: string;
  category: RecommendationCategory;
  title: string;
  summary: string;
  rationale: string;
  actions: string[];
  expectedOutcome?: string;
  score: RecommendationScore;
  explanation: ExplanationMetadata;
  evidence: IntelligenceSignal[];
  dashboardData: Record<string, unknown>;
  generatedAt: string;
}

export interface ActorMetadata {
  type: "USER" | "SYSTEM" | "AI_COPILOT" | "AGENT" | "INTEGRATION";
  id?: string;
  attributes?: Record<string, unknown>;
}

export interface RecommendationLifecycleTimestamps {
  generatedAt: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  implementedAt?: string;
  expiredAt?: string;
  expiresAt?: string;
}

export interface RecommendationImplementationProgress {
  percentage: number;
  notes?: string;
  updatedAt: string;
}

export interface OperationalRecommendation extends StrategicRecommendation {
  strategySnapshotId?: string;
  status: RecommendationLifecycleStatus;
  adaptiveConfidence: number;
  lifecycle: RecommendationLifecycleTimestamps;
  implementation: RecommendationImplementationProgress;
  updatedAt: string;
}

export interface RecommendationTransition {
  id?: string;
  workspaceId: string;
  recommendationId: string;
  fromStatus?: RecommendationLifecycleStatus;
  toStatus: RecommendationLifecycleStatus;
  actor: ActorMetadata;
  note?: string;
  progress?: number;
  occurredAt: string;
}
