import {
  allow,
  bodyWithActor,
  createActivity,
  currentActor,
  getTask,
  normalizeDbStatus,
  requireWorkspaceAuth,
  type ApiRequest,
  type ApiResponse,
} from '../_shared'

export default async function handler(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  if (request.method === 'GET') return readTask(request, response)
  if (request.method === 'PATCH') return updateTask(request, response)
  return allow(response, ['GET', 'PATCH'])
}

async function readTask(request: ApiRequest, response: ApiResponse) {
  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { supabase } = context
    const taskId = String(request.query?.id || '')
    const task = await getTask(supabase, taskId)
    if (!task) return response.status(404).json({ error: 'Task not found' })
    return response.status(200).json({ task })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function updateTask(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const taskId = String(request.query?.id || '')
    const body = bodyWithActor(request.body, auth)
    const { actorId } = currentActor(body, auth)
    const patch: Record<string, unknown> = {}

    if (body.status) {
      patch.status = normalizeDbStatus(String(body.status))
      patch.last_updated_by_user_id = actorId
      if (body.status === 'completed') {
        patch.completed_by_user_id = actorId
        patch.completed_at = new Date().toISOString()
      }
    }

    for (const field of ['title', 'description', 'category', 'priority', 'due_date', 'notes']) {
      if (field in body) patch[field] = body[field]
    }

    const { error } = await supabase.from('workspace_tasks').update(patch).eq('id', taskId)
    if (error) return response.status(500).json({ error: error.message })

    if (body.status) await createActivity(supabase, taskId, 'status_changed', `Status changed to ${String(body.status)}`, body)
    const task = await getTask(supabase, taskId)
    return response.status(200).json({ task })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
