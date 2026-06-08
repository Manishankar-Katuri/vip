import type { ZodType } from "zod";

import type { IntelligenceEventTopic, OrchestratedEvent, OrchestratedEventType } from "../dto";
import {
  AgentRuntimeTransportEventSchema,
  CompetitorIntelligenceEventSchema,
  CognitiveIntelligenceTransportEventSchema,
  DailyGrowthMissionTransportEventSchema,
  LearningTransportEventSchema,
  OperationsTransportEventSchema,
  OutcomeMemoryTransportEventSchema,
  AnalyticsTransportEventSchema, AutomationTransportEventSchema, DashboardAlertEventSchema,
  RecommendationTransportEventSchema, ReviewIntelligenceEventSchema, WorkflowEventSchema,
} from "../schemas";

export interface EventDefinition {
  eventType: OrchestratedEventType;
  version: 1;
  topic: IntelligenceEventTopic;
  schema: ZodType<unknown>;
}

export class EventRegistry {
  private readonly definitions = new Map<string, EventDefinition>();

  register(definition: EventDefinition) {
    const key = this.key(definition.eventType, definition.version);
    if (this.definitions.has(key)) throw new Error(`Event schema is already registered: ${key}.`);
    this.definitions.set(key, definition);
    return this;
  }

  validate(event: OrchestratedEvent): OrchestratedEvent {
    const definition = this.definitions.get(this.key(event.eventType, event.eventVersion));
    if (!definition) throw new Error(`Unregistered event contract: ${event.eventType}@${event.eventVersion}.`);
    return definition.schema.parse(event) as OrchestratedEvent;
  }

  topicFor(event: OrchestratedEvent) {
    const definition = this.definitions.get(this.key(event.eventType, event.eventVersion));
    if (!definition) throw new Error(`Unregistered event contract: ${event.eventType}@${event.eventVersion}.`);
    return definition.topic;
  }

  list() {
    return [...this.definitions.values()];
  }

  private key(eventType: string, version: number) {
    return `${eventType}@${version}`;
  }
}

export function createDefaultEventRegistry() {
  const registry = new EventRegistry();
  const events: Array<[OrchestratedEventType, IntelligenceEventTopic, ZodType<unknown>]> = [
    ["analytics.anomaly.detected", "analytics", AnalyticsTransportEventSchema],
    ["analytics.trend.detected", "analytics", AnalyticsTransportEventSchema],
    ["analytics.prediction.generated", "analytics", AnalyticsTransportEventSchema],
    ["analytics.risk.detected", "analytics", AnalyticsTransportEventSchema],
    ["intelligence.signal.raised", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["intelligence.signal.correlated", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["intelligence.priority.created", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["intelligence.recommendation.reasoned", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["intelligence.causal_chain.detected", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["intelligence.trace.recorded", "intelligence", CognitiveIntelligenceTransportEventSchema],
    ["agent.observation.recorded", "agents", AgentRuntimeTransportEventSchema],
    ["agent.plan.created", "agents", AgentRuntimeTransportEventSchema],
    ["agent.action.executed", "agents", AgentRuntimeTransportEventSchema],
    ["agent.report.generated", "agents", AgentRuntimeTransportEventSchema],
    ["agent.outcome.recorded", "agents", AgentRuntimeTransportEventSchema],
    ["outcome.recorded", "outcomes", OutcomeMemoryTransportEventSchema],
    ["outcome.episode.recorded", "outcomes", OutcomeMemoryTransportEventSchema],
    ["outcome.correlation.updated", "outcomes", OutcomeMemoryTransportEventSchema],
    ["learning.recommendation.analyzed", "learning", LearningTransportEventSchema],
    ["learning.strategy.scored", "learning", LearningTransportEventSchema],
    ["learning.confidence.updated", "learning", LearningTransportEventSchema],
    ["learning.pattern.discovered", "learning", LearningTransportEventSchema],
    ["learning.executive_briefing.generated", "learning", LearningTransportEventSchema],
    ["operations.mission.created", "intelligence", OperationsTransportEventSchema],
    ["operations.mission.progressed", "intelligence", OperationsTransportEventSchema],
    ["operations.agent.message.sent", "intelligence", OperationsTransportEventSchema],
    ["operations.consensus.reached", "intelligence", OperationsTransportEventSchema],
    ["operations.workflow.synthesized", "intelligence", OperationsTransportEventSchema],
    ["operations.forecast.generated", "intelligence", OperationsTransportEventSchema],
    ["operations.benchmark.generated", "intelligence", OperationsTransportEventSchema],
    ["operations.control_plane.snapshot", "intelligence", OperationsTransportEventSchema],
    ["operations.mission.daily_growth.started", "intelligence", DailyGrowthMissionTransportEventSchema],
    ["analytics.acquisition.completed", "analytics", DailyGrowthMissionTransportEventSchema],
    ["performance.analysis.completed", "intelligence", DailyGrowthMissionTransportEventSchema],
    ["strategy.learning.generated", "learning", DailyGrowthMissionTransportEventSchema],
    ["opportunity.discovery.completed", "intelligence", DailyGrowthMissionTransportEventSchema],
    ["strategy.plan.generated", "intelligence", DailyGrowthMissionTransportEventSchema],
    ["content.production.generated", "workflows", DailyGrowthMissionTransportEventSchema],
    ["report.generated", "dashboard", DailyGrowthMissionTransportEventSchema],
    ["approval.completed", "workflows", DailyGrowthMissionTransportEventSchema],
    ["production.tasks.created", "workflows", DailyGrowthMissionTransportEventSchema],
    ["publishing.prepared", "workflows", DailyGrowthMissionTransportEventSchema],
    ["content.outcome.generated", "outcomes", DailyGrowthMissionTransportEventSchema],
    ["learning.memory.updated", "learning", DailyGrowthMissionTransportEventSchema],
    ["recommendation.created", "recommendations", RecommendationTransportEventSchema],
    ["recommendation.updated", "recommendations", RecommendationTransportEventSchema],
    ["recommendation.approved", "recommendations", RecommendationTransportEventSchema],
    ["recommendation.rejected", "recommendations", RecommendationTransportEventSchema],
    ["recommendation.executed", "recommendations", RecommendationTransportEventSchema],
    ["automation.triggered", "automation", AutomationTransportEventSchema],
    ["automation.scheduled", "automation", AutomationTransportEventSchema],
    ["automation.started", "automation", AutomationTransportEventSchema],
    ["automation.retrying", "automation", AutomationTransportEventSchema],
    ["automation.failed", "automation", AutomationTransportEventSchema],
    ["automation.completed", "automation", AutomationTransportEventSchema],
    ["automation.rolled_back", "automation", AutomationTransportEventSchema],
    ["automation.dead_lettered", "automation", AutomationTransportEventSchema],
    ["dashboard.alert.raised", "dashboard", DashboardAlertEventSchema],
    ["workflow.started", "workflows", WorkflowEventSchema],
    ["workflow.completed", "workflows", WorkflowEventSchema],
    ["workflow.failed", "workflows", WorkflowEventSchema],
    ["competitor.signal.detected", "competitors", CompetitorIntelligenceEventSchema],
    ["competitor.benchmark.updated", "competitors", CompetitorIntelligenceEventSchema],
    ["review.received", "reviews", ReviewIntelligenceEventSchema],
    ["review.sentiment.changed", "reviews", ReviewIntelligenceEventSchema],
    ["review.risk.detected", "reviews", ReviewIntelligenceEventSchema],
  ];
  events.forEach(([eventType, topic, schema]) => registry.register({ eventType, topic, version: 1, schema }));
  return registry;
}
