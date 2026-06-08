import assert from "node:assert/strict";
import test from "node:test";

import { DefaultAgentRegistry } from "../agents";
import type { AIModelProvider, ToolDefinition } from "../interfaces";
import { CopilotEventReactionService } from "../integration";
import { InMemoryCopilotStore } from "../persistence";
import {
  CopilotRuntime, InMemoryPromptRegistry, ToolPermissionDeniedError, WorkspaceContextManager,
} from "../runtime";

function runtime(provider: AIModelProvider, tools: ToolDefinition[] = [], permitted = true) {
  const store = new InMemoryCopilotStore();
  const prompts = new InMemoryPromptRegistry([
    { workspaceId: "*", key: "strategy-analyst", version: "1.0", agentType: "STRATEGY_ANALYST", active: true, systemPrompt: "Analyze.", userTemplate: "{{input}} {{workspaceContext}}" },
    { workspaceId: "*", key: "growth-agent", version: "1.0", agentType: "GROWTH_AGENT", active: true, systemPrompt: "Grow.", userTemplate: "{{input}} {{workspaceContext}}" },
    { workspaceId: "*", key: "risk-monitor", version: "1.0", agentType: "RISK_MONITOR", active: true, systemPrompt: "Monitor.", userTemplate: "{{input}} {{workspaceContext}}" },
  ]);
  return { store, runtime: new CopilotRuntime(provider, new DefaultAgentRegistry(), prompts, new WorkspaceContextManager(store), store, { canExecute: async () => permitted }, tools) };
}

test("runs an agent with workspace context, token telemetry, and allowed tools", async () => {
  const provider: AIModelProvider = {
    complete: async () => ({
      content: "Run a conversion experiment.",
      toolCalls: [{ id: "call-1", toolName: "action.propose", input: { name: "Experiment" } }],
      usage: { inputTokens: 50, outputTokens: 10 },
      model: "mock-model",
    }),
  };
  const actionTool: ToolDefinition = {
    name: "action.propose", requiredPermission: "actions:create",
    execute: async () => ({ actionPlanId: "plan-1" }),
  };
  const testRuntime = runtime(provider, [actionTool]);
  const result = await testRuntime.runtime.run({
    workspaceId: "workspace-1", agentType: "GROWTH_AGENT",
    operation: "SUGGEST_EXPERIMENT", input: { objective: "conversion" },
  });
  assert.equal(result.toolResults[0].output.actionPlanId, "plan-1");
  assert.equal(result.trace.status, "COMPLETED");
  assert.equal(result.trace.usage.inputTokens, 50);
});

test("blocks unauthorized tools and reacts to strategy risk events", async () => {
  const deniedProvider: AIModelProvider = {
    complete: async () => ({
      content: "Propose.", toolCalls: [{ id: "call", toolName: "action.propose", input: {} }],
      usage: { inputTokens: 1, outputTokens: 1 }, model: "mock",
    }),
  };
  const denied = runtime(deniedProvider, [{
    name: "action.propose", requiredPermission: "actions:create", execute: async () => ({}),
  }], false);
  await assert.rejects(
    () => denied.runtime.run({ workspaceId: "workspace-1", agentType: "GROWTH_AGENT", operation: "SUGGEST_EXPERIMENT", input: {} }),
    ToolPermissionDeniedError
  );
  assert.equal(denied.store.traces[0].status, "BLOCKED");

  const safe = runtime({ complete: async () => ({ content: "Escalate risk.", usage: { inputTokens: 2, outputTokens: 2 }, model: "mock" }) });
  const result = await new CopilotEventReactionService(safe.runtime).reactToStrategyEvent({
    workspaceId: "workspace-1", recommendationId: "rec-1",
    aggregateType: "RECOMMENDATION", aggregateId: "rec-1",
    eventType: "recommendation.lifecycle.transitioned",
    payload: { category: "RISK_MITIGATION", toStatus: "ACCEPTED" },
    occurredAt: "2026-05-25T00:00:00.000Z",
  });
  assert.equal(result?.trace.agentType, "RISK_MONITOR");
});

test("supports streaming providers for conversational insights", async () => {
  const testRuntime = runtime({
    complete: async () => ({ content: "", usage: { inputTokens: 0, outputTokens: 0 }, model: "mock" }),
    stream: async function* () { yield "Weekly "; yield "insight"; },
  });
  const chunks: string[] = [];
  for await (const chunk of testRuntime.runtime.stream({
    workspaceId: "workspace-1", agentType: "STRATEGY_ANALYST", operation: "BUSINESS_INSIGHT", input: {},
  })) chunks.push(chunk);
  assert.equal(chunks.join(""), "Weekly insight");
});
