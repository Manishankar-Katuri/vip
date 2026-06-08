# VIP Staging Verification Checklist

## Environment

- [ ] `DATABASE_URL` and `DIRECT_URL` point to the same staging database.
- [ ] Database host resolves from the deployment runner.
- [ ] Port `5432` is reachable from the deployment runner.
- [ ] `JWT_SECRET` is set in API production runtime.
- [ ] `OPENAI_API_KEY` is set for AI content generation.
- [ ] Optional social/Google provider keys are either configured or intentionally unavailable.

## Database

- [ ] `npx prisma validate --schema prisma/schema.prisma`
- [ ] `npm run prisma:generate`
- [ ] `npx prisma migrate status --schema prisma/schema.prisma`
- [ ] Migration list matches `packages/database/prisma/migrations`.

## Build

- [ ] `cd apps/web && npm run lint`
- [ ] `cd apps/web && npx tsc --noEmit`
- [ ] `cd apps/web && npm run build`
- [ ] `cd packages/autonomous-operations && npm test`
- [ ] `cd packages/event-orchestrator && npm test`
- [ ] `cd packages/action-engine && npm test`
- [ ] `cd packages/automation-engine && npm test`

## Staging Mission

- [ ] Create or select one real staging workspace.
- [ ] Run `POST /api/admin/workspaces/{workspaceId}/daily-growth-mission/run`.
- [ ] Confirm `MissionExecution` is persisted.
- [ ] Confirm `DailyGrowthReport` and `PdfExportRun` records exist.
- [ ] Confirm approval requests exist.
- [ ] Confirm operational tasks and notifications exist.
- [ ] Confirm `AgentLearningMemory` records exist.
- [ ] Confirm Mission Control renders the latest execution.
- [ ] Confirm Pilot Operations Console renders the run and scorecard.

