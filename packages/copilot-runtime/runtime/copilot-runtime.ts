import type {
  AIModelProvider, AgentRegistry, AgentTraceRepository, CopilotContextProvider,
  PromptRegistry, ToolDefinition, ToolPermissionResolver,
} from "../interfaces";
import type {
  AgentExecutionTrace, AgentMessage, AgentRunRequest, AgentRunResult, WorkspaceCopilotContext,
} from "../types";

export class ToolPermissionDeniedError extends Error {
  constructor(toolName: string) {
    super(`Tool execution denied: ${toolName}.`);
    this.name = "ToolPermissionDeniedError";
  }
}

export class CopilotRuntime {
  private readonly tools: Map<string, ToolDefinition>;

  constructor(
    private readonly provider: AIModelProvider,
    private readonly agents: AgentRegistry,
    private readonly prompts: PromptRegistry,
    private readonly contextProvider: CopilotContextProvider,
    private readonly traces: AgentTraceRepository,
    private readonly permissions: ToolPermissionResolver,
    tools: ToolDefinition[] = []
  ) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
  }

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    const started = Date.now();
    const definition = this.agents.get(request.agentType);
    const [prompt, context] = await Promise.all([
      this.prompts.resolve(request.workspaceId, definition.promptKey, request.agentType),
      this.contextProvider.build(request),
    ]);
    let trace = await this.traces.start({
      id: `trace:${request.workspaceId}:${started}`,
      workspaceId: request.workspaceId,
      recommendationId: request.recommendationId,
      actionPlanId: request.actionPlanId,
      agentType: request.agentType,
      operation: request.operation,
      status: "RUNNING",
      trigger: request.trigger,
      input: request.input,
      toolCalls: [],
      promptKey: prompt.key,
      promptVersion: prompt.version,
      usage: { inputTokens: 0, outputTokens: 0 },
      startedAt: new Date(started).toISOString(),
    });

    try {
      const messages = messagesFor(prompt.systemPrompt, prompt.userTemplate, request.input, context);
      const response = await this.provider.complete(messages, {
        workspaceId: request.workspaceId,
        agentType: request.agentType,
        operation: request.operation,
      });
      const toolResults = await this.executeTools(request.workspaceId, definition.allowedTools, response.toolCalls ?? [], context);
      trace = await this.traces.finish({
        ...trace,
        status: "COMPLETED",
        model: response.model,
        output: { content: response.content, toolResults },
        toolCalls: response.toolCalls ?? [],
        usage: response.usage,
        latencyMs: Date.now() - started,
        completedAt: new Date().toISOString(),
      });
      return { trace, response: response.content, toolResults };
    } catch (error) {
      await this.traces.finish({
        ...trace,
        status: error instanceof ToolPermissionDeniedError ? "BLOCKED" : "FAILED",
        error: error instanceof Error ? error.message : "Agent runtime failed.",
        latencyMs: Date.now() - started,
        completedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  async *stream(request: AgentRunRequest) {
    if (!this.provider.stream) throw new Error("The configured AI provider does not support streaming.");
    const definition = this.agents.get(request.agentType);
    const [prompt, context] = await Promise.all([
      this.prompts.resolve(request.workspaceId, definition.promptKey, request.agentType),
      this.contextProvider.build(request),
    ]);
    const messages = messagesFor(prompt.systemPrompt, prompt.userTemplate, request.input, context);
    for await (const chunk of this.provider.stream(messages, { workspaceId: request.workspaceId, agentType: request.agentType })) {
      yield chunk;
    }
  }

  private async executeTools(
    workspaceId: string,
    allowedTools: string[],
    calls: NonNullable<Awaited<ReturnType<AIModelProvider["complete"]>>["toolCalls"]>,
    context: WorkspaceCopilotContext
  ) {
    const outputs: Array<{ toolName: string; output: Record<string, unknown> }> = [];
    for (const call of calls) {
      const tool = this.tools.get(call.toolName);
      if (!tool || !allowedTools.includes(call.toolName)) throw new ToolPermissionDeniedError(call.toolName);
      const allowed = await this.permissions.canExecute(workspaceId, tool.name, tool.requiredPermission);
      if (!allowed) throw new ToolPermissionDeniedError(call.toolName);
      outputs.push({ toolName: call.toolName, output: await tool.execute(call.input, context) });
    }
    return outputs;
  }
}

function messagesFor(
  systemPrompt: string,
  template: string,
  input: Record<string, unknown>,
  context: WorkspaceCopilotContext
): AgentMessage[] {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: template
        .replace("{{input}}", JSON.stringify(input))
        .replace("{{workspaceContext}}", JSON.stringify(context)),
    },
  ];
}
