# Prisma Deployment Blocker Report

Generated: 2026-06-05

## Executive Summary

`prisma migrate status` is failing for two exact, verified reasons:

1. **Configured migration environment uses an unreachable direct Supabase database endpoint.** `packages/database/.env` and `apps/api/.env` point to `db.bovwpcjvkwvhjblnuftb.supabase.co:5432`. From this environment that host resolves only to IPv6, and this machine has no usable IPv6 default route to it. Prisma therefore reaches the schema-engine database step and fails with `Schema engine error`.
2. **When tested with the reachable Supabase pooler endpoint from `apps/web/.env.local`, Prisma can read the database migration table, but the remote `_prisma_migrations` history does not match the local `packages/database/prisma/migrations` directory.**

This is a **P0 deployment blocker**. Do not run production migrations until both endpoint reachability and migration-history drift are resolved.

## Root Cause

### Primary Failure: Direct Database Endpoint Is Not Reachable

The command:

```powershell
cd packages/database
npx prisma migrate status --schema prisma/schema.prisma
```

loads `packages/database/.env` and targets:

```text
db.bovwpcjvkwvhjblnuftb.supabase.co:5432
```

Observed result:

```text
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.bovwpcjvkwvhjblnuftb.supabase.co:5432"
Error: Schema engine error:
```

Network evidence:

| Check | Result |
| --- | --- |
| `Resolve-DnsName db.bovwpcjvkwvhjblnuftb.supabase.co` | AAAA only: `2406:da1c:4c7:f800:10ef:1fb9:a823:e6c7` |
| `Test-NetConnection db.bovwpcjvkwvhjblnuftb.supabase.co -Port 5432` | Failed name/connect test |
| `Test-NetConnection 2406:da1c:4c7:f800:10ef:1fb9:a823:e6c7 -Port 5432` | `TcpTestSucceeded: False` |
| Node `net.createConnection()` to direct host | `ENOTFOUND` |
| Local IPv6 route table | No default IPv6 `::/0` route present |

Exact conclusion: the configured direct database endpoint is not reachable from this deployment/test environment. Prisma is not failing on schema syntax or Prisma version compatibility; it is failing when the schema engine attempts to inspect the remote database.

### Secondary Failure: Remote Migration History Does Not Match Local Migrations

As a control test, `migrate status` was run using the reachable pooler endpoint configured in `apps/web/.env.local`:

```text
aws-1-ap-southeast-2.pooler.supabase.com:5432
```

That endpoint is reachable:

| Check | Result |
| --- | --- |
| DNS | A records: `13.239.87.90`, `52.65.247.42` |
| TCP port 5432 | Success |
| Node TCP connect | Success |

With that endpoint, Prisma successfully read the remote migration table and reported drift:

```text
19 migrations found in prisma/migrations
Your local migration history and the migrations table from your database are different:

The last common migration is: 20260526150000_realtime_operational_workflows
```

Local migrations not yet applied to the remote database:

```text
20260526180000_media_reporting_operations
20260528120000_event_intelligence_priorities
20260529090000_rbac_foundation
20260529100000_hospital_context_foundation
20260529110000_admin_command_centre_foundation
20260529120000_user_invitations_onboarding
20260529124500_content_calendar_system
20260529133000_ai_script_studio
20260531103000_content_generator
20260602190000_hospital_integration_config
20260603110000_phase_e_verification_foundation
20260605090000_daily_growth_mission
20260605103000_daily_growth_pilot_quality_review
```

Remote database migrations not present locally:

```text
20260518101535_init
20260519044805_workspace
20260519050528_website_content
20260519051413_vector_memory
20260519090001_content_drafts
20260519092357_review_ai
20260519161156_review_alerts
20260519202705_brand_memory
20260528120000_event_intelligence_store
```

Exact conclusion: the remote database has a real `_prisma_migrations` history table, but its migration lineage is different from this repository's local migration directory.

## Severity

**P0 - Production Deployment Blocker**

Production migrations must not proceed while:

- the configured migration endpoint is unreachable, and
- the reachable database reports migration history drift.

## DATABASE_URL Verification

| File | DATABASE_URL Host | Port | Status |
| --- | --- | ---: | --- |
| `packages/database/.env` | `db.bovwpcjvkwvhjblnuftb.supabase.co` | 5432 | Configured direct endpoint; unreachable here |
| `apps/api/.env` | `db.bovwpcjvkwvhjblnuftb.supabase.co` | 5432 | Same unreachable direct endpoint |
| `apps/web/.env.local` | `aws-1-ap-southeast-2.pooler.supabase.com` | 5432 | Reachable pooler endpoint |

`DATABASE_URL` and `DIRECT_URL` are both present in `packages/database/.env`. `SHADOW_DATABASE_URL` is not configured.

No credential values were printed or stored in this report.

## Database Reachability Verification

| Endpoint | DNS Result | TCP Result | Interpretation |
| --- | --- | --- | --- |
| Direct Supabase DB host | IPv6 AAAA only | Failed | Not reachable from this environment |
| Supabase pooler host | IPv4 A records | Success | Reachable from this environment |

## Migration History Table Verification

The migration history table was indirectly verified through `prisma migrate status` using the reachable pooler endpoint.

Evidence:

- Prisma read remote migration history successfully.
- Prisma identified the last common migration.
- Prisma listed remote migrations that are not present locally.

Therefore `_prisma_migrations` exists and is readable on the reachable database endpoint, but it does not match local migration history.

## Schema Compatibility Verification

| Check | Result |
| --- | --- |
| `npx prisma validate --schema prisma/schema.prisma` | PASS |
| `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` | PASS |
| Local migration directory count | 19 migrations |

Schema syntax and Prisma datamodel compilation are compatible. The blocker is not schema syntax.

## Prisma Version Compatibility

| Component | Version |
| --- | --- |
| `prisma` CLI | 6.19.3 |
| `@prisma/client` | 6.19.3 |
| Node.js | 20.20.1 |
| Schema engine | `c2990dca591cba766e3b7ef5d9e8a84796e47ab7` |

Prisma CLI and client versions match. Version mismatch is not the root cause.

## Shadow Database Configuration

`packages/database/prisma/schema.prisma` has:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

There is no `shadowDatabaseUrl` in the datasource and no `SHADOW_DATABASE_URL` in the checked env files.

Impact:

- `migrate status` does not require a shadow database.
- `migrate dev` and some migration diff workflows may require a reachable shadow database.
- Shadow DB absence is not the exact cause of the current `migrate status` failure.

## Clean Environment Reproduction

A temporary clean directory was created with only:

- `prisma/schema.prisma`
- `prisma/migrations`
- `.env`

Then `npx --yes prisma@6.19.3 migrate status --schema prisma/schema.prisma` was run.

Result with copied direct DB env:

```text
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.bovwpcjvkwvhjblnuftb.supabase.co:5432"
Error: Schema engine error:
```

Result with reachable pooler env override:

```text
19 migrations found in prisma/migrations
Your local migration history and the migrations table from your database are different.
The last common migration is: 20260526150000_realtime_operational_workflows
```

The clean reproduction confirms the issue is not caused by stale generated clients, local build artifacts, or app code.

## Fix

Do not apply speculative migrations. Resolve in this order:

1. Configure the migration/deployment environment to use a database endpoint reachable from the runner.
   - Either run migrations from an environment with working IPv6 access to the direct Supabase host, or configure an approved IPv4-compatible Supabase endpoint for migration inspection.
   - Verify with TCP connectivity before running Prisma.
2. Reconcile migration history before applying new migrations.
   - Determine whether the remote-only migrations are from an older repository history that must be restored locally, or whether the current local baseline intentionally replaced them.
   - Determine whether the 13 local unapplied migrations should be applied to this database or marked as resolved only after manual schema comparison.
3. Only after the above, run:

```powershell
cd packages/database
npx prisma migrate status --schema prisma/schema.prisma
```

Expected verification result:

```text
Database schema is up to date!
```

## Verification Steps

1. Verify env target:

```powershell
cd packages/database
node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname,u.port)"
```

2. Verify DNS and TCP:

```powershell
Resolve-DnsName <database-host>
Test-NetConnection <database-host> -Port 5432
```

3. Verify Prisma schema:

```powershell
npx prisma validate --schema prisma/schema.prisma
```

4. Verify migration status:

```powershell
npx prisma migrate status --schema prisma/schema.prisma
```

5. If history still differs, inspect remote `_prisma_migrations` and compare it against `packages/database/prisma/migrations` before running `migrate deploy`.

## Estimated Effort

| Work Item | Estimate |
| --- | --- |
| Fix deployment DB endpoint reachability | 1-3 hours if using an already available reachable endpoint; longer if network/provider changes are needed |
| Migration history reconciliation | 0.5-2 days depending on whether missing remote migration files can be recovered |
| Final clean verification | 1-2 hours |

## Production Impact

Current impact:

- Production deployment cannot be safely recommended.
- Prisma migration status cannot be trusted from the configured direct endpoint.
- Daily Growth Mission database tables may not exist on the target database because the Daily Growth Mission migrations are listed as not yet applied when using the reachable endpoint.

Potential impact if ignored:

- Deployment may fail during migration.
- App code may reference tables or columns that are absent from the remote database.
- Applying migrations without resolving history drift may create duplicate objects, failed migrations, or an unrecoverable Prisma migration state.

## Final Determination

The exact Prisma deployment blocker is:

**The configured direct database endpoint is unreachable from the deployment/test environment, and the reachable database endpoint has a `_prisma_migrations` history that diverges from the local migration directory.**

This remains a **No-Go** until both are fixed and `prisma migrate status` succeeds against the intended deployment database.
