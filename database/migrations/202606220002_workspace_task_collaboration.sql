alter table workspace_tasks drop constraint if exists workspace_tasks_status_check;
alter table workspace_tasks add constraint workspace_tasks_status_check
  check (status in ('not_started', 'in_progress', 'waiting', 'blocked', 'ready_to_publish', 'published', 'completed', 'cancelled'));

create table if not exists workspace_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references workspace_tasks(id) on delete cascade,
  body text not null,
  author_user_id uuid,
  author_label text,
  created_at timestamptz not null default now()
);

create table if not exists workspace_task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references workspace_tasks(id) on delete cascade,
  link_type text not null,
  label text not null,
  url text not null,
  added_by_user_id uuid,
  added_by_label text,
  created_at timestamptz not null default now(),
  constraint workspace_task_attachments_link_type_check check (
    link_type in (
      'raw_video',
      'edited_video',
      'final_drive',
      'thumbnail',
      'instagram_post',
      'facebook_post',
      'youtube',
      'blog',
      'other'
    )
  )
);

create table if not exists workspace_task_activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references workspace_tasks(id) on delete cascade,
  actor_user_id uuid,
  actor_label text,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_task_comments_task_created_idx
  on workspace_task_comments (task_id, created_at desc);

create index if not exists workspace_task_attachments_task_created_idx
  on workspace_task_attachments (task_id, created_at desc);

create index if not exists workspace_task_activity_task_created_idx
  on workspace_task_activity_logs (task_id, created_at desc);
