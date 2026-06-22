import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env || {}
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
const internalWorkspaceToken = normalizeSecret(env.WORKSPACE_API_INTERNAL_TOKEN)

export type ApiRequest<T = Record<string, unknown>> = {
  method?: string
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
  body?: T
}

export type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => { json: (body: unknown) => unknown }
}

export type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>
export type ApiBody = Record<string, unknown>
export type WorkspaceAuth = {
  mode: 'user' | 'internal'
  userId: string | null
  email: string | null
  displayName: string | null
  membershipId: string | null
  actorLabel: string
}

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for workspace API persistence')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  })
}

export function allow(response: ApiResponse, methods: string[]) {
  response.setHeader('Allow', methods.join(', '))
  return response.status(405).json({ error: 'Method not allowed' })
}

export async function requireWorkspaceAuth(request: ApiRequest, response: ApiResponse, options: { allowInternalWorkflow?: boolean } = {}) {
  const supabase = getSupabaseAdmin()
  const internalToken = readInternalToken(request)

  if (options.allowInternalWorkflow && internalToken && internalWorkspaceToken && constantTimeEqual(internalToken, internalWorkspaceToken)) {
    return {
      auth: {
        mode: 'internal',
        userId: null,
        email: null,
        displayName: null,
        membershipId: null,
        actorLabel: 'workflow_sync',
      } satisfies WorkspaceAuth,
      supabase,
    }
  }

  if (internalToken && (!options.allowInternalWorkflow || !internalWorkspaceToken || !constantTimeEqual(internalToken, internalWorkspaceToken))) {
    response.status(403).json({ error: 'Workspace API token is not authorized for this route' })
    return null
  }

  const bearerToken = readBearerToken(request)
  if (!bearerToken) {
    response.status(401).json({ error: 'Workspace authentication required' })
    return null
  }

  const { data, error } = await supabase.auth.getUser(bearerToken)
  if (error || !data.user) {
    response.status(401).json({ error: 'Workspace authentication failed' })
    return null
  }

  const membership = await findWorkspaceTeamMember(supabase, data.user.id, data.user.email || '')
  if (!membership) {
    response.status(403).json({ error: 'Workspace access denied' })
    return null
  }

  return {
    auth: {
      mode: 'user',
      userId: data.user.id,
      email: data.user.email || null,
      displayName: membership.display_name || null,
      membershipId: membership.id,
      actorLabel: membership.display_name || data.user.email || data.user.id,
    } satisfies WorkspaceAuth,
    supabase,
  }
}

export function bodyWithActor(body: Record<string, unknown> | undefined, auth: WorkspaceAuth): ApiBody {
  return {
    ...(body || {}),
    current_user_id: auth.userId || auth.actorLabel,
  }
}

export function currentActor(body?: Record<string, unknown>, auth?: WorkspaceAuth) {
  if (auth?.mode === 'user') return { actorId: auth.userId, actorLabel: auth.displayName || auth.email }
  if (auth?.mode === 'internal') return { actorId: null, actorLabel: auth.actorLabel }
  const raw = String(body?.current_user_id || '')
  return isUuid(raw) ? { actorId: raw, actorLabel: null } : { actorId: null, actorLabel: raw || 'internal_team_member' }
}

export function normalizeDbStatus(status?: string) {
  if (status === 'todo') return 'not_started'
  if (status === 'ready') return 'ready_to_publish'
  return status || 'not_started'
}

export function normalizeUiStatus(status?: string) {
  if (status === 'not_started') return 'todo'
  if (status === 'ready_to_publish') return 'ready'
  return status || 'todo'
}

export async function hydrateTasks(supabase: SupabaseAdmin, taskRows: Array<Record<string, unknown>>) {
  const taskIds = taskRows.map((task) => String(task.id))
  if (taskIds.length === 0) return []

  const [checklist, comments, attachments, activity] = await Promise.all([
    supabase.from('workspace_task_checklist_items').select('*').in('task_id', taskIds).order('sort_order', { ascending: true }),
    supabase.from('workspace_task_comments').select('*').in('task_id', taskIds).order('created_at', { ascending: false }),
    supabase.from('workspace_task_attachments').select('*').in('task_id', taskIds).order('created_at', { ascending: false }),
    supabase.from('workspace_task_activity_logs').select('*').in('task_id', taskIds).order('created_at', { ascending: false }),
  ])

  for (const result of [checklist, comments, attachments, activity]) {
    if (result.error) throw new Error(result.error.message)
  }

  return taskRows.map((task) => ({
    ...task,
    status: normalizeUiStatus(String(task.status || 'not_started')),
    planned_platforms: Array.isArray(task.planned_platforms) ? task.planned_platforms : [],
    checklist: (checklist.data || []).filter((item) => item.task_id === task.id),
    comments: (comments.data || []).filter((item) => item.task_id === task.id).map((item) => ({
      ...item,
      author_user_id: item.author_user_id || item.author_label || 'internal_team_member',
    })),
    attachments: (attachments.data || []).filter((item) => item.task_id === task.id).map((item) => ({
      ...item,
      added_by_user_id: item.added_by_user_id || item.added_by_label || 'internal_team_member',
    })),
    activity: (activity.data || []).filter((item) => item.task_id === task.id).map((item) => ({
      ...item,
      actor_user_id: item.actor_user_id || item.actor_label || 'internal_team_member',
    })),
  }))
}

export async function getTask(supabase: SupabaseAdmin, taskId: string) {
  const { data, error } = await supabase.from('workspace_tasks').select('*').eq('id', taskId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [task] = await hydrateTasks(supabase, [data])
  return task
}

export async function createActivity(supabase: SupabaseAdmin, taskId: string, action: string, message: string, body?: Record<string, unknown>) {
  const { actorId, actorLabel } = currentActor(body)
  const { data, error } = await supabase
    .from('workspace_task_activity_logs')
    .insert({ task_id: taskId, actor_user_id: actorId, actor_label: actorLabel, action, message })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return { ...data, actor_user_id: data.actor_user_id || data.actor_label || 'internal_team_member' }
}

export function buildTaskTitle(clientName?: string, topic?: string, format?: string) {
  const readableTopic = titleCase(String(topic || 'Planned Action'))
  const readableFormat = titleCase(String(format || 'Task'))
  return `${clientName || 'Client'} - ${readableTopic} ${readableFormat}`
}

export function buildTaskDescription(planType?: string, topic?: string, platforms?: string[], publishDate?: string) {
  const source = humanize(planType || 'workflow plan')
  const platformText = platforms?.length ? platforms.map(humanize).join(' and ') : 'the planned platforms'
  return `Execute the planned item from the ${source}. Topic: ${topic || 'Not specified'}. Platforms: ${platformText}. Planned publish date: ${publishDate || 'Not specified'}.`
}

export function buildChecklist(format?: string, platforms?: string[]) {
  const normalizedFormat = String(format || '').toLowerCase()
  const normalizedPlatforms = (platforms || []).map((platform) => platform.toLowerCase())
  const steps: Array<{ title: string; step_type: string }> = []

  if (['reel', 'video', 'short', 'youtube_short'].some((value) => normalizedFormat.includes(value))) {
    steps.push(
      { title: 'Raw video received', step_type: 'raw_asset_received' },
      { title: 'Raw video uploaded to Drive', step_type: 'raw_asset_uploaded' },
      { title: 'Video edited', step_type: 'editing_completed' },
      { title: 'Thumbnail generated', step_type: 'thumbnail_generated' },
      { title: 'Caption reviewed', step_type: 'caption_reviewed' },
      { title: 'Final video uploaded to Drive', step_type: 'final_asset_uploaded' },
    )
  } else if (normalizedFormat.includes('blog')) {
    steps.push({ title: 'Blog published', step_type: 'blog_published' })
  } else if (normalizedFormat.includes('website') || normalizedFormat.includes('seo')) {
    steps.push({ title: 'Website updated', step_type: 'website_updated' })
  } else {
    steps.push({ title: 'Client follow-up done', step_type: 'client_followup_done' })
  }

  for (const platform of normalizedPlatforms) {
    if (platform.includes('instagram')) steps.push({ title: 'Posted on Instagram', step_type: 'instagram_published' }, { title: 'Instagram post link added', step_type: 'instagram_link_added' })
    if (platform.includes('facebook')) steps.push({ title: 'Posted on Facebook', step_type: 'facebook_published' }, { title: 'Facebook post link added', step_type: 'facebook_link_added' })
    if (platform.includes('youtube')) steps.push({ title: 'Posted on YouTube', step_type: 'youtube_published' }, { title: 'YouTube link added', step_type: 'youtube_link_added' })
    if (platform.includes('blog')) steps.push({ title: 'Blog published', step_type: 'blog_published' })
    if (platform.includes('website')) steps.push({ title: 'Website updated', step_type: 'website_updated' })
    if (platform.includes('gbp') || platform.includes('google_business')) steps.push({ title: 'Google Business Profile updated', step_type: 'gbp_updated' })
  }

  steps.push({ title: 'Execution marked complete', step_type: 'execution_completed' })
  return dedupeSteps(steps).map((step, index) => ({ ...step, sort_order: index + 1, is_required: true }))
}

export async function resolveClientId(supabase: SupabaseAdmin, value?: string) {
  if (!value) return null
  if (isUuid(value)) return value
  const { data, error } = await supabase.from('clients').select('id').eq('client_slug', value).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id || null
}

export function dashboardSummary(tasks: Array<Record<string, unknown>>) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    totalToday: tasks.filter((task) => String(task.due_date || task.planned_publish_date || '') === today).length,
    pending: tasks.filter((task) => ['todo', 'waiting'].includes(String(task.status))).length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    ready: tasks.filter((task) => task.status === 'ready').length,
    completedToday: tasks.filter((task) => String(task.completed_at || '').slice(0, 10) === today).length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
    overdue: tasks.filter((task) => {
      const date = String(task.due_date || task.planned_publish_date || '')
      return Boolean(date && date < today && task.status !== 'completed')
    }).length,
  }
}

function dedupeSteps(steps: Array<{ title: string; step_type: string }>) {
  const seen = new Set<string>()
  return steps.filter((step) => {
    if (seen.has(step.step_type)) return false
    seen.add(step.step_type)
    return true
  })
}

function titleCase(value: string) {
  return humanize(value).replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function humanize(value: string) {
  return value.replace(/_/g, ' ')
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function findWorkspaceTeamMember(supabase: SupabaseAdmin, userId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (userId) {
    const { data, error } = await supabase
      .from('workspace_team_members')
      .select('id, user_id, email, display_name, active')
      .eq('active', true)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data
  }

  if (!normalizedEmail) return null

  const { data, error } = await supabase
    .from('workspace_team_members')
    .select('id, user_id, email, display_name, active')
    .eq('active', true)
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

function getHeader(request: ApiRequest, name: string) {
  const headers = request.headers || {}
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
  const value = match?.[1]
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function readBearerToken(request: ApiRequest) {
  const authHeader = getHeader(request, 'authorization')
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  return normalizeSecret(match?.[1])
}

function readInternalToken(request: ApiRequest) {
  const headerToken = normalizeSecret(getHeader(request, 'x-workspace-api-token'))
  if (headerToken) return headerToken
  const bearerToken = readBearerToken(request)
  if (bearerToken && internalWorkspaceToken && constantTimeEqual(bearerToken, internalWorkspaceToken)) return bearerToken
  return ''
}

function normalizeSecret(value?: string) {
  return String(value || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

function constantTimeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}
