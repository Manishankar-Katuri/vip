import { workflow, node, trigger, sticky } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger - Guarded Digital Test', position: [120, 280] },
  output: [{
    client_slug: 'aayu_geriatrics',
    engine: 'all',
    test_mode: true,
    disable_writes: true,
    allow_test_writes: false
  }]
});

const normalizeTestInput = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Guarded Test Input',
    position: [420, 280],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const input = $json.body ?? $json ?? {};
const asArray = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};
const toBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};
const engines = [
  'google_business_profile_intelligence',
  'website_audit_intelligence',
  'seo_intelligence',
  'competitor_intelligence',
  'reviews_reputation_intelligence',
  'local_seo_intelligence',
  'keyword_opportunity_intelligence',
  'content_gap_intelligence',
  'landing_page_conversion_intelligence',
  'campaign_offer_intelligence',
  'digital_marketing_strategy_orchestrator'
];
const requested = input.engine && input.engine !== 'all' ? asArray(input.engine) : engines;
const selectedEngines = requested.filter((engine) => engines.includes(engine));
return {
  json: {
    workflow_name: 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test',
    client_slug: input.client_slug || input.client_id || 'aayu_geriatrics',
    test_mode: toBool(input.test_mode, true),
    disable_writes: toBool(input.disable_writes, true),
    allow_test_writes: toBool(input.allow_test_writes, false),
    selected_engines: selectedEngines.length ? selectedEngines : engines,
    configured_inputs: {
      google_business_profile_url: input.google_business_profile_url || input.gbp_url || '',
      google_business_profile_safe_reference_configured: Boolean(input.google_business_profile_credential_env_key || input.gbp_safe_reference_configured),
      website_url: input.website_url || '',
      primary_domain: input.primary_domain || '',
      sitemap_url: input.sitemap_url || '',
      robots_txt_url: input.robots_txt_url || '',
      target_locations: asArray(input.target_locations || input.location),
      service_keywords: asArray(input.service_keywords || input.priority_services),
      competitor_websites: asArray(input.competitor_websites),
      review_platforms: asArray(input.review_platforms),
      active_offers: asArray(input.active_offers),
      seasonal_campaigns: asArray(input.seasonal_campaigns),
      campaign_goals: asArray(input.campaign_goals),
      allow_public_fetch: toBool(input.allow_public_fetch, false)
    }
  }
};`
    }
  },
  output: [{
    workflow_name: 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test',
    client_slug: 'aayu_geriatrics',
    test_mode: true,
    disable_writes: true,
    allow_test_writes: false,
    selected_engines: ['website_audit_intelligence'],
    configured_inputs: { website_url: '', allow_public_fetch: false }
  }]
});

const runGuardedDigitalEngines = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Run Guarded Digital Marketing Engines',
    position: [720, 280],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const ctx = $json;
const inputs = ctx.configured_inputs || {};
const selected = new Set(ctx.selected_engines || []);
const dataPolicy = 'no_fake_live_data';
const asArray = (value) => Array.isArray(value) ? value : [];
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const severityFor = (status) => status === 'success' ? 'info' : status === 'partial_success' ? 'warning' : status === 'failed' ? 'critical' : 'setup';
const normalizeUrl = (value) => {
  if (!hasText(value)) return '';
  const text = value.trim();
  return /^https?:\\/\\//i.test(text) ? text : 'https://' + text;
};
const safeUrlHost = (value) => {
  try { return new URL(normalizeUrl(value)).hostname; } catch (error) { return ''; }
};
const card = (id, title, status, summary, recommendations, sourceEngine) => ({
  id,
  title,
  status,
  severity: severityFor(status),
  summary,
  recommendations: asArray(recommendations),
  source_engine: sourceEngine
});
const baseInputsUsed = () => ({
  website_url_configured: hasText(inputs.website_url),
  public_fetch_enabled: Boolean(inputs.allow_public_fetch),
  google_business_profile_url_configured: hasText(inputs.google_business_profile_url),
  google_business_profile_safe_reference_configured: Boolean(inputs.google_business_profile_safe_reference_configured),
  target_locations_count: asArray(inputs.target_locations).length,
  service_keywords_count: asArray(inputs.service_keywords).length,
  competitor_websites_count: asArray(inputs.competitor_websites).length,
  review_platforms_count: asArray(inputs.review_platforms).length,
  campaign_inputs_count: asArray(inputs.active_offers).length + asArray(inputs.seasonal_campaigns).length + asArray(inputs.campaign_goals).length
});
const finalize = (engineName, payload) => {
  const status = payload.status || 'skipped_missing_config';
  const recommendations = asArray(payload.recommendations);
  return {
    client_slug: ctx.client_slug,
    engine_name: engineName,
    status,
    data_policy: dataPolicy,
    inputs_used: { ...baseInputsUsed(), ...(payload.inputs_used || {}) },
    findings: asArray(payload.findings),
    recommendations,
    next_actions: asArray(payload.next_actions),
    frontend_cards: payload.frontend_cards || [card(engineName + '_card', payload.title || engineName, status, payload.summary || '', recommendations, engineName)],
    test_mode: ctx.test_mode === true,
    writes_disabled: true,
    summary: payload.summary || '',
    remaining_config_needed: asArray(payload.remaining_config_needed)
  };
};
const skip = (engineName, summary, missing) => finalize(engineName, {
  status: 'skipped_missing_config',
  summary,
  findings: [],
  recommendations: ['Configure real public source inputs or approved APIs before enabling this engine beyond guarded test mode.'],
  next_actions: missing,
  remaining_config_needed: missing
});
const publicWebsiteCheck = async (url) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false, reason: 'missing_url', url: '' };
  if (!inputs.allow_public_fetch) return { ok: false, reason: 'public_fetch_disabled', url: normalized };
  try {
    const response = await fetch(normalized, { method: 'GET', redirect: 'follow' });
    const text = await response.text();
    return {
      ok: response.ok,
      status_code: response.status,
      url: normalized,
      host: safeUrlHost(normalized),
      title_present: /<title[^>]*>\\s*[^<]+\\s*<\\/title>/i.test(text),
      meta_description_present: /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+/i.test(text),
      h1_present: /<h1\\b/i.test(text),
      body_sample_size: Math.min(text.length, 5000)
    };
  } catch (error) {
    return { ok: false, reason: 'public_fetch_failed', url: normalized };
  }
};
const engines = [];
if (selected.has('google_business_profile_intelligence')) {
  if (!hasText(inputs.google_business_profile_url) && !inputs.google_business_profile_safe_reference_configured) {
    engines.push(skip('google_business_profile_intelligence', 'GBP intelligence skipped because no public profile URL or safe credential reference is configured.', ['google_business_profile_url or safe credential reference']));
  } else {
    engines.push(finalize('google_business_profile_intelligence', {
      status: hasText(inputs.google_business_profile_url) ? 'partial_success' : 'skipped_missing_config',
      summary: hasText(inputs.google_business_profile_url) ? 'Public GBP profile reference is configured; no live performance metrics were requested.' : 'Safe reference exists, but the live GBP adapter is disabled in this guarded test workflow.',
      findings: hasText(inputs.google_business_profile_url) ? ['GBP public URL configured: ' + safeUrlHost(inputs.google_business_profile_url)] : [],
      recommendations: ['Use an approved GBP API adapter before reporting calls, views, direction requests, searches, or profile performance.'],
      next_actions: ['Keep GBP live metrics disabled until safe API configuration is verified.'],
      inputs_used: { live_gbp_adapter_enabled: false }
    }));
  }
}
if (selected.has('website_audit_intelligence')) {
  if (!hasText(inputs.website_url)) {
    engines.push(skip('website_audit_intelligence', 'Website audit skipped because website_url is missing.', ['website_url']));
  } else {
    const check = await publicWebsiteCheck(inputs.website_url);
    const status = check.ok ? 'partial_success' : 'skipped_missing_config';
    engines.push(finalize('website_audit_intelligence', {
      status,
      summary: check.ok ? 'Public website check completed with basic page-readiness signals.' : 'Website URL is configured, but public fetch is disabled or unavailable.',
      findings: check.ok ? [
        'Website host checked: ' + check.host,
        'Title present: ' + String(check.title_present),
        'Meta description present: ' + String(check.meta_description_present),
        'H1 present: ' + String(check.h1_present)
      ] : ['No website content was fetched in this guarded run.'],
      recommendations: ['Review title, meta description, H1, service clarity, trust signals, and appointment CTA placement.'],
      next_actions: ['Set allow_public_fetch=true for public website-only checks, or keep skipped status for no-network dry runs.'],
      inputs_used: { website_url: normalizeUrl(inputs.website_url), public_fetch_result: check.reason || check.status_code || 'not_run' }
    }));
  }
}
if (selected.has('seo_intelligence')) {
  if (!hasText(inputs.website_url) || asArray(inputs.service_keywords).length === 0) {
    engines.push(skip('seo_intelligence', 'SEO intelligence skipped because website_url or service keywords are missing.', ['website_url', 'service_keywords']));
  } else {
    engines.push(finalize('seo_intelligence', {
      status: 'partial_success',
      summary: 'SEO recommendations generated from configured website and service keywords only.',
      findings: ['Configured service keywords: ' + asArray(inputs.service_keywords).slice(0, 10).join(', '), 'No search position, volume, or difficulty was claimed.'],
      recommendations: asArray(inputs.service_keywords).slice(0, 10).map((keyword) => 'Create or improve service page coverage for: ' + keyword),
      next_actions: ['Connect Search Console or approved keyword research source before reporting visibility metrics.']
    }));
  }
}
if (selected.has('competitor_intelligence')) {
  const competitors = asArray(inputs.competitor_websites);
  if (competitors.length === 0) {
    engines.push(skip('competitor_intelligence', 'Competitor intelligence skipped because competitor public websites are missing.', ['competitor_websites']));
  } else {
    engines.push(finalize('competitor_intelligence', {
      status: 'partial_success',
      summary: 'Competitor analysis limited to configured public URLs only.',
      findings: competitors.slice(0, 5).map((url) => 'Configured competitor host: ' + safeUrlHost(url)),
      recommendations: ['Compare visible service coverage, CTA clarity, trust signals, and content themes manually.'],
      next_actions: ['Add approved competitor public sources or APIs before reporting performance metrics.']
    }));
  }
}
if (selected.has('reviews_reputation_intelligence')) {
  if (asArray(inputs.review_platforms).length === 0) {
    engines.push(skip('reviews_reputation_intelligence', 'Reputation intelligence skipped because review platforms are missing.', ['review_platforms']));
  } else {
    engines.push(finalize('reviews_reputation_intelligence', {
      status: 'skipped_missing_config',
      summary: 'Review platforms are configured, but live review adapters are disabled in this guarded test workflow.',
      findings: ['Configured review platforms: ' + asArray(inputs.review_platforms).join(', ')],
      recommendations: ['Prepare review response policies and escalation rules before live review ingestion.'],
      next_actions: ['Connect approved review APIs before reporting counts, ratings, or sentiment.']
    }));
  }
}
if (selected.has('local_seo_intelligence')) {
  if (asArray(inputs.target_locations).length === 0 || asArray(inputs.service_keywords).length === 0) {
    engines.push(skip('local_seo_intelligence', 'Local SEO skipped because target locations or service keywords are missing.', ['target_locations', 'service_keywords']));
  } else {
    const ideas = asArray(inputs.service_keywords).slice(0, 8).flatMap((service) => asArray(inputs.target_locations).slice(0, 5).map((location) => service + ' in ' + location));
    engines.push(finalize('local_seo_intelligence', {
      status: 'success',
      summary: 'Local SEO opportunities generated from configured services and locations only.',
      findings: ['Generated local service-location ideas: ' + ideas.length],
      recommendations: ideas.slice(0, 20),
      next_actions: ['Validate demand with Search Console or approved keyword source before prioritizing by volume.']
    }));
  }
}
if (selected.has('keyword_opportunity_intelligence')) {
  if (asArray(inputs.service_keywords).length === 0) {
    engines.push(skip('keyword_opportunity_intelligence', 'Keyword opportunity skipped because service keywords are missing.', ['service_keywords']));
  } else {
    const keywords = asArray(inputs.service_keywords).slice(0, 12);
    const opportunities = keywords.flatMap((keyword) => [keyword + ' appointment', keyword + ' specialist', 'when to consult for ' + keyword]);
    engines.push(finalize('keyword_opportunity_intelligence', {
      status: 'success',
      summary: 'Keyword opportunities generated from configured services only.',
      findings: ['No keyword volume, difficulty, or search position was claimed.'],
      recommendations: opportunities.slice(0, 30),
      next_actions: ['Connect an approved keyword source before scoring opportunity size.']
    }));
  }
}
if (selected.has('content_gap_intelligence')) {
  if (!hasText(inputs.website_url) && asArray(inputs.service_keywords).length === 0) {
    engines.push(skip('content_gap_intelligence', 'Content gap intelligence skipped because website URL and service keywords are missing.', ['website_url or service_keywords']));
  } else {
    const topics = asArray(inputs.service_keywords).slice(0, 10).flatMap((keyword) => [keyword + ' explained', keyword + ' care process', keyword + ' frequently asked questions']);
    engines.push(finalize('content_gap_intelligence', {
      status: topics.length ? 'success' : 'partial_success',
      summary: 'Content gaps prepared from configured services and public website context only.',
      findings: topics.length ? ['Generated topic candidates: ' + topics.length] : ['Website URL configured without service keywords.'],
      recommendations: topics.length ? topics : ['Add service keywords to generate sharper content gap topics.'],
      next_actions: ['Use actual website crawl or CMS inventory before marking gaps as confirmed.']
    }));
  }
}
if (selected.has('landing_page_conversion_intelligence')) {
  if (!hasText(inputs.website_url)) {
    engines.push(skip('landing_page_conversion_intelligence', 'Landing page intelligence skipped because website_url is missing.', ['website_url']));
  } else {
    engines.push(finalize('landing_page_conversion_intelligence', {
      status: 'partial_success',
      summary: 'Conversion recommendations generated from configured public URL only.',
      findings: ['Website host configured: ' + safeUrlHost(inputs.website_url)],
      recommendations: ['Place appointment, call, or WhatsApp CTA near the top of priority service pages.', 'Add doctor/team credibility, location clarity, and patient-family reassurance near conversion points.'],
      next_actions: ['Connect analytics or form/call tracking before reporting conversion rates.']
    }));
  }
}
if (selected.has('campaign_offer_intelligence')) {
  const campaignInputs = [...asArray(inputs.active_offers), ...asArray(inputs.seasonal_campaigns), ...asArray(inputs.campaign_goals)];
  if (campaignInputs.length === 0) {
    engines.push(skip('campaign_offer_intelligence', 'Campaign intelligence skipped because offers, seasons, or goals are missing.', ['active_offers or seasonal_campaigns or campaign_goals']));
  } else {
    engines.push(finalize('campaign_offer_intelligence', {
      status: 'success',
      summary: 'Campaign ideas generated from configured offers and goals only.',
      findings: ['Configured campaign inputs: ' + campaignInputs.length],
      recommendations: campaignInputs.slice(0, 20).map((item) => 'Build guarded campaign concept around: ' + item),
      next_actions: ['Connect approved performance data before making projection or optimization claims.']
    }));
  }
}
if (selected.has('digital_marketing_strategy_orchestrator')) {
  const readiness = [
    hasText(inputs.website_url),
    asArray(inputs.service_keywords).length > 0,
    asArray(inputs.target_locations).length > 0,
    hasText(inputs.google_business_profile_url) || inputs.google_business_profile_safe_reference_configured,
    asArray(inputs.competitor_websites).length > 0,
    asArray(inputs.review_platforms).length > 0,
    asArray(inputs.active_offers).length + asArray(inputs.seasonal_campaigns).length + asArray(inputs.campaign_goals).length > 0
  ];
  const configuredCount = readiness.filter(Boolean).length;
  engines.push(finalize('digital_marketing_strategy_orchestrator', {
    status: configuredCount ? 'partial_success' : 'skipped_missing_config',
    summary: 'Strategy summary generated from configured inputs and guarded engine outputs only.',
    findings: ['Configured readiness signals: ' + configuredCount + ' of ' + readiness.length],
    recommendations: ['Complete missing config fields before automation rollout.', 'Keep live platform and review APIs disabled until approved adapters are configured.'],
    next_actions: ['Review remaining_config_needed and rerun this manual guarded test.'],
    inputs_used: { configured_readiness_count: configuredCount },
    remaining_config_needed: [
      !hasText(inputs.website_url) ? 'website_url' : '',
      asArray(inputs.service_keywords).length === 0 ? 'service_keywords' : '',
      asArray(inputs.target_locations).length === 0 ? 'target_locations' : '',
      !hasText(inputs.google_business_profile_url) && !inputs.google_business_profile_safe_reference_configured ? 'google_business_profile_url or safe reference' : '',
      asArray(inputs.competitor_websites).length === 0 ? 'competitor_websites' : '',
      asArray(inputs.review_platforms).length === 0 ? 'review_platforms' : '',
      asArray(inputs.active_offers).length + asArray(inputs.seasonal_campaigns).length + asArray(inputs.campaign_goals).length === 0 ? 'campaign inputs' : ''
    ].filter(Boolean)
  }));
}
const frontendCards = engines.flatMap((result) => result.frontend_cards || []);
const skipped = engines.filter((result) => result.status === 'skipped_missing_config').map((result) => result.engine_name);
const remaining = [...new Set(engines.flatMap((result) => result.remaining_config_needed || []))];
const strategy = engines.find((result) => result.engine_name === 'digital_marketing_strategy_orchestrator');
return {
  json: {
    workflow_name: ctx.workflow_name,
    client_slug: ctx.client_slug,
    test_mode: ctx.test_mode === true,
    writes_disabled: true,
    allow_test_writes: ctx.allow_test_writes === true,
    engines_run: engines.map((result) => result.engine_name),
    engines_skipped: skipped,
    engine_results: engines,
    frontend_cards: frontendCards,
    strategy_summary: strategy?.summary || 'Digital marketing strategy engine was not selected.',
    readiness_status: remaining.length ? 'partial_configuration' : 'guarded_test_ready',
    remaining_config_needed: remaining,
    data_policy: dataPolicy,
    write_policy: ctx.disable_writes === false && ctx.allow_test_writes === true ? 'test_writes_requested_but_no_database_nodes_in_variant' : 'writes_disabled_no_database_nodes'
  }
};`
    }
  },
  output: [{
    workflow_name: 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test',
    client_slug: 'aayu_geriatrics',
    test_mode: true,
    writes_disabled: true,
    engines_run: ['website_audit_intelligence'],
    engines_skipped: ['website_audit_intelligence'],
    engine_results: [],
    frontend_cards: [],
    strategy_summary: 'Digital marketing strategy engine was not selected.',
    readiness_status: 'partial_configuration',
    remaining_config_needed: ['website_url'],
    data_policy: 'no_fake_live_data'
  }]
});

const safetyNote = sticky('## Guarded Test Variant\\nManual trigger only. No schedule trigger, webhook trigger, daily wrapper connection, credential nodes, or database write nodes. Default input uses test_mode=true and disable_writes=true.', [manualTrigger, normalizeTestInput, runGuardedDigitalEngines], { color: 3 });

export default workflow('vip-digital-marketing-guarded-test', 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test')
  .add(safetyNote)
  .add(manualTrigger)
  .to(normalizeTestInput)
  .to(runGuardedDigitalEngines);
