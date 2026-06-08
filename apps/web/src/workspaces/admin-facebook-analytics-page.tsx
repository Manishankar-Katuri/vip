"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock3,
  FileText,
  LineChart,
  Link2,
  MapPin,
  MessageCircle,
  MousePointerClick,
  PlayCircle,
  RadioTower,
  Share2,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";

type Benchmark = {
  metric: string;
  scope: string;
  sampleSize: number;
  current: number;
  average: number | null;
  median: number | null;
  top25Threshold: number | null;
  bestObserved: number | null;
  position: string;
  label: string;
  industryReference: {
    label: string;
    range: string;
    source: string;
  } | null;
};

type SocialPlatformSummary = {
  platform: string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  avgEngagementRate: number;
  benchmarks?: {
    engagementRate: Benchmark;
    reach: Benchmark;
    interactions: Benchmark;
  };
};

type SocialPost = {
  id: string;
  platform: string;
  caption: string | null;
  url: string | null;
  mediaUrl: string | null;
  contentType: string;
  postedAt: string;
  hashtags: string[];
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
  } | null;
  benchmarks?: {
    engagementRate: Benchmark;
    reach: Benchmark;
  };
};

type TopPost = {
  id: string;
  platform: string;
  url: string | null;
  caption: string | null;
  mediaUrl: string | null;
  contentType: string;
  contentPillar: string;
  postedAt: string;
  engagementRate: number;
  reach: number;
  impressions: number;
  saves: number;
  comments: number;
  performanceScore: number;
  benchmarks?: {
    performanceScore: Benchmark;
    engagementRate: Benchmark;
    reach: Benchmark;
  };
};

type SocialIntelligenceResponse = {
  success: boolean;
  workspaceId: string | null;
  platforms: SocialPlatformSummary[];
  posts: SocialPost[];
  topPosts: TopPost[];
  bestPostingTimes: Array<{
    dayLabel: string;
    hourOfDay: number;
    postCount: number;
    avgEngagementRate: number;
    avgPerformanceScore: number;
    benchmark: Benchmark;
  }>;
  contentTypeBreakdown: {
    formats: Array<{
      contentType: string;
      postCount: number;
      percentage: number;
      avgEngagementRate: number;
      benchmark: Benchmark;
    }>;
  };
  benchmarks: {
    formulas: {
      engagementRate: string;
      performanceScore: string;
      reach: string;
    };
  } | null;
  insightNotes: string[];
};

type MetricState = "live" | "data-limited" | "setup-needed" | "not-connected";

type MetricCardData = {
  label: string;
  value: string;
  detail: string;
  state: MetricState;
  icon: LucideIcon;
};

const stateLabels: Record<MetricState, string> = {
  live: "Live",
  "data-limited": "Data limited",
  "setup-needed": "Setup needed",
  "not-connected": "Not connected",
};

const stateTones: Record<MetricState, Tone> = {
  live: "success",
  "data-limited": "warning",
  "setup-needed": "info",
  "not-connected": "neutral",
};

export function AdminFacebookAnalyticsPage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const selectedHospitalId = selectedHospital.id;
  const [socialIntelligence, setSocialIntelligence] =
    useState<SocialIntelligenceResponse | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/admin/social-intelligence?hospitalId=${encodeURIComponent(selectedHospitalId)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load Facebook analytics.");
        }

        return response.json() as Promise<SocialIntelligenceResponse>;
      })
      .then(async (payload) => {
        if (!payload.workspaceId && isHarikaSocialHospital(selectedHospital)) {
          const fallbackResponse = await fetch(
            "/api/admin/social-intelligence?hospitalId=harika-ent-care-hospitals",
            { signal: controller.signal }
          );

          if (fallbackResponse.ok) {
            payload = await fallbackResponse.json() as SocialIntelligenceResponse;
          }
        }

        setSocialError(null);
        setSocialIntelligence(payload);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setSocialError(error instanceof Error ? error.message : "Unable to load Facebook analytics.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [selectedHospital, selectedHospitalId]);

  const viewModel = useMemo(
    () => buildFacebookViewModel(socialIntelligence),
    [socialIntelligence]
  );

  const pageState: MetricState = socialError
    ? "data-limited"
    : viewModel.facebookSummary
      ? "live"
      : isLoading
        ? "data-limited"
        : "not-connected";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                <BarChart3 className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Facebook analytics
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                  {selectedHospital.name} Facebook performance
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Executive readout for Facebook reach, engagement, content performance, lead readiness,
              community response, benchmarks, and growth opportunities.
            </p>
          </div>
          <StatusIndicator label={stateLabels[pageState]} tone={stateTones[pageState]} />
        </div>
      </section>

      {socialError && (
        <Panel className="border-destructive/20 bg-destructive/8 p-4">
          <p className="text-sm font-semibold text-destructive">Unable to load Facebook analytics</p>
          <p className="mt-1 text-sm text-destructive">{socialError}</p>
        </Panel>
      )}

      {isLoading ? (
        <Panel className="p-5">
          <SectionHeader
            title="Loading Facebook analytics"
            description="Reading the selected hospital's connected social workspace."
            action={<StatusIndicator label="Loading" tone="info" />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg border bg-slate-100" />
            ))}
          </div>
        </Panel>
      ) : (
        <>
          <Panel className="p-5">
            <SectionHeader
              title="Executive summary"
              description="Simple leadership metrics. Missing lead or audience sources are called out instead of estimated."
              action={<StatusIndicator label={`${integer(viewModel.facebookPosts.length)} posts`} tone={viewModel.facebookSummary ? "success" : "neutral"} />}
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {viewModel.executiveMetrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {viewModel.availableMetrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} compact />
              ))}
            </div>
          </Panel>

          {!viewModel.facebookSummary && (
            <Panel className="p-5">
              <SectionHeader
                title="Facebook not connected"
                description="This hospital has no connected Facebook rows in the assigned social workspace."
                action={<StatusIndicator label="Not connected" tone="neutral" />}
              />
              <p className="rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
                Connect the hospital&apos;s Facebook Page through the existing social ingestion workflow before
                reporting Page performance, lead metrics, audience insights, or community response.
              </p>
            </Panel>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="Audience analytics"
                description="Audience growth, demographics, geography, and active times from Facebook Page insights."
                action={<Users className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {viewModel.audienceMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} compact />
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Active times"
                description="Best observed posting windows from connected Facebook history when available."
                action={<Clock3 className="size-5 text-primary" aria-hidden />}
              />
              {viewModel.facebookPostingTimes.length > 0 ? (
                <div className="space-y-3">
                  {viewModel.facebookPostingTimes.slice(0, 5).map((slot) => (
                    <div key={`${slot.dayLabel}-${slot.hourOfDay}`} className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          {slot.dayLabel} at {formatHour(slot.hourOfDay)}
                        </p>
                        <StatusIndicator label={`${slot.postCount} posts`} tone="success" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {percent(slot.avgEngagementRate)} avg engagement from stored post history.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <SetupNotice
                  title="Active time insights need more Facebook history"
                  detail="Once Facebook posts have enough time-bucketed performance, this panel will show the best posting windows."
                />
              )}
            </Panel>
          </div>

          <Panel className="p-5">
            <SectionHeader
              title="Content analytics"
              description="Facebook-only post, video, live session, and awareness campaign performance."
              action={<FileText className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 lg:grid-cols-4">
              <MetricCard metric={viewModel.contentMetrics.postPerformance} compact />
              <MetricCard metric={viewModel.contentMetrics.videoPerformance} compact />
              <MetricCard metric={viewModel.contentMetrics.livePerformance} compact />
              <MetricCard metric={viewModel.contentMetrics.awarenessPerformance} compact />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Top Facebook posts</h3>
                {viewModel.topFacebookPosts.length > 0 ? (
                  <div className="space-y-3">
                    {viewModel.topFacebookPosts.slice(0, 5).map((post, index) => (
                      <PostPerformanceRow key={post.id} post={post} rank={index + 1} />
                    ))}
                  </div>
                ) : (
                  <SetupNotice
                    title="No ranked Facebook posts yet"
                    detail="Top posts appear when Facebook post rows and engagement metrics are available."
                  />
                )}
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold">Format mix</h3>
                {viewModel.formatMix.length > 0 ? (
                  <div className="space-y-3">
                    {viewModel.formatMix.map((format) => (
                      <BreakdownBar
                        key={format.label}
                        label={format.label}
                        value={format.percentage}
                        detail={`${format.count} posts`}
                      />
                    ))}
                  </div>
                ) : (
                  <SetupNotice
                    title="No format mix available"
                    detail="Connect Facebook posts with content type labels to review format mix."
                  />
                )}
              </div>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel className="p-5">
              <SectionHeader
                title="Engagement analytics"
                description="Interactions and rate metrics available from connected Facebook posts."
                action={<ThumbsUp className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {viewModel.engagementMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} compact />
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Lead generation analytics"
                description="Appointment, Messenger, website, and form lead signals."
                action={<MousePointerClick className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {viewModel.leadMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} compact />
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="Community analytics"
                description="Response readiness and audience interaction quality."
                action={<MessageCircle className="size-5 text-primary" aria-hidden />}
              />
              <div className="space-y-3">
                {viewModel.communityMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} compact />
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Benchmarking"
                description="Historical performance is live where connected. Peer and industry views stay setup-labeled unless sourced."
                action={<LineChart className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-3">
                {viewModel.benchmarkMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} compact />
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <SectionHeader
              title="Growth recommendations"
              description="Actionable opportunities based only on connected Facebook data and visible setup gaps."
              action={<Sparkles className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {viewModel.growthRecommendations.map((recommendation) => (
                <div key={recommendation.title} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold">{recommendation.title}</h3>
                    <StatusIndicator label={recommendation.priority} tone={recommendation.tone} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function buildFacebookViewModel(payload: SocialIntelligenceResponse | null) {
  const facebookSummary = payload?.platforms.find((platform) => platform.platform === "FACEBOOK");
  const facebookPosts = (payload?.posts ?? []).filter((post) => post.platform === "FACEBOOK");
  const topFacebookPosts = (payload?.topPosts ?? []).filter((post) => post.platform === "FACEBOOK");
  const hasConnectedFacebook = Boolean(facebookSummary);
  const hasReach = Boolean(facebookSummary && (facebookSummary.reach > 0 || facebookSummary.impressions > 0));
  const interactions =
    (facebookSummary?.likes ?? 0) +
    (facebookSummary?.comments ?? 0) +
    (facebookSummary?.shares ?? 0) +
    (facebookSummary?.saves ?? 0);
  const engagementState: MetricState =
    hasConnectedFacebook && hasReach ? "live" : hasConnectedFacebook ? "data-limited" : "not-connected";
  const liveOrNotConnected: MetricState = hasConnectedFacebook ? "live" : "not-connected";

  const executiveMetrics: MetricCardData[] = [
    {
      label: "Page followers",
      value: "Setup needed",
      detail: "Facebook Page follower or fan count is not returned by the current VIP social intelligence API.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Users,
    },
    {
      label: "Reach",
      value: hasConnectedFacebook ? integer(facebookSummary?.reach ?? 0) : "Not connected",
      detail: hasReach
        ? "Reach is returned by connected Facebook insights."
        : "Facebook reach is data limited until Meta Insights permissions return reach or impressions.",
      state: hasConnectedFacebook ? (hasReach ? "live" : "data-limited") : "not-connected",
      icon: RadioTower,
    },
    {
      label: "Engagement",
      value: hasConnectedFacebook ? percent(facebookSummary?.avgEngagementRate ?? 0) : "Not connected",
      detail: hasReach
        ? "Average engagement rate is calculated from connected Facebook post metrics."
        : "Engagement rate needs reach or impressions. Reactions, comments, and shares are still shown as live interactions.",
      state: engagementState,
      icon: ThumbsUp,
    },
    {
      label: "Link clicks",
      value: "Setup needed",
      detail: "Post link click metrics are not present in the current Facebook analytics response.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Link2,
    },
    {
      label: "Leads generated",
      value: "Setup needed",
      detail: "Appointment, form, and Messenger lead attribution is not connected to Facebook analytics yet.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MousePointerClick,
    },
  ];

  const availableMetrics: MetricCardData[] = [
    {
      label: "Facebook posts",
      value: hasConnectedFacebook ? integer(facebookSummary?.posts ?? 0) : "0",
      detail: "Stored Facebook Page posts available for analytics review.",
      state: liveOrNotConnected,
      icon: FileText,
    },
    {
      label: "Reactions",
      value: hasConnectedFacebook ? integer(facebookSummary?.likes ?? 0) : "0",
      detail: "Facebook reactions captured from stored post metrics.",
      state: liveOrNotConnected,
      icon: ThumbsUp,
    },
    {
      label: "Comments",
      value: hasConnectedFacebook ? integer(facebookSummary?.comments ?? 0) : "0",
      detail: "Direct post comments captured from Facebook rows.",
      state: liveOrNotConnected,
      icon: MessageCircle,
    },
    {
      label: "Shares",
      value: hasConnectedFacebook ? integer(facebookSummary?.shares ?? 0) : "0",
      detail: "Post shares captured when Facebook provides the metric.",
      state: liveOrNotConnected,
      icon: Share2,
    },
  ];

  const audienceMetrics: MetricCardData[] = [
    {
      label: "Audience growth",
      value: "Setup needed",
      detail: "Requires Facebook Page follower or fan history from Meta Insights.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: LineChart,
    },
    {
      label: "Demographics",
      value: "Setup needed",
      detail: "Requires age and gender breakdown from Facebook Page audience insights.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Users,
    },
    {
      label: "Geographic distribution",
      value: "Setup needed",
      detail: "Requires city, region, or country audience breakdown from Meta Insights.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MapPin,
    },
    {
      label: "Active times",
      value: payload?.bestPostingTimes?.length ? "Post history" : "Setup needed",
      detail: payload?.bestPostingTimes?.length
        ? "Posting windows are derived from stored post performance history."
        : "Requires enough Facebook history or Page audience online data.",
      state: payload?.bestPostingTimes?.length ? "live" : hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Clock3,
    },
  ];

  const videoPosts = facebookPosts.filter((post) => post.contentType.includes("VIDEO"));
  const livePosts = facebookPosts.filter((post) => post.contentType === "LIVE");
  const awarenessPosts = topFacebookPosts.filter((post) => post.contentPillar === "AWARENESS");

  const contentMetrics = {
    postPerformance: {
      label: "Post performance",
      value: hasConnectedFacebook ? `${integer(facebookPosts.length)} posts` : "Not connected",
      detail: hasConnectedFacebook
        ? `${integer(interactions)} total interactions across stored Facebook posts.`
        : "Connect Facebook Page posts before reviewing post performance.",
      state: liveOrNotConnected,
      icon: FileText,
    },
    videoPerformance: {
      label: "Video performance",
      value: videoPosts.length ? `${integer(videoPosts.length)} videos` : "No live data",
      detail: videoPosts.length
        ? `${integer(totalPostInteractions(videoPosts))} interactions from Facebook video posts.`
        : "No Facebook video performance rows are available in the current response.",
      state: videoPosts.length ? "live" as const : hasConnectedFacebook ? "setup-needed" as const : "not-connected" as const,
      icon: PlayCircle,
    },
    livePerformance: {
      label: "Live sessions",
      value: livePosts.length ? `${integer(livePosts.length)} sessions` : "No live data",
      detail: livePosts.length
        ? `${integer(totalPostInteractions(livePosts))} interactions from Facebook Live content.`
        : "No Facebook Live session performance rows are available in the current response.",
      state: livePosts.length ? "live" as const : hasConnectedFacebook ? "setup-needed" as const : "not-connected" as const,
      icon: RadioTower,
    },
    awarenessPerformance: {
      label: "Awareness campaigns",
      value: awarenessPosts.length ? `${integer(awarenessPosts.length)} posts` : "No live data",
      detail: awarenessPosts.length
        ? "Awareness-labeled Facebook posts are available in top post history."
        : "No campaign source or awareness-labeled Facebook posts are available in the current response.",
      state: awarenessPosts.length ? "live" as const : hasConnectedFacebook ? "setup-needed" as const : "not-connected" as const,
      icon: Sparkles,
    },
  };

  const engagementMetrics: MetricCardData[] = [
    availableMetrics[1],
    availableMetrics[2],
    availableMetrics[3],
    {
      label: "CTR",
      value: "Setup needed",
      detail: "Click-through rate requires link clicks and reach or impressions from Facebook insights.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MousePointerClick,
    },
    {
      label: "Engagement rate",
      value: hasConnectedFacebook ? percent(facebookSummary?.avgEngagementRate ?? 0) : "Not connected",
      detail: hasReach
        ? "Calculated from connected Facebook post metrics."
        : "Data limited until Facebook reach or impressions are returned.",
      state: engagementState,
      icon: BarChart3,
    },
  ];

  const leadMetrics: MetricCardData[] = [
    {
      label: "Appointment clicks",
      value: "Setup needed",
      detail: "Requires a connected appointment CTA or tracked booking URL source.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MousePointerClick,
    },
    {
      label: "Messenger inquiries",
      value: "Setup needed",
      detail: "Requires Facebook Messenger inquiry ingestion or Meta conversation data.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MessageCircle,
    },
    {
      label: "Website visits",
      value: "Setup needed",
      detail: "Requires tracked Facebook website clicks or web analytics attribution.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Link2,
    },
    {
      label: "Form submissions",
      value: "Setup needed",
      detail: "Requires connected Facebook lead forms or CRM form attribution.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: FileText,
    },
  ];

  const communityMetrics: MetricCardData[] = [
    {
      label: "Response rate",
      value: "Setup needed",
      detail: "Requires Facebook inbox or comment response tracking.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: MessageCircle,
    },
    {
      label: "Response time",
      value: "Setup needed",
      detail: "Requires timestamped inbound and reply events from Facebook community management.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Clock3,
    },
    {
      label: "Audience interactions",
      value: hasConnectedFacebook ? integer(interactions) : "0",
      detail: "Live total of reactions, comments, shares, and saves from stored Facebook posts.",
      state: liveOrNotConnected,
      icon: Users,
    },
  ];

  const historicalBenchmark = facebookSummary?.benchmarks?.interactions;
  const industryReference = facebookSummary?.benchmarks?.engagementRate.industryReference;
  const benchmarkMetrics: MetricCardData[] = [
    {
      label: "Historical performance",
      value: historicalBenchmark ? historicalBenchmark.label : "Data limited",
      detail: historicalBenchmark
        ? benchmarkDetail(historicalBenchmark)
        : "Historical Facebook benchmark is unavailable until Facebook post metrics are connected.",
      state: historicalBenchmark ? benchmarkState(historicalBenchmark) : hasConnectedFacebook ? "data-limited" : "not-connected",
      icon: LineChart,
    },
    {
      label: "Similar hospitals",
      value: "Setup needed",
      detail: "Peer hospital benchmarking needs connected comparable hospital Facebook data.",
      state: hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: Users,
    },
    {
      label: "Industry standards",
      value: industryReference?.range ?? "Setup needed",
      detail: industryReference
        ? `${industryReference.label}: ${industryReference.source}.`
        : "No sourced industry standard is attached to the current Facebook benchmark response.",
      state: industryReference ? "live" : hasConnectedFacebook ? "setup-needed" : "not-connected",
      icon: BarChart3,
    },
  ];

  const formatMix = buildFormatMix(facebookPosts);

  return {
    facebookSummary,
    facebookPosts,
    topFacebookPosts,
    executiveMetrics,
    availableMetrics,
    setupNeededMetrics: [
      ...executiveMetrics,
      ...audienceMetrics,
      ...leadMetrics,
      ...communityMetrics,
    ].filter((metric) => metric.state === "setup-needed"),
    audienceMetrics,
    facebookPostingTimes: hasConnectedFacebook ? payload?.bestPostingTimes ?? [] : [],
    contentMetrics,
    engagementMetrics,
    leadMetrics,
    communityMetrics,
    benchmarkMetrics,
    formatMix,
    growthRecommendations: buildGrowthRecommendations({
      hasConnectedFacebook,
      hasReach,
      interactions,
      comments: facebookSummary?.comments ?? 0,
      shares: facebookSummary?.shares ?? 0,
      setupNeededCount: hasConnectedFacebook ? 9 : 0,
      topPost: topFacebookPosts[0],
    }),
  };
}

function MetricCard({ metric, compact = false }: { metric: MetricCardData; compact?: boolean }) {
  const Icon = metric.icon;

  return (
    <div className="min-w-0 rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <StatusIndicator label={stateLabels[metric.state]} tone={stateTones[metric.state]} />
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{metric.label}</p>
      <p className={compact ? "mt-1 break-words text-lg font-semibold" : "mt-1 break-words text-2xl font-semibold"}>
        {metric.value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
    </div>
  );
}

function SetupNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <StatusIndicator label="Setup needed" tone="info" />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function PostPerformanceRow({ post, rank }: { post: TopPost; rank: number }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusIndicator label={`#${rank}`} tone="success" />
          <StatusIndicator label={friendly(post.contentType)} tone="info" />
          <span className="text-xs text-muted-foreground">{formatDate(post.postedAt)}</span>
        </div>
        {post.url && (
          <a className="text-sm font-medium text-primary" href={post.url} target="_blank" rel="noreferrer">
            Open post
          </a>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">
        {post.caption?.trim() ? post.caption : "Untitled Facebook post"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MiniStat label="Score" value={post.performanceScore.toFixed(1)} />
        <MiniStat label="Comments" value={integer(post.comments)} />
        <MiniStat label="Saves" value={integer(post.saves)} />
        <MiniStat label="Reach" value={integer(post.reach)} />
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-2.5 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function BreakdownBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm font-semibold">{value.toFixed(1)}%</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function buildFormatMix(posts: SocialPost[]) {
  if (posts.length === 0) return [];

  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.contentType, (counts.get(post.contentType) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([contentType, count]) => ({
      label: friendly(contentType),
      count,
      percentage: (count / posts.length) * 100,
    }))
    .sort((left, right) => right.count - left.count);
}

function buildGrowthRecommendations({
  hasConnectedFacebook,
  hasReach,
  interactions,
  comments,
  shares,
  setupNeededCount,
  topPost,
}: {
  hasConnectedFacebook: boolean;
  hasReach: boolean;
  interactions: number;
  comments: number;
  shares: number;
  setupNeededCount: number;
  topPost: TopPost | undefined;
}) {
  if (!hasConnectedFacebook) {
    return [
      {
        title: "Connect the hospital Facebook Page",
        detail: "Facebook analytics cannot report live performance until the Page is assigned to this hospital's social workspace.",
        priority: "High",
        tone: "warning" as Tone,
      },
      {
        title: "Map lead sources before reporting leads",
        detail: "Connect appointment links, Messenger inquiries, website visits, and forms before using Facebook as a lead-generation report.",
        priority: "High",
        tone: "warning" as Tone,
      },
    ];
  }

  const recommendations = [
    {
      title: hasReach ? "Use reach trends to choose awareness topics" : "Connect Meta Insights for reach and CTR",
      detail: hasReach
        ? "Use the live reach signal to identify which hospital education topics should be repeated in awareness campaigns."
        : "Reach, impressions, and CTR are data limited. Enabling Meta Insights permissions will make executive reach and click reporting reliable.",
      priority: "High",
      tone: hasReach ? "success" as Tone : "warning" as Tone,
    },
    {
      title: "Prioritize posts with comment depth",
      detail: comments > 0
        ? `${integer(comments)} comments are available. Turn posts that create questions into doctor-led explainer follow-ups.`
        : "Comments are low or unavailable. Use clearer questions and service-line CTAs to create measurable conversation.",
      priority: "Medium",
      tone: "info" as Tone,
    },
    {
      title: "Turn high-share awareness into appointment CTAs",
      detail: shares > 0
        ? `${integer(shares)} shares are captured. Convert the most shared education posts into simple booking or inquiry next steps.`
        : "Shares are not yet strong. Use patient-friendly awareness posts with a single next action for families and caregivers.",
      priority: "Medium",
      tone: "info" as Tone,
    },
    {
      title: "Connect Messenger and form tracking before reporting leads",
      detail: `${setupNeededCount} executive lead or audience fields still need source integrations. Keep lead reporting setup-labeled until those sources are live.`,
      priority: "High",
      tone: "warning" as Tone,
    },
  ];

  if (topPost) {
    recommendations.unshift({
      title: "Repurpose the top Facebook post",
      detail: `The current top ranked Facebook post scored ${topPost.performanceScore.toFixed(1)}. Reuse its topic as a short video, reminder post, and appointment CTA.`,
      priority: "High",
      tone: "success" as Tone,
    });
  }

  if (interactions === 0) {
    recommendations.push({
      title: "Create a baseline engagement campaign",
      detail: "Reactions, comments, and shares are at zero in the current summary. Start with simple hospital education posts that ask one direct question.",
      priority: "Medium",
      tone: "info" as Tone,
    });
  }

  return recommendations;
}

function totalPostInteractions(posts: SocialPost[]) {
  return posts.reduce((total, post) => {
    const metrics = post.metrics;

    return total +
      (metrics?.likes ?? 0) +
      (metrics?.comments ?? 0) +
      (metrics?.shares ?? 0) +
      (metrics?.saves ?? 0);
  }, 0);
}

function benchmarkState(benchmark: Benchmark): MetricState {
  return benchmark.position === "DATA_LIMITED" ? "data-limited" : "live";
}

function benchmarkDetail(benchmark: Benchmark) {
  if (benchmark.position === "DATA_LIMITED") {
    return `${benchmark.scope} is data limited for this metric.`;
  }

  return `${benchmark.scope}: current ${formatBenchmarkValue(benchmark.current, benchmark.metric)}, average ${formatBenchmarkValue(benchmark.average, benchmark.metric)}, top 25% from ${formatBenchmarkValue(benchmark.top25Threshold, benchmark.metric)}.`;
}

function formatBenchmarkValue(value: number | null, metric: string) {
  if (value === null) return "N/A";

  return metric.toLowerCase().includes("rate") ||
    metric.toLowerCase().includes("engagement") ||
    metric.toLowerCase().includes("score")
    ? metric.toLowerCase().includes("score")
      ? value.toFixed(1)
      : percent(value)
    : integer(value);
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatHour(hour: number) {
  const date = new Date(Date.UTC(2026, 0, 1, hour));

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

function friendly(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const isHarikaSocialHospital = isHarikaHospital;
