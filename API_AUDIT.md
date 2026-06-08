# VIP API Audit

Generated: 2026-06-05.

## Summary

Production APIs include Daily Growth Mission, admin system health/audit/PDF verification, social/intelligence/analytics, AI recommendations/opportunities, market intelligence, operations and overview. Experimental or mock-backed APIs include test agent/ingest routes, weekly report demo fallback, web API agent placeholders and Nest MockContentProvider.

## Web App Router APIs

| Route | Location | Purpose | Classification | AI Usage | Persistence |
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

## Nest API Controllers/Services

| Location | Classification | Finding |
| --- | --- | --- |
| apps/api/src/admin/admin.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/admin/admin.module.ts | Production optional | Module wiring. |
| apps/api/src/admin/admin.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/admin/audit-log.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/ai-audit/ai-audit.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/ai-audit/ai-audit.module.ts | Production optional | Module wiring. |
| apps/api/src/ai-audit/ai-audit.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/ai-audit/ai-usage-tracker.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/app.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/app.module.ts | Production optional | Module wiring. |
| apps/api/src/app.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/auth/auth.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/auth/auth.module.ts | Production optional | Module wiring. |
| apps/api/src/auth/auth.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/auth/google.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/auth/permissions/permission.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/auth/permissions/permissions.module.ts | Production optional | Module wiring. |
| apps/api/src/brand-memory/brand-memory-ai.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/brand-memory/brand-memory.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/brand-memory/brand-memory.module.ts | Production optional | Module wiring. |
| apps/api/src/brand-memory/brand-memory.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/common/context/current-hospital.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/competitor/competitor.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/competitor/competitor.module.ts | Production optional | Module wiring. |
| apps/api/src/competitor/competitor.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/doctor/doctor.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/doctor/doctor.module.ts | Production optional | Module wiring. |
| apps/api/src/doctor/morning-briefing.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/email/email.module.ts | Production optional | Module wiring. |
| apps/api/src/email/email.service.ts | Experimental/Mock-backed | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/event-intelligence/event-intelligence.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/event-intelligence/event-intelligence.module.ts | Production optional | Module wiring. |
| apps/api/src/event-intelligence/event-intelligence.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/gbp/gbp.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/gbp/gbp.module.ts | Production optional | Module wiring. |
| apps/api/src/gbp/gbp.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/hospital-request/hospital-request.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/hospital-request/hospital-request.module.ts | Production optional | Module wiring. |
| apps/api/src/hospital-request/hospital-request.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/hospitals/hospitals.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/hospitals/hospitals.module.ts | Production optional | Module wiring. |
| apps/api/src/overview/overview-aggregation.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/overview/overview.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/overview/overview.module.ts | Production optional | Module wiring. |
| apps/api/src/prisma.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/prisma/prisma.module.ts | Production optional | Module wiring. |
| apps/api/src/prisma/prisma.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/production/content-calendar.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/production/content-calendar.module.ts | Production optional | Module wiring. |
| apps/api/src/production/content-calendar.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/production/content-generator.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/production/content-generator.module.ts | Production optional | Module wiring. |
| apps/api/src/production/content-generator.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/production/generation/content-generation.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/production/production-command-centre.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/production/production.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/production/production.module.ts | Production optional | Module wiring. |
| apps/api/src/production/script-studio.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/production/script-studio.module.ts | Production optional | Module wiring. |
| apps/api/src/production/script-studio.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/review/review.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/review/review.module.ts | Production optional | Module wiring. |
| apps/api/src/review/review.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/strategy/strategy.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/strategy/strategy.module.ts | Production optional | Module wiring. |
| apps/api/src/strategy/strategy.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/workspace-content/workspace-content.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/workspace-content/workspace-content.module.ts | Production optional | Module wiring. |
| apps/api/src/workspace-content/workspace-content.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/workspace-embedding/workspace-embedding.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/workspace-embedding/workspace-embedding.module.ts | Production optional | Module wiring. |
| apps/api/src/workspace-embedding/workspace-embedding.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/workspace-ingestion/workspace-ingestion.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/workspace-ingestion/workspace-ingestion.module.ts | Production optional | Module wiring. |
| apps/api/src/workspace-ingestion/workspace-ingestion.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |
| apps/api/src/workspace-knowledge/workspace-knowledge.controller.ts | Production optional | Controller should be included only if matching frontend route is retained. |
| apps/api/src/workspace-knowledge/workspace-knowledge.module.ts | Production optional | Module wiring. |
| apps/api/src/workspace-knowledge/workspace-knowledge.service.ts | Production optional | Service should remain if database-backed or referenced by module/controller. |

## Immediate API Hardening

| Priority | API | Action |
| --- | --- | --- |
| P0 | /api/test-agent; /api/test-ingest; /api/social/test-ingest | Remove from production deployment or guard with NODE_ENV !== production. |
| P0 | /api/admin/workspaces/:id/daily-growth-mission/* | Keep; this is the production mission control API set. |
| P1 | /api/agents/* | Reconcile route implementations with placeholder index files and add tests before production exposure. |
| P1 | /api/admin/weekly-analysis-report | Replace DEMO_HOSPITALS fallback with persisted workspace or label dev preview only. |
| P1 | /api/admin/system/* | Keep; useful release validation and provider health surfaces. |
