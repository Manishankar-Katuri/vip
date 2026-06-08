# VIP Automation Engine

`@vip/automation-engine` consumes recommendation lifecycle events and executes mapped workflows through durable, retry-safe automation infrastructure.

## Runtime Infrastructure

- `repositories/PrismaAutomationRepository` atomically writes execution state, execution logs, and uniquely keyed outbox events using database transactions.
- `queue/` supplies validated BullMQ producers and consumers with stable operation-key job identifiers, delayed dispatch, exponential backoff support, and a dead-letter queue.
- `execution/` enforces the `QUEUED`, `SCHEDULED`, `RUNNING`, `RETRYING`, `FAILED`, `COMPLETED`, `ROLLED_BACK`, and `DEAD_LETTERED` lifecycle.
- `services/` contains recommendation triggering, cooldown/limit enforcement, dispatch coordination, retry-window orchestration, and dead-letter evaluation.
- `telemetry/` exposes instrumentation hooks for timing, retry scheduling, failure tracking, latency, state transitions, and throughput.

## Durable Events

Automation writes outbox records in the same transaction as lifecycle mutations:

- `automation.triggered`
- `automation.scheduled`
- `automation.started`
- `automation.retrying`
- `automation.failed`
- `automation.completed`
- `automation.rolled_back`
- `automation.dead_lettered`

## Integration

Apply the automation database migration, construct `PrismaAutomationRepository` using `createPostgresAutomationRepository()`, and provide BullMQ with a Redis-compatible `connection`. Recommendation events enter through `AutomationTriggerService`; newly queued executions are dispatched through `AutomationExecutionCoordinator`.

Required runtime configuration is supplied by integrating applications:

- `DATABASE_URL` for Prisma/PostgreSQL.
- Redis host, port, and optional credentials passed to the BullMQ connection options.
