# VIP Phase 6 Approval Send Report

## Summary
Phase 6 implements explicit owner approval and send flow for `ReportDraft` records. Reports can now be moved through approval states, recipient lists can be managed per client/workspace, and approved exported reports can be sent only by explicit owner action.

No automatic sending, background scheduled delivery, old route deletion, unrelated page refactors, or approval bypasses were implemented.

## Files Changed
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260608163000_report_approval_send_flow/migration.sql`
- `packages/database/src/client.ts`
- `packages/database/src/generated/client/*` via `prisma generate`
- `apps/web/src/lib/reports/types.ts`
- `apps/web/src/lib/reports/service.ts`
- `apps/web/src/lib/reports/email-provider.ts`
- `apps/web/src/app/api/reports/[reportId]/approval/route.ts`
- `apps/web/src/app/api/reports/[reportId]/send/route.ts`
- `apps/web/src/app/api/reports/[reportId]/deliveries/route.ts`
- `apps/web/src/app/api/clients/[clientId]/recipients/route.ts`
- `apps/web/src/app/api/clients/[clientId]/recipients/[recipientId]/route.ts`
- `apps/web/src/components/reports/report-system.tsx`
- `apps/web/src/components/reports/report-ops-panels.tsx`
- `apps/web/src/app/approvals/page.tsx`
- `apps/web/src/app/clients/[clientId]/page.tsx`
- `VIP_PHASE_6_APPROVAL_SEND_REPORT.md`

## APIs Added
- `GET /api/reports/[reportId]/approval`
- `POST /api/reports/[reportId]/approval`
- `POST /api/reports/[reportId]/send`
- `GET /api/reports/[reportId]/deliveries`
- `GET /api/clients/[clientId]/recipients`
- `POST /api/clients/[clientId]/recipients`
- `PATCH /api/clients/[clientId]/recipients/[recipientId]`
- `DELETE /api/clients/[clientId]/recipients/[recipientId]`

## Models and Migrations Added
Added migration:
- `20260608163000_report_approval_send_flow`

Added models:
- `ReportApproval`
- `ReportRecipient`
- `ReportDelivery`

These models keep report approval history, client recipient settings, and delivery attempts separate from legacy action-plan approvals and content execution delivery logs.

## Approval Behavior
`POST /api/reports/[reportId]/approval` supports:
- `request_approval`
- `approve`
- `request_changes`
- `reject`

Rules implemented:
- Missing reports return `404`.
- Archived reports cannot be approved.
- Rejected reports cannot be approved without being moved back through review.
- `request_approval` sets `ReportDraft.approvalStatus` to `pending` and status to `ready_for_review`.
- `approve` sets approval status to `approved` and report status to `approved`.
- `request_changes` sets approval status to `changes_requested` and report status to `draft`.
- `reject` sets approval status to `rejected` and report status to `failed`.
- Approval history is kept in `ReportApproval`.

## Recipient Behavior
Client/workspace recipients are managed through `/api/clients/[clientId]/recipients`.

Rules implemented:
- Email format is validated.
- Recipients are unique per workspace/email.
- Recipients can be enabled/disabled for reports with `receivesReports`.
- `/clients/[clientId]` now includes a report recipient management section.

## Send Behavior
`POST /api/reports/[reportId]/send` enforces:
- Report must exist.
- Report must be approved.
- Report must not be archived.
- Requested export format must exist as a completed `ReportExport`.
- At least one valid recipient must be provided.
- Attachments are resolved only from completed exports for that same report.
- Sending is explicit only; there is no automatic delivery.

Delivery attempts are recorded in `ReportDelivery`. `ReportDraft.sentStatus` is updated to `sent` only when at least one provider send succeeds, otherwise `failed` when attempts fail.

## Email Provider Behavior
Added `apps/web/src/lib/reports/email-provider.ts`.

Provider requirements:
- `REPORTS_EMAIL_ENABLED=true`
- `RESEND_API_KEY`
- `REPORTS_FROM_EMAIL`

If the provider is not configured, delivery records are marked `failed` with a clear reason. The app does not fake success in production or default mode.

## UI Updates
- `/reports/[reportId]`
  - Approval panel with request approval, approve, request changes, reject, notes, and history.
  - Send panel with eligibility checks, recipient selector, manual recipient email, format selector, message, and delivery history.
  - Send button is disabled until report is approved, selected export exists, and a recipient is present.
- `/approvals`
  - Connected report approval queue listing report drafts ordered by approval priority.
  - Links each item to report detail for action.
- `/clients/[clientId]`
  - Connected report recipient management with add, enable/disable, and delete.

## Workflow/Report Status Updates
The workflow visualizer already reads `ReportDraft` approval/export/sent snapshots from Phase 5 report linking. No workflow behavior change was required.

## Security Decisions
- Email addresses are validated.
- Notes and messages are sanitized and length-limited.
- Request bodies cannot specify attachment paths.
- Attachments must come from completed `ReportExport` records for the same report.
- Attachment paths are resolved only under `public/generated/reports`.
- No credentials are exposed in UI or stored in delivery records.
- Sending archived, rejected, unapproved, or unexported reports is blocked.

## Known Limitations
- Email sending uses Resend only when configured through environment variables.
- There is no background retry worker yet.
- Approval identity is a free-form `decidedBy` field until auth identity is wired into owner actions.
- `/approvals` provides a connected queue and report links, but quick inline approve/reject actions remain for a later refinement.
- No browser smoke test was performed because a callable local browser control tool was not exposed in this session.

## Validation Results
- Prisma generate:
  - Command: `npm run prisma:generate`
  - Result: Passed.
- Prisma schema validation:
  - Command: `npx prisma validate --schema prisma/schema.prisma`
  - Result: Passed.
- TypeScript:
  - Command: `npx tsc --noEmit --pretty false`
  - Result: Passed.
- Workflow tests:
  - Command: `npm run test:workflows`
  - Result: Passed, 4 tests.
- Lint:
  - Command: `npm run lint`
  - Result: Passed.
- Production build:
  - Command: `npm run build`
  - Result: Passed on retry.

Build notes:
- The first build attempt failed because Next could not fetch Google Fonts for Inter and Geist Mono. The second build attempt succeeded.
- The successful build still emitted the existing `middleware` convention deprecation warning.
- The successful build still emitted the existing Turbopack/NFT trace warning involving `next.config.ts`, generated Prisma client, and an admin analytics API route.

## Phase 7 Recommendations
- Add authenticated owner identity to approval decisions.
- Add recipient groups and default recipients on client settings.
- Add delivery retry actions and provider error details.
- Add inline quick approval actions on `/approvals`.
- Add a dedicated client communication history page.
