# VIP Team Workspace Architecture

The Team Workspace is the execution layer for workflow-generated digital marketing plans. The plan item is the source of truth; the workspace task exists so the team can execute, track files, publish, and connect the final URL back to later analytics.

## Core Rule

Workflow engines should not create disconnected operational tasks such as "video received" or "video edited". When a workflow recommendation says "do this today/tomorrow", the system creates one executable workspace task linked to the exact generated plan item, and execution steps live as checklist items inside that task.

Traceability must support:

1. workflow plan item
2. workspace task
3. checklist completion
4. final published URL
5. later analytics/performance comparison

Manual tasks remain supported, but workflow-generated tasks must always carry source plan context.

## Plan Sources

The workspace can receive execution items from:

- daily content plans
- 30-day content plans
- daily content production plans
- action plans
- adaptive plan updates
- website/SEO improvement suggestions
- Google Business Profile tasks
- social media publishing recommendations
- content performance follow-up actions

## Database

Migration:

- `database/migrations/202606220001_workflow_linked_workspace_tasks.sql`
- `database/migrations/202606220002_workspace_task_collaboration.sql`

### `workspace_tasks`

`workspace_tasks` stores the executable task plus enough preserved plan context for a team member to work without opening another page.

Key fields:

- `id`
- `title`
- `description`
- `client_id`
- `client_name`
- `category`
- `status`
- `priority`
- `due_date`
- `source_type`: `workflow_generated` or `manual`
- `source_workflow_run_id`
- `source_engine_name`
- `source_plan_type`
- `related_content_plan_id`
- `related_content_plan_item_id`
- `planned_action_id`
- `planned_topic`
- `planned_content_format`
- `planned_platforms`
- `planned_publish_date`
- `content_objective`
- `generated_script`
- `generated_caption`
- `plan_context`
- `assigned_to_user_id`
- `created_by_user_id`
- `last_updated_by_user_id`
- `completed_by_user_id`
- `completed_at`
- `raw_file_url`
- `edited_file_url`
- `drive_folder_url`
- `published_post_url`
- `notes`
- `created_at`
- `updated_at`

Duplicate workflow tasks are blocked by partial unique indexes on:

- `source_workflow_run_id + related_content_plan_item_id`
- `source_workflow_run_id + planned_action_id`

### `workspace_task_checklist_items`

Checklist items represent execution steps for the linked plan item.

Fields:

- `id`
- `task_id`
- `title`
- `sort_order`
- `step_type`
- `is_required`
- `is_completed`
- `completed_by_user_id`
- `completed_at`
- `notes`
- `attachment_url`
- `created_at`
- `updated_at`

Supported `step_type` values:

- `raw_asset_received`
- `raw_asset_uploaded`
- `editing_completed`
- `thumbnail_generated`
- `caption_reviewed`
- `final_asset_uploaded`
- `instagram_published`
- `instagram_link_added`
- `facebook_published`
- `facebook_link_added`
- `youtube_published`
- `youtube_link_added`
- `blog_published`
- `website_updated`
- `gbp_updated`
- `client_followup_done`
- `execution_completed`

### MVP collaboration tables

The implementation also adds small supporting tables for task comments, task links/attachments, and activity logs:

- `workspace_task_comments`
- `workspace_task_attachments`
- `workspace_task_activity_logs`

These tables preserve author/actor accountability for manual task execution, status changes, checklist toggles, comments, and added links.

## Workflow Task Creation API

Endpoint:

- `POST /api/workspace/workflow-tasks`

The endpoint accepts one or more plan items and returns created or existing task IDs. The API should resolve incoming workflow client identifiers to the canonical `clients.id`; for example, a request may send `client_id: "aayu_geriatrics"` and the API can resolve it through `clients.client_slug` before inserting.

For each workflow-generated plan item, the endpoint must:

1. Create a workspace task linked to the source plan item.
2. Generate checklist items based on content/action type and target platforms.
3. Preserve the source plan context on the task.
4. Avoid duplicates using `source_workflow_run_id + related_content_plan_item_id` or `source_workflow_run_id + planned_action_id`.
5. Return task IDs, marking whether each task was created or already existed.

Example request:

```json
{
  "source_workflow_run_id": "run_2026_06_22_aayu_daily_plan",
  "source_engine_name": "daily_content_production_plan_engine",
  "source_plan_type": "daily_content_plan",
  "client_id": "aayu_geriatrics",
  "client_name": "Aayu Geriatrics",
  "items": [
    {
      "related_content_plan_id": "plan_123",
      "related_content_plan_item_id": "item_urinary_reel_001",
      "planned_action_id": "action_001",
      "planned_topic": "Urinary problems in older adults",
      "planned_content_format": "reel",
      "planned_platforms": ["instagram", "facebook"],
      "planned_publish_date": "2026-06-23",
      "content_objective": "Caregiver awareness and timely consultation",
      "generated_script": "Script generated by the content plan engine...",
      "generated_caption": "Caption generated by the content plan engine...",
      "category": "publishing",
      "priority": "high"
    }
  ]
}
```

Example task title:

```text
Aayu Geriatrics - Urinary Problems Reel
```

Example task description:

```text
Execute the planned reel from the daily content plan. Topic: Urinary problems in older adults. Platforms: Instagram and Facebook. Planned publish date: 2026-06-23.
```

Example checklist:

- Raw video received
- Raw video uploaded to Drive
- Video edited
- Thumbnail generated
- Caption reviewed
- Final video uploaded to Drive
- Posted on Instagram
- Instagram post link added
- Posted on Facebook
- Facebook post link added
- Execution marked complete

## Checklist Generation

Default content production checklist:

- `raw_asset_received`: Raw video received
- `raw_asset_uploaded`: Raw video uploaded to Drive
- `editing_completed`: Video edited
- `thumbnail_generated`: Thumbnail generated
- `caption_reviewed`: Caption reviewed
- `final_asset_uploaded`: Final video uploaded to Drive
- platform publish/link steps for each planned platform
- `execution_completed`: Execution marked complete

Platform step mapping:

- Instagram: `instagram_published`, `instagram_link_added`
- Facebook: `facebook_published`, `facebook_link_added`
- YouTube: `youtube_published`, `youtube_link_added`
- Blog: `blog_published`
- Website/SEO: `website_updated`
- Google Business Profile: `gbp_updated`

## Dashboard

The workspace dashboard should show:

- Planned today
- Execution pending
- Ready to publish
- Published today
- Plan items not started
- Plan items completed
- Tasks grouped by content plan
- Tasks grouped by client
- Tasks grouped by planned platform
- Tasks grouped by status

## Task Detail

The task detail page should have a Plan Context section:

- Generated from: Daily Content Plan, 30-Day Plan, Adaptive Update, SEO Action Plan, or another source plan type
- Source engine
- Planned topic
- Planned format
- Planned platforms
- Planned publish date
- Objective
- Generated script
- Generated caption

It should also have an Execution section:

- Checklist
- Links/files
- Comments
- Activity log

## Completion And Analytics

Each checklist completion stores who completed it, when it was completed, optional notes, and an optional attachment/link. Publishing checklist steps should capture final post URLs through checklist `attachment_url` or task-level `published_post_url`.

Later analytics jobs should join performance data back to the task through the final published URL, then back to the original plan item through `source_workflow_run_id`, `related_content_plan_item_id`, and `planned_action_id`.
