create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_slug text unique not null,
  client_name text not null,
  industry text,
  location text,
  facebook_page_id text,
  facebook_page_access_token text,
  instagram_business_id text,
  google_business_profile_id text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists engine_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  engine_name text not null,
  mode text default 'scheduled',
  status text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb default '{}'::jsonb
);

create table if not exists raw_engine_data (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  engine_name text not null,
  source_platform text not null,
  collected_at timestamptz default now(),
  date_range_start date,
  date_range_end date,
  raw_payload jsonb not null
);

create table if not exists normalized_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  engine_name text not null,
  source_platform text not null,
  metric_date date not null,
  metric_name text not null,
  metric_value numeric,
  dimensions jsonb default '{}'::jsonb,
  raw_reference_id uuid references raw_engine_data(id),
  created_at timestamptz default now()
);

create table if not exists intelligence_outputs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  engine_name text not null,
  source_platform text not null,
  report_date date not null,
  summary text,
  key_insights jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  next_actions jsonb default '[]'::jsonb,
  confidence_score numeric,
  input_sources jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  user_id uuid not null,
  role text default 'viewer',
  created_at timestamptz default now(),
  unique (client_id, user_id)
);

create table if not exists social_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  engine_run_id uuid references engine_runs(id),
  platform text not null,
  date_range_start date,
  date_range_end date,
  snapshot_date date default current_date,
  profile_metrics jsonb default '{}'::jsonb,
  audience_metrics jsonb default '{}'::jsonb,
  engagement_metrics jsonb default '{}'::jsonb,
  reach_view_metrics jsonb default '{}'::jsonb,
  content_type_breakdown jsonb default '[]'::jsonb,
  follower_breakdown jsonb default '{}'::jsonb,
  top_content jsonb default '[]'::jsonb,
  recent_content jsonb default '[]'::jsonb,
  metric_errors jsonb default '[]'::jsonb,
  source_engine text,
  created_at timestamptz default now()
);

create table if not exists social_analytics_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  platform text,
  summary_date date default current_date,
  comparison_label text,
  what_changed jsonb default '[]'::jsonb,
  follower_summary text,
  engagement_summary text,
  views_reach_summary text,
  top_content_summary text,
  recommendations jsonb default '[]'::jsonb,
  source_snapshot_ids jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_clients_active on clients(active);
create index if not exists idx_clients_slug on clients(client_slug);
create index if not exists idx_engine_runs_client_engine_started on engine_runs(client_id, engine_name, started_at desc);
create index if not exists idx_raw_engine_data_client_engine_collected on raw_engine_data(client_id, engine_name, collected_at desc);
create index if not exists idx_normalized_metrics_lookup on normalized_metrics(client_id, engine_name, metric_name, metric_date desc);
create index if not exists idx_intelligence_outputs_lookup on intelligence_outputs(client_id, engine_name, report_date desc);
create index if not exists idx_client_users_lookup on client_users(user_id, client_id);
create index if not exists idx_social_analytics_snapshots_lookup on social_analytics_snapshots(client_id, platform, snapshot_date desc, created_at desc);
create index if not exists idx_social_analytics_daily_summaries_lookup on social_analytics_daily_summaries(client_id, platform, summary_date desc, created_at desc);

alter table social_analytics_snapshots enable row level security;
alter table social_analytics_daily_summaries enable row level security;

grant select on social_analytics_snapshots to authenticated;
grant select on social_analytics_daily_summaries to authenticated;

drop policy if exists "client users can read social analytics snapshots" on social_analytics_snapshots;
create policy "client users can read social analytics snapshots"
on social_analytics_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = social_analytics_snapshots.client_id
      and client_users.user_id = auth.uid()
  )
);

drop policy if exists "client users can read social analytics summaries" on social_analytics_daily_summaries;
create policy "client users can read social analytics summaries"
on social_analytics_daily_summaries
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = social_analytics_daily_summaries.client_id
      and client_users.user_id = auth.uid()
  )
);
