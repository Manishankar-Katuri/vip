import { allow, dashboardSummary, hydrateTasks, requireWorkspaceAuth, type ApiRequest, type ApiResponse } from './_shared.js'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') return allow(response, ['GET'])

  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { supabase } = context
    const { data, error } = await supabase.from('workspace_tasks').select('*').order('updated_at', { ascending: false }).limit(500)
    if (error) return response.status(500).json({ error: error.message })

    const tasks = await hydrateTasks(supabase, data || [])
    return response.status(200).json({ summary: dashboardSummary(tasks), tasks })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
