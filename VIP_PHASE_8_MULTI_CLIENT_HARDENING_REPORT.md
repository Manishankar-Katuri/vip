# VIP Phase 8 Multi-Client Hardening Report

## Summary
Phase 8 adds a canonical owner client layer backed by `Workspace`, with operational settings, integration health summaries, recipient readiness, report/workflow context, and owner-facing `/clients` pages. Existing recipient APIs and old role/admin routes remain preserved.

No automatic sending, scheduled delivery execution, workflow visualizer work, report generation engine changes, source deletion, or destructive cleanup was performed.

## Files Changed
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260608173000_client_operational_settings/migration.sql`
- `packages/database/src/client.ts`
- `packages/database/src/generated/client/*` refreshed by `npm run prisma:generate`
- `apps/web/src/lib/clients/types.ts`
- `apps/web/src/lib/clients/mapper.ts`
- `apps/web/src/lib/clients/service.ts`
- `apps/web/src/lib/clients/index.ts`
- `apps/web/src/lib/clients/client-mapper.test.ts`
- `apps/web/tsconfig.client-test.json`
- `apps/web/package.json`
- `apps/web/src/app/api/clients/route.ts`
- `apps/web/src/app/api/clients/[clientId]/route.ts`
- `apps/web/src/components/owner/owner-clients-page.tsx`
- `apps/web/src/components/owner/owner-client-detail-page.tsx`
- `apps/web/src/app/clients/[clientId]/page.tsx`
- `VIP_PHASE_8_MULTI_CLIENT_HARDENING_REPORT.md`

## Routes Added
- `GET /api/clients`
- `GET /api/clients/[clientId]`
- `PATCH /api/clients/[clientId]`

## Routes Preserved
- `GET /api/clients/[clientId]/recipients`
- `POST /api/clients/[clientId]/recipients`
- `PATCH /api/clients/[clientId]/recipients/[recipientId]`
- `DELETE /api/clients/[clientId]/recipients/[recipientId]`
- Legacy owner/admin/role routes including `/admin`, `/doctor`, `/staff`, `/production`, `/admin/hospitals`, and `/admin/integrations`

## Data Model
Added `ClientOperationalSettings` as a one-to-one operational settings model for `Workspace`.

Stored settings:
- client status, business type, location, timezone
- workflow schedule settings
- approval policy settings
- report preference settings

Approval guardrails:
- manual approval is forced on by normalization
- auto-send is forced off by normalization
- report type preferences are filtered to known report types only

## API Behavior
- `GET /api/clients` lists canonical owner clients from `Workspace`.
- `GET /api/clients/[clientId]` accepts workspace id, slug, or exact name.
- Client details include recent workflows, recent reports, recipients, setup warnings, and integration health.
- `PATCH /api/clients/[clientId]` upserts only operational settings.
- Integration health is summarized from `HospitalIntegrationConfig` matched through `HospitalWorkspace` slug/name/id where available.
- Secret fields such as `encryptedCredentials` are not returned.

## UI Updates
- `/clients` now uses `GET /api/clients` instead of inferring clients from reports/workflows.
- `/clients` shows readiness counts, integration attention, recipient count, approval count, failed send count, and schedule state.
- `/clients/[clientId]` now manages:
  - client profile/status
  - workflow schedule preferences
  - approval policy with manual approval enforced
  - report preferences
  - report recipients through the preserved recipient APIs
  - integration health
  - recent workflows and reports

## Tenant Isolation Tests
Added `apps/web/src/lib/clients/client-mapper.test.ts`.

Covered:
- report/workflow/recipient counts remain scoped to the selected workspace
- invalid or cross-workspace rows do not affect another client summary
- manual approval cannot be disabled by settings patches
- auto-send cannot be enabled by settings patches
- invalid report types are filtered
- integration health does not expose encrypted credential values

## Known Gaps for Later Phases
- Integration health is a summary of existing config state, not a live connectivity test.
- Workflow schedule settings are stored but do not execute scheduled runs.
- Report preferences are stored but do not yet drive automatic report generation or sending.
- Hospital-to-workspace matching remains conservative by id/slug/name because the codebase still has both `Workspace` and `HospitalWorkspace`.
- Broader user/member/API key isolation policies should be audited in a later backend hardening phase.

## Validation Results
- Prisma generate:
  - Command: `npm run prisma:generate`
  - Directory: `packages/database`
  - Result: Passed.
- Prisma validate:
  - Command: `npx prisma validate --schema prisma/schema.prisma`
  - Directory: `packages/database`
  - Result: Passed.
- TypeScript:
  - Command: `npx tsc --noEmit --pretty false`
  - Directory: `apps/web`
  - Result: Passed.
- Workflow tests:
  - Command: `npm run test:workflows`
  - Directory: `apps/web`
  - Result: Passed, 4 tests.
- Client tests:
  - Command: `npm run test:clients`
  - Directory: `apps/web`
  - Result: Passed, 3 tests.
- Lint:
  - Command: `npm run lint`
  - Directory: `apps/web`
  - Result: Passed.
- Production build:
  - Command: `npm run build`
  - Directory: `apps/web`
  - Result: Passed.
- Local route smoke:
  - Command: `Invoke-WebRequest http://localhost:3000/clients`
  - Result: Passed, rendered HTTP 200 from the already-running dev server.
- Local API smoke:
  - Command: `Invoke-WebRequest http://localhost:3000/api/clients?limit=1`
  - Result: Blocked by environment database connectivity. The API returned Prisma's database reachability error for `aws-1-ap-southeast-2.pooler.supabase.com:5432`.

Build notes:
- The existing Next.js `middleware` convention deprecation warning still appears.
- The existing Turbopack/NFT trace warning involving `next.config.ts`, generated Prisma client, and `api/admin/engagement-analytics` still appears.

## Blockers
No code implementation blockers remain for Phase 8.

Runtime blocker:
- Local live API data loading requires database connectivity or a local database with the Phase 8 migration applied. The current dev server could not reach the configured Supabase Postgres host during the smoke check.

Git note:
- `git status` could not be used because `C:\Users\manis\Documents\VIP` is not currently inside a Git repository.
