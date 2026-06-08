import type { AnalyticsIntelligenceEvent } from "@vip/analytics-intelligence";
import type { AutomationLifecycleEvent } from "@vip/automation-engine";
import type { CognitiveIntelligenceLifecycleEvent } from "@vip/cognitive-core";
import type { RecommendationLifecycleEvent } from "@vip/recommendation-engine";

export type EventTopic = "analytics" | "recommendations" | "automation" | "dashboard" | "intelligence";
export type IntelligenceEventTopic =
  | EventTopic
  | "agents"
  | "outcomes"
  | "learning"
  | "workflows"
  | "competitors"
  | "reviews";
export type EventDeliveryState = "PENDING" | "DISPATCHING" | "DELIVERED" | "DEAD_LETTERED";
export type EventPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface DashboardAlertEvent {
  eventId: string;
  eventType: "dashboard.alert.raised";
  eventVersion: 1;
  aggregateType: "DASHBOARD_ALERT";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    title: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    sourceEventId: string;
  };
}

export interface WorkflowEvent {
  eventId: string;
  eventType: "workflow.started" | "workflow.completed" | "workflow.failed";
  eventVersion: 1;
  aggregateType: "WORKFLOW";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    workflowId: string;
    workflowType: string;
    status: "STARTED" | "COMPLETED" | "FAILED";
    owner?: string;
    sourceEventId?: string;
    summary: string;
    data: Record<string, unknown>;
  };
}

export interface CompetitorIntelligenceEvent {
  eventId: string;
  eventType: "competitor.signal.detected" | "competitor.benchmark.updated";
  eventVersion: 1;
  aggregateType: "COMPETITOR";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    competitorId: string;
    platform?: string;
    signal: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number;
    summary: string;
    evidence: Record<string, unknown>;
  };
}

export interface ReviewIntelligenceEvent {
  eventId: string;
  eventType: "review.received" | "review.sentiment.changed" | "review.risk.detected";
  eventVersion: 1;
  aggregateType: "REVIEW";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    reviewId: string;
    source: string;
    rating?: number;
    sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";
    riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    summary: string;
    evidence: Record<string, unknown>;
  };
}

export interface AgentRuntimeTransportEvent {
  eventId: string;
  eventType:
    | "agent.observation.recorded"
    | "agent.plan.created"
    | "agent.action.executed"
    | "agent.report.generated"
    | "agent.outcome.recorded";
  eventVersion: 1;
  aggregateType: "AGENT";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    kind: "OBSERVATION" | "PLAN" | "EXECUTION_ACTION" | "REPORT" | "OUTCOME";
    agentId: string;
    traceId: string;
    observation?: Record<string, unknown>;
    plan?: Record<string, unknown>;
    action?: Record<string, unknown>;
    report?: Record<string, unknown>;
    outcome?: Record<string, unknown>;
  };
}

export interface OutcomeMemoryTransportEvent {
  eventId: string;
  eventType: "outcome.recorded" | "outcome.episode.recorded" | "outcome.correlation.updated";
  eventVersion: 1;
  aggregateType: "OUTCOME";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    traceId: string;
    outcome?: Record<string, unknown>;
    episode?: Record<string, unknown>;
    correlation?: Record<string, unknown>;
  };
}

export interface LearningTransportEvent {
  eventId: string;
  eventType:
    | "learning.recommendation.analyzed"
    | "learning.strategy.scored"
    | "learning.confidence.updated"
    | "learning.pattern.discovered"
    | "learning.executive_briefing.generated";
  eventVersion: 1;
  aggregateType: "LEARNING";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    traceId: string;
    summary: Record<string, unknown>;
  };
}

export interface OperationsTransportEvent {
  eventId: string;
  eventType:
    | "operations.mission.created"
    | "operations.mission.progressed"
    | "operations.agent.message.sent"
    | "operations.consensus.reached"
    | "operations.workflow.synthesized"
    | "operations.forecast.generated"
    | "operations.benchmark.generated"
    | "operations.control_plane.snapshot";
  eventVersion: 1;
  aggregateType: "OPERATIONS";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    traceId: string;
    kind: string;
    data: Record<string, unknown>;
  };
}

export type DailyGrowthMissionEventType =
  | "operations.mission.daily_growth.started"
  | "analytics.acquisition.completed"
  | "performance.analysis.completed"
  | "strategy.learning.generated"
  | "opportunity.discovery.completed"
  | "strategy.plan.generated"
  | "content.production.generated"
  | "report.generated"
  | "approval.completed"
  | "production.tasks.created"
  | "publishing.prepared"
  | "content.outcome.generated"
  | "learning.memory.updated";

export interface DailyGrowthMissionTransportEvent {
  eventId: string;
  eventType: DailyGrowthMissionEventType;
  eventVersion: 1;
  aggregateType: "DAILY_GROWTH_MISSION";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    traceId: string;
    missionExecutionId: string;
    phase: string;
    summary: string;
    data: Record<string, unknown>;
  };
}

export type OrchestratedEvent =
  | AnalyticsIntelligenceEvent
  | CognitiveIntelligenceLifecycleEvent
  | RecommendationLifecycleEvent
  | AutomationLifecycleEvent
  | AgentRuntimeTransportEvent
  | OutcomeMemoryTransportEvent
  | LearningTransportEvent
  | OperationsTransportEvent
  | DailyGrowthMissionTransportEvent
  | DashboardAlertEvent
  | WorkflowEvent
  | CompetitorIntelligenceEvent
  | ReviewIntelligenceEvent;
export type OrchestratedEventType = OrchestratedEvent["eventType"];

export interface EventMetadata {
  correlationId: string;
  requestId?: string;
  executionId?: string;
  traceparent?: string;
  causationId?: string;
  producer: string;
  actor?: {
    type: "USER" | "SYSTEM" | "AI_COPILOT" | "AGENT" | "INTEGRATION";
    id?: string;
  };
  source?: {
    module: "recommendations" | "workflows" | "analytics" | "competitors" | "reviews" | "automation" | "dashboard" | "intelligence" | "agents" | "outcomes" | "learning";
    component?: string;
  };
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
}

export interface DurableEventEnvelope<TEvent extends OrchestratedEvent = OrchestratedEvent> {
  envelopeId: string;
  topic: IntelligenceEventTopic;
  event: TEvent;
  metadata: EventMetadata;
  priority: EventPriority;
  publishedAt: string;
  sequence: number;
  state: EventDeliveryState;
}

export interface EventDelivery {
  envelopeId: string;
  subscriberId: string;
  deliveryKey: string;
  attempt: number;
  status: "SUCCEEDED" | "FAILED" | "DEAD_LETTERED";
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  error?: string;
}

export interface DeadLetterRecord {
  envelope: DurableEventEnvelope;
  subscriberId: string;
  attempts: number;
  failure: string;
  deadLetteredAt: string;
}

export interface ReplayQuery {
  aggregateId?: string;
  eventType?: OrchestratedEventType;
  from?: string;
  to?: string;
  workspaceId?: string;
}

export interface ReplayResult {
  replayId: string;
  matched: number;
  dispatched: number;
}
