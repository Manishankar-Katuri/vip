import { randomUUID } from "node:crypto";

import type { AnalyticsIntelligenceEvent, Insight, IntelligenceSignal, Prediction } from "../dto";
import { AnalyticsIntelligenceEventSchema } from "../schemas";

export class AnalyticsEventFactory {
  constructor(private readonly id: () => string = () => randomUUID()) {}

  signal(signal: IntelligenceSignal): AnalyticsIntelligenceEvent {
    const eventType = signal.kind === "ENGAGEMENT_ANOMALY" || signal.kind === "AUDIENCE_SHIFT"
      ? "analytics.anomaly.detected" : "analytics.trend.detected";
    return this.event(eventType, signal.workspaceId, signal.id, signal.detectedAt, signal);
  }

  prediction(prediction: Prediction): AnalyticsIntelligenceEvent {
    return this.event("analytics.prediction.generated", prediction.workspaceId, prediction.id, prediction.generatedAt, prediction);
  }

  risk(insight: Insight): AnalyticsIntelligenceEvent {
    return this.event("analytics.risk.detected", insight.workspaceId, insight.id, insight.generatedAt, insight);
  }

  private event(
    eventType: AnalyticsIntelligenceEvent["eventType"], workspaceId: string, aggregateId: string,
    occurredAt: string, payload: IntelligenceSignal | Prediction | Insight
  ) {
    return AnalyticsIntelligenceEventSchema.parse({
      eventId: this.id(), eventType, eventVersion: 1, workspaceId, aggregateType: "ANALYTICS_INTELLIGENCE",
      aggregateId, idempotencyKey: `${eventType}:${aggregateId}`, occurredAt, payload,
    }) as AnalyticsIntelligenceEvent;
  }
}
