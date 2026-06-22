# Guarded Digital Test n8n Import Package

This package prepares the committed guarded Digital Marketing test workflow for a manual n8n draft update. It is a handoff package only; creating this package does not update n8n.

## Target

- Target n8n workflow name: `VIP Digital Marketing Intelligence Orchestrator - Guarded Test`
- Target n8n workflow ID: `UOirxFUgcWzM95l5`
- Source commit: `b59d7e4`

## Files

- `vip_digital_marketing_guarded_test.workflow.js`
- `validate_digital_marketing_guarded_test.js`
- `README.md`

## Safety Properties

- Manual-only
- Target draft must remain inactive/unpublished
- No credentials
- No Postgres node
- No HTTP Request node
- No Execute Workflow node
- No schedule trigger
- No webhook trigger
- No production writes
- No platform APIs
- Public fetch is guarded and Website Audit only
- Default `allow_public_fetch=false`
- No fake live data

## Validation Commands

Run from the repository root before manual import:

```bash
node workflows/tests/validate_digital_marketing_guarded_test.js
node --check workflows/vip_digital_marketing_guarded_test.workflow.js
```

## Manual n8n Update Checklist

1. Open n8n workflow `UOirxFUgcWzM95l5`.
2. Confirm it is inactive/unpublished.
3. Replace/import from `vip_digital_marketing_guarded_test.workflow.js`.
4. Confirm only the sticky note, manual trigger, and Code node exist.
5. Confirm no credentials are attached.
6. Confirm no schedule or webhook trigger exists.
7. Confirm no HTTP Request, Postgres, or Execute Workflow nodes exist.
8. Save as inactive/unpublished.
9. Run one pinned manual test only with `allow_public_fetch=false`.
10. Confirm no writes, network fetch, platform APIs, secrets, or fake live data.

## Pinned No-Network Test Payload

Use this payload for the first manual validation after import:

```json
{
  "client_slug": "aayu_geriatrics",
  "engine": "all",
  "test_mode": true,
  "disable_writes": true,
  "allow_public_fetch": false,
  "website_url": "https://aayugeriatrics.com",
  "primary_domain": "aayugeriatrics.com",
  "target_locations": ["Bengaluru", "Indiranagar"],
  "service_keywords": ["geriatric care", "home healthcare"],
  "priority_services": ["elder care", "dementia care"],
  "competitor_names": ["Competitor A", "Competitor B"],
  "competitor_websites": ["https://competitor-a.example", "https://competitor-b.example"],
  "active_offers": ["Senior wellness consultation"],
  "seasonal_campaigns": ["Monsoon elder care"],
  "campaign_goals": ["Increase appointment enquiries"],
  "review_platforms": ["Google", "Practo"],
  "google_business_profile_url": "https://maps.google.com/?cid=example"
}
```

## Expected Output Fields

Top-level output should include:

- `workflow_name`
- `client_slug`
- `test_mode`
- `writes_disabled`
- `allow_public_fetch`
- `engines_run`
- `engines_skipped`
- `engine_results`
- `frontend_cards`
- `strategy_summary`
- `readiness_status`
- `remaining_config_needed`
- `data_policy`
- `write_policy`
- `network_policy`
- `platform_api_policy`

Each frontend card should include:

- `id`
- `source_engine`
- `title`
- `status`
- `severity`
- `summary`
- `recommendations`
- `next_actions`
- `evidence_level`
- `data_policy`
- `blocked_by`
- `dashboard_section`

## Expected Safety Policies

For the pinned no-network test:

- `writes_disabled=true`
- `allow_public_fetch=false`
- `data_policy=no_fake_live_data`
- `write_policy=writes_disabled_no_database_nodes`
- `network_policy=no_network_fetch_no_http_nodes`
- `platform_api_policy=no_live_platform_api_nodes`

The run should not produce rankings, keyword volume, review counts, GBP metrics, competitor metrics, campaign projections, secrets, raw credentials, or authorization values.
