create table if not exists workspace_team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_team_members_email_not_blank check (length(trim(email)) > 0)
);

alter table workspace_team_members enable row level security;

create unique index if not exists workspace_team_members_email_unique_idx
  on workspace_team_members (lower(email));

create index if not exists workspace_team_members_user_id_idx
  on workspace_team_members (user_id);

create index if not exists workspace_team_members_active_idx
  on workspace_team_members (active);

create or replace function set_workspace_task_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspace_team_members_set_updated_at on workspace_team_members;
create trigger workspace_team_members_set_updated_at
before update on workspace_team_members
for each row
execute function set_workspace_task_updated_at();
