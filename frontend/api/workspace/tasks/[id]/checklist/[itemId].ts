import { allow, bodyWithActor, createActivity, currentActor, requireWorkspaceAuth, type ApiRequest, type ApiResponse } from '../../../_shared'

export default async function handler(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  if (request.method !== 'PATCH') return allow(response, ['PATCH'])

  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const taskId = String(request.query?.id || '')
    const itemId = String(request.query?.itemId || '')
    const body = bodyWithActor(request.body, auth)
    const isCompleted = Boolean(body.is_completed)
    const { actorId } = currentActor(body, auth)

    const { data, error } = await supabase
      .from('workspace_task_checklist_items')
      .update({
        is_completed: isCompleted,
        completed_by_user_id: isCompleted ? actorId : null,
        completed_at: isCompleted ? new Date().toISOString() : null,
        notes: body.notes,
        attachment_url: body.attachment_url,
      })
      .eq('id', itemId)
      .eq('task_id', taskId)
      .select('*')
      .single()

    if (error) return response.status(500).json({ error: error.message })
    await supabase.from('workspace_tasks').update({ last_updated_by_user_id: actorId }).eq('id', taskId)
    const activity = await createActivity(supabase, taskId, 'checklist_updated', `${data.title} ${isCompleted ? 'completed' : 'reopened'}`, body)
    return response.status(200).json({ item: data, activity })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
