import type { AgentTraceRepository, MemoryStore, PromptRegistry } from "../interfaces";
import type { AgentExecutionTrace, AgentType, MemoryEntry, PromptTemplate } from "../types";

type Row = Record<string, unknown>;
interface Delegate {
  create(args: unknown): Promise<Row>;
  update(args: unknown): Promise<Row>;
  upsert(args: unknown): Promise<Row>;
  findMany(args: unknown): Promise<Row[]>;
  findFirst(args: unknown): Promise<Row | null>;
}
export interface CopilotPrismaClient {
  aIExecutionTrace: Delegate;
  agentMemoryEntry: Delegate;
  promptTemplate: Delegate;
}

export class PrismaCopilotStore implements AgentTraceRepository, MemoryStore, PromptRegistry {
  constructor(private readonly database: CopilotPrismaClient) {}

  async start(trace: AgentExecutionTrace) {
    await this.database.aIExecutionTrace.create({ data: traceData(trace) });
    return trace;
  }
  async finish(trace: AgentExecutionTrace) {
    await this.database.aIExecutionTrace.update({ where: { id: trace.id }, data: traceData(trace) });
    return trace;
  }
  async list(workspaceId: string, agentType: AgentType) {
    const rows = await this.database.agentMemoryEntry.findMany({
      where: { workspaceId, agentType, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    return rows.map(memoryFrom);
  }
  async remember(entry: MemoryEntry) {
    await this.database.agentMemoryEntry.upsert({
      where: { workspaceId_agentType_scope_key: {
        workspaceId: entry.workspaceId, agentType: entry.agentType, scope: entry.scope, key: entry.key,
      } },
      create: memoryData(entry),
      update: memoryData(entry),
    });
  }
  async resolve(workspaceId: string, key: string, agentType: AgentType): Promise<PromptTemplate> {
    const row = await this.database.promptTemplate.findFirst({
      where: { workspaceId, key, agentType, active: true },
      orderBy: { version: "desc" },
    });
    if (!row) throw new Error(`Active prompt not found for ${key}.`);
    return {
      id: String(row.id), workspaceId: String(row.workspaceId), key: String(row.key),
      version: String(row.version), agentType: row.agentType as AgentType,
      systemPrompt: String(row.systemPrompt), userTemplate: String(row.userTemplate), active: Boolean(row.active),
    };
  }
}
function traceData(trace: AgentExecutionTrace) { return {
  id: trace.id, workspaceId: trace.workspaceId, recommendationId: trace.recommendationId,
  actionPlanId: trace.actionPlanId, agentType: trace.agentType, operation: trace.operation,
  status: trace.status, triggerType: trace.trigger?.type, triggerId: trace.trigger?.id,
  model: trace.model, input: trace.input, output: trace.output, toolCalls: trace.toolCalls,
  promptKey: trace.promptKey, promptVersion: trace.promptVersion, inputTokens: trace.usage.inputTokens,
  outputTokens: trace.usage.outputTokens, latencyMs: trace.latencyMs, error: trace.error,
  startedAt: new Date(trace.startedAt), completedAt: trace.completedAt ? new Date(trace.completedAt) : undefined,
}; }
function memoryData(entry: MemoryEntry) { return { ...entry, expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined }; }
function memoryFrom(row: Row): MemoryEntry { return { workspaceId: String(row.workspaceId), agentType: row.agentType as AgentType, scope: String(row.scope), key: String(row.key), content: row.content as Record<string, unknown>, expiresAt: row.expiresAt ? new Date(String(row.expiresAt)).toISOString() : undefined }; }
