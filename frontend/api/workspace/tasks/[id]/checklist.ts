import { allow, bodyWithActor, createActivity, requireWorkspaceAuth, type ApiRequest, type ApiResponse } from '../../_shared'

export default async function handler(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  if (request.method !== 'POST') return allow(response, ['POST'])

  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const taskId = String(request.query?.id || '')
    const body = bodyWithActor(request.body, auth)
    const title = String(body.title || '').trim()
    if (!title) return response.status(400).json({ error: 'title is required' })

    const { data, error } = await supabase
      .from('workspace_task_checklist_items')
      .insert({
        task_id: taskId,
        title,
        sort_order: Number(body.sort_order || 999),
        step_type: body.step_type || 'client_followup_done',
        is_required: body.is_required !== false,
      })
      .select('*')
      .single()

    if (error) return response.status(500).json({ error: error.message })
    const activity = await createActivity(supabase, taskId, 'checklist_item_added', `${title} added`, body)
    return response.status(201).json({ item: data, activity })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
