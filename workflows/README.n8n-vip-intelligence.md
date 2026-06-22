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
