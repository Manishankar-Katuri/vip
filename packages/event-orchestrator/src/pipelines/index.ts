import type { AnalyticsIntelligenceEvent } from "@vip/analytics-intelligence";
import type { AutomationLifecycleEvent } from "@vip/automation-engine";
import type { CognitiveIntelligenceLifecycleEvent } from "@vip/cognitive-core";
import type { RecommendationLifecycleEvent } from "@vip/recommendation-engine";

import type { OrchestrationEventBus } from "../bus";
import type { CompetitorIntelligenceEvent, DurableEventEnvelope, ReviewIntelligenceEvent, WorkflowEvent } from "../dto";

export interface OrchestrationPipelineHandlers {
  analyticsToRecommendations(event: AnalyticsIntelligenceEvent): Promise<void>;
  recommendationsToAutomation(event: RecommendationLifecycleEvent): Promise<void>;
  automationToInsights(event: AutomationLifecycleEvent): Promise<void>;
  analyticsToAlerts(event: AnalyticsIntelligenceEvent): Promise<void>;
  competitorsToRecommendations(event: CompetitorIntelligenceEvent): Promise<void>;
  reviewsToRecommendations(event: ReviewIntelligenceEvent): Promise<void>;
  workflowsToAnalytics(event: WorkflowEvent): Promise<void>;
  platformEventsToSignals?(envelope: DurableEventEnvelope): Promise<void>;
  signalsToGraph?(event: CognitiveIntelligenceLifecycleEvent): Promise<void>;
  signalsToPriorities?(event: CognitiveIntelligenceLifecycleEvent): Promise<void>;
  prioritiesToRecommendations?(event: CognitiveIntelligenceLifecycleEvent): Promise<void>;
  causalFindingsToRecommendations?(event: CognitiveIntelligenceLifecycleEvent): Promise<void>;
}

export function registerOrchestrationPipelines(bus: Pick<OrchestrationEventBus, "subscribe">, handlers: OrchestrationPipelineHandlers) {
  const unsubscribe = [
    bus.subscribe({
      id: "pipeline.analytics.recommendations", topics: ["analytics"],
      eventTypes: ["analytics.anomaly.detected", "analytics.trend.detected", "analytics.prediction.generated"],
      handle: (envelope) => handlers.analyticsToRecommendations(envelope.event as AnalyticsIntelligenceEvent),
    }),
    bus.subscribe({
      id: "pipeline.recommendations.automation", topics: ["recommendations"],
      eventTypes: ["recommendation.approved", "recommendation.created"],
      handle: (envelope) => handlers.recommendationsToAutomation(envelope.event as RecommendationLifecycleEvent),
    }),
    bus.subscribe({
      id: "pipeline.automation.insights", topics: ["automation"],
      eventTypes: ["automation.completed", "automation.failed", "automation.dead_lettered"],
      handle: (envelope) => handlers.automationToInsights(envelope.event as AutomationLifecycleEvent),
    }),
    bus.subscribe({
      id: "pipeline.analytics.alerts", topics: ["analytics"],
      eventTypes: ["analytics.anomaly.detected", "analytics.risk.detected"],
      handle: (envelope) => handlers.analyticsToAlerts(envelope.event as AnalyticsIntelligenceEvent),
    }),
    bus.subscribe({
      id: "pipeline.competitors.recommendations", topics: ["competitors"],
      eventTypes: ["competitor.signal.detected", "competitor.benchmark.updated"],
      handle: (envelope) => handlers.competitorsToRecommendations(envelope.event as CompetitorIntelligenceEvent),
    }),
    bus.subscribe({
      id: "pipeline.reviews.recommendations", topics: ["reviews"],
      eventTypes: ["review.received", "review.sentiment.changed", "review.risk.detected"],
      handle: (envelope) => handlers.reviewsToRecommendations(envelope.event as ReviewIntelligenceEvent),
    }),
    bus.subscribe({
      id: "pipeline.workflows.analytics", topics: ["workflows"],
      eventTypes: ["workflow.completed", "workflow.failed"],
      handle: (envelope) => handlers.workflowsToAnalytics(envelope.event as WorkflowEvent),
    }),
    ...(handlers.platformEventsToSignals ? [bus.subscribe({
      id: "pipeline.cognitive.events.signals",
      topics: ["analytics", "automation", "workflows", "competitors", "reviews", "recommendations"],
      handle: (envelope) => handlers.platformEventsToSignals!(envelope),
    })] : []),
    ...(handlers.signalsToGraph ? [bus.subscribe({
      id: "pipeline.cognitive.signals.graph",
      topics: ["intelligence"],
      eventTypes: ["intelligence.signal.raised", "intelligence.signal.correlated"],
      handle: (envelope) => handlers.signalsToGraph!(envelope.event as CognitiveIntelligenceLifecycleEvent),
    })] : []),
    ...(handlers.signalsToPriorities ? [bus.subscribe({
      id: "pipeline.cognitive.signals.priorities",
      topics: ["intelligence"],
      eventTypes: ["intelligence.signal.raised", "intelligence.causal_chain.detected"],
      handle: (envelope) => handlers.signalsToPriorities!(envelope.event as CognitiveIntelligenceLifecycleEvent),
    })] : []),
    ...(handlers.prioritiesToRecommendations ? [bus.subscribe({
      id: "pipeline.cognitive.priorities.recommendations",
      topics: ["intelligence"],
      eventTypes: ["intelligence.priority.created"],
      handle: (envelope) => handlers.prioritiesToRecommendations!(envelope.event as CognitiveIntelligenceLifecycleEvent),
    })] : []),
    ...(handlers.causalFindingsToRecommendations ? [bus.subscribe({
      id: "pipeline.cognitive.causal.recommendations",
      topics: ["intelligence"],
      eventTypes: ["intelligence.causal_chain.detected"],
      handle: (envelope) => handlers.causalFindingsToRecommendations!(envelope.event as CognitiveIntelligenceLifecycleEvent),
    })] : []),
  ];
  return () => unsubscribe.forEach((release) => release());
}
