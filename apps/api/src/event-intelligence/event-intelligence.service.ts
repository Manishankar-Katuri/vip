import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import {
  EventReplayService,
  InMemoryEventTelemetry,
  OrchestrationEventBus,
  type CompetitorIntelligenceEvent,
  type DurableEventEnvelope,
  type EventMetadata,
  type EventPriority,
  type OrchestratedEvent,
  type ReplayQuery,
  type ReviewIntelligenceEvent,
  type WorkflowEvent,
  registerOrchestrationPipelines,
} from "@vip/event-orchestrator";

import {
  EVENT_INTELLIGENCE_BUS,
  EVENT_INTELLIGENCE_REPLAY,
  EVENT_INTELLIGENCE_TELEMETRY,
} from "./event-intelligence.tokens";

@Injectable()
export class EventIntelligenceService implements OnModuleInit {
  constructor(
    @Inject(EVENT_INTELLIGENCE_BUS)
    private readonly bus: OrchestrationEventBus,
    @Inject(EVENT_INTELLIGENCE_REPLAY)
    private readonly replayService: EventReplayService,
    @Inject(EVENT_INTELLIGENCE_TELEMETRY)
    private readonly telemetry: InMemoryEventTelemetry
  ) {}

  onModuleInit() {
    registerOrchestrationPipelines(this.bus, {
      analyticsToRecommendations: async () => undefined,
      recommendationsToAutomation: async () => undefined,
      automationToInsights: async () => undefined,
      analyticsToAlerts: async () => undefined,
      competitorsToRecommendations: async (event) => this.raiseCompetitorRecommendationSignal(event),
      reviewsToRecommendations: async (event) => this.raiseReviewRecommendationSignal(event),
      workflowsToAnalytics: async (event) => this.raiseWorkflowAnalyticsSignal(event),
    });
  }

  publish(
    event: OrchestratedEvent,
    metadata: Partial<EventMetadata> = {},
    priority?: EventPriority
  ): Promise<DurableEventEnvelope> {
    return this.bus.publish(event, metadata, { priority });
  }

  replay(query: ReplayQuery) {
    return this.replayService.replay(query);
  }

  health() {
    return {
      bus: this.bus.health(),
      telemetry: this.telemetry.snapshot(),
    };
  }

  private async raiseCompetitorRecommendationSignal(event: CompetitorIntelligenceEvent) {
    await Promise.resolve(event);
  }

  private async raiseReviewRecommendationSignal(event: ReviewIntelligenceEvent) {
    await Promise.resolve(event);
  }

  private async raiseWorkflowAnalyticsSignal(event: WorkflowEvent) {
    await Promise.resolve(event);
  }
}
