import type { AIModelProvider } from "../interfaces";
import type { AgentMessage, ModelResponse } from "../types";

export interface OpenAICompletionClient {
  complete(request: {
    messages: AgentMessage[];
    metadata: Record<string, unknown>;
  }): Promise<ModelResponse>;
  stream?(request: {
    messages: AgentMessage[];
    metadata: Record<string, unknown>;
  }): AsyncIterable<string>;
}

export class OpenAIProviderAdapter implements AIModelProvider {
  constructor(private readonly client: OpenAICompletionClient) {}

  complete(messages: AgentMessage[], metadata: Record<string, unknown>) {
    return this.client.complete({ messages, metadata });
  }

  stream(messages: AgentMessage[], metadata: Record<string, unknown>) {
    if (!this.client.stream) throw new Error("OpenAI client streaming is not configured.");
    return this.client.stream({ messages, metadata });
  }
}
