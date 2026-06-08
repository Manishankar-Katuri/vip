# VIP Recommendation Engine

`@vip/recommendation-engine` converts measured social analytics shifts into validated, explainable recommendations that can be handed to approved workflow execution.

## Modules

- `types/`: recommendation, analytics, explanation, action, and lifecycle event contracts.
- `schemas/`: strict Zod schemas for API and persistence boundaries.
- `analyzers/`: derives engagement, reach, posting consistency, audience growth, content performance, and momentum signals from comparable periods.
- `scoring/`: transparent weighted scoring and priority assignment.
- `explanations/`: evidence-backed explanation payload generation with confidence, expected impact, and risk.
- `priority/`: builds recommendation drafts with scores and explanations, and ranks candidates.
- `repositories/`: storage and durable outbox abstraction for recommendation lifecycle operations.
- `events/`: typed event creation, guarded lifecycle mutations, and retryable outbox dispatch.

## Flow

```ts
import {
  RecommendationLifecycleService,
  RecommendationPriorityEngine,
  SignalAnalyzer,
} from "@vip/recommendation-engine";

const signals = new SignalAnalyzer().analyze({
  workspaceId: "workspace_1",
  previous,
  current,
  observedAt: new Date().toISOString(),
  source: "instagram-analytics",
});

const draft = new RecommendationPriorityEngine().build({
  workspaceId: "workspace_1",
  type: "ENGAGEMENT_RECOVERY",
  title: "Recover declining engagement",
  idempotencyKey: "recovery-2026-05-26",
  signals,
  actions: [{
    name: "Prepare recovery workflow",
    processor: "engagement-recovery",
    idempotencyKey: "recovery-action-2026-05-26",
    requiresApproval: true,
    input: {},
  }],
});

const recommendation = await new RecommendationLifecycleService(repository).create(draft);
```

## Durable Events

Lifecycle repository operations receive both the updated aggregate and its event so persistence implementations can commit them atomically. Each transition requires a stable operation id; repositories resolve `findEventByIdempotencyKey` so retried calls return the prior durable result. `RecommendationOutboxDispatcher` publishes pending events and records publication or failure independently from lifecycle mutations.

Emitted event types:

- `recommendation.created`
- `recommendation.updated`
- `recommendation.approved`
- `recommendation.rejected`
- `recommendation.executed`
