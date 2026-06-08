import type { AgentTraceRepository, MemoryStore } from "../interfaces";
import type { AgentExecutionTrace, AgentType, MemoryEntry } from "../types";

export class InMemoryCopilotStore implements AgentTraceRepository, MemoryStore {
  readonly traces: AgentExecutionTrace[] = [];
  readonly memories: MemoryEntry[] = [];

  async start(trace: AgentExecutionTrace) {
    this.traces.push(trace);
    return trace;
  }

  async finish(trace: AgentExecutionTrace) {
    const index = this.traces.findIndex((item) => item.id === trace.id);
    if (index >= 0) this.traces[index] = trace;
    else this.traces.push(trace);
    return trace;
  }

  async list(workspaceId: string, agentType: AgentType) {
    return this.memories.filter((item) => item.workspaceId === workspaceId && item.agentType === agentType);
  }

  async remember(entry: MemoryEntry) {
    const index = this.memories.findIndex(
      (item) => item.workspaceId === entry.workspaceId && item.agentType === entry.agentType &&
        item.scope === entry.scope && item.key === entry.key
    );
    if (index >= 0) this.memories[index] = entry;
    else this.memories.push(entry);
  }
}
