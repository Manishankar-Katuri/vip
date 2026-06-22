# VIP Intelligence Engine Orchestrator

Workflow name: `VIP Intelligence Engine Orchestrator`

Current status:

```json
{
  "facebook_intelligence": "Implemented first",
  "website_audit_intelligence": "Configured public website check, otherwise skipped_missing_config",
  "seo_intelligence": "Configured public website/config analysis, otherwise skipped_missing_config",
  "competitor_intelligence": "Configured public competitor website checks only, otherwise skipped_missing_config",
  "google_business_intelligence": "skipped_missing_config until GBP API credential/reference is bound",
  "review_intelligence": "skipped_missing_config until review API/public source is bound",
  "local_seo_intelligence": "Configured service/location ideas only; no rank or volume claims",
  "keyword_opportunity_intelligence": "Configured service/location ideas only; no rank or volume claims",
  "content_gap_intelligence": "Configured public website/config analysis, otherwise skipped_missing_config",
  "landing_page_conversion_intelligence": "Configured public website check, otherwise skipped_missing_config",
  "campaign_offer_intelligence": "Configured campaign inputs only, otherwise skipped_missing_config",
  "digital_marketing_strategy": "Strategy shell over real stored/configured sources only"
}
```

## Files

- `vip_intelligence_schema.sql` - Supabase/Postgres schema and indexes.
- `vip_intelligence_engine_orchestrator.workflow.js` - n8n Workflow SDK source for the orchestrator.

## Required credentials

Create or bind these n8n credentials after import:

- `Supabase Postgres` - Postgres credential pointing to the Supabase database containing the VIP intelligence tables.
- `OpenAI account` - OpenAI API credential for the AI intelligence summary. An existing credential with this name was found in n8n.
- Future Google Business Profile/Search Console credentials must be bound through n8n credentials or explicit credential references. Do not store raw Google/SEO/competitor API secrets in client rows.

## Required environment variables

- `META_GRAPH_API_VERSION` optional. If missing, the workflow falls back to `v23.0`.
- One Meta page token environment variable per configured client, referenced by `clients.facebook_page_access_token_env_key`.
- `WORKSPACE_TASKS_API_URL` optional. When set to the Team Workspace endpoint, for example `http://127.0.0.1:3024/api/workspace/workflow-tasks` in local verification, actionable Daily Content Production plan items are synced into workspace execution tasks.
- `WORKSPACE_APP_BASE_URL` optional fallback. If `WORKSPACE_TASKS_API_URL` is missing, the workflow derives `${WORKSPACE_APP_BASE_URL}/api/workspace/workflow-tasks`.
- `WORKSPACE_API_INTERNAL_TOKEN` required when workspace sync is enabled. The workflow sends it as an `Authorization: Bearer` header to `POST /api/workspace/workflow-tasks`; do not log it or expose it to browser code.
- `WORKSPACE_SYNC_ENABLED` optional. Set to `true` only when test/manual runs should create workspace tasks. In test mode, workspace sync is skipped unless explicitly enabled.

Workspace browser access is restricted to active rows in `workspace_team_members`, but n8n workflow sync does not require a team member row. The internal token is accepted only by `POST /api/workspace/workflow-tasks`.

## Reusable Team Workspace sync

The Daily Content Production branch uses a reusable workspace sync shape that future action-producing engines should follow instead of posting directly to the workspace API. The helper flow resolves the workspace endpoint, applies the test/manual guard, normalizes source plan items into workspace plan items, builds the `POST /api/workspace/workflow-tasks` payload, posts it, and returns a standard summary.

Reusable helper responsibilities in the workflow code:

- `resolveWorkspaceTasksApiUrl(input, env)`: uses `input.workspace_tasks_api_url`, then `WORKSPACE_TASKS_API_URL`, then `${WORKSPACE_APP_BASE_URL}/api/workspace/workflow-tasks`.
- `shouldEnableWorkspaceSync(input, env)`: skips safely when no endpoint is configured, when test/manual mode is active without explicit sync, when `WORKSPACE_API_INTERNAL_TOKEN` is missing, or when `disable_workspace_sync=true`.
- `normalizeWorkspacePlanItem(item, context)`: maps actionable plan/recommendation fields to workspace item fields while preserving stable IDs.
- `buildWorkspacePayload(items, context)`: wraps normalized items with workflow run, engine, plan type, and client metadata.
- `syncWorkspaceTasks(payload, config)`: calls the Team Workspace API with the internal workspace token without failing the whole workflow on sync errors.
- `summarizeWorkspaceSyncResult(response, errors, skipped)`: returns the standard workspace sync counters and task ids.

Future low-risk mapper targets are `30_day_content_plan`, `adaptive_plan_update`, `strategy_action`, `website_seo_action`, `google_business_profile_action`, and `content_performance_followup`. Each should provide stable `related_content_plan_item_id` or `planned_action_id` values wherever possible so the workspace API can preserve duplicate protection across reruns.

The `30_day_content_plan_engine` route is connected to this reusable sync. It accepts actionable content items from `items`, `plan_items`, `content_items`, `planned_content_items`, `calendar_items`, `actions`, or day-based `content_calendar`/`calendar`/`plan` entries. Supported item aliases include `topic`/`title`/`content_topic`, `format`/`content_format`/`post_type`, `platforms`/`channels`, `date`/`publish_date`/`planned_publish_date`/`scheduled_date`, `objective`/`goal`, `caption`/`generated_caption`, and `script`/`generated_script`. Summary-only sections are ignored; an item needs both a topic/title and a planned date to become a workspace task.

The `adaptive_plan_update` route is also connected to this sync. It accepts actionable items from `actions`, `recommendations`, `adaptive_actions`, `plan_updates`, `updates`, `next_actions`, `follow_up_actions`, `content_changes`, or `tasks`. Supported aliases include `topic`/`title`/`action_title`/`recommendation`, `format`/`content_format`/`recommended_format`/`post_type`, `platforms`/`channels`, `due_date`/`publish_date`/`planned_publish_date`/`scheduled_date`, `objective`/`goal`/`reason`, `caption`/`generated_caption`/`suggested_caption`, `script`/`generated_script`/`suggested_script`, and `priority`/`urgency`. Plain observations are skipped unless they include an action-shaped field or stable action/update id. Adaptive sync sets `source_engine_name` to `adaptive_plan_update_engine` and `source_plan_type` to `adaptive_plan_update`, and infers category/priority from the action text when those fields are missing.

The digital marketing strategy route is connected through `digital_marketing_strategy` and `digital_marketing_strategy_orchestrator`. It accepts actionable strategy items from `actions`, `recommendations`, `strategic_actions`, `action_plan`, `next_steps`, `growth_actions`, `content_recommendations`, `seo_recommendations`, `website_recommendations`, `local_area_actions`, `google_business_profile_actions`, or `tasks`. Strategy sync sets `source_engine_name` to `digital_marketing_strategy_orchestrator` and `source_plan_type` to `strategy_action_plan`, preserves strategic reason, expected impact, and source signals in `plan_context`, and infers category/priority when missing.

Every engine that syncs workspace tasks should include these output fields:

- `workspace_sync_enabled`
- `workspace_tasks_created`
- `workspace_tasks_existing`
- `workspace_tasks_skipped`
- `workspace_sync_errors`
- `workspace_task_ids`

## Required client row

For the manual test, add or update a `clients` row like:

```sql
insert into clients (
  client_slug,
  client_name,
  industry,
  location,
  facebook_page_id,
  facebook_page_access_token_env_key,
  website_url,
  primary_domain,
  service_keywords,
  target_locations,
  seo_enabled,
  website_audit_enabled,
  active
) values (
  'aayu_geriatrics',
  'Aayu Geriatrics',
  'Healthcare',
  'Hyderabad',
  '<facebook_page_id>',
  'META_PAGE_TOKEN_AAYU_GERIATRICS',
  'https://example.com',
  'example.com',
  '["geriatric care", "elder care"]'::jsonb,
  '["Hyderabad"]'::jsonb,
  true,
  true,
  true
)
on conflict (client_slug) do update set
  client_name = excluded.client_name,
  industry = excluded.industry,
  location = excluded.location,
  facebook_page_id = excluded.facebook_page_id,
  facebook_page_access_token_env_key = excluded.facebook_page_access_token_env_key,
  website_url = excluded.website_url,
  primary_domain = excluded.primary_domain,
  service_keywords = excluded.service_keywords,
  target_locations = excluded.target_locations,
  seo_enabled = excluded.seo_enabled,
  website_audit_enabled = excluded.website_audit_enabled,
  active = true,
  updated_at = now();
```

## Manual test input

Pin this JSON on `Manual Trigger - Test Individual Engine`:

```json
{
  "client_id": "aayu_geriatrics",
  "engine": "facebook_intelligence",
  "mode": "manual"
}
```

Expected final output:

```json
{
  "client_id": "aayu_geriatrics",
  "engine": "facebook_intelligence",
  "status": "success",
  "summary": "...",
  "key_insights": [],
  "recommendations": [],
  "next_actions": []
}
```

## Workflow behavior

- Manual mode loads only the requested `client_id` or `client_slug`.
- Scheduled mode loads all active clients.
- The workflow defaults to `facebook_intelligence`.
- Google Business Profile, review, SEO, competitor, keyword, landing page, and campaign engines never fake live data.
- Digital-presence engines use configured public website checks where possible, otherwise they return and store `skipped_missing_config` with setup requirements.
- Facebook API collection records per-metric errors in `raw_payload`, classifies availability, and continues.
- Missing `facebook_page_id`, `facebook_page_access_token_env_key`, or the referenced environment token marks the Facebook run failed without exposing the token.
- Successful runs write to `engine_runs`, `raw_engine_data`, `normalized_metrics`, and `intelligence_outputs`.

## Cadence

Default per-client cadence is stored in `clients.engine_cadence_config`.

Daily: Facebook, Instagram, YouTube if enabled, lightweight Google Business/Profile reviews when configured, Content Performance, Daily Content Production, Adaptive Plan Update, Digital Marketing Strategy.

Weekly: Website Audit, SEO, Competitor Intelligence, Local SEO, Keyword Opportunity, Content Gap, Campaign/Offer.

Monthly/manual: 30-Day Content Plan, full competitor review, full website audit, full digital strategy reset.

## Facebook metric registries

Page metrics:

- `page_post_engagements`
- `page_actions_post_reactions_total`
- `page_views_total`
- `page_follows`
- `page_follows_unique`
- `page_fans`

Post metrics:

- `post_impressions`
- `post_impressions_unique`
- `post_engaged_users`
- `post_clicks`
- `post_reactions_like_total`
- `post_reactions_love_total`
- `post_reactions_wow_total`
- `post_reactions_haha_total`
- `post_reactions_sorry_total`
- `post_reactions_anger_total`

Edit the `facebook_metric_registry` node when Meta changes availability.
