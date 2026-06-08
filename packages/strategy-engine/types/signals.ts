export type SignalType =
  | "MARKET_TREND"
  | "CUSTOMER_FEEDBACK"
  | "PERFORMANCE_METRIC"
  | "COMPETITOR_ACTIVITY"
  | "OPERATIONAL_RISK"
  | "BUSINESS_OPPORTUNITY"
  | "WORKSPACE_CONTEXT";

export type SignalDirection = "EMERGING" | "RISING" | "STABLE" | "DECLINING";
export type SignalSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface SignalSource {
  provider: string;
  kind: "INTERNAL" | "EXTERNAL" | "DERIVED" | "MANUAL";
  collectedAt: string;
  reference?: string;
}

export interface IntelligenceSignal<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  workspaceId: string;
  type: SignalType;
  title: string;
  description: string;
  direction: SignalDirection;
  sentiment?: SignalSentiment;
  impact: number;
  urgency?: number;
  strategicAlignment?: number;
  confidence: number;
  observedAt: string;
  expiresAt?: string;
  tags?: string[];
  source: SignalSource;
  metadata?: TMetadata;
}

export interface NormalizedSignal extends IntelligenceSignal {
  relevanceScore: number;
  recencyScore: number;
}

export interface SignalGroupSummary {
  type: SignalType;
  count: number;
  averageRelevance: number;
  highestSignalId: string;
}

export interface AggregatedSignalSet {
  workspaceId: string;
  generatedAt: string;
  signals: NormalizedSignal[];
  groups: SignalGroupSummary[];
  sourceProviders: string[];
  discardedSignalIds: string[];
}
