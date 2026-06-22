import { workflow, node, trigger, sticky, newCredential, ifElse, switchCase, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger - Test Individual Engine', position: [120, 260] },
  output: [{ client_id: 'client_slug_here', engine: 'facebook_intelligence', mode: 'manual' }]
});

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Daily Schedule Trigger - 8 AM Asia/Kolkata',
    position: [120, 520],
    parameters: {
      rule: {
        interval: [{ field: 'cronExpression', expression: '0 0 8 * * *' }]
      }
    }
  },
  output: [{}]
});

const runtimeConfig = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'runtime_config',
    position: [420, 390],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const input = $json.body ?? $json ?? {};
const now = $now.setZone('Asia/Kolkata');
const runDate = now.toISODate();
const today = now.toISODate();
const yesterday = now.minus({ days: 1 }).toISODate();
const last7Days = now.minus({ days: 7 }).toISODate();
const requestedEngine = input.engine || 'facebook_intelligence';
const requestedClient = input.client_id || input.client_slug || '';
return {
  json: {
    run_date: runDate,
    timezone: 'Asia/Kolkata',
    default_engine: 'facebook_intelligence',
    graph_api_version: input.graph_api_version || 'v23.0',
    date_range_start: last7Days,
    page_metric_since: yesterday,
    date_range_end: today,
    mode: input.mode || (requestedClient ? 'manual' : 'scheduled'),
    engine: requestedEngine,
    client_slug: requestedClient
  }
};`
    }
  },
  output: [{
    run_date: '2026-06-15',
    timezone: 'Asia/Kolkata',
    default_engine: 'facebook_intelligence',
    graph_api_version: 'v23.0',
    date_range_start: '2026-06-08',
    page_metric_since: '2026-06-14',
    date_range_end: '2026-06-15',
    mode: 'manual',
    engine: 'facebook_intelligence',
    client_slug: 'client_slug_here'
  }]
});

const loadClients = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Client Loader - Load Manual Client Or Active Clients',
    position: [720, 390],
    parameters: {
      operation: 'executeQuery',
      query: "select id, client_slug, client_name, industry, location, facebook_page_id, facebook_page_access_token_env_key, instagram_business_id, instagram_access_token_env_key, youtube_channel_id, youtube_api_key_env_key, google_business_profile_account_id, google_business_profile_location_id, google_business_profile_place_id, google_business_profile_url, google_business_profile_enabled, coalesce(google_business_profile_credential_env_key, google_business_profile_credential_ref) as google_business_profile_credential_env_key, website_url, primary_domain, sitemap_url, robots_txt_url, target_locations, service_keywords, priority_services, seo_enabled, website_audit_enabled, competitor_names, competitor_websites, competitor_google_business_urls, competitor_instagram_handles, competitor_facebook_pages, competitor_youtube_channels, competitor_enabled, review_platforms, review_response_policy, reputation_enabled, active_offers, seasonal_campaigns, campaign_goals, campaign_enabled, engine_cadence_config, daily_automation_enabled, active from clients where active = true and ($1 = '' or client_slug = $1 or id::text = $1) order by client_slug;",
      options: {
        queryReplacement: expr('{{ $("runtime_config").item.json.client_slug || "" }}'),
        largeNumbersOutput: 'numbers'
      }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{
    id: '00000000-0000-0000-0000-000000000001',
    client_slug: 'client_slug_here',
    client_name: 'Client Name',
    industry: 'Healthcare',
    location: 'Hyderabad',
    facebook_page_id: '123456789',
    facebook_page_access_token_env_key: 'META_PAGE_TOKEN_CLIENT_SLUG',
    website_url: 'https://example.com',
    seo_enabled: true,
    website_audit_enabled: true,
    competitor_enabled: false,
    active: true
  }]
});

const prepareEngineItem = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare Engine Item',
    position: [1020, 390],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const runtime = $('runtime_config').item.json;
return {
  json: {
    ...$json,
    engine: runtime.engine || runtime.default_engine,
    mode: runtime.mode,
    run_date: runtime.run_date,
    timezone: runtime.timezone,
    graph_api_version: runtime.graph_api_version,
    date_range_start: runtime.date_range_start,
    page_metric_since: runtime.page_metric_since,
    date_range_end: runtime.date_range_end
  }
};`
    }
  },
  output: [{
    id: '00000000-0000-0000-0000-000000000001',
    client_slug: 'client_slug_here',
    client_name: 'Client Name',
    engine: 'facebook_intelligence',
    mode: 'manual',
    graph_api_version: 'v23.0'
  }]
});

const engineRouter = switchCase({
  version: 3.4,
  config: {
    name: 'Engine Router',
    position: [1320, 390],
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          { outputKey: 'facebook_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'facebook_intelligence' }], combinator: 'and' } },
          { outputKey: 'instagram_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'instagram_intelligence' }], combinator: 'and' } },
          { outputKey: 'content_performance', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'content_performance' }], combinator: 'and' } },
          { outputKey: 'trends_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'trends_intelligence' }], combinator: 'and' } },
          { outputKey: 'demographics_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'demographics_intelligence' }], combinator: 'and' } },
          { outputKey: 'competitor_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'competitor_intelligence' }], combinator: 'and' } },
          { outputKey: 'google_business_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'google_business_intelligence' }], combinator: 'and' } },
          { outputKey: 'review_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'review_intelligence' }], combinator: 'and' } },
          { outputKey: 'website_audit_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'website_audit_intelligence' }], combinator: 'and' } },
          { outputKey: 'seo_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'seo_intelligence' }], combinator: 'and' } },
          { outputKey: 'local_seo_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'local_seo_intelligence' }], combinator: 'and' } },
          { outputKey: 'keyword_opportunity_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'keyword_opportunity_intelligence' }], combinator: 'and' } },
          { outputKey: 'content_gap_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'content_gap_intelligence' }], combinator: 'and' } },
          { outputKey: 'landing_page_conversion_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'landing_page_conversion_intelligence' }], combinator: 'and' } },
          { outputKey: 'campaign_offer_intelligence', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'campaign_offer_intelligence' }], combinator: 'and' } },
          { outputKey: 'digital_marketing_strategy', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'digital_marketing_strategy' }], combinator: 'and' } },
          { outputKey: 'social_media_strategy', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'social_media_strategy' }], combinator: 'and' } },
          { outputKey: 'content_calendar_strategy', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'content_calendar_strategy' }], combinator: 'and' } },
          { outputKey: 'campaign_strategy', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'campaign_strategy' }], combinator: 'and' } },
          { outputKey: 'business_growth_strategy', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.engine }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'business_growth_strategy' }], combinator: 'and' } }
        ]
      },
      options: { fallbackOutput: 'none' }
    }
  }
});

const createEngineRun = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Create engine_runs Running Row',
    position: [1620, 160],
    parameters: {
      operation: 'executeQuery',
      query: expr("insert into engine_runs (client_id, engine_name, mode, status, metadata) values ('{{ $json.id }}'::uuid, 'facebook_intelligence', '{{ $json.mode }}', 'running', jsonb_build_object('client_slug', '{{ $json.client_slug }}', 'graph_api_version', '{{ $json.graph_api_version }}')) returning id as engine_run_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ engine_run_id: '11111111-1111-1111-1111-111111111111' }]
});

const validateFacebookConfig = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Validate Required Client Config',
    position: [1920, 160],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const client = $('Prepare Engine Item').item.json;
const missing = [];
if (!client.facebook_page_id) missing.push('facebook_page_id');
if (!client.facebook_page_access_token_env_key) missing.push('facebook_page_access_token_env_key');
const facebook_credential_resolution = {
  env_key: client.facebook_page_access_token_env_key || null,
  configured: Boolean(client.facebook_page_access_token_env_key),
  present: null,
  resolved: false,
  status: client.facebook_page_access_token_env_key ? 'n8n_credential_required' : 'missing_reference',
  mechanism: 'n8n_credential_object_or_external_resolver_required'
};
if (client.facebook_page_access_token_env_key) missing.push('credential:' + client.facebook_page_access_token_env_key + ':' + facebook_credential_resolution.status);
return {
  json: {
    ...client,
    engine_run_id: $json.engine_run_id,
    facebook_config_valid: false,
    missing_config: missing,
    error_message: missing.length ? 'Facebook credential requires n8n credential object or external resolver: ' + missing.join(', ') : 'Facebook credential resolver is not configured.',
    facebook_token_source: client.facebook_page_access_token_env_key ? 'credential_ref:' + client.facebook_page_access_token_env_key : null,
    facebook_credential_resolution
  }
};`
    }
  },
  output: [{ facebook_config_valid: true, engine_run_id: '11111111-1111-1111-1111-111111111111', client_slug: 'client_slug_here', facebook_token_source: 'env:META_PAGE_TOKEN_CLIENT_SLUG' }]
});

const facebookConfigValid = ifElse({
  version: 2.3,
  config: {
    name: 'Facebook - Config Valid?',
    position: [2820, 160],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.facebook_config_valid }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: true }],
        combinator: 'and'
      }
    }
  }
});

const facebookResolverConfigCheck = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Facebook - Resolver Config Check',
    position: [2220, 160],
    parameters: {
      method: 'POST',
      url: expr('{{ $env.VIP_PLATFORM_RESOLVER_URL || "https://example.invalid/api/platform-resolver" }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ { client_slug: $json.client_slug, platform: "facebook", operation: "config_check", params: { graph_api_version: $json.graph_api_version } } }}'),
      options: {
        timeout: 15000,
        response: {
          response: {
            neverError: true,
            responseFormat: 'json'
          }
        }
      }
    },
    credentials: { httpHeaderAuth: newCredential('VIP Platform Resolver Internal Token') }
  },
  output: [{ status: 'skipped_missing_config', client_slug: 'client_slug_here', platform: 'facebook', operation: 'config_check', data: {}, metrics: {}, availability: { available_metrics: [], unavailable_metrics: [], permission_blocked_metrics: [], deprecated_metrics: [], empty_metrics: [] }, errors: [] }]
});

const applyFacebookResolverValidation = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Apply Resolver Validation',
    position: [2520, 160],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const client = $('Facebook - Validate Required Client Config').item.json;
const resolver = $json || {};
const resolverOk = resolver.status === 'success';
const missing = [...(client.missing_config || [])];
if (!resolverOk) {
  const code = resolver.errors?.[0]?.code || 'platform_resolver_unavailable';
  missing.push('resolver:facebook:' + code);
}
const facebook_credential_resolution = {
  ...(client.facebook_credential_resolution || {}),
  resolved: resolverOk,
  status: resolverOk ? 'resolved_by_platform_resolver' : 'platform_resolver_required',
  mechanism: 'external_platform_resolver',
  resolver_status: resolver.status || 'unavailable'
};
return {
  json: {
    ...client,
    facebook_config_valid: false,
    platform_resolver_configured: resolverOk,
    missing_config: missing,
    error_message: resolverOk
      ? 'Facebook platform resolver credential check passed, but live resolver fetch is not enabled in n8n yet.'
      : 'Facebook platform resolver failed closed: ' + missing.join(', '),
    facebook_token_source: client.facebook_page_access_token_env_key ? 'credential_ref:' + client.facebook_page_access_token_env_key : null,
    facebook_credential_resolution,
    platform_resolver_response: {
      status: resolver.status || 'unavailable',
      platform: resolver.platform || 'facebook',
      operation: resolver.operation || 'config_check',
      availability: resolver.availability || null,
      errors: resolver.errors || []
    }
  }
};`
    }
  },
  output: [{ facebook_config_valid: false, platform_resolver_configured: false, engine_run_id: '11111111-1111-1111-1111-111111111111', client_slug: 'client_slug_here' }]
});

const facebookMetricRegistry = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'facebook_metric_registry',
    position: [2520, 40],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'page_metric_names', name: 'page_metric_names', value: expr('{{ ["page_post_engagements","page_actions_post_reactions_total","page_views_total","page_follows","page_follows_unique","page_fans"] }}'), type: 'array' },
          { id: 'post_metric_names', name: 'post_metric_names', value: expr('{{ ["post_impressions","post_impressions_unique","post_engaged_users","post_clicks","post_reactions_like_total","post_reactions_love_total","post_reactions_wow_total","post_reactions_haha_total","post_reactions_sorry_total","post_reactions_anger_total"] }}'), type: 'array' }
        ]
      }
    }
  },
  output: [{ page_metric_names: ['page_post_engagements'], post_metric_names: ['post_impressions'] }]
});

const collectFacebookGraphData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Collect Graph API Data',
    position: [2820, 40],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const item = $json;
return {
  json: {
    ...item,
    facebook_api_results: {
      page_profile: { ok: false, label: 'page_profile', error_category: 'credential_resolver_not_configured' },
      page_metrics: [],
      recent_posts: { ok: false, label: 'recent_posts', error_category: 'credential_resolver_not_configured' },
      posts: [],
      post_insights: [],
      credential_resolution: item.facebook_credential_resolution || null,
    }
  }
};`
    }
  },
  output: [{ facebook_api_results: { posts: [] } }]
});

const normalizeFacebookData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Normalize Data And Calculate Metrics',
    position: [3120, 40],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const data = $json.facebook_api_results || {};
const posts = data.posts || [];
const reactions = (post) => Number(post.reactions?.summary?.total_count || 0);
const comments = (post) => Number(post.comments?.summary?.total_count || 0);
const shares = (post) => Number(post.shares?.count || 0);
const engagement = (post) => reactions(post) + comments(post) + shares(post);
const sortBy = (fn) => [...posts].sort((a, b) => fn(b) - fn(a));
const contentTypeBreakdown = {};
for (const post of posts) {
  const type = post.status_type || post.attachments?.data?.[0]?.media_type || 'unknown';
  contentTypeBreakdown[type] = (contentTypeBreakdown[type] || 0) + 1;
}
const sevenDaysAgo = DateTime.fromISO($json.date_range_end, { zone: $json.timezone }).minus({ days: 7 });
const postsLast7 = posts.filter((post) => post.created_time && DateTime.fromISO(post.created_time).toMillis() >= sevenDaysAgo.toMillis()).length;
const totalReactions = posts.reduce((sum, post) => sum + reactions(post), 0);
const totalComments = posts.reduce((sum, post) => sum + comments(post), 0);
const totalShares = posts.reduce((sum, post) => sum + shares(post), 0);
const metricErrors = [];
const metricAvailability = {
  available_metrics: [],
  unavailable_metrics: [],
  permission_blocked_metrics: [],
  deprecated_metrics: [],
  empty_metrics: []
};
function classifyMetricResult(result) {
  const metric = result.metric || result.label || 'unknown_metric';
  if (result.ok) {
    const values = result.data?.data?.[0]?.values || [];
    if (values.length === 0) metricAvailability.empty_metrics.push(metric);
    else metricAvailability.available_metrics.push(metric);
    return;
  }
  const text = [
    result.error || '',
    JSON.stringify(result.response || {})
  ].join(' ').toLowerCase();
  if (text.includes('permission') || text.includes('access') || text.includes('oauth') || text.includes('token')) {
    metricAvailability.permission_blocked_metrics.push(metric);
  } else if (text.includes('deprecated') || text.includes('unknown metric') || text.includes('not found') || text.includes('unsupported get request')) {
    metricAvailability.deprecated_metrics.push(metric);
  } else {
    metricAvailability.unavailable_metrics.push(metric);
  }
}
for (const result of [data.page_profile, data.recent_posts, ...(data.page_metrics || [])]) {
  if (!result) continue;
  if (result.metric || String(result.label || '').includes('metric:')) classifyMetricResult(result);
  if (result.ok === false) metricErrors.push({ label: result.label, metric: result.metric || null, classification: result.metric ? Object.entries(metricAvailability).find(([, values]) => values.includes(result.metric))?.[0] || 'unavailable_metrics' : 'request_failed', error: result.error || 'Unknown API error' });
}
for (const postInsight of data.post_insights || []) {
  for (const result of postInsight.metrics || []) {
    if (!result) continue;
    classifyMetricResult(result);
    if (result.ok === false) metricErrors.push({ label: result.label, post_id: postInsight.post_id, metric: result.metric || null, classification: Object.entries(metricAvailability).find(([, values]) => values.includes(result.metric))?.[0] || 'unavailable_metrics', error: result.error || 'Unknown API error' });
  }
}
for (const key of Object.keys(metricAvailability)) {
  metricAvailability[key] = [...new Set(metricAvailability[key])];
}
const calculated = {
  total_posts_analyzed: posts.length,
  total_reactions: totalReactions,
  total_comments: totalComments,
  total_shares: totalShares,
  engagement_by_post: posts.map((post) => ({ post_id: post.id, created_time: post.created_time, permalink_url: post.permalink_url, engagement: engagement(post), reactions: reactions(post), comments: comments(post), shares: shares(post) })),
  best_post_by_reactions: sortBy(reactions)[0] || null,
  best_post_by_comments: sortBy(comments)[0] || null,
  best_post_by_shares: sortBy(shares)[0] || null,
  top_5_posts: sortBy(engagement).slice(0, 5).map((post) => ({ post_id: post.id, message: post.message || '', permalink_url: post.permalink_url, engagement: engagement(post), reactions: reactions(post), comments: comments(post), shares: shares(post) })),
  posting_frequency_last_7_days: postsLast7,
  average_engagement_per_post: posts.length ? Number(((totalReactions + totalComments + totalShares) / posts.length).toFixed(2)) : 0,
  content_type_breakdown: contentTypeBreakdown,
  posts_without_message: posts.filter((post) => !post.message).length,
  posts_with_images: posts.filter((post) => post.full_picture || post.attachments?.data?.some((a) => a.media_type === 'photo')).length,
  posts_with_links: posts.filter((post) => (post.message || '').includes('http') || post.attachments?.data?.some((a) => a.url)).length
};
const recentContent = posts.map((post) => ({
  id: post.id,
  message_preview: (post.message || '').slice(0, 180),
  created_time: post.created_time,
  permalink_url: post.permalink_url,
  full_picture: post.full_picture || null,
  thumbnail: post.full_picture || null,
  status_type: post.status_type || post.attachments?.data?.[0]?.media_type || 'unknown',
  reactions: reactions(post),
  comments: comments(post),
  shares: shares(post),
  interactions: engagement(post),
}));
const targetPostDate = DateTime.fromISO($json.date_range_end, { zone: $json.timezone || 'Asia/Kolkata' }).minus({ days: 1 }).toISODate();
const previousDayPosts = recentContent.filter((post) => {
  if (!post.created_time) return false;
  return DateTime.fromISO(post.created_time).setZone($json.timezone || 'Asia/Kolkata').toISODate() === targetPostDate;
});
const socialStreakUpdate = {
  client_slug: $json.client_slug,
  scan_date: $json.run_date,
  target_post_date: targetPostDate,
  posted_yesterday: previousDayPosts.length > 0,
  platforms_posted: previousDayPosts.length ? ['facebook'] : [],
  post_count: previousDayPosts.length,
  scan_status: metricErrors.length ? 'unknown' : 'success',
};
const contentTypeRows = Object.entries(contentTypeBreakdown).map(([type, count]) => ({ type, count }));
const analyticsSnapshot = {
  profile_metrics: {
    page_id: data.page_profile?.data?.id || null,
    page_name: data.page_profile?.data?.name || null,
    page_fans: Number(data.page_profile?.data?.fan_count || 0),
    followers_count: Number(data.page_profile?.data?.followers_count || 0),
  },
  audience_metrics: {
    page_fans: Number(data.page_profile?.data?.fan_count || 0),
    followers_count: Number(data.page_profile?.data?.followers_count || 0),
  },
  engagement_metrics: {
    reactions: totalReactions,
    comments: totalComments,
    shares: totalShares,
    interactions: totalReactions + totalComments + totalShares,
    average_engagement_per_post: calculated.average_engagement_per_post,
  },
  reach_view_metrics: {},
  content_type_breakdown: contentTypeRows,
  follower_breakdown: {},
  top_content: recentContent.slice().sort((a, b) => b.interactions - a.interactions).slice(0, 10),
  recent_content: recentContent,
  metric_errors: metricErrors,
  metric_availability: metricAvailability,
};
const metricRows = [
  ['total_posts_analyzed', calculated.total_posts_analyzed, {}],
  ['total_reactions', calculated.total_reactions, {}],
  ['total_comments', calculated.total_comments, {}],
  ['total_shares', calculated.total_shares, {}],
  ['posting_frequency_last_7_days', calculated.posting_frequency_last_7_days, {}],
  ['average_engagement_per_post', calculated.average_engagement_per_post, {}],
  ['posts_without_message', calculated.posts_without_message, {}],
  ['posts_with_images', calculated.posts_with_images, {}],
  ['posts_with_links', calculated.posts_with_links, {}],
];
for (const [contentType, count] of Object.entries(contentTypeBreakdown)) {
  metricRows.push(['content_type_count', count, { content_type: contentType }]);
}
for (const pageMetric of data.page_metrics || []) {
  const values = pageMetric.data?.data?.[0]?.values || [];
  let pageMetricTotal = 0;
  for (const value of values) {
    const rawValue = typeof value.value === 'object' ? Object.values(value.value).reduce((a, b) => Number(a) + Number(b || 0), 0) : value.value;
    pageMetricTotal += Number(rawValue || 0);
    metricRows.push([pageMetric.metric, Number(rawValue || 0), { source: 'page_insights', end_time: value.end_time || null, ok: pageMetric.ok }]);
  }
  if (pageMetricTotal) analyticsSnapshot.reach_view_metrics[pageMetric.metric] = pageMetricTotal;
}
const normalizedMetrics = metricRows.map(([metric_name, metric_value, dimensions]) => ({
  metric_date: $json.run_date,
  metric_name,
  metric_value,
  dimensions
}));
return {
  json: {
    ...$json,
    page_profile: data.page_profile?.data || null,
    page_metrics: data.page_metrics || [],
    posts,
    post_metrics: data.post_insights || [],
    calculated_metrics: calculated,
    social_streak_update: socialStreakUpdate,
    analytics_snapshot: analyticsSnapshot,
    normalized_metrics: normalizedMetrics,
    raw_payload: {
      page_profile: data.page_profile,
      page_metrics: data.page_metrics,
      recent_posts: data.recent_posts,
      posts,
      post_insights: data.post_insights,
      calculated_metrics: calculated,
      metric_availability: metricAvailability,
      metric_registry: {
        page_metric_names: $json.page_metric_names,
        post_metric_names: $json.post_metric_names
      }
    }
  }
};`
    }
  },
  output: [{ calculated_metrics: { total_posts_analyzed: 25 }, normalized_metrics: [] }]
});

const storeRawData = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Store raw_engine_data',
    position: [3420, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("insert into raw_engine_data (client_id, engine_name, source_platform, date_range_start, date_range_end, raw_payload) values ('{{ $json.id }}'::uuid, 'facebook_intelligence', 'facebook', '{{ $json.date_range_start }}'::date, '{{ $json.date_range_end }}'::date, $$ {{ JSON.stringify($json.raw_payload).replace(/\\$\\$/g, '') }} $$::jsonb) returning id as raw_reference_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ raw_reference_id: '22222222-2222-2222-2222-222222222222' }]
});

const storeNormalizedMetrics = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Store normalized_metrics',
    position: [3720, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("with metric_rows as (select * from jsonb_to_recordset($$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.normalized_metrics).replace(/\\$\\$/g, '') }} $$::jsonb) as x(metric_date date, metric_name text, metric_value numeric, dimensions jsonb)), inserted as (insert into normalized_metrics (client_id, engine_name, source_platform, metric_date, metric_name, metric_value, dimensions, raw_reference_id) select '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.id }}'::uuid, 'facebook_intelligence', 'facebook', metric_date, metric_name, metric_value, coalesce(dimensions, '{}'::jsonb), '{{ $json.raw_reference_id }}'::uuid from metric_rows returning id) select count(*)::int as metrics_saved from inserted;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ metrics_saved: 12 }]
});

const storeFacebookAnalyticsSnapshot = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Store social_analytics_snapshots',
    position: [4020, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("insert into social_analytics_snapshots (client_id, engine_run_id, platform, date_range_start, date_range_end, snapshot_date, profile_metrics, audience_metrics, engagement_metrics, reach_view_metrics, content_type_breakdown, follower_breakdown, top_content, recent_content, metric_errors, source_engine) values ('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.id }}'::uuid, '{{ $('Facebook - Validate Required Client Config').item.json.engine_run_id }}'::uuid, 'facebook', '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.date_range_start }}'::date, '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.date_range_end }}'::date, '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.run_date }}'::date, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.profile_metrics).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.audience_metrics).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.engagement_metrics).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.reach_view_metrics).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.content_type_breakdown).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.follower_breakdown).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.top_content).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.recent_content).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.metric_errors).replace(/\\$\\$/g, '') }} $$::jsonb, 'facebook_intelligence') returning id as social_analytics_snapshot_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ social_analytics_snapshot_id: '44444444-4444-4444-4444-444444444444' }]
});

const updateFacebookSocialStreak = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Update client_social_streaks',
    position: [4170, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("select * from update_client_social_streak('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.client_slug }}', '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.scan_date }}'::date, '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.target_post_date }}'::date, {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.posted_yesterday }}, $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.platforms_posted).replace(/\\$\\$/g, '') }} $$::jsonb, {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.post_count }}, '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.social_streak_update.scan_status }}');"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ current_streak: 1, longest_streak: 1, last_status: 'continued' }]
});

const queryHistoricalComparison = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Query Historical Comparison',
    position: [4320, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("select coalesce((select jsonb_agg(row_to_json(io)) from (select report_date, summary, key_insights, recommendations, confidence_score from intelligence_outputs where client_id = '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.id }}'::uuid and engine_name = 'facebook_intelligence' and report_date between ('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.run_date }}'::date - interval '30 days') and ('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.run_date }}'::date - interval '1 day') order by report_date desc limit 5) io), '[]'::jsonb) as previous_outputs, coalesce((select jsonb_agg(row_to_json(nm)) from (select metric_date, metric_name, metric_value, dimensions from normalized_metrics where client_id = '{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.id }}'::uuid and engine_name = 'facebook_intelligence' and metric_date between ('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.run_date }}'::date - interval '30 days') and ('{{ $('Facebook - Normalize Data And Calculate Metrics').item.json.run_date }}'::date - interval '1 day') order by metric_date desc limit 200) nm), '[]'::jsonb) as previous_metrics;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ previous_outputs: [], previous_metrics: [] }]
});

const prepareAiPrompt = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Prepare AI Intelligence Prompt',
    position: [4320, 40],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const normalized = $('Facebook - Normalize Data And Calculate Metrics').item.json;
const historical = $json;
const payload = {
  client_profile: {
    client_slug: normalized.client_slug,
    client_name: normalized.client_name,
    industry: normalized.industry,
    location: normalized.location
  },
  page_profile: normalized.page_profile,
  page_metrics: normalized.page_metrics,
  recent_posts: normalized.posts,
  post_insights: normalized.post_metrics,
  calculated_metrics: normalized.calculated_metrics,
  previous_historical_metrics: historical
};
return {
  json: {
    ...normalized,
    metrics_saved: $('Facebook - Store normalized_metrics').item.json.metrics_saved,
    previous_historical_metrics: historical,
    ai_user_prompt: 'Analyze the following Facebook data for the client and return strict JSON only.\\n' + JSON.stringify(payload)
  }
};`
    }
  },
  output: [{ ai_user_prompt: 'Analyze the following Facebook data for the client and return strict JSON only.' }]
});

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Chat Model - VIP Intelligence',
    position: [4560, 300],
    parameters: {
      model: { __rl: true, mode: 'list', value: 'gpt-5-mini', cachedResultName: 'gpt-5-mini' },
      responsesApiEnabled: true,
      options: {
        temperature: 0.2,
        reasoningEffort: 'low',
        maxRetries: 2,
        timeout: 60000,
        textFormat: { textOptions: [{ type: 'json_object', verbosity: 'low' }] }
      }
    },
    credentials: { openAiApi: newCredential('OpenAI account') }
  }
});

const structuredParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: {
    name: 'Facebook Intelligence JSON Output Parser',
    position: [4860, 300],
    parameters: {
      schemaType: 'fromJson',
      jsonSchemaExample: '{ "summary": "short executive summary", "key_insights": ["insight 1"], "recommendations": ["recommendation 1"], "next_actions": ["action 1"], "confidence_score": 0.75 }',
      autoFix: true
    },
    subnodes: { model: openAiModel }
  }
});

const aiSummary = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Facebook - AI Intelligence Summary',
    position: [4620, 40],
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.ai_user_prompt }}'),
      hasOutputParser: true,
      options: {
        systemMessage: 'You are the VIP Facebook Intelligence Engine for healthcare and local business clients. Analyze Facebook page analytics, post performance, historical comparison, and content signals. Be practical, business-focused, and avoid unsupported claims. If data is missing, say so clearly. Return only valid JSON.',
        maxIterations: 2,
        returnIntermediateSteps: false
      }
    },
    subnodes: { model: openAiModel, outputParser: structuredParser }
  },
  output: [{ summary: 'Executive summary', key_insights: [], recommendations: [], next_actions: [], confidence_score: 0.75 }]
});

const storeAiOutput = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Store intelligence_outputs',
    position: [4920, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("insert into intelligence_outputs (client_id, engine_name, source_platform, report_date, summary, key_insights, recommendations, next_actions, confidence_score, input_sources) values ('{{ $('Facebook - Prepare AI Intelligence Prompt').item.json.id }}'::uuid, 'facebook_intelligence', 'facebook', '{{ $('Facebook - Prepare AI Intelligence Prompt').item.json.run_date }}'::date, $$ {{ ($json.summary || $json.output?.summary || '').replace(/\\$\\$/g, '') }} $$, $$ {{ JSON.stringify($json.key_insights || $json.output?.key_insights || []).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($json.recommendations || $json.output?.recommendations || []).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($json.next_actions || $json.output?.next_actions || []).replace(/\\$\\$/g, '') }} $$::jsonb, {{ Number($json.confidence_score || $json.output?.confidence_score || 0) }}, jsonb_build_object('raw_reference_id', '{{ $('Facebook - Store raw_engine_data').item.json.raw_reference_id }}', 'metrics_saved', {{ $('Facebook - Store normalized_metrics').item.json.metrics_saved }})) returning id as intelligence_output_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ intelligence_output_id: '33333333-3333-3333-3333-333333333333' }]
});

const storeFacebookAnalyticsSummary = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Store social_analytics_daily_summaries',
    position: [5220, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("insert into social_analytics_daily_summaries (client_id, platform, summary_date, comparison_label, what_changed, follower_summary, engagement_summary, views_reach_summary, top_content_summary, recommendations, source_snapshot_ids) values ('{{ $('Facebook - Prepare AI Intelligence Prompt').item.json.id }}'::uuid, 'facebook', '{{ $('Facebook - Prepare AI Intelligence Prompt').item.json.run_date }}'::date, 'latest vs previous run', $$ {{ JSON.stringify($json.key_insights || $json.output?.key_insights || []).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ ($json.summary || $json.output?.summary || 'Follower movement is shown when Meta returns page fan/follower metrics.').replace(/\\$\\$/g, '') }} $$, $$ {{ ($json.summary || $json.output?.summary || 'Interactions are based on reactions, comments, and shares from recent posts.').replace(/\\$\\$/g, '') }} $$, $$ {{ ($json.summary || $json.output?.summary || 'Views and reach are shown when Meta Insights grants those metrics.').replace(/\\$\\$/g, '') }} $$, $$ {{ (($json.output?.top_content_summary || $json.top_content_summary || 'Top posts are sorted by reactions, comments, and shares.')).replace(/\\$\\$/g, '') }} $$, $$ {{ JSON.stringify($json.recommendations || $json.output?.recommendations || []).replace(/\\$\\$/g, '') }} $$::jsonb, jsonb_build_array('{{ $('Facebook - Store social_analytics_snapshots').item.json.social_analytics_snapshot_id }}')) returning id as social_analytics_summary_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ social_analytics_summary_id: '55555555-5555-5555-5555-555555555555' }]
});

const updateEngineRunSuccess = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Update engine_runs Success',
    position: [5520, 40],
    parameters: {
      operation: 'executeQuery',
      query: expr("update engine_runs set status = 'success', completed_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('posts_analyzed', {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.calculated_metrics.total_posts_analyzed }}, 'metrics_saved', {{ $('Facebook - Store normalized_metrics').item.json.metrics_saved }}, 'metric_errors_count', {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.metric_errors.length }}, 'metric_availability', $$ {{ JSON.stringify($('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.metric_availability).replace(/\\$\\$/g, '') }} $$::jsonb, 'analytics_snapshot_id', '{{ $('Facebook - Store social_analytics_snapshots').item.json.social_analytics_snapshot_id }}', 'analytics_summary_id', '{{ $('Facebook - Store social_analytics_daily_summaries').item.json.social_analytics_summary_id }}', 'insights_generated', true, 'intelligence_output_id', '{{ $('Facebook - Store intelligence_outputs').item.json.intelligence_output_id }}') where id = '{{ $('Facebook - Validate Required Client Config').item.json.engine_run_id }}'::uuid returning status;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ status: 'success' }]
});

const finalFacebookResponse = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Final Test JSON Response',
    position: [5520, 40],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const prepared = $('Facebook - Prepare AI Intelligence Prompt').item.json;
const ai = $('Facebook - AI Intelligence Summary').item.json;
const output = ai.output || ai;
return {
  json: {
    client_id: prepared.client_slug,
    engine: 'facebook_intelligence',
    status: 'success',
    summary: output.summary || '',
    key_insights: output.key_insights || [],
    recommendations: output.recommendations || [],
    next_actions: output.next_actions || []
  }
};`
    }
  },
  output: [{ client_id: 'client_slug_here', engine: 'facebook_intelligence', status: 'success', summary: '...', key_insights: [], recommendations: [], next_actions: [] }]
});

const updateEngineRunConfigFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Update engine_runs Config Failure',
    position: [2520, 260],
    parameters: {
      operation: 'executeQuery',
      query: expr("update engine_runs set status = 'failed', completed_at = now(), error_message = $$ {{ $json.error_message.replace(/\\$\\$/g, '') }} $$, metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('failed_context', 'facebook_config_validation', 'missing_config', $$ {{ JSON.stringify($json.missing_config).replace(/\\$\\$/g, '') }} $$::jsonb) where id = '{{ $json.engine_run_id }}'::uuid returning status, error_message;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ status: 'failed', error_message: 'Missing required Facebook config' }]
});

const updateFacebookSocialStreakFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Facebook - Mark social streak scan_failed',
    position: [2670, 260],
    parameters: {
      operation: 'executeQuery',
      query: expr("select * from update_client_social_streak('{{ $('Facebook - Apply Resolver Validation').item.json.client_slug }}', '{{ $('Facebook - Apply Resolver Validation').item.json.run_date }}'::date, ('{{ $('Facebook - Apply Resolver Validation').item.json.date_range_end }}'::date - interval '1 day')::date, false, '[]'::jsonb, 0, 'scan_failed');"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ last_status: 'scan_failed' }]
});

const finalConfigFailureResponse = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Facebook - Final Config Failure JSON Response',
    position: [2820, 260],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const client = $('Facebook - Apply Resolver Validation').item.json;
return {
  json: {
    client_id: client.client_slug,
    engine: 'facebook_intelligence',
    status: 'failed',
    summary: client.error_message,
    key_insights: [],
    recommendations: [],
    next_actions: ['Configure the secure platform resolver endpoint and n8n internal header credential before enabling Facebook live collection.'],
    missing_config: client.missing_config || [],
    platform_resolver: client.platform_resolver_response || null
  }
};`
    }
  },
  output: [{ client_id: 'client_slug_here', engine: 'facebook_intelligence', status: 'failed' }]
});

const guardedDigitalPresenceEngine = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Digital Presence - Guarded Live/Public Data Engine',
    position: [1620, 760],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const client = $json;
const engine = client.engine;
const sourceByEngine = {
  google_business_intelligence: 'google_business_profile',
  review_intelligence: 'reviews',
  website_audit_intelligence: 'website',
  seo_intelligence: 'seo',
  local_seo_intelligence: 'local_seo',
  keyword_opportunity_intelligence: 'keyword_research',
  content_gap_intelligence: 'content_gap',
  landing_page_conversion_intelligence: 'landing_page',
  competitor_intelligence: 'competitor',
  campaign_offer_intelligence: 'campaigns',
  digital_marketing_strategy: 'strategy'
};
const asArray = (value) => Array.isArray(value) ? value : (value ? String(value).split(',').map((v) => v.trim()).filter(Boolean) : []);
const stripTags = (html) => String(html || '').replace(/<script[\\s\\S]*?<\\/script>/gi, ' ').replace(/<style[\\s\\S]*?<\\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
const matchOne = (html, regex) => String(html || '').match(regex)?.[1]?.trim() || '';
const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\\/\\//i.test(url) ? url : 'https://' + url;
};
async function fetchPublicUrl(url) {
  const normalizedUrl = normalizeUrl(url);
  const startedAt = Date.now();
  try {
    const html = await this.helpers.httpRequest({
      method: 'GET',
      url: normalizedUrl,
      json: false,
      timeout: 20000,
      headers: { 'User-Agent': 'VIP-Intelligence-Public-Audit/1.0' }
    });
    return { ok: true, url: normalizedUrl, status: 200, duration_ms: Date.now() - startedAt, html: String(html || '') };
  } catch (error) {
    return { ok: false, url: normalizedUrl, status: error.response?.statusCode || null, duration_ms: Date.now() - startedAt, error: error.message || String(error) };
  }
}
function auditHtml(fetchResult, serviceKeywords = []) {
  if (!fetchResult.ok) return { availability: fetchResult, findings: [], metrics: {}, text_sample: '' };
  const html = fetchResult.html;
  const text = stripTags(html);
  const title = matchOne(html, /<title[^>]*>([\\s\\S]*?)<\\/title>/i);
  const metaDescription = matchOne(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || matchOne(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = matchOne(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\\s\\S]*?)<\\/h1>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  const h2s = [...html.matchAll(/<h2[^>]*>([\\s\\S]*?)<\\/h2>/gi)].map((m) => stripTags(m[1])).filter(Boolean).slice(0, 12);
  const lowerText = text.toLowerCase();
  const keywordHits = serviceKeywords.filter((keyword) => lowerText.includes(String(keyword).toLowerCase()));
  const findings = [];
  if (!title) findings.push('Missing page title');
  if (!metaDescription) findings.push('Missing meta description');
  if (h1s.length === 0) findings.push('Missing H1 heading');
  if (!canonical) findings.push('Missing canonical link');
  if (!/(call|book|appointment|contact|whatsapp|enquire|schedule)/i.test(text)) findings.push('CTA/contact wording not detected on public page');
  if (!/(phone|tel:|@|address|location|map)/i.test(html + ' ' + text)) findings.push('Contact/location signal not detected on public page');
  return {
    availability: { ok: true, url: fetchResult.url, status: fetchResult.status, duration_ms: fetchResult.duration_ms },
    findings,
    metrics: {
      title,
      title_length: title.length,
      meta_description: metaDescription,
      meta_description_length: metaDescription.length,
      h1s,
      h2s,
      canonical,
      service_keyword_hits: keywordHits,
      cta_detected: !findings.includes('CTA/contact wording not detected on public page'),
      contact_detected: !findings.includes('Contact/location signal not detected on public page')
    },
    text_sample: text.slice(0, 1000)
  };
}
const serviceKeywords = asArray(client.service_keywords || client.priority_services);
const targetLocations = asArray(client.target_locations || client.location);
const engineCadence = client.engine_cadence_config || {
  daily: ['facebook_intelligence','instagram_intelligence','youtube_intelligence','google_business_intelligence_lightweight','review_intelligence_lightweight','content_performance','daily_content_production','adaptive_plan_update','digital_marketing_strategy'],
  weekly: ['website_audit_intelligence','seo_intelligence','competitor_intelligence','local_seo_intelligence','keyword_opportunity_intelligence','content_gap_intelligence','campaign_offer_intelligence'],
  monthly_manual: ['30_day_content_plan_engine','full_competitor_review','full_website_audit','digital_strategy_reset']
};
const setup = {
  google_business_intelligence: ['google_business_profile_enabled=true', 'google_business_profile_account_id', 'google_business_profile_location_id', 'google_business_profile_credential_env_key'],
  review_intelligence: ['reputation_enabled=true', 'review_platforms', 'Google Business Profile API/review source credential reference'],
  website_audit_intelligence: ['website_audit_enabled=true', 'website_url'],
  seo_intelligence: ['seo_enabled=true', 'website_url', 'service_keywords or priority_services'],
  local_seo_intelligence: ['seo_enabled=true', 'website_url', 'target_locations'],
  keyword_opportunity_intelligence: ['seo_enabled=true', 'service_keywords or priority_services', 'target_locations'],
  content_gap_intelligence: ['website_url', 'service_keywords or priority_services'],
  landing_page_conversion_intelligence: ['website_url'],
  competitor_intelligence: ['competitor_enabled=true', 'competitor_websites and/or competitor public profile URLs'],
  campaign_offer_intelligence: ['campaign_enabled=true', 'active_offers or seasonal_campaigns or campaign_goals'],
  digital_marketing_strategy: ['At least one current engine output or configured digital-presence source']
};
function card(type, title, value, detail = '') {
  return { type, title, value, detail };
}
function buildInputsUsed(extra = {}) {
  return {
    client_slug: client.client_slug,
    website_url_configured: Boolean(client.website_url),
    gbp_public_url_configured: Boolean(client.google_business_profile_url),
    gbp_api_reference_configured: Boolean(client.google_business_profile_credential_env_key),
    services_configured: serviceKeywords,
    target_locations_configured: targetLocations,
    competitor_websites_configured: asArray(client.competitor_websites),
    review_platforms_configured: asArray(client.review_platforms),
    active_offers_configured: asArray(client.active_offers),
    seasonal_campaigns_configured: asArray(client.seasonal_campaigns),
    campaign_goals_configured: asArray(client.campaign_goals),
    ...extra
  };
}
function finalize(payload) {
  const findings = payload.findings || payload.key_insights || [];
  const recommendations = payload.recommendations || [];
  const nextActions = payload.next_actions || recommendations;
  const dataPolicy = payload.data_policy || payload.raw_payload?.data_policy || 'no_fake_live_data';
  const inputsUsed = payload.inputs_used || buildInputsUsed();
  const frontendCards = payload.frontend_cards || [
    card('status', 'Status', payload.status || 'skipped_missing_config', payload.summary || ''),
    card('policy', 'Data policy', dataPolicy, 'Only configured sources and public checks are used.'),
    card('actions', 'Next actions', nextActions.length, nextActions.slice(0, 3).join('; '))
  ];
  return {
    json: {
      ...client,
      engine,
      engine_name: engine,
      client_slug: client.client_slug,
      source_platform: payload.source_platform || sourceByEngine[engine] || 'digital_presence',
      status: payload.status || 'skipped_missing_config',
      summary: payload.summary || '',
      data_policy: dataPolicy,
      inputs_used: inputsUsed,
      findings,
      key_insights: payload.key_insights || findings,
      recommendations,
      next_actions: nextActions,
      frontend_cards: frontendCards,
      confidence_score: payload.confidence_score ?? 0,
      setup_requirements: payload.setup_requirements || [],
      digital_marketing_health_score: payload.digital_marketing_health_score ?? null,
      social_media_health_score: payload.social_media_health_score ?? null,
      seo_health_score: payload.seo_health_score ?? null,
      website_health_score: payload.website_health_score ?? null,
      google_business_profile_health_score: payload.google_business_profile_health_score ?? null,
      reputation_health_score: payload.reputation_health_score ?? null,
      competitor_positioning_summary: payload.competitor_positioning_summary || 'insufficient_data',
      top_growth_opportunities: payload.top_growth_opportunities || [],
      urgent_fixes: payload.urgent_fixes || [],
      recommended_next_actions: payload.recommended_next_actions || nextActions,
      content_plan_inputs: payload.content_plan_inputs || [],
      campaign_plan_inputs: payload.campaign_plan_inputs || [],
      client_readiness_status: payload.client_readiness_status || (payload.status === 'success' ? 'ready_for_guarded_run' : 'partial_configuration'),
      engine_cadence_config: engineCadence,
      raw_payload: {
        data_policy: dataPolicy,
        engine_name: engine,
        inputs_used: inputsUsed,
        findings,
        frontend_cards: frontendCards,
        ...(payload.raw_payload || {})
      }
    }
  };
}
function skip(summary, missing = setup[engine] || []) {
  return finalize({
    status: 'skipped_missing_config',
    summary,
    findings: ['Required configuration is missing; no live data was inferred.'],
    recommendations: ['Configure real API credentials or public URLs before running this engine.'],
    next_actions: missing,
    setup_requirements: missing,
    data_policy: 'no_fake_live_data',
    raw_payload: { skipped_reason: summary, setup_requirements: missing }
  });
}
if (engine === 'google_business_intelligence') {
  const missing = [];
  if (!client.google_business_profile_enabled) missing.push('google_business_profile_enabled=true');
  if (!client.google_business_profile_account_id && !client.google_business_profile_url) missing.push('google_business_profile_account_id or google_business_profile_url');
  if (!client.google_business_profile_location_id && !client.google_business_profile_url) missing.push('google_business_profile_location_id or google_business_profile_url');
  if (!client.google_business_profile_credential_env_key && !client.google_business_profile_url) missing.push('google_business_profile_credential_env_key or google_business_profile_url');
  if (missing.length) return skip('Google Business Profile intelligence skipped because required API configuration or a public profile URL is missing.', missing);
  if (client.google_business_profile_url && !client.google_business_profile_credential_env_key) {
    return finalize({
      status: 'partial_success',
      summary: 'Google Business Profile public checklist prepared from configured public profile URL only.',
      findings: ['Public GBP URL is configured.', 'No API credential was used; performance metrics were not claimed.'],
      recommendations: ['Verify profile completeness, service categories, appointment links, photos, and UTM-tagged website links manually.'],
      next_actions: ['Connect a safe GBP API credential before reporting calls, directions, searches, views, reviews, or ranking.'],
      confidence_score: 0.35,
      data_policy: 'configured_public_profile_checklist_only',
      google_business_profile_health_score: 'insufficient_data',
      raw_payload: { google_business_profile_url: client.google_business_profile_url }
    });
  }
  return skip('Google Business Profile API adapter is not bound in this workflow yet; no live Google data was fabricated.', ['Bind the configured GBP credential to a Google Business Profile API node/adapter.']);
}
if (engine === 'review_intelligence') {
  const missing = [];
  if (!client.reputation_enabled) missing.push('reputation_enabled=true');
  if (asArray(client.review_platforms).length === 0) missing.push('review_platforms');
  if (!client.google_business_profile_credential_env_key && asArray(client.review_platforms).some((p) => /google/i.test(p))) missing.push('google_business_profile_credential_env_key');
  if (missing.length) return skip('Review intelligence skipped because no configured review API/public source is available.', missing);
  return finalize({
    status: 'skipped_missing_config',
    summary: 'Review source configured but live review adapter is not bound in this workflow yet; no review counts, ratings, or sentiment were fabricated.',
    findings: ['Review platform configuration exists.', 'No approved review API adapter is currently bound.'],
    recommendations: ['Prepare review response policy, escalation owners, and profile-link inventory before enabling live review ingestion.'],
    next_actions: ['Bind Google Business Profile reviews or another approved review API adapter.'],
    confidence_score: 0,
    data_policy: 'no_fake_review_data',
    reputation_health_score: 'insufficient_data',
    raw_payload: { review_platforms: asArray(client.review_platforms), review_response_policy: client.review_response_policy || {} }
  });
}
if (['website_audit_intelligence', 'seo_intelligence', 'content_gap_intelligence', 'landing_page_conversion_intelligence'].includes(engine)) {
  if ((engine === 'website_audit_intelligence' && !client.website_audit_enabled) || (engine === 'seo_intelligence' && !client.seo_enabled) || !client.website_url) {
    const missing = [];
    if (engine === 'website_audit_intelligence' && !client.website_audit_enabled) missing.push('website_audit_enabled=true');
    if (engine === 'seo_intelligence' && !client.seo_enabled) missing.push('seo_enabled=true');
    if (!client.website_url) missing.push('website_url');
    return skip(engine + ' skipped because website configuration is missing.', missing);
  }
  const homepage = await fetchPublicUrl.call(this, client.website_url);
  const audit = auditHtml(homepage, serviceKeywords);
  const status = homepage.ok ? (audit.findings.length ? 'partial_success' : 'success') : 'failed';
  const engineFindings = homepage.ok ? [
    'Website responded from configured URL.',
    'Title length: ' + audit.metrics.title_length,
    'Meta description length: ' + audit.metrics.meta_description_length,
    'Detected service keyword hits: ' + audit.metrics.service_keyword_hits.length,
    'Configured sitemap URL: ' + Boolean(client.sitemap_url),
    'Configured robots.txt URL: ' + Boolean(client.robots_txt_url)
  ] : [homepage.error || 'Website request failed'];
  const recommendations = audit.findings.map((finding) => 'Fix: ' + finding);
  if (engine === 'seo_intelligence') {
    recommendations.push(...serviceKeywords.slice(0, 8).map((service) => 'Create or improve an on-page service section for: ' + service));
    recommendations.push(...targetLocations.slice(0, 6).map((location) => 'Add local proof and service-area copy for: ' + location));
    recommendations.push('Add healthcare service schema and FAQ schema where clinically appropriate.');
  }
  if (engine === 'content_gap_intelligence') {
    recommendations.push(...serviceKeywords.slice(0, 8).map((service) => 'Create education/FAQ content for: ' + service));
    recommendations.push('Add trust-building topics: doctor expertise, care process, patient-family guidance, and appointment preparation.');
  }
  if (engine === 'landing_page_conversion_intelligence') {
    recommendations.push('Make appointment/call/WhatsApp CTA visible near top and after service explanations.');
    recommendations.push('Add trust signals: doctor/team credibility, service proof, location clarity, and next-step reassurance.');
  }
  return finalize({
    source_platform: sourceByEngine[engine],
    status,
    summary: homepage.ok ? 'Public website check completed from configured website_url.' : 'Website public check failed for configured website_url.',
    findings: engineFindings,
    recommendations,
    next_actions: recommendations,
    confidence_score: homepage.ok ? 0.7 : 0.2,
    data_policy: 'public_website_check_only_no_rank_or_performance_claims',
    website_health_score: homepage.ok ? (audit.findings.length ? 55 : 75) : 'insufficient_data',
    seo_health_score: engine === 'seo_intelligence' && homepage.ok ? (serviceKeywords.length && targetLocations.length ? 60 : 'insufficient_data') : null,
    raw_payload: { homepage: audit, service_keywords: serviceKeywords, target_locations: targetLocations }
  });
}
if (engine === 'competitor_intelligence') {
  const competitorWebsites = asArray(client.competitor_websites);
  if (!client.competitor_enabled || competitorWebsites.length === 0) {
    const missing = [];
    if (!client.competitor_enabled) missing.push('competitor_enabled=true');
    if (competitorWebsites.length === 0) missing.push('competitor_websites');
    return skip('Competitor intelligence skipped because configured competitor public sources are missing.', missing);
  }
  const competitorResults = [];
  for (const competitorUrl of competitorWebsites.slice(0, 5)) {
    const fetched = await fetchPublicUrl.call(this, competitorUrl);
    competitorResults.push({ url: normalizeUrl(competitorUrl), audit: auditHtml(fetched, serviceKeywords) });
  }
  return finalize({
    source_platform: 'competitor',
    status: competitorResults.some((result) => result.audit.availability.ok) ? 'partial_success' : 'failed',
    summary: 'Competitor public website checks completed only for configured competitor_websites.',
    findings: competitorResults.map((result) => result.url + ': ' + (result.audit.availability.ok ? 'reachable' : 'not reachable')),
    recommendations: ['Compare visible service coverage, CTA clarity, trust signals, content themes, and public review/profile links manually.'],
    next_actions: ['Add official competitor GBP/social URLs and approved APIs for richer competitor intelligence.'],
    confidence_score: 0.55,
    data_policy: 'configured_public_competitor_sources_only_no_hidden_analytics',
    competitor_positioning_summary: 'Public competitor source checks are available, but hidden performance analytics are not claimed.',
    raw_payload: { competitor_results: competitorResults }
  });
}
if (engine === 'local_seo_intelligence' || engine === 'keyword_opportunity_intelligence') {
  const missing = [];
  if (!client.seo_enabled) missing.push('seo_enabled=true');
  if (serviceKeywords.length === 0) missing.push('service_keywords or priority_services');
  if (targetLocations.length === 0) missing.push('target_locations or location');
  if (missing.length) return skip(engine + ' skipped because SEO keyword/location config is missing.', missing);
  const keywordIdeas = [];
  for (const service of serviceKeywords.slice(0, 12)) {
    for (const location of targetLocations.slice(0, 6)) keywordIdeas.push(service + ' in ' + location);
  }
  const clusters = {
    high_intent: serviceKeywords.slice(0, 12).map((service) => service + ' appointment'),
    local: keywordIdeas.slice(0, 30),
    awareness: serviceKeywords.slice(0, 12).map((service) => 'when to consult for ' + service),
    FAQ: serviceKeywords.slice(0, 12).map((service) => service + ' frequently asked questions'),
    seasonal: asArray(client.seasonal_campaigns).concat(asArray(client.active_offers)).slice(0, 12)
  };
  return finalize({
    source_platform: sourceByEngine[engine],
    status: 'success',
    summary: 'Keyword/local SEO opportunities generated from configured client services and target locations only.',
    findings: ['Generated ' + keywordIdeas.length + ' configured service-location combinations.', 'No search volume, rank, or difficulty was claimed.'],
    recommendations: engine === 'keyword_opportunity_intelligence' ? Object.values(clusters).flat().slice(0, 30) : keywordIdeas.slice(0, 20),
    next_actions: ['Connect Google Search Console or a keyword research API before reporting volume, rank, or difficulty.'],
    confidence_score: 0.5,
    data_policy: 'configured_inputs_only_no_rank_volume_claims',
    seo_health_score: 'insufficient_data',
    content_plan_inputs: Object.values(clusters).flat().slice(0, 25),
    raw_payload: { keyword_ideas: keywordIdeas, keyword_clusters: clusters, service_keywords: serviceKeywords, target_locations: targetLocations }
  });
}
if (engine === 'campaign_offer_intelligence') {
  const offers = asArray(client.active_offers);
  const seasonalCampaigns = asArray(client.seasonal_campaigns);
  const goals = asArray(client.campaign_goals);
  if (!client.campaign_enabled || (offers.length + seasonalCampaigns.length + goals.length) === 0) {
    const missing = [];
    if (!client.campaign_enabled) missing.push('campaign_enabled=true');
    if ((offers.length + seasonalCampaigns.length + goals.length) === 0) missing.push('active_offers or seasonal_campaigns or campaign_goals');
    return skip('Campaign intelligence skipped because campaign configuration is missing.', missing);
  }
  const campaignIdeas = [...offers, ...seasonalCampaigns, ...goals].slice(0, 20).map((item) => 'Build campaign around: ' + item);
  return finalize({
    source_platform: 'campaigns',
    status: 'success',
    summary: 'Campaign ideas prepared from configured offers, seasons, and goals only.',
    findings: goals.map((goal) => 'Goal configured: ' + goal),
    recommendations: campaignIdeas,
    next_actions: ['Connect performance sources before optimizing offers from live demand or competitor gaps.'],
    confidence_score: 0.5,
    data_policy: 'configured_campaign_inputs_only_no_performance_projection',
    campaign_plan_inputs: campaignIdeas,
    raw_payload: { offers, seasonal_campaigns: seasonalCampaigns, goals }
  });
}
if (engine === 'digital_marketing_strategy') {
  const readinessSignals = [
    Boolean(client.website_url),
    Boolean(client.website_audit_enabled),
    Boolean(client.seo_enabled),
    Boolean(client.google_business_profile_url || client.google_business_profile_credential_env_key),
    asArray(client.competitor_websites).length > 0,
    asArray(client.review_platforms).length > 0,
    Boolean(client.campaign_enabled)
  ];
  const configuredCount = readinessSignals.filter(Boolean).length;
  const score = configuredCount >= 4 ? Math.round((configuredCount / readinessSignals.length) * 100) : 'insufficient_data';
  const urgentFixes = [];
  if (!client.website_url) urgentFixes.push('Add website_url before running website/SEO/conversion engines.');
  if (!client.google_business_profile_url && !client.google_business_profile_credential_env_key) urgentFixes.push('Add GBP public URL or safe credential reference before GBP intelligence.');
  if (asArray(client.review_platforms).length === 0) urgentFixes.push('Configure review platforms before reputation intelligence.');
  return finalize({
    source_platform: 'strategy',
    status: configuredCount ? 'partial_success' : 'skipped_missing_config',
    summary: 'Digital strategy orchestrator prepared from configured evidence only; missing live Google/SEO/competitor data remains explicit.',
    findings: ['Configured digital readiness signals: ' + configuredCount + ' of ' + readinessSignals.length, 'No live rank, volume, GBP performance, review count, or competitor performance was fabricated.'],
    recommendations: ['Run weekly guarded website/SEO/competitor/local/keyword/content/campaign engines after configuration.', 'Connect Google Business Profile and Search Console before reporting Google visibility.'],
    next_actions: ['Review client_readiness_status before enabling daily automation.'],
    confidence_score: configuredCount ? 0.45 : 0,
    data_policy: 'stored_outputs_and_configured_public_checks_only_no_fake_live_data',
    digital_marketing_health_score: score,
    social_media_health_score: 'insufficient_data',
    seo_health_score: client.seo_enabled && serviceKeywords.length ? 'configured_inputs_only' : 'insufficient_data',
    website_health_score: client.website_url ? 'configured_for_public_check' : 'insufficient_data',
    google_business_profile_health_score: (client.google_business_profile_url || client.google_business_profile_credential_env_key) ? 'configured_inputs_only' : 'insufficient_data',
    reputation_health_score: asArray(client.review_platforms).length ? 'configured_inputs_only' : 'insufficient_data',
    competitor_positioning_summary: asArray(client.competitor_websites).length ? 'Configured competitor public websites can be checked weekly.' : 'insufficient_data',
    top_growth_opportunities: ['Website trust and CTA clarity', 'Local service-location pages', 'Review readiness and response workflow', 'Configured campaign offers for content planning'],
    urgent_fixes: urgentFixes,
    recommended_next_actions: ['Complete missing config fields.', 'Run guarded weekly digital engines.', 'Keep platform credential engines unpublished until resolver credentials are configured.'],
    content_plan_inputs: serviceKeywords.slice(0, 20),
    campaign_plan_inputs: [...asArray(client.active_offers), ...asArray(client.seasonal_campaigns), ...asArray(client.campaign_goals)].slice(0, 20),
    client_readiness_status: configuredCount >= 5 ? 'guarded_ready' : 'partial_configuration',
    raw_payload: { strategy_inputs: 'stored_outputs_and_configured_public_checks_only', configured_readiness_count: configuredCount, engine_cadence_config: engineCadence }
  });
}
return skip(engine + ' skipped because this engine has no live adapter or configured public check in the orchestrator yet.', setup[engine] || ['Implement real adapter or configure public source.']);
`
    }
  },
  output: [{ client_id: 'client_slug_here', engine: 'website_audit_intelligence', status: 'skipped_missing_config', summary: 'Missing config', raw_payload: {} }]
});

const storeDigitalPresenceResult = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Digital Presence - Store engine_runs And intelligence_outputs',
    position: [1920, 760],
    parameters: {
      operation: 'executeQuery',
      query: expr("with run_row as (insert into engine_runs (client_id, engine_name, mode, status, completed_at, error_message, metadata) values ('{{ $json.id }}'::uuid, '{{ $json.engine }}', '{{ $json.mode }}', '{{ $json.status }}', now(), case when '{{ $json.status }}' = 'failed' then $$ {{ ($json.summary || '').replace(/\\$\\$/g, '') }} $$ else null end, jsonb_build_object('client_slug', '{{ $json.client_slug }}', 'data_policy', '{{ $json.data_policy || \"no_fake_live_data\" }}', 'setup_requirements', $$ {{ JSON.stringify($json.setup_requirements || []).replace(/\\$\\$/g, '') }} $$::jsonb, 'client_readiness_status', '{{ $json.client_readiness_status || \"partial_configuration\" }}')) returning id), raw_row as (insert into raw_engine_data (client_id, engine_name, source_platform, date_range_start, date_range_end, raw_payload) values ('{{ $json.id }}'::uuid, '{{ $json.engine }}', '{{ $json.source_platform || \"digital_presence\" }}', '{{ $json.date_range_start }}'::date, '{{ $json.date_range_end }}'::date, $$ {{ JSON.stringify($json.raw_payload || {}).replace(/\\$\\$/g, '') }} $$::jsonb) returning id), output_row as (insert into intelligence_outputs (client_id, engine_name, source_platform, report_date, summary, key_insights, recommendations, next_actions, confidence_score, input_sources) values ('{{ $json.id }}'::uuid, '{{ $json.engine }}', '{{ $json.source_platform || \"digital_presence\" }}', '{{ $json.run_date }}'::date, $$ {{ ($json.summary || '').replace(/\\$\\$/g, '') }} $$, $$ {{ JSON.stringify($json.key_insights || $json.findings || []).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($json.recommendations || []).replace(/\\$\\$/g, '') }} $$::jsonb, $$ {{ JSON.stringify($json.next_actions || []).replace(/\\$\\$/g, '') }} $$::jsonb, {{ Number($json.confidence_score || 0) }}, jsonb_build_object('engine_run_id', (select id from run_row), 'raw_reference_id', (select id from raw_row), 'status', '{{ $json.status }}', 'data_policy', '{{ $json.data_policy || \"no_fake_live_data\" }}', 'inputs_used', $$ {{ JSON.stringify($json.inputs_used || {}).replace(/\\$\\$/g, '') }} $$::jsonb, 'frontend_cards', $$ {{ JSON.stringify($json.frontend_cards || []).replace(/\\$\\$/g, '') }} $$::jsonb, 'client_readiness_status', '{{ $json.client_readiness_status || \"partial_configuration\" }}')) returning id) select (select id from run_row) as engine_run_id, (select id from raw_row) as raw_reference_id, (select id from output_row) as intelligence_output_id;"),
      options: { largeNumbersOutput: 'numbers' }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{ engine_run_id: '66666666-6666-6666-6666-666666666666', raw_reference_id: '77777777-7777-7777-7777-777777777777', intelligence_output_id: '88888888-8888-8888-8888-888888888888' }]
});

const finalDigitalPresenceResponse = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Digital Presence - Final JSON Response',
    position: [2220, 760],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const result = $('Digital Presence - Guarded Live/Public Data Engine').item.json;
return {
  json: {
    client_id: result.client_slug,
    engine: result.engine,
    status: result.status,
    summary: result.summary,
    data_policy: result.data_policy || result.raw_payload?.data_policy || 'no_fake_live_data',
    inputs_used: result.inputs_used || {},
    findings: result.findings || result.key_insights || [],
    key_insights: result.key_insights || result.findings || [],
    recommendations: result.recommendations || [],
    next_actions: result.next_actions || [],
    frontend_cards: result.frontend_cards || [],
    setup_requirements: result.setup_requirements || [],
    digital_marketing_health_score: result.digital_marketing_health_score ?? null,
    social_media_health_score: result.social_media_health_score ?? null,
    seo_health_score: result.seo_health_score ?? null,
    website_health_score: result.website_health_score ?? null,
    google_business_profile_health_score: result.google_business_profile_health_score ?? null,
    reputation_health_score: result.reputation_health_score ?? null,
    competitor_positioning_summary: result.competitor_positioning_summary || 'insufficient_data',
    top_growth_opportunities: result.top_growth_opportunities || [],
    urgent_fixes: result.urgent_fixes || [],
    recommended_next_actions: result.recommended_next_actions || result.next_actions || [],
    content_plan_inputs: result.content_plan_inputs || [],
    campaign_plan_inputs: result.campaign_plan_inputs || [],
    client_readiness_status: result.client_readiness_status || 'partial_configuration'
  }
};`
    }
  },
  output: [{ client_id: 'client_slug_here', engine: 'website_audit_intelligence', status: 'skipped_missing_config', data_policy: 'no_fake_live_data' }]
});

const legacySkippedEngine = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Legacy Social/Context Engine - Skipped Missing Implementation',
    position: [1620, 520],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
return {
  json: {
    client_id: $json.client_slug,
    engine: $json.engine,
    status: 'skipped_missing_config',
    summary: $json.engine + ' is not connected to a live adapter in this workflow yet.',
    key_insights: [],
    recommendations: ['Connect a real platform API/public data adapter before enabling this engine.'],
    next_actions: ['Configure required credentials and source IDs.'],
    data_policy: 'no_fake_live_data'
  }
};`
    }
  },
  output: [{ client_id: 'client_slug_here', engine: 'instagram_intelligence', status: 'skipped_missing_config', data_policy: 'no_fake_live_data' }]
});

const triggerNote = sticky('## A. Trigger Section\\nManual trigger supports pinned input for testing. Schedule trigger runs daily at 8:00 AM Asia/Kolkata when the workflow timezone is Asia/Kolkata.', [manualTrigger, scheduleTrigger, runtimeConfig], { color: 4 });
const dbNote = sticky('## Database\\nBind the `Supabase Postgres` credential after import. Run `vip_intelligence_schema.sql` first. Client rows store source IDs and credential references, not raw platform secrets.', [loadClients, createEngineRun, storeRawData, storeNormalizedMetrics, storeAiOutput], { color: 5 });
const digitalPolicyNote = sticky('## Digital Presence Data Policy\\nGoogle/SEO/review/competitor engines never fabricate live data. They use configured public website checks where possible, or return and store `skipped_missing_config` with setup requirements.', [guardedDigitalPresenceEngine, storeDigitalPresenceResult, finalDigitalPresenceResponse], { color: 3 });

export default workflow('vip-intelligence-engine-orchestrator', 'VIP Intelligence Engine Orchestrator')
  .add(triggerNote)
  .add(dbNote)
  .add(digitalPolicyNote)
  .add(manualTrigger)
  .to(runtimeConfig)
  .to(loadClients)
  .to(prepareEngineItem)
  .to(engineRouter
    .onCase(0, createEngineRun.to(validateFacebookConfig).to(facebookResolverConfigCheck).to(applyFacebookResolverValidation).to(facebookConfigValid
      .onTrue(facebookMetricRegistry.to(collectFacebookGraphData).to(normalizeFacebookData).to(storeRawData).to(storeNormalizedMetrics).to(storeFacebookAnalyticsSnapshot).to(updateFacebookSocialStreak).to(queryHistoricalComparison).to(prepareAiPrompt).to(aiSummary).to(storeAiOutput).to(storeFacebookAnalyticsSummary).to(updateEngineRunSuccess).to(finalFacebookResponse))
      .onFalse(updateEngineRunConfigFailure.to(updateFacebookSocialStreakFailure).to(finalConfigFailureResponse))
    ))
    .onCase(1, legacySkippedEngine)
    .onCase(2, legacySkippedEngine)
    .onCase(3, legacySkippedEngine)
    .onCase(4, legacySkippedEngine)
    .onCase(5, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(6, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(7, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(8, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(9, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(10, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(11, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(12, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(13, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(14, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(15, guardedDigitalPresenceEngine.to(storeDigitalPresenceResult).to(finalDigitalPresenceResponse))
    .onCase(16, legacySkippedEngine)
    .onCase(17, legacySkippedEngine)
    .onCase(18, legacySkippedEngine)
    .onCase(19, legacySkippedEngine)
  )
  .add(scheduleTrigger)
  .to(runtimeConfig);
