# Team Workspace Production Readiness

Status: ready after API access control and workspace team membership are enabled.

This document covers the checks required before using `/workspace` for daily team execution.

## Required Environment

Local API verification:

- `SUPABASE_URL`: server-side Supabase project URL for Vercel-style API routes.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side only. Never expose this as a `VITE_` variable.
- `WORKSPACE_TASKS_API_URL` or `WORKSPACE_APP_BASE_URL`: used by workflow sync helpers to call `POST /api/workspace/workflow-tasks`.
- `WORKSPACE_API_INTERNAL_TOKEN`: server-side workflow/API token. Required when workspace sync writes are enabled.
- `WORKSPACE_SYNC_ENABLED`: set to `true` only when workflows should create workspace tasks during manual/test runs.
- `VITE_SUPABASE_URL`: browser-safe Supabase URL for team login/session handling.
- `VITE_SUPABASE_ANON_KEY`: browser-safe Supabase anon key for team login/session handling.

Vercel production:

- Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `WORKSPACE_API_INTERNAL_TOKEN` as encrypted server environment variables.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as browser-safe frontend environment variables.
- Set `WORKSPACE_APP_BASE_URL` or `WORKSPACE_TASKS_API_URL` for production workflow sync.
- Do not set service role values with a public prefix.

n8n workflow environment:

- Set `WORKSPACE_TASKS_API_URL` to the deployed workspace endpoint, or set `WORKSPACE_APP_BASE_URL` and let the workflow derive `/api/workspace/workflow-tasks`.
- Set `WORKSPACE_API_INTERNAL_TOKEN` to the same value configured in the server-side Vercel environment.
- Set `WORKSPACE_SYNC_ENABLED=true` only for runs that should write tasks.
- For dry runs, omit `WORKSPACE_SYNC_ENABLED` and do not pass `enable_workspace_sync`.

## Access And Security

Current MVP behavior:

- The `/workspace` UI is protected by the existing app shell when Supabase auth configuration is present.
- Dev preview access is gated by `import.meta.env.DEV`, so production builds do not allow the local preview bypass.
- Workspace API routes use the Supabase service role server-side.
- The browser must never receive `SUPABASE_SERVICE_ROLE_KEY`.
- Browser/team workspace API calls must include `Authorization: Bearer <supabase_access_token>`.
- Browser/team users must also be active members in `workspace_team_members`.
- A user is approved when their Supabase Auth user id matches `workspace_team_members.user_id` or their email matches `workspace_team_members.email` case-insensitively.
- `POST /api/workspace/workflow-tasks` also accepts `Authorization: Bearer <WORKSPACE_API_INTERNAL_TOKEN>` or `x-workspace-api-token` for n8n/backend workflow sync.
- The internal workflow token is not accepted by broad task mutation routes.

Remaining production risk:

- The current permission model is intentionally simple: any active workspace team member can perform all workspace actions.
- Team member management is manual through SQL until an admin UI exists.

## Adding Team Members

Apply the workspace team member migration first:

- `database/migrations/202606220003_workspace_team_members.sql`

Then add approved internal users through Supabase SQL Editor. Use placeholder emails only in docs and replace them in the SQL Editor:

```sql
insert into workspace_team_members (email, display_name, active)
values ('team.member@example.com', 'Team Member', true)
on conflict (lower(email))
do update set
  display_name = excluded.display_name,
  active = true,
  updated_at = now();
```

If the Supabase Auth user id is known, bind it too:

```sql
update workspace_team_members
set user_id = '00000000-0000-0000-0000-000000000000',
    updated_at = now()
where lower(email) = lower('team.member@example.com');
```

To remove access without deleting audit history:

```sql
update workspace_team_members
set active = false,
    updated_at = now()
where lower(email) = lower('team.member@example.com');
```

## Database Checks

Required tables:

- `workspace_tasks`
- `workspace_task_checklist_items`
- `workspace_task_comments`
- `workspace_task_attachments`
- `workspace_task_activity_logs`
- `workspace_team_members`

Required migration files:

- `database/migrations/202606220001_workflow_linked_workspace_tasks.sql`
- `database/migrations/202606220002_workspace_task_collaboration.sql`
- `database/migrations/202606220003_workspace_team_members.sql`

Indexes exist for task list/dashboard usage:

- client and due date
- planned publish date
- status
- planned platforms
- plan context
- checklist ordering
- comments, attachments, and activity by task/date

Supabase Data API visibility:

- Confirm the workspace tables are visible through service-role REST after migration.
- New Supabase projects may require explicit grants for Data API visibility. If REST returns a schema cache error such as `PGRST205`, refresh the schema cache and verify grants/exposure.

## Duplicate Prevention

The workspace API prevents duplicates using:

- `source_workflow_run_id + related_content_plan_item_id`
- `source_workflow_run_id + planned_action_id`

Workflow mappers should always preserve stable plan item IDs. If no stable ID exists, deterministic fallback IDs should be based on client, planned date, topic, format, and platforms.

Remaining edge cases:

- If `source_workflow_run_id` changes and a mapper does not provide a stable item/action ID, duplicate tasks can still be created.
- If fallback ID source text changes, such as topic wording or platform order, a new task may be created.

## Routing Checks

`frontend/vercel.json` must keep specific workspace API rewrites before the SPA fallback:

- `/api/workspace/tasks/:id/checklist/:itemId`
- `/api/workspace/tasks/:id/checklist`
- `/api/workspace/tasks/:id/comments`
- `/api/workspace/tasks/:id/attachments`
- `/api/workspace/tasks/:id`
- `/(.*)` fallback to `/index.html`

This order prevents the SPA fallback from swallowing dynamic workspace API routes.

## UI Checks

Before rollout, verify:

- `/workspace` loads real API data.
- Production does not fall back to browser storage on API failure.
- Dev-only browser storage fallback displays the local preview notice.
- Tabs, grouping, filters, and search work with 100+ tasks.
- Detail drawer opens and shows plan context, checklist, links, comments, and activity.
- Checklist completion persists `is_completed`, completion actor, completion time, notes, and link.
- Comments and attachments persist and appear after refresh.

## Workflow Sync Checks

For each connected engine, verify:

- The workflow completes even if workspace sync is skipped or fails.
- Output includes `workspace_sync_enabled`, created/existing/skipped counts, errors, and task IDs.
- Manual/test runs only write tasks when explicitly enabled.
- Duplicate reruns return existing task IDs instead of creating additional tasks.

Connected engines:

- Daily Content Production
- 30-Day Content Plan
- Adaptive Plan Update
- Digital Marketing Strategy Orchestrator

## Smoke Test

Use an API-capable runtime such as `vercel dev`, not plain Vite fallback, then verify:

- `GET /api/workspace/tasks`
- `GET /api/workspace/dashboard`
- `POST /api/workspace/workflow-tasks`
- `PATCH /api/workspace/tasks/:id`
- `POST /api/workspace/tasks/:id/comments`
- `POST /api/workspace/tasks/:id/attachments`
- `PATCH /api/workspace/tasks/:id/checklist/:itemId`

Run validation:

```sh
cd frontend
npm run lint
npm run build
cd ..
node --check workflows/vip_intelligence_engine_orchestrator.workflow.js
```
