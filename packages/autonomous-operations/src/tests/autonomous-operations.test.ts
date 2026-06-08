import test from "node:test";
import assert from "node:assert/strict";

import type { AgentPlan } from "../../../agent-runtime/src";
import { createDefaultAgentModules, createExecutiveAgent, createStrategyAgent } from "../../../agent-runtime/src";
import type { PriorityObject } from "../../../cognitive-core/src";
import { InMemoryLearningMemory } from "../../../learning-engine/src";
import {
  AutonomousWorkflowGenerator,
  CrossWorkspaceLearningLayer,
  ForecastingSimulationEngine,
  MissionGoalSystem,
  MultiAgentCoordinator,
  UnifiedIntelligenceControlPlane,
} from "../index";

test("coordinates missions, consensus, workflow synthesis, benchmarks, forecasts, and control-plane snapshots", async () => {
  let nextId = 0;
  const id = () => `id-${++nextId}`;
  const now = () => "2026-05-29T00:00:00.000Z";
  const modules = createDefaultAgentModules();
  const strategyAgent = createStrategyAgent(modules, "workspace-1");
  const executiveAgent = createExecutiveAgent(modules, "workspace-1");
  const priority: PriorityObject = {
    id: "priority-1",
    workspaceId: "workspace-1",
    kind: "OPPORTUNITY",
    title: "Grow cardiology appointments",
    reason: "Demand is increasing.",
    urgency: 70,
    confidence: 0.82,
    expectedImpact: 85,
    executionComplexity: 35,
    strategicImportance: 88,
    relatedEntities: [{ id: "cardiology", type: "SPECIALTY" }],
    supportingSignals: [],
    causalFindings: [],
    evidence: [],
    recommendedActions: ["Increase campaign capacity", "Measure appointment lift"],
    createdAt: now(),
  };

  const missionSystem = new MissionGoalSystem(undefined, id, now);
  const mission = await missionSystem.create({
    workspaceId: "workspace-1",
    title: "Cardiology growth",
    objective: "Grow cardiology appointments",
    horizon: "WEEKLY",
    targetEntities: [{ id: "cardiology", type: "SPECIALTY" }],
    successMetrics: [{ kpi: { id: "appointments", type: "KPI" }, targetValue: 120 }],
    traceId: "trace-1",
    metadata: {},
    agents: [strategyAgent, executiveAgent],
    priorities: [priority],
  });
  assert.equal(mission.status, "ACTIVE");
  assert.equal(mission.decomposition.length, 1);

  const coordinator = new MultiAgentCoordinator(undefined, id, now);
  const collaboration = coordinator.open({ workspaceId: "workspace-1", traceId: "trace-1", missionId: mission.id, participants: [strategyAgent.id, executiveAgent.id], topic: mission.objective });
  await coordinator.send({ workspaceId: "workspace-1", traceId: "trace-1", fromAgentId: strategyAgent.id, toAgentId: executiveAgent.id, collaborationId: collaboration.id, missionId: mission.id, type: "PROPOSAL", content: "Proceed with growth playbook.", payload: {} });
  const decided = await coordinator.consensus(collaboration.id, "Proceed", [
    { agentId: strategyAgent.id, position: "SUPPORT", confidence: 0.86, rationale: "Strong opportunity." },
    { agentId: executiveAgent.id, position: "SUPPORT", confidence: 0.8, rationale: "Aligned to weekly focus." },
  ]);
  assert.equal(decided.status, "CONSENSUS_REACHED");

  const adaptivePlan: AgentPlan = {
    id: "agent-plan-1",
    workspaceId: "workspace-1",
    agentId: strategyAgent.id,
    traceId: "trace-1",
    goal: mission.objective,
    status: "READY",
    adaptive: true,
    interruptionPolicy: "PAUSE_AND_REVISE",
    steps: [],
    dependencies: [],
    observations: [],
    revision: 1,
    createdAt: now(),
    updatedAt: now(),
    metadata: {},
  };
  const playbook = await new AutonomousWorkflowGenerator(undefined, id, now).synthesize({
    context: {
      missionId: mission.id,
      workspaceId: "workspace-1",
      traceId: "trace-1",
      objective: mission.objective,
      horizon: "WEEKLY",
      entities: [{ id: "cardiology", type: "SPECIALTY" }],
      priorities: [priority],
      recommendations: [],
      signals: [],
      causalFindings: [],
      outcomes: [],
      evidence: [],
      constraints: {},
    },
    adaptivePlan,
  });
  assert.equal(playbook.planInput.requiresApproval, false);
  assert.equal(playbook.planInput.steps.length, 2);

  const crossWorkspace = new CrossWorkspaceLearningLayer(new InMemoryLearningMemory(), id, now);
  crossWorkspace.ingest({ workspaceId: "tenant-a", specialty: "cardiology", patterns: [{ id: "p1", workspaceId: "tenant-a", kind: "GROWTH", signature: "SPECIALTY:KPI", support: 3, confidence: 0.8, entities: [], outcomeIds: [], signalIds: [], summary: "Growth", discoveredAt: now() }], outcomeCount: 10 });
  crossWorkspace.ingest({ workspaceId: "tenant-b", specialty: "cardiology", patterns: [{ id: "p2", workspaceId: "tenant-b", kind: "GROWTH", signature: "SPECIALTY:KPI", support: 4, confidence: 0.75, entities: [], outcomeIds: [], signalIds: [], summary: "Growth", discoveredAt: now() }], outcomeCount: 8 });
  const benchmark = crossWorkspace.generateBenchmark({ specialty: "cardiology", minTenants: 2 });
  assert.equal(benchmark.workspaceCount, 2);

  const forecasting = new ForecastingSimulationEngine(undefined, id, now);
  const forecast = await forecasting.forecast({
    workspaceId: "workspace-1",
    kind: "KPI",
    target: { id: "appointments", type: "KPI" },
    horizonDays: 30,
    observations: [
      { at: "2026-05-01T00:00:00.000Z", value: 100, confidence: 0.8 },
      { at: "2026-05-29T00:00:00.000Z", value: 112, confidence: 0.82 },
    ],
  });
  assert.ok(forecast.predictedValue > 112);

  const controlPlane = new UnifiedIntelligenceControlPlane(undefined, id, now);
  controlPlane.recordWorkflow(playbook);
  controlPlane.recordForecast(forecast);
  controlPlane.observeEvent({ traceId: "trace-1", eventType: "operations.mission.created", aggregateId: mission.id, occurredAt: now() });
  const snapshot = await controlPlane.snapshot({
    workspaceId: "workspace-1",
    agents: [strategyAgent, executiveAgent],
    missions: [mission],
    patterns: [],
    benchmarks: [benchmark],
  });
  assert.equal(snapshot.health.activeMissions, 1);
  assert.equal(snapshot.workflows.length, 1);
  assert.equal(snapshot.forecasts.length, 1);
});
