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

create index if not exists idx_client_social_streak_logs_lookup
on client_social_streak_logs(client_slug, scan_date desc, target_post_date desc);

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

alter table client_social_streaks enable row level security;
alter table client_social_streak_logs enable row level security;

grant select on client_social_streaks to authenticated;
grant select on client_social_streak_logs to authenticated;

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
