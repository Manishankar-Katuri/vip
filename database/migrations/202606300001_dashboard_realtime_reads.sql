grant select on clients to authenticated;
grant select on client_users to authenticated;
grant select on engine_runs to authenticated;
grant select on daily_operating_runs to authenticated;
grant select on intelligence_outputs to authenticated;
grant select on normalized_metrics to authenticated;
grant select on content_plans to authenticated;
grant select on content_plan_items to authenticated;
grant select on content_plan_updates to authenticated;

alter table clients enable row level security;
alter table client_users enable row level security;
alter table engine_runs enable row level security;
alter table daily_operating_runs enable row level security;
alter table intelligence_outputs enable row level security;
alter table normalized_metrics enable row level security;
alter table content_plans enable row level security;
alter table content_plan_items enable row level security;
alter table content_plan_updates enable row level security;

drop policy if exists clients_member_read on clients;
create policy clients_member_read
on clients
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = clients.id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists client_users_self_read on client_users;
create policy client_users_self_read
on client_users
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists engine_runs_member_read on engine_runs;
create policy engine_runs_member_read
on engine_runs
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = engine_runs.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists daily_operating_runs_member_read on daily_operating_runs;
create policy daily_operating_runs_member_read
on daily_operating_runs
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = daily_operating_runs.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists intelligence_outputs_member_read on intelligence_outputs;
create policy intelligence_outputs_member_read
on intelligence_outputs
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = intelligence_outputs.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists normalized_metrics_member_read on normalized_metrics;
create policy normalized_metrics_member_read
on normalized_metrics
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = normalized_metrics.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists content_plans_member_read on content_plans;
create policy content_plans_member_read
on content_plans
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = content_plans.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists content_plan_items_member_read on content_plan_items;
create policy content_plan_items_member_read
on content_plan_items
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = content_plan_items.client_id
      and client_users.user_id = (select auth.uid())
  )
);

drop policy if exists content_plan_updates_member_read on content_plan_updates;
create policy content_plan_updates_member_read
on content_plan_updates
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = content_plan_updates.client_id
      and client_users.user_id = (select auth.uid())
  )
);

do $$
begin
  alter publication supabase_realtime add table engine_runs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table daily_operating_runs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table intelligence_outputs;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table normalized_metrics;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table content_plans;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table content_plan_items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table content_plan_updates;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
