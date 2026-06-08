# VIP Migration Reconciliation Plan

Generated: 2026-06-05

## Executive Summary

Migration history diverges after:

```text
20260526150000_realtime_operational_workflows
```

The remote database is not just behind the local repository. It has an incompatible migration lineage:

- **13 local migrations are not applied remotely.**
- **9 remote migrations are not present locally.**
- The remote `_prisma_migrations` table contains rolled-back failed attempts for several shared migrations.
- The remote `_prisma_migrations` table also contains an unresolved failed/in-progress remote-only migration: `20260528120000_event_intelligence_store`.
- A direct local-schema reconciliation would be destructive because it would drop remote-only tables containing data.

Recommended strategy: **do not run `prisma migrate deploy` yet.** First create a migration reconciliation branch that preserves remote-only data, restores or documents remote-only migration history, and produces one reviewed forward-only reconciliation migration.

## Last Common Migration

```text
20260526150000_realtime_operational_workflows
```

This migration exists locally and is applied remotely.

## Local Migration Inventory

| Migration | Local SHA-12 | Remote State | Notes |
| --- | --- | --- | --- |
| `000000000000_baseline` | `5095464A576E` | Applied remotely with different checksum `f3fb5a7dde26` | Same migration name, checksum differs. Requires manual verification before assuming equivalence. |
| `20260523080000_market_intelligence` | `F303B36C9A84` | Applied; also has rolled-back failed attempt | Remote failed once because `MarketSignalObservation` already existed, then was marked/applied. |
| `20260525090000_strategy_operations` | `4944F080A1D3` | Applied; also has rolled-back failed attempt | Remote failed once because enum `RecommendationLifecycleStatus` already existed, then was marked/applied. |
| `20260525110000_autonomous_operating_system` | `BF050D4A2E30` | Applied; also has rolled-back failed attempt | Remote failed once because enum `ActionPlanType` already existed, then was marked/applied. |
| `20260526120000_durable_automation_infrastructure` | `9835A5987D0F` | Applied | Common. |
| `20260526150000_realtime_operational_workflows` | `355BEE56721A` | Applied | Last common migration. |
| `20260526180000_media_reporting_operations` | `D0CDF1F14C83` | Local-only | Not applied remotely. |
| `20260528120000_event_intelligence_priorities` | `AB5860A2CDFB` | Local-only | Not applied remotely. Conflicts conceptually with remote-only `20260528120000_event_intelligence_store`. |
| `20260529090000_rbac_foundation` | `54A56AD7AF40` | Local-only | Not applied remotely. |
| `20260529100000_hospital_context_foundation` | `9D76B09CF472` | Local-only | Not applied remotely. |
| `20260529110000_admin_command_centre_foundation` | `C6FE67FAE133` | Local-only | Not applied remotely. |
| `20260529120000_user_invitations_onboarding` | `E442E93A526E` | Local-only | Not applied remotely. |
| `20260529124500_content_calendar_system` | `675B6B518668` | Local-only | Not applied remotely. |
| `20260529133000_ai_script_studio` | `6E5845847B35` | Local-only | Not applied remotely. |
| `20260531103000_content_generator` | `E2F784AAA272` | Local-only | Not applied remotely. |
| `20260602190000_hospital_integration_config` | `30DBAF30E2A2` | Local-only | Not applied remotely. |
| `20260603110000_phase_e_verification_foundation` | `414339D09C45` | Local-only | Not applied remotely. |
| `20260605090000_daily_growth_mission` | `7D520AE5B8DA` | Local-only | Not applied remotely. |
| `20260605103000_daily_growth_pilot_quality_review` | `AF6F42F7E3B6` | Local-only | Not applied remotely. |

## Remote Migration Inventory

| Remote Migration | Remote State | Remote SHA-12 | Notes |
| --- | --- | --- | --- |
| `000000000000_baseline` | Applied | `f3fb5a7dde26` | Same name as local baseline but checksum differs. |
| `20260518101535_init` | Applied | `8eb21419de8c` | Remote-only. |
| `20260519044805_workspace` | Applied | `f1180fb9569b` | Remote-only. |
| `20260519050528_website_content` | Applied | `d794cc9bca59` | Remote-only. |
| `20260519051413_vector_memory` | Applied | `2396c8f807af` | Remote-only. |
| `20260519090001_content_drafts` | Applied | `fc5d9eb2be2a` | Remote-only. |
| `20260519092357_review_ai` | Applied | `6274fbaec0af` | Remote-only. |
| `20260519161156_review_alerts` | Applied | `c12ec30791dd` | Remote-only. |
| `20260519202705_brand_memory` | Applied | `a212aebaa50a` | Remote-only. |
| `20260523080000_market_intelligence` | Rolled back failed attempt | `f303b36c9a84` | Failed with `relation "MarketSignalObservation" already exists`. |
| `20260523080000_market_intelligence` | Applied | `f303b36c9a84` | Shared with local. |
| `20260525090000_strategy_operations` | Rolled back failed attempt | `4944f080a1d3` | Failed with `type "RecommendationLifecycleStatus" already exists`. |
| `20260525090000_strategy_operations` | Applied | `4944f080a1d3` | Shared with local. |
| `20260525110000_autonomous_operating_system` | Rolled back failed attempt | `bf050d4a2e30` | Failed with `type "ActionPlanType" already exists`. |
| `20260525110000_autonomous_operating_system` | Applied | `bf050d4a2e30` | Shared with local. |
| `20260526120000_durable_automation_infrastructure` | Applied | `9835a5987d0f` | Shared with local. |
| `20260526150000_realtime_operational_workflows` | Applied | `355bee56721a` | Last common migration. |
| `20260528120000_event_intelligence_store` | Failed or in progress | `1cfdb91686bf` | Remote-only unresolved failure: `relation "EventEnvelope" already exists`. |

## Local-Only Migrations

| Migration | Main Objects / Changes | Data Risk If Applied Blindly |
| --- | --- | --- |
| `20260526180000_media_reporting_operations` | Creates `OperationalMediaAsset`, `OperationalContentVersion`; alters `OperationalCampaign`. | Medium. Adds operational media/version tables; must verify remote `OperationalCampaign` columns before applying. |
| `20260528120000_event_intelligence_priorities` | Alters `EventEnvelope`; adds event priority index. | Medium. Remote already has failed `event_intelligence_store`; verify `EventEnvelope` columns/indexes first. |
| `20260529090000_rbac_foundation` | Creates `UserRole` enum and `User`; alters `User`. | High. Remote already has `UserRole` enum and `User` table from remote-only history. Applying raw SQL may hit existing-object conflicts. |
| `20260529100000_hospital_context_foundation` | Alters `HospitalWorkspace`. | Medium. Must compare existing columns/nullability/defaults. |
| `20260529110000_admin_command_centre_foundation` | Creates `AuditLog`, `BrandVoice`, `Template`; alters `HospitalWorkspace`, `User`. | High. Remote has separate admin/audit tables not in local schema. |
| `20260529120000_user_invitations_onboarding` | Creates `InvitationStatus` enum and `Invitation`; alters `User`. | Medium. Verify enum/table absence before applying. |
| `20260529124500_content_calendar_system` | Creates calendar enums, `ContentCalendarItem`, `ContentCalendarScript`. | Medium. Tables currently absent remotely; foreign keys depend on `HospitalWorkspace` and `User` state. |
| `20260529133000_ai_script_studio` | Creates script enums; alters `ContentCalendarScript`; drops old script unique index if present. | Medium. Depends on content calendar migration; includes index replacement. |
| `20260531103000_content_generator` | Creates `ContentGeneratorRun`. | Low to Medium. Table currently absent remotely; depends on `HospitalWorkspace`. |
| `20260602190000_hospital_integration_config` | Creates `IntegrationConfigStatus`, `HospitalIntegrationConfig`; alters `HospitalWorkspace`. | Medium. Table currently absent remotely; verify workspace columns. |
| `20260603110000_phase_e_verification_foundation` | Creates health/provenance/PDF enums and verification/PDF/fingerprint tables. | Medium. Tables currently absent remotely; adds platform verification storage. |
| `20260605090000_daily_growth_mission` | Creates `MissionExecution`, snapshots, reports, opportunities, briefs, packages, outcomes, learning memory. | High for feature readiness. Tables currently absent remotely; Daily Growth Mission cannot run until reconciled. |
| `20260605103000_daily_growth_pilot_quality_review` | Creates `PilotQualityReview`. | Medium. Depends on `MissionExecution`. |

## Remote-Only Migrations

These are present in remote `_prisma_migrations` but absent from `packages/database/prisma/migrations`.

| Migration | Likely Scope From Name / Observed Schema | Reconciliation Action |
| --- | --- | --- |
| `20260518101535_init` | Early schema initialization. | Recover original SQL if possible or document as superseded by local baseline. |
| `20260519044805_workspace` | Early workspace table setup. | Recover original SQL or map to local baseline. |
| `20260519050528_website_content` | Website content table. | Recover original SQL or map to local baseline. |
| `20260519051413_vector_memory` | Vector memory table. | Recover original SQL or map to local baseline. |
| `20260519090001_content_drafts` | Content drafts table. | Recover original SQL or map to local baseline. |
| `20260519092357_review_ai` | Review AI fields/tables. | Recover original SQL or map to local baseline. |
| `20260519161156_review_alerts` | Review alerts table. | Recover original SQL or map to local baseline. |
| `20260519202705_brand_memory` | Brand memory table. | Recover original SQL or map to local baseline. |
| `20260528120000_event_intelligence_store` | Event intelligence durable store. Remote failed because `EventEnvelope` already exists. | Must be resolved before any deploy. Do not mark applied until schema diff confirms equivalent objects exist. |

## Schema Diff Summary

Generated read-only with:

```powershell
npx prisma migrate diff --from-url <reachable-pooler-url> --to-schema-datamodel prisma/schema.prisma --script
```

Summary from remote schema to local datamodel:

| Operation | Count |
| --- | ---: |
| Create enum/type | 12 |
| Create table | 21 |
| Alter table | 50 |
| Create index | 63 |
| Create unique index | 9 |
| Drop foreign key/constraint | 4 |
| Drop default | 5 |
| Drop table | 3 |
| Drop type | 0 |
| Drop index | 0 |

### Objects Missing Remotely But Present Locally

Enums/types to add:

```text
ContentCalendarType
ContentCalendarStatus
ContentCalendarPriority
ContentCalendarCategory
ContentScriptType
ContentScriptStatus
HealthStatus
VerificationResultStatus
VerificationCheckStatus
DataProvenanceStatus
PdfExportStatus
DuplicateStatus
```

Tables to add:

```text
ContentCalendarItem
ContentCalendarScript
ContentGeneratorRun
SystemEndpointHealth
SystemVerificationRun
SystemVerificationCheck
DataProvenanceSnapshot
AiProviderHealth
PdfExportRun
MissionExecution
DailyBusinessSnapshot
DailyPerformanceReport
StrategyOutcome
TrendOpportunity
ContentBrief
ContentProductionPackage
DailyGrowthReport
ContentOutcome
AgentLearningMemory
PilotQualityReview
RecommendationSimilarityFingerprint
```

Existing tables with local-required alters:

```text
BrandVoice
EventEnvelope
HospitalIntegrationConfig
HospitalWorkspace
Template
User
```

Key existing-table diff:

```text
EventEnvelope.priority TEXT NOT NULL DEFAULT 'NORMAL'
BrandVoice.updatedAt DROP DEFAULT
HospitalIntegrationConfig.updatedAt DROP DEFAULT
HospitalWorkspace.updatedAt DROP DEFAULT
Template.updatedAt DROP DEFAULT
User.updatedAt DROP DEFAULT
HospitalWorkspace_hospitalRequestId_fkey changes from restrictive remote behavior to SET NULL
```

### Remote Objects Not Present Locally

The local Prisma schema would drop these remote tables:

```text
AdminRolePermission
AiAuditLog
AiModelPricing
```

Remote-only table row counts:

| Table | Rows | Data Risk |
| --- | ---: | --- |
| `AdminRolePermission` | 120 | High. Role/feature permission data would be lost if dropped. |
| `AiAuditLog` | 0 | Low immediate data loss, but table may be part of old audit path. |
| `AiModelPricing` | 2 | Medium. Pricing metadata would be lost if dropped. |

Remote-only table columns:

| Table | Columns |
| --- | --- |
| `AdminRolePermission` | `id`, `hospitalId`, `roleId`, `featureKey`, `enabled`, `createdAt`, `updatedAt` |
| `AiAuditLog` | `id`, `hospitalId`, `userId`, `roleId`, `feature`, `provider`, `model`, `promptTokens`, `completionTokens`, `totalTokens`, `estimatedCost`, `responseTimeMs`, `success`, `errorMessage`, `createdAt` |
| `AiModelPricing` | `id`, `provider`, `model`, `inputTokenPricePerMillion`, `outputTokenPricePerMillion`, `currency`, `isActive`, `effectiveFrom`, `effectiveTo`, `createdAt`, `updatedAt` |

## Data Risk Assessment

| Risk | Severity | Evidence | Mitigation |
| --- | --- | --- | --- |
| Loss of admin permission data | High | Local schema diff drops `AdminRolePermission`; remote has 120 rows. | Do not drop. Migrate rows into local RBAC tables or preserve table until replacement is validated. |
| Loss of AI pricing metadata | Medium | Local schema diff drops `AiModelPricing`; remote has 2 rows. | Copy into local pricing/AI provider configuration path or preserve table. |
| Unresolved remote migration state | High | `20260528120000_event_intelligence_store` has no `finished_at` or `rolled_back_at`. | Resolve explicitly after confirming schema equivalence; do not deploy new migrations while unresolved. |
| Existing object conflicts | High | Prior remote failed attempts show existing enum/table conflicts. | Generate idempotent/manual reconciliation SQL, not blind replay of local migrations. |
| Daily Growth Mission tables absent | High | `MissionExecution`, `DailyGrowthReport`, `ContentProductionPackage`, `PilotQualityReview` do not exist remotely. | Add after migration history reconciliation. |
| Foreign key behavior change | Medium | Diff changes `HospitalWorkspace_hospitalRequestId_fkey` behavior to `ON DELETE SET NULL`. | Review intended lifecycle before applying. |
| UpdatedAt default removal | Low to Medium | Diff drops defaults on multiple `updatedAt` columns. | Safe if application/Prisma always writes `updatedAt`; verify no raw inserts depend on DB defaults. |

## Conflicting Migrations

| Conflict | Details | Required Decision |
| --- | --- | --- |
| Local baseline vs remote early migrations | Remote has `20260518101535_*` through `20260519202705_*`; local has `000000000000_baseline` with different checksum. | Recover missing remote migration files or formally document that local baseline supersedes them. |
| Local `20260528120000_event_intelligence_priorities` vs remote `20260528120000_event_intelligence_store` | Same timestamp prefix but different name and state. Remote version failed because `EventEnvelope` already exists. | Decide whether remote migration should be rolled back/resolved or replaced by local event priority migration. |
| Local RBAC model vs remote `AdminRolePermission` | Local schema has `Permission`, `Role`, `RolePermission`, `WorkspaceMemberRole`; remote has legacy `AdminRolePermission` with data. | Migrate legacy permissions into new RBAC tables or keep legacy compatibility table. |
| Local AI audit/provider model vs remote `AiAuditLog` / `AiModelPricing` | Local schema has `AIExecutionTrace`, `AiProviderHealth`, `PdfExportRun`; remote has older AI audit/pricing tables. | Map old audit/pricing data to new tables or preserve legacy tables. |
| Shared migrations with rolled-back duplicates | Remote contains rolled-back failures and applied rows for `market_intelligence`, `strategy_operations`, and `autonomous_operating_system`. | Leave applied rows intact; ensure failed rolled-back rows are understood before reconciliation. |

## Destructive Migration Findings

The local-only migration files themselves do **not** contain `DROP TABLE` or `DROP COLUMN` operations.

However, the generated reconciliation diff from remote schema to local datamodel is destructive:

```text
DROP TABLE "AdminRolePermission";
DROP TABLE "AiAuditLog";
DROP TABLE "AiModelPricing";
```

It would also drop constraints/defaults:

```text
DROP CONSTRAINT "AdminRolePermission_hospitalId_fkey"
DROP CONSTRAINT "AiAuditLog_hospitalId_fkey"
DROP CONSTRAINT "AiAuditLog_userId_fkey"
DROP CONSTRAINT "HospitalWorkspace_hospitalRequestId_fkey"
DROP DEFAULT on several updatedAt columns
```

Do not apply this raw diff to production.

## Recommended Merge Strategy

### Strategy: Forward-Only Reconciliation, Preserve Remote Data

1. **Create a full database backup/snapshot.**
   - Include table data and `_prisma_migrations`.
   - Export `AdminRolePermission`, `AiAuditLog`, and `AiModelPricing` separately for easy rollback.

2. **Recover remote-only migration files if available.**
   - Search older branches, deployment artifacts, and CI logs for:
     - `20260518101535_init`
     - `20260519044805_workspace`
     - `20260519050528_website_content`
     - `20260519051413_vector_memory`
     - `20260519090001_content_drafts`
     - `20260519092357_review_ai`
     - `20260519161156_review_alerts`
     - `20260519202705_brand_memory`
     - `20260528120000_event_intelligence_store`
   - If recovered, commit them in a reconciliation branch for auditability.

3. **Resolve the remote failed migration before applying any new migration.**
   - Inspect whether `20260528120000_event_intelligence_store` partially created any objects.
   - Because the failure is `relation "EventEnvelope" already exists`, compare the remote `EventEnvelope`, `EventDelivery`, and `EventDeadLetter` structures to local schema.
   - If equivalent, plan a controlled `prisma migrate resolve` action in a maintenance window.
   - If not equivalent, write manual SQL to bring the schema to the desired local structure first, then resolve.

4. **Preserve or migrate remote-only tables.**
   - `AdminRolePermission` should not be dropped until 120 rows are mapped into the local RBAC model.
   - `AiModelPricing` should not be dropped until the two pricing rows are moved into the new AI provider/pricing path or retained as a compatibility table.
   - `AiAuditLog` has 0 rows but should still be reviewed for application references before removal.

5. **Generate a reviewed reconciliation migration.**
   - It should add missing local objects.
   - It should avoid dropping remote-only tables in the same release.
   - It should handle existing enums/tables with explicit guards where necessary.
   - It should add Daily Growth Mission tables after dependencies are satisfied.

6. **Test on a cloned staging database.**
   - Restore production/staging snapshot to a clone.
   - Apply the reconciliation plan on the clone only.
   - Run:
     - `npx prisma migrate status --schema prisma/schema.prisma`
     - `npx prisma validate --schema prisma/schema.prisma`
     - `npm run prisma:generate`
     - Daily Growth Mission smoke execution against one workspace.

7. **Only then update production migration history.**
   - Use `prisma migrate resolve` only for migrations that are proven equivalent or intentionally superseded.
   - Use `prisma migrate deploy` only after status is clean on the cloned database.

## Rollback Strategy

1. **Before reconciliation**
   - Capture DB snapshot.
   - Export `_prisma_migrations`.
   - Export remote-only tables:
     - `AdminRolePermission`
     - `AiAuditLog`
     - `AiModelPricing`

2. **During staging rehearsal**
   - Apply reconciliation only on a cloned database.
   - If any migration step fails, discard clone and revise SQL.

3. **During production maintenance**
   - Pause write traffic where feasible.
   - Apply only the reviewed forward-only reconciliation migration.
   - Run `migrate status` immediately after.
   - Run application smoke tests and Daily Growth Mission table checks.

4. **If production reconciliation fails**
   - Stop app writes.
   - Restore the database snapshot.
   - Revert deployment environment to the previous app build.
   - Restore exported remote-only tables if a partial manual recovery is required.

5. **If application behavior regresses after successful schema reconciliation**
   - Disable Daily Growth Mission scheduler/trigger.
   - Keep new tables intact.
   - Roll back application build first; avoid schema rollback unless data corruption is confirmed.

## No-Go Conditions

Do not proceed to production migration while any of these are true:

- Direct or approved migration endpoint remains unreachable.
- `20260528120000_event_intelligence_store` remains failed/unresolved in `_prisma_migrations`.
- `AdminRolePermission` data has no migration or preservation plan.
- Raw Prisma diff still contains `DROP TABLE "AdminRolePermission"` or `DROP TABLE "AiModelPricing"`.
- Daily Growth Mission tables are still absent from the target schema.
- `npx prisma migrate status --schema prisma/schema.prisma` does not complete cleanly on a cloned database first.

## Final Recommendation

Proceed with a **schema reconciliation project**, not a direct migration deploy.

The safest path is to preserve remote-only data, recover or document the missing remote migration lineage, resolve the failed remote event migration, then create one reviewed forward-only reconciliation migration that adds the missing local schema without dropping legacy remote-only tables in the same release.
