import { allow, bodyWithActor, createActivity, currentActor, requireWorkspaceAuth, type ApiRequest, type ApiResponse } from '../../_shared.js'

export default async function handler(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  if (request.method !== 'POST') return allow(response, ['POST'])

  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const taskId = String(request.query?.id || '')
    const body = bodyWithActor(request.body, auth)
    const commentBody = String(body.body || '').trim()
    if (!commentBody) return response.status(400).json({ error: 'body is required' })

    const { actorId, actorLabel } = currentActor(body, auth)
    const { data, error } = await supabase
      .from('workspace_task_comments')
      .insert({ task_id: taskId, body: commentBody, author_user_id: actorId, author_label: actorLabel })
      .select('*')
      .single()

    if (error) return response.status(500).json({ error: error.message })
    const activity = await createActivity(supabase, taskId, 'comment_added', 'Comment added', body)
    return response.status(201).json({
      comment: { ...data, author_user_id: data.author_user_id || data.author_label || 'internal_team_member' },
      activity,
    })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
