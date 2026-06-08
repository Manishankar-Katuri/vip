# VIP Security and Tenant Checklist

## Tenant Isolation Rules
- All workflow, report, recipient, delivery, and client settings reads must be scoped by `workspaceId`.
- `/clients/[clientId]` may resolve by workspace id, slug, or exact name, but downstream records must still use the resolved workspace id.
- Do not mix `HospitalWorkspace` integration records into reports or workflows unless they are matched conservatively to the resolved `Workspace`.
- Tenant isolation tests must continue to cover report/workflow/recipient counts across multiple workspaces.

## Report Sending Rules
- Reports can be sent only after explicit manual approval.
- Automatic sending remains disabled.
- Sending must use configured recipients for the resolved workspace/client.
- A report send failure should be stored as delivery state, not hidden from the owner UI.

## Approval Guardrails
- `manualApprovalRequired` must normalize to `true`.
- `autoSendEnabled` must normalize to `false`.
- Approval status must not be bypassed in `/api/reports/[reportId]/send`.
- Rejected or archived reports must not be sent.

## Export File Safety
- Only generated report files under `/generated/reports/` may be attached to report emails.
- Attachment paths must use `path.basename` and resolved-directory checks.
- Do not attach arbitrary filesystem paths.
- Do not delete generated report files during readiness or smoke checks.
- Move generated reports to persistent object storage before production use on ephemeral platforms.

## Secret Handling
- Never return env var values from readiness APIs.
- Return only configured/missing booleans.
- Do not return `encryptedCredentials` from integration health or client APIs.
- Do not log plaintext provider keys.
- Keep `HOSPITAL_CONFIG_ENCRYPTION_KEY`, provider tokens, Resend keys, and AI keys out of client components.

## Email Provider Safety
- Readiness checks must not send test emails automatically.
- `RESEND_API_KEY` and `REPORTS_FROM_EMAIL` are required only when report sending is enabled.
- Send actions should fail safely with a clear delivery error when provider config is missing.
- Test sends should use dedicated test recipients before any client recipient is enabled.

## Workflow Safety
- Manual workflow start remains available.
- Stored workflow schedules do not imply automatic execution.
- Do not deploy a scheduler without tenant-scoped workspace selection and idempotency checks.
- Scheduled workflow execution should use the same manual approval/report send guardrails.

## Manual Checks Before Go-Live
- `/api/system/readiness` has no secret values in the response.
- Database shows all required models queryable.
- `/clients` and `/clients/[clientId]` show only the selected workspace's data.
- `/reports/[reportId]` send action is blocked until approval.
- Generated PDF/DOCX files open from the expected public path.
- Report email provider is either intentionally disabled or fully configured.
- Production storage persistence is documented and tested.
- Rollback path is known and does not require deleting client/report data.
