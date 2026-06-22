import { allow, bodyWithActor, createActivity, currentActor, getTask, requireWorkspaceAuth, type ApiRequest, type ApiResponse } from '../../_shared.js'

const taskLinkFields: Record<string, string> = {
  raw_video: 'raw_file_url',
  edited_video: 'edited_file_url',
  final_drive: 'drive_folder_url',
  instagram_post: 'published_post_url',
  facebook_post: 'published_post_url',
  youtube: 'published_post_url',
  blog: 'published_post_url',
}

export default async function handler(request: ApiRequest<Record<string, unknown>>, response: ApiResponse) {
  if (request.method !== 'POST') return allow(response, ['POST'])

  try {
    const context = await requireWorkspaceAuth(request, response)
    if (!context) return
    const { auth, supabase } = context
    const taskId = String(request.query?.id || '')
    const body = bodyWithActor(request.body, auth)
    const linkType = String(body.link_type || 'other')
    const label = String(body.label || linkType).trim()
    const url = String(body.url || '').trim()
    if (!url) return response.status(400).json({ error: 'url is required' })

    const { actorId, actorLabel } = currentActor(body, auth)
    const { data, error } = await supabase
      .from('workspace_task_attachments')
      .insert({ task_id: taskId, link_type: linkType, label, url, added_by_user_id: actorId, added_by_label: actorLabel })
      .select('*')
      .single()

    if (error) return response.status(500).json({ error: error.message })

    const taskField = taskLinkFields[linkType]
    if (taskField) await supabase.from('workspace_tasks').update({ [taskField]: url }).eq('id', taskId)

    const activity = await createActivity(supabase, taskId, 'attachment_added', `${label} link added`, body)
    const task = await getTask(supabase, taskId)
    return response.status(201).json({
      attachment: { ...data, added_by_user_id: data.added_by_user_id || data.added_by_label || 'internal_team_member' },
      task,
      activity,
    })
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
