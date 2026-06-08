# VIP Removal Report

Generated: 2026-06-05. No deletions were performed. This report documents review candidates only.

## Removal Policy

Before deleting any item, prove it is unused by navigation, internal links, APIs, workflows, agents, tests, automation, mission control and deployment scripts. For production, prefer hiding prototype links or dev-guarding routes before deletion.

## Page/Workspace Candidates

| File | Current Classification | Reason | Dependencies / References | Replacement Or Consolidation Target |
| --- | --- | --- | --- | --- |
| apps/web/src/app/admin/ai-audit/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/analytics/instagram/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/audit-logs/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/hospitals/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/permissions/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/users/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/admin/workspaces/[id]/command-center/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | AdminShell or admin route tree; Mission Control/workspace links | Mission Control/Pilot Operations if mission-related; otherwise workspace dashboard |
| apps/web/src/app/admin/workspaces/[id]/dashboard/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | AdminShell or admin route tree; Mission Control/workspace links | Mission Control/Pilot Operations if mission-related; otherwise workspace dashboard |
| apps/web/src/app/admin/workspaces/[id]/insights/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | AdminShell or admin route tree; Mission Control/workspace links | Mission Control/Pilot Operations if mission-related; otherwise workspace dashboard |
| apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx | PRODUCTION_OPTIONAL | Contains demo/mock/preview markers | AdminShell or admin route tree; Mission Control/workspace links | Mission Control/Pilot Operations if mission-related; otherwise workspace dashboard |
| apps/web/src/app/campaign-studio/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/design-mockups/page.tsx | PROTOTYPE | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/eight-weeks/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/growth-plan/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/outreach/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/production/campaigns/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | ProductionLayout/roleNavigation | Production workspace consolidated route or hide from nav until real implementation |
| apps/web/src/app/production/content-pipeline/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | ProductionLayout/roleNavigation | Production workspace consolidated route or hide from nav until real implementation |
| apps/web/src/app/production/layout.tsx | PROTOTYPE | Contains demo/mock/preview markers | ProductionLayout/roleNavigation | Production workspace consolidated route or hide from nav until real implementation |
| apps/web/src/app/production/placeholder-page.tsx | PROTOTYPE | Contains demo/mock/preview markers | ProductionLayout/roleNavigation | Production workspace consolidated route or hide from nav until real implementation |
| apps/web/src/app/production/special-days/page.tsx | PROTOTYPE | Contains demo/mock/preview markers | ProductionLayout/roleNavigation | Production workspace consolidated route or hide from nav until real implementation |
| apps/web/src/app/roles/[role]/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |
| apps/web/src/app/roles/admin/page.tsx | EXPERIMENTAL | Route exists in App Router | AdminShell or admin route tree | Core release navigation only |
| apps/web/src/app/website-listings/page.tsx | EXPERIMENTAL | Route exists in App Router | Route-addressable; no strong nav reference found | Core release navigation only |

## API Candidates

| File | Current Classification | Reason | Dependencies / References | Replacement Or Consolidation Target |
| --- | --- | --- | --- | --- |
| apps/web/src/app/api/admin/weekly-analysis-report/route.ts | Experimental/Mock-backed | Application API route. | No direct AI call detected | Remove from production routing or guard behind dev-only feature flag after owner review |
| apps/web/src/app/api/social/test-ingest/route.ts | Deprecated/Test | Social analytics, ingestion, competitor, trend and recommendation API. | No direct AI call detected | Remove from production routing or guard behind dev-only feature flag after owner review |
| apps/web/src/app/api/test-agent/route.ts | Deprecated/Test | Application API route. | AI/OpenAI tracked | Remove from production routing or guard behind dev-only feature flag after owner review |
| apps/web/src/app/api/test-ingest/route.ts | Deprecated/Test | Application API route. | No direct AI call detected | Remove from production routing or guard behind dev-only feature flag after owner review |

## High Priority Consolidation Actions

| Action | Files | Reason | Do Now? |
| --- | --- | --- | --- |
| Hide placeholder production routes from nav | apps/web/src/app/production/campaigns/page.tsx; apps/web/src/app/production/content-pipeline/page.tsx; apps/web/src/app/production/special-days/page.tsx; apps/web/src/app/production/layout.tsx | Explicit ProductionPlaceholderPage surfaces. | Yes, after stakeholder approval. |
| Remove or dev-guard test APIs | apps/web/src/app/api/test-agent/route.ts; apps/web/src/app/api/test-ingest/route.ts; apps/web/src/app/api/social/test-ingest/route.ts | Test routes should not be exposed in production. | Yes, by feature flag or environment guard. |
| Replace demo hospital fallbacks | apps/web/src/lib/demo-hospitals.ts; apps/web/src/providers/HospitalContextProvider.tsx; admin/users/hospitals/ai-audit pages | Preview-mode data creates production ambiguity. | Yes, require auth/workspace data or dev-only mode. |
| Review mock API agents | apps/web/src/app/api/agents/competitor-agent/index.ts; apps/web/src/app/api/agents/trend-agent/index.ts | Index modules say not implemented while route wrappers exist. | Yes, reconcile implementation status. |
| Keep Mission Control and Pilot Operations | apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx; apps/web/src/app/admin/workspaces/[id]/pilot-operations/page.tsx | Core production/pilot surfaces. | No deletion. |
