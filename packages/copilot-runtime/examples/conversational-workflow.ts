import { DefaultAgentRegistry } from "../agents";
import { InMemoryCopilotStore } from "../persistence";
import { CopilotRuntime, InMemoryPromptRegistry, WorkspaceContextManager } from "../runtime";
import type { AIModelProvider } from "../interfaces";

export async function runMockConversation() {
  const store = new InMemoryCopilotStore();
  await store.remember({
    workspaceId: "workspace_demo_health",
    agentType: "STRATEGY_ANALYST",
    scope: "strategy",
    key: "current-focus",
    content: { objective: "Reduce appointment delays" },
  });
  const provider: AIModelProvider = {
    complete: async () => ({
      content: "Address appointment delays first and monitor patient feedback weekly.",
      usage: { inputTokens: 120, outputTokens: 18 },
      model: "mock-reasoning-model",
    }),
  };
  const runtime = new CopilotRuntime(
    provider,
    new DefaultAgentRegistry(),
    new InMemoryPromptRegistry([{
      workspaceId: "*", key: "strategy-analyst", version: "1.0",
      agentType: "STRATEGY_ANALYST", active: true,
      systemPrompt: "You are a strategy analyst.",
      userTemplate: "Use {{workspaceContext}} to answer {{input}}.",
    }]),
    new WorkspaceContextManager(store),
    store,
    { canExecute: async () => true }
  );
  return runtime.run({
    workspaceId: "workspace_demo_health",
    agentType: "STRATEGY_ANALYST",
    operation: "BUSINESS_INSIGHT",
    input: { question: "What deserves attention this week?" },
  });
}
