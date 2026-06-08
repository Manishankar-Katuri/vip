# VIP Environment and Database Readiness Diagnosis

## Summary
The application is not ready for local pilot, staging, or production because `/api/system/readiness` still reports `status: "blocked"`.

The diagnosis found two separate issues:

1. The running web app can reach a database and query `Workspace`, but required Phase 2/4/5/6/8 tables are not queryable. This points to pending or unapplied migrations on the database currently used by the running app.
2. Local Prisma CLI connectivity is not clean:
   - `packages/database/.env` uses a direct Supabase host that does not resolve from this machine.
   - `apps/web/.env.local` uses a Supabase pooler host that accepts TCP, but the URL has no `sslmode` and a test with `sslmode=require` hit the Supabase pooler session limit.

No application source code, schema, secrets, or data were changed.

## Env Files Found
| File | Exists |
| --- | --- |
| root `.env` | Missing |
| root `.env.local` | Missing |
| `apps/web/.env` | Missing |
| `apps/web/.env.local` | Exists |
| `packages/database/.env` | Exists |
| `packages/database/.env.local` | Missing |

## Variable Presence Summary
### `apps/web/.env.local`
| Variable | Present |
| --- | --- |
| `DATABASE_URL` | Yes |
| `DIRECT_URL` | No |
| `NEXT_PUBLIC_APP_URL` | No |
| `OPENAI_API_KEY` | Yes |
| `HOSPITAL_CONFIG_ENCRYPTION_KEY` | No |
| `REPORTS_EMAIL_ENABLED` | No |
| `RESEND_API_KEY` | No |
| `REPORTS_FROM_EMAIL` | No |
| `REPORTS_REPLY_TO_EMAIL` | No |

### `packages/database/.env`
| Variable | Present |
| --- | --- |
| `DATABASE_URL` | Yes |
| `DIRECT_URL` | Yes |
| `NEXT_PUBLIC_APP_URL` | No |
| `OPENAI_API_KEY` | No |
| `HOSPITAL_CONFIG_ENCRYPTION_KEY` | No |
| `REPORTS_EMAIL_ENABLED` | No |
| `RESEND_API_KEY` | No |
| `REPORTS_FROM_EMAIL` | No |
| `REPORTS_REPLY_TO_EMAIL` | No |

## DATABASE_URL Shape Summary
No usernames, passwords, or full URLs were printed.

### `apps/web/.env.local`
- Scheme: valid PostgreSQL scheme.
- Host: `aws-1-ap-southeast-2.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`
- Supabase-like host: yes
- `sslmode`: missing
- `DIRECT_URL`: missing in this env file

### `packages/database/.env`
- `DATABASE_URL` host: `db.bovwpcjvkwvhjblnuftb.supabase.co`
- `DIRECT_URL` host: `db.bovwpcjvkwvhjblnuftb.supabase.co`
- Port: `5432`
- Database: `postgres`
- Supabase-like host: yes
- `sslmode`: missing

## Prisma Validation and Generate Results
### `npm run prisma:generate`
Directory: `packages/database`

Result: Failed due to a local Windows file lock:

```text
EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp... -> query_engine-windows.dll.node
```

Likely cause: a running Node/Next process has the generated Prisma query engine loaded.

### `npx prisma validate --schema prisma/schema.prisma`
Directory: `packages/database`

Result: Passed. The Prisma schema is valid.

### `npx prisma migrate status --schema prisma/schema.prisma`
Directory: `packages/database`

Result: Failed with a schema engine error while using the direct host from `packages/database/.env`.

## Connectivity Results
### Direct Supabase host from `packages/database/.env`
Command:

```text
"SELECT 1;" | npx prisma db execute --schema prisma/schema.prisma --stdin
```

Result: Failed with P1001:

```text
Can't reach database server at `db.bovwpcjvkwvhjblnuftb.supabase.co:5432`
```

TCP/DNS check:
- `db.bovwpcjvkwvhjblnuftb.supabase.co:5432`
- DNS resolution failed.
- TCP test failed.

Interpretation: the direct host in `packages/database/.env` is not currently reachable from this machine. This may be a wrong direct host, a paused/removed Supabase project, DNS issue, or a copied URL from a different project.

### Pooler host from `apps/web/.env.local`
TCP check:
- `aws-1-ap-southeast-2.pooler.supabase.com:5432`
- TCP succeeded.

Prisma CLI test using the web `DATABASE_URL` without `DIRECT_URL`:
- Failed before connecting because the schema requires `DIRECT_URL`.

Prisma CLI test using the web `DATABASE_URL` with `DIRECT_URL` temporarily set in-process:
- Failed with P1001 against `aws-1-ap-southeast-2.pooler.supabase.com:5432`.

Prisma CLI test using the web `DATABASE_URL` with `sslmode=require` temporarily added in-process:
- Reached Supabase enough to receive:

```text
FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```

Interpretation: the pooler host is reachable, but the current connection string/session pool is not healthy for local Prisma CLI use. Evidence points to missing `sslmode=require` and/or session pool exhaustion. The pooler error is not a schema/code bug.

## Readiness Endpoint Result
Endpoint:

```text
GET http://localhost:3000/api/system/readiness
```

Result:
- HTTP status: `503`
- Readiness status: `blocked`
- Database status: `blocked`
- Database reachable: `true`
- Database error: `7 required database models were not queryable.`

Required model availability:
| Model | Available |
| --- | --- |
| `Workspace` | Yes |
| `MissionExecution` | No |
| `ReportDraft` | No |
| `ReportExport` | No |
| `ReportApproval` | No |
| `ReportRecipient` | No |
| `ReportDelivery` | No |
| `ClientOperationalSettings` | No |

Recommendations returned:
- Apply pending Prisma migrations before deployment.
- Set `NEXT_PUBLIC_APP_URL` to the production app URL before go-live.
- Report email sending is disabled; exports and manual download remain available.
- Use persistent object storage for generated reports in serverless or container deployments.
- Deploy a dedicated scheduler/worker before relying on automatic daily workflow execution.

Interpretation: the currently running app is reaching a database, but that database does not have the required production workflow/report/client tables.

## Migration Presence Check
The local migration folders are present.

Recent migrations confirmed locally:
- `20260605090000_daily_growth_mission`
- `20260608143000_report_draft_foundation`
- `20260608153000_report_export_foundation`
- `20260608163000_report_approval_send_flow`
- `20260608173000_client_operational_settings`

The missing readiness models line up with migrations that appear to be present locally but not applied to the active database.

No migrations were applied during this diagnosis.

## App Validation Results
Directory: `apps/web`

| Command | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed |
| `npm run test:workflows` | Passed, 4 tests |
| `npm run test:clients` | Passed, 3 tests |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run smoke:production-readiness` | Passed as route smoke; readiness still reported blocked |

Build notes:
- Existing Next.js `middleware` convention deprecation warning still appears.
- Existing Turbopack/NFT trace warning involving `next.config.ts`, generated Prisma client, and `api/admin/engagement-analytics` still appears.

## Likely Root Cause
Based on the evidence, the main readiness blocker is not application code.

Most likely root causes:
1. Pending migrations have not been applied to the database used by the running web app.
2. The database env files are not aligned:
   - `apps/web/.env.local` uses a pooler host.
   - `packages/database/.env` uses a direct host that does not resolve.
3. Supabase pooler/session configuration needs attention:
   - pooler TCP works,
   - `sslmode` is missing,
   - adding `sslmode=require` produced a max-session-limit error.

Less likely based on current evidence:
- Application readiness check bug.
- Prisma schema syntax problem.
- Missing local migration files.

Unknown until verified in Supabase:
- Whether the Supabase project is paused.
- Whether the project ref/host in `packages/database/.env` is stale.
- Whether the pooler password is correct.
- Whether the active database has partial migrations applied.

## Exact Next Actions
1. In Supabase, confirm the project is active and identify the correct project reference.
2. Replace or correct the direct database URL used by `packages/database/.env` so its host resolves.
3. Add the required Supabase SSL query parameter to database URLs if Supabase requires it, typically `sslmode=require`.
4. Add `DIRECT_URL` where Prisma CLI commands need it, especially for migration/status workflows.
5. Stop extra local Next/Node processes or disconnect stale sessions if the Supabase session pool remains exhausted.
6. Run `npm run prisma:generate` again after stopping processes that lock the Prisma query engine DLL.
7. Run `npx prisma migrate status --schema prisma/schema.prisma` from `packages/database` after direct URL connectivity is fixed.
8. Apply pending migrations only after confirmation and backup. Do not use `migrate reset`.
9. Re-run `/api/system/readiness`.
10. Proceed only when all required models are queryable and readiness is no longer blocked.

## What Codex Did Not Change
- Did not modify app source code.
- Did not modify env files.
- Did not print secret values.
- Did not run destructive database commands.
- Did not apply migrations.
- Did not run `prisma migrate reset`.
- Did not delete or alter data.
- Did not fake readiness success.

## Readiness Decision
Current state: blocked.

The app is not ready for:
- local pilot
- staging
- production

Reason:
- `/api/system/readiness` reports blocked because required database models are unavailable on the active database.
- Local Prisma CLI connectivity also needs env/URL correction before migrations can be safely inspected or applied.
