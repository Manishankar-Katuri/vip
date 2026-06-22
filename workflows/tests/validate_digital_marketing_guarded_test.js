const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const workflowPath = path.join(repoRoot, 'workflows', 'vip_digital_marketing_guarded_test.workflow.js');
const source = fs.readFileSync(workflowPath, 'utf8');
const lines = source.split(/\r?\n/);

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function count(pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function contains(text) {
  return source.includes(text);
}

function sourceLinesMatching(pattern) {
  return lines
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => pattern.test(line));
}

function assertAbsent(pattern, message) {
  const matches = sourceLinesMatching(pattern);
  assert(matches.length === 0, `${message}: ${matches.map((match) => `line ${match.number}`).join(', ')}`);
}

const forbiddenNodeTypes = [
  ['n8n-nodes-base.scheduleTrigger', 'schedule trigger'],
  ['n8n-nodes-base.webhook', 'webhook trigger'],
  ['n8n-nodes-base.postgres', 'Postgres node'],
  ['n8n-nodes-base.httpRequest', 'HTTP Request node'],
  ['n8n-nodes-base.executeWorkflow', 'Execute Workflow node']
];

for (const [nodeType, label] of forbiddenNodeTypes) {
  assert(!contains(`type: '${nodeType}'`) && !contains(`type: "${nodeType}"`), `Workflow must not include ${label}`);
}

assert(count(/type:\s*['"]n8n-nodes-base\.manualTrigger['"]/g) === 1, 'Workflow must have exactly one manual trigger');
assert(count(/trigger\s*\(/g) === 1, 'Workflow must define only one trigger');
assert(!/credentials\s*:/.test(source), 'Workflow must not define node credentials');
assert(!/credential\s*\(/.test(source), 'Workflow must not call credential helpers');
assert(!/setNodeCredential/.test(source), 'Workflow must not set credentials');
assert(!/\b(insert|update|delete|upsert)\s+into\b/i.test(source), 'Workflow must not contain database write SQL');

const rawSecretFields = [
  'facebook_page_access_token',
  'instagram_access_token',
  'meta_access_token',
  'youtube_api_key'
];

for (const field of rawSecretFields) {
  assert(!contains(field), `Workflow must not reference raw secret field ${field}`);
}

const tokenLikeIdentifiers = new Set(source.match(/\b[A-Za-z][A-Za-z0-9_]*(?:_token|_api_key)\b/g) || []);
const disallowedTokenLikeIdentifiers = [...tokenLikeIdentifiers].filter((identifier) => !identifier.endsWith('_env_key'));
assert(
  disallowedTokenLikeIdentifiers.length === 0,
  `Only *_env_key token/api key references are allowed; found ${disallowedTokenLikeIdentifiers.join(', ')}`
);
assertAbsent(/\bAuthorization\b/i, 'Workflow must not output Authorization headers');
assertAbsent(/\bsecret\b/i, 'Workflow must not output secret fields');

const riskyLiveDataPhrases = [
  /rank(?:ing|ings)?(?:\s+position)?/i,
  /search\s+volume/i,
  /GBP\s+metrics/i,
  /review\s+count/i,
  /review\s+rating/i,
  /competitor\s+performance/i,
  /campaign\s+projection/i
];
const guardrailPattern = /\b(no|not|without|disabled|before|skipped|not\s+fabricated|not\s+fetched|not\s+inferred|not\s+claimed|no\s+fake)\b/i;

for (const phrase of riskyLiveDataPhrases) {
  const unsafeLines = sourceLinesMatching(phrase).filter(({ line }) => !guardrailPattern.test(line));
  assert(
    unsafeLines.length === 0,
    `Live-data phrase ${phrase} must appear only in negative guardrail text; unsafe lines: ${unsafeLines.map((match) => match.number).join(', ')}`
  );
}

const requiredOutputFields = [
  'workflow_name',
  'client_slug',
  'test_mode',
  'writes_disabled',
  'engines_run',
  'engines_skipped',
  'engine_results',
  'frontend_cards',
  'strategy_summary',
  'readiness_status',
  'remaining_config_needed'
];

for (const field of requiredOutputFields) {
  assert(contains(`${field}:`), `Final output must include ${field}`);
}

const expectedEngines = [
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

for (const engine of expectedEngines) {
  assert(contains(`'${engine}'`), `Engine inventory must include ${engine}`);
  assert(contains(`enginesToRun.includes('${engine}')`), `Engine ${engine} must be gated by enginesToRun`);
}

assert(contains('const allEngines = ['), 'Workflow must define allEngines inventory');
assert(contains('input.engine'), 'Workflow must read selected engine input');
assert(contains("input.engine !== 'all'"), 'Workflow must support all-engine fallback only when engine is all or missing');
assert(contains('const selected = requested.filter((engine) => allEngines.includes(engine));'), 'Workflow must filter requested engines against inventory');
assert(contains('const enginesToRun = selected.length ? selected : allEngines;'), 'Workflow must route to selected engines when provided');
assert(!/const\s+enginesToRun\s*=\s*allEngines/.test(source), 'Workflow must not force all engines to run');

assert(contains('disable_writes: true'), 'Manual trigger sample must default disable_writes to true');
assert(contains('writes_disabled: true'), 'Workflow output must always keep writes_disabled true');
assert(contains('allow_public_fetch: false'), 'Workflow must default allow_public_fetch to false');
assert(contains('toBool(input.allow_public_fetch, false)'), 'allow_public_fetch must default false in runtime config');
assert(contains('public_fetch_enabled: false'), 'Runtime output must report public fetch disabled');
assert(contains("network_policy: 'no_network_fetch_no_http_nodes'"), 'Workflow must report no-network policy');
assert(contains("write_policy: 'writes_disabled_no_database_nodes'"), 'Workflow must report no-write policy');
assert(contains("platform_api_policy: 'no_live_platform_api_nodes'"), 'Workflow must report no-platform-API policy');
assert(contains("const dataPolicy = 'no_fake_live_data';"), 'Workflow must set no-fake-live-data policy');

if (failures.length) {
  console.error('Guarded digital marketing workflow validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Guarded digital marketing workflow validation passed.');
console.log(`Checked ${expectedEngines.length} engines and ${requiredOutputFields.length} required output fields.`);
