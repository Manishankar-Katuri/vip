# VIP Product Inventory

Generated: 2026-06-05. Scope: first production release consolidation audit. No files were deleted.

## Classification Rules

CORE_PRODUCTION, PRODUCTION_OPTIONAL, EXPERIMENTAL, PROTOTYPE, LEGACY, UNUSED and BROKEN are assigned from source references, navigation, route names and explicit mock/demo/placeholder markers. Git history is unavailable in this workspace snapshot, so Last Known Usage is source-reference based.

## Core Evidence

| System | Location | Evidence |
| --- | --- | --- |
| Daily Growth Mission web runtime | apps/web/src/lib/daily-growth-mission.ts:49 | Manual run, persistence, AI content generation, PDF export, approvals, tasks, replay, learning. |
| Daily Growth Mission package runtime | packages/autonomous-operations/src/missions/daily-growth-mission.ts:160 | Package runner emits mission events and creates action/tasks/reports/memory in repository form. |
| Mission Control UI | apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx:28 | Reads mission detail/replay plus ActionPlan, OperationalTask and AgentLearningMemory. |
| Pilot Operations Console | apps/web/src/app/admin/workspaces/[id]/pilot-operations/page.tsx:37 | Pilot monitoring, quality review, scorecard, day comparison and exit criteria. |
| Pilot quality feedback | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/quality-review/route.ts:5 | Stores reviewer quality scores. |
| Action Engine | packages/action-engine/orchestration/action-orchestrator.ts | Approval-gated action plans, queues, workers and persistence adapters. |
| Automation Engine | packages/automation-engine/src/execution/automation-execution-service.ts | Rule trigger, queue, retry, rollback, outbox and telemetry runtime. |
| Event Orchestrator | packages/event-orchestrator/src/registry/index.ts:96 | Typed event registry includes Daily Growth Mission, agent and automation events. |
| Agent Runtime | packages/agent-runtime/src/index.ts | Runtime agent definitions, registry, queue, scheduler, subscriptions and outcome memory bridge. |
| Prisma mission data | packages/database/prisma/schema.prisma:882 | MissionExecution and related mission/report/content/learning tables. |

## Web Page And Layout Inventory

| Route | Location | Purpose | Status | Dependencies | Referenced By | Last Known Usage |
| --- | --- | --- | --- | --- | --- | --- |
| /admin/ai-audit | apps/web/src/app/admin/ai-audit/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Demo hospital fallback | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/ai | apps/web/src/app/admin/ai/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/analytics/engagement | apps/web/src/app/admin/analytics/engagement/page.tsx | Analytics dashboard or business intelligence surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/analytics/facebook | apps/web/src/app/admin/analytics/facebook/page.tsx | Analytics dashboard or business intelligence surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/analytics/instagram | apps/web/src/app/admin/analytics/instagram/page.tsx | Analytics dashboard or business intelligence surface. | PRODUCTION_OPTIONAL | Demo hospital fallback; Hospital context | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/analytics | apps/web/src/app/admin/analytics/page.tsx | Analytics dashboard or business intelligence surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/analytics/reviews | apps/web/src/app/admin/analytics/reviews/page.tsx | Analytics dashboard or business intelligence surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/approvals | apps/web/src/app/admin/approvals/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/audit-logs | apps/web/src/app/admin/audit-logs/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PROTOTYPE | Local components/data | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/automation | apps/web/src/app/admin/automation/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/brand-voice | apps/web/src/app/admin/brand-voice/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Hospital context | AdminShell or admin route tree | Route exists in App Router |
| /admin/command-centre | apps/web/src/app/admin/command-centre/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/executive-growth-report | apps/web/src/app/admin/executive-growth-report/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/hospitals | apps/web/src/app/admin/hospitals/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Demo hospital fallback | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/integrations/health | apps/web/src/app/admin/integrations/health/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/integrations | apps/web/src/app/admin/integrations/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/intelligence/forecasting | apps/web/src/app/admin/intelligence/forecasting/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/intelligence/gbp | apps/web/src/app/admin/intelligence/gbp/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/intelligence/seo | apps/web/src/app/admin/intelligence/seo/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/intelligence/social | apps/web/src/app/admin/intelligence/social/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/intelligence/trend | apps/web/src/app/admin/intelligence/trend/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin layout | apps/web/src/app/admin/layout.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin | apps/web/src/app/admin/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/permissions | apps/web/src/app/admin/permissions/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Hospital context | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/reports | apps/web/src/app/admin/reports/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/reports/weekly-analysis | apps/web/src/app/admin/reports/weekly-analysis/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/requests | apps/web/src/app/admin/requests/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/competitor-gap | apps/web/src/app/admin/strategy/competitor-gap/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/content | apps/web/src/app/admin/strategy/content/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/conversion-path | apps/web/src/app/admin/strategy/conversion-path/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/gbp | apps/web/src/app/admin/strategy/gbp/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy | apps/web/src/app/admin/strategy/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/positioning | apps/web/src/app/admin/strategy/positioning/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/reviews | apps/web/src/app/admin/strategy/reviews/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/seo | apps/web/src/app/admin/strategy/seo/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/social | apps/web/src/app/admin/strategy/social/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/strategy/whatsapp | apps/web/src/app/admin/strategy/whatsapp/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/system/ai-health | apps/web/src/app/admin/system/ai-health/page.tsx | System health, API audit, AI provider health or verification. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/system/api-audit | apps/web/src/app/admin/system/api-audit/page.tsx | System health, API audit, AI provider health or verification. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/system/platform-verification | apps/web/src/app/admin/system/platform-verification/page.tsx | System health, API audit, AI provider health or verification. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/teams | apps/web/src/app/admin/teams/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/templates | apps/web/src/app/admin/templates/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Hospital context | AdminShell or admin route tree | Route exists in App Router |
| /admin/users | apps/web/src/app/admin/users/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Demo hospital fallback | AdminShell or admin route tree | Contains demo/mock/preview markers |
| /admin/workflows | apps/web/src/app/admin/workflows/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /admin/workspaces/[id]/alerts/[alertId] | apps/web/src/app/admin/workspaces/[id]/alerts/[alertId]/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/alerts | apps/web/src/app/admin/workspaces/[id]/alerts/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/command-center | apps/web/src/app/admin/workspaces/[id]/command-center/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PROTOTYPE | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Contains demo/mock/preview markers |
| /admin/workspaces/[id]/competitor-intelligence | apps/web/src/app/admin/workspaces/[id]/competitor-intelligence/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/copilot | apps/web/src/app/admin/workspaces/[id]/copilot/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/dashboard | apps/web/src/app/admin/workspaces/[id]/dashboard/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PROTOTYPE | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Contains demo/mock/preview markers |
| /admin/workspaces/[id]/executive | apps/web/src/app/admin/workspaces/[id]/executive/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/insights | apps/web/src/app/admin/workspaces/[id]/insights/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PROTOTYPE | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Contains demo/mock/preview markers |
| /admin/workspaces/[id]/learning-engine | apps/web/src/app/admin/workspaces/[id]/learning-engine/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/mission-control | apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx | Daily Growth Mission execution, replay, approvals, report, task and learning surface. | PRODUCTION_OPTIONAL | Prisma/database; Daily Growth Mission | AdminShell or admin route tree; Mission Control/workspace links | Contains demo/mock/preview markers |
| /admin/workspaces/[id] | apps/web/src/app/admin/workspaces/[id]/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/pilot-operations | apps/web/src/app/admin/workspaces/[id]/pilot-operations/page.tsx | 7-day pilot monitoring, quality review, comparison, KPI validation and readiness scoring. | CORE_PRODUCTION | Pilot operations | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/publishing | apps/web/src/app/admin/workspaces/[id]/publishing/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/social-agent | apps/web/src/app/admin/workspaces/[id]/social-agent/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/tasks | apps/web/src/app/admin/workspaces/[id]/tasks/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | CORE_PRODUCTION | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/voice | apps/web/src/app/admin/workspaces/[id]/voice/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /admin/workspaces/[id]/war-room | apps/web/src/app/admin/workspaces/[id]/war-room/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | PRODUCTION_OPTIONAL | Local components/data | AdminShell or admin route tree; Mission Control/workspace links | Route exists in App Router |
| /analytics | apps/web/src/app/analytics/page.tsx | Analytics dashboard or business intelligence surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /auth/accept-invite | apps/web/src/app/auth/accept-invite/page.tsx | General product, onboarding, role routing or shared workspace surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /calendar | apps/web/src/app/calendar/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /campaign-studio | apps/web/src/app/campaign-studio/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /dashboard | apps/web/src/app/dashboard/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /design-mockups | apps/web/src/app/design-mockups/page.tsx | General product, onboarding, role routing or shared workspace surface. | PROTOTYPE | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /doctor/approvals | apps/web/src/app/doctor/approvals/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | CORE_PRODUCTION | Local components/data | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor/executive-growth-report | apps/web/src/app/doctor/executive-growth-report/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Local components/data | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor layout | apps/web/src/app/doctor/layout.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Hospital context | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor/morning-briefing | apps/web/src/app/doctor/morning-briefing/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Hospital context | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor | apps/web/src/app/doctor/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Role hub | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor/reports | apps/web/src/app/doctor/reports/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | CORE_PRODUCTION | Local components/data | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor/reputation | apps/web/src/app/doctor/reputation/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Local components/data | DoctorLayout/roleNavigation | Route exists in App Router |
| /doctor/summary | apps/web/src/app/doctor/summary/page.tsx | Doctor briefing, approvals, reporting, reputation or summary surface. | PRODUCTION_OPTIONAL | Local components/data | DoctorLayout/roleNavigation | Route exists in App Router |
| /eight-weeks | apps/web/src/app/eight-weeks/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /governance | apps/web/src/app/governance/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /growth-plan | apps/web/src/app/growth-plan/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
|  layout | apps/web/src/app/layout.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /local-market | apps/web/src/app/local-market/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /login | apps/web/src/app/login/page.tsx | General product, onboarding, role routing or shared workspace surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /onboarding | apps/web/src/app/onboarding/page.tsx | General product, onboarding, role routing or shared workspace surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /opportunities/[slug] | apps/web/src/app/opportunities/[slug]/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /outreach | apps/web/src/app/outreach/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /overview | apps/web/src/app/overview/page.tsx | General product, onboarding, role routing or shared workspace surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| / | apps/web/src/app/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /production/analytics | apps/web/src/app/production/analytics/page.tsx | Production content, calendar, publishing, campaign, or social operations. | CORE_PRODUCTION | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/calendar | apps/web/src/app/production/calendar/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/campaigns | apps/web/src/app/production/campaigns/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PROTOTYPE | Production placeholder | ProductionLayout/roleNavigation | Contains demo/mock/preview markers |
| /production/command-centre | apps/web/src/app/production/command-centre/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Hospital context | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/content-calendar | apps/web/src/app/production/content-calendar/page.tsx | Production content, calendar, publishing, campaign, or social operations. | CORE_PRODUCTION | Hospital context | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/content-generator | apps/web/src/app/production/content-generator/page.tsx | Production content, calendar, publishing, campaign, or social operations. | CORE_PRODUCTION | Hospital context | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/content-pipeline | apps/web/src/app/production/content-pipeline/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PROTOTYPE | Production placeholder | ProductionLayout/roleNavigation | Contains demo/mock/preview markers |
| /production/content-strategy | apps/web/src/app/production/content-strategy/page.tsx | Production content, calendar, publishing, campaign, or social operations. | CORE_PRODUCTION | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/content | apps/web/src/app/production/content/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/hashtags | apps/web/src/app/production/hashtags/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production layout | apps/web/src/app/production/layout.tsx | Production content, calendar, publishing, campaign, or social operations. | PROTOTYPE | Demo hospital fallback; Hospital context | ProductionLayout/roleNavigation | Contains demo/mock/preview markers |
| /production/library | apps/web/src/app/production/library/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production | apps/web/src/app/production/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Role hub | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/placeholder-page.tsx | apps/web/src/app/production/placeholder-page.tsx | Production content, calendar, publishing, campaign, or social operations. | PROTOTYPE | Production placeholder | ProductionLayout/roleNavigation | Contains demo/mock/preview markers |
| /production/recommendations | apps/web/src/app/production/recommendations/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/script-studio | apps/web/src/app/production/script-studio/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Hospital context | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/social-intelligence | apps/web/src/app/production/social-intelligence/page.tsx | Production content, calendar, publishing, campaign, or social operations. | CORE_PRODUCTION | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /production/special-days | apps/web/src/app/production/special-days/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PROTOTYPE | Production placeholder | ProductionLayout/roleNavigation | Contains demo/mock/preview markers |
| /production/workflows | apps/web/src/app/production/workflows/page.tsx | Production content, calendar, publishing, campaign, or social operations. | PRODUCTION_OPTIONAL | Local components/data | ProductionLayout/roleNavigation | Route exists in App Router |
| /request-setup | apps/web/src/app/request-setup/page.tsx | General product, onboarding, role routing or shared workspace surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /results | apps/web/src/app/results/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /roles/[role] | apps/web/src/app/roles/[role]/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /roles/admin | apps/web/src/app/roles/admin/page.tsx | Admin control, workspace management, intelligence, reporting or governance surface. | EXPERIMENTAL | Local components/data | AdminShell or admin route tree | Route exists in App Router |
| /staff/approvals | apps/web/src/app/staff/approvals/page.tsx | Staff tasks, requests, approvals, uploads or notifications surface. | CORE_PRODUCTION | Local components/data | roleNavigation | Route exists in App Router |
| /staff | apps/web/src/app/staff/page.tsx | Staff tasks, requests, approvals, uploads or notifications surface. | PRODUCTION_OPTIONAL | Role hub | roleNavigation | Route exists in App Router |
| /staff/requests | apps/web/src/app/staff/requests/page.tsx | Staff tasks, requests, approvals, uploads or notifications surface. | PRODUCTION_OPTIONAL | Local components/data | roleNavigation | Route exists in App Router |
| /staff/tasks | apps/web/src/app/staff/tasks/page.tsx | Staff tasks, requests, approvals, uploads or notifications surface. | CORE_PRODUCTION | Local components/data | roleNavigation | Route exists in App Router |
| /staff/uploads | apps/web/src/app/staff/uploads/page.tsx | Staff tasks, requests, approvals, uploads or notifications surface. | PRODUCTION_OPTIONAL | Local components/data | roleNavigation | Route exists in App Router |
| /strategy/[slug] | apps/web/src/app/strategy/[slug]/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /strategy/content-strategy | apps/web/src/app/strategy/content-strategy/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /strategy layout | apps/web/src/app/strategy/layout.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /strategy/online-presence/[slug] | apps/web/src/app/strategy/online-presence/[slug]/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /strategy/online-presence | apps/web/src/app/strategy/online-presence/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /strategy | apps/web/src/app/strategy/page.tsx | Strategy planning and recommendation surface. | CORE_PRODUCTION | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /today | apps/web/src/app/today/page.tsx | General product, onboarding, role routing or shared workspace surface. | PRODUCTION_OPTIONAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |
| /website-listings | apps/web/src/app/website-listings/page.tsx | General product, onboarding, role routing or shared workspace surface. | EXPERIMENTAL | Local components/data | Route-addressable; no strong nav reference found | Route exists in App Router |

## Web API Inventory

| API Route | Location | Purpose | Status | AI Usage | Persistence |
| --- | --- | --- | --- | --- | --- |
| /api/acquisition/competitors | apps/web/src/app/api/acquisition/competitors/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/acquisition/gbp | apps/web/src/app/api/acquisition/gbp/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/acquisition/locations | apps/web/src/app/api/acquisition/locations/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/acquisition/reviews | apps/web/src/app/api/acquisition/reviews/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/admin/engagement-analytics | apps/web/src/app/api/admin/engagement-analytics/route.ts | Application API route. | Production | No direct AI call detected | Prisma-backed |
| /api/admin/hospitals/:id/integrations/:integrationId | apps/web/src/app/api/admin/hospitals/[id]/integrations/[integrationId]/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/admin/hospitals/:id/integrations/:integrationId/test | apps/web/src/app/api/admin/hospitals/[id]/integrations/[integrationId]/test/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/admin/hospitals/:id/integrations | apps/web/src/app/api/admin/hospitals/[id]/integrations/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/admin/hospitals/:id | apps/web/src/app/api/admin/hospitals/[id]/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/admin/hospitals | apps/web/src/app/api/admin/hospitals/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/admin/instagram-analytics | apps/web/src/app/api/admin/instagram-analytics/route.ts | Application API route. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/integrations/health | apps/web/src/app/api/admin/integrations/health/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/admin/integrations | apps/web/src/app/api/admin/integrations/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/admin/social-intelligence | apps/web/src/app/api/admin/social-intelligence/route.ts | Application API route. | Production | No direct AI call detected | Prisma-backed |
| /api/admin/system/ai-health | apps/web/src/app/api/admin/system/ai-health/route.ts | System health, verification, API audit or PDF export API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/system/api-audit | apps/web/src/app/api/admin/system/api-audit/route.ts | System health, verification, API audit or PDF export API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/system/pdf-export | apps/web/src/app/api/admin/system/pdf-export/route.ts | System health, verification, API audit or PDF export API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/system/platform-verification | apps/web/src/app/api/admin/system/platform-verification/route.ts | System health, verification, API audit or PDF export API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/weekly-analysis-report | apps/web/src/app/api/admin/weekly-analysis-report/route.ts | Application API route. | Experimental/Mock-backed | No direct AI call detected | Prisma-backed |
| /api/admin/workspaces/:id/daily-growth-mission/:executionId/approval | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/approval/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Prisma-backed |
| /api/admin/workspaces/:id/daily-growth-mission/:executionId/quality-review | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/quality-review/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/workspaces/:id/daily-growth-mission/:executionId/replay | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/replay/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/workspaces/:id/daily-growth-mission/:executionId | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/workspaces/:id/daily-growth-mission | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/admin/workspaces/:id/daily-growth-mission/run | apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/run/route.ts | Mission run/list/detail/replay/approval/quality-review API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/agents/competitor-agent | apps/web/src/app/api/agents/competitor-agent/route.ts | Web API agent wrapper/orchestrator route. | Production optional | AI/OpenAI tracked | Service/local/fetch backed |
| /api/agents/content-agent | apps/web/src/app/api/agents/content-agent/route.ts | Web API agent wrapper/orchestrator route. | Production optional | AI/OpenAI tracked | Service/local/fetch backed |
| /api/agents/orchestrator | apps/web/src/app/api/agents/orchestrator/route.ts | Web API agent wrapper/orchestrator route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/agents/review-agent | apps/web/src/app/api/agents/review-agent/route.ts | Web API agent wrapper/orchestrator route. | Production optional | AI/OpenAI tracked | Service/local/fetch backed |
| /api/ai/explanations | apps/web/src/app/api/ai/explanations/route.ts | AI recommendations, insights, opportunities or explanations API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/ai/insights | apps/web/src/app/api/ai/insights/route.ts | AI recommendations, insights, opportunities or explanations API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/ai/opportunities | apps/web/src/app/api/ai/opportunities/route.ts | AI recommendations, insights, opportunities or explanations API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/ai/recommendations | apps/web/src/app/api/ai/recommendations/route.ts | AI recommendations, insights, opportunities or explanations API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/hospitals | apps/web/src/app/api/hospitals/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/hospitals/select | apps/web/src/app/api/hospitals/select/route.ts | Application API route. | Production optional | No direct AI call detected | Prisma-backed |
| /api/intelligence/reviews | apps/web/src/app/api/intelligence/reviews/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/intelligence/trends | apps/web/src/app/api/intelligence/trends/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/knowledge/competitors | apps/web/src/app/api/knowledge/competitors/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/market-intelligence/competitor-report | apps/web/src/app/api/market-intelligence/competitor-report/route.ts | Application API route. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/market-intelligence/context | apps/web/src/app/api/market-intelligence/context/route.ts | Application API route. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/onboarding | apps/web/src/app/api/onboarding/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/operations/events | apps/web/src/app/api/operations/events/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/operations | apps/web/src/app/api/operations/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/overview | apps/web/src/app/api/overview/route.ts | Application API route. | Production | No direct AI call detected | Prisma-backed |
| /api/playbook/opportunities/:slug/generate | apps/web/src/app/api/playbook/opportunities/[slug]/generate/route.ts | Application API route. | Production optional | No direct AI call detected | Service/local/fetch backed |
| /api/social/analytics/overview | apps/web/src/app/api/social/analytics/overview/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/analytics/top-posts | apps/web/src/app/api/social/analytics/top-posts/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/analytics/trends | apps/web/src/app/api/social/analytics/trends/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/analyze | apps/web/src/app/api/social/analyze/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/competitors | apps/web/src/app/api/social/competitors/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Prisma-backed |
| /api/social/ingest | apps/web/src/app/api/social/ingest/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/recommendations | apps/web/src/app/api/social/recommendations/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/social/test-ingest | apps/web/src/app/api/social/test-ingest/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Deprecated/Test | No direct AI call detected | Service/local/fetch backed |
| /api/social/trends | apps/web/src/app/api/social/trends/route.ts | Social analytics, ingestion, competitor, trend and recommendation API. | Production | No direct AI call detected | Service/local/fetch backed |
| /api/test-agent | apps/web/src/app/api/test-agent/route.ts | Application API route. | Deprecated/Test | AI/OpenAI tracked | Service/local/fetch backed |
| /api/test-ingest | apps/web/src/app/api/test-ingest/route.ts | Application API route. | Deprecated/Test | No direct AI call detected | Service/local/fetch backed |

## Package Service Inventory

| Location | Classification | Purpose | Referenced By |
| --- | --- | --- | --- |
| packages/action-engine/examples/social-publishing-workflow.ts | PROTOTYPE | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/integration/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/integration/postgres-action-engine.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/integration/strategy-event-action-adapter.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/interfaces/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/orchestration/action-orchestrator.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/orchestration/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/persistence/in-memory-action-repository.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/persistence/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/persistence/prisma-action-repository.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/queue/bullmq-action-queue.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/queue/in-memory-action-queue.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/queue/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/tests/action-engine.test.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/types/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/validation/action-validation.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/validation/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/workers/action-worker-processor.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/workers/bullmq-worker.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/action-engine/workers/index.ts | CORE_PRODUCTION | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/agent-runtime/src/index.ts | CORE_PRODUCTION | Agent runtime or copilot agent definitions | Package exports/tests/API imports |
| packages/agent-runtime/src/tests/agent-runtime.test.ts | CORE_PRODUCTION | Agent runtime or copilot agent definitions | Package exports/tests/API imports |
| packages/analytics-intelligence/src/analyzers/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/competitors/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/dto/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/events/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/intelligence/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/predictors/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/repositories/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/schemas/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/scoring/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/services/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/tests/analytics-intelligence.test.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/analytics-intelligence/src/utils.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/automation-engine/src/dto/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/events/automation-event-factory.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/events/automation-outbox-dispatcher.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/events/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/execution/automation-execution-service.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/execution/automation-execution-state-machine.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/execution/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/integration/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/mappings/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/mappings/workflow-trigger-mapper.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/queue/bullmq-automation-consumer.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/queue/bullmq-automation-queue.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/queue/exports.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/queue/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/repositories/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/repositories/prisma-automation-repository.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/rules/automation-rule-engine.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/rules/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/schemas/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/services/automation-runtime-services.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/services/automation-trigger-service.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/services/cooldown-enforcement-service.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/services/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/telemetry/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/tests/automation-engine.test.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/automation-engine/src/types/index.ts | CORE_PRODUCTION | Automation rules/execution/queue/runtime | Package exports/tests/API imports |
| packages/autonomous-operations/src/missions/daily-growth-mission.ts | CORE_PRODUCTION | Daily Growth Mission runtime or support | Package exports/tests/API imports |
| packages/autonomous-operations/src/tests/daily-growth-mission.test.ts | CORE_PRODUCTION | Daily Growth Mission runtime or support | Package exports/tests/API imports |
| packages/causal-engine/src/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/agents/default-agents.ts | PRODUCTION_OPTIONAL | Agent runtime or copilot agent definitions | Package exports/tests/API imports |
| packages/copilot-runtime/agents/index.ts | PRODUCTION_OPTIONAL | Agent runtime or copilot agent definitions | Package exports/tests/API imports |
| packages/copilot-runtime/examples/conversational-workflow.ts | PROTOTYPE | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/integration/action-proposal-tool.ts | PRODUCTION_OPTIONAL | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/copilot-runtime/integration/event-reaction-service.ts | PRODUCTION_OPTIONAL | Action plan, approval, queue or worker runtime | Package exports/tests/API imports |
| packages/copilot-runtime/integration/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/integration/openai-provider-adapter.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/interfaces/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/persistence/in-memory-copilot-store.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/persistence/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/persistence/prisma-copilot-store.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/runtime/context-and-prompts.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/runtime/copilot-runtime.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/runtime/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/tests/copilot-runtime.test.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/copilot-runtime/types/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/bus/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/dto/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/pipelines/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/registry/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/replay/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/routing/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/schemas/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/services/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/subscribers/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/telemetry/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/tests/event-orchestrator.test.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/event-orchestrator/src/transport/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/intelligence-engine/src/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/learning-engine/src/index.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/learning-engine/src/tests/learning-engine.test.ts | CORE_PRODUCTION | Supporting service | Package exports/tests/API imports |
| packages/market-intelligence/competitors/analyze-competitor-patterns.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/competitors/competitor-analysis-report.test.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/competitors/competitor-analysis-report.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/competitors/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/providers/external-trend-provider.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/social-trends/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/social-trends/scoring.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/trends/collect-trends.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/market-intelligence/trends/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/priority-engine/src/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/analyzers/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/analyzers/signal-analyzer.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/events/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/events/recommendation-event-factory.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/events/recommendation-lifecycle-service.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/events/recommendation-outbox-dispatcher.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/explanations/ai-explanation-generator.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/explanations/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/priority/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/priority/recommendation-priority-engine.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/reasoning/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/repositories/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/schemas/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/scoring/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/scoring/recommendation-scorer.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/tests/recommendation-engine.test.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/recommendation-engine/types/index.ts | PRODUCTION_OPTIONAL | Supporting service | Package exports/tests/API imports |
| packages/social-engine/analytics/content-classification.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-best-posting-times.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-content-type-breakdown.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-engagement-trends.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-growth-summary.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-overview.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/get-top-posts.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/queries.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/types.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/analytics/utils.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/facebook.collector.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/instagram.collector.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/instagram.metrics.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/linkedin.collector.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/twitter.collector.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/collectors/types.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/competitor-analysis.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/demographic-analysis.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/engagement-analysis.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/ingest-instagram-posts.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/ingest-posts.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/normalize-metrics.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/posting-frequency-analysis.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/services/trend-analysis.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/strategy/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/social-engine/strategy/rule-based-provider.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/social-engine/strategy/strategy-engine.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/social-engine/strategy/types.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/social-engine/workspace/index.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/social-engine/workspace/resolve-social-workspace.ts | CORE_PRODUCTION | Business intelligence and acquisition services | Package exports/tests/API imports |
| packages/strategy-engine/aggregation/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/aggregation/signal-aggregator.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/dashboard/dashboard-projection-service.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/dashboard/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/events/event-publisher.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/events/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/examples/mock-operational-workflow.ts | PROTOTYPE | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/examples/mock-weekly-strategy.ts | PROTOTYPE | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/explanations/default-explanation-builder.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/explanations/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/feedback/feedback-learning-service.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/feedback/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/integration/postgres-strategy-operations.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/interfaces/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/lifecycle/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/lifecycle/recommendation-lifecycle-engine.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/operations/operational-orchestration.test.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/persistence/in-memory-strategy-repository.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/persistence/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/persistence/prisma-strategy-repository.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/persistence/strategy-persistence-service.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/recommendations/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/recommendations/rule-based-recommendation-generator.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/rules/default-rule-executors.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/rules/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/scoring/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/scoring/recommendation-scoring.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/types/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/types/operations.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/types/recommendations.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/types/signals.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/types/strategy.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/utils/numbers.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/validation/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/validation/strategy-validation.test.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/validation/strategy-validation.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/weekly/index.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/weekly/weekly-analysis-report.test.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/weekly/weekly-analysis-report.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/weekly/weekly-strategy-generator.test.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |
| packages/strategy-engine/weekly/weekly-strategy-generator.ts | CORE_PRODUCTION | Strategy generation/scoring/lifecycle/reporting | Package exports/tests/API imports |

## Nest API Service Inventory

| Location | Status | Purpose |
| --- | --- | --- |
| apps/api/src/admin/admin.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/admin/admin.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/admin/admin.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/admin/audit-log.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/ai-audit/ai-audit.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/ai-audit/ai-audit.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/ai-audit/ai-audit.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/ai-audit/ai-usage-tracker.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/app.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/app.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/app.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/auth/auth.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/auth/auth.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/auth/auth.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/auth/google.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/auth/permissions/permission.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/auth/permissions/permissions.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/brand-memory/brand-memory-ai.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/brand-memory/brand-memory.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/brand-memory/brand-memory.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/brand-memory/brand-memory.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/common/context/current-hospital.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/competitor/competitor.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/competitor/competitor.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/competitor/competitor.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/doctor/doctor.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/doctor/doctor.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/doctor/morning-briefing.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/email/email.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/email/email.service.ts | PROTOTYPE | Business service |
| apps/api/src/event-intelligence/event-intelligence.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/event-intelligence/event-intelligence.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/event-intelligence/event-intelligence.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/gbp/gbp.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/gbp/gbp.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/gbp/gbp.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/hospital-request/hospital-request.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/hospital-request/hospital-request.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/hospital-request/hospital-request.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/hospitals/hospitals.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/hospitals/hospitals.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/overview/overview-aggregation.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/overview/overview.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/overview/overview.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/prisma.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/prisma/prisma.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/prisma/prisma.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/production/content-calendar.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/production/content-calendar.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/production/content-calendar.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/production/content-generator.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/production/content-generator.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/production/content-generator.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/production/generation/content-generation.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/production/production-command-centre.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/production/production.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/production/production.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/production/script-studio.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/production/script-studio.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/production/script-studio.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/review/review.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/review/review.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/review/review.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/strategy/strategy.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/strategy/strategy.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/strategy/strategy.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/workspace-content/workspace-content.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/workspace-content/workspace-content.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/workspace-content/workspace-content.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/workspace-embedding/workspace-embedding.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/workspace-embedding/workspace-embedding.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/workspace-embedding/workspace-embedding.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/workspace-ingestion/workspace-ingestion.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/workspace-ingestion/workspace-ingestion.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/workspace-ingestion/workspace-ingestion.service.ts | PRODUCTION_OPTIONAL | Business service |
| apps/api/src/workspace-knowledge/workspace-knowledge.controller.ts | PRODUCTION_OPTIONAL | HTTP controller |
| apps/api/src/workspace-knowledge/workspace-knowledge.module.ts | PRODUCTION_OPTIONAL | Nest module wiring |
| apps/api/src/workspace-knowledge/workspace-knowledge.service.ts | PRODUCTION_OPTIONAL | Business service |
