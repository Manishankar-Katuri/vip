import {
  allow,
  bodyWithActor,
  createActivity,
  currentActor,
  hydrateTasks,
  normalizeDbStatus,
  requireWorkspaceAuth,
  type ApiRequest,
  type ApiResponse,
} from './_shared.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'GET') return listTasks(request, response)
  if (request.method === 'POST') return createManualTask(request, response)
  return allow(response, ['GET', 'POST'])
}

async function listTasks(request: ApiRequest, response: ApiResponse) {
  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { supabase } = context
    let query = supabase.from('workspace_tasks').select('*').order('updated_at', { ascending: false }).limit(200)
    const filters = request.query || {}

    if (filters.client_id) query = query.eq('client_id', filters.client_id)
    if (filters.status) query = query.eq('status', normalizeDbStatus(String(filters.status)))
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.source_type) query = query.eq('source_type', filters.source_type)
    if (filters.due_date) query = query.eq('due_date', filters.due_date)

    const { data, error } = await query
    if (error) return response.status(500).json({ error: error.message })
    const tasks = await hydrateTasks(supabase, data || [])
    return response.status(200).json({ tasks })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function createManualTask(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const body = bodyWithActor(request.body, auth)
    const title = String(body.title || '').trim()
    if (!title) return response.status(400).json({ error: 'title is required' })

    const { actorId } = currentActor(body, auth)
    const { data, error } = await supabase
      .from('workspace_tasks')
      .insert({
        title,
        description: body.description || null,
        client_id: body.client_id || null,
        client_name: body.client_name || null,
        category: body.category || 'general',
        status: 'not_started',
        priority: body.priority || 'medium',
        due_date: body.due_date || null,
        source_type: 'manual',
        planned_platforms: body.platform ? [body.platform] : [],
        notes: body.notes || null,
        created_by_user_id: actorId,
      })
      .select('*')
      .single()

    if (error) return response.status(500).json({ error: error.message })
    await createActivity(supabase, data.id, 'task_created', 'Task created manually', body)
    const [task] = await hydrateTasks(supabase, [data])
    return response.status(201).json({ task })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
