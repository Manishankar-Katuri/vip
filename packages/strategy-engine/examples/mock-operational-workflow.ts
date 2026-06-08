import { DashboardProjectionService } from "../dashboard";
import { FeedbackLearningService } from "../feedback";
import { RecommendationLifecycleEngine } from "../lifecycle";
import { InMemoryStrategyRepository, StrategyPersistenceService } from "../persistence";
import { generateMockWeeklyStrategy } from "./mock-weekly-strategy";

export async function runMockOperationalWorkflow() {
  const repository = new InMemoryStrategyRepository();
  const persistence = new StrategyPersistenceService(repository);
  const lifecycle = new RecommendationLifecycleEngine(repository);
  const feedback = new FeedbackLearningService(repository);
  const dashboard = new DashboardProjectionService(repository);
  const strategy = generateMockWeeklyStrategy();
  const riskRecommendation = strategy.recommendations.find(
    (recommendation) => recommendation.category === "RISK_MITIGATION"
  );
  if (!riskRecommendation) throw new Error("The mocked workflow requires a risk recommendation.");

  await persistence.persistWeeklyStrategy(strategy, {
    actor: { type: "SYSTEM", id: "weekly-strategy-scheduler" },
    expiresAt: "2026-06-01T00:00:00.000Z",
  });
  await lifecycle.transition({
    workspaceId: strategy.workspaceId,
    recommendationId: riskRecommendation.id,
    toStatus: "VIEWED",
    actor: { type: "USER", id: "workspace-admin" },
    occurredAt: new Date("2026-05-25T14:00:00.000Z"),
  });
  await lifecycle.transition({
    workspaceId: strategy.workspaceId,
    recommendationId: riskRecommendation.id,
    toStatus: "ACCEPTED",
    actor: { type: "USER", id: "workspace-admin" },
    implementationProgress: 20,
    occurredAt: new Date("2026-05-25T15:00:00.000Z"),
  });
  await lifecycle.updateImplementationProgress({
    workspaceId: strategy.workspaceId,
    recommendationId: riskRecommendation.id,
    percentage: 60,
    note: "Remediation communication and appointment triage are active.",
    actor: { type: "USER", id: "workspace-admin" },
    occurredAt: new Date("2026-05-28T15:00:00.000Z"),
  });
  const outcome = await feedback.recordOutcome({
    workspaceId: strategy.workspaceId,
    recommendationId: riskRecommendation.id,
    baselineEngagement: 42,
    currentEngagement: 55,
    actor: { type: "SYSTEM", id: "measurement-service" },
    observedAt: "2026-06-01T12:00:00.000Z",
  });

  return {
    strategy,
    outcome,
    analytics: await feedback.historicalAnalytics(strategy.workspaceId),
    dashboard: await dashboard.project(strategy.workspaceId, new Date("2026-06-01T12:00:00.000Z")),
    events: repository.events,
    auditEntries: repository.auditEntries,
  };
}
