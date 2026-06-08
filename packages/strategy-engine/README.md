# VIP Strategy Engine

`@vip/strategy-engine` converts typed intelligence signals into prioritized weekly strategic recommendations for a business workspace.

## Architecture

- `types/`: stable input and output contracts for signals, recommendations, explanations, and weekly plans.
- `interfaces/`: replaceable boundaries for signal providers, rule execution, LLM augmentation, and feedback learning.
- `aggregation/`: signal validation, deduplication, freshness weighting, and coverage summaries.
- `rules/`: default opportunity, risk, performance, and competitor rule executors.
- `scoring/`: transparent weighted recommendation scoring and priority assignment.
- `explanations/`: evidence metadata and future LLM prompt context.
- `recommendations/`: rule orchestration into typed recommendations.
- `weekly/`: weekly strategy facade and provider collection pathway.
- `persistence/`: repository boundary, PostgreSQL/Prisma adapter, and deterministic in-memory adapter.
- `lifecycle/`: guarded recommendation status transitions and implementation progress.
- `feedback/`: effectiveness scoring, engagement delta analysis, adaptive confidence, and historical analytics.
- `dashboard/`: dashboard-ready projections for priorities, risks, opportunities, trends, and confidence.
- `events/`: event publisher boundary for agents, copilots, forecasting, and other subscribers.
- `validation/`: workspace, transition, strategy, and outcome validation.
- `examples/`: mocked end-to-end generation input.

## Example

```ts
import { WeeklyStrategyGenerator } from "@vip/strategy-engine";

const strategy = new WeeklyStrategyGenerator().generate({
  context: { workspaceId: "workspace_1", objectives: ["Grow demand"] },
  signals,
  asOf: new Date(),
});
```

## Operational Workflow

```ts
import { createPostgresStrategyOperations } from "@vip/strategy-engine/integration";

const operations = createPostgresStrategyOperations();

await operations.persistence.persistWeeklyStrategy(strategy, {
  actor: { type: "SYSTEM", id: "weekly-scheduler" },
});

await operations.lifecycle.transition({
  workspaceId: strategy.workspaceId,
  recommendationId: strategy.recommendations[0].id,
  toStatus: "ACCEPTED",
  actor: { type: "USER", id: "workspace-owner" },
});
```

The PostgreSQL migration is located at `packages/database/prisma/migrations/20260525090000_strategy_operations/migration.sql`.

Future trend providers implement `SignalProvider`; LLM explanation layers implement `LlmExplanationAugmenter`; autonomous agents and forecasting systems can consume `StrategyOutboxEvent` records without changing lifecycle or scoring behavior.
