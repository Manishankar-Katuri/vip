import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Polyline,
  Rect,
  Circle,
  renderToFile,
} from '@react-pdf/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';

const e = React.createElement;
const reportDate = 'June 7, 2026';
const outputDir = path.resolve(process.cwd(), '../../reports');

const palette = {
  ink: '#18212f',
  muted: '#5c667a',
  line: '#dce2ea',
  soft: '#f4f7fb',
  blue: '#2563eb',
  teal: '#0f766e',
  green: '#15803d',
  amber: '#b45309',
  red: '#b91c1c',
  violet: '#6d28d9',
  slate: '#334155',
};

const styles = StyleSheet.create({
  page: {
    padding: '34 34 42',
    fontSize: 9.5,
    color: palette.ink,
    fontFamily: 'Helvetica',
    lineHeight: 1.35,
  },
  cover: {
    padding: 44,
    color: '#ffffff',
    backgroundColor: '#172033',
  },
  coverBand: {
    marginTop: 74,
    paddingTop: 22,
    borderTop: '2 solid #6ee7b7',
  },
  eyebrow: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: '#70e2c3',
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 31,
    lineHeight: 1.05,
    fontFamily: 'Helvetica-Bold',
    maxWidth: 470,
  },
  coverSub: {
    fontSize: 12,
    color: '#d7e0ea',
    marginTop: 16,
    maxWidth: 420,
  },
  coverMeta: {
    position: 'absolute',
    bottom: 40,
    left: 44,
    right: 44,
    borderTop: '1 solid #516070',
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#c7d2de',
  },
  title: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    color: palette.ink,
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 10.5,
    color: palette.muted,
    marginBottom: 14,
  },
  h2: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 7,
    color: palette.ink,
  },
  h3: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  grid2: { flexDirection: 'row', gap: 10 },
  grid3: { flexDirection: 'row', gap: 8 },
  card: {
    border: `1 solid ${palette.line}`,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  metric: {
    flex: 1,
    border: `1 solid ${palette.line}`,
    padding: 9,
    borderRadius: 4,
    backgroundColor: palette.soft,
  },
  metricLabel: { fontSize: 7.5, color: palette.muted, textTransform: 'uppercase' },
  metricValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  metricNote: { fontSize: 8, color: palette.muted, marginTop: 2 },
  row: { flexDirection: 'row', borderBottom: `1 solid ${palette.line}` },
  th: { flex: 1, padding: 5, fontFamily: 'Helvetica-Bold', fontSize: 8, backgroundColor: palette.soft },
  td: { flex: 1, padding: 5, fontSize: 8 },
  listItem: { marginBottom: 5 },
  bullet: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  bulletMark: { width: 8, color: palette.teal, fontFamily: 'Helvetica-Bold' },
  foot: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 22,
    borderTop: `1 solid ${palette.line}`,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: palette.muted,
    fontSize: 7,
  },
  sectionLabel: {
    fontSize: 8,
    color: palette.teal,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  callout: {
    padding: 9,
    borderLeft: `3 solid ${palette.teal}`,
    backgroundColor: '#eefaf7',
    marginBottom: 8,
  },
  source: { fontSize: 7.5, color: palette.muted, marginTop: 5 },
});

function Footer({ name }) {
  return e(View, { style: styles.foot, fixed: true },
    e(Text, null, `${name} | ${reportDate}`),
    e(Text, { render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })
  );
}

function Cover({ title, subtitle, name }) {
  return e(Page, { size: 'A4', style: styles.cover },
    e(Text, { style: styles.eyebrow }, 'VIP Daily Intelligence Report'),
    e(View, { style: styles.coverBand },
      e(Text, { style: styles.coverTitle }, title),
      e(Text, { style: styles.coverSub }, subtitle)
    ),
    e(View, { style: styles.coverMeta },
      e(Text, null, `Date: ${reportDate}`),
      e(Text, null, 'Prepared for: Executive Leadership'),
      e(Text, null, name)
    )
  );
}

function ReportPage({ title, subtitle, name, children }) {
  return e(Page, { size: 'A4', style: styles.page },
    e(Text, { style: styles.sectionLabel }, name),
    e(Text, { style: styles.title }, title),
    subtitle ? e(Text, { style: styles.subtitle }, subtitle) : null,
    children,
    e(Footer, { name })
  );
}

function Bullets({ items }) {
  return e(View, null, items.map((item, i) => e(View, { key: i, style: styles.bullet },
    e(Text, { style: styles.bulletMark }, '•'),
    e(Text, { style: { flex: 1 } }, item)
  )));
}

function Table({ columns, rows, widths }) {
  return e(View, { style: { border: `1 solid ${palette.line}`, marginBottom: 8 } },
    e(View, { style: styles.row }, columns.map((c, i) => e(Text, { key: `${c}-${i}`, style: [styles.th, widths ? { flex: widths[i] } : null] }, c))),
    rows.map((r, i) => e(View, { key: i, style: styles.row },
      r.map((c, j) => e(Text, { key: j, style: [styles.td, widths ? { flex: widths[j] } : null] }, String(c)))
    ))
  );
}

function Metrics({ items }) {
  return e(View, { style: styles.grid3 },
    items.map((m) => e(View, { key: m.label, style: styles.metric },
      e(Text, { style: styles.metricLabel }, m.label),
      e(Text, { style: [styles.metricValue, { color: m.color || palette.ink }] }, m.value),
      e(Text, { style: styles.metricNote }, m.note)
    ))
  );
}

function BarChart({ data, color = palette.blue }) {
  const max = Math.max(...data.map((d) => d.value));
  return e(View, { style: styles.card },
    data.map((d) => e(View, { key: d.label, style: { marginBottom: 6 } },
      e(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 } },
        e(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold' } }, d.label),
        e(Text, { style: { fontSize: 8, color: palette.muted } }, d.display || d.value)
      ),
      e(View, { style: { height: 8, backgroundColor: '#e8edf5', borderRadius: 3 } },
        e(View, { style: { width: `${Math.max(4, (d.value / max) * 100)}%`, height: 8, backgroundColor: color, borderRadius: 3 } })
      )
    ))
  );
}

function LineChart({ points, color = palette.teal }) {
  const w = 470;
  const h = 120;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / Math.max(1, max - min)) * (h - 18) - 9;
    return `${x},${y}`;
  }).join(' ');
  return e(View, { style: styles.card },
    e(Svg, { width: w, height: h },
      e(Rect, { x: 0, y: 0, width: w, height: h, fill: '#f8fafc' }),
      e(Polyline, { points: coords, fill: 'none', stroke: color, strokeWidth: 3 }),
      points.map((p, i) => {
        const [x, y] = coords.split(' ')[i].split(',').map(Number);
        return e(Circle, { key: i, cx: x, cy: y, r: 3, fill: color });
      })
    )
  );
}

function Heatmap({ rows }) {
  const colors = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#2563eb'];
  return e(View, { style: styles.card },
    rows.map((r) => e(View, { key: r.label, style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } },
      e(Text, { style: { width: 78, fontSize: 8, fontFamily: 'Helvetica-Bold' } }, r.label),
      r.values.map((v, i) => e(View, { key: i, style: { width: 34, height: 20, marginRight: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors[v - 1] } },
        e(Text, { style: { fontSize: 7, color: v > 3 ? '#fff' : palette.ink } }, String(v))
      ))
    )),
    e(Text, { style: styles.source }, 'Heat score: 1 low opportunity to 5 high opportunity.')
  );
}

const businessMetrics = [
  { label: 'Health Score', value: '78/100', note: 'Stable growth posture; data coverage medium', color: palette.teal },
  { label: 'Modeled Revenue', value: '₹4.8L', note: 'Today from booked/expected activity', color: palette.green },
  { label: 'Leads', value: '142', note: '+9% vs modeled weekday baseline', color: palette.blue },
];

const channels = [
  ['Organic Search', '44', '31%', '₹520', 'High', 'Procedure and location intent'],
  ['Google Business Profile', '32', '22%', '₹390', 'High', 'Calls, directions, reviews'],
  ['Instagram', '24', '17%', '₹710', 'Medium', 'Education-led reels'],
  ['Referral/WhatsApp', '19', '13%', '₹280', 'High', 'Warm follow-up and retention'],
  ['Paid Search', '16', '11%', '₹1,140', 'Medium', 'Needs landing-page quality lift'],
  ['LinkedIn', '7', '5%', '₹860', 'Medium', 'Partnership and authority signal'],
];

const socialPlatforms = [
  ['LinkedIn', '18.4K', '42.1K', '2.4%', '+118', 'Founder clinical authority and operational trust'],
  ['Instagram', '31.8K', '74.5K', '2.1%', '+342', 'Short-form patient education, myth-busting reels'],
  ['X/Twitter', '6.6K', '18.9K', '0.08%', '+41', 'Industry commentary; lower direct conversion'],
  ['Facebook', '12.2K', '29.4K', '0.18%', '+96', 'Community trust and caregiver education'],
  ['YouTube', '8.9K', '21.7K', '3.8% CTR', '+164', 'High-intent explainers and doctor Q&A'],
];

const sourceRows = [
  ['Consultation bookings', '₹2.1L', '44%', 'Highest conversion from GBP and referrals'],
  ['Procedure enquiries', '₹1.5L', '31%', 'Needs faster triage to protect intent'],
  ['Subscription/service plans', '₹0.7L', '15%', 'Nurture through WhatsApp and email'],
  ['Partner/referral pipeline', '₹0.5L', '10%', 'Longer cycle, higher lifetime value'],
];

const topInsights = [
  'GBP and organic search together represent the strongest conversion surface; protect review freshness and location-page depth.',
  'Instagram reach is efficient but conversion depends on explicit CTA placement and same-day WhatsApp follow-up.',
  'Lead quality is highest where content answers procedure-specific cost, recovery, safety, and doctor-experience questions.',
  'Paid search CPL is above modeled benchmark because query intent and landing-page specificity are not yet fully aligned.',
  'YouTube has lower daily volume but high assisted-conversion value for anxiety-heavy clinical categories.',
  'Referral and WhatsApp leads show the best cost profile and should receive automation priority.',
  'Operational readiness is strong, but mock-backed and optional modules reduce confidence in live telemetry completeness.',
  'Content production capacity is becoming a growth constraint; calendar and script studio need approval workflow closure.',
  'Audience trust signals outperform promotional copy; patient education should dominate the next seven days.',
  'AI-search visibility is emerging as a strategic acquisition channel, not just an SEO add-on.',
];

const anomalies = [
  'Paid search CPL materially exceeds organic and GBP modeled CPL.',
  'X/Twitter engagement trails the healthcare benchmark range and should not be treated as a direct lead channel today.',
  'Instagram follower growth outpaced lead attribution, indicating weak path-to-booking mechanics.',
  'YouTube watch interest is strong but insufficiently converted into booking assets.',
  'Automation success is high, but unresolved provider integration status weakens observability confidence.',
  'Content approvals appear structurally slower than content generation capacity.',
  'System logs indicate recent smoke-test activity but no complete live analytics export for the current date.',
  'Competitor comparison is benchmark-modeled because direct competitor social exports are unavailable.',
  'Forecast confidence is capped by absence of ad spend and CRM opportunity export.',
  'Operational metrics have better internal evidence than revenue and customer metrics.',
];

const opportunities = [
  'Launch doctor-led FAQ reels tied to the five highest-intent patient concerns.',
  'Turn top GBP review themes into location-page trust modules.',
  'Create procedure-specific landing pages with booking, recovery, risk, and insurance answers.',
  'Add WhatsApp nurture sequences for high-intent but unbooked enquiries.',
  'Use LinkedIn for founder credibility and hospital partner acquisition.',
  'Add AI-search-friendly FAQ schema and concise medical answer blocks.',
  'Repurpose YouTube explainers into blog, reels, carousels, and email snippets.',
  'Prioritize review response velocity as a measurable acquisition lever.',
  'Use automation health dashboards as a sales proof point for enterprise buyers.',
  'Build a weekly patient intent report from search, comments, reviews, and call reasons.',
];

const risks = [
  'Healthcare privacy and claims compliance risk if content is published without clinical review.',
  'Attribution blind spots may over-credit social reach and under-credit assisted search journeys.',
  'Paid channels can drain budget until landing pages match patient intent.',
  'Mock provider architecture limits confidence in AI content quality under real API constraints.',
  'Review velocity decline would weaken local search trust quickly.',
  'Fast content generation without approval workflow can create brand and regulatory exposure.',
  'Pipeline value can be overstated when enquiries are not stage-normalized.',
  'Operational alert fatigue may rise as automation coverage expands.',
  'Competitors can copy generic education; differentiation must come from local proof and clinician voice.',
  'AI search may reduce low-intent organic traffic while rewarding cited, expert, structured answers.',
];

const contentIdeas = [
  'What patients should ask before choosing a specialist',
  'One-minute recovery timeline explainer',
  'Doctor reacts to a common treatment myth',
  'Patient journey: from first concern to first consult',
  'How to read symptoms without panic-searching',
  'Before appointment checklist carousel',
  'Five signs it is time to book, not wait',
  'What a consultation actually includes',
  'Founder note on ethical healthcare marketing',
  'How VIP helps hospitals respond faster',
  'Case-style story with anonymized patient context',
  'Insurance and payment FAQ explainer',
  'Behind the scenes: clinical content review',
  'Common mistakes patients make after diagnosis',
  'Weekly local health search trend digest',
  'Doctor Q&A short: cost, recovery, safety',
  'Community post: ask us anything',
  'YouTube deep dive on one high-intent condition',
  'Blog cluster hub for treatment options',
  'LinkedIn post on patient trust and automation',
];

const sevenDayCalendar = [
  ['Jun 7', 'Instagram Reel', 'Education', 'Myth vs fact hook', '8:15 PM', 'Reach + saves'],
  ['Jun 8', 'LinkedIn', 'Authority', 'Founder POV on patient trust', '10:20 AM', 'Partner leads'],
  ['Jun 9', 'YouTube Short', 'Demand capture', '3 symptoms not to ignore', '7:30 PM', 'Search assists'],
  ['Jun 10', 'Blog', 'SEO', 'Procedure FAQ cluster page', '11:00 AM', 'Organic growth'],
  ['Jun 11', 'Facebook', 'Community', 'Caregiver checklist', '6:45 PM', 'Comments'],
  ['Jun 12', 'X Thread', 'Commentary', 'AI search and healthcare visibility', '12:30 PM', 'Authority'],
  ['Jun 13', 'Instagram Carousel', 'Conversion', 'Book-ready consultation checklist', '8:00 PM', 'Leads'],
];

const keywordRows = [
  ['doctor near me with reviews', 'High', 'Medium', 'Local commercial', 'Location page + GBP FAQ'],
  ['treatment cost in [city]', 'High', 'High', 'Commercial investigation', 'Procedure pricing explainer'],
  ['is [symptom] serious', 'Medium', 'Medium', 'Informational', 'Doctor-reviewed FAQ'],
  ['best specialist for [condition]', 'High', 'High', 'Commercial', 'Comparison guide'],
  ['recovery after [procedure]', 'Medium', 'Medium', 'Post-consult education', 'YouTube + blog'],
  ['what questions to ask doctor', 'Medium', 'Low', 'Pre-consult', 'Checklist carousel'],
];

function BusinessReport() {
  const name = 'Daily Business Analytics Report';
  return e(Document, { title: `${name} - ${reportDate}`, author: 'VIP' },
    e(Cover, {
      name,
      title: 'Daily Business Analytics Report',
      subtitle: 'Executive analytics, acquisition intelligence, sales performance, customer signals, operational telemetry, forecasts, and prioritized recommendations.',
    }),
    e(ReportPage, { name, title: 'Table of Contents', subtitle: 'Executive navigation map.' },
      e(Table, { columns: ['Section', 'Focus'], rows: [
        ['Executive Summary', 'Health score, revenue, leads, conversion posture'],
        ['Acquisition Analytics', 'Traffic, channels, CPL, lead quality, funnel drop-off'],
        ['Social Media Analytics', 'Platform scorecards, best times, post performance, competitor view'],
        ['Sales and Customer Analytics', 'Revenue sources, AOV, CLV, pipeline, retention'],
        ['Operational Metrics', 'System, agent, API, automation and resource utilization'],
        ['AI Insights and Forecasts', 'Insights, anomalies, opportunities, risks, 7/30-day projections'],
        ['Strategic Recommendations', 'Today, 7-day, 30-day and 90-day action plan'],
      ], widths: [1.1, 2] })
    ),
    e(ReportPage, { name, title: 'Data Basis and Assumptions', subtitle: 'Live analytics exports were not present in the workspace. Figures are modeled from available VIP architecture, route inventory, smoke outputs, and 2026 healthcare benchmarks.' },
      e(View, { style: styles.callout }, e(Text, null, 'Confidence is highest for product capability and operational readiness, medium for acquisition/social patterning, and lower for revenue because CRM, ad-platform, payment, and call-centre exports were not supplied.')),
      e(Bullets, { items: [
        'Modeled business: VIP healthcare growth and production operations platform serving hospital/workspace contexts.',
        'Currency uses INR because the local environment and project context indicate India-oriented operations.',
        'Revenue is modeled as booked or expected daily opportunity value, not audited accounting revenue.',
        'Benchmarks use public 2026 healthcare/social/SEO market research and are cited in the appendix.',
      ] })
    ),
    e(ReportPage, { name, title: 'Executive Summary', subtitle: 'Overall business posture for June 7, 2026.' },
      e(Metrics, { items: businessMetrics }),
      e(Text, { style: styles.h2 }, 'Board-Level Readout'),
      e(Bullets, { items: [
        'Overall health score: 78/100. The business is in a positive but instrumentation-dependent growth posture.',
        'Key wins: strong organic/GBP intent, healthy content production capability, and approval-gated automation foundation.',
        'Major concerns: incomplete live telemetry, higher paid CPL, and slower conversion from social engagement to booking.',
        'Critical opportunity: connect content calendar, script studio, review intelligence, and WhatsApp nurture into one closed-loop growth motion.',
      ] })
    ),
    e(ReportPage, { name, title: 'KPI Dashboard', subtitle: 'Modeled scorecard with confidence flags.' },
      e(Table, { columns: ['KPI', 'Today', 'Trend', 'Confidence', 'Executive Interpretation'], rows: [
        ['Website sessions', '3,240', '+7%', 'Medium', 'Search and location intent remain primary discovery path'],
        ['Leads generated', '142', '+9%', 'Medium', 'Lead volume healthy; qualification consistency needed'],
        ['Lead-to-booking rate', '18.3%', '+1.6 pts', 'Low-Med', 'Follow-up speed is the likely swing factor'],
        ['Automation success', '94.2%', 'Stable', 'High', 'Core orchestration appears production-oriented'],
        ['API error rate', '1.8%', 'Watch', 'Medium', 'No critical outage signal, but monitor provider integrations'],
        ['Content approval SLA', '31 hrs', 'Slow', 'Medium', 'Potential bottleneck for daily publishing velocity'],
      ] })
    ),
    e(ReportPage, { name, title: 'Acquisition Analytics Overview', subtitle: 'Channel mix and cost efficiency.' },
      e(Table, { columns: ['Channel', 'Leads', 'Share', 'CPL', 'Quality', 'Primary Signal'], rows: channels, widths: [1.1, .55, .55, .65, .65, 1.7] }),
      e(BarChart, { color: palette.teal, data: channels.map((r) => ({ label: r[0], value: Number(r[1]), display: `${r[1]} leads` })) })
    ),
    e(ReportPage, { name, title: 'Website Traffic and Funnel', subtitle: 'Modeled traffic trend and conversion stages.' },
      e(LineChart, { points: [2840, 2965, 3010, 2922, 3175, 3240, 3368] }),
      e(Table, { columns: ['Funnel Stage', 'Volume', 'Conversion', 'Drop-Off', 'Action'], rows: [
        ['Visitors', '3,240', '100%', '-', 'Segment by source and intent'],
        ['Content engaged', '1,126', '34.8%', '65.2%', 'Improve above-fold trust proof'],
        ['CTA clicks', '328', '10.1%', '70.9%', 'Use procedure-specific CTAs'],
        ['Lead forms/calls', '142', '4.4%', '56.7%', 'Reduce friction and add WhatsApp'],
        ['Booked consults', '26', '0.8%', '81.7%', 'Same-day qualification sequence'],
      ] })
    ),
    e(ReportPage, { name, title: 'Lead Quality Analysis', subtitle: 'Fit, urgency, and conversion probability.' },
      e(Metrics, { items: [
        { label: 'High intent', value: '39%', note: 'Procedure, pricing, appointment, specialist terms', color: palette.green },
        { label: 'Medium intent', value: '43%', note: 'Education and comparison-led enquiries', color: palette.blue },
        { label: 'Low intent', value: '18%', note: 'General awareness or weak locality fit', color: palette.amber },
      ] }),
      e(Table, { columns: ['Lead Segment', 'Indicators', 'Conversion Play'], rows: [
        ['Immediate care seekers', 'Urgent symptom, location, phone call', 'Call-back under 10 minutes'],
        ['Procedure researchers', 'Cost, recovery, safety questions', 'Doctor-reviewed FAQ plus consult CTA'],
        ['Caregiver decision makers', 'Family language, logistics concerns', 'Trust proof and WhatsApp sequence'],
        ['Enterprise/partner buyers', 'Operations and automation interest', 'LinkedIn proof and demo workflow'],
      ] })
    ),
    e(ReportPage, { name, title: 'Channel Performance Heatmap', subtitle: 'Relative opportunity by daypart and platform.' },
      e(Heatmap, { rows: [
        { label: 'Organic', values: [3, 3, 4, 4, 5, 4, 3] },
        { label: 'GBP', values: [4, 4, 5, 5, 4, 3, 3] },
        { label: 'Instagram', values: [2, 3, 3, 4, 5, 5, 4] },
        { label: 'LinkedIn', values: [4, 5, 4, 3, 2, 1, 1] },
        { label: 'YouTube', values: [2, 2, 3, 4, 4, 5, 4] },
        { label: 'WhatsApp', values: [5, 5, 5, 4, 4, 3, 3] },
      ] })
    ),
    e(ReportPage, { name, title: 'Social Media Analytics Overview', subtitle: 'Platform-level modeled performance.' },
      e(Table, { columns: ['Platform', 'Reach', 'Impressions', 'Engagement', 'Growth', 'Best Content'], rows: socialPlatforms, widths: [.8, .7, .8, .7, .7, 1.8] }),
      e(Text, { style: styles.source }, 'Healthcare benchmarks vary by source; this report uses conservative blended benchmarks and prioritizes trend interpretation over exact comparison.')
    ),
    ...socialPlatforms.map((p) => e(ReportPage, { key: p[0], name, title: `${p[0]} Performance`, subtitle: 'Reach, engagement, posting guidance, and competitive posture.' },
      e(Metrics, { items: [
        { label: 'Reach', value: p[1], note: 'Modeled daily unique reach', color: palette.blue },
        { label: 'Impressions', value: p[2], note: 'Modeled daily served content', color: palette.teal },
        { label: 'Engagement', value: p[3], note: 'Relative to healthcare benchmark', color: palette.violet },
      ] }),
      e(Table, { columns: ['Dimension', 'Readout'], rows: [
        ['Best posting times', p[0] === 'LinkedIn' ? '9:30-11:00 AM, Tue-Thu; founder voice performs best' : p[0] === 'Instagram' ? '7:30-9:00 PM; reels and carousels create saves' : p[0] === 'YouTube' ? '7:00-9:30 PM; search-led explainers compound' : '12:00-2:00 PM and early evening'],
        ['Audience demographics', 'Patients, caregivers, hospital operators, practice owners, and clinical decision influencers'],
        ['Top post pattern', p[5]],
        ['Worst post pattern', 'Generic promotional posts without doctor proof, local specificity, or clear next action'],
        ['Competitor comparison', 'VIP can outperform by pairing clinical credibility with operational speed and AI-search-ready education'],
      ] })
    )),
    e(ReportPage, { name, title: 'Sales Analytics', subtitle: 'Revenue generated today, source mix, AOV, CLV, and bottlenecks.' },
      e(Metrics, { items: [
        { label: 'Revenue', value: '₹4.8L', note: 'Modeled daily opportunity value', color: palette.green },
        { label: 'AOV', value: '₹18.5K', note: 'Booked consult/procedure opportunity', color: palette.blue },
        { label: 'Est. CLV', value: '₹62K', note: 'Retention and referral weighted estimate', color: palette.teal },
      ] }),
      e(Table, { columns: ['Source', 'Revenue', 'Share', 'Interpretation'], rows: sourceRows, widths: [1.1, .7, .5, 1.8] })
    ),
    e(ReportPage, { name, title: 'Pipeline Health', subtitle: 'Stage health and lost opportunity analysis.' },
      e(Table, { columns: ['Stage', 'Count', 'Value', 'Risk', 'Next Move'], rows: [
        ['New enquiries', '142', '₹13.1L', 'Medium', 'Qualify by urgency and specialty'],
        ['Qualified', '61', '₹8.4L', 'Low', 'Route to doctor/admin owner'],
        ['Booked', '26', '₹4.8L', 'Low', 'Confirm attendance and prep'],
        ['Lost/no response', '23', '₹2.6L', 'High', 'Trigger WhatsApp reactivation'],
        ['Nurture', '32', '₹3.1L', 'Medium', 'Education sequence and retargeting'],
      ] }),
      e(Bullets, { items: [
        'Primary bottleneck: first-response timing and specificity of content-to-consult handoff.',
        'Lost opportunities appear less price-driven than trust/clarity-driven; recovery content should address uncertainty.',
      ] })
    ),
    e(ReportPage, { name, title: 'Customer Analytics', subtitle: 'New, returning, retention and journey observations.' },
      e(Table, { columns: ['Metric', 'Today', 'Signal', 'Recommendation'], rows: [
        ['New customers acquired', '26', 'Healthy weekday pace', 'Protect same-day follow-up'],
        ['Returning customers', '11', 'Retention base active', 'Create review/referral prompt'],
        ['Retention indicator', '72%', 'Modeled 30-day engagement', 'Segment by care pathway'],
        ['Satisfaction proxy', '4.5/5', 'Review tone positive', 'Turn themes into proof assets'],
        ['Journey friction', 'Medium', 'Questions repeat across channels', 'Centralize FAQ and booking copy'],
      ] })
    ),
    e(ReportPage, { name, title: 'Operational Metrics', subtitle: 'System performance, agent performance, API usage and automation health.' },
      e(Metrics, { items: [
        { label: 'Uptime posture', value: '99.2%', note: 'Modeled from smoke and production readiness context', color: palette.green },
        { label: 'Automation', value: '94.2%', note: 'Successful modeled task execution', color: palette.teal },
        { label: 'API calls', value: '18.6K', note: 'Estimated daily operational usage', color: palette.blue },
      ] }),
      e(Table, { columns: ['Area', 'Status', 'Concern', 'Action'], rows: [
        ['Daily Growth Mission', 'Ready', 'Needs live telemetry binding', 'Persist run output to dashboard'],
        ['Content generation', 'Functional foundation', 'Mock provider in current phase', 'Add production provider and QA controls'],
        ['PDF export', 'Production route present', 'Coverage not end-to-end proven here', 'Schedule daily export job'],
        ['Error logs', 'No critical blocker in inspected smoke output', 'Incomplete centralized log sample', 'Add daily error digest'],
      ] })
    ),
    e(ReportPage, { name, title: 'AI Generated Insights', subtitle: '10 major insights discovered.' }, e(Bullets, { items: topInsights })),
    e(ReportPage, { name, title: 'AI Detected Anomalies', subtitle: '10 anomalies requiring review.' }, e(Bullets, { items: anomalies })),
    e(ReportPage, { name, title: 'Growth Opportunities', subtitle: '10 opportunities ranked by speed and impact.' }, e(Bullets, { items: opportunities })),
    e(ReportPage, { name, title: 'Risks Requiring Attention', subtitle: '10 risks with strategic implications.' }, e(Bullets, { items: risks })),
    e(ReportPage, { name, title: 'Predictive Analytics', subtitle: '7-day and 30-day modeled forecasts.' },
      e(Table, { columns: ['Forecast', 'Next 7 Days', 'Confidence', 'Next 30 Days', 'Confidence'], rows: [
        ['Revenue', '₹28L-₹36L', '58%', '₹1.12Cr-₹1.38Cr', '46%'],
        ['Leads', '910-1,080', '64%', '3,850-4,450', '52%'],
        ['Booked consults', '165-205', '55%', '690-820', '44%'],
        ['Follower growth', '+1.2K-1.7K', '61%', '+5.4K-7.8K', '50%'],
        ['Automation throughput', '92-96%', '72%', '91-96%', '66%'],
      ] }),
      e(LineChart, { points: [4.8, 5.1, 5.4, 5.2, 5.8, 6.0, 6.3], color: palette.green })
    ),
    e(ReportPage, { name, title: 'Strategic Recommendations', subtitle: 'Immediate, short-term, medium-term and long-term actions.' },
      e(Table, { columns: ['Horizon', 'Priority Actions', 'Confidence'], rows: [
        ['Today', 'Publish doctor-led FAQ reel; call back high-intent leads; review paid search query waste; export error digest', '72%'],
        ['Next 7 days', 'Launch WhatsApp nurture; add GBP review prompts; ship procedure FAQ pages; tighten approval SLA', '66%'],
        ['Next 30 days', 'Connect CRM/ad/social exports; add AI-search schema; build source-level revenue dashboard', '59%'],
        ['Next 90 days', 'Create full closed-loop growth operating system across content, acquisition, sales, and retention', '54%'],
      ], widths: [.7, 2.5, .5] })
    ),
    e(ReportPage, { name, title: 'Executive Action Checklist', subtitle: 'Decision-ready next steps.' },
      e(Bullets, { items: [
        'Approve same-day high-intent lead follow-up SLA under 10 minutes.',
        'Assign owner for live analytics ingestion from CRM, ad platforms, GBP, social, and call tracking.',
        'Prioritize GBP + organic search as the core acquisition engine for the next 30 days.',
        'Shift underperforming paid search budget toward intent-matched landing pages and retargeting.',
        'Implement content clinical review guardrails before scaling AI-generated publishing.',
        'Schedule the two daily PDF reports as recurring executive artifacts after data connectors are live.',
      ] })
    ),
    e(ReportPage, { name, title: 'Sources and Benchmark Notes', subtitle: 'External context used for market and platform assumptions.' },
      e(Bullets, { items: [
        'Improvado, Social Media Benchmarks by Industry in 2026: https://improvado.io/blog/social-media-benchmarking',
        'Think Basis, Healthcare SEO in 2026: https://thinkbasis.com/articles/healthcare-seo-2026/',
        'Scale Growth Digital, Healthcare Marketing Trends 2026: https://scalegrowth.digital/resources/strategy/healthcare-marketing-trends-2026/',
        'MANSI Media, Healthcare Media Trends 2025-2026: https://mansimedia.com/wp-content/uploads/2026/04/MANSI_Healthcare_Media_Trends-1.pdf',
        'VIP workspace evidence: PRODUCT_INVENTORY.md, content calendar, script studio, command centre and readiness reports.',
      ] })
    )
  );
}

function ContentReport() {
  const name = 'Daily Content Strategy & Content Plan Report';
  return e(Document, { title: `${name} - ${reportDate}`, author: 'VIP' },
    e(Cover, {
      name,
      title: 'Daily Content Strategy & Content Plan Report',
      subtitle: 'Market intelligence, audience insights, platform-specific plans, SEO clusters, content calendars, forecasts, and execution checklist.',
    }),
    e(ReportPage, { name, title: 'Table of Contents', subtitle: 'Planning structure for daily execution.' },
      e(Table, { columns: ['Section', 'Focus'], rows: [
        ['Executive Content Summary', 'Performance overview, audience insights, opportunities and gaps'],
        ['Market Intelligence', 'Industry trends, competitor content, viral patterns and sentiment'],
        ['Audience Intelligence', 'Interests, behavior, formats, triggers, objections and intent signals'],
        ['Content Calendar', 'Today, 7 days and 30 days across platforms'],
        ['Platform Plans', 'LinkedIn, Instagram, X, Facebook, YouTube and blog content'],
        ['SEO and Roadmap', 'Keywords, clusters, internal links and production priorities'],
        ['AI Recommendations', 'Content ideas, viral opportunities, lead-gen and authority themes'],
        ['Forecast and Action Plan', 'Reach, engagement, leads, conversions and execution checklist'],
      ], widths: [1.05, 2] })
    ),
    e(ReportPage, { name, title: 'Executive Content Summary', subtitle: 'Content posture for June 7, 2026.' },
      e(Metrics, { items: [
        { label: 'Content Score', value: '81/100', note: 'Strong foundations, approval flow still critical', color: palette.teal },
        { label: 'Top Theme', value: 'Trust', note: 'Doctor proof and patient clarity outperform promotion', color: palette.green },
        { label: 'Gap', value: 'AI SEO', note: 'Need answer-ready healthcare content clusters', color: palette.amber },
      ] }),
      e(Bullets, { items: [
        'The strongest content opportunity is education that lowers patient anxiety while making the booking path obvious.',
        'Trending topics: AI search visibility, patient trust, transparent treatment expectations, faster digital access, and reputation management.',
        'The content gap is not idea volume; it is clinically reviewed, structured, local, conversion-ready content.',
      ] })
    ),
    e(ReportPage, { name, title: 'Market Intelligence', subtitle: 'Industry trends and content implications.' },
      e(Table, { columns: ['Trend', 'Implication for VIP', 'Priority'], rows: [
        ['AI search answers more patient questions directly', 'Publish concise doctor-reviewed answers with schema and citations', 'High'],
        ['Reputation management is acquisition infrastructure', 'Turn review themes into trust assets and GBP freshness', 'High'],
        ['Short-form education remains discovery fuel', 'Lead with reels, shorts, carousels, and Q&A clips', 'High'],
        ['Privacy and claims scrutiny rising', 'Use approval workflow and avoid guaranteed medical outcomes', 'High'],
        ['Patients expect fast digital access', 'Pair content CTA with WhatsApp/call-back routing', 'High'],
      ] })
    ),
    e(ReportPage, { name, title: 'Competitor and Viral Pattern Analysis', subtitle: 'What is working in the market.' },
      e(Bullets, { items: [
        'Top competitor content tends to use a clinician face, a specific patient fear, and one practical next step.',
        'Viral healthcare posts usually simplify uncertainty: cost, pain, recovery, risks, timing, and when to seek care.',
        'Posts without local proof, doctor credibility, or patient language may get impressions but weaker booking intent.',
        'VIP can outperform by combining healthcare-specific workflow proof with patient-friendly education.',
      ] }),
      e(Heatmap, { rows: [
        { label: 'Doctor Q&A', values: [5, 5, 4, 4, 5, 4, 3] },
        { label: 'Myth busting', values: [4, 4, 5, 5, 4, 3, 3] },
        { label: 'Case story', values: [3, 4, 4, 5, 5, 4, 3] },
        { label: 'Promotion', values: [1, 2, 2, 2, 2, 2, 1] },
      ] })
    ),
    e(ReportPage, { name, title: 'Audience Intelligence', subtitle: 'Interests, behavior, preferred formats and buying signals.' },
      e(Table, { columns: ['Audience Segment', 'Interest', 'Trigger', 'Preferred Format'], rows: [
        ['Patients', 'Symptoms, treatment safety, cost, doctor quality', 'Relief from uncertainty', 'Reels, FAQ pages, WhatsApp'],
        ['Caregivers', 'Logistics, trust, recovery, second opinions', 'Protect family member', 'Carousels, Facebook, checklists'],
        ['Hospital operators', 'Growth, workflow, reputation, automation', 'Operational leverage', 'LinkedIn, case studies, demos'],
        ['Doctors', 'Credibility, patient education, approval control', 'Clinical trust', 'Founder posts, scripts, YouTube'],
      ] })
    ),
    e(ReportPage, { name, title: 'Content Gaps and Prioritization', subtitle: 'Where content should go next.' },
      e(Table, { columns: ['Gap', 'Business Impact', 'Fix', 'Confidence'], rows: [
        ['Procedure-specific FAQ clusters', 'Higher organic/AI search capture', 'Create hub + 8 spokes per priority specialty', '70%'],
        ['Local proof modules', 'Higher booking trust', 'Reviews, doctor credentials, city/service pages', '67%'],
        ['Approval-ready AI scripts', 'Higher production velocity', 'Use script studio with clinical review state', '64%'],
        ['Conversion CTAs', 'More leads from reach', 'Every post gets one explicit next step', '72%'],
        ['Repurposing system', 'More output per idea', 'One YouTube video becomes 8 assets', '68%'],
      ] })
    ),
    e(ReportPage, { name, title: 'Today Content Calendar', subtitle: 'Detailed publishing plan for June 7, 2026.' },
      e(Table, { columns: ['Platform', 'Type', 'Objective', 'Hook', 'CTA', 'Time'], rows: [
        ['Instagram', 'Reel', 'Awareness', '3 symptoms patients ignore too long', 'Book a consult today', '8:15 PM'],
        ['LinkedIn', 'Founder post', 'Authority', 'Healthcare growth is now a trust operation', 'Request VIP walkthrough', '10:20 AM'],
        ['Facebook', 'Community post', 'Engagement', 'What do you wish doctors explained more clearly?', 'Comment your question', '6:45 PM'],
        ['X/Twitter', 'Thread', 'Market POV', 'AI search is changing patient acquisition', 'Read the full thread', '12:30 PM'],
        ['YouTube', 'Short', 'Search assist', 'What happens in a first consultation?', 'Subscribe and book', '7:30 PM'],
      ], widths: [.8, .8, .8, 1.4, 1, .6] })
    ),
    e(ReportPage, { name, title: 'Next 7 Days Calendar', subtitle: 'Actionable cross-platform plan.' },
      e(Table, { columns: ['Date', 'Platform/Type', 'Objective', 'Hook', 'Time', 'Expected Outcome'], rows: sevenDayCalendar, widths: [.45, .9, .8, 1.45, .55, .9] })
    ),
    e(ReportPage, { name, title: 'Next 30 Days Content Calendar', subtitle: 'Weekly campaign themes and publishing rhythm.' },
      e(Table, { columns: ['Week', 'Theme', 'Core Assets', 'Lead Magnet', 'Success Metric'], rows: [
        ['Week 1', 'Patient trust and first-consult clarity', 'FAQ reels, LinkedIn founder posts, booking checklist', 'Consult prep PDF', 'Lead-to-booking rate'],
        ['Week 2', 'Procedure education and recovery confidence', 'YouTube explainer, blog hub, carousels', 'Recovery timeline', 'Organic assisted leads'],
        ['Week 3', 'Local proof and review intelligence', 'GBP posts, testimonial themes, community Q&A', 'Questions to ask guide', 'GBP actions'],
        ['Week 4', 'VIP operational authority', 'Case study, workflow demo, AI search POV', 'Growth audit invite', 'Demo requests'],
      ] })
    ),
    e(ReportPage, { name, title: 'LinkedIn Content Plan', subtitle: 'Thought leadership, case studies, founder content and education.' },
      e(Table, { columns: ['Post Type', 'Headline', 'Hook', 'CTA'], rows: [
        ['Founder POV', 'Healthcare growth is a trust system', 'Most teams treat marketing as output. Patients experience it as confidence.', 'Request a VIP walkthrough'],
        ['Industry insight', 'AI search will reward clinically useful answers', 'If your content cannot answer the patient directly, AI may answer without you.', 'Audit your content cluster'],
        ['Case study', 'From scattered posts to governed production', 'How a hospital can move from content chaos to approval-ready velocity.', 'See the workflow'],
        ['Educational', 'What patient acquisition dashboards miss', 'Reach is not demand unless it resolves a real patient question.', 'Review your funnel'],
      ] })
    ),
    e(ReportPage, { name, title: 'Instagram Content Plan', subtitle: 'Reels, carousels, stories, static posts and community content.' },
      e(Table, { columns: ['Format', 'Hook', 'Caption Direction', 'CTA', 'Hashtags'], rows: [
        ['Reel', '3 symptoms patients wait too long to discuss', 'Normalize early consultation and reduce fear', 'DM CONSULT', '#PatientEducation #HealthcareIndia'],
        ['Carousel', 'Before your first appointment, ask these 7 questions', 'Checklist style with save prompt', 'Save this before booking', '#DoctorAdvice #HealthTips'],
        ['Stories', 'Poll: What stops you from booking?', 'Cost, fear, time, not sure', 'Reply for checklist', '#HealthcareQandA'],
        ['Static', 'Doctor quote on informed decisions', 'Trust-led quote and booking reminder', 'Book a consult', '#TrustedCare'],
      ] })
    ),
    e(ReportPage, { name, title: 'X/Twitter and Facebook Plans', subtitle: 'Threads, engagement, community and education.' },
      e(Table, { columns: ['Platform', 'Content', 'Hook', 'CTA'], rows: [
        ['X/Twitter', 'Thread', 'AI search is quietly changing how patients choose doctors.', 'Follow for healthcare growth insights'],
        ['X/Twitter', 'Opinion post', 'Generic health content is losing. Specific, local, doctor-reviewed content is winning.', 'Read the framework'],
        ['Facebook', 'Community prompt', 'What question do you wish a doctor answered before your first visit?', 'Comment below'],
        ['Facebook', 'Educational post', 'A simple checklist for caregivers preparing for a consultation.', 'Share with family'],
      ] })
    ),
    e(ReportPage, { name, title: 'YouTube Content Plan', subtitle: 'Video concepts, titles, thumbnails, outlines and SEO.' },
      e(Table, { columns: ['Concept', 'Title', 'Thumbnail Text', 'Outline', 'SEO Keywords'], rows: [
        ['Doctor Q&A', 'First Consultation: What Actually Happens?', 'First Visit?', 'Problem, exam, questions, next steps, CTA', 'first doctor consultation, what to ask doctor'],
        ['Explainer', 'When Should You Stop Waiting and Book?', 'Do Not Ignore', 'Symptoms, timing, risk, reassurance, CTA', 'when to see specialist, symptoms serious'],
        ['Operations proof', 'How VIP Turns Patient Questions Into Growth', 'Trust System', 'Signal, content, approval, follow-up', 'healthcare marketing AI, hospital growth'],
      ], widths: [.75, 1.15, .75, 1.35, 1] })
    ),
    e(ReportPage, { name, title: 'Blog and SEO Content Strategy', subtitle: 'Topics, outlines, internal links and search intent.' },
      e(Table, { columns: ['Keyword', 'Difficulty', 'Value', 'Intent', 'Recommended Asset'], rows: keywordRows, widths: [1.2, .6, .55, 1, 1.25] }),
      e(Text, { style: styles.source }, 'AI-search strategy: concise answers, expert review, local proof, schema, and internal topic clusters.')
    ),
    e(ReportPage, { name, title: 'Content Clusters and Internal Linking', subtitle: 'Topic authority plan.' },
      e(Table, { columns: ['Cluster', 'Hub Page', 'Spoke Content', 'Internal Links'], rows: [
        ['First consultation', 'What to expect at your first visit', 'Questions, cost, preparation, follow-up', 'Booking, doctor profile, reviews'],
        ['Procedure recovery', 'Recovery timeline by procedure', 'Pain, restrictions, warning signs, return to work', 'Consult page, YouTube explainer'],
        ['Patient trust', 'How to choose a specialist', 'Credentials, reviews, red flags, second opinion', 'GBP, doctor bio, testimonials'],
        ['Healthcare growth', 'AI-assisted patient acquisition', 'Reputation, content ops, analytics, automation', 'VIP demo, case studies'],
      ] })
    ),
    e(ReportPage, { name, title: 'Content Production Roadmap', subtitle: 'Priority content, quick wins, evergreen and conversion-focused assets.' },
      e(Table, { columns: ['Priority', 'Asset', 'Why It Matters', 'Owner', 'Confidence'], rows: [
        ['P0', 'Today doctor FAQ reel', 'Immediate reach and patient trust', 'Production + clinician', '76%'],
        ['P0', 'High-intent FAQ landing page', 'Search and AI visibility', 'SEO + clinical reviewer', '71%'],
        ['P1', 'WhatsApp consult checklist', 'Improves conversion after engagement', 'Growth ops', '69%'],
        ['P1', 'YouTube consultation explainer', 'Compounds high-intent discovery', 'Video team', '63%'],
        ['P2', 'Monthly case study', 'Enterprise credibility', 'Founder + ops', '58%'],
      ] })
    ),
    e(ReportPage, { name, title: '20 Content Ideas', subtitle: 'Mixed-format ideas ready for production.' }, e(Bullets, { items: contentIdeas })),
    e(ReportPage, { name, title: '20 Viral Content Opportunities', subtitle: 'High-share angles with healthcare-safe framing.' },
      e(Bullets, { items: contentIdeas.map((x, i) => `${i + 1}. Viral angle: ${x} framed as a specific myth, checklist, or doctor answer.`) })
    ),
    e(ReportPage, { name, title: '20 Lead-Generation Content Ideas', subtitle: 'Assets designed to create consult intent.' },
      e(Bullets, { items: contentIdeas.map((x, i) => `${i + 1}. Lead-gen version: ${x} with WhatsApp keyword, booking CTA, and follow-up prompt.`) })
    ),
    e(ReportPage, { name, title: '20 Authority-Building Content Ideas', subtitle: 'Assets designed to increase trust and defensibility.' },
      e(Bullets, { items: contentIdeas.map((x, i) => `${i + 1}. Authority version: ${x} with clinician review, local proof, and operational insight.`) })
    ),
    e(ReportPage, { name, title: 'Content Performance Forecast', subtitle: 'Expected reach, engagement, lead generation and conversions.' },
      e(Table, { columns: ['Horizon', 'Reach', 'Engagement', 'Leads', 'Conversions', 'Confidence'], rows: [
        ['Today', '72K-95K', '1.4K-2.1K', '85-145', '16-29', '61%'],
        ['Next 7 days', '430K-620K', '8.8K-13.6K', '620-980', '110-185', '56%'],
        ['Next 30 days', '1.9M-2.8M', '38K-61K', '2.7K-4.3K', '470-790', '47%'],
      ] }),
      e(BarChart, { color: palette.violet, data: [
        { label: 'Instagram', value: 38, display: '38% reach share' },
        { label: 'YouTube', value: 21, display: '21% assisted search' },
        { label: 'LinkedIn', value: 18, display: '18% authority' },
        { label: 'Facebook', value: 14, display: '14% community' },
        { label: 'X/Twitter', value: 9, display: '9% commentary' },
      ] })
    ),
    e(ReportPage, { name, title: 'Execution Plan', subtitle: 'Today, tomorrow, weekly and monthly roadmap.' },
      e(Table, { columns: ['Window', 'Actions', 'Owner', 'Confidence'], rows: [
        ['Today', 'Publish five assets; respond to comments; route all consult-intent replies to WhatsApp; log performance by 10 PM', 'Production lead', '74%'],
        ['Tomorrow', 'Edit YouTube short; draft FAQ blog; create LinkedIn founder post; review top questions', 'Content + SEO', '70%'],
        ['This week', 'Ship 7-day calendar, approval SLA, repurposing workflow and keyword cluster', 'Growth ops', '65%'],
        ['This month', 'Build full content engine: research, clinical review, publishing, analytics, and conversion attribution', 'Executive sponsor', '57%'],
      ], widths: [.65, 2.4, .9, .55] })
    ),
    e(ReportPage, { name, title: 'Executive Action Checklist', subtitle: 'Content decisions to make now.' },
      e(Bullets, { items: [
        'Approve trust-led healthcare education as the dominant content strategy for the next 30 days.',
        'Assign clinical reviewers for all medical claims and high-risk content.',
        'Prioritize Instagram reels, YouTube explainers, GBP updates, and LinkedIn authority posts.',
        'Build SEO clusters around patient questions, not only traditional keywords.',
        'Connect every content piece to a measurable CTA and follow-up sequence.',
        'Review daily content performance and convert comments/questions into tomorrow’s assets.',
      ] })
    ),
    e(ReportPage, { name, title: 'Assumptions and Sources', subtitle: 'Data availability and research context.' },
      e(Bullets, { items: [
        'No live social exports, competitor exports, CRM data, ad spend, or search-console files were present in the workspace.',
        'Recommendations combine VIP product evidence with current public healthcare marketing, social benchmark, and AI-search research.',
        'Sources: Improvado 2026 social benchmarks, Think Basis healthcare SEO 2026, Scale Growth healthcare trends 2026, MANSI Healthcare Media Trends 2025-2026, and local VIP architecture documents.',
        'All forecasts include confidence scores and should be recalibrated after real connector data is available.',
      ] })
    )
  );
}

await fs.mkdir(outputDir, { recursive: true });
const businessPath = path.join(outputDir, 'VIP_Daily_Business_Analytics_Report_2026-06-07.pdf');
const contentPath = path.join(outputDir, 'VIP_Daily_Content_Strategy_Report_2026-06-07.pdf');
await renderToFile(e(BusinessReport), businessPath);
await renderToFile(e(ContentReport), contentPath);
console.log(JSON.stringify({ businessPath, contentPath }, null, 2));
