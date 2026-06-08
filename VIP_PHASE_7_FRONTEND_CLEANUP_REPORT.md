# VIP Phase 7 Frontend Cleanup Report

## Summary
Phase 7 makes the workflow-first owner experience the primary product surface without deleting legacy role routes or changing backend engines. The owner pages now summarize real workflow/report data where available and clearly route users toward production operations.

## Files Changed
- `apps/web/src/components/owner/owner-command-center.tsx`
- `apps/web/src/components/owner/owner-source-pages.tsx`
- `apps/web/src/components/owner/owner-clients-page.tsx`
- `apps/web/src/app/overview/page.tsx`
- `apps/web/src/app/analytics/page.tsx`
- `apps/web/src/app/intelligence/page.tsx`
- `apps/web/src/app/strategy/page.tsx`
- `apps/web/src/app/content-plan/page.tsx`
- `apps/web/src/app/clients/page.tsx`
- `apps/web/src/app/settings/page.tsx`
- `VIP_PHASE_7_FRONTEND_CLEANUP_REPORT.md`

## Pages Updated
- `/overview`
  - Replaced the old broad module dashboard with an owner command center.
  - Uses `/api/workflows` and `/api/reports`.
  - Shows workflow status, recent workflows, reports needing approval, reports ready to export/send, failures, client reminders, and quick links.
- `/analytics`
  - Keeps Daily Analytics Report generation.
  - Shows recent analytics reports.
  - Uses owner-friendly language: what changed, why it matters, what to do next.
  - Preserves links to deeper analytics pages.
- `/intelligence`
  - Replaced shell copy with a real owner intelligence landing page.
  - Shows recent relevant reports and workflow risks/patterns from current APIs.
  - Preserves links to admin intelligence pages.
- `/strategy`
  - Keeps Daily Strategy Report generation.
  - Shows recent strategy reports.
  - Frames recommendations as priority, reason, expected impact, and action needed.
- `/content-plan`
  - Keeps Three-Day Content Plan generation.
  - Shows recent content plan reports.
  - Uses simple labels and avoids marketing jargon.
- `/clients`
  - Shows client/workspace ids inferred from real workflow and report records.
  - Provides a manual client/workspace id entry path.
  - Explains integrations, recipients, workflow schedule, approval settings, and report preferences.
- `/settings`
  - Shows production setup status for report email settings without exposing secrets.
  - Shows generated report storage path, workflow/manual-start note, and setup links.

## Legacy Routes Preserved
- `/admin`
- `/doctor`
- `/staff`
- `/production`
- `/admin/analytics/*`
- `/admin/intelligence/*`
- `/admin/strategy/*`
- `/reports/content-execution`
- `/production/content-*`
- Existing doctor/staff/production approval and report pages

No old source files or routes were deleted.

## Legacy Routes Labeled
The owner navigation already labels the top-level admin path as `Legacy admin`. Owner pages now describe preserved deep links as legacy/admin/role-specific surfaces where appropriate. No invasive banners were added inside shared role shells to avoid breaking role route behavior.

## Duplicate Pages Identified
- `/analytics` now acts as the owner analytics entry while `/admin/analytics/*` remains detailed legacy/admin analytics.
- `/intelligence` now acts as the owner intelligence entry while `/admin/intelligence/*` remains detailed legacy/admin intelligence.
- `/strategy` now acts as the owner strategy entry while `/admin/strategy/*` and `/strategy/*` remain detailed strategy surfaces.
- `/content-plan` now acts as the owner content entry while `/production/content-*` and `/reports/content-execution` remain preserved execution surfaces.
- `/approvals` is the owner report approval queue while role-specific approval routes remain available.

## Archive Candidates
Do not delete yet. These should be reviewed in a later cleanup phase:
- `apps/web/src/app/design-mockups`
- Local log files such as `web-start-smoke.*.log`
- Generated report/content artifacts under public generated folders after confirming database references
- Duplicate legacy dashboards under role routes once owner workflow adoption is validated
- Old planning/audit markdown files if the project later moves them into docs/archive

## Do-Not-Delete-Yet Items
- `/admin`, `/doctor`, `/staff`, `/production`
- `/reports/content-execution`
- Existing content execution APIs and generated documents
- Existing admin analytics/intelligence/strategy pages
- Existing report export files under `apps/web/public/generated/reports`

## Remaining Frontend Gaps
- `/approvals` still links to report detail for actions rather than supporting inline quick approve/reject.
- `/clients` infers active clients from workflows/reports because there is no final owner client list API yet.
- Client detail currently focuses on report recipients; integrations, workflow schedules, approval policy, and report preferences still need richer UI.
- Settings does not run live provider connectivity checks; it only reports environment variable presence.
- Legacy role pages are preserved but not fully visually labeled inside every route.

## Validation Results
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
  - Result: Passed.

Build notes:
- The successful build emitted the existing `middleware` convention deprecation warning.
- The successful build emitted the existing Turbopack/NFT trace warning involving `next.config.ts`, generated Prisma client, and an admin analytics API route.

## Phase 8 Recommendations
- Add a canonical owner client list API backed by the chosen client/workspace aggregate.
- Add workflow schedule and approval settings UI under `/clients/[clientId]`.
- Add inline approval actions to `/approvals`.
- Add legacy-route banners to shared role shells after confirming role UX expectations.
- Produce a dependency/reference report before archiving generated artifacts or duplicate legacy pages.
