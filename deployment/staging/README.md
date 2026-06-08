# VIP Staging Deployment Configuration

This directory defines the required staging configuration for the final production-readiness gate. It does not contain secrets.

## Required Order

1. Provision a staging PostgreSQL database reachable from CI/deployment runners over IPv4 or verified IPv6.
2. Set `DATABASE_URL` and `DIRECT_URL` from `.env.database.example`.
3. Run `npm run prisma:generate` in `packages/database`.
4. Run `npx prisma migrate status --schema prisma/schema.prisma` in `packages/database`.
5. Apply migrations only after status succeeds and the migration list is reviewed.
6. Build `apps/web`.
7. Deploy API services, queue workers, and web app with the environment variables below.
8. Execute Daily Growth Mission against one real staging workspace.
9. Verify Mission Control and Pilot Operations outputs.

## Required Verification

- Prisma generate succeeds.
- Prisma migrate status succeeds.
- Web lint, TypeScript, and build pass.
- Core package tests pass.
- `/admin/workspaces/{workspaceId}/mission-control` shows a persisted execution.
- `/admin/workspaces/{workspaceId}/pilot-operations` shows reports, PDFs, approvals, tasks, and learning records.

