# VIP Deployment Guide

Generated: 2026-06-05.

## Production Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| DATABASE_URL | Yes | PostgreSQL connection for Prisma. |
| OPENAI_API_KEY | Yes for AI content generation | Daily Growth Mission content package generation and AI APIs. |
| OPENAI_MODEL | Optional | Defaults to gpt-4.1-mini in Daily Growth Mission. |
| NEXT_PUBLIC_APP_URL / base URL | Recommended | API audit and absolute links where deployed environment needs canonical URL. |
| JWT/Auth provider secrets | Yes when auth enabled | Admin/doctor/production/staff access control. |
| SMTP/email provider vars | Optional/replace mock | Email service currently has mock behavior and needs production provider configuration. |
| Redis/BullMQ vars | Optional/required for queue mode | Action and automation queue production mode. |

## Migration Order

1. Back up production database.
2. Apply baseline Prisma migrations in timestamp order from packages/database/prisma/migrations.
3. Apply Daily Growth Mission migrations including mission tables and PilotQualityReview.
4. Run prisma generate after stopping Node processes that lock the Windows Prisma engine, if deploying from Windows.
5. Validate with prisma validate and a smoke query against Workspace, MissionExecution, EventEnvelope, ActionPlan and ApprovalRequest.

## Build Steps

1. Install workspace dependencies for apps/web, apps/api and packages used by production.
2. Run packages/database prisma validate and prisma generate.
3. Run TypeScript checks for apps/web and key packages.
4. Run package tests for event-orchestrator, action-engine, automation-engine, autonomous-operations, agent-runtime and focused web/API tests.
5. Build apps/web.
6. Build apps/api if Nest API is deployed.

## Deployment Steps

1. Deploy database migrations.
2. Deploy web app with production env vars.
3. Deploy API app if used by the target environment.
4. Start queue workers for action-engine and automation-engine if BullMQ mode is enabled.
5. Verify /admin/system/ai-health, /admin/system/api-audit and /admin/system/platform-verification.
6. Run one Daily Growth Mission on a real workspace and confirm Mission Control and Pilot Operations Console load.

## Rollback Plan

1. Disable Daily Growth Mission scheduler and queue workers.
2. Revert application deployment to previous image/build.
3. Keep new database tables in place unless rollback requires schema removal; they are additive and should not harm prior code.
4. If a migration must be reverted, restore from backup rather than dropping production data.
5. Preserve EventEnvelope, AIExecutionTrace, ActionPlan and MissionExecution rows for incident review.

## Preflight Checklist

| Check | Command / Surface | Pass Criteria |
| --- | --- | --- |
| Prisma schema | npx prisma validate --schema packages/database/prisma/schema.prisma | Schema valid. |
| Web TypeScript | cd apps/web; npx tsc --noEmit | No TypeScript errors. |
| Event orchestrator tests | cd packages/event-orchestrator; npm test | All tests pass. |
| Autonomous operations tests | cd packages/autonomous-operations; npm test | Daily Growth Mission tests pass. |
| Production routes | /admin/workspaces/{id}/mission-control and /admin/workspaces/{id}/pilot-operations | Pages render and show persisted mission history. |
| Remove/guard test APIs | /api/test-agent, /api/test-ingest, /api/social/test-ingest | Not reachable in production. |
