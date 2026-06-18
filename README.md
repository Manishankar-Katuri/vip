# VIP Social Media Intelligence Dashboard

Fresh frontend for the VIP social media intelligence operating console, with Aayu Geriatrics as the first client context.

## Stack

- Vite
- React
- TypeScript
- Supabase JS client
- React Router

## Environment

Set these in Replit Secrets or your local `.env.local`:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

For local Vite conventions, these aliases are also supported:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not add service-role keys, database passwords, n8n webhook URLs, provider API keys, Facebook page access tokens, or YouTube API keys to browser-accessible env vars.

## Local Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Implemented MVP Pages

- Login / Auth-ready shell with Supabase magic-link sign-in
- Dashboard
- Approval Queue
- Daily Content Detail
- 30-Day Calendar
- Analytics Overview
- Strategy Report
- Workflow Logs
- Manual Controls

## Supabase Reads

The app uses the Supabase browser client with the signed-in user's auth context so table reads respect RLS. It only selects explicit non-secret columns and never queries or renders:

- `facebook_page_access_token`
- `youtube_api_key`
- raw n8n webhook URLs
- service-role keys or database credentials

The expected tables are:

- `clients`
- `client_users`
- `engine_runs`
- `normalized_metrics`
- `intelligence_outputs`
- `content_plans`
- `content_plan_items`
- `daily_operating_runs`

`raw_engine_data` is intentionally not displayed in the MVP because raw payloads can contain sensitive provider data.

## Current Limitations

- Approval actions are disabled with "backend route required" labels.
- Manual n8n controls are disabled until authenticated server routes are implemented.
- If newer content-plan tables or columns are not exposed through Supabase Data API, the UI shows setup/error states instead of failing silently.
- Strategy Report may be empty while `social_media_strategy` remains a placeholder engine in the workflow source.

## Backend Route Next Steps

Create server-side API routes for:

- Approve content item
- Reject content item
- Request revision
- Edit draft safely
- Mark posted
- Trigger each n8n operation from Manual Controls

Those routes should validate the Supabase session, enforce client membership through `client_users`, and keep all n8n webhook URLs and credentials server-only.
