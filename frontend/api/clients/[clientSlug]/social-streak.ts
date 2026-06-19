import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

function getSupabaseForRequest(authorization: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required')
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const clientSlug = String(request.query.clientSlug || '')
  if (!clientSlug) return response.status(400).json({ error: 'clientSlug is required' })

  try {
    const authorization = String(request.headers.authorization || '')
    if (!authorization.startsWith('Bearer ')) return response.status(401).json({ error: 'Unauthorized' })

    const supabase = getSupabaseForRequest(authorization)
    const { data, error } = await supabase
      .from('client_social_streaks')
      .select('client_slug, current_streak, longest_streak, last_post_date, last_checked_date, last_status, platforms_posted, post_count')
      .eq('client_slug', clientSlug)
      .maybeSingle()

    if (error) return response.status(500).json({ error: error.message })
    if (!data) return response.status(404).json({ error: 'Social streak not found' })

    return response.status(200).json(data)
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
