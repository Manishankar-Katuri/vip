# VIP Action Engine

`@vip/action-engine` executes approved strategy recommendations as durable, observable workflows.

## Modules

- `orchestration/`: idempotent plan creation, approval gates, queue routing, and schedules.
- `queue/`: `BullMqActionQueue` for Redis-backed production queues and an in-memory adapter for tests.
- `workers/`: processor registry, execution logging, retry policy, and dead-letter behavior.
- `persistence/`: Prisma/PostgreSQL adapter and deterministic mock repository.
- `integration/`: strategy-event consumer and PostgreSQL/BullMQ composition.
- `validation/`: safe workspace identifiers, bounded retries, and executable step validation.

## Workflow Types

The package supports social publishing, marketing playbooks, campaign execution, alert pipelines, and AI-generated action sequences. Each plan owns ordered typed steps and records executions, logs, failures, approvals, and action outbox events.

```ts
const { orchestrator } = createPostgresActionEngine({
  connection: { host: process.env.REDIS_HOST!, port: 6379 },
});

await orchestrator.createAndQueue({
  workspaceId,
  name: "Approved content rollout",
  type: "SOCIAL_PUBLISHING",
  idempotencyKey: "recommendation:123:rollout",
  requiresApproval: true,
  steps: [{ name: "Publish post", processor: "publish-social" }],
  actor: { type: "AI_COPILOT" },
});
```

Workers and queue storage remain replaceable for separate Kubernetes worker deployments.
