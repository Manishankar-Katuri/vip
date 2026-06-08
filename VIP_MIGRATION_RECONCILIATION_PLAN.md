# VIP Migration Reconciliation Plan

## Summary
Migration deployment remains **NO-GO**.

The divergence is now explainable: the active database migration table contains migrations from the older `apps/api/prisma` schema line, while the current production code uses `packages/database/prisma` as the source of truth. Some migrations were copied or shared between the two lines, but the earliest app/API migrations were replaced locally by a `packages/database` baseline.

This plan is read-only. No migrations were applied, no migration files were edited, no schema files were changed, no env files were changed, and no data was modified.

## Migration Source Inventory
### Prisma Schemas Found
| Path | Role | Notes |
| --- | --- | --- |
| `packages/database/prisma/schema.prisma` | Current production source of truth | Used by `@vip/database`, `apps/web`, workflow/report/client readiness, generated client output, and Phase 2-9 implementation. Requires `DATABASE_URL` and `DIRECT_URL`. |
| `apps/api/prisma/schema.prisma` | Older API schema line | Used by the Nest API app historically. Contains old hospital/content/review/intelligence models but does not contain current production owner workflow/report/client models. |

### Migration Folders Found
| Path | Count / Evidence | Notes |
| --- | --- | --- |
| `packages/database/prisma/migrations` | 24 migration folders | Current package migration line. Contains baseline plus production workflow/report/client migrations. |
| `apps/api/prisma/migrations` | 19 migration folders | Older API migration line. Contains all DB-only migration names reported by Prisma status. |

### DB-Only Migration Names Found Locally
All DB-only migration names reported by `prisma migrate status` exist in `apps/api/prisma/migrations`:

- `20260518101535_init`
- `20260519044805_workspace`
- `20260519050528_website_content`
- `20260519051413_vector_memory`
- `20260519090001_content_drafts`
- `20260519092357_review_ai`
- `20260519161156_review_alerts`
- `20260519202705_brand_memory`
- `20260528120000_event_intelligence_store`

## Schema Ownership Analysis
`packages/database/prisma/schema.prisma` appears to be the current production source of truth because:

- `apps/web` imports Prisma through `@vip/database`.
- Phase 2-9 code and readiness checks depend on models present only in `packages/database`, including:
  - `Workspace`
  - `MissionExecution`
  - `ReportDraft`
  - `ReportExport`
  - `ReportApproval`
  - `ReportRecipient`
  - `ReportDelivery`
  - `ClientOperationalSettings`
- `packages/database/package.json` owns `prisma:generate`, `prisma:push`, and `prisma:migrate` scripts for the package schema.
- `packages/database/prisma/schema.prisma` outputs the generated client to `packages/database/src/generated/client`.

`apps/api/prisma/schema.prisma` appears to be an older schema line because:

- It contains the initial DB-only migration history.
- It does not contain the new production workflow/report/client models required by readiness.
- `apps/api/package.json` does not define Prisma migration scripts.
- It has models such as `AiAuditLog` and older hospital/content/review foundations but lacks the current owner workflow-first production stack.

The DB-only migrations likely belong to the older API schema line and are not accidental unknown files.

## Current Migration Status Context
Known from the prior safe `migrate status` check:

- Last common migration: `20260526150000_realtime_operational_workflows`
- Current package migrations after that point are pending on the active database.
- The active database has earlier `apps/api` migration records that are not present in `packages/database/prisma/migrations`.

## Reconciliation Matrix
| Migration name | Status | Found path if local | Likely schema line | Risk | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `000000000000_baseline` | common | `packages/database/prisma/migrations/000000000000_baseline` | current | Medium | Keep as package baseline; do not duplicate into API line. |
| `20260518101535_init` | db-only | `apps/api/prisma/migrations/20260518101535_init` | old-api | High | Do not mark over blindly. Restore/copy only after verifying it exactly represents already-applied DB history and does not conflict with package baseline. |
| `20260519044805_workspace` | db-only | `apps/api/prisma/migrations/20260519044805_workspace` | old-api | High | Same as above; likely pre-baseline API foundation. |
| `20260519050528_website_content` | db-only | `apps/api/prisma/migrations/20260519050528_website_content` | old-api | High | Same as above. |
| `20260519051413_vector_memory` | db-only | `apps/api/prisma/migrations/20260519051413_vector_memory` | old-api | High | Same as above. |
| `20260519090001_content_drafts` | db-only | `apps/api/prisma/migrations/20260519090001_content_drafts` | old-api | High | Same as above. |
| `20260519092357_review_ai` | db-only | `apps/api/prisma/migrations/20260519092357_review_ai` | old-api | High | Same as above. |
| `20260519161156_review_alerts` | db-only | `apps/api/prisma/migrations/20260519161156_review_alerts` | old-api | High | Same as above. |
| `20260519202705_brand_memory` | db-only | `apps/api/prisma/migrations/20260519202705_brand_memory` | old-api | High | Same as above. |
| `20260523080000_market_intelligence` | common | `packages/database/prisma/migrations/20260523080000_market_intelligence` | current | Low | Keep. |
| `20260525090000_strategy_operations` | common | `packages/database/prisma/migrations/20260525090000_strategy_operations` | current | Low | Keep. |
| `20260525110000_autonomous_operating_system` | common | `packages/database/prisma/migrations/20260525110000_autonomous_operating_system` | current | Low | Keep. |
| `20260526120000_durable_automation_infrastructure` | common | `packages/database/prisma/migrations/20260526120000_durable_automation_infrastructure` | current | Low | Keep. |
| `20260526150000_realtime_operational_workflows` | common | `packages/database/prisma/migrations/20260526150000_realtime_operational_workflows` | current | Low | Last common migration; keep. |
| `20260526180000_media_reporting_operations` | local-only | `packages/database/prisma/migrations/20260526180000_media_reporting_operations` | current | Medium | Pending. Apply only after reconciliation and backup/dev confirmation. |
| `20260528120000_event_intelligence_store` | db-only | `apps/api/prisma/migrations/20260528120000_event_intelligence_store` | old-api | High | Compare with package `event_intelligence_priorities`; do not resolve blindly. |
| `20260528120000_event_intelligence_priorities` | local-only | `packages/database/prisma/migrations/20260528120000_event_intelligence_priorities` | current | High | Timestamp overlaps old API migration with different name; inspect SQL equivalence before any deploy. |
| `20260529090000_rbac_foundation` | pending but identical in both local lines | `packages/database/prisma/migrations/20260529090000_rbac_foundation`; `apps/api/prisma/migrations/20260529090000_rbac_foundation` | shared/current | Medium | Hashes match across schema lines. Pending on DB per status; apply only after history reconciliation. |
| `20260529100000_hospital_context_foundation` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260529110000_admin_command_centre_foundation` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260529120000_user_invitations_onboarding` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260529124500_content_calendar_system` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260529133000_ai_script_studio` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260531103000_content_generator` | pending but identical in both local lines | both package and API paths | shared/current | Medium | Hashes match; pending on DB. |
| `20260602190000_ai_audit_logs` | local in API only, not DB status, not package | `apps/api/prisma/migrations/20260602190000_ai_audit_logs` | old-api | Medium | Do not copy into package line unless API schema is intentionally restored as source. |
| `20260602190000_dynamic_permission_matrix` | local in API only, not DB status, not package | `apps/api/prisma/migrations/20260602190000_dynamic_permission_matrix` | old-api | Medium | Same as above. |
| `20260602193000_hospital_admin_realtime` | local in API only, not DB status, not package | `apps/api/prisma/migrations/20260602193000_hospital_admin_realtime` | old-api | Medium | Same as above. |
| `20260602190000_hospital_integration_config` | local-only | `packages/database/prisma/migrations/20260602190000_hospital_integration_config` | current | Medium | Pending. Apply only after reconciliation. |
| `20260603110000_phase_e_verification_foundation` | local-only | `packages/database/prisma/migrations/20260603110000_phase_e_verification_foundation` | current | Medium | Pending. Apply only after reconciliation. |
| `20260605090000_daily_growth_mission` | local-only | `packages/database/prisma/migrations/20260605090000_daily_growth_mission` | current | High | Required by readiness. Pending. Do not apply until migration history is reconciled. |
| `20260605103000_daily_growth_pilot_quality_review` | local-only | `packages/database/prisma/migrations/20260605103000_daily_growth_pilot_quality_review` | current | Medium | Pending. |
| `20260607170000_adaptive_content_execution_plan` | local-only | `packages/database/prisma/migrations/20260607170000_adaptive_content_execution_plan` | current | Medium | Pending. |
| `20260608143000_report_draft_foundation` | local-only | `packages/database/prisma/migrations/20260608143000_report_draft_foundation` | current | High | Required by readiness. Pending. |
| `20260608153000_report_export_foundation` | local-only | `packages/database/prisma/migrations/20260608153000_report_export_foundation` | current | High | Required by readiness. Pending. |
| `20260608163000_report_approval_send_flow` | local-only | `packages/database/prisma/migrations/20260608163000_report_approval_send_flow` | current | High | Required by readiness. Pending. |
| `20260608173000_client_operational_settings` | local-only | `packages/database/prisma/migrations/20260608173000_client_operational_settings` | current | High | Required by readiness. Pending. |

## Safe Reconciliation Options
### Option A: Restore Missing DB Migration Folders Locally
**When safe**
- The target database is the same DB that originally ran the `apps/api` migrations.
- The DB-only migrations are confirmed to match the SQL in `apps/api/prisma/migrations`.
- Restoring them into the active migration directory will not conflict with `000000000000_baseline`.

**How to do it later**
- Create a backup first.
- Copy the DB-only migration folders from `apps/api/prisma/migrations` into `packages/database/prisma/migrations`.
- Run `prisma migrate status` again.

**Risks**
- The package baseline may already represent those same tables, so adding old folders may make the local history logically inconsistent.
- Prisma may treat the restored migrations as applied but still have checksum or ordering concerns.
- If SQL differs from DB-applied SQL, this can create future drift.

**Required evidence**
- Check `_prisma_migrations` checksums against local SQL checksums where possible.
- Confirm no duplicate DDL conflicts with baseline assumptions.

### Option B: Use `prisma migrate resolve`
**When safe**
- A migration is known to have been applied outside Prisma or represented by a verified baseline.
- The actual database schema matches the migration's intended end-state.

**Why risky**
- It changes migration history without applying SQL.
- It can make Prisma believe a table/index exists when it does not.
- It is especially unsafe for the required missing readiness models because readiness proves those tables are not currently queryable.

**Migrations that might qualify**
- Old DB-only migrations may qualify only if reconciling the package baseline with an existing database and the schema state is verified.
- Shared identical migrations may qualify only if their DDL is already present in the DB despite status showing pending.

**Migrations that should not be resolved blindly**
- `20260605090000_daily_growth_mission`
- `20260608143000_report_draft_foundation`
- `20260608153000_report_export_foundation`
- `20260608163000_report_approval_send_flow`
- `20260608173000_client_operational_settings`

These are required by readiness and are currently not queryable.

### Option C: Create a Fresh Development/Staging Database and Apply Local Migrations From Zero
**When best**
- For local pilot or staging when preserving current DB data is not required.
- When the current database history is tangled and the safest path is a clean current schema.

**Steps later**
1. Create a new Supabase project or new isolated database.
2. Configure `DATABASE_URL` and `DIRECT_URL` for that DB.
3. Run `prisma migrate deploy` from `packages/database`.
4. Run `prisma migrate status`.
5. Run `/api/system/readiness`.
6. Seed or import only approved pilot data.

**Pros**
- Cleanest and lowest-risk path for local pilot/staging.
- Avoids old API history reconciliation.
- Current production source of truth is used directly.

**Cons**
- Existing data from the current database is not automatically preserved.
- Requires controlled seed/import if pilot data is needed.

**Recommendation for local pilot**
- Recommended if the current Supabase database does not contain essential production data.

### Option D: Baseline the Current Database Carefully
**When used**
- When the current database contains valuable data that must be preserved.
- When old API migration history cannot be cleanly restored.

**Why risky**
- Baselines can hide drift.
- Wrong baselining can make future migrations fail or silently miss required structures.
- Requires exact schema diff evidence.

**Required backups**
- Full Supabase backup.
- `_prisma_migrations` export.
- Schema-only dump.
- Data backup for tenant-critical tables.

**Commands that may be needed later, DO NOT RUN YET**
```text
npx prisma migrate diff ...
npx prisma migrate resolve --applied <migration_name> --schema prisma/schema.prisma
```

Do not use this path without a written drift analysis.

### Option E: Separate Old API Schema DB From New Package Schema DB
**When evidence supports it**
- If the current DB is the old Nest API database and should remain on the old API schema.
- If the new owner workflow app should use a separate `packages/database` database.

**How to avoid mixing**
- Keep `apps/api/prisma` and `packages/database/prisma` migration histories separate.
- Use separate Supabase projects/databases or schemas.
- Point `apps/web` and `@vip/database` only at the package-schema database.
- Do not apply package migrations to the old API DB unless that DB is explicitly chosen for upgrade.

## Recommended Path
### Local Pilot
Recommended path: **Option C, fresh development/pilot database**.

Why:
- Fastest safe route to unblock readiness.
- Avoids mixing old API history with the current package baseline.
- Prevents accidental migration damage to an existing DB with divergent history.

Human confirmation needed:
- Confirm current DB data is not required for local pilot, or provide a seed/import plan.
- Confirm a new Supabase dev/staging database can be created.

Exact next Codex task:
- "Prepare a fresh Supabase dev database migration checklist and, after I provide corrected env values, run non-destructive status checks. Do not apply migrations until I confirm the DB is disposable or backed up."

### Staging
Recommended path: **Option C unless staging must preserve current data; otherwise Option D with backup and drift analysis**.

Why:
- Staging should match current production source of truth.
- If existing staging data matters, baseline/drift analysis is required before migration.

Human confirmation needed:
- Is staging disposable?
- If not disposable, provide backup confirmation and approve drift analysis.

Exact next Codex task:
- "Run schema drift analysis between the current staging DB and `packages/database/prisma/schema.prisma`, then produce a baseline plan. Do not resolve or apply migrations."

### Production
Recommended path: **NO-GO until database identity, backup, and migration history are reconciled**.

Why:
- The active DB has old API migration history.
- Required production tables are missing.
- Direct connectivity is not working.
- `migrate status` shows divergent history.

Human confirmation needed:
- Correct Supabase project identity.
- Full backup confirmation.
- Whether production is old API DB, new package DB, or a planned upgrade target.
- Whether old API migration folders should be restored into the package migration tree for historical continuity.

Exact next Codex task:
- "Create a production drift analysis using schema-only inspection and `_prisma_migrations` export. Do not run migrate deploy, migrate resolve, or destructive commands."

## Commands To Run Later
These are **DO NOT RUN YET** commands.

After fresh dev/staging DB is created and confirmed disposable:

```text
cd packages/database
npx prisma migrate status --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

After current DB backup and drift analysis are approved:

```text
cd packages/database
npx prisma migrate diff --from-url <redacted-current-db-url> --to-schema-datamodel prisma/schema.prisma --script
```

If and only if a migration is proven already applied:

```text
npx prisma migrate resolve --applied <migration_name> --schema prisma/schema.prisma
```

Never run `prisma migrate reset` on non-disposable data.

## Human Decisions Needed
1. Is the current Supabase DB disposable, staging, or production?
2. Is existing data in the current DB required?
3. Should `apps/api/prisma` be retained as a separate legacy schema line?
4. Should the owner workflow app use a fresh `packages/database` DB?
5. Can a fresh dev/staging Supabase database be created?
6. Is there a confirmed backup before any production migration action?
7. Which connection strings are authoritative for runtime and migrations?

## Final GO / NO-GO Status
Current status: **NO-GO** for applying migrations.

Safe next move:
- For local pilot: create a fresh dev/pilot DB and use the current `packages/database` migration line.
- For staging: use a fresh DB if disposable; otherwise run drift analysis first.
- For production: do not migrate until identity, backup, direct connectivity, and migration history reconciliation are resolved.
