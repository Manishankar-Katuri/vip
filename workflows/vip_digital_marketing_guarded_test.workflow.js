import { workflow, node, trigger, sticky } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Manual Trigger - Guarded Digital Test',
    position: [120, 280]
  },
  output: [{
    client_slug: 'aayu_geriatrics',
    engine: 'all',
    test_mode: true,
    disable_writes: true,
    allow_public_fetch: false
  }]
});

const runGuardedTest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Run Guarded Digital Marketing Dry Run',
    position: [460, 280],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const input = $json.body || $json || {};
const workflowName = 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test';
const allEngines = [
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
const toBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};
const asArray = (value) => {
  if (Array.isArray(value)) return value.filter((item) => String(item || '').trim());
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const clientSlug = input.client_slug || input.client_id || 'aayu_geriatrics';
const requested = input.engine && input.engine !== 'all' ? asArray(input.engine) : allEngines;
const selected = requested.filter((engine) => allEngines.includes(engine));
const enginesToRun = selected.length ? selected : allEngines;
const config = {
  website_url: input.website_url || '',
  google_business_profile_url: input.google_business_profile_url || input.gbp_url || '',
  google_business_profile_safe_reference_configured: Boolean(input.google_business_profile_credential_env_key || input.gbp_safe_reference_configured),
  service_keywords: asArray(input.service_keywords || input.priority_services),
  target_locations: asArray(input.target_locations || input.location),
  competitor_websites: asArray(input.competitor_websites),
  review_platforms: asArray(input.review_platforms),
  active_offers: asArray(input.active_offers),
  seasonal_campaigns: asArray(input.seasonal_campaigns),
  campaign_goals: asArray(input.campaign_goals),
  allow_public_fetch: toBool(input.allow_public_fetch, false)
};
const dataPolicy = 'no_fake_live_data';
const baseInputsUsed = () => ({
  website_url_configured: hasText(config.website_url),
  google_business_profile_url_configured: hasText(config.google_business_profile_url),
  google_business_profile_safe_reference_configured: config.google_business_profile_safe_reference_configured,
  service_keywords_count: config.service_keywords.length,
  target_locations_count: config.target_locations.length,
  competitor_websites_count: config.competitor_websites.length,
  review_platforms_count: config.review_platforms.length,
  campaign_inputs_count: config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length,
  public_fetch_enabled: false,
  live_platform_apis_enabled: false,
  database_writes_enabled: false
});
const severityFor = (status) => status === 'success' ? 'info' : status === 'partial_success' ? 'warning' : 'setup';
const card = (engineName, status, summary, recommendations) => ({
  id: engineName + '_card',
  title: engineName.replace(/_/g, ' '),
  status,
  severity: severityFor(status),
  summary,
  recommendations,
  source_engine: engineName
});
const result = (engineName, status, summary, findings, recommendations, nextActions, missing = []) => ({
  client_slug: clientSlug,
  engine_name: engineName,
  status,
  data_policy: dataPolicy,
  inputs_used: baseInputsUsed(),
  findings,
  recommendations,
  next_actions: nextActions,
  frontend_cards: [card(engineName, status, summary, recommendations)],
  test_mode: true,
  writes_disabled: true,
  summary,
  remaining_config_needed: missing
});
const skip = (engineName, summary, missing) => result(
  engineName,
  'skipped_missing_config',
  summary,
  [],
  ['Configure real public inputs or approved APIs before enabling this engine beyond guarded test mode.'],
  missing,
  missing
);
const engineResults = [];
if (enginesToRun.includes('google_business_profile_intelligence')) {
  if (!hasText(config.google_business_profile_url) && !config.google_business_profile_safe_reference_configured) {
    engineResults.push(skip('google_business_profile_intelligence', 'GBP intelligence skipped because no public profile URL or safe reference is configured.', ['google_business_profile_url or safe reference']));
  } else {
    engineResults.push(result('google_business_profile_intelligence', 'partial_success', 'GBP configuration is present, but live GBP metrics are disabled in this dry run.', ['No calls, views, searches, directions, or ranking metrics were requested.'], ['Connect an approved GBP adapter before reporting GBP performance.'], ['Keep GBP live metrics disabled until approved.']));
  }
}
if (enginesToRun.includes('website_audit_intelligence')) {
  if (!hasText(config.website_url)) engineResults.push(skip('website_audit_intelligence', 'Website audit skipped because website_url is missing.', ['website_url']));
  else engineResults.push(result('website_audit_intelligence', 'partial_success', 'Website URL is configured; no public fetch was performed because allow_public_fetch is false.', ['No website content was fetched in this dry run.'], ['Enable an approved public website check only when needed.'], ['Keep dry-run mode for no-network validation.']));
}
if (enginesToRun.includes('seo_intelligence')) {
  if (!hasText(config.website_url) || config.service_keywords.length === 0) engineResults.push(skip('seo_intelligence', 'SEO intelligence skipped because website_url or service keywords are missing.', ['website_url', 'service_keywords']));
  else engineResults.push(result('seo_intelligence', 'partial_success', 'SEO guidance generated from configured inputs only.', ['No rankings, keyword volume, or difficulty were claimed.'], config.service_keywords.slice(0, 10).map((item) => 'Prepare service-page coverage for: ' + item), ['Connect approved Search Console or keyword data before reporting visibility metrics.']));
}
if (enginesToRun.includes('competitor_intelligence')) {
  if (config.competitor_websites.length === 0) engineResults.push(skip('competitor_intelligence', 'Competitor intelligence skipped because competitor websites are missing.', ['competitor_websites']));
  else engineResults.push(result('competitor_intelligence', 'partial_success', 'Competitor inputs are configured; no competitor performance data was fetched or inferred.', config.competitor_websites.slice(0, 5).map((item) => 'Configured competitor source: ' + item), ['Compare visible service coverage and trust signals manually.'], ['Use approved public checks or APIs before reporting competitor metrics.']));
}
if (enginesToRun.includes('reviews_reputation_intelligence')) {
  if (config.review_platforms.length === 0) engineResults.push(skip('reviews_reputation_intelligence', 'Review intelligence skipped because review platforms are missing.', ['review_platforms']));
  else engineResults.push(result('reviews_reputation_intelligence', 'skipped_missing_config', 'Review platforms are configured, but live review adapters are disabled.', ['No review counts, ratings, or sentiment were fabricated.'], ['Prepare review response policy and escalation rules.'], ['Connect approved review APIs before reporting review metrics.'], ['approved review API adapter']));
}
if (enginesToRun.includes('local_seo_intelligence')) {
  if (config.target_locations.length === 0 || config.service_keywords.length === 0) engineResults.push(skip('local_seo_intelligence', 'Local SEO skipped because target locations or service keywords are missing.', ['target_locations', 'service_keywords']));
  else engineResults.push(result('local_seo_intelligence', 'success', 'Local SEO ideas generated from configured services and locations only.', ['Generated configured service-location combinations without ranking claims.'], config.service_keywords.slice(0, 8).flatMap((service) => config.target_locations.slice(0, 4).map((location) => service + ' in ' + location)), ['Validate demand with approved search data before prioritizing.']));
}
if (enginesToRun.includes('keyword_opportunity_intelligence')) {
  if (config.service_keywords.length === 0) engineResults.push(skip('keyword_opportunity_intelligence', 'Keyword opportunity skipped because service keywords are missing.', ['service_keywords']));
  else engineResults.push(result('keyword_opportunity_intelligence', 'success', 'Keyword ideas generated from configured services only.', ['No keyword volume, rank, or difficulty was claimed.'], config.service_keywords.slice(0, 10).flatMap((item) => [item + ' appointment', item + ' specialist', 'when to consult for ' + item]), ['Connect approved keyword data before scoring opportunity size.']));
}
if (enginesToRun.includes('content_gap_intelligence')) {
  if (!hasText(config.website_url) && config.service_keywords.length === 0) engineResults.push(skip('content_gap_intelligence', 'Content gap intelligence skipped because website URL and service keywords are missing.', ['website_url or service_keywords']));
  else engineResults.push(result('content_gap_intelligence', 'partial_success', 'Content topics generated from configured inputs only.', ['No crawl or CMS inventory was performed in dry-run mode.'], config.service_keywords.slice(0, 8).flatMap((item) => [item + ' explained', item + ' care process', item + ' frequently asked questions']), ['Use an approved crawl or CMS inventory before marking gaps as confirmed.']));
}
if (enginesToRun.includes('landing_page_conversion_intelligence')) {
  if (!hasText(config.website_url)) engineResults.push(skip('landing_page_conversion_intelligence', 'Landing page intelligence skipped because website_url is missing.', ['website_url']));
  else engineResults.push(result('landing_page_conversion_intelligence', 'partial_success', 'Conversion guidance generated from configured website URL only.', ['No analytics, form, call, or conversion-rate data was fetched.'], ['Place appointment, call, or WhatsApp CTA near the top of service pages.', 'Add doctor/team credibility, location clarity, and reassurance near conversion points.'], ['Connect approved analytics before reporting conversion performance.']));
}
if (enginesToRun.includes('campaign_offer_intelligence')) {
  const campaignInputs = [...config.active_offers, ...config.seasonal_campaigns, ...config.campaign_goals];
  if (campaignInputs.length === 0) engineResults.push(skip('campaign_offer_intelligence', 'Campaign intelligence skipped because offers, seasons, or goals are missing.', ['active_offers or seasonal_campaigns or campaign_goals']));
  else engineResults.push(result('campaign_offer_intelligence', 'success', 'Campaign ideas generated from configured offers and goals only.', ['No campaign projection or performance estimate was generated.'], campaignInputs.slice(0, 20).map((item) => 'Build guarded campaign concept around: ' + item), ['Connect approved performance data before optimizing offers.']));
}
if (enginesToRun.includes('digital_marketing_strategy_orchestrator')) {
  const readinessSignals = [hasText(config.website_url), config.service_keywords.length > 0, config.target_locations.length > 0, hasText(config.google_business_profile_url) || config.google_business_profile_safe_reference_configured, config.competitor_websites.length > 0, config.review_platforms.length > 0, config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length > 0];
  const missing = [
    hasText(config.website_url) ? '' : 'website_url',
    config.service_keywords.length ? '' : 'service_keywords',
    config.target_locations.length ? '' : 'target_locations',
    hasText(config.google_business_profile_url) || config.google_business_profile_safe_reference_configured ? '' : 'google_business_profile_url or safe reference',
    config.competitor_websites.length ? '' : 'competitor_websites',
    config.review_platforms.length ? '' : 'review_platforms',
    config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length ? '' : 'campaign inputs'
  ].filter(Boolean);
  engineResults.push(result('digital_marketing_strategy_orchestrator', readinessSignals.some(Boolean) ? 'partial_success' : 'skipped_missing_config', 'Strategy dry run completed from configured inputs only.', ['Configured readiness signals: ' + readinessSignals.filter(Boolean).length + ' of ' + readinessSignals.length], ['Complete missing config fields before automation rollout.', 'Keep live platform APIs disabled until approved adapters are configured.'], ['Review remaining_config_needed and rerun this manual test.'], missing));
}
const frontendCards = engineResults.flatMap((item) => item.frontend_cards);
const skipped = engineResults.filter((item) => item.status === 'skipped_missing_config').map((item) => item.engine_name);
const remaining = [...new Set(engineResults.flatMap((item) => item.remaining_config_needed))];
return {
  json: {
    workflow_name: workflowName,
    client_slug: clientSlug,
    test_mode: true,
    writes_disabled: true,
    allow_public_fetch: false,
    engines_run: engineResults.map((item) => item.engine_name),
    engines_skipped: skipped,
    engine_results: engineResults,
    frontend_cards: frontendCards,
    strategy_summary: 'Dry-run strategy summary uses configured inputs only and makes no fake live-data claims.',
    readiness_status: remaining.length ? 'partial_configuration' : 'guarded_test_ready',
    remaining_config_needed: remaining,
    data_policy: dataPolicy,
    write_policy: 'writes_disabled_no_database_nodes',
    network_policy: 'no_network_fetch_no_http_nodes',
    platform_api_policy: 'no_live_platform_api_nodes'
  }
};`
    }
  },
  output: [{
    workflow_name: 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test',
    client_slug: 'aayu_geriatrics',
    test_mode: true,
    writes_disabled: true,
    allow_public_fetch: false,
    engines_run: ['google_business_profile_intelligence'],
    engines_skipped: ['google_business_profile_intelligence'],
    engine_results: [],
    frontend_cards: [],
    strategy_summary: 'Dry-run strategy summary uses configured inputs only and makes no fake live-data claims.',
    readiness_status: 'partial_configuration',
    remaining_config_needed: ['website_url'],
    data_policy: 'no_fake_live_data'
  }]
});

const safetyNote = sticky('## Guarded Test Variant\\nManual trigger only. No schedule trigger, webhook trigger, daily wrapper connection, credential nodes, HTTP nodes, or database write nodes. Default input uses test_mode=true and disable_writes=true.', [manualTrigger, runGuardedTest], { color: 3 });

export default workflow('vip-digital-marketing-guarded-test', 'VIP Digital Marketing Intelligence Orchestrator - Guarded Test')
  .add(safetyNote)
  .add(manualTrigger)
  .to(runGuardedTest);
