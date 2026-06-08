import type { CopilotContextProvider, MemoryStore, PromptRegistry } from "../interfaces";
import type { AgentRunRequest, PromptTemplate, WorkspaceCopilotContext } from "../types";

export class InMemoryPromptRegistry implements PromptRegistry {
  constructor(private readonly templates: PromptTemplate[]) {}

  async resolve(workspaceId: string, key: string, agentType: AgentRunRequest["agentType"]) {
    const template = this.templates
      .filter((item) => item.key === key && item.agentType === agentType && item.active)
      .filter((item) => item.workspaceId === workspaceId || item.workspaceId === "*")
      .sort((left, right) => right.version.localeCompare(left.version))[0];
    if (!template) throw new Error(`Active prompt not found for ${key}.`);
    return template;
  }
}

export interface DashboardContextSource {
  project(workspaceId: string): Promise<Record<string, unknown>>;
}

export class WorkspaceContextManager implements CopilotContextProvider {
  constructor(
    private readonly memory: MemoryStore,
    private readonly dashboard?: DashboardContextSource,
    private readonly workspaceName?: (workspaceId: string) => Promise<string | undefined>
  ) {}

  async build(request: AgentRunRequest): Promise<WorkspaceCopilotContext> {
    const [memories, dashboard, name] = await Promise.all([
      this.memory.list(request.workspaceId, request.agentType),
      this.dashboard?.project(request.workspaceId),
      this.workspaceName?.(request.workspaceId),
    ]);
    return {
      workspaceId: request.workspaceId,
      workspaceName: name,
      dashboard,
      memories,
      attributes: { operation: request.operation },
    };
  }
}
