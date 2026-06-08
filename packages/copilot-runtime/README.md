# VIP Copilot Runtime

`@vip/copilot-runtime` hosts workspace-aware AI agents without binding business logic to a model vendor or web framework.

## Agents

- Strategy Analyst
- Growth Agent
- Content Agent
- Risk Monitor
- Campaign Optimizer

## Runtime Boundaries

- `AIModelProvider` supports complete and streaming responses; `OpenAIProviderAdapter` accepts an application-owned OpenAI client.
- `PromptRegistry`, `MemoryStore`, and `AgentTraceRepository` have Prisma and mock-friendly implementations.
- `ToolPermissionResolver` blocks tools outside an agent profile or tenant authorization context.
- `CopilotEventReactionService` reacts to strategy lifecycle events.
- `ActionProposalTool` submits human-gated actions to `@vip/action-engine`.

Traces record model identity, tool calls, prompt version, token consumption, latency, and errors for metering and auditing. Model credentials and transport configuration remain outside this package for microservice deployment.
