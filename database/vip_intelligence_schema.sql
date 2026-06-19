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

create table if not exists client_social_streaks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  client_slug text not null references clients(client_slug) on update cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_post_date date,
  last_checked_date date,
  last_status text not null default 'unknown',
  platforms_posted jsonb not null default '[]'::jsonb,
  post_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_slug)
);

create table if not exists client_social_streak_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  client_slug text not null references clients(client_slug) on update cascade,
  scan_date date not null,
  target_post_date date not null,
  posted_yesterday boolean not null default false,
  platforms_posted jsonb not null default '[]'::jsonb,
  post_count integer not null default 0,
  status text not null,
  created_at timestamptz default now(),
  unique (client_slug, target_post_date)
);

create or replace function update_client_social_streak(
  p_client_slug text,
  p_scan_date date,
  p_target_post_date date,
  p_posted_yesterday boolean,
  p_platforms_posted jsonb default '[]'::jsonb,
  p_post_count integer default 0,
  p_scan_status text default 'success'
)
returns client_social_streaks
language plpgsql
as $$
declare
  v_client_id uuid;
  v_existing_log client_social_streak_logs%rowtype;
  v_current client_social_streaks%rowtype;
  v_next_current integer;
  v_next_longest integer;
  v_status text;
  v_streak client_social_streaks;
begin
  select id into v_client_id from clients where client_slug = p_client_slug;
  if v_client_id is null then
    raise exception 'Unknown client_slug: %', p_client_slug;
  end if;

  v_status := case
    when p_scan_status is distinct from 'success' then coalesce(nullif(p_scan_status, ''), 'scan_failed')
    when p_posted_yesterday then 'continued'
    else 'reset'
  end;

  select * into v_existing_log
  from client_social_streak_logs
  where client_slug = p_client_slug and target_post_date = p_target_post_date;

  if found then
    select * into v_streak from client_social_streaks where client_slug = p_client_slug;
    return v_streak;
  end if;

  insert into client_social_streak_logs (
    client_id,
    client_slug,
    scan_date,
    target_post_date,
    posted_yesterday,
    platforms_posted,
    post_count,
    status
  )
  values (
    v_client_id,
    p_client_slug,
    p_scan_date,
    p_target_post_date,
    p_posted_yesterday,
    coalesce(p_platforms_posted, '[]'::jsonb),
    greatest(coalesce(p_post_count, 0), 0),
    v_status
  );

  insert into client_social_streaks (client_id, client_slug)
  values (v_client_id, p_client_slug)
  on conflict (client_slug) do nothing;

  select * into v_current
  from client_social_streaks
  where client_slug = p_client_slug
  for update;

  if v_status in ('scan_failed', 'unknown') or p_scan_status is distinct from 'success' then
    v_next_current := v_current.current_streak;
  elsif p_posted_yesterday then
    if v_current.last_post_date = p_target_post_date then
      v_next_current := v_current.current_streak;
    elsif v_current.last_post_date = p_target_post_date - interval '1 day' then
      v_next_current := v_current.current_streak + 1;
    else
      v_next_current := 1;
    end if;
  else
    v_next_current := 0;
  end if;

  v_next_longest := greatest(v_current.longest_streak, v_next_current);

  update client_social_streaks
  set
    current_streak = v_next_current,
    longest_streak = v_next_longest,
    last_post_date = case when p_scan_status = 'success' and p_posted_yesterday then p_target_post_date else last_post_date end,
    last_checked_date = p_scan_date,
    last_status = v_status,
    platforms_posted = coalesce(p_platforms_posted, '[]'::jsonb),
    post_count = greatest(coalesce(p_post_count, 0), 0),
    updated_at = now()
  where client_slug = p_client_slug
  returning * into v_streak;

  return v_streak;
end;
$$;

create index if not exists idx_clients_active on clients(active);
create index if not exists idx_clients_slug on clients(client_slug);
create index if not exists idx_engine_runs_client_engine_started on engine_runs(client_id, engine_name, started_at desc);
create index if not exists idx_raw_engine_data_client_engine_collected on raw_engine_data(client_id, engine_name, collected_at desc);
create index if not exists idx_normalized_metrics_lookup on normalized_metrics(client_id, engine_name, metric_name, metric_date desc);
create index if not exists idx_intelligence_outputs_lookup on intelligence_outputs(client_id, engine_name, report_date desc);
create index if not exists idx_client_users_lookup on client_users(user_id, client_id);
create index if not exists idx_social_analytics_snapshots_lookup on social_analytics_snapshots(client_id, platform, snapshot_date desc, created_at desc);
create index if not exists idx_social_analytics_daily_summaries_lookup on social_analytics_daily_summaries(client_id, platform, summary_date desc, created_at desc);
create index if not exists idx_client_social_streak_logs_lookup on client_social_streak_logs(client_slug, scan_date desc, target_post_date desc);

alter table social_analytics_snapshots enable row level security;
alter table social_analytics_daily_summaries enable row level security;
alter table client_social_streaks enable row level security;
alter table client_social_streak_logs enable row level security;

grant select on social_analytics_snapshots to authenticated;
grant select on social_analytics_daily_summaries to authenticated;
grant select on client_social_streaks to authenticated;
grant select on client_social_streak_logs to authenticated;

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

drop policy if exists "client users can read social streaks" on client_social_streaks;
create policy "client users can read social streaks"
on client_social_streaks
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = client_social_streaks.client_id
      and client_users.user_id = auth.uid()
  )
);

drop policy if exists "client users can read social streak logs" on client_social_streak_logs;
create policy "client users can read social streak logs"
on client_social_streak_logs
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = client_social_streak_logs.client_id
      and client_users.user_id = auth.uid()
  )
);
