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
const testMode = toBool(input.test_mode, true);
const writesDisabled = toBool(input.disable_writes, true);
const requested = input.engine && input.engine !== 'all' ? asArray(input.engine) : allEngines;
const selected = requested.filter((engine) => allEngines.includes(engine));
const enginesToRun = selected.length ? selected : allEngines;
const config = {
  website_url: input.website_url || '',
  primary_domain: input.primary_domain || '',
  google_business_profile_url: input.google_business_profile_url || input.gbp_url || '',
  google_business_profile_safe_reference_configured: Boolean(input.google_business_profile_credential_env_key || input.gbp_safe_reference_configured),
  service_keywords: [...new Set([...asArray(input.service_keywords), ...asArray(input.priority_services)])],
  priority_services: asArray(input.priority_services || input.service_keywords),
  target_locations: asArray(input.target_locations || input.location),
  competitor_names: asArray(input.competitor_names),
  competitor_websites: asArray(input.competitor_websites),
  review_platforms: asArray(input.review_platforms),
  active_offers: asArray(input.active_offers),
  seasonal_campaigns: asArray(input.seasonal_campaigns),
  campaign_goals: asArray(input.campaign_goals),
  allow_public_fetch: toBool(input.allow_public_fetch, false)
};
const dataPolicy = 'no_fake_live_data';
const dashboardSections = {
  google_business_profile_intelligence: 'GBP',
  website_audit_intelligence: 'Website',
  seo_intelligence: 'SEO',
  competitor_intelligence: 'Competitors',
  reviews_reputation_intelligence: 'Reputation',
  local_seo_intelligence: 'Local SEO',
  keyword_opportunity_intelligence: 'Keywords',
  content_gap_intelligence: 'Content Gaps',
  landing_page_conversion_intelligence: 'Conversion',
  campaign_offer_intelligence: 'Campaigns',
  digital_marketing_strategy_orchestrator: 'Strategy'
};
const titleFor = (engineName) => ({
  google_business_profile_intelligence: 'Google Business Profile readiness',
  website_audit_intelligence: 'Website audit readiness',
  seo_intelligence: 'SEO planning',
  competitor_intelligence: 'Competitor review checklist',
  reviews_reputation_intelligence: 'Reputation readiness',
  local_seo_intelligence: 'Local SEO planning',
  keyword_opportunity_intelligence: 'Keyword clusters',
  content_gap_intelligence: 'Content gap themes',
  landing_page_conversion_intelligence: 'Landing page conversion checklist',
  campaign_offer_intelligence: 'Campaign and offer ideas',
  digital_marketing_strategy_orchestrator: 'Digital strategy summary'
}[engineName] || engineName.replace(/_/g, ' '));
const evidenceFor = (status, extra) => {
  if (extra && extra.public_fetch && extra.public_fetch.fetch_status === 'fetched') return 'public_page_signals';
  if (status === 'skipped_missing_config') return 'insufficient_data';
  return 'configured_input_only';
};
const blockedByFor = (status, missing, extra) => {
  if (extra && extra.public_fetch && extra.public_fetch.guard_failure) return [extra.public_fetch.guard_failure];
  if (status === 'skipped_missing_config') return missing;
  return [];
};
const unique = (items) => [...new Set(items.filter((item) => hasText(item)))];
const firstOr = (items, fallback) => items.length ? items[0] : fallback;
const serviceLocationIdeas = () => config.service_keywords.slice(0, 8).flatMap((service) =>
  (config.target_locations.length ? config.target_locations : ['primary service area']).slice(0, 4)
    .map((location) => service + ' in ' + location)
);
const keywordClusters = () => {
  const services = config.service_keywords.length ? config.service_keywords : ['primary service'];
  const locations = config.target_locations.length ? config.target_locations : ['primary location'];
  const seasons = config.seasonal_campaigns.length ? config.seasonal_campaigns : ['seasonal care'];
  return {
    high_intent: services.slice(0, 6).flatMap((service) => [service + ' appointment', service + ' consultation']),
    local: services.slice(0, 4).flatMap((service) => locations.slice(0, 3).map((location) => service + ' in ' + location)),
    awareness: services.slice(0, 6).map((service) => 'when to consult for ' + service),
    FAQ: services.slice(0, 6).map((service) => service + ' frequently asked questions'),
    seasonal: seasons.slice(0, 5).map((season) => season + ' campaign keywords')
  };
};
const baseInputsUsed = () => ({
  website_url_configured: hasText(config.website_url),
  google_business_profile_url_configured: hasText(config.google_business_profile_url),
  google_business_profile_safe_reference_configured: config.google_business_profile_safe_reference_configured,
  service_keywords_count: config.service_keywords.length,
  target_locations_count: config.target_locations.length,
  competitor_websites_count: config.competitor_websites.length,
  review_platforms_count: config.review_platforms.length,
  campaign_inputs_count: config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length,
  public_fetch_enabled: Boolean(config.allow_public_fetch),
  live_platform_apis_enabled: false,
  database_writes_enabled: false
});
const severityFor = (status) => status === 'success' ? 'info' : status === 'partial_success' ? 'warning' : 'setup';
const card = (engineName, status, summary, recommendations, nextActions, missing, extra) => ({
  id: engineName + '_card',
  source_engine: engineName,
  title: titleFor(engineName),
  status,
  severity: severityFor(status),
  summary,
  recommendations,
  next_actions: nextActions,
  evidence_level: evidenceFor(status, extra),
  data_policy: dataPolicy,
  blocked_by: blockedByFor(status, missing, extra),
  dashboard_section: dashboardSections[engineName] || 'Strategy'
});
const result = (engineName, status, summary, findings, recommendations, nextActions, missing = [], extra = {}) => ({
  client_slug: clientSlug,
  engine_name: engineName,
  status,
  data_policy: dataPolicy,
  inputs_used: baseInputsUsed(),
  findings,
  recommendations,
  next_actions: nextActions,
  frontend_cards: [card(engineName, status, summary, recommendations, nextActions, missing, extra)],
  test_mode: true,
  writes_disabled: true,
  summary,
  remaining_config_needed: missing,
  evidence_level: evidenceFor(status, extra),
  dashboard_section: dashboardSections[engineName] || 'Strategy',
  ...extra
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
const normalizeHost = (value) => String(value || '').trim().toLowerCase().replace(/\.$/, '');
const isIpLiteral = (host) => /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':');
const isPrivateOrInternalHost = (host) => {
  const normalized = normalizeHost(host);
  if (!normalized) return true;
  if (['localhost', 'localhost.localdomain'].includes(normalized)) return true;
  if (normalized.endsWith('.localhost') || normalized.endsWith('.local') || normalized.endsWith('.internal')) return true;
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) return false;
  const parts = normalized.split('.').map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const first = parts[0];
  const second = parts[1];
  return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 100 && second >= 64 && second <= 127);
};
const validatePublicWebsiteUrl = (websiteUrl, primaryDomain) => {
  if (!hasText(websiteUrl)) return { ok: false, reason: 'website_url_missing' };
  const trimmed = String(websiteUrl).trim();
  const parsed = trimmed.match(/^https:\/\/([^/?#]+)([/?#][^\s]*)?$/i);
  if (!parsed) return { ok: false, reason: 'website_url_invalid' };
  const host = normalizeHost(parsed[1].split('@').pop().split(':')[0]);
  const expectedHost = normalizeHost(primaryDomain);
  if (!/^https:\/\//i.test(trimmed)) return { ok: false, reason: 'https_required' };
  if (isIpLiteral(host)) return { ok: false, reason: 'ip_literal_blocked' };
  if (isPrivateOrInternalHost(host)) return { ok: false, reason: 'private_or_internal_host_blocked' };
  if (expectedHost && host !== expectedHost && !host.endsWith('.' + expectedHost)) return { ok: false, reason: 'primary_domain_mismatch' };
  return { ok: true, url: trimmed, host };
};
const readLimitedText = async (response, maxBytes, controller) => {
  if (!response.body || typeof response.body.getReader !== 'function') {
    const text = await response.text();
    return { text: text.slice(0, maxBytes), truncated: text.length > maxBytes };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      truncated = true;
      controller.abort();
      break;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return { text, truncated };
};
const extractWebsiteSignals = (html) => {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const h1 = html.match(/<h1\b[^>]*>/i);
  const h2 = html.match(/<h2\b[^>]*>/i);
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  const visibleText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').toLowerCase();
  return {
    title_present: Boolean(title && title[1].trim()),
    meta_description_present: Boolean(metaDescription && metaDescription[1].trim()),
    h1_present: Boolean(h1),
    h2_present: Boolean(h2),
    canonical_present: Boolean(canonical),
    cta_or_contact_text_present: /\b(book|appointment|contact|call|whatsapp|consult|enquire|schedule)\b/.test(visibleText)
  };
};
const runWebsitePublicFetch = async () => {
  const guards = {
    engine_is_website_audit: enginesToRun.length === 1 && enginesToRun[0] === 'website_audit_intelligence',
    allow_public_fetch: config.allow_public_fetch === true,
    test_mode: testMode === true,
    disable_writes: writesDisabled === true
  };
  if (!Object.values(guards).every(Boolean)) return { fetch_status: 'skipped_guard_not_satisfied', guards };
  const validation = validatePublicWebsiteUrl(config.website_url, config.primary_domain);
  if (!validation.ok) return { fetch_status: 'skipped_invalid_public_url', guard_failure: validation.reason, guards };
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') {
    return { fetch_status: 'network_unavailable_in_test_runtime', validated_url: validation.url, guards };
  }
  const maxBytes = 200000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(validation.url, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,text/plain;q=0.9,*/*;q=0.1',
        'User-Agent': 'VIP-Guarded-Test-WebsiteAudit/1.0'
      }
    });
    const contentType = response.headers && response.headers.get ? String(response.headers.get('content-type') || '') : '';
    const body = contentType.includes('text/html') || contentType.includes('text/plain')
      ? await readLimitedText(response, maxBytes, controller)
      : { text: '', truncated: false };
    return {
      fetch_status: 'fetched',
      http_status: response.status,
      final_url: response.url || validation.url,
      response_content_type: contentType.split(';')[0] || '',
      response_truncated: body.truncated,
      max_response_bytes: maxBytes,
      timeout_ms: 5000,
      redirects: 'manual',
      method: 'GET',
      signals: extractWebsiteSignals(body.text)
    };
  } catch (error) {
    return {
      fetch_status: error && error.name === 'AbortError' ? 'timeout_or_size_limit_reached' : 'fetch_failed',
      error_type: error && error.name ? error.name : 'FetchError',
      timeout_ms: 5000,
      max_response_bytes: maxBytes
    };
  } finally {
    clearTimeout(timeout);
  }
};
const engineResults = [];
if (enginesToRun.includes('google_business_profile_intelligence')) {
  if (!hasText(config.google_business_profile_url) && !config.google_business_profile_safe_reference_configured) {
    engineResults.push(skip('google_business_profile_intelligence', 'GBP intelligence skipped because no public profile URL or safe reference is configured.', ['google_business_profile_url or safe reference']));
  } else {
    engineResults.push(result('google_business_profile_intelligence', 'partial_success', 'GBP configuration is present, but live GBP metrics are disabled in this dry run.', ['No calls, views, searches, directions, or ranking metrics were requested.'], ['Verify public profile name, category, address/service area, hours, phone, website link, services, photos, and appointment path.', 'Prepare a weekly public-profile checklist before enabling approved GBP adapters.'], ['Keep GBP live metrics disabled until approved.', 'Confirm the configured GBP URL opens the intended public profile.']));
  }
}
if (enginesToRun.includes('website_audit_intelligence')) {
  if (!hasText(config.website_url)) engineResults.push(skip('website_audit_intelligence', 'Website audit skipped because website_url is missing.', ['website_url']));
  else if (!config.allow_public_fetch) engineResults.push(result('website_audit_intelligence', 'partial_success', 'Website URL is configured; no public fetch was performed because allow_public_fetch is false.', ['No website content was fetched in this dry run.', 'Configured website URL: ' + config.website_url, 'Configured primary domain: ' + (config.primary_domain || 'not provided')], ['Manually verify homepage title, meta description, H1, service navigation, contact path, appointment CTA, WhatsApp/call access, and trust signals.', 'Use opt-in public fetch only for safe page-level checks, not SEO scoring or performance claims.'], ['Keep dry-run mode for no-network validation.', 'Set allow_public_fetch=true only for a specific Website Audit test.'], [], { fetch_status: 'disabled_by_default' }));
  else {
    const fetchAudit = await runWebsitePublicFetch();
    const fetched = fetchAudit.fetch_status === 'fetched';
    const safeUnavailable = fetchAudit.fetch_status === 'network_unavailable_in_test_runtime';
    const summary = fetched
      ? 'Website public fetch completed with safe page-level signals only.'
      : safeUnavailable
        ? 'Website public fetch was requested, but network fetch is unavailable in this test runtime.'
        : 'Website public fetch was skipped or failed safely.';
    engineResults.push(result(
      'website_audit_intelligence',
      fetched ? 'success' : 'partial_success',
      summary,
      ['No rankings, performance scores, analytics, conversion rates, or hidden metrics were claimed.'],
      ['Use these signals only as public page checks, not SEO or performance metrics.'],
      ['Keep allow_public_fetch disabled unless a specific public website check is intended.'],
      [],
      { public_fetch: fetchAudit }
    ));
  }
}
if (enginesToRun.includes('seo_intelligence')) {
  if (!hasText(config.website_url) || config.service_keywords.length === 0) engineResults.push(skip('seo_intelligence', 'SEO intelligence skipped because website_url or service keywords are missing.', ['website_url', 'service_keywords']));
  else engineResults.push(result('seo_intelligence', 'partial_success', 'SEO guidance generated from configured inputs only.', ['No rankings, keyword volume, or difficulty were claimed.'], unique([
    ...config.service_keywords.slice(0, 8).map((item) => 'Map a dedicated service section or page for: ' + item),
    ...serviceLocationIdeas().slice(0, 8).map((item) => 'Add local relevance copy for: ' + item),
    'Review title tags, meta descriptions, internal links, schema candidates, and appointment CTAs for priority services.'
  ]), ['Connect approved Search Console or keyword data before reporting visibility metrics.', 'Prioritize service pages using business priority, not unverified search volume.']));
}
if (enginesToRun.includes('competitor_intelligence')) {
  if (config.competitor_websites.length === 0) engineResults.push(skip('competitor_intelligence', 'Competitor intelligence skipped because competitor websites are missing.', ['competitor_websites']));
  else engineResults.push(result('competitor_intelligence', 'partial_success', 'Competitor inputs are configured; no competitor performance data was fetched or inferred.', config.competitor_websites.slice(0, 5).map((item, index) => 'Configured competitor source: ' + (config.competitor_names[index] || 'Competitor ' + (index + 1)) + ' - ' + item), ['Review competitor homepage promise, service menu, doctor/team credibility, appointment path, location clarity, FAQ depth, and trust signals.', 'Capture visible differentiators manually before creating positioning recommendations.'], ['Use approved public checks or APIs before reporting competitor metrics.', 'Keep competitor notes as qualitative checklist items until real public checks are configured.']));
}
if (enginesToRun.includes('reviews_reputation_intelligence')) {
  if (config.review_platforms.length === 0) engineResults.push(skip('reviews_reputation_intelligence', 'Review intelligence skipped because review platforms are missing.', ['review_platforms']));
  else engineResults.push(result('reviews_reputation_intelligence', 'skipped_missing_config', 'Review platforms are configured, but live review adapters are disabled.', ['No review counts, ratings, or sentiment were fabricated.'], ['Collect official review links for each configured platform.', 'Create a review response policy with approval owners.', 'Define escalation categories for clinical, billing, appointment, and privacy-sensitive feedback.', 'Prepare a weekly manual review queue until approved review APIs are connected.'], ['Connect approved review APIs before reporting review metrics.', 'Confirm who approves public responses before automation.'], ['approved review API adapter']));
}
if (enginesToRun.includes('local_seo_intelligence')) {
  if (config.target_locations.length === 0 || config.service_keywords.length === 0) engineResults.push(skip('local_seo_intelligence', 'Local SEO skipped because target locations or service keywords are missing.', ['target_locations', 'service_keywords']));
  else engineResults.push(result('local_seo_intelligence', 'success', 'Local SEO ideas generated from configured services and locations only.', ['Generated configured service-location combinations without ranking claims.'], [...serviceLocationIdeas().slice(0, 16).map((item) => 'Create or improve landing coverage for: ' + item), 'Check citations/profiles for consistent name, address/service area, phone, hours, website URL, service categories, and appointment link.'], ['Validate demand with approved search data before prioritizing.', 'Use configured locations to build a profile/citation cleanup checklist.']));
}
if (enginesToRun.includes('keyword_opportunity_intelligence')) {
  if (config.service_keywords.length === 0) engineResults.push(skip('keyword_opportunity_intelligence', 'Keyword opportunity skipped because service keywords are missing.', ['service_keywords']));
  else engineResults.push(result('keyword_opportunity_intelligence', 'success', 'Keyword clusters generated from configured services only.', ['No keyword volume, rank, or difficulty was claimed.'], ['Build clusters for high_intent, local, awareness, FAQ, and seasonal topics.', 'Use clusters to brief pages and posts before connecting approved keyword scoring.'], ['Connect approved keyword data before scoring opportunity size.'], [], { keyword_clusters: keywordClusters() }));
}
if (enginesToRun.includes('content_gap_intelligence')) {
  if (!hasText(config.website_url) && config.service_keywords.length === 0) engineResults.push(skip('content_gap_intelligence', 'Content gap intelligence skipped because website URL and service keywords are missing.', ['website_url or service_keywords']));
  else engineResults.push(result('content_gap_intelligence', 'partial_success', 'Content themes generated from configured inputs only.', ['No crawl or CMS inventory was performed in dry-run mode.'], ['Caregiver education: ' + config.service_keywords.slice(0, 5).map((item) => 'supporting a patient with ' + item).join('; '), 'Trust-building: doctor/team story, care process, safety, follow-up, and family reassurance.', 'Service explainers: ' + config.service_keywords.slice(0, 5).map((item) => item + ' explained').join('; '), 'FAQ: ' + config.service_keywords.slice(0, 5).map((item) => 'common questions about ' + item).join('; '), 'Campaign content: ' + [...config.campaign_goals, ...config.seasonal_campaigns].slice(0, 6).join('; ')], ['Use an approved crawl or CMS inventory before marking gaps as confirmed.', 'Separate educational, trust, service, FAQ, and campaign briefs in the content plan.']));
}
if (enginesToRun.includes('landing_page_conversion_intelligence')) {
  if (!hasText(config.website_url)) engineResults.push(skip('landing_page_conversion_intelligence', 'Landing page intelligence skipped because website_url is missing.', ['website_url']));
  else engineResults.push(result('landing_page_conversion_intelligence', 'partial_success', 'Conversion checklist generated from configured website and service priorities only.', ['No analytics, form, call, or conversion-rate data was fetched.'], ['CTA: make appointment booking visible near the top of priority service pages.', 'WhatsApp/call: expose one-tap contact paths on mobile.', 'Trust signals: add reviews policy-safe proof, accreditations, facility photos, and family reassurance.', 'Doctor/team credibility: show clinical expertise near service decisions.', 'Service page clarity: explain who the service is for, when to consult, process, location, and next step.'], ['Connect approved analytics before reporting conversion performance.', 'Review priority pages for the configured services: ' + config.priority_services.slice(0, 6).join(', ')]));
}
if (enginesToRun.includes('campaign_offer_intelligence')) {
  const campaignInputs = [...config.active_offers, ...config.seasonal_campaigns, ...config.campaign_goals];
  if (campaignInputs.length === 0) engineResults.push(skip('campaign_offer_intelligence', 'Campaign intelligence skipped because offers, seasons, or goals are missing.', ['active_offers or seasonal_campaigns or campaign_goals']));
  else engineResults.push(result('campaign_offer_intelligence', 'success', 'Campaign ideas generated from configured offers and goals only.', ['No campaign projection or performance estimate was generated.'], unique([
    ...config.active_offers.slice(0, 6).map((item) => 'Offer-led campaign: ' + item + ' with service-page CTA and follow-up workflow.'),
    ...config.seasonal_campaigns.slice(0, 6).map((item) => 'Seasonal campaign: ' + item + ' with caregiver education and appointment prompt.'),
    ...config.campaign_goals.slice(0, 6).map((item) => 'Goal-led campaign: ' + item + ' using configured services and locations.'),
    ...serviceLocationIdeas().slice(0, 4).map((item) => 'Local campaign angle: ' + item)
  ]), ['Connect approved performance data before optimizing offers.', 'Keep campaign outputs as concepts until real campaign metrics are available.']));
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
  const strategyRecommendations = unique([
    hasText(config.website_url) ? 'Start with website and conversion readiness for ' + config.website_url + '.' : '',
    config.service_keywords.length ? 'Build service-led SEO and content briefs for: ' + config.service_keywords.slice(0, 5).join(', ') + '.' : '',
    config.target_locations.length ? 'Create local landing/profile work for: ' + config.target_locations.slice(0, 5).join(', ') + '.' : '',
    config.competitor_websites.length ? 'Run a qualitative competitor checklist before positioning changes.' : '',
    config.review_platforms.length ? 'Prepare reputation workflow before review adapters are enabled.' : '',
    config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length ? 'Turn configured offers, seasons, and goals into campaign briefs without projections.' : ''
  ]);
  engineResults.push(result('digital_marketing_strategy_orchestrator', readinessSignals.some(Boolean) ? 'partial_success' : 'skipped_missing_config', 'Strategy dry run completed from configured inputs only.', ['Configured readiness signals: ' + readinessSignals.filter(Boolean).length + ' of ' + readinessSignals.length, 'Strategy score is insufficient_data because no live evidence-backed scoring is enabled.'], strategyRecommendations.length ? strategyRecommendations : ['Complete missing config fields before automation rollout.', 'Keep live platform APIs disabled until approved adapters are configured.'], ['Review remaining_config_needed and rerun this manual test.', 'Use the next 7-day actions from strategy_summary before enabling live adapters.'], missing, { strategy_evidence_status: 'insufficient_data' }));
}
const frontendCards = engineResults.flatMap((item) => item.frontend_cards);
const skipped = engineResults.filter((item) => item.status === 'skipped_missing_config').map((item) => item.engine_name);
const remaining = [...new Set(engineResults.flatMap((item) => item.remaining_config_needed))];
const sectionReadiness = Object.fromEntries(Object.entries(dashboardSections).map(([engine, section]) => {
  const resultForSection = engineResults.find((item) => item.engine_name === engine);
  return [section, {
    engine,
    status: resultForSection ? resultForSection.status : 'not_selected',
    evidence_level: resultForSection ? resultForSection.evidence_level : 'not_selected',
    blocked_by: resultForSection ? resultForSection.frontend_cards[0].blocked_by : []
  }];
}));
const topGrowthOpportunities = unique([
  config.service_keywords.length ? 'Build service pages and content around: ' + config.service_keywords.slice(0, 5).join(', ') : '',
  serviceLocationIdeas().length ? 'Create local service coverage for: ' + serviceLocationIdeas().slice(0, 5).join('; ') : '',
  config.active_offers.length ? 'Package active offers into guarded campaign briefs: ' + config.active_offers.slice(0, 4).join(', ') : '',
  config.seasonal_campaigns.length ? 'Plan seasonal caregiver education around: ' + config.seasonal_campaigns.slice(0, 4).join(', ') : '',
  hasText(config.website_url) ? 'Improve website CTA, trust, and service clarity for the configured domain.' : ''
]);
const urgentFixes = unique([
  ...remaining.map((item) => 'Configure ' + item + '.'),
  hasText(config.website_url) ? 'Manually verify website title, H1, service navigation, appointment CTA, and contact path.' : '',
  config.review_platforms.length ? 'Define review response approval and escalation categories before enabling review automation.' : ''
]);
const next7DayActions = unique([
  'Keep writes disabled and live platform APIs off until approved adapters are configured.',
  hasText(config.website_url) ? 'Day 1: review configured website URL and primary domain for public readiness.' : '',
  config.service_keywords.length ? 'Day 2: map configured services to pages, FAQs, and internal links.' : '',
  config.target_locations.length ? 'Day 3: draft local service-location page ideas.' : '',
  config.competitor_websites.length ? 'Day 4: complete qualitative competitor checklist.' : '',
  config.review_platforms.length ? 'Day 5: prepare review links, response policy, and escalation categories.' : '',
  config.active_offers.length + config.seasonal_campaigns.length + config.campaign_goals.length ? 'Day 6: convert offers, seasons, and goals into campaign briefs.' : '',
  'Day 7: rerun the guarded test and review remaining_config_needed.'
]);
return {
  json: {
    workflow_name: workflowName,
    client_slug: clientSlug,
    test_mode: true,
    writes_disabled: true,
    allow_public_fetch: config.allow_public_fetch,
    engines_run: engineResults.map((item) => item.engine_name),
    engines_skipped: skipped,
    engine_results: engineResults,
    frontend_cards: frontendCards,
    strategy_summary: {
      summary: 'Dry-run strategy summary uses configured inputs only and makes no fake live-data claims.',
      top_growth_opportunities: topGrowthOpportunities,
      urgent_fixes: urgentFixes,
      next_7_day_actions: next7DayActions,
      missing_config: remaining,
      readiness_status: remaining.length ? 'partial_configuration' : 'guarded_test_ready',
      evidence_level: 'configured_input_only',
      scoring_status: 'insufficient_data'
    },
    readiness_status: {
      overall: remaining.length ? 'partial_configuration' : 'guarded_test_ready',
      by_section: sectionReadiness
    },
    remaining_config_needed: remaining,
    data_policy: dataPolicy,
    write_policy: 'writes_disabled_no_database_nodes',
    network_policy: config.allow_public_fetch ? 'opt_in_public_fetch_website_audit_only_no_http_nodes' : 'no_network_fetch_no_http_nodes',
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
