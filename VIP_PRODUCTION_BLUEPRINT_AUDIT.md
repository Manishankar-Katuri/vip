# VIP Production Blueprint Audit

## 1. Executive Summary

The current VIP codebase is roughly 55-65% aligned with the production blueprint at the backend/domain level, but only about 35-45% aligned at the owner-facing product experience level.

The strongest existing matches are multi-workspace/hospital management, integrations, reviews, social analytics, strategy/recommendation engines, content planning, action execution, approval requests, AI execution traces, event orchestration, and a daily growth mission that already resembles the desired automated workflow. The largest gaps are the workflow-first navigation, a generalized report system, DOCX export, production email delivery, clear client recipient management, a live workflow visualizer tied to real workflow events, and cleanup of duplicated role/page structures.

Recommended direction: clean and align the product surface first, then harden workflow tracking and reports. Do not rebuild from scratch. Reuse `MissionExecution`, `ActionExecution`, `ExecutionStep`, `ExecutionLog`, `ExecutionFailure`, `AIExecutionTrace`, `ApprovalRequest`, `HospitalWorkspace`, `Workspace`, and the daily growth mission implementation as the foundation.

## 2. Current Architecture Found

- Apps:
  - `apps/api`: NestJS backend with modules for auth, admin, hospitals, integrations, GBP, review, strategy, overview, production/content, email, AI audit, workspace ingestion/knowledge/embeddings, and event intelligence.
  - `apps/web`: Next.js app with many role-based routes, API routes, operational pages, strategy pages, production pages, admin pages, doctor/staff surfaces, report/export utilities, and content execution flows.
- Database:
  - `apps/api/prisma/schema.prisma`: smaller API schema with hospital workspace, integrations, users, audit logs, content calendar/scripts, reviews, brand memory, event/intelligence trace models.
  - `packages/database/prisma/schema.prisma`: larger production schema with workspace, hospital workspace, integrations, social data, analytics snapshots, recommendations, action execution, automation, events, AI traces, PDF export runs, mission execution, daily growth reports, content execution documents, delivery logs, workspace members, roles, API keys, and subscription models.
- Packages:
  - Core engines: `packages/analytics-intelligence`, `packages/intelligence-engine`, `packages/intelligence-graph`, `packages/strategy-engine`, `packages/recommendation-engine`, `packages/causal-engine`, `packages/priority-engine`.
  - Workflow/runtime: `packages/autonomous-operations`, `packages/action-engine`, `packages/automation-engine`, `packages/agent-runtime`, `packages/copilot-runtime`, `packages/event-orchestrator`.
  - Platform/data: `packages/database`, `packages/shared`, `packages/control-plane`, `packages/observability`, `packages/market-intelligence`, `packages/social-engine`, `packages/learning-engine`, `packages/outcome-memory`.
- Frontend route groups:
  - Role surfaces: `/admin`, `/doctor`, `/staff`, `/production`.
  - Strategy and analytics: `/strategy`, `/analytics`, `/overview`, `/today`, `/dashboard`, `/results`, `/growth-plan`, `/local-market`, `/campaign-studio`.
  - Admin system pages: `/admin/system/*`, `/admin/analytics/*`, `/admin/intelligence/*`, `/admin/strategy/*`, `/admin/workspaces/[id]/*`.
  - API routes include social, AI, content execution, daily growth mission, integrations, reports, platform verification, PDF export, and acquisition.
- Report/export artifacts:
  - `apps/web/scripts/generate-daily-reports.mjs` uses `@react-pdf/renderer` to generate PDF files into `reports/`.
  - `apps/web/src/lib/content-execution/*` generates 3-day content execution documents, currently as HTML fallback files under `public/generated/content-execution`.
  - `apps/web/src/components/phase-e/ExportPdfButton.tsx` and `PdfDownloadButton.tsx` provide client-side PDF export UI.
  - `packages/database/prisma/schema.prisma` includes `PdfExportRun`, `DailyGrowthReport`, `ContentExecutionDocument`, and `ContentDeliveryLog`.

## 3. Blueprint Match Matrix

| Blueprint Requirement | Current Status | Current Files or Modules | Gap | Recommended Action | Priority |
|---|---|---|---|---|---|
| Multi-client management | Partial | `HospitalWorkspace`, `Workspace`, `HospitalIntegrationConfig`, `WorkspaceMember`, `APIKey`, `apps/api/src/hospitals`, `apps/web/src/components/hospital-switcher.tsx` | Two parallel client concepts; missing explicit report recipients, workflow schedule, approval settings, services offered | Consolidate client model policy around `Workspace` + `HospitalWorkspace`, add recipient/schedule/approval fields or linked tables | P0 |
| Daily automated workflow | Partial | `apps/web/src/lib/daily-growth-mission.ts`, `packages/autonomous-operations/src/missions/daily-growth-mission.ts`, `MissionExecution` | Manual route exists; default 6:00 AM schedule not clearly wired in app runtime | Promote daily growth mission to official workflow service with schedule config per client | P0 |
| Workflow run tracking | Partial | `MissionExecution`, `ActionExecution`, `ExecutionStep`, `ExecutionLog`, `ExecutionFailure`, `EventEnvelope`, `AIExecutionTrace` | No blueprint-named `WorkflowRun`, `WorkflowStep`, `ApiCallLog`, `WorkflowError`, `WorkflowRetry`; API calls not separately modeled | Add adapter/API layer that exposes existing records as workflow run/step/activity/retry concepts; add `ApiCallLog` if API provenance must be first-class | P0 |
| Live workflow visualizer | Partial | `/admin/workflows`, `/production/workflows`, `apps/web/src/components/workflow`, `apps/web/src/components/workflows`, daily mission API routes | Mostly role/demo surfaces; not a unified `/workflows` and `/workflows/[runId]` visualizer tied to real events | Build workflow center using `MissionExecution`, `EventEnvelope`, action steps, AI traces, and report status | P0 |
| Analytics system | Partial | `packages/analytics-intelligence`, `packages/social-engine`, `/analytics`, `/admin/analytics/*`, social API routes | Exists across many pages; not consistently framed as "what changed, why, why matters, action" | Normalize analytics response/UI sections around business-friendly explanations | P1 |
| Intelligence system | Partial | `packages/intelligence-engine`, `packages/intelligence-graph`, `apps/api/src/event-intelligence`, `/admin/intelligence/*`, AI routes | Many intelligence pieces; no single owner-facing intelligence page matching blueprint | Create `/intelligence` summary page and reusable insight schema | P1 |
| Strategy system | Exists/Partial | `packages/strategy-engine`, `packages/recommendation-engine`, `/strategy`, `/admin/strategy/*`, `apps/api/src/strategy` | Strong engine layer; frontend fragmented and categories need blueprint alignment | Retain engines, simplify strategy UI into prioritized recommendations with approval status | P1 |
| Content plan system | Partial | `ContentCalendarItem`, `ContentPlanDecision`, `ContentExecutionDocument`, `apps/web/src/lib/content-execution` | Current daily mission package uses terms like `hook`, `cta`, `bRollRequirements`; blueprint asks for simpler language | Update output vocabulary and UI labels to simple client-friendly terms | P1 |
| Report generation | Partial | `PdfExportRun`, `DailyGrowthReport`, `ContentExecutionDocument`, `apps/web/scripts/generate-daily-reports.mjs`, `@react-pdf/renderer` | PDF exists in pockets; DOCX missing; generalized templates/preview/edit/send not complete | Create first-class report service and report pages | P0 |
| Approval system | Partial | `ApprovalRequest`, `ContentCalendarScript.approvedBy`, approval pages, daily mission approval gate | Approval actions are narrower than required; not consistently applied to reports/content/strategy | Define unified approval domain and apply to reports, content plans, strategy recs | P0 |
| Client communication | Partial | `ContentDeliveryLog`, `ClientEmailDeliveryService`, `apps/api/src/email/email.service.ts` | API email service is mock; content execution can send only when env is configured; no full recipient list/attachment workflow | Add real email provider service, recipients, delivery history, failure tracking | P1 |
| Required navigation | Partial/Excess | `apps/web/src/navigation/role-navigation.ts`, `permission-navigation.ts` | Current navigation is role-centric and broader than blueprint | Replace primary owner nav with workflow-first route map | P0 |
| Required pages | Partial | `/overview`, `/analytics`, `/strategy`; `/admin/workflows`; reports under `/admin/reports` and `/reports/content-execution` | Missing exact `/workflows/[runId]`, `/intelligence`, `/content-plan`, `/reports/[reportId]`, `/approvals`, `/clients`, `/clients/[clientId]`, `/settings` | Add/rename/redirect pages to final route map | P0 |
| Production owner experience | Partial | `/admin`, `/admin/workspaces/[id]/command-center`, `/admin/workspaces/[id]/mission-control`, daily growth mission APIs | Owner status is spread across many screens | Build `/overview` as today's workflow status for all clients | P0 |

## 4. Existing Features That Match the Blueprint

- Multi-workspace/hospital foundation:
  - Relevant files: `packages/database/prisma/schema.prisma`, `apps/api/src/hospitals`, `apps/api/src/admin`, `apps/web/src/components/hospital-switcher.tsx`.
  - Why it matches: supports hospital/client records, integrations, users, roles, invitations, brand voice, templates, and audit logs.
  - Cleanup needed: yes. Decide whether blueprint "client" maps to `HospitalWorkspace`, `Workspace`, or a unified view over both.

- Daily growth mission:
  - Relevant files: `apps/web/src/lib/daily-growth-mission.ts`, `packages/autonomous-operations/src/missions/daily-growth-mission.ts`, `apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/*`.
  - Why it matches: creates/reuses a daily execution, gathers persisted analytics/review/competitor/trend/calendar data, produces performance analysis, strategy outcome, content package, report, approval gate, events, and post-approval tasks.
  - Cleanup needed: yes. It should become the official workflow backend instead of a workspace-admin feature.

- Workflow/action execution primitives:
  - Relevant files: `packages/database/prisma/schema.prisma`, `packages/action-engine`, `packages/automation-engine`, `packages/event-orchestrator`.
  - Why it matches: models executions, steps, logs, failures, retries/dead letters via automation, outbox events, and approval-gated action plans.
  - Cleanup needed: moderate. Expose them through blueprint vocabulary.

- Analytics/intelligence/strategy engines:
  - Relevant files: `packages/analytics-intelligence`, `packages/social-engine`, `packages/strategy-engine`, `packages/recommendation-engine`, `packages/market-intelligence`.
  - Why it matches: contains scoring, recommendations, weekly reports, market context, social ingestion/analytics, and strategy persistence.
  - Cleanup needed: yes. Product UI should simplify output.

- Content execution plan:
  - Relevant files: `apps/web/src/lib/content-execution`, `apps/web/src/app/api/content/execution-plans/*`, `ContentExecutionWindow`, `ContentExecutionDocument`, `ContentDeliveryLog`.
  - Why it matches: generates a 3-day client-ready plan with schedule, instructions, email preview, stored document, generated file URL, and delivery logging.
  - Cleanup needed: yes. Current generator writes HTML fallback, not production PDF/DOCX.

- PDF/report proof points:
  - Relevant files: `apps/web/scripts/generate-daily-reports.mjs`, `apps/web/src/components/phase-e/ExportPdfButton.tsx`, `reports/*.pdf`, `PdfExportRun`.
  - Why it matches: proves local PDF generation and export metadata are possible.
  - Cleanup needed: yes. Convert scripts and component-level export into a unified report service.

## 5. Partial Features That Need Modification

- Client model:
  - Relevant files: `HospitalWorkspace`, `Workspace`, `WorkspaceMember`, `HospitalIntegrationConfig`, `APIKey`.
  - What exists now: two workspace/client-like models and integration credential storage.
  - Missing: report recipients, workflow schedules, approval settings, service list, location details as normalized product fields.
  - Change needed: define one canonical client aggregate for owner workflows and migrate/read from existing models.

- Workflow visualizer:
  - Relevant files: `/admin/workflows`, `/production/workflows`, `apps/web/src/components/workflow/workflow-surfaces.tsx`, `workflow-journey.tsx`.
  - What exists now: workflow UI components and role workflow pages.
  - Missing: real timeline from mission events, API call cards, data fetched summaries, current step, retry panel, report status.
  - Change needed: connect UI to `MissionExecution`, `EventEnvelope`, `AIExecutionTrace`, `ActionExecution`, `ExecutionStep`, and failures.

- Reports:
  - Relevant files: `PdfExportRun`, `DailyGrowthReport`, `ContentExecutionDocument`, report scripts/components.
  - What exists now: daily PDF script, daily growth mission PDF metadata, content execution HTML fallback, PDF button components.
  - Missing: generalized `Report`, `ReportTemplate`, `ReportExport`, `ReportDelivery`, DOCX export, editable preview.
  - Change needed: add report domain and service; keep existing reports as first producers.

- Email sending:
  - Relevant files: `apps/api/src/email/email.service.ts`, `ClientEmailDeliveryService` in `apps/web/src/lib/content-execution/services.ts`.
  - What exists now: API service returns mock delivery; content execution can use an external provider only with env flags.
  - Missing: production email provider abstraction across report types, attachments, recipients, retries.
  - Change needed: centralize email delivery in backend/service layer and record deliveries.

- Content terminology:
  - Relevant files: `apps/web/src/lib/content-execution/document-generator.ts`, `apps/web/src/lib/daily-growth-mission.ts`, `ContentProductionPackage`.
  - What exists now: useful execution details, but some terms conflict with blueprint (`hook`, `cta`, `bRollRequirements`).
  - Missing: simple vocabulary: opening line, main message, video shots needed, ending message, patient action, doctor/staff instruction.
  - Change needed: change output schema/UI labels while preserving stored legacy fields until migration.

## 6. Completely Missing Features

- General report domain:
  - Backend need: report service for daily analytics, daily strategy, 3-day content plan, weekly growth, monthly client reports.
  - Frontend need: `/reports`, `/reports/[reportId]`, preview/edit/approve/export/send UI.
  - Database need: canonical `Report`, `ReportTemplate`, `ReportExport`, `ReportDelivery`, unified `Approval` or extension of `ApprovalRequest`.
  - API need: create/list/detail/update/export/approve/send endpoints.
  - Priority: P0.

- DOCX export:
  - Backend need: DOCX renderer/generator service.
  - Frontend need: Export DOCX button and status.
  - Database need: export format/status metadata.
  - API need: `POST /reports/[id]/exports` with `format: DOCX`.
  - Priority: P1.

- Blueprint route map:
  - Backend need: none initially.
  - Frontend need: exact pages `/workflows/[runId]`, `/intelligence`, `/content-plan`, `/approvals`, `/clients`, `/clients/[clientId]`, `/settings`.
  - Database need: none initially.
  - API need: aggregate endpoints for each page.
  - Priority: P0.

- API call log:
  - Backend need: capture provider, endpoint, client, status, payload summary, timing, failure, retry relation.
  - Frontend need: API call cards in workflow detail.
  - Database need: `ApiCallLog` or event subtype.
  - API need: workflow run detail includes API calls.
  - Priority: P1.

- Client recipient list:
  - Backend need: recipient CRUD and preferences.
  - Frontend need: client settings and send dialog.
  - Database need: `ReportRecipient` or client recipient table.
  - API need: recipient list and update endpoints.
  - Priority: P1.

## 7. Excess / Out-of-Scope / Unused Files and Scripts

| File or Folder Path | Why It Appears Excessive or Unused | Risk of Deleting | Recommended Action | Tests/Build Dependence |
|---|---|---|---|---|
| `outputs/` | Local dev/server logs from many experiments | Low | Archive/Delete Later | No source dependency found; verify before deletion |
| `apps/web/*.log`, `apps/api/*.log`, `web-start-smoke.*.log` | Runtime logs checked into workspace | Low | Archive/Delete Later | No build dependency expected |
| `apps/web/public/generated/content-execution/*.html` | Generated report preview artifacts, not source | Low/Medium | Archive Candidate | May be referenced by stored `fileUrl` values in dev DB |
| `reports/*.pdf` | Generated PDF outputs | Low/Medium | Archive Candidate | Useful as samples; not source |
| `apps/*/node_modules`, `packages/*/node_modules` | Installed dependencies inside many package folders | High | Keep for now | Required locally unless package manager strategy changes |
| `apps/web/src/app/design-mockups` | Preview/mockup route outside target blueprint | Low/Medium | Archive Candidate | Check route references before removal |
| Role route clusters under `/doctor`, `/staff`, `/production` | Blueprint centers owner workflow, not role dashboards | Medium/High | Keep initially; merge/redirect after workflow-first UI is live | Likely referenced by navigation/tests |
| Deep admin route clusters under `/admin/strategy/*`, `/admin/intelligence/*`, `/admin/analytics/*` | Many overlapping pages for concepts that blueprint wants as single pages | Medium/High | Refactor/Merge | Current navigation points to several of these |
| `apps/web/src/demo-data` | Demo-backed workflow/approval surfaces appear separate from real DB workflow | Medium | Archive Candidate after real data wiring | Components currently import demo types/data |
| Prior audit markdown files at repo root | Historical planning artifacts, not runtime source | Low | Archive Candidate | No build dependency |

Do not delete any item immediately. First add a dependency/reference report and move low-risk artifacts into an archive folder or exclude them from production packaging.

## 8. Frontend Restructure Recommendation

- Pages to keep:
  - `/overview` as the owner landing page.
  - `/analytics` as the unified analytics page.
  - `/strategy` as the unified strategy page.
  - Existing admin/workspace pages temporarily until replacement routes are complete.

- Pages to rename or promote:
  - `/admin/workflows` -> `/workflows`.
  - Daily mission detail API-backed UI -> `/workflows/[runId]`.
  - `/admin/approvals`, `/doctor/approvals`, `/staff/approvals` -> unified `/approvals`.
  - `/admin/reports` and `/reports/content-execution` -> `/reports`.
  - `/admin/hospitals` or workspace management -> `/clients`.

- Pages to merge:
  - `/admin/analytics/*` into `/analytics` with tabs/filters.
  - `/admin/intelligence/*` into `/intelligence`.
  - `/admin/strategy/*` and `/strategy/*` into `/strategy`.
  - `/production/content-calendar`, `/production/content-generator`, `/production/content-strategy`, `/reports/content-execution` into `/content-plan` where appropriate.

- Pages to remove/archive later:
  - `/design-mockups`, old preview routes, duplicate role dashboards that no longer serve production owner workflows.

- New final route map:
  - `/overview`
  - `/workflows`
  - `/workflows/[runId]`
  - `/analytics`
  - `/intelligence`
  - `/strategy`
  - `/content-plan`
  - `/reports`
  - `/reports/[reportId]`
  - `/approvals`
  - `/clients`
  - `/clients/[clientId]`
  - `/settings`
  - Later: `/integrations`, `/templates`, `/deliveries`, `/audit-log`

## 9. Backend Restructure Recommendation

- Services to keep:
  - Daily growth mission implementation in `apps/web/src/lib/daily-growth-mission.ts`, then move or wrap it as an official backend/domain service.
  - Strategy/recommendation engines in `packages/strategy-engine` and `packages/recommendation-engine`.
  - Social, market, analytics, event, action, automation, observability, and database packages.
  - Auth/admin/hospital/integration/review/content modules in `apps/api/src`.

- Services to refactor:
  - Email: replace mock-only `apps/api/src/email/email.service.ts` with a provider-backed delivery service.
  - Reports: consolidate script-based PDFs, client-side PDF button exports, daily growth PDFs, and content execution HTML fallback under a report service.
  - Workflow: expose `MissionExecution` and action/automation/event records through blueprint-oriented workflow APIs.

- New services/controllers to create:
  - `WorkflowController/WorkflowService`: list runs, run detail, retry step, event timeline, API calls, reports.
  - `ReportController/ReportService`: templates, preview, edit, export PDF/DOCX, approve, send.
  - `ApprovalController/ApprovalService`: unified approval actions.
  - `ClientController/ClientService`: profile, recipients, schedules, integration health, approval settings.

- Database models to add or adapt:
  - Add canonical report models if not reusing content-specific models: `Report`, `ReportTemplate`, `ReportExport`, `ReportDelivery`.
  - Add `ReportRecipient` or `ClientRecipient`.
  - Add `ApiCallLog` if workflow API calls must be queried independently.
  - Add explicit workflow schedule/approval settings to client/workspace aggregate.

- Existing models to reuse:
  - `MissionExecution`, `DailyBusinessSnapshot`, `DailyPerformanceReport`, `StrategyOutcome`, `TrendOpportunity`, `ContentBrief`, `ContentProductionPackage`, `DailyGrowthReport`, `PdfExportRun`.
  - `ActionPlan`, `ActionExecution`, `ExecutionStep`, `ExecutionLog`, `ExecutionFailure`, `ApprovalRequest`.
  - `EventEnvelope`, `EventDelivery`, `EventDeadLetter`, `AIExecutionTrace`.
  - `HospitalWorkspace`, `Workspace`, `HospitalIntegrationConfig`, `WorkspaceMember`, `APIKey`.

- Existing models to remove/archive:
  - None now. Resolve the `HospitalWorkspace` vs `Workspace` duplication before any schema removals.

## 10. Report Generation Gap

- PDF reports:
  - Exists partially. `apps/web/scripts/generate-daily-reports.mjs` generates PDFs via `@react-pdf/renderer`; daily growth mission records `PdfExportRun`; `ExportPdfButton`/`PdfDownloadButton` provide UI export.
  - Gap: no unified report-generation API for all required report types.

- DOCX reports:
  - Missing. No DOCX generation dependency or service was found in inspected source.

- Report previews:
  - Partial. Content execution stores `fileUrl` to generated HTML previews and report pages exist, but not as a generalized `/reports/[reportId]` editable preview.

- Report templates:
  - Partial. `Template` exists for hospital content, and PDF scripts/templates exist, but no report-template domain covers daily/weekly/monthly report types.

- Approval before sending:
  - Partial. `ApprovalRequest` and daily mission approval gates exist, but report approval is not uniformly enforced before all sends.

- Email sending with attachments:
  - Partial. `ClientEmailDeliveryService` can build attachment payloads and conditionally send with provider env settings; `apps/api/src/email/email.service.ts` is mock-only. Needs one production delivery path.

## 11. Workflow Visualizer Gap

- Daily workflow runs:
  - Partial through `MissionExecution` and daily mission API routes.
- Workflow steps:
  - Partial through `currentPhase`, events, `ActionExecution`, and `ExecutionStep`; not normalized into the visualizer.
- API calls:
  - Missing as first-class `ApiCallLog`.
- Agent activity/tool calls:
  - Partial through `AIExecutionTrace.toolCalls`, event metadata, and agent/runtime packages.
- Data fetched:
  - Partial through `DailyBusinessSnapshot.sourceStatuses` and related snapshots.
- Errors:
  - Partial through `ExecutionFailure`, `OperationalError`, `EventDeadLetter`, mission `failureReason`.
- Retry status:
  - Partial through automation execution retry/dead-letter fields and execution attempts, but not visualized as a workflow retry panel.
- Report generation status:
  - Partial through `DailyGrowthReport`, `PdfExportRun`, and mission events.

Recommended visualizer data contract:
- Run header from `MissionExecution`.
- Timeline from `EventEnvelope` for aggregate `DAILY_GROWTH_MISSION`.
- Step cards from `currentPhase`, `ActionExecution.steps`, and known mission phases.
- Agent cards from `AIExecutionTrace`.
- API cards from new `ApiCallLog` or event metadata.
- Report card from `DailyGrowthReport`/`PdfExportRun`.
- Error/retry panel from `ExecutionFailure`, `OperationalError`, `EventDeadLetter`, automation retry fields.

## 12. Multi-Client Readiness Gap

- Tenant/workspace/client models:
  - Partial. `HospitalWorkspace` and `Workspace` both exist. This is powerful but creates product ambiguity.
- Client-specific API tokens:
  - Partial. `HospitalIntegrationConfig.encryptedCredentials` and `APIKey` exist.
- Client-specific workflows:
  - Partial. `MissionExecution` and action/automation records are workspace-scoped.
- Client-specific reports:
  - Partial. `DailyGrowthReport`, `PdfExportRun`, and content execution documents are workspace-scoped.
- Client-specific recipients:
  - Missing/partial. `contactEmail` exists, delivery logs store recipient email, but no robust recipient list/preferences.
- Role-based access:
  - Exists/partial. `UserRole`, `WorkspaceMember`, `Role`, `Permission`, and navigation permission maps exist.
- Data isolation:
  - Partial. Most large-schema models are `workspaceId` scoped; API schema has `hospitalId`. Need consistency checks across all queries.
- Scaling risks for 30-100 clients:
  - Risk areas are scheduler reliability, API rate limits, token refresh/reconnection visibility, report generation queueing, and per-client data isolation tests.

## 13. Production Risk List

- Security risks:
  - Integration credentials exist as encrypted fields, but token lifecycle/reconnection UX and audit should be verified.
  - Multiple workspace concepts increase risk of querying the wrong client scope.
- Data isolation risks:
  - Mixed `workspaceId`, `hospitalId`, `clientId`, `HospitalWorkspace`, and `Workspace` naming makes accidental cross-client reads more likely.
- API token risks:
  - Missing explicit API call log and reconnect workflow for each client/provider.
- Workflow reliability risks:
  - Daily scheduling is not clearly productionized at 6:00 AM per active client.
  - Retry/dead-letter data exists but is not owner-visible.
- Report accuracy risks:
  - Some report/document generators use fallback intelligence or persisted data with partial availability.
  - Need provenance labels in every report.
- Frontend confusion risks:
  - Current navigation is role-centric and broad; owner workflows are distributed across many pages.
- Excess code risks:
  - Demo data, generated files, logs, prior audits, and overlapping route clusters obscure production paths.
- Deployment risks:
  - Many package-local `node_modules` folders and separate Prisma schemas increase environment drift risk.

## 14. Recommended Execution Plan

- Phase 1: Blueprint alignment and cleanup
  - Goal: make the product map obvious without deleting working systems.
  - Backend tasks: declare canonical client/workspace mapping; document model reuse decisions.
  - Frontend tasks: add workflow-first navigation shell and route redirects while keeping old pages reachable.
  - Database tasks: no migration yet.
  - Validation: route inventory, build, smoke navigation.
  - Outcome: owner can see the target product structure.

- Phase 2: Workflow tracking backend
  - Goal: expose daily growth mission and action/event data as workflow runs.
  - Backend tasks: create workflow service/API over `MissionExecution`, events, action steps, AI traces, failures, reports.
  - Frontend tasks: consume workflow list/detail APIs.
  - Database tasks: add `ApiCallLog` only if event metadata cannot cover API cards.
  - Validation: unit tests for list/detail mapping and retry/error cases.
  - Outcome: real workflow data is queryable through blueprint concepts.

- Phase 3: Workflow visualizer UI
  - Goal: build `/workflows` and `/workflows/[runId]`.
  - Backend tasks: include timeline, step status, fetched data, reports, failures, retry eligibility.
  - Frontend tasks: timeline, agent panel, API cards, fetched-data summary, error/retry panel, report-ready state.
  - Database tasks: none unless adding logs.
  - Validation: visual smoke with completed, running, failed, waiting approval runs.
  - Outcome: owner sees daily operations live.

- Phase 4: Report generation system
  - Goal: first-class reports independent of Codex/manual scripts.
  - Backend tasks: report service, templates, preview content, export queue/status.
  - Frontend tasks: `/reports`, `/reports/[reportId]`, edit/preview/export controls.
  - Database tasks: add/adapt `Report`, `ReportTemplate`, `ReportExport`, `ReportDelivery`.
  - Validation: generate daily analytics, daily strategy, and 3-day content plan from stored workflow data.
  - Outcome: app generates client-ready reports internally.

- Phase 5: Export buttons
  - Goal: production PDF and DOCX exports.
  - Backend tasks: PDF renderer service and DOCX renderer service.
  - Frontend tasks: export buttons with status and download links.
  - Database tasks: track export format, status, file URL, failure.
  - Validation: generated files open and contain expected report content.
  - Outcome: owner can export PDF/DOCX.

- Phase 6: Approval/send flow
  - Goal: enforce manual approval before client sending.
  - Backend tasks: unified approval actions and email delivery with attachments.
  - Frontend tasks: approval queue, approve/send dialogs, delivery status.
  - Database tasks: recipients and delivery records.
  - Validation: cannot send unapproved reports; failed delivery is tracked.
  - Outcome: safe client communication.

- Phase 7: Frontend workflow redesign
  - Goal: merge old route clusters into workflow-first pages.
  - Backend tasks: maintain compatibility endpoints.
  - Frontend tasks: consolidate analytics/intelligence/strategy/content/report pages.
  - Database tasks: none.
  - Validation: route redirects and no broken navigation.
  - Outcome: simpler production UX.

- Phase 8: Multi-client hardening
  - Goal: ready for 30-100 clients.
  - Backend tasks: scheduler, queues, rate limits, token reconnect status, isolation tests.
  - Frontend tasks: all-client overview and client detail settings.
  - Database tasks: indexes and client settings/recipient schema.
  - Validation: seeded multi-client workflow simulations.
  - Outcome: scalable client operations.

- Phase 9: Production deployment readiness
  - Goal: deploy with confidence.
  - Backend tasks: env validation, health checks, job worker deployment, logs/alerts.
  - Frontend tasks: production error/loading states.
  - Database tasks: migration reconciliation.
  - Validation: staging smoke, workflow run, report export, approval send, failure retry.
  - Outcome: production candidate.

## 15. Final Recommendation

Clean first, then build workflow tracking, then reports.

Recommended order:
1. Align product routes/navigation and archive obvious generated/log artifacts later.
2. Promote the existing daily growth mission into the official workflow backend.
3. Build the real workflow visualizer from `MissionExecution`, events, action steps, AI traces, failures, and reports.
4. Build the generalized report service and report pages.
5. Add PDF/DOCX exports.
6. Add unified approval and production email delivery.
7. Harden multi-client scheduling, isolation, reconnect flows, and deployment.

Reasoning: the backend already contains many of the right primitives. Rebuilding frontend first would still leave reports/send/workflows fragmented, and refactoring backend first without navigation alignment would preserve the current product confusion. A light cleanup/alignment pass followed by workflow tracking gives the fastest path to a production-ready owner operating system.
