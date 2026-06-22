create table if not exists workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  category text,
  status text not null default 'not_started',
  priority text not null default 'medium',
  due_date date,
  source_type text not null default 'manual',
  source_workflow_run_id text,
  source_engine_name text,
  source_plan_type text,
  related_content_plan_id text,
  related_content_plan_item_id text,
  planned_action_id text,
  planned_topic text,
  planned_content_format text,
  planned_platforms jsonb not null default '[]'::jsonb,
  planned_publish_date date,
  content_objective text,
  generated_script text,
  generated_caption text,
  plan_context jsonb not null default '{}'::jsonb,
  assigned_to_user_id uuid,
  created_by_user_id uuid,
  last_updated_by_user_id uuid,
  completed_by_user_id uuid,
  completed_at timestamptz,
  raw_file_url text,
  edited_file_url text,
  drive_folder_url text,
  published_post_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_tasks_source_type_check check (source_type in ('workflow_generated', 'manual')),
  constraint workspace_tasks_status_check check (status in ('not_started', 'in_progress', 'waiting', 'blocked', 'ready_to_publish', 'published', 'completed', 'cancelled')),
  constraint workspace_tasks_priority_check check (priority in ('low', 'medium', 'high', 'urgent'))
);

alter table workspace_tasks add column if not exists source_workflow_run_id text;
alter table workspace_tasks add column if not exists source_engine_name text;
alter table workspace_tasks add column if not exists source_plan_type text;
alter table workspace_tasks add column if not exists related_content_plan_id text;
alter table workspace_tasks add column if not exists related_content_plan_item_id text;
alter table workspace_tasks add column if not exists planned_action_id text;
alter table workspace_tasks add column if not exists planned_topic text;
alter table workspace_tasks add column if not exists planned_content_format text;
alter table workspace_tasks add column if not exists planned_platforms jsonb not null default '[]'::jsonb;
alter table workspace_tasks add column if not exists planned_publish_date date;
alter table workspace_tasks add column if not exists content_objective text;
alter table workspace_tasks add column if not exists generated_script text;
alter table workspace_tasks add column if not exists generated_caption text;
alter table workspace_tasks add column if not exists plan_context jsonb not null default '{}'::jsonb;
alter table workspace_tasks add column if not exists raw_file_url text;
alter table workspace_tasks add column if not exists edited_file_url text;
alter table workspace_tasks add column if not exists drive_folder_url text;
alter table workspace_tasks add column if not exists published_post_url text;

create table if not exists workspace_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references workspace_tasks(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  step_type text not null,
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_by_user_id uuid,
  completed_at timestamptz,
  notes text,
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_task_checklist_step_type_check check (
    step_type in (
      'raw_asset_received',
      'raw_asset_uploaded',
      'editing_completed',
      'thumbnail_generated',
      'caption_reviewed',
      'final_asset_uploaded',
      'instagram_published',
      'instagram_link_added',
      'facebook_published',
      'facebook_link_added',
      'youtube_published',
      'youtube_link_added',
      'blog_published',
      'website_updated',
      'gbp_updated',
      'client_followup_done',
      'execution_completed'
    )
  )
);

create index if not exists workspace_tasks_client_due_date_idx
  on workspace_tasks (client_id, due_date);

create index if not exists workspace_tasks_planned_publish_date_idx
  on workspace_tasks (planned_publish_date);

create index if not exists workspace_tasks_status_idx
  on workspace_tasks (status);

create index if not exists workspace_tasks_platforms_gin_idx
  on workspace_tasks using gin (planned_platforms);

create index if not exists workspace_tasks_plan_context_gin_idx
  on workspace_tasks using gin (plan_context);

create unique index if not exists workspace_tasks_workflow_plan_item_unique_idx
  on workspace_tasks (source_workflow_run_id, related_content_plan_item_id)
  where source_type = 'workflow_generated'
    and source_workflow_run_id is not null
    and related_content_plan_item_id is not null;

create unique index if not exists workspace_tasks_workflow_action_unique_idx
  on workspace_tasks (source_workflow_run_id, planned_action_id)
  where source_type = 'workflow_generated'
    and source_workflow_run_id is not null
    and planned_action_id is not null;

create index if not exists workspace_task_checklist_task_sort_idx
  on workspace_task_checklist_items (task_id, sort_order);

create or replace function set_workspace_task_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspace_tasks_set_updated_at on workspace_tasks;
create trigger workspace_tasks_set_updated_at
before update on workspace_tasks
for each row
execute function set_workspace_task_updated_at();

drop trigger if exists workspace_task_checklist_items_set_updated_at on workspace_task_checklist_items;
create trigger workspace_task_checklist_items_set_updated_at
before update on workspace_task_checklist_items
for each row
execute function set_workspace_task_updated_at();
