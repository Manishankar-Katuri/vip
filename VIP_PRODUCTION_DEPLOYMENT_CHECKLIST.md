# VIP Production Deployment Checklist

## Required Environment Variables
| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | App boot and all persisted data | Must point to the production PostgreSQL database. Do not run the app without it. |
| `NODE_ENV=production` | Production runtime behavior | Set by most platforms automatically. |

## Recommended Environment Variables
| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL, smoke checks, absolute links | Set to the deployed web origin. |
| `OPENAI_API_KEY` | AI-backed workflow/report generation | Required before running daily workflows in production. |
| `OPENAI_MODEL` | AI model override | Optional; current code has defaults. |
| `HOSPITAL_CONFIG_ENCRYPTION_KEY` | Integration credential encryption | Strongly recommended before configuring provider secrets. |
| `REDIS_URL` | Queue-backed action/automation workers | Required only if queue workers are deployed. |
| `DAILY_WORKFLOW_SCHEDULER_ENABLED` | Scheduler readiness signal | Set only when a real daily workflow scheduler/runner is deployed. |

## Report Email Variables
| Variable | Required for | Notes |
| --- | --- | --- |
| `REPORTS_EMAIL_ENABLED=true` | Sending report emails | Leave unset/false to keep sending disabled while allowing exports. |
| `RESEND_API_KEY` | Resend email provider | Presence only is checked by readiness; no test email is sent automatically. |
| `REPORTS_FROM_EMAIL` | Sender address | Must be a verified sender for the provider. |
| `REPORTS_REPLY_TO_EMAIL` | Reply-to address | Optional. |

## Database Migration Steps
1. Back up the production database.
2. Review pending migrations in `packages/database/prisma/migrations`.
3. Apply Prisma migrations using the deployment platform's approved migration command.
4. Run `npm run prisma:generate` in `packages/database`.
5. Run `npx prisma validate --schema prisma/schema.prisma` in `packages/database`.
6. Confirm `/api/system/readiness` reports all required models queryable.

Do not run migrations from the Next.js app at request time.

## Build Commands
Run from `apps/web` unless noted:
- `npx tsc --noEmit --pretty false`
- `npm run test:workflows`
- `npm run test:clients`
- `npm run lint`
- `npm run build`

Database package:
- `cd packages/database`
- `npm run prisma:generate`
- `npx prisma validate --schema prisma/schema.prisma`

## Smoke Test URLs
After deployment:
- `/api/system/readiness`
- `/api/system/health`
- `/overview`
- `/workflows`
- `/reports`
- `/approvals`
- `/clients`
- `/settings`

Optional command from `apps/web`:
- `npm run smoke:production-readiness`

Use `NEXT_PUBLIC_APP_URL=https://your-app.example.com npm run smoke:production-readiness` when testing a deployed URL.

## Report Export and Send Test Flow
1. Open `/reports`.
2. Generate a report for a real client/workspace with known source data.
3. Preview and edit the report.
4. Export PDF and DOCX.
5. Confirm generated files open.
6. Request/perform manual approval.
7. Add a test recipient under `/clients/[clientId]`.
8. Send only after approval and only to the test recipient.
9. Confirm delivery status under the report detail page.

Do not enable automatic sending; Phase 9 keeps sending explicit and approval-gated.

## Workflow Test Flow
1. Open `/workflows`.
2. Manually start a workflow for a test client/workspace if production data and provider keys are configured.
3. Open `/workflows/[runId]`.
4. Confirm timeline, steps, reports, errors, and retry state render.
5. Confirm generated reports remain scoped to the selected workspace/client.

## Rollback Notes
1. Disable public traffic or route traffic to the previous deployment.
2. Keep additive Phase 8/9 database tables in place unless a tested rollback plan says otherwise.
3. Do not drop report/export/delivery/approval/client settings data during rollback.
4. Preserve generated report files for audit unless storage policy requires archival.
5. Capture `/api/system/readiness` output before and after rollback.

## Known Production Warnings
- Local filesystem report storage may not persist on serverless or container platforms. Use persistent object storage for durable report exports.
- Client workflow schedules are stored, but automatic daily execution requires a separately deployed scheduler/worker.
- Email sending is disabled unless `REPORTS_EMAIL_ENABLED=true` and provider config is present.
- The current build may emit the existing Next.js `middleware` convention deprecation warning.
- The current build may emit the existing Turbopack/NFT trace warning involving generated Prisma client imports.
