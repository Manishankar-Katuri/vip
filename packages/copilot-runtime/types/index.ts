export type AgentType =
  | "STRATEGY_ANALYST"
  | "GROWTH_AGENT"
  | "CONTENT_AGENT"
  | "RISK_MONITOR"
  | "CAMPAIGN_OPTIMIZER";
export type AgentRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "BLOCKED";

export interface AgentDefinition {
  type: AgentType;
  name: string;
  purpose: string;
  allowedTools: string[];
  promptKey: string;
}

export interface PromptTemplate {
  id?: string;
  workspaceId: string;
  key: string;
  version: string;
  agentType: AgentType;
  systemPrompt: string;
  userTemplate: string;
  active: boolean;
}

export interface WorkspaceCopilotContext {
  workspaceId: string;
  workspaceName?: string;
  objectives?: string[];
  dashboard?: Record<string, unknown>;
  recommendations?: Array<Record<string, unknown>>;
  memories?: MemoryEntry[];
  attributes?: Record<string, unknown>;
}

export interface MemoryEntry {
  workspaceId: string;
  agentType: AgentType;
  scope: string;
  key: string;
  content: Record<string, unknown>;
  expiresAt?: string;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}

export interface ToolCallRequest {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCallRequest[];
  usage: ModelUsage;
  model: string;
}

export interface AgentRunRequest {
  workspaceId: string;
  agentType: AgentType;
  operation: "EXPLAIN_RECOMMENDATION" | "PLAN_IMPLEMENTATION" | "SUGGEST_EXPERIMENT" | "BUSINESS_INSIGHT" | "EVENT_REACTION";
  input: Record<string, unknown>;
  trigger?: { type: string; id: string };
  recommendationId?: string;
  actionPlanId?: string;
}

export interface AgentExecutionTrace {
  id: string;
  workspaceId: string;
  recommendationId?: string;
  actionPlanId?: string;
  agentType: AgentType;
  operation: AgentRunRequest["operation"];
  status: AgentRunStatus;
  trigger?: { type: string; id: string };
  model?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolCalls: ToolCallRequest[];
  promptKey?: string;
  promptVersion?: string;
  usage: ModelUsage;
  latencyMs?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentRunResult {
  trace: AgentExecutionTrace;
  response: string;
  toolResults: Array<{ toolName: string; output: Record<string, unknown> }>;
}
