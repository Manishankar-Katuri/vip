"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  Gauge,
  LineChart,
  RadioTower,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  ComparisonBars,
  EvidenceList,
  InsightPanel,
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";

type HospitalIntelligence = {
  hospitalId: string;
  specialty: string;
  healthScore: number;
  reviews: number;
  reach: string;
  engagement: string;
  recommendations: number;
  signals: number;
  risks: number;
  automations: number;
  plans: number;
  marketTracked: number;
  opportunityGaps: number;
  executiveIssues: number;
  momentum: string;
  leadingInsight: string;
  privacyNote: string;
  readiness: Array<{ label: string; value: number; detail: string; state: SurfaceState }>;
  sectionData: Array<{
    section: "Intelligence" | "Strategy" | "Analytics" | "Reports";
    items: Array<{
      anchorId: string;
      title: string;
      value: string;
      detail: string;
      state: SurfaceState;
      href?: string;
    }>;
  }>;
};

type IntelligenceView = {
  title: string;
  subtitle: string;
  detail: string;
  href: string;
  state: SurfaceState;
  icon: LucideIcon;
  metrics: Array<{ label: string; value: string }>;
};

type SocialPlatformSummary = {
  platform: "INSTAGRAM" | "FACEBOOK" | string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  avgEngagementRate: number;
};

type SocialRawPost = {
  id: string;
  postId?: string;
  platform: string;
  caption: string | null;
  url: string | null;
  mediaUrl: string | null;
  contentType?: string;
  postedAt: string;
  rawData?: unknown;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
  } | null;
};

type SocialIntelligenceResponse = {
  success: boolean;
  workspaceId: string | null;
  platforms: SocialPlatformSummary[];
  rawPosts?: SocialRawPost[];
  posts?: SocialRawPost[];
};

const hospitalData: Record<string, HospitalIntelligence> = {
  "harika-ent-care-hospitals": {
    hospitalId: "harika-ent-care-hospitals",
    specialty: "ENT care",
    healthScore: 58,
    reviews: 345,
    reach: "42.8K",
    engagement: "6.4%",
    recommendations: 4,
    signals: 7,
    risks: 3,
    automations: 2,
    plans: 5,
    marketTracked: 10,
    opportunityGaps: 4,
    executiveIssues: 9,
    momentum: "+31%",
    leadingInsight: "Trust-building doctor authority content is the most important next campaign because review themes show confidence gaps.",
    privacyNote: "ENT reputation, competitor, and campaign data are scoped only to Harika ENT care hospitals.",
    readiness: [
      { label: "Reputation intelligence", value: 84, detail: "Review themes and patient confidence signals are available.", state: "ready" },
      { label: "Market intelligence", value: 76, detail: "ENT competitor activity and content gaps are tracked.", state: "ready" },
      { label: "Forecasting", value: 52, detail: "Needs more measured appointment attribution.", state: "degraded" },
      { label: "Workflow automation", value: 68, detail: "Approval and production handoffs are partially active.", state: "degraded" },
    ],
    sectionData: [
      {
        section: "Intelligence",
        items: [
          { anchorId: "intelligence-social", title: "Social intelligence", value: "93 posts", detail: "Instagram historical workspace is connected with 93 posts and post-level metrics.", state: "ready" },
          { anchorId: "intelligence-gbp", title: "GBP intelligence", value: "Setup needed", detail: "No Google Business Profile review records are stored yet for this workspace.", state: "empty" },
          { anchorId: "intelligence-seo", title: "SEO intelligence", value: "Setup needed", detail: "Search visibility and keyword rankings are not connected yet.", state: "empty", href: "/admin/intelligence/seo" },
          { anchorId: "intelligence-trend", title: "Trend intelligence", value: "ENT themes", detail: "Seasonal allergy, sinus care, hearing screening, tinnitus, adenoidectomy, and post-visit care themes are present in content.", state: "ready", href: "/admin/intelligence/trend" },
          { anchorId: "intelligence-competitor", title: "Competitor intelligence", value: "0 accounts", detail: "No structured competitor accounts are connected yet, so competitor views should stay setup-labeled.", state: "empty" },
          { anchorId: "intelligence-recommendations", title: "AI recommendations", value: "Derived", detail: "Recommendations can be derived from top posts, format performance, and publishing windows even though no persisted AI recommendations exist.", state: "degraded" },
          { anchorId: "intelligence-forecasting", title: "Forecasting", value: "Social only", detail: "Forecasting can use Instagram history, but appointment and revenue attribution are still missing.", state: "degraded", href: "/admin/intelligence/forecasting" },
        ],
      },
      {
        section: "Strategy",
        items: [
          { anchorId: "strategy-content", title: "Content strategy", value: "Ready", detail: "AI content planning, timing, captions, and evidence are available as the primary strategy workspace.", state: "ready", href: "/admin/strategy/content" },
          { anchorId: "strategy-gbp", title: "GBP strategy", value: "Setup needed", detail: "Local discovery actions are available, but live Google Business Profile evidence still needs connection.", state: "degraded", href: "/admin/strategy/gbp" },
          { anchorId: "strategy-reviews", title: "Review strategy", value: "Evidence limited", detail: "Review acquisition, response, trust, and sentiment strategy remains limited until review records are connected.", state: "degraded", href: "/admin/strategy/reviews" },
          { anchorId: "strategy-seo", title: "SEO strategy", value: "Setup needed", detail: "Search and service-page visibility strategy is available while live search rankings remain unconnected.", state: "empty", href: "/admin/strategy/seo" },
          { anchorId: "strategy-social", title: "Social presence strategy", value: "Active", detail: "Doctor-led social growth can use connected Instagram and Facebook content evidence.", state: "ready", href: "/admin/strategy/social" },
          { anchorId: "strategy-conversion", title: "Conversion path", value: "Needs attribution", detail: "Calls, directions, WhatsApp, and appointment paths need source instrumentation before conversion lift can be claimed.", state: "degraded", href: "/admin/strategy/conversion-path" },
        ],
      },
      {
        section: "Analytics",
        items: [
          { anchorId: "analytics-instagram", title: "Instagram analytics", value: "29,427 reach", detail: "93 posts, 565 likes, 28 comments, 82 saves, and 1.92% average engagement.", state: "ready" },
          { anchorId: "analytics-facebook", title: "Facebook analytics", value: "Connected", detail: "Facebook Graph API is connected; live post rows, reactions, comments, shares, media URLs, permalinks, and raw payloads are stored for Harika.", state: "ready" },
          { anchorId: "analytics-whatsapp", title: "WhatsApp analytics", value: "Not connected", detail: "No WhatsApp inquiry or lead metrics are stored yet.", state: "empty" },
          { anchorId: "analytics-reviews", title: "Review analytics", value: "No reviews", detail: "Review table has no records for the current social workspace.", state: "empty" },
          { anchorId: "analytics-competitors", title: "Competitor analytics", value: "No accounts", detail: "Competitor account table has no Harika records yet.", state: "empty" },
          { anchorId: "analytics-engagement", title: "Engagement analytics", value: "1.92%", detail: "Carousel content leads at 3.16% average engagement; video follows at 2.58%.", state: "ready" },
          { anchorId: "analytics-reach", title: "Reach analytics", value: "29,427", detail: "Video posts generated 15,005 reach; image posts generated 11,993; carousel posts generated 2,429.", state: "ready" },
        ],
      },
      {
        section: "Reports",
        items: [
          { anchorId: "reports-weekly-analysis", title: "Weekly analysis report", value: "Ready draft", detail: "Can summarize Instagram performance, campaign workflow, and next-week content priorities.", state: "ready" },
          { anchorId: "reports-competitor-analysis", title: "Competitor analysis report", value: "Needs setup", detail: "Requires connected competitor accounts before producing a real comparative report.", state: "empty" },
          { anchorId: "reports-executive-growth", title: "Executive growth report", value: "Ready draft", detail: "Can report 93-post social performance, campaign status, review gaps, and next actions.", state: "ready" },
        ],
      },
    ],
  },
  "aayu-geriatrics": {
    hospitalId: "aayu-geriatrics",
    specialty: "Geriatrics",
    healthScore: 74,
    reviews: 188,
    reach: "27.5K",
    engagement: "5.1%",
    recommendations: 5,
    signals: 9,
    risks: 2,
    automations: 3,
    plans: 6,
    marketTracked: 7,
    opportunityGaps: 5,
    executiveIssues: 4,
    momentum: "+18%",
    leadingInsight: "Caregiver education and senior wellness programs are the strongest growth angles for Aayu Geriatrics.",
    privacyNote: "Geriatric care trends, caregiver audience data, and review themes are isolated to Aayu Geriatrics.",
    readiness: [
      { label: "Reputation intelligence", value: 79, detail: "Caregiver trust and staff empathy signals are visible.", state: "ready" },
      { label: "Market intelligence", value: 69, detail: "Senior wellness content gaps are mapped.", state: "ready" },
      { label: "Forecasting", value: 61, detail: "Campaign response is measurable but still maturing.", state: "degraded" },
      { label: "Workflow automation", value: 73, detail: "Care-program content handoffs are active.", state: "ready" },
    ],
    sectionData: [],
  },
  "sri-srinivasa-hospitals": {
    hospitalId: "sri-srinivasa-hospitals",
    specialty: "Multispecialty",
    healthScore: 82,
    reviews: 512,
    reach: "63.2K",
    engagement: "7.2%",
    recommendations: 6,
    signals: 11,
    risks: 1,
    automations: 4,
    plans: 8,
    marketTracked: 12,
    opportunityGaps: 3,
    executiveIssues: 6,
    momentum: "+24%",
    leadingInsight: "Sri Srinivasa hospitals can grow fastest by separating multispecialty service lines into targeted campaign tracks.",
    privacyNote: "Multispecialty service-line, review, and competitor data stay scoped to Sri Srinivasa hospitals.",
    readiness: [
      { label: "Reputation intelligence", value: 88, detail: "High review volume supports specialty-level analysis.", state: "ready" },
      { label: "Market intelligence", value: 81, detail: "Competitor pressure is tracked across service lines.", state: "ready" },
      { label: "Forecasting", value: 70, detail: "Enough trend signal exists for short-cycle predictions.", state: "ready" },
      { label: "Workflow automation", value: 77, detail: "Publishing and report automation are active.", state: "ready" },
    ],
    sectionData: [],
  },
};

export function AdminIntelligencePage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const data = hospitalData[selectedHospital.id] ?? hospitalData[DEMO_HOSPITALS[0].id];
  const base = `/admin/workspaces/${selectedHospital.id}`;
  const [socialIntelligence, setSocialIntelligence] =
    useState<SocialIntelligenceResponse | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/admin/social-intelligence?hospitalId=${encodeURIComponent(selectedHospital.id)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load social intelligence.");
        }

        return response.json() as Promise<SocialIntelligenceResponse>;
      })
      .then((payload) => {
        setSocialError(null);
        setSocialIntelligence(payload);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setSocialError(error instanceof Error ? error.message : "Unable to load social intelligence.");
      });

    return () => controller.abort();
  }, [selectedHospital.id]);

  const socialByPlatform = useMemo(() => {
    const summaries = new Map<string, SocialPlatformSummary>();

    for (const platform of socialIntelligence?.platforms ?? []) {
      summaries.set(platform.platform, platform);
    }

    return summaries;
  }, [socialIntelligence]);

  const instagramSummary = socialByPlatform.get("INSTAGRAM");
  const facebookSummary = socialByPlatform.get("FACEBOOK");
  const socialRawPosts =
    socialIntelligence?.rawPosts ??
    socialIntelligence?.posts ??
    [];
  const totalSocialPosts =
    socialIntelligence?.platforms.reduce((total, platform) => total + platform.posts, 0) ??
    0;

  function resolveSectionItem(
    item: HospitalIntelligence["sectionData"][number]["items"][number]
  ) {
    if (
      item.anchorId === "intelligence-competitor" ||
      item.anchorId === "analytics-competitors" ||
      item.anchorId === "reports-competitor-analysis"
    ) {
      return {
        ...item,
        value: "Open map",
        detail: "Open the dedicated competitor intelligence page with live Places data, market map, review gaps, search relevance, and action recommendations.",
        state: "ready" as const,
        href: `${base}/competitor-intelligence`,
      };
    }

    if (!isHarikaHospital(selectedHospital) || !socialIntelligence) {
      return item;
    }

    if (item.anchorId === "intelligence-social") {
      return {
        ...item,
        value: `${totalSocialPosts} posts`,
        detail: `${instagramSummary?.posts ?? 0} Instagram posts and ${facebookSummary?.posts ?? 0} Facebook posts are stored in Harika's isolated social workspace.`,
        state: totalSocialPosts > 0 ? "ready" as const : "empty" as const,
      };
    }

    if (item.anchorId === "analytics-instagram" && instagramSummary) {
      return {
        ...item,
        value: `${integer(instagramSummary.reach)} reach`,
        detail: `${instagramSummary.posts} posts, ${integer(instagramSummary.likes)} likes, ${integer(instagramSummary.comments)} comments, ${integer(instagramSummary.saves)} saves, and ${instagramSummary.avgEngagementRate.toFixed(2)}% average engagement.`,
        state: "ready" as const,
      };
    }

    if (item.anchorId === "analytics-facebook") {
      return {
        ...item,
        value: facebookSummary ? `${facebookSummary.posts} posts` : "Not connected",
        detail: facebookSummary
          ? `${integer(facebookSummary.likes)} reactions, ${integer(facebookSummary.comments)} comments, ${integer(facebookSummary.shares)} shares, ${integer(facebookSummary.reach)} reach, and raw Graph API payloads are stored. Reach and impressions remain 0 until Facebook Insights metrics are enabled.`
          : "No Facebook post metrics are stored for this workspace yet.",
        state: facebookSummary ? "ready" as const : "empty" as const,
      };
    }

    if (item.anchorId === "analytics-engagement") {
      return {
        ...item,
        value: instagramSummary ? `${instagramSummary.avgEngagementRate.toFixed(2)}%` : item.value,
        detail: facebookSummary
          ? `Instagram average engagement is ${instagramSummary?.avgEngagementRate.toFixed(2) ?? "0.00"}%. Facebook reactions and comments are stored, but engagement rate is 0 until reach or impressions are available from Insights.`
          : item.detail,
      };
    }

    if (item.anchorId === "analytics-reach") {
      return {
        ...item,
        value: instagramSummary ? integer(instagramSummary.reach) : item.value,
        detail: facebookSummary
          ? `Instagram contributes ${integer(instagramSummary?.reach ?? 0)} recorded reach. Facebook reach is stored as ${integer(facebookSummary.reach)} until post Insights permissions return reach or impressions.`
          : item.detail,
      };
    }

    return item;
  }

  const views: IntelligenceView[] = [
    {
      title: "Hospital growth overview",
      subtitle: "Health score, alerts, reviews, and AI next-best actions.",
      detail: "First admin readout for VIP score, growth risk, and what the team should do next.",
      href: `${base}/dashboard`,
      state: "ready",
      icon: Gauge,
      metrics: [
        { label: "Health", value: String(data.healthScore) },
        { label: "Reviews", value: String(data.reviews) },
      ],
    },
    {
      title: "Revenue and intelligence dashboard",
      subtitle: "Trends, sentiment, signal quality, and outcome readiness.",
      detail: "A deeper view for performance movement, attribution gaps, and executive readout.",
      href: `${base}/insights`,
      state: "ready",
      icon: LineChart,
      metrics: [
        { label: "Engagement", value: data.engagement },
        { label: "Reach", value: data.reach },
      ],
    },
    {
      title: "Executive briefing and report",
      subtitle: "Leadership summary with evidence, recommendation, and PDF action.",
      detail: "Use this for leadership review: what changed, why it matters, and what to approve.",
      href: `${base}/executive`,
      state: "ready",
      icon: FileText,
      metrics: [
        { label: "Issues", value: String(data.executiveIssues) },
        { label: "Momentum", value: data.momentum },
      ],
    },
    {
      title: "Market intelligence",
      subtitle: "Competitor cadence, engagement lift, and local opportunity gaps.",
      detail: "Turns competitor behavior into practical actions for authority and discoverability.",
      href: `${base}/competitor-intelligence`,
      state: "ready",
      icon: Search,
      metrics: [
        { label: "Tracked", value: String(data.marketTracked) },
        { label: "Gaps", value: String(data.opportunityGaps) },
      ],
    },
    {
      title: "Agency command center",
      subtitle: "Portfolio-style command view for health, alerts, and notifications.",
      detail: "A management surface for hospital workstreams without mixing client data.",
      href: `${base}/command-center`,
      state: "ready",
      icon: Workflow,
      metrics: [
        { label: "Alerts", value: String(data.risks) },
        { label: "Pulse", value: "Live" },
      ],
    },
    {
      title: "Internal platform ops",
      subtitle: "Demo/module map, system status, and platform proof.",
      detail: "A route map for internal review, QA, demo flow, and intelligence readiness.",
      href: `${base}/mission-control`,
      state: "ready",
      icon: RadioTower,
      metrics: [
        { label: "Modules", value: "8" },
        { label: "Status", value: "Online" },
      ],
    },
    {
      title: "Workflow and automation intelligence",
      subtitle: "Operational proof, automation status, and handoff health.",
      detail: "Connects recommendations to action plans, approvals, automations, and delivery risk.",
      href: "/admin/workflows",
      state: data.automations ? "ready" : "empty",
      icon: Activity,
      metrics: [
        { label: "Automations", value: String(data.automations) },
        { label: "Plans", value: String(data.plans) },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Admin overview"
        title="One overview for intelligence, strategy, and analytics."
        description={`Summary command view for ${selectedHospital.name}: intelligence signals, strategy readiness, analytics coverage, executive reports, market position, and operational risk.`}
        icon={Sparkles}
        state="ready"
      >
        <Button asChild size="lg">
          <Link href={`${base}/dashboard`}>
            Open hospital dashboard
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <IntelligenceMetricGrid
          metrics={[
            {
              label: "Selected hospital",
              value: selectedHospital.name,
              detail: `${data.specialty} intelligence scope.`,
              state: "ready",
              icon: Building2,
            },
            {
              label: "Recommendations",
              value: String(data.recommendations),
              detail: "AI opportunities available for admin review.",
              state: "ready",
              icon: Sparkles,
            },
            {
              label: "Intelligence signals",
              value: String(data.signals),
              detail: "Measured trend, prediction, and market signals for this hospital only.",
              state: "ready",
              icon: BarChart3,
            },
            {
              label: "Operational risks",
              value: String(data.risks),
              detail: "Client-specific connectors, proof gaps, and automation readiness.",
              state: data.risks > 1 ? "degraded" : "ready",
              icon: AlertTriangle,
            },
          ]}
        />

        <Panel className="p-5">
          <SectionHeader
            title="Complete overview surfaces"
            description="Each card opens a hospital-scoped detail route across intelligence, strategy, analytics, reports, and operational readiness."
            action={<StatusIndicator label="Privacy scoped" tone="success" />}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {views.map((view) => (
              <IntelligenceViewCard key={view.title} view={view} />
            ))}
          </div>
        </Panel>

        {data.sectionData.length > 0 && (
          <Panel className="p-5">
            <SectionHeader
              title={`${selectedHospital.name} overview data map`}
              description="Current available intelligence, strategy, analytics, and reporting evidence in one summary view."
              action={<StatusIndicator label="Harika data" tone="success" />}
            />
            <div className="grid gap-5 xl:grid-cols-2">
              {data.sectionData.map((section) => (
                <section key={section.section} id={section.section.toLowerCase()} className="rounded-lg border bg-background p-4">
                  <h2 className="text-base font-semibold">{section.section}</h2>
                  <div className="mt-4 space-y-3">
                    {section.items.map((sourceItem) => {
                      const item = resolveSectionItem(sourceItem);
                      const itemContent = (
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                          </div>
                          <StatusIndicator label={item.value} tone={item.state === "ready" ? "success" : item.state === "empty" ? "neutral" : "warning"} />
                        </div>
                      );

                      return item.href ? (
                        <Link
                          key={item.title}
                          id={item.anchorId}
                          href={item.href}
                          className="block scroll-mt-24 rounded-lg border bg-card p-3 transition hover:border-primary/40 hover:bg-info/30"
                        >
                          {itemContent}
                        </Link>
                      ) : (
                        <div key={item.title} id={item.anchorId} className="scroll-mt-24 rounded-lg border bg-card p-3">
                          {itemContent}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </Panel>
        )}

        <Panel className="p-5" id="social-raw-data">
          <SectionHeader
            title="Social intelligence raw data"
            description={`Platform-separated social data for ${selectedHospital.name}.`}
            action={
              <StatusIndicator
                label={socialError ? "Needs attention" : socialIntelligence?.workspaceId ? "Live database" : "No data"}
                tone={socialError ? "danger" : socialIntelligence?.workspaceId ? "success" : "neutral"}
              />
            }
          />
          {socialError ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              {socialError}
            </p>
          ) : !isHarikaHospital(selectedHospital) ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              This hospital has the same Social Intelligence architecture, but no connected Facebook or Instagram workspace has been assigned yet.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <SocialPlatformCard
                  title="Instagram"
                  summary={instagramSummary}
                  detail="Historical Instagram posts with reach, saves, comments, likes, media type, hashtags, and post-level metrics."
                />
                <SocialPlatformCard
                  title="Facebook"
                  summary={facebookSummary}
                  detail="Graph API Page posts with messages, permalinks, images, reactions, comments, shares, and stored raw payloads."
                />
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Facebook raw post feed</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Latest stored Facebook rows from Harika&apos;s isolated social workspace.
                    </p>
                  </div>
                  <StatusIndicator
                    label={`${socialRawPosts.length} shown`}
                    tone={socialRawPosts.length ? "info" : "neutral"}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {socialRawPosts.map((post) => (
                    <article key={post.id} className="rounded-lg border bg-card p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {post.caption?.trim() ? truncate(post.caption, 120) : "Untitled Facebook post"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(post.postedAt)} · {post.postId}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusIndicator label={`${post.metrics?.likes ?? 0} reactions`} tone="info" />
                          <StatusIndicator label={`${post.metrics?.comments ?? 0} comments`} tone="neutral" />
                          <StatusIndicator label={`${post.metrics?.shares ?? 0} shares`} tone="neutral" />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                        <p className="min-w-0 break-words">Post URL: {post.url ?? "Unavailable"}</p>
                        <p className="min-w-0 break-words">Image URL: {post.mediaUrl ?? "Unavailable"}</p>
                      </div>
                      <details className="mt-3 rounded-lg border bg-background p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-foreground">
                          Stored raw Graph API payload
                        </summary>
                        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">
                          {JSON.stringify(post.rawData, null, 2)}
                        </pre>
                      </details>
                    </article>
                  ))}
                  {socialIntelligence && socialRawPosts.length === 0 && (
                    <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                      No Facebook raw posts are stored for this hospital yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <InsightPanel title="Hospital-specific readout" description="The selected hospital drives this intelligence." state="ready">
            {data.leadingInsight}
          </InsightPanel>

          <EvidenceList
            title="Privacy boundary"
            description="Client data isolation for admin intelligence."
            items={[
              { title: "Selected client scope", detail: data.privacyNote, state: "ready" },
              { title: "Stored selection", detail: "The selected hospital id is stored locally and sent as x-hospital-id when APIs are used.", state: "ready" },
              { title: "Future clients", detail: "New hospitals can be added to the hospital list without changing the page structure.", state: "ready" },
              { title: "No cross-client display", detail: "The page reads metrics from the selected hospital dataset only.", state: "ready" },
            ]}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <ComparisonBars
            title="Intelligence readiness"
            description={`Readiness for ${selectedHospital.name}.`}
            items={data.readiness}
          />

          <IntelligenceActionQueue
            title="Admin next moves"
            description="Actions that turn this hospital's intelligence into operational progress."
            actions={[
              {
                title: "Review the hospital growth overview",
                detail: "Start from the VIP score, review risk, competitor pressure, and recommended actions.",
                owner: "Admin",
                due: "Now",
                state: "ready",
                href: `${base}/dashboard`,
              },
              {
                title: "Check market alignment",
                detail: "Compare competitor gaps before assigning content work.",
                owner: "Admin",
                due: "Today",
                state: "ready",
                href: `${base}/competitor-intelligence`,
              },
              {
                title: "Use executive briefing for leadership",
                detail: "Send a concise leadership view only after evidence and live states are clear.",
                owner: "Leadership",
                due: "Weekly",
                state: "ready",
                href: `${base}/executive`,
              },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

function IntelligenceViewCard({ view }: { view: IntelligenceView }) {
  return (
    <Link href={view.href} className="flex min-h-[280px] flex-col rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <view.icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label="Live" tone="success" />
      </div>
      <h2 className="mt-4 text-sm font-semibold">{view.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{view.subtitle}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{view.detail}</p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        {view.metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-card p-2">
            <p className="break-words text-[11px] font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-1 break-words text-sm font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Open detail
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

function SocialPlatformCard({
  title,
  summary,
  detail,
}: {
  title: string;
  summary: SocialPlatformSummary | undefined;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <StatusIndicator
          label={summary ? "Connected" : "Empty"}
          tone={summary ? "success" : "neutral"}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric label="Posts" value={summary ? integer(summary.posts) : "0"} />
        <MiniMetric label={title === "Facebook" ? "Reactions" : "Likes"} value={summary ? integer(summary.likes) : "0"} />
        <MiniMetric label="Comments" value={summary ? integer(summary.comments) : "0"} />
        <MiniMetric label="Shares" value={summary ? integer(summary.shares) : "0"} />
        <MiniMetric label="Saves" value={summary ? integer(summary.saves) : "0"} />
        <MiniMetric label="Reach" value={summary ? integer(summary.reach) : "0"} />
        <MiniMetric label="Impressions" value={summary ? integer(summary.impressions) : "0"} />
        <MiniMetric label="Avg engagement" value={summary ? `${summary.avgEngagementRate.toFixed(2)}%` : "0.00%"} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-2">
      <p className="break-words text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
