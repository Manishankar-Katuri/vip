import type {
  AgentDefinition, AgentExecutionTrace, AgentMessage, AgentRunRequest, MemoryEntry,
  ModelResponse, PromptTemplate, ToolCallRequest, WorkspaceCopilotContext,
} from "../types";

export interface AIModelProvider {
  complete(messages: AgentMessage[], metadata: Record<string, unknown>): Promise<ModelResponse>;
  stream?(messages: AgentMessage[], metadata: Record<string, unknown>): AsyncIterable<string>;
}

export interface PromptRegistry {
  resolve(workspaceId: string, key: string, agentType: AgentDefinition["type"]): Promise<PromptTemplate>;
}

export interface CopilotContextProvider {
  build(request: AgentRunRequest): Promise<WorkspaceCopilotContext>;
}

export interface MemoryStore {
  list(workspaceId: string, agentType: AgentDefinition["type"]): Promise<MemoryEntry[]>;
  remember(entry: MemoryEntry): Promise<void>;
}

export interface AgentTraceRepository {
  start(trace: AgentExecutionTrace): Promise<AgentExecutionTrace>;
  finish(trace: AgentExecutionTrace): Promise<AgentExecutionTrace>;
}

export interface ToolDefinition {
  name: string;
  requiredPermission: string;
  execute(input: Record<string, unknown>, context: WorkspaceCopilotContext): Promise<Record<string, unknown>>;
}

export interface ToolPermissionResolver {
  canExecute(workspaceId: string, toolName: string, permission: string): Promise<boolean>;
}

export interface AgentRegistry {
  get(type: AgentDefinition["type"]): AgentDefinition;
}

export interface ActionPlanEmitter {
  emitFromAgent(workspaceId: string, action: Record<string, unknown>): Promise<{ actionPlanId: string }>;
}
