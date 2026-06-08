import { z } from "zod";

export type WorkspaceId = string;
export type CognitiveEntityType =
  | "HOSPITAL"
  | "DOCTOR"
  | "SPECIALTY"
  | "COMPETITOR"
  | "REVIEW"
  | "CAMPAIGN"
  | "CONTENT"
  | "RECOMMENDATION"
  | "WORKFLOW"
  | "KPI"
  | "LOCATION"
  | "STRATEGY"
  | "SIGNAL";

export type CognitiveRelationshipType =
  | "IMPACTS"
  | "INFLUENCES"
  | "THREATENS"
  | "CORRELATES_WITH"
  | "DEPENDS_ON"
  | "IMPROVES"
  | "REDUCES";

export type SignalType =
  | "REPUTATION_RISK"
  | "COMPETITOR_MOMENTUM"
  | "LOCAL_VISIBILITY_DECLINE"
  | "SPECIALTY_GROWTH_OPPORTUNITY"
  | "DOCTOR_REPUTATION_SHIFT"
  | "CONTENT_VELOCITY_DROP"
  | "WORKFLOW_FRICTION"
  | "APPOINTMENT_DEMAND_SHIFT"
  | "KPI_ANOMALY";

export type SignalDirection = "INCREASED" | "DECREASED" | "STABLE" | "EMERGING";
export type PriorityKind = "RISK" | "OPPORTUNITY" | "EXECUTION" | "MONITORING";
export type IntelligenceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ScoreVector {
  impact: number;
  urgency: number;
  confidence: number;
  strategicImportance: number;
  executionComplexity?: number;
}

export interface TemporalWindow {
  startsAt: string;
  endsAt: string;
  granularity: "EVENT" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "QUARTER";
}

export interface EntityRef {
  id: string;
  type: CognitiveEntityType;
  label?: string;
  workspaceId?: WorkspaceId;
}

export interface EvidenceRef {
  id: string;
  type: "EVENT" | "SIGNAL" | "GRAPH_RELATIONSHIP" | "KPI" | "CAUSAL_CHAIN" | "OUTCOME" | "MEMORY";
  source: string;
  observedAt: string;
  summary: string;
  weight: number;
  uri?: string;
  data?: Record<string, unknown>;
}

export interface IntelligenceSignal {
  id: string;
  workspaceId: WorkspaceId;
  type: SignalType;
  direction: SignalDirection;
  severity: IntelligenceSeverity;
  summary: string;
  sourceEventIds: string[];
  relatedEntities: EntityRef[];
  temporalWindow: TemporalWindow;
  scores: ScoreVector;
  evidence: EvidenceRef[];
  propagation: {
    depth: number;
    parentSignalIds: string[];
    childSignalIds: string[];
  };
  graphLinks: EntityRef[];
  correlationKey: string;
  idempotencyKey: string;
  detectedAt: string;
  metadata: Record<string, unknown>;
}

export interface GraphEntity extends EntityRef {
  workspaceId: WorkspaceId;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphRelationship {
  id: string;
  workspaceId: WorkspaceId;
  from: EntityRef;
  to: EntityRef;
  type: CognitiveRelationshipType;
  strength: number;
  confidence: number;
  evidence: EvidenceRef[];
  startsAt?: string;
  endsAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CausalLink {
  cause: EntityRef;
  effect: EntityRef;
  relationshipType?: CognitiveRelationshipType;
  lagMs?: number;
  confidence: number;
  evidence: EvidenceRef[];
}

export interface CausalChain {
  id: string;
  workspaceId: WorkspaceId;
  rootCause: EntityRef;
  outcome: EntityRef;
  links: CausalLink[];
  summary: string;
  confidence: number;
  temporalWindow: TemporalWindow;
  generatedAt: string;
}

export interface PriorityObject {
  id: string;
  workspaceId: WorkspaceId;
  kind: PriorityKind;
  title: string;
  reason: string;
  urgency: number;
  confidence: number;
  expectedImpact: number;
  executionComplexity: number;
  strategicImportance: number;
  relatedEntities: EntityRef[];
  supportingSignals: IntelligenceSignal[];
  causalFindings: CausalChain[];
  evidence: EvidenceRef[];
  recommendedActions: string[];
  createdAt: string;
}

export interface RecommendationEvidence {
  supportingSignals: IntelligenceSignal[];
  graphEvidence: GraphRelationship[];
  causalEvidence: CausalChain[];
  historicalComparisons: EvidenceRef[];
  expectedOutcome: string;
  confidence: number;
}

export interface ExplainableRecommendation {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  rationale: string;
  evidence: RecommendationEvidence;
  executionSteps: Array<{ order: number; action: string; owner?: string; expectedDurationDays?: number }>;
  relatedPriorityIds: string[];
  downstreamRisks: PriorityObject[];
  downstreamOpportunities: PriorityObject[];
  outcomeMemory: OutcomeTrackingContract;
  createdAt: string;
}

export interface IntelligenceTrace {
  traceId: string;
  workspaceId: WorkspaceId;
  rootEventId: string;
  signalIds: string[];
  priorityIds: string[];
  recommendationIds: string[];
  causalChainIds: string[];
  startedAt: string;
  updatedAt: string;
}

export interface ReasoningAuditLog {
  id: string;
  workspaceId: WorkspaceId;
  traceId: string;
  stage: "EVENT" | "SIGNAL" | "GRAPH" | "PRIORITY" | "RECOMMENDATION" | "CAUSAL" | "OUTCOME";
  inputRefs: EvidenceRef[];
  outputRefs: EvidenceRef[];
  decision: string;
  confidence: number;
  createdAt: string;
}

export interface OutcomeTrackingContract {
  recommendationId: string;
  workspaceId: WorkspaceId;
  targetKpis: EntityRef[];
  baseline: EvidenceRef[];
  expectedOutcome: string;
  measurementWindow: TemporalWindow;
  effectivenessHooks: string[];
  confidenceEvolution: Array<{ at: string; confidence: number; reason: string }>;
}

const text = z.string().trim().min(1);
export const ScoreVectorSchema = z.object({
  impact: z.number().finite().min(0).max(100),
  urgency: z.number().finite().min(0).max(100),
  confidence: z.number().finite().min(0).max(1),
  strategicImportance: z.number().finite().min(0).max(100),
  executionComplexity: z.number().finite().min(0).max(100).optional(),
}).strict();
export const EntityRefSchema = z.object({
  id: text,
  type: z.enum(["HOSPITAL", "DOCTOR", "SPECIALTY", "COMPETITOR", "REVIEW", "CAMPAIGN", "CONTENT", "RECOMMENDATION", "WORKFLOW", "KPI", "LOCATION", "STRATEGY", "SIGNAL"]),
  label: text.optional(),
  workspaceId: text.optional(),
}).strict();
export const TemporalWindowSchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  granularity: z.enum(["EVENT", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER"]),
}).strict();
export const EvidenceRefSchema = z.object({
  id: text,
  type: z.enum(["EVENT", "SIGNAL", "GRAPH_RELATIONSHIP", "KPI", "CAUSAL_CHAIN", "OUTCOME", "MEMORY"]),
  source: text,
  observedAt: z.string().datetime({ offset: true }),
  summary: text,
  weight: z.number().finite().min(0).max(1),
  uri: text.optional(),
  data: z.record(z.unknown()).optional(),
}).strict();
export const IntelligenceSignalSchema = z.object({
  id: text,
  workspaceId: text,
  type: z.enum(["REPUTATION_RISK", "COMPETITOR_MOMENTUM", "LOCAL_VISIBILITY_DECLINE", "SPECIALTY_GROWTH_OPPORTUNITY", "DOCTOR_REPUTATION_SHIFT", "CONTENT_VELOCITY_DROP", "WORKFLOW_FRICTION", "APPOINTMENT_DEMAND_SHIFT", "KPI_ANOMALY"]),
  direction: z.enum(["INCREASED", "DECREASED", "STABLE", "EMERGING"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  summary: text,
  sourceEventIds: z.array(text),
  relatedEntities: z.array(EntityRefSchema),
  temporalWindow: TemporalWindowSchema,
  scores: ScoreVectorSchema,
  evidence: z.array(EvidenceRefSchema),
  propagation: z.object({ depth: z.number().int().min(0), parentSignalIds: z.array(text), childSignalIds: z.array(text) }).strict(),
  graphLinks: z.array(EntityRefSchema),
  correlationKey: text,
  idempotencyKey: text,
  detectedAt: z.string().datetime({ offset: true }),
  metadata: z.record(z.unknown()),
}).strict();

export interface CognitiveIntelligenceEvent<TType extends CognitiveIntelligenceEventType, TPayload> {
  eventId: string;
  eventType: TType;
  eventVersion: 1;
  aggregateType: "INTELLIGENCE";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: TPayload;
}

export type CognitiveIntelligenceEventType =
  | "intelligence.signal.raised"
  | "intelligence.signal.correlated"
  | "intelligence.priority.created"
  | "intelligence.recommendation.reasoned"
  | "intelligence.causal_chain.detected"
  | "intelligence.trace.recorded";

export type IntelligenceSignalRaisedEvent = CognitiveIntelligenceEvent<"intelligence.signal.raised", { signal: IntelligenceSignal; traceId: string }>;
export type IntelligenceSignalCorrelatedEvent = CognitiveIntelligenceEvent<"intelligence.signal.correlated", { signalIds: string[]; correlationKey: string; traceId: string }>;
export type IntelligencePriorityCreatedEvent = CognitiveIntelligenceEvent<"intelligence.priority.created", { priority: PriorityObject; traceId: string }>;
export type IntelligenceRecommendationReasonedEvent = CognitiveIntelligenceEvent<"intelligence.recommendation.reasoned", { recommendation: ExplainableRecommendation; traceId: string }>;
export type IntelligenceCausalChainDetectedEvent = CognitiveIntelligenceEvent<"intelligence.causal_chain.detected", { causalChain: CausalChain; traceId: string }>;
export type IntelligenceTraceRecordedEvent = CognitiveIntelligenceEvent<"intelligence.trace.recorded", { trace: IntelligenceTrace }>;

export type CognitiveIntelligenceLifecycleEvent =
  | IntelligenceSignalRaisedEvent
  | IntelligenceSignalCorrelatedEvent
  | IntelligencePriorityCreatedEvent
  | IntelligenceRecommendationReasonedEvent
  | IntelligenceCausalChainDetectedEvent
  | IntelligenceTraceRecordedEvent;
