const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')

const repoRoot = path.resolve(__dirname, '..')
const frontendEnvPath = path.join(repoRoot, 'frontend', '.env.local')
const previewPath = path.join(repoRoot, 'frontend', 'src', 'data', 'vipPreviewData.ts')

function readEnv(file) {
  const values = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/)
    if (!match) continue
    values[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return values
}

function loadPreviewData() {
  const source = fs.readFileSync(previewPath, 'utf8')
  const match = source.match(/const vipPreviewData = ([\s\S]*?) as const\s+export default vipPreviewData/)
  if (!match) throw new Error('Unable to parse frontend preview data.')
  return JSON.parse(match[1])
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function timestamp() {
  return new Date().toISOString()
}

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

function titleCase(value) {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeFormat(value) {
  const normalized = String(value || 'carousel').toLowerCase()
  if (normalized.includes('reel')) return 'Reel'
  if (normalized.includes('video')) return 'Video'
  if (normalized.includes('blog')) return 'Blog'
  return 'Carousel'
}

function normalizePlatform(value, index) {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('facebook')) return 'facebook'
  if (normalized.includes('youtube')) return 'youtube'
  return index % 2 === 0 ? 'instagram' : 'facebook'
}

function buildCaption(item) {
  const topic = item.topic || item.caption_direction || 'Aayu Geriatrics update'
  return [
    `${topic}`,
    '',
    'Families caring for older adults need clear, practical steps they can act on today.',
    item.creative_brief || 'Use simple caregiver-first language and keep the next step visible.',
    '',
    item.suggested_cta || 'Book a geriatric consultation.',
    '#AayuGeriatrics #ElderCare #Hyderabad #CaregiverSupport #HealthyAgeing',
  ].join('\n')
}

function buildScript(item) {
  const topic = item.topic || 'caregiver guidance'
  return [
    `Hook: If you care for an ageing parent, this ${normalizeFormat(item.content_format).toLowerCase()} is for you.`,
    `Point 1: ${topic}.`,
    'Point 2: Keep the message practical, local, and easy for families to follow.',
    'Point 3: Add one clear next step for appointment or WhatsApp enquiry.',
    `CTA: ${item.suggested_cta || 'Talk to Aayu Geriatrics for personalised guidance.'}`,
  ].join('\n')
}

function buildSceneScript(item) {
  return [
    { scene: 1, text: 'Caregiver hook', direction: item.topic || 'Open with the core problem.' },
    { scene: 2, text: 'Doctor/team explanation', direction: item.creative_brief || 'Explain in simple clinical language.' },
    { scene: 3, text: 'Action checklist', direction: item.caption_direction || 'Give practical next steps.' },
    { scene: 4, text: 'CTA', direction: item.suggested_cta || 'Invite appointment enquiry.' },
  ]
}

function buildOnScreenText(item) {
  return [
    item.topic || 'Caregiver guidance',
    'Simple steps for families',
    item.suggested_cta || 'Book a consultation',
  ]
}

function contentItemPayload(item, clientId, planId, index, startDate) {
  const plannedDate = addDays(startDate, index)
  const format = normalizeFormat(item.content_format)
  const platform = normalizePlatform(item.platform, index)
  const caption = item.caption || buildCaption(item)
  const script = item.full_script || buildScript(item)

  return {
    content_plan_id: planId,
    client_id: clientId,
    planned_date: plannedDate,
    platform,
    content_format: format,
    topic: item.topic || item.caption_direction || `Real-time content item ${index + 1}`,
    content_angle: item.content_angle || 'Real-time workflow recommendation',
    caption_direction: item.caption_direction || item.topic || null,
    creative_brief: item.creative_brief || 'Use practical caregiver-first language and show a clear appointment path.',
    suggested_cta: item.suggested_cta || 'Book a geriatric consultation',
    source_reason: item.source_reason || 'Synced from the latest workflow output into Supabase.',
    priority_score: Math.max(1, Math.min(100, Number(item.priority_score || 60))),
    status: index < 7 ? 'production_ready' : 'planned',
    approval_status: index < 7 ? 'draft' : 'needs_review',
    is_adaptive_addition: Boolean(item.is_adaptive_addition),
    adaptation_reason: item.adaptation_reason || '',
    source_engines: Array.isArray(item.source_engines) ? item.source_engines : ['digital_marketing_strategy_orchestrator'],
    full_script: script,
    voiceover_script: script,
    scene_by_scene_script: buildSceneScript(item),
    on_screen_text: buildOnScreenText(item),
    caption,
    hashtags: ['AayuGeriatrics', 'ElderCare', 'Hyderabad', 'CaregiverSupport', 'HealthyAgeing'],
    visual_direction: item.visual_direction || 'Warm clinic/team visuals, readable captions, and senior-care context.',
    design_instructions: item.design_instructions || 'Use high-contrast text, calm healthcare colors, and one primary CTA.',
    video_editing_notes: item.video_editing_notes || 'Keep pacing clear, add subtitles, and end with phone/WhatsApp CTA.',
    thumbnail_direction: item.thumbnail_direction || titleCase(item.topic || 'Aayu Geriatrics'),
    posting_time_recommendation: item.posting_time_recommendation || 'Evening caregiver browsing window, 7:00 PM to 9:00 PM IST.',
    production_notes: 'Synced to live Supabase by scripts/sync_real_time_vip_data.cjs.',
    updated_at: timestamp(),
  }
}

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function sync() {
  const env = readEnv(frontendEnvPath)
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const preview = loadPreviewData()
  const clientSlug = 'aayu_geriatrics'
  const runDate = today()
  const startDate = runDate
  const endDate = addDays(startDate, 13)

  const client = await maybeSingle(supabase.from('clients').select('id, client_name, client_slug').eq('client_slug', clientSlug))
  if (!client) throw new Error(`Client not found: ${clientSlug}`)

  const existingPlan = await maybeSingle(
    supabase
      .from('content_plans')
      .select('id')
      .eq('client_id', client.id)
      .eq('plan_type', 'real_time_workflow_content_plan')
      .order('created_at', { ascending: false })
      .limit(1),
  )

  const planPayload = {
    client_id: client.id,
    plan_type: 'real_time_workflow_content_plan',
    plan_status: 'active',
    plan_start_date: startDate,
    plan_end_date: endDate,
    source_engines: preview.previewMeta?.engines_run || ['digital_marketing_strategy_orchestrator'],
    strategy_summary: [
      'Live Supabase content calendar refreshed from latest workflow output.',
      ...(preview.previewMeta?.top_growth_opportunities || []).slice(0, 4),
    ].join(' '),
    content_pillars: [
      'Website and conversion readiness',
      'Local SEO and service coverage',
      'Caregiver education',
      'Trust-building content',
      'Review and reputation readiness',
    ],
    platform_mix: { instagram: 7, facebook: 5, youtube: 2 },
    created_by_engine: 'real_time_workflow_sync',
    updated_at: timestamp(),
  }

  let planId = existingPlan?.id
  if (planId) {
    const { error } = await supabase.from('content_plans').update(planPayload).eq('id', planId)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase.from('content_plans').insert({ id: crypto.randomUUID(), ...planPayload }).select('id').single()
    if (error) throw new Error(error.message)
    planId = data.id
  }

  const sourceItems = (preview.items || []).slice(0, 14)
  let itemWrites = 0
  for (const [index, sourceItem] of sourceItems.entries()) {
    const payload = contentItemPayload(sourceItem, client.id, planId, index, startDate)
    const existingItem = await maybeSingle(
      supabase
        .from('content_plan_items')
        .select('id')
        .eq('content_plan_id', planId)
        .eq('planned_date', payload.planned_date)
        .eq('topic', payload.topic)
        .limit(1),
    )

    if (existingItem?.id) {
      const { error } = await supabase.from('content_plan_items').update(payload).eq('id', existingItem.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('content_plan_items').insert({ id: crypto.randomUUID(), ...payload, created_at: timestamp() })
      if (error) throw new Error(error.message)
    }
    itemWrites += 1
  }

  for (const output of preview.outputs || []) {
    const { error } = await supabase.from('intelligence_outputs').insert({
      id: crypto.randomUUID(),
      client_id: client.id,
      engine_name: output.engine_name,
      source_platform: output.source_platform || 'digital',
      report_date: runDate,
      summary: output.summary,
      key_insights: output.key_insights || [],
      recommendations: output.recommendations || [],
      next_actions: output.next_actions || [],
      confidence_score: output.confidence_score || null,
      input_sources: { ...(output.input_sources || {}), synced_to_live_supabase: true },
      created_at: timestamp(),
    })
    if (error) throw new Error(error.message)
  }

  const completed = (preview.engineRuns || []).map((run) => ({
    engine: run.engine_name,
    status: run.status,
    completed_at: timestamp(),
  }))

  const { error: dailyError } = await supabase.from('daily_operating_runs').insert({
    id: crypto.randomUUID(),
    client_id: client.id,
    run_date: runDate,
    status: 'success',
    engines_requested: preview.previewMeta?.engines_run || [],
    engines_completed: completed,
    engines_failed: [],
    critical_failure: false,
    summary: 'Live Supabase data refreshed from the latest workflow output.',
    metadata: {
      workflow_name: preview.previewMeta?.workflow_name,
      sync_script: 'scripts/sync_real_time_vip_data.cjs',
      content_plan_id: planId,
      content_items_synced: itemWrites,
    },
    started_at: timestamp(),
    completed_at: timestamp(),
  })
  if (dailyError) throw new Error(dailyError.message)

  const workspaceItems = sourceItems.slice(0, 7)
  for (const [index, sourceItem] of workspaceItems.entries()) {
    const plannedDate = addDays(startDate, index)
    const plannedActionId = `real_time_${plannedDate}_${crypto.createHash('sha1').update(sourceItem.topic || String(index)).digest('hex').slice(0, 10)}`
    const existingTask = await maybeSingle(
      supabase
        .from('workspace_tasks')
        .select('id')
        .eq('client_id', client.id)
        .eq('planned_action_id', plannedActionId)
        .limit(1),
    )
    const taskPayload = {
      title: `${client.client_name} - ${titleCase(sourceItem.topic)} ${normalizeFormat(sourceItem.content_format)}`.slice(0, 180),
      description: sourceItem.caption_direction || sourceItem.topic,
      client_id: client.id,
      client_name: client.client_name,
      category: 'publishing',
      status: 'not_started',
      priority: index < 3 ? 'high' : 'medium',
      due_date: plannedDate,
      source_type: 'workflow_generated',
      source_workflow_run_id: `real_time_sync_${runDate}`,
      source_engine_name: Array.isArray(sourceItem.source_engines) ? sourceItem.source_engines[0] : 'digital_marketing_strategy_orchestrator',
      source_plan_type: 'real_time_workflow_content_plan',
      related_content_plan_id: planId,
      related_content_plan_item_id: null,
      planned_action_id: plannedActionId,
      planned_topic: sourceItem.topic,
      planned_content_format: normalizeFormat(sourceItem.content_format),
      planned_platforms: [normalizePlatform(sourceItem.platform, index)],
      planned_publish_date: plannedDate,
      content_objective: 'Refresh live execution calendar from workflow intelligence.',
      generated_script: buildScript(sourceItem),
      generated_caption: buildCaption(sourceItem),
      plan_context: sourceItem,
      updated_at: timestamp(),
    }
    if (existingTask?.id) {
      const { error } = await supabase.from('workspace_tasks').update(taskPayload).eq('id', existingTask.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('workspace_tasks').insert({ id: crypto.randomUUID(), ...taskPayload, created_at: timestamp() })
      if (error) throw new Error(error.message)
    }
  }

  console.log(JSON.stringify({ client: client.client_name, plan_id: planId, content_items_synced: itemWrites, workspace_tasks_synced: workspaceItems.length }, null, 2))
}

sync().catch((error) => {
  console.error(error)
  process.exit(1)
})
