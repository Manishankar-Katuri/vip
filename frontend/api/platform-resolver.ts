import { createClient } from '@supabase/supabase-js'

const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env || {}
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || ''
const internalToken = env.VIP_PLATFORM_RESOLVER_INTERNAL_TOKEN || ''

const allowedOperations = {
  facebook: new Set(['config_check', 'page_summary']),
  instagram: new Set(['config_check', 'profile_summary']),
  youtube: new Set(['config_check', 'channel_summary']),
} as const

type Platform = keyof typeof allowedOperations
type ResolverStatus = 'success' | 'partial_success' | 'skipped_missing_config' | 'failed'

type ResolverRequest = {
  client_slug?: unknown
  platform?: unknown
  operation?: unknown
  params?: unknown
}

type ClientConfig = {
  id: string
  client_slug: string
  facebook_page_id?: string | null
  facebook_page_access_token_env_key?: string | null
  instagram_business_id?: string | null
  instagram_access_token_env_key?: string | null
  youtube_channel_id?: string | null
  youtube_api_key_env_key?: string | null
}

type ApiRequest<T = Record<string, unknown>> = {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: T
}

type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => { json: (body: unknown) => unknown }
}

type ResolverResponse = {
  status: ResolverStatus
  client_slug: string
  platform: Platform
  operation: string
  credential: {
    configured: boolean
    resolved: boolean
    mechanism: 'backend_env_reference'
    status: 'configured' | 'missing_config' | 'missing_secret' | 'failed'
  }
  data: Record<string, unknown>
  metrics: Record<string, unknown>
  availability: {
    available_metrics: string[]
    unavailable_metrics: string[]
    permission_blocked_metrics: string[]
    deprecated_metrics: string[]
    empty_metrics: string[]
  }
  errors: Array<{ code: string; message: string }>
}

const emptyAvailability = {
  available_metrics: [],
  unavailable_metrics: [],
  permission_blocked_metrics: [],
  deprecated_metrics: [],
  empty_metrics: [],
}

export default async function handler(request: ApiRequest<ResolverRequest>, response: ApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAuthorized(request.headers)) {
    return response.status(401).json(sanitizeResponse({ error: 'Unauthorized' }))
  }

  const body = parseBody(request.body)
  const clientSlug = asSlug(body.client_slug)
  const platform = asPlatform(body.platform)
  const operation = asOperation(platform, body.operation)

  if (!clientSlug || !platform || !operation) {
    return response.status(400).json(sanitizeResponse({
      status: 'failed',
      error: 'client_slug, platform, and operation are required',
    }))
  }

  try {
    const client = await loadClientConfig(clientSlug)
    if (!client) {
      return response.status(404).json(sanitizeResponse(failure(clientSlug, platform, operation, 'client_not_found', 'Client is not configured for platform resolution.')))
    }

    const credential = resolveCredentialStatus(client, platform)
    if (!credential.sourceId) {
      return response.status(200).json(sanitizeResponse(failure(clientSlug, platform, operation, 'missing_source_id', `${platform} source ID is not configured.`, credential)))
    }
    if (!credential.envKey) {
      return response.status(200).json(sanitizeResponse(failure(clientSlug, platform, operation, 'missing_credential_reference', `${platform} credential reference is not configured.`, credential)))
    }
    if (!isAllowedEnvKey(platform, credential.envKey)) {
      return response.status(200).json(sanitizeResponse(failure(clientSlug, platform, operation, 'invalid_credential_reference', `${platform} credential reference is outside the allowed namespace.`, credential)))
    }
    if (!credential.present) {
      return response.status(200).json(sanitizeResponse(failure(clientSlug, platform, operation, 'missing_runtime_secret', `${platform} credential value is not available to the backend runtime.`, credential)))
    }

    if (operation === 'config_check') {
      return response.status(200).json(sanitizeResponse(success(clientSlug, platform, operation, credential, {
        source_id_configured: true,
      })))
    }

    return response.status(200).json(sanitizeResponse({
      ...failure(clientSlug, platform, operation, 'live_adapter_not_enabled', `${platform} live API adapter is not enabled yet; no live data was fabricated.`, credential),
      data: {
        source_id_configured: true,
        params: sanitizeParams(platform, operation, body.params),
      },
    }))
  } catch (error) {
    return response.status(500).json(sanitizeResponse(failure(clientSlug, platform, operation, 'resolver_error', sanitizeError(error))))
  }
}

function parseBody(body: ResolverRequest | string | undefined): ResolverRequest {
  if (!body) return {}
  if (typeof body !== 'string') return body
  try {
    const parsed = JSON.parse(body)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function isAuthorized(headers?: Record<string, string | string[] | undefined>) {
  if (!internalToken) return false
  const authorization = firstHeader(headers?.authorization)
  const workflowToken = firstHeader(headers?.['x-vip-workflow-token'])
  return authorization === `Bearer ${internalToken}` || workflowToken === internalToken
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function asSlug(value: unknown) {
  const slug = String(value || '').trim()
  return /^[a-z0-9][a-z0-9_-]{1,80}$/i.test(slug) ? slug : ''
}

function asPlatform(value: unknown): Platform | null {
  const platform = String(value || '').trim().toLowerCase()
  return platform in allowedOperations ? (platform as Platform) : null
}

function asOperation(platform: Platform | null, value: unknown) {
  if (!platform) return ''
  const operation = String(value || '').trim().toLowerCase()
  return allowedOperations[platform].has(operation) ? operation : ''
}

async function loadClientConfig(clientSlug: string): Promise<ClientConfig | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('clients')
    .select('id, client_slug, facebook_page_id, facebook_page_access_token_env_key, instagram_business_id, instagram_access_token_env_key, youtube_channel_id, youtube_api_key_env_key')
    .eq('client_slug', clientSlug)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as ClientConfig | null
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for platform resolver')
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

function resolveCredentialStatus(client: ClientConfig, platform: Platform) {
  const sourceId = platform === 'facebook' ? client.facebook_page_id : platform === 'instagram' ? client.instagram_business_id : client.youtube_channel_id
  const envKey = platform === 'facebook' ? client.facebook_page_access_token_env_key : platform === 'instagram' ? client.instagram_access_token_env_key : client.youtube_api_key_env_key
  return {
    envKey: envKey || '',
    sourceId: sourceId || '',
    present: Boolean(envKey && env[envKey]),
  }
}

function isAllowedEnvKey(platform: Platform, envKey: string) {
  const suffix = {
    facebook: 'FACEBOOK_PAGE_ACCESS_TOKEN',
    instagram: 'INSTAGRAM_ACCESS_TOKEN',
    youtube: 'YOUTUBE_API_KEY',
  }[platform]
  return new RegExp(`^VIP_[A-Z0-9_]+_${suffix}$`).test(envKey)
}

function sanitizeParams(platform: Platform, operation: string, params: unknown) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {}
  const input = params as Record<string, unknown>
  const allowList = allowedParamKeys(platform, operation)
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => allowList.has(key))
      .map(([key, value]) => [key, sanitizeParamValue(value)])
      .filter(([, value]) => value !== undefined),
  )
}

function allowedParamKeys(platform: Platform, operation: string) {
  if (operation === 'config_check') return new Set<string>()
  if (platform === 'youtube') return new Set(['date_range_start', 'date_range_end', 'max_results'])
  return new Set(['graph_api_version', 'date_range_start', 'date_range_end', 'metric_names'])
}

function sanitizeParamValue(value: unknown): string | number | boolean | string[] | undefined {
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').slice(0, 50).map((item) => item.slice(0, 120))
  return undefined
}

type CredentialStatus = ReturnType<typeof resolveCredentialStatus>

function success(clientSlug: string, platform: Platform, operation: string, credential: CredentialStatus, data: Record<string, unknown>): ResolverResponse {
  return {
    status: 'success',
    client_slug: clientSlug,
    platform,
    operation,
    credential: credentialResponse(credential, 'configured'),
    data,
    metrics: {},
    availability: { ...emptyAvailability },
    errors: [],
  }
}

function failure(clientSlug: string, platform: Platform, operation: string, code: string, message: string, credential?: CredentialStatus): ResolverResponse {
  return {
    status: failureStatus(code),
    client_slug: clientSlug,
    platform,
    operation,
    credential: credentialResponse(credential, credentialFailureStatus(code)),
    data: {},
    metrics: {},
    availability: { ...emptyAvailability },
    errors: [{ code, message }],
  }
}

function failureStatus(code: string): ResolverStatus {
  if (['missing_runtime_secret', 'invalid_credential_reference', 'resolver_error'].includes(code)) return 'failed'
  return 'skipped_missing_config'
}

function credentialFailureStatus(code: string): ResolverResponse['credential']['status'] {
  if (code === 'missing_runtime_secret') return 'missing_secret'
  if (code === 'missing_credential_reference' || code === 'missing_source_id') return 'missing_config'
  return 'failed'
}

function credentialResponse(credential: CredentialStatus | undefined, status: ResolverResponse['credential']['status']): ResolverResponse['credential'] {
  return {
    configured: Boolean(credential?.envKey),
    resolved: Boolean(credential?.present),
    mechanism: 'backend_env_reference',
    status,
  }
}

function sanitizeResponse(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeResponse)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => isAllowedResponseKey(key))
      .map(([key, item]) => [key, sanitizeResponse(item)]),
  )
}

function isAllowedResponseKey(key: string) {
  const normalized = key.toLowerCase()
  if (normalized.endsWith('_env_key')) return true
  return !/(token|api_key|authorization|secret)/i.test(normalized)
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown resolver error'
  return message.replace(/(token|secret|api[_-]?key|password|authorization|bearer)[^,\s]*/gi, '[redacted]').slice(0, 300)
}
