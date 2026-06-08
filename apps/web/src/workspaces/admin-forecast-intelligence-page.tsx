"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ExternalLink,
  LineChart,
  MapPinned,
  PhoneCall,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Video,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Prediction } from "@vip/analytics-intelligence";

import {
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceAction,
  type IntelligenceMetric,
  type SurfaceState,
  surfaceTone,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { ForecastCurveChart } from "@/charts/forecast-curve-chart";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";

type SocialPost = {
  id: string;
  platform: string;
  postedAt: string;
  metrics: {
    engagementRate: number;
    reach: number;
    impressions: number;
    saves: number;
    comments: number;
  } | null;
};

type BestPostingTime = {
  dayLabel: string;
  hourOfDay: number;
  postCount: number;
  avgEngagementRate: number;
  avgPerformanceScore: number;
};

type SocialIntelligenceResponse = {
  success: boolean;
  workspaceId: string | null;
  posts: SocialPost[];
  bestPostingTimes: BestPostingTime[];
  rolling7Day: { totalPosts: number; avgEngagementRate: number; totalReach: number } | null;
  rolling30Day: { totalPosts: number; avgEngagementRate: number; totalReach: number } | null;
  engagementTrend: { direction: string; percentageChange: number | null } | null;
  insightNotes: string[];
};

type ForecastSignal = {
  title: string;
  signal: string;
  planningUse: string;
  source: string;
  sourceType: string;
  href: string;
  state: SurfaceState;
  icon: LucideIcon;
};

type ForecastOpportunity = {
  trigger: string;
  prepare: string;
  channel: string;
  confidence: "High" | "Medium";
  guardrail: string;
};

type EvidenceSource = {
  title: string;
  sourceType: string;
  date: string;
  whyItMatters: string;
  href: string;
};

type ForecastGuardrail = {
  title: string;
  detail: string;
  icon: LucideIcon;
};

const forecastSignals: ForecastSignal[] = [
  {
    title: "Google Trends search interest",
    signal: "Track ENT, sinus, hearing, throat, allergy, and local doctor discovery terms as directional demand context.",
    planningUse: "Prepare content when related or rising searches show patient questions before owned-channel metrics react.",
    source: "Google Trends Help",
    sourceType: "Search interest method",
    href: "https://support.google.com/trends/answer/4359550",
    state: "ready",
    icon: Search,
  },
  {
    title: "GBP demand proxies",
    signal: "Calls, website clicks, direction requests, and search impressions are useful appointment-intent proxies.",
    planningUse: "Use GBP movement to prioritize local SEO, service pages, profile posts, and appointment CTAs.",
    source: "Google Business Profile Help",
    sourceType: "Platform metric documentation",
    href: "https://support.google.com/business/answer/9918094",
    state: "degraded",
    icon: PhoneCall,
  },
  {
    title: "Measured social response",
    signal: "Instagram Insights supports content performance review by reach, interactions, audience, and time frame.",
    planningUse: "Use stored post history to estimate short-cycle engagement direction and content timing tests.",
    source: "Instagram Help Center",
    sourceType: "Platform metric documentation",
    href: "https://www.facebook.com/help/instagram/788388387972460",
    state: "ready",
    icon: BarChart3,
  },
  {
    title: "Pollution and respiratory burden",
    signal: "Air-quality burden is a practical seasonal trigger for allergy, sinus, throat, and breathing education.",
    planningUse: "Prepare pollution-day ENT guidance without claiming diagnoses or urgency from public-health context alone.",
    source: "State of Global Air 2025",
    sourceType: "Public-health evidence",
    href: "https://www.stateofglobalair.org/resources/report/state-global-air-report-2025",
    state: "ready",
    icon: Wind,
  },
  {
    title: "Doctor-led health video discovery",
    signal: "Health questions are heavily answered through video in India, making doctor-reviewed short video a primary format.",
    planningUse: "Turn forecasted patient questions into reviewed reels, Shorts, and simple explainers.",
    source: "Google India Blog",
    sourceType: "Platform and health behavior",
    href: "https://blog.google/intl/en-in/products/platforms/new-ways-were-supporting-health-and-well-being-in-india/",
    state: "ready",
    icon: Video,
  },
  {
    title: "Antibiotic stewardship risk",
    signal: "Infection-adjacent ENT content needs careful wording because AMR is an active India health concern.",
    planningUse: "Route sore throat, sinus infection, ear infection, and antibiotic themes through doctor approval.",
    source: "ICMR AMR reports",
    sourceType: "Government medical evidence",
    href: "https://www.icmr.gov.in/reports?q=sts",
    state: "ready",
    icon: ShieldCheck,
  },
];

const opportunities: ForecastOpportunity[] = [
  {
    trigger: "Sinus, allergy, and blocked-nose searches rise",
    prepare: "Doctor-led explainer: cold vs allergy vs sinus, with consultation triggers.",
    channel: "SEO, Instagram, YouTube Shorts",
    confidence: "High",
    guardrail: "Do not imply diagnosis from symptoms or trend volume.",
  },
  {
    trigger: "Local ENT discovery intent rises",
    prepare: "Kondapur/Hyderabad centre FAQs, GBP services, doctor profile improvements, and appointment CTA checks.",
    channel: "SEO, GBP, website",
    confidence: "High",
    guardrail: "Keep location targeting separate from medical outcome claims.",
  },
  {
    trigger: "Ear pain, hearing test, or tinnitus interest improves",
    prepare: "Hearing-screening checklist and tinnitus consultation guidance.",
    channel: "Instagram carousel, YouTube, GBP post",
    confidence: "Medium",
    guardrail: "Avoid treatment promises; use care-navigation language.",
  },
  {
    trigger: "Respiratory, pollution, or infection signals increase",
    prepare: "Seasonal respiratory care guide with prevention basics and doctor-reviewed red-flag language.",
    channel: "GBP, Instagram, waiting-room display",
    confidence: "Medium",
    guardrail: "Escalate infection and antibiotic content for clinical review.",
  },
];

const evidenceSources: EvidenceSource[] = [
  {
    title: "Compare Trends search terms",
    sourceType: "Search interest method",
    date: "Current documentation",
    whyItMatters: "Defines how to compare terms and topics, and why Trends should be treated as relative interest.",
    href: "https://support.google.com/trends/answer/4359550",
  },
  {
    title: "Business Profile performance",
    sourceType: "Platform metric documentation",
    date: "Current documentation",
    whyItMatters: "Supports calls, website clicks, direction requests, and search impressions as local demand proxies.",
    href: "https://support.google.com/business/answer/9918094",
  },
  {
    title: "About Instagram Insights",
    sourceType: "Platform metric documentation",
    date: "Current documentation",
    whyItMatters: "Supports using reach, interactions, content type, and time frame as social performance signals.",
    href: "https://www.facebook.com/help/instagram/788388387972460",
  },
  {
    title: "State of Global Air 2025",
    sourceType: "Public-health evidence",
    date: "2025",
    whyItMatters: "Adds seasonal and environmental context for respiratory, allergy, sinus, and throat education planning.",
    href: "https://www.stateofglobalair.org/resources/report/state-global-air-report-2025",
  },
  {
    title: "ABDM health records milestone",
    sourceType: "Government source",
    date: "May 2026",
    whyItMatters: "Shows digital health journeys are increasingly normal, making simple appointment and follow-up messaging important.",
    href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264241&lang=1&reg=3",
  },
  {
    title: "ICMR antimicrobial resistance reports",
    sourceType: "Government medical evidence",
    date: "Current reports page",
    whyItMatters: "Supports strict review of infection and antibiotic-adjacent ENT content.",
    href: "https://www.icmr.gov.in/reports?q=sts",
  },
];

const guardrails: ForecastGuardrail[] = [
  {
    title: "Trends are not patient volume",
    detail: "Google Trends shows relative search interest for chosen terms, regions, and windows. It should not be presented as diagnosis prevalence or visit demand.",
    icon: AlertTriangle,
  },
  {
    title: "Attribution is limited",
    detail: "Until appointments and revenue are connected, social and GBP forecasts should guide planning rather than claim business outcomes.",
    icon: LineChart,
  },
  {
    title: "Doctor review for clinical topics",
    detail: "Infection, antibiotic, pediatric, respiratory, and red-flag guidance should be reviewed before publishing.",
    icon: Stethoscope,
  },
  {
    title: "Local intent stays practical",
    detail: "Use Hyderabad and Kondapur signals for discoverability, service pages, and GBP readiness, not for medical superiority claims.",
    icon: MapPinned,
  },
];

export function AdminForecastIntelligencePage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const selectedHospitalId = selectedHospital.id;
  const isHarikaSelectedHospital = isHarikaHospital(selectedHospital);
  const [socialIntelligence, setSocialIntelligence] = useState<SocialIntelligenceResponse | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/social-intelligence?hospitalId=${encodeURIComponent(selectedHospitalId)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load social forecast inputs.");
        return response.json() as Promise<SocialIntelligenceResponse>;
      })
      .then(async (payload) => {
        if (!payload.workspaceId && isHarikaSelectedHospital) {
          const fallback = await fetch("/api/admin/social-intelligence?hospitalId=harika-ent-care-hospitals", { signal: controller.signal });
          if (fallback.ok) payload = await fallback.json() as SocialIntelligenceResponse;
        }

        setSocialError(null);
        setSocialIntelligence(payload);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSocialError(error instanceof Error ? error.message : "Unable to load social forecast inputs.");
      });

    return () => controller.abort();
  }, [isHarikaSelectedHospital, selectedHospitalId]);

  const history = useMemo(() => buildEngagementHistory(socialIntelligence?.posts ?? []), [socialIntelligence?.posts]);
  const forecast = useMemo(() => buildForecast(history, socialIntelligence?.workspaceId ?? selectedHospitalId), [history, selectedHospitalId, socialIntelligence?.workspaceId]);
  const latestEngagement = history.at(-1)?.avgEngagementRate;
  const bestWindow = socialIntelligence?.bestPostingTimes.at(0);
  const forecastBasis = history.length >= 3
    ? "Predictions use stored social post engagement history. GBP, search, and public-health sources add planning context only."
    : "Forecasting requires at least three measured engagement observations.";

  const metrics: IntelligenceMetric[] = [
    {
      label: "7-day engagement outlook",
      value: forecast ? `${signed(forecast.changePercent)}%` : "Pending",
      detail: forecast ? `${percent(latestEngagement ?? 0)} current average projected to ${percent(forecast.predictedValue)}.` : forecastBasis,
      state: forecast ? "ready" : "empty",
      icon: TrendingUp,
    },
    {
      label: "30-day content momentum",
      value: socialIntelligence?.engagementTrend?.percentageChange !== null && socialIntelligence?.engagementTrend?.percentageChange !== undefined
        ? `${signed(socialIntelligence.engagementTrend.percentageChange)}%`
        : "Directional",
      detail: socialIntelligence?.engagementTrend
        ? `Stored engagement trend is ${friendly(socialIntelligence.engagementTrend.direction)} across available social history.`
        : "Trend appears once enough social observations are available.",
      state: socialIntelligence?.engagementTrend ? "ready" : "empty",
      icon: Activity,
    },
    {
      label: "Best activation window",
      value: bestWindow ? `${bestWindow.dayLabel} ${formatHour(bestWindow.hourOfDay)}` : "Testing",
      detail: bestWindow ? `${bestWindow.postCount} measured posts averaged ${percent(bestWindow.avgEngagementRate)} engagement.` : "Publishing-window confidence needs more stored posts.",
      state: bestWindow ? "ready" : "degraded",
      icon: CalendarClock,
    },
    {
      label: "Confidence level",
      value: forecast ? `${Math.round(forecast.confidence * 100)}%` : "Limited",
      detail: "Confidence reflects social sample depth only. Appointment and revenue attribution are not connected in v1.",
      state: forecast ? "degraded" : "empty",
      icon: LineChart,
    },
  ];

  const actions: IntelligenceAction[] = [
    {
      title: "Prepare rising-question content",
      detail: "Use social history and Trends watchlists to prepare doctor-reviewed explainers for sinus, allergy, hearing, throat, and local ENT questions.",
      owner: "Content",
      due: "This week",
      state: "ready",
    },
    {
      title: "Strengthen local discovery surfaces",
      detail: "When local intent rises, review GBP services, location FAQs, centre pages, and appointment CTAs before the next publishing cycle.",
      owner: "Growth",
      due: "Next sprint",
      state: "degraded",
      href: "/admin/intelligence/seo",
    },
    {
      title: "Escalate infection-sensitive topics",
      detail: "Route sore throat, sinus infection, ear infection, pediatric, respiratory, and antibiotic-adjacent messaging to doctor approval.",
      owner: "Clinical review",
      due: "Before publish",
      state: "ready",
    },
    {
      title: "Keep attribution label visible",
      detail: "Mark forecasts as planning intelligence until appointments, calls, and revenue outcomes are connected to campaigns.",
      owner: "Admin",
      due: "Always on",
      state: "degraded",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Forecast intelligence"
        title={`${selectedHospital.name} forecast intelligence`}
        description="Planning-grade forecast intelligence for what to prepare next, why now, how confident we are, and which evidence supports the decision."
        icon={LineChart}
        state={forecast ? "degraded" : "empty"}
      >
        <StatusIndicator label="Social forecast" tone={forecast ? "success" : "neutral"} />
        <StatusIndicator label="Directional trends" tone="info" />
        <StatusIndicator label="Attribution limited" tone="warning" />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <AlertBanner
          title="Forecast interpretation guardrail"
          message="This page supports planning. Trends are relative search interest, social forecasts are based on measured content response, and neither should be presented as patient volume, diagnosis prevalence, or guaranteed revenue."
          tone="info"
        />

        {socialError && (
          <AlertBanner
            title="Social forecast inputs could not load"
            message={socialError}
            tone="danger"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Measured forecast curve"
              description="Stored social engagement history projected into a short-cycle planning outlook."
              action={<StatusIndicator label={forecast ? `${history.length} observations` : "Input limited"} tone={forecast ? "success" : "neutral"} />}
            />
            {forecast ? (
              <>
                <ForecastCurveChart history={history} forecast={forecast} />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{forecastBasis}</p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-muted-foreground">
                {forecastBasis} Connect or import more dated post metrics before using the curve for timing decisions.
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Signal coverage"
              description="What this forecast can and cannot see in v1."
              action={<StatusIndicator label="Planner view" tone="info" />}
            />
            <div className="space-y-3">
              <CoverageRow label="Stored social posts" value={String(socialIntelligence?.posts.length ?? 0)} state={socialIntelligence?.posts.length ? "ready" : "empty"} />
              <CoverageRow label="7-day social window" value={socialIntelligence?.rolling7Day ? `${socialIntelligence.rolling7Day.totalPosts} posts` : "Pending"} state={socialIntelligence?.rolling7Day ? "ready" : "empty"} />
              <CoverageRow label="30-day social window" value={socialIntelligence?.rolling30Day ? `${socialIntelligence.rolling30Day.totalPosts} posts` : "Pending"} state={socialIntelligence?.rolling30Day ? "ready" : "empty"} />
              <CoverageRow label="GBP calls and clicks" value="Proxy only" state="degraded" />
              <CoverageRow label="Appointments and revenue" value="Not connected" state="empty" />
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Planning signals"
            description="Credible inputs that shape what the team should prepare next."
            action={<StatusIndicator label={`${forecastSignals.length} signals`} tone="success" />}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {forecastSignals.map((signal) => (
              <a
                key={signal.title}
                href={signal.href}
                target="_blank"
                rel="noreferrer"
                className="grid gap-3 rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30 md:grid-cols-[auto_1fr_auto]"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
                  <signal.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{signal.title}</span>
                    <StatusIndicator label={signal.sourceType} tone={surfaceTone[signal.state]} />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-foreground">{signal.signal}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">Planner use:</span> {signal.planningUse}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-primary">{signal.source}</span>
                </span>
                <ExternalLink className="size-4 text-primary md:mt-1" aria-hidden />
              </a>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Forecast opportunity matrix"
              description="Turn likely attention shifts into useful patient education and discoverability work."
              action={<StatusIndicator label={`${opportunities.length} opportunities`} tone="info" />}
            />
            <div className="overflow-hidden rounded-lg border">
              <div className="grid bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid-cols-[1.1fr_1.4fr_1fr_0.8fr]">
                <span>Trigger</span>
                <span>Prepare</span>
                <span>Channel</span>
                <span>Confidence</span>
              </div>
              {opportunities.map((opportunity) => (
                <div key={opportunity.trigger} className="grid gap-2 border-t bg-background px-4 py-4 text-sm md:grid-cols-[1.1fr_1.4fr_1fr_0.8fr]">
                  <p className="font-semibold">{opportunity.trigger}</p>
                  <div>
                    <p className="text-muted-foreground">{opportunity.prepare}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{opportunity.guardrail}</p>
                  </div>
                  <p className="font-medium text-primary">{opportunity.channel}</p>
                  <StatusIndicator label={opportunity.confidence} tone={opportunity.confidence === "High" ? "success" : "warning"} />
                </div>
              ))}
            </div>
          </Panel>

          <IntelligenceActionQueue
            title="Forecast action queue"
            description="What the admin planner should do with this intelligence."
            actions={actions}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Evidence sources"
              description="External sources used as planning context for v1."
              action={<StatusIndicator label={`${evidenceSources.length} sources`} tone="success" />}
            />
            <div className="space-y-3">
              {evidenceSources.map((source) => (
                <a
                  key={source.title}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/40 hover:bg-info/30"
                >
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{source.title}</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      {source.sourceType} | {source.date}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{source.whyItMatters}</span>
                  </span>
                </a>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Forecast guardrails"
              description="Keep planning intelligence useful without overstating medical or business certainty."
              action={<StatusIndicator label="Required" tone="warning" />}
            />
            <div className="space-y-3">
              {guardrails.map((guardrail) => (
                <div key={guardrail.title} className="flex gap-3 rounded-lg border bg-background p-3">
                  <guardrail.icon className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{guardrail.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{guardrail.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function CoverageRow({ label, value, state }: { label: string; value: string; state: SurfaceState }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
      <p className="text-sm font-medium">{label}</p>
      <StatusIndicator label={value} tone={surfaceTone[state]} />
    </div>
  );
}

function buildEngagementHistory(posts: SocialPost[]) {
  const byDate = new Map<string, { total: number; count: number; reach: number }>();

  for (const post of posts) {
    if (!post.metrics) continue;
    const date = post.postedAt.slice(0, 10);
    const current = byDate.get(date) ?? { total: 0, count: 0, reach: 0 };
    current.total += post.metrics.engagementRate;
    current.count += 1;
    current.reach += post.metrics.reach;
    byDate.set(date, current);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date: `${date}T00:00:00.000Z`,
      avgEngagementRate: round(value.total / Math.max(1, value.count)),
      reach: value.reach,
      postCount: value.count,
    }));
}

function buildForecast(history: ReturnType<typeof buildEngagementHistory>, workspaceId: string): Prediction | undefined {
  if (history.length < 3) return undefined;

  const recent = history.slice(-4);
  const latest = recent.at(-1);
  if (!latest) return undefined;

  const deltas = recent.slice(1).map((point, index) => point.avgEngagementRate - recent[index].avgEngagementRate);
  const slope = deltas.reduce((total, value) => total + value, 0) / Math.max(1, deltas.length);
  const predictedValue = Math.max(0, latest.avgEngagementRate + slope * 7);
  const confidence = Math.min(0.82, 0.46 + history.length * 0.035);

  return {
    id: "admin-forecast-engagement-7d",
    workspaceId,
    metric: "ENGAGEMENT_TRAJECTORY",
    horizonDays: 7,
    currentValue: latest.avgEngagementRate,
    predictedValue: round(predictedValue),
    changePercent: round(percentChange(predictedValue, latest.avgEngagementRate)),
    confidence: round(confidence),
    generatedAt: latest.date,
    rationale: "Projected from recent stored social engagement slope.",
  };
}

function percentChange(next: number, current: number) {
  if (current === 0) return next === 0 ? 0 : 100;
  return ((next - current) / Math.abs(current)) * 100;
}

function signed(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHour(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}
