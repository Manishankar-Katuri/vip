import {
  allow,
  buildChecklist,
  buildTaskDescription,
  buildTaskTitle,
  createActivity,
  hydrateTasks,
  requireWorkspaceAuth,
  resolveClientId,
  bodyWithActor,
  type SupabaseAdmin,
  type ApiRequest,
  type ApiResponse,
} from './_shared.js'

type WorkflowItem = {
  related_content_plan_id?: string
  related_content_plan_item_id?: string
  planned_action_id?: string
  planned_topic?: string
  planned_content_format?: string
  planned_platforms?: string[]
  planned_publish_date?: string
  content_objective?: string
  generated_script?: string
  generated_caption?: string
  category?: string
  priority?: string
}

type WorkflowBody = {
  source_workflow_run_id?: string
  source_engine_name?: string
  source_plan_type?: string
  client_id?: string
  client_name?: string
  items?: WorkflowItem[]
}

export default async function handler(request: ApiRequest<WorkflowBody>, response: ApiResponse) {
  if (request.method !== 'POST') return allow(response, ['POST'])

  try {
    const context = await requireWorkspaceAuth(request, response, { allowInternalWorkflow: true })
    if (!context) return
    const { auth, supabase } = context
    const body = bodyWithActor(request.body, auth) as WorkflowBody & Record<string, unknown>
    const items = Array.isArray(body.items) ? body.items : []

    if (!body.source_workflow_run_id) return response.status(400).json({ error: 'source_workflow_run_id is required' })
    if (items.length === 0) return response.status(400).json({ error: 'items must contain at least one plan item' })

    const clientId = await resolveClientId(supabase, body.client_id)
    const results = []

    for (const item of items) {
      const existing = await findExistingTask(supabase, body.source_workflow_run_id, item)
      if (existing) {
        results.push({ task_id: existing.id, status: 'existing' })
        continue
      }

      const platforms = Array.isArray(item.planned_platforms) ? item.planned_platforms : []
      const taskInsert = {
        title: buildTaskTitle(body.client_name, item.planned_topic, item.planned_content_format),
        description: buildTaskDescription(body.source_plan_type, item.planned_topic, platforms, item.planned_publish_date),
        client_id: clientId,
        client_name: body.client_name || null,
        category: item.category || 'publishing',
        status: 'not_started',
        priority: item.priority || 'medium',
        due_date: item.planned_publish_date || null,
        source_type: 'workflow_generated',
        source_workflow_run_id: body.source_workflow_run_id,
        source_engine_name: body.source_engine_name || null,
        source_plan_type: body.source_plan_type || null,
        related_content_plan_id: item.related_content_plan_id || null,
        related_content_plan_item_id: item.related_content_plan_item_id || null,
        planned_action_id: item.planned_action_id || null,
        planned_topic: item.planned_topic || null,
        planned_content_format: item.planned_content_format || null,
        planned_platforms: platforms,
        planned_publish_date: item.planned_publish_date || null,
        content_objective: item.content_objective || null,
        generated_script: item.generated_script || null,
        generated_caption: item.generated_caption || null,
        plan_context: { ...item, source_workflow_run_id: body.source_workflow_run_id, source_engine_name: body.source_engine_name, source_plan_type: body.source_plan_type },
      }

      const { data: task, error: taskError } = await supabase.from('workspace_tasks').insert(taskInsert).select('*').single()
      if (taskError) throw new Error(taskError.message)

      const checklist = buildChecklist(item.planned_content_format, platforms).map((step) => ({ ...step, task_id: task.id }))
      if (checklist.length > 0) {
        const { error: checklistError } = await supabase.from('workspace_task_checklist_items').insert(checklist)
        if (checklistError) throw new Error(checklistError.message)
      }

      await createActivity(supabase, task.id, 'workflow_task_created', 'Task created from workflow plan item', body)
      results.push({ task_id: task.id, status: 'created' })
    }

    const taskIds = results.map((result) => result.task_id)
    const { data, error } = await supabase.from('workspace_tasks').select('*').in('id', taskIds)
    if (error) throw new Error(error.message)
    const tasks = await hydrateTasks(supabase, data || [])

    return response.status(200).json({ results, task_ids: taskIds, tasks })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function findExistingTask(supabase: SupabaseAdmin, runId: string, item: WorkflowItem) {
  if (item.related_content_plan_item_id) {
    const { data, error } = await supabase
      .from('workspace_tasks')
      .select('id')
      .eq('source_workflow_run_id', runId)
      .eq('related_content_plan_item_id', item.related_content_plan_item_id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data
  }

  if (item.planned_action_id) {
    const { data, error } = await supabase
      .from('workspace_tasks')
      .select('id')
      .eq('source_workflow_run_id', runId)
      .eq('planned_action_id', item.planned_action_id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  return null
}
