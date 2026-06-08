# VIP Phase 2 Workflow Backend Report

## Files Changed

- `apps/web/src/lib/workflows/types.ts`
  - Added the stable workflow backend response contract types.
- `apps/web/src/lib/workflows/mapper.ts`
  - Added pure mapping functions for workflow list items, run objects, steps, timelines, data sources, and retry summaries.
- `apps/web/src/lib/workflows/service.ts`
  - Added database-backed workflow service that reuses existing daily growth mission, action execution, event, AI trace, failure, approval, report, PDF export, and integration records.
- `apps/web/src/lib/workflows/index.ts`
  - Added workflow contract exports.
- `apps/web/src/app/api/workflows/route.ts`
  - Added workflow list API.
- `apps/web/src/app/api/workflows/[runId]/route.ts`
  - Added workflow detail API.
- `apps/web/src/app/api/workflows/[runId]/retry/route.ts`
  - Added guarded workflow retry API.
- `apps/web/src/app/api/workflows/manual-start/route.ts`
  - Added manual workflow start API.
- `apps/web/src/lib/workflows/workflow-mapper.test.ts`
  - Added mapper unit tests.
- `apps/web/tsconfig.workflow-test.json`
  - Added targeted workflow test TypeScript config.
- `apps/web/package.json`
  - Added `test:workflows`.

## APIs Added

- `GET /api/workflows`
  - Returns `{ workflows, filters }`.
  - Supports `clientId`, `status`, `date`, and `limit` query params.
- `GET /api/workflows/[runId]`
  - Returns `{ run, timeline, steps, agentActivity, apiCalls, dataSources, reports, approvals, errors, retrySummary }`.
- `POST /api/workflows/[runId]/retry`
  - Retries only when the run is failed or has retryable errors.
  - Returns `409` if retry is not allowed.
- `POST /api/workflows/manual-start`
  - Requires `workspaceId` or `clientId`.
  - Calls the existing `runDailyGrowthMission` service and returns the workflow detail contract.

## Existing Models Reused

- `MissionExecution`
- `EventEnvelope`
- `ActionPlan`
- `ActionExecution`
- `ExecutionStep`
- `ExecutionFailure`
- `ApprovalRequest`
- `AIExecutionTrace`
- `DailyBusinessSnapshot`
- `DailyGrowthReport`
- `PdfExportRun`
- `ContentProductionPackage`
- `OperationalError`
- `EventDeadLetter`
- `HospitalIntegrationConfig`
- `Workspace`
- `HospitalWorkspace`

## New Models Added

None.

No schema change or migration was added. API/data source summaries are derived from existing snapshots, integrations, events, and mission metadata.

## Mapping Decisions

- `MissionExecution` is the canonical workflow run for Phase 2.
- `MissionExecution.workspaceId` is exposed as both `workspaceId` and `clientId` until Phase 8 resolves the client/workspace naming model.
- `MissionExecution.currentPhase` is mapped into the production workflow phase list:
  - Workflow started
  - Client selected
  - Social data pulled
  - Google Business Profile data pulled
  - Reviews analyzed
  - Analytics generated
  - Intelligence generated
  - Strategy generated
  - Content plan generated
  - Report draft generated
  - Waiting for approval
  - Completed / sent / failed
- Missing step evidence is marked as `pending`, `unknown`, or `skipped`; the mapper does not fake success.
- Timeline events are derived from `EventEnvelope`, plus AI traces, reports, approvals, and errors.
- Data source/API summaries are derived from `DailyBusinessSnapshot.sourceStatuses` and `HospitalIntegrationConfig`.
- Reports are currently mapped from `DailyGrowthReport` and linked `PdfExportRun`.
- Approvals are mapped from `ApprovalRequest` records attached to the daily growth action plan.
- Action plan lookup uses the same SHA-256 idempotency key as the existing daily mission service.

## Known Limitations

- There is still no first-class `ApiCallLog` model. Provider/API cards are derived from snapshots and integration status.
- Workflow retry is a guarded manual rerun through the existing daily growth mission service; individual step retry is not wired yet.
- Report details are limited to existing daily growth reports and PDF export metadata.
- DOCX URLs are always `null` because DOCX export is Phase 4/5 scope.
- Sent status is `not_sent` because approval/send flow is Phase 6 scope.
- The API contract is stable for Phase 3, but the visual workflow UI has not been implemented.

## Retry Behavior

- Retry is allowed when:
  - workflow status is failed, or
  - mapped errors include a retryable failure.
- Retry is rejected with `409` when:
  - workflow is completed,
  - workflow is running or queued,
  - workflow is waiting for approval,
  - no retryable failure exists.
- Retry calls `runDailyGrowthMission(workspaceId)` and then returns the workflow detail contract for the created/reused run.
- The API never returns fake retry success.

## Manual Start Behavior

- `POST /api/workflows/manual-start` requires `workspaceId` or `clientId`.
- It calls `runDailyGrowthMission(workspaceId)`.
- The existing daily mission idempotency behavior is preserved: if today's workflow already exists, it is reused/resumed according to existing service rules.
- The response returns the same workflow detail contract as `GET /api/workflows/[runId]`.

## Validation Results

- TypeScript:
  - Command: `npx tsc --noEmit --pretty false`
  - Result: Passed.
- Workflow mapper unit tests:
  - Command: `npm run test:workflows`
  - Result: Passed, 4 tests.
- Lint:
  - Command: `npm run lint`
  - Result: Passed.
- Production build:
  - Command: `npm run build`
  - Result: Passed.
  - Note: the existing Next/Turbopack warning about `next.config.ts` and generated Prisma client tracing still appears. It does not block the build and is unrelated to the Phase 2 API routes.

## Phase 3 Recommendations

- Build `/workflows` against `GET /api/workflows`.
- Build `/workflows/[runId]` against `GET /api/workflows/[runId]`.
- Use the returned `steps`, `timeline`, `agentActivity`, `dataSources`, `reports`, `approvals`, `errors`, and `retrySummary` directly instead of re-querying old admin APIs.
- Show retry controls only when `retrySummary.retryable` is true.
- Keep old admin daily mission APIs available until the visualizer is fully validated.

