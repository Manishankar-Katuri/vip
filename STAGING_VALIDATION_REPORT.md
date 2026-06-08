# VIP Clean Staging Validation Report

Generated: 2026-06-05

## Executive Decision

**Staging validation status:** **NOT VALIDATED**

The application build and local startup checks passed, and Prisma can generate a complete clean schema SQL script from zero. However, a completely fresh PostgreSQL staging database was not available in this environment, so migrations could not be applied from zero and Daily Growth Mission could not be executed against a clean staging database.

Per the requested rule, staging is **not considered validated** because not all checks passed.

## Deployment Readiness Score

| Score | Result |
| --- | ---: |
| Deployment Readiness | 48/100 |

Score rationale:

- Build and package health are strong.
- Prisma schema generation is valid.
- No clean staging database was provisioned.
- Migration deploy/status from zero was not verified.
- Daily Growth Mission was not executed against clean persisted staging data.
- Role-permission smoke testing found a staging-relevant route protection gap.

## Validation Matrix

| # | Check | Result | Evidence |
| ---: | --- | --- | --- |
| 1 | Create a new empty staging database | BLOCKED | No local `docker`, `psql`, `postgres`, `initdb`, or PostgreSQL service was available. WSL is not installed. Existing remote databases were intentionally not modified. |
| 2 | Apply all migrations from zero | BLOCKED | No fresh PostgreSQL target was available. No migration was executed. |
| 3 | Verify migration chain integrity | PARTIAL | `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` generated clean SQL from zero: 2,175 lines / 104,186 characters. Actual application to PostgreSQL was not verified. |
| 4 | Verify Prisma generate | PASS | `packages/database`: `npm run prisma:generate` completed successfully with Prisma Client v6.19.3. |
| 5 | Verify Prisma migrate status | BLOCKED | Requires a real clean staging database after migration application. Existing remote DBs were not touched. |
| 6 | Deploy application to staging | PARTIAL | A local staging-style production server was started from the compiled web bundle on port `3200`. No external staging deployment was performed. |
| 7 | Verify application startup | PASS | `/login` returned `200` from the compiled production server. |
| 8 | Verify authentication | PARTIAL | Unauthenticated `/overview` returned `307`, indicating auth redirect behavior. Full login/auth provider flow was not verified. |
| 9 | Verify role permissions | FAIL | `/admin/users` returned `200` with a doctor-role cookie because it is in `PUBLIC_VISUAL_PREVIEW_PATHS` at `apps/web/src/middleware.ts:18` and `apps/web/src/middleware.ts:25`. |
| 10 | Execute Daily Growth Mission | BLOCKED | Not executed to avoid writing to existing remote databases. Requires clean staging DB and workspace. |
| 11 | Generate Daily Growth Report | BLOCKED | Depends on mission execution. |
| 12 | Generate PDF | BLOCKED | Depends on mission execution and `PdfExportRun`. |
| 13 | Generate Content Package | BLOCKED | Depends on mission execution and `ContentProductionPackage`. |
| 14 | Create Approval Requests | BLOCKED | Depends on mission execution and `ApprovalRequest`. |
| 15 | Create Production Tasks | BLOCKED | Depends on mission execution and `OperationalTask`. |
| 16 | Verify Mission Control | BLOCKED | Route exists, but clean DB-backed mission data was not available. Local smoke returned `307` for `/admin/workspaces/staging-workspace/mission-control`. |
| 17 | Verify Pilot Operations Console | BLOCKED | Route exists, but clean DB-backed pilot data was not available. Local smoke returned `307` for `/admin/workspaces/staging-workspace/pilot-operations`. |

## Migration Success

**Result:** **BLOCKED**

Verified:

- Prisma schema validation passed:

```text
npx prisma validate --schema prisma/schema.prisma
```

- Prisma client generation passed:

```text
npm run prisma:generate
```

- Clean SQL generation from zero passed:

```text
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

Not verified:

- New empty PostgreSQL database creation.
- Applying `packages/database/prisma/migrations/*` from zero.
- `prisma migrate status` against that clean database.

Reason:

```text
No safe fresh PostgreSQL target was available locally:
- docker: unavailable
- psql/createdb/postgres/initdb: unavailable
- PostgreSQL Windows service: none found
- WSL: not installed
```

## Build Success

**Result:** **PASS WITH WARNINGS**

Passed:

| Area | Command | Result |
| --- | --- | --- |
| Web lint | `apps/web`: `npm run lint` | PASS |
| Web TypeScript | `apps/web`: `npx tsc --noEmit` | PASS |
| Web production build | `apps/web`: `npm run build` | PASS |
| API build | `apps/api`: `npm run build` | PASS |
| API tests | `apps/api`: `npm test -- --runInBand` | PASS, 10 suites / 28 tests |
| Autonomous operations tests | `packages/autonomous-operations`: `npm test` | PASS, includes Daily Growth Mission unit/integration tests |
| Event orchestrator tests | `packages/event-orchestrator`: `npm test` | PASS |
| Action engine tests | `packages/action-engine`: `npm test` | PASS |

Warnings:

- Next.js 16 warns that the `middleware` convention is deprecated and should move to `proxy`.
- Turbopack reports an NFT tracing warning through the generated Prisma client import path.

## Startup Success

**Result:** **PASS, local only**

A compiled web server was started with staging-style environment values on port `3200`.

Smoke results:

| Route | Result |
| --- | --- |
| `/login` | `200` |
| `/overview` unauthenticated | `307` redirect |

This confirms the web artifact starts locally. It does not prove external staging deployment, production hosting configuration, or database-backed route health.

## Mission Success

**Result:** **BLOCKED**

Daily Growth Mission was not executed against a clean staging database because no clean staging database was available.

Validated only through package tests:

- Manual trigger idempotency.
- 5:00 AM scheduler calculation.
- Phase execution over persisted fixture records.
- Missing integrations stored as `NOT_CONFIGURED` instead of mocked data.

Code paths present:

| Capability | Code Location |
| --- | --- |
| Mission run API | `apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/run/route.ts` |
| Mission runtime | `apps/web/src/lib/daily-growth-mission.ts:55` |
| PDF generation path | `apps/web/src/lib/daily-growth-mission.ts:197` |
| Report persistence | `apps/web/src/lib/daily-growth-mission.ts:210` |
| Approval requests | `apps/web/src/lib/daily-growth-mission.ts:417` |
| Production tasks | `apps/web/src/lib/daily-growth-mission.ts:432` |
| Mission Control UI | `apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx` |
| Pilot Operations UI | `apps/web/src/app/admin/workspaces/[id]/pilot-operations/page.tsx` |

Database models required for the real mission path:

| Model | Schema Location |
| --- | --- |
| `MissionExecution` | `packages/database/prisma/schema.prisma:883` |
| `ContentProductionPackage` | `packages/database/prisma/schema.prisma:1037` |
| `DailyGrowthReport` | `packages/database/prisma/schema.prisma:1079` |
| `PilotQualityReview` | `packages/database/prisma/schema.prisma:1144` |
| `ApprovalRequest` | `packages/database/prisma/schema.prisma:1467` |
| `OperationalTask` | `packages/database/prisma/schema.prisma:537` |
| `PdfExportRun` | `packages/database/prisma/schema.prisma:862` |

## Authentication And Permissions

**Authentication:** **PARTIAL PASS**

- Unauthenticated `/overview` redirected, indicating route protection is active for protected portal paths.

**Role permissions:** **FAIL**

Smoke test result:

```text
/admin/users with ADMIN cookie  -> 200
/admin/users with DOCTOR cookie -> 200
```

Cause:

- `/admin/users` is listed in `PUBLIC_VISUAL_PREVIEW_PATHS`.
- The middleware allows those paths before permission checks.
- Relevant code:
  - `apps/web/src/middleware.ts:18`
  - `apps/web/src/middleware.ts:25`
  - `apps/web/src/middleware.ts:84`

Impact:

- Role-based permission enforcement is not cleanly validated for staging.
- The route may still gate UI controls client-side with `PermissionGate`, but request-level route protection allowed a non-admin role through the page route.

## Mission Control And Pilot Operations

**Result:** **BLOCKED**

The routes exist and build successfully, but could not be validated with real clean staging mission data.

Local smoke:

| Route | Result |
| --- | --- |
| `/admin/workspaces/staging-workspace/mission-control` | `307` |
| `/admin/workspaces/staging-workspace/pilot-operations` | `307` |

Required future validation:

- Run mission on clean staging workspace.
- Confirm `MissionExecution` exists.
- Confirm `DailyGrowthReport` and `PdfExportRun` exist.
- Confirm `ContentProductionPackage` exists.
- Confirm `ApprovalRequest` rows exist.
- Confirm `OperationalTask` rows exist.
- Load Mission Control with persisted mission data.
- Load Pilot Operations Console with persisted pilot/quality data.

## Remaining Errors

| Severity | Error | Impact | Fix Required |
| --- | --- | --- | --- |
| P0 | No fresh staging PostgreSQL database available | Migrations cannot be applied from zero; `migrate status` cannot be validated. | Provision an empty staging PostgreSQL database reachable from this machine/CI. |
| P0 | Daily Growth Mission not executed against clean staging DB | Report, PDF, package, approval, task, and learning validation cannot be completed. | Execute after fresh DB migration and staging workspace seed. |
| P1 | `/admin/users` allowed doctor-role request in smoke test | Role permission verification failed for at least one admin page. | Remove production/staging admin routes from public preview allowlist or make preview bypass dev-only. |
| P1 | External staging deploy not performed | Only local compiled startup was verified. | Deploy to actual staging host with clean staging env. |
| P2 | Next middleware deprecation warning | Build passes but deployment warning remains. | Migrate middleware to Next `proxy` convention. |
| P2 | Turbopack Prisma tracing warning | Build passes but server bundle tracing may be broader than intended. | Narrow Prisma import path or isolate server-only Prisma usage. |

## Required Clean Staging Path

To complete validation without touching production or existing remote databases:

1. Provision a new empty PostgreSQL database.
2. Set `DATABASE_URL` and `DIRECT_URL` only for that new staging database.
3. Run:

```powershell
cd packages/database
npm run prisma:generate
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

4. Seed one staging workspace and required user/role records.
5. Deploy `apps/web` and `apps/api` with clean staging env.
6. Run route/auth/permission smoke tests.
7. Execute:

```http
POST /api/admin/workspaces/{workspaceId}/daily-growth-mission/run
```

8. Approve doctor and production approvals.
9. Re-run/resume mission if required by the approval gate.
10. Verify persisted outputs:

```text
MissionExecution
DailyBusinessSnapshot
DailyPerformanceReport
StrategyOutcome
TrendOpportunity
ContentBrief
ContentProductionPackage
DailyGrowthReport
PdfExportRun
ApprovalRequest
OperationalTask
OperationalNotification
ContentOutcome
AgentLearningMemory
PilotQualityReview
```

## Final Recommendation

**Do not mark staging validated yet.**

The codebase is buildable and the mission package tests pass, but the requested clean staging validation requires a real empty PostgreSQL database and a real staging deployment. Those were not available in this environment, and at least one role-permission smoke test failed.
