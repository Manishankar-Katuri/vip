import { workflow, node, trigger, sticky, newCredential, ifElse, switchCase, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger - Test Individual Engine', position: [120, 260] },
  output: [{ client_id: 'aayu_geriatrics', engine: 'facebook_intelligence', mode: 'manual' }]
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
    graph_api_version: input.graph_api_version || $env.META_GRAPH_API_VERSION || 'v23.0',
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
    client_slug: 'aayu_geriatrics'
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
      query: "select id, client_slug, client_name, industry, location, facebook_page_id, facebook_page_access_token, instagram_business_id, google_business_profile_id, active from clients where active = true and ($1 = '' or client_slug = $1 or id::text = $1) order by client_slug;",
      options: {
        queryReplacement: expr('{{ $("runtime_config").item.json.client_slug || "" }}'),
        largeNumbersOutput: 'numbers'
      }
    },
    credentials: { postgres: newCredential('Supabase Postgres') }
  },
  output: [{
    id: '00000000-0000-0000-0000-000000000001',
    client_slug: 'aayu_geriatrics',
    client_name: 'Aayu Geriatrics',
    industry: 'Healthcare',
    location: 'Hyderabad',
    facebook_page_id: '123456789',
    facebook_page_access_token: '[secure]',
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
    client_slug: 'aayu_geriatrics',
    client_name: 'Aayu Geriatrics',
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
if (!client.facebook_page_access_token) missing.push('facebook_page_access_token');
return {
  json: {
    ...client,
    engine_run_id: $json.engine_run_id,
    facebook_config_valid: missing.length === 0,
    missing_config: missing,
    error_message: missing.length ? 'Missing required Facebook config: ' + missing.join(', ') : ''
  }
};`
    }
  },
  output: [{ facebook_config_valid: true, engine_run_id: '11111111-1111-1111-1111-111111111111', client_slug: 'aayu_geriatrics' }]
});

const facebookConfigValid = ifElse({
  version: 2.3,
  config: {
    name: 'Facebook - Config Valid?',
    position: [2220, 160],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.facebook_config_valid }}'), operator: { type: 'boolean', operation: 'true' }, rightValue: true }],
        combinator: 'and'
      }
    }
  }
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
const base = 'https://graph.facebook.com/' + item.graph_api_version;
const token = item.facebook_page_access_token;
const pageId = item.facebook_page_id;
const pageMetricNames = item.page_metric_names || [];
const postMetricNames = item.post_metric_names || [];
async function graphGet(path, qs = {}) {
  const query = { ...qs, access_token: token };
  return await this.helpers.httpRequest({
    method: 'GET',
    url: base + '/' + path,
    qs: query,
    json: true,
    timeout: 30000,
  });
}
async function safeGet(label, path, qs = {}) {
  try {
    return { ok: true, label, data: await graphGet.call(this, path, qs) };
  } catch (error) {
    return { ok: false, label, error: error.message || String(error), response: error.response?.body ?? null };
  }
}
const pageProfile = await safeGet.call(this, 'page_profile', pageId, { fields: 'id,name,category,fan_count,followers_count,link,about' });
const pageMetrics = [];
for (const metric of pageMetricNames) {
  const result = await safeGet.call(this, 'page_metric:' + metric, pageId + '/insights', {
    metric,
    since: item.page_metric_since,
    until: item.date_range_end,
  });
  pageMetrics.push({ metric, ...result });
}
const recentPostsResult = await safeGet.call(this, 'recent_posts', pageId + '/posts', {
  fields: 'id,message,created_time,permalink_url,full_picture,status_type,attachments{media_type,type,url},shares,comments.summary(true),reactions.summary(true)',
  limit: 25,
});
const posts = recentPostsResult.ok ? (recentPostsResult.data.data || []) : [];
const postInsights = [];
for (const post of posts) {
  const metricResults = [];
  for (const metric of postMetricNames) {
    const result = await safeGet.call(this, 'post_metric:' + metric, post.id + '/insights', { metric });
    metricResults.push({ metric, ...result });
  }
  postInsights.push({ post_id: post.id, metrics: metricResults });
}
return {
  json: {
    ...item,
    facebook_api_results: {
      page_profile: pageProfile,
      page_metrics: pageMetrics,
      recent_posts: recentPostsResult,
      posts,
      post_insights: postInsights,
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
for (const result of [data.page_profile, data.recent_posts, ...(data.page_metrics || [])]) {
  if (result && result.ok === false) metricErrors.push({ label: result.label, metric: result.metric || null, error: result.error || 'Unknown API error' });
}
for (const postInsight of data.post_insights || []) {
  for (const result of postInsight.metrics || []) {
    if (result && result.ok === false) metricErrors.push({ label: result.label, post_id: postInsight.post_id, metric: result.metric || null, error: result.error || 'Unknown API error' });
  }
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
    analytics_snapshot: analyticsSnapshot,
    normalized_metrics: normalizedMetrics,
    raw_payload: {
      page_profile: data.page_profile,
      page_metrics: data.page_metrics,
      recent_posts: data.recent_posts,
      posts,
      post_insights: data.post_insights,
      calculated_metrics: calculated,
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
      query: expr("update engine_runs set status = 'success', completed_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('posts_analyzed', {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.calculated_metrics.total_posts_analyzed }}, 'metrics_saved', {{ $('Facebook - Store normalized_metrics').item.json.metrics_saved }}, 'metric_errors_count', {{ $('Facebook - Normalize Data And Calculate Metrics').item.json.analytics_snapshot.metric_errors.length }}, 'analytics_snapshot_id', '{{ $('Facebook - Store social_analytics_snapshots').item.json.social_analytics_snapshot_id }}', 'analytics_summary_id', '{{ $('Facebook - Store social_analytics_daily_summaries').item.json.social_analytics_summary_id }}', 'insights_generated', true, 'intelligence_output_id', '{{ $('Facebook - Store intelligence_outputs').item.json.intelligence_output_id }}') where id = '{{ $('Facebook - Validate Required Client Config').item.json.engine_run_id }}'::uuid returning status;"),
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
  output: [{ client_id: 'aayu_geriatrics', engine: 'facebook_intelligence', status: 'success', summary: '...', key_insights: [], recommendations: [], next_actions: [] }]
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
const client = $('Facebook - Validate Required Client Config').item.json;
return {
  json: {
    client_id: client.client_slug,
    engine: 'facebook_intelligence',
    status: 'failed',
    summary: client.error_message,
    key_insights: [],
    recommendations: ['Add facebook_page_id and facebook_page_access_token for this client.'],
    next_actions: ['Update the clients table and rerun the manual test.']
  }
};`
    }
  },
  output: [{ client_id: 'aayu_geriatrics', engine: 'facebook_intelligence', status: 'failed' }]
});

const placeholderNode = (name, engineName, x, y) =>
  node({
    type: 'n8n-nodes-base.set',
    version: 3.4,
    config: {
      name,
      position: [x, y],
      parameters: {
        mode: 'manual',
        includeOtherFields: true,
        assignments: {
          assignments: [
            { id: 'status', name: 'status', value: 'skipped', type: 'string' },
            { id: 'engine', name: 'engine', value: engineName, type: 'string' },
            { id: 'reason', name: 'reason', value: 'Engine not implemented in Phase 1', type: 'string' }
          ]
        }
      }
    },
    output: [{ status: 'skipped', reason: 'Engine not implemented in Phase 1' }]
  });

const instagramPlaceholder = placeholderNode('PLACEHOLDER - Instagram Intelligence Engine - Not Implemented Yet', 'instagram_intelligence', 1620, 420);
const contentPlaceholder = placeholderNode('PLACEHOLDER - Content Performance Engine - Not Implemented Yet', 'content_performance', 1620, 520);
const trendsPlaceholder = placeholderNode('PLACEHOLDER - Trends Intelligence Engine - Not Implemented Yet', 'trends_intelligence', 1620, 620);
const demographicsPlaceholder = placeholderNode('PLACEHOLDER - Demographics Intelligence Engine - Not Implemented Yet', 'demographics_intelligence', 1620, 720);
const competitorPlaceholder = placeholderNode('PLACEHOLDER - Competitor Intelligence Engine - Not Implemented Yet', 'competitor_intelligence', 1620, 820);
const googleBusinessPlaceholder = placeholderNode('PLACEHOLDER - Google Business Intelligence Engine - Not Implemented Yet', 'google_business_intelligence', 1620, 920);
const reviewPlaceholder = placeholderNode('PLACEHOLDER - Review Intelligence Engine - Not Implemented Yet', 'review_intelligence', 1620, 1020);
const socialStrategyPlaceholder = placeholderNode('PLACEHOLDER - Social Media Strategy Engine - Not Implemented Yet', 'social_media_strategy', 1620, 1120);
const calendarPlaceholder = placeholderNode('PLACEHOLDER - Content Calendar Strategy Engine - Not Implemented Yet', 'content_calendar_strategy', 1620, 1220);
const campaignPlaceholder = placeholderNode('PLACEHOLDER - Campaign Strategy Engine - Not Implemented Yet', 'campaign_strategy', 1620, 1320);
const growthPlaceholder = placeholderNode('PLACEHOLDER - Business Growth Strategy Engine - Not Implemented Yet', 'business_growth_strategy', 1620, 1420);

const triggerNote = sticky('## A. Trigger Section\\nManual trigger supports pinned input for testing. Schedule trigger runs daily at 8:00 AM Asia/Kolkata via workflow timezone/cron.', [manualTrigger, scheduleTrigger, runtimeConfig], { color: 4 });
const dbNote = sticky('## Database\\nBind the `Supabase Postgres` credential after import. Run `vip_intelligence_schema.sql` first.', [loadClients, createEngineRun, storeRawData, storeNormalizedMetrics, storeAiOutput], { color: 5 });
const placeholderNote = sticky('## Placeholder Engines\\nAll non-Facebook engines return `{ status: \"skipped\", reason: \"Engine not implemented in Phase 1\" }` and are ready to expand later.', [instagramPlaceholder, growthPlaceholder], { color: 3 });

export default workflow('vip-intelligence-engine-orchestrator', 'VIP Intelligence Engine Orchestrator')
  .add(triggerNote)
  .add(dbNote)
  .add(placeholderNote)
  .add(manualTrigger)
  .to(runtimeConfig)
  .to(loadClients)
  .to(prepareEngineItem)
  .to(engineRouter
    .onCase(0, createEngineRun.to(validateFacebookConfig).to(facebookConfigValid
      .onTrue(facebookMetricRegistry.to(collectFacebookGraphData).to(normalizeFacebookData).to(storeRawData).to(storeNormalizedMetrics).to(storeFacebookAnalyticsSnapshot).to(queryHistoricalComparison).to(prepareAiPrompt).to(aiSummary).to(storeAiOutput).to(storeFacebookAnalyticsSummary).to(updateEngineRunSuccess).to(finalFacebookResponse))
      .onFalse(updateEngineRunConfigFailure.to(finalConfigFailureResponse))
    ))
    .onCase(1, instagramPlaceholder)
    .onCase(2, contentPlaceholder)
    .onCase(3, trendsPlaceholder)
    .onCase(4, demographicsPlaceholder)
    .onCase(5, competitorPlaceholder)
    .onCase(6, googleBusinessPlaceholder)
    .onCase(7, reviewPlaceholder)
    .onCase(8, socialStrategyPlaceholder)
    .onCase(9, calendarPlaceholder)
    .onCase(10, campaignPlaceholder)
    .onCase(11, growthPlaceholder)
  )
  .add(scheduleTrigger)
  .to(runtimeConfig);
