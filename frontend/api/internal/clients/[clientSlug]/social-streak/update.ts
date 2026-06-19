import { createClient } from '@supabase/supabase-js'

const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env || {}
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
const internalApiKey = env.INTERNAL_API_KEY || ''

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

type ApiRequest = {
  method?: string
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
  body?: {
    target_post_date?: string
    scan_date?: string
    posted_yesterday?: boolean
    platforms_posted?: string[]
    post_count?: number | string
    scan_status?: string
  }
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => { json: (body: unknown) => unknown }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  if (!internalApiKey) return response.status(500).json({ error: 'INTERNAL_API_KEY is required' })

  if (request.headers.authorization !== `Bearer ${internalApiKey}`) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const clientSlug = String(request.query.clientSlug || '')
  const body = request.body || {}

  if (!clientSlug) return response.status(400).json({ error: 'clientSlug is required' })
  if (!body.target_post_date || !body.scan_date) {
    return response.status(400).json({ error: 'target_post_date and scan_date are required' })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('update_client_social_streak', {
      p_client_slug: clientSlug,
      p_scan_date: body.scan_date,
      p_target_post_date: body.target_post_date,
      p_posted_yesterday: Boolean(body.posted_yesterday),
      p_platforms_posted: body.platforms_posted || [],
      p_post_count: Number(body.post_count || 0),
      p_scan_status: body.scan_status || 'success',
    })

    if (error) return response.status(500).json({ error: error.message })
    return response.status(200).json(data)
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
