"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock3, Flame, Hash, ImageIcon, Info, ListFilter, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";

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
  benchmarks: {
    engagementRate: Benchmark;
    reach: Benchmark;
    interactions: Benchmark;
  };
};

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
  benchmarks: {
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
  benchmarks: {
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
  hashtagPerformance: Array<{ tag: string; postCount: number; avgEngagementRate: number; benchmark: Benchmark }>;
  bestPostingTimes: Array<{
    dayLabel: string;
    hourOfDay: number;
    postCount: number;
    avgEngagementRate: number;
    avgPerformanceScore: number;
    benchmark: Benchmark;
  }>;
  contentTypeBreakdown: {
    pillars: Array<{ pillar: string; postCount: number; percentage: number; avgEngagementRate: number; avgPerformanceScore: number; benchmark: Benchmark }>;
    formats: Array<{ contentType: string; postCount: number; percentage: number; avgEngagementRate: number; benchmark: Benchmark }>;
  };
  engagementTrend: { direction: string; percentageChange: number | null } | null;
  rolling7Day: { totalPosts: number; avgEngagementRate: number; totalReach: number; totalComments: number; totalSaves: number } | null;
  rolling30Day: { totalPosts: number; avgEngagementRate: number; totalReach: number; totalComments: number; totalSaves: number } | null;
  benchmarks: {
    formulas: {
      engagementRate: string;
      performanceScore: string;
      reach: string;
    };
  } | null;
  insightNotes: string[];
};

const platformOptions = ["ALL", "INSTAGRAM", "FACEBOOK"] as const;

export function AdminSocialIntelligencePage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const selectedHospitalId = selectedHospital.id;
  const isHarikaHospital = isHarikaSocialHospital(selectedHospital);
  const [socialIntelligence, setSocialIntelligence] =
    useState<SocialIntelligenceResponse | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] =
    useState<(typeof platformOptions)[number]>("ALL");
  const [visiblePostCount, setVisiblePostCount] = useState(12);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/admin/social-intelligence?hospitalId=${encodeURIComponent(selectedHospitalId)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load social intelligence.");
        }

        return response.json() as Promise<SocialIntelligenceResponse>;
      })
      .then(async (payload) => {
        if (!payload.workspaceId && isHarikaHospital) {
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
        setPlatformFilter("ALL");
        setVisiblePostCount(12);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setSocialError(error instanceof Error ? error.message : "Unable to load social intelligence.");
      });

    return () => controller.abort();
  }, [isHarikaHospital, selectedHospitalId]);

  const socialByPlatform = useMemo(() => {
    const summaries = new Map<string, SocialPlatformSummary>();

    for (const platform of socialIntelligence?.platforms ?? []) {
      summaries.set(platform.platform, platform);
    }

    return summaries;
  }, [socialIntelligence]);

  const filteredPosts = useMemo(() => {
    const posts = socialIntelligence?.posts ?? [];

    return platformFilter === "ALL"
      ? posts
      : posts.filter((post) => post.platform === platformFilter);
  }, [platformFilter, socialIntelligence?.posts]);

  const visiblePosts = filteredPosts.slice(0, visiblePostCount);
  const totalPosts =
    socialIntelligence?.platforms.reduce((total, platform) => total + platform.posts, 0) ?? 0;
  const totalReach =
    socialIntelligence?.platforms.reduce((total, platform) => total + platform.reach, 0) ?? 0;
  const totalInteractions =
    socialIntelligence?.platforms.reduce(
      (total, platform) => total + platform.likes + platform.comments + platform.shares + platform.saves,
      0
    ) ?? 0;
  const averageEngagement =
    socialIntelligence?.platforms.length
      ? socialIntelligence.platforms.reduce((total, platform) => total + platform.avgEngagementRate, 0) / socialIntelligence.platforms.length
      : 0;

  return (
    <main className="min-h-screen bg-[#f3f6f9]">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusIndicator label="Social intelligence" tone="info" />
                <StatusIndicator
                  label={socialError ? "Needs attention" : socialIntelligence?.workspaceId ? "Connected" : "No workspace"}
                  tone={socialError ? "danger" : socialIntelligence?.workspaceId ? "success" : "neutral"}
                />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">VIP Admin / Intelligence</p>
              <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {selectedHospital.name} social command center
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                A decision-first view of social performance across posts, top content, hashtags, timing, formats, and trend signals.
              </p>
            </div>
            <div className="grid min-w-[280px] gap-2 rounded-2xl border bg-slate-50 p-3 shadow-sm sm:grid-cols-2">
              <HeroMetric label="Posts" value={integer(totalPosts)} />
              <HeroMetric label="Reach" value={integer(totalReach)} />
              <HeroMetric label="Interactions" value={integer(totalInteractions)} />
              <HeroMetric label="Avg engagement" value={percent(averageEngagement)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <Panel className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="border-b bg-[linear-gradient(135deg,#ffffff,#eef4fb)] p-5">
            <SectionHeader
              title="Social data coverage"
              description="Each hospital reads only from its assigned social workspace. Coverage, confidence, and missing-source states stay visible."
              action={
                <StatusIndicator
                  label={socialError ? "Needs attention" : socialIntelligence?.workspaceId ? `${integer(totalPosts)} posts` : "No workspace"}
                  tone={socialError ? "danger" : socialIntelligence?.workspaceId ? "success" : "neutral"}
                />
              }
            />
          </div>
          <div className="p-5">
          {socialError ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              {socialError}
            </p>
          ) : !isHarikaHospital ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              This client has the same Social Intelligence architecture, but no connected Instagram or Facebook workspace has been assigned yet.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <SocialPlatformCard
                title="Instagram"
                summary={socialByPlatform.get("INSTAGRAM")}
                detail="Historical Instagram posts with reach, saves, comments, likes, media type, hashtags, and post-level metrics."
              />
              <SocialPlatformCard
                title="Facebook"
                summary={socialByPlatform.get("FACEBOOK")}
                detail="Graph API Page posts with captions, permalinks, images, reactions, comments, and shares."
              />
            </div>
          )}
          </div>
        </Panel>

        {isHarikaHospital && socialIntelligence?.workspaceId && (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <DecisionBrief
                icon={Sparkles}
                title="What changed"
                detail={`${integer(totalPosts)} captured posts show which social formats are creating attention and which signals need follow-up.`}
              />
              <DecisionBrief
                icon={BarChart3}
                title="Why it matters"
                detail="Social evidence can guide content strategy, doctor approvals, and reputation learning without forcing leaders into raw tables first."
              />
              <DecisionBrief
                icon={TrendingUp}
                title="Next action"
                detail="Review top posts and timing windows, then convert one winning pattern into this week's content brief."
              />
            </section>

            <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                title="Posts list"
                description="Latest captured posts with platform, timing, metrics, hashtag signals, and public post links."
                action={<ListFilter className="size-5 text-primary" aria-hidden />}
              />
              <div className="mb-4 flex flex-wrap gap-2">
                {platformOptions.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      platformFilter === platform
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setPlatformFilter(platform);
                      setVisiblePostCount(12);
                    }}
                  >
                    {platform === "ALL" ? "All platforms" : friendly(platform)}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {visiblePosts.map((post) => (
                  <PostListCard key={post.id} post={post} />
                ))}
              </div>
              {visiblePostCount < filteredPosts.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="rounded-lg border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
                    onClick={() => setVisiblePostCount((count) => count + 12)}
                  >
                    Show more posts
                  </button>
                </div>
              )}
            </Panel>

            <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                title="How benchmarks work"
                description="Every visible score is compared against Harika's own stored history first. Industry references are shown only where configured."
                action={<StatusIndicator label="Client history first" tone="info" />}
              />
              <div className="grid gap-3 md:grid-cols-3">
                <BenchmarkFormula
                  title="Engagement rate"
                  detail={socialIntelligence.benchmarks?.formulas.engagementRate ?? ""}
                />
                <BenchmarkFormula
                  title="Performance score"
                  detail={socialIntelligence.benchmarks?.formulas.performanceScore ?? ""}
                />
                <BenchmarkFormula
                  title="Reach"
                  detail={socialIntelligence.benchmarks?.formulas.reach ?? ""}
                />
              </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Top performing posts"
                  description="Ranked by the stored performance score across engagement, saves, comments, reach, and impressions."
                  action={<StatusIndicator label={`${socialIntelligence.topPosts.length} ranked`} tone="success" />}
                />
                <div className="grid gap-3 2xl:grid-cols-2">
                  {socialIntelligence.topPosts.slice(0, 6).map((post, index) => (
                    <TopPostCard key={post.id} post={post} rank={index + 1} />
                  ))}
                </div>
              </Panel>

              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Peak time to post"
                  description="Best observed posting windows from the captured post history."
                  action={<Clock3 className="size-5 text-primary" aria-hidden />}
                />
                <div className="space-y-3">
                  {socialIntelligence.bestPostingTimes.slice(0, 7).map((slot) => (
                    <div key={`${slot.dayLabel}-${slot.hourOfDay}`} className="relative rounded-lg border bg-card p-3 pr-12 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{slot.dayLabel} at {formatHour(slot.hourOfDay)}</p>
                        <StatusIndicator label={`${slot.postCount} posts`} tone="info" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {percent(slot.avgEngagementRate)} avg engagement, {slot.avgPerformanceScore.toFixed(1)} performance score.
                      </p>
                      <BenchmarkLine benchmark={slot.benchmark} valueLabel="window score" />
                      <ScoreInfo
                        title="Posting window score"
                        detail="Peak time is ranked by the posts published in that day/hour bucket. We compare the bucket's average performance score and engagement rate against other captured posting windows."
                      />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Hashtag intelligence"
                  description="Ranked hashtags by average engagement across stored posts."
                  action={<Hash className="size-5 text-primary" aria-hidden />}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {socialIntelligence.hashtagPerformance.slice(0, 12).map((hashtag) => (
                    <div key={hashtag.tag} className="relative rounded-lg border bg-card p-3 pr-12">
                      <p className="break-words text-sm font-semibold">#{hashtag.tag}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {hashtag.postCount} posts · {percent(hashtag.avgEngagementRate)} avg engagement
                      </p>
                      <BenchmarkBadge benchmark={hashtag.benchmark} />
                      <ScoreInfo
                        title="Hashtag engagement"
                        detail="Hashtag engagement is the average engagement rate of posts using this hashtag, compared with other hashtags in the client's stored history."
                      />
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Format intelligence"
                  description="How content formats and pillars are performing."
                  action={<ImageIcon className="size-5 text-primary" aria-hidden />}
                />
                <div className="space-y-4">
                  <div className="space-y-2">
                    {socialIntelligence.contentTypeBreakdown.formats.map((format) => (
                      <BreakdownRow
                        key={format.contentType}
                        label={friendly(format.contentType)}
                        value={format.percentage}
                        detail={`${format.postCount} posts · ${percent(format.avgEngagementRate)} avg engagement`}
                        benchmark={format.benchmark}
                      />
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {socialIntelligence.contentTypeBreakdown.pillars.slice(0, 6).map((pillar) => (
                      <div key={pillar.pillar} className="relative rounded-lg border bg-card p-3 pr-12">
                        <p className="text-sm font-semibold">{friendly(pillar.pillar)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pillar.postCount} posts · {pillar.avgPerformanceScore.toFixed(1)} score
                        </p>
                        <BenchmarkBadge benchmark={pillar.benchmark} />
                        <ScoreInfo
                          title="Pillar score"
                          detail="Pillar score averages the performance score of posts in this content pillar, then compares it with other content pillars for this client."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Engagement trend"
                  description="Movement across the captured social history."
                  action={<TrendingUp className="size-5 text-primary" aria-hidden />}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Direction" value={friendly(socialIntelligence.engagementTrend?.direction ?? "Unavailable")} />
                  <MiniMetric label="Change" value={socialIntelligence.engagementTrend?.percentageChange === null ? "N/A" : `${socialIntelligence.engagementTrend?.percentageChange ?? 0}%`} />
                  <MiniMetric label="7-day posts" value={integer(socialIntelligence.rolling7Day?.totalPosts ?? 0)} />
                </div>
              </Panel>

              <Panel className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title="Intelligence notes"
                  description="Important limits and interpretation notes for this client."
                  action={<Flame className="size-5 text-primary" aria-hidden />}
                />
                <div className="space-y-2">
                  {socialIntelligence.insightNotes.map((note) => (
                    <p key={note} className="rounded-lg border bg-card p-3 text-sm leading-6 text-muted-foreground">
                      {note}
                    </p>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </section>
    </main>
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
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <StatusIndicator
          label={summary ? "Connected" : "Empty"}
          tone={summary ? "success" : "neutral"}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MiniMetric label="Posts" value={summary ? integer(summary.posts) : "0"} />
        <MiniMetric label={title === "Facebook" ? "Reactions" : "Likes"} value={summary ? integer(summary.likes) : "0"} />
        <MiniMetric label="Comments" value={summary ? integer(summary.comments) : "0"} />
        <MiniMetric label="Shares" value={summary ? integer(summary.shares) : "0"} />
        <MiniMetric label="Saves" value={summary ? integer(summary.saves) : "0"} />
        <MiniMetric
          label="Reach"
          value={summary ? integer(summary.reach) : "0"}
          benchmark={summary?.benchmarks.reach}
        />
        <MiniMetric label="Impressions" value={summary ? integer(summary.impressions) : "0"} />
        <MiniMetric
          label="Avg engagement"
          value={summary ? percent(summary.avgEngagementRate) : "0.00%"}
          benchmark={summary?.benchmarks.engagementRate}
        />
      </div>
      {summary?.benchmarks.engagementRate.industryReference && (
        <p className="mt-4 rounded-lg border bg-card p-3 text-xs leading-5 text-muted-foreground">
          Industry reference: {summary.benchmarks.engagementRate.industryReference.range} engagement for {title}. Source: {summary.benchmarks.engagementRate.industryReference.source}.
        </p>
      )}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function DecisionBrief({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-xl border bg-slate-50 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function TopPostCard({ post, rank }: { post: TopPost; rank: number }) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <StatusIndicator label={`#${rank}`} tone="success" />
        <StatusIndicator label={friendly(post.platform)} tone="info" />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6">
        {post.caption?.trim() ? truncate(post.caption, 120) : "Untitled social post"}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(post.postedAt)} · {friendly(post.contentType)} · {friendly(post.contentPillar)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Score" value={post.performanceScore.toFixed(1)} benchmark={post.benchmarks.performanceScore} />
        <MiniMetric label="Engagement" value={percent(post.engagementRate)} benchmark={post.benchmarks.engagementRate} />
        <MiniMetric label="Reach" value={integer(post.reach)} benchmark={post.benchmarks.reach} />
        <MiniMetric label="Comments" value={integer(post.comments)} />
      </div>
      <p className="mt-3 rounded-lg bg-background p-2 text-xs leading-5 text-muted-foreground">
        Ranked against {post.benchmarks.performanceScore.sampleSize} stored client posts. {post.benchmarks.performanceScore.label} for performance score.
      </p>
      {post.url && (
        <a className="mt-3 inline-flex text-sm font-medium text-primary" href={post.url} target="_blank" rel="noreferrer">
          Open post
        </a>
      )}
    </article>
  );
}

function PostListCard({ post }: { post: SocialPost }) {
  const metrics = post.metrics ?? {
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    reach: 0,
    impressions: 0,
    engagementRate: 0,
  };

  return (
    <article className="relative rounded-lg border bg-card p-3 pr-11 shadow-sm transition hover:border-primary/25 hover:shadow-md">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] xl:items-center">
        <div className="flex min-w-0 gap-3">
          {post.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              className="hidden size-16 shrink-0 rounded-lg border object-cover sm:block"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusIndicator label={friendly(post.platform)} tone="info" />
              <span className="text-xs text-muted-foreground">{formatDate(post.postedAt)} / {friendly(post.contentType)}</span>
              <BenchmarkBadge benchmark={post.benchmarks.engagementRate} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">
              {post.caption?.trim() ? post.caption : "Untitled social post"}
            </p>
            {post.hashtags.length > 0 && (
              <p className="mt-2 line-clamp-1 text-xs leading-5 text-muted-foreground">
                {post.hashtags.slice(0, 8).map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CompactMetric label={post.platform === "FACEBOOK" ? "Reactions" : "Likes"} value={integer(metrics.likes)} />
          <CompactMetric label="Comments" value={integer(metrics.comments)} />
          <CompactMetric label="Shares" value={integer(metrics.shares)} />
          <CompactMetric label="Engagement" value={percent(metrics.engagementRate)} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-xs leading-5 text-muted-foreground">
          Compared with {post.benchmarks.engagementRate.scope}: avg {formatBenchmarkValue(post.benchmarks.engagementRate.average, post.benchmarks.engagementRate.metric)}.
        </p>
        {post.url && (
          <a className="text-sm font-medium text-primary" href={post.url} target="_blank" rel="noreferrer">
            Open post
          </a>
        )}
      </div>

      <ScoreInfo
        title="Post engagement"
        detail={scoreExplanation("Engagement", post.benchmarks.engagementRate)}
      />
    </article>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-background px-2.5 py-2">
      <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
function BreakdownRow({
  label,
  value,
  detail,
  benchmark,
}: {
  label: string;
  value: number;
  detail: string;
  benchmark: Benchmark;
}) {
  return (
    <div className="relative rounded-lg border bg-card p-3 pr-12">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm font-semibold">{value.toFixed(1)}%</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      <BenchmarkBadge benchmark={benchmark} />
    </div>
  );
}

function BenchmarkFormula({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ScoreInfo({ title, detail }: { title: string; detail: string }) {
  return (
    <details className="group absolute bottom-2 right-2 z-10 text-xs">
      <summary className="flex size-6 cursor-pointer list-none items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary [&::-webkit-details-marker]:hidden">
        <Info className="size-3.5" aria-label={`How ${title} is calculated`} />
      </summary>
      <div className="absolute bottom-8 right-0 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 leading-5 text-muted-foreground">{detail}</p>
      </div>
    </details>
  );
}

function BenchmarkLine({
  benchmark,
  valueLabel,
}: {
  benchmark: Benchmark;
  valueLabel: string;
}) {
  if (benchmark.position === "DATA_LIMITED") {
    return (
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        <span className="font-semibold text-foreground">Data limited:</span> {valueLabel} cannot be benchmarked reliably for {benchmark.scope}.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs leading-5 text-muted-foreground">
      Compared with {benchmark.scope}: avg {formatBenchmarkValue(benchmark.average, benchmark.metric)}, median {formatBenchmarkValue(benchmark.median, benchmark.metric)}, top 25% starts at {formatBenchmarkValue(benchmark.top25Threshold, benchmark.metric)}.
    </p>
  );
}

function BenchmarkBadge({ benchmark }: { benchmark: Benchmark }) {
  return (
    <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${benchmarkTone(benchmark.position)}`}>
      {benchmark.label}
    </span>
  );
}

function MiniMetric({
  label,
  value,
  benchmark,
}: {
  label: string;
  value: string;
  benchmark?: Benchmark;
}) {
  return (
    <div className="relative min-h-[94px] min-w-0 rounded-lg border bg-background p-3 pr-10">
      <p className="break-words text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
      {benchmark && <BenchmarkBadge benchmark={benchmark} />}
      <ScoreInfo title={label} detail={scoreExplanation(label, benchmark)} />
    </div>
  );
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
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

function benchmarkTone(position: string) {
  const tones: Record<string, string> = {
    BELOW_BENCHMARK: "border-warning/35 bg-warning/15 text-warning-foreground",
    AT_BENCHMARK: "border-border bg-muted text-muted-foreground",
    STRONG: "border-primary/15 bg-info text-info-foreground",
    TOP_25: "border-success/20 bg-success/10 text-success-foreground",
    BEST_OBSERVED: "border-success/20 bg-success/10 text-success-foreground",
    DATA_LIMITED: "border-border bg-muted text-muted-foreground",
  };

  return tones[position] ?? tones.AT_BENCHMARK;
}

function scoreExplanation(label: string, benchmark?: Benchmark) {
  const normalized = label.toLowerCase();
  const comparison = benchmark
    ? benchmark.position === "DATA_LIMITED"
      ? `This metric is marked data limited because the connected platform has not returned enough reach or impression data for ${benchmark.scope}.`
      : `It is compared with ${benchmark.scope}: average ${formatBenchmarkValue(benchmark.average, benchmark.metric)}, median ${formatBenchmarkValue(benchmark.median, benchmark.metric)}, top 25% from ${formatBenchmarkValue(benchmark.top25Threshold, benchmark.metric)}, best observed ${formatBenchmarkValue(benchmark.bestObserved, benchmark.metric)}.`
    : "This value is shown from the stored post metrics for the selected hospital.";

  if (normalized.includes("engagement")) {
    return `Engagement rate is calculated as (likes + comments + shares + saves + clicks) divided by reach or impressions, then multiplied by 100. ${comparison}`;
  }

  if (normalized.includes("score")) {
    return `Performance score is weighted against this client's best historical posts: engagement 40%, saves 20%, comments 15%, reach 15%, impressions 10%. ${comparison}`;
  }

  if (normalized.includes("reach")) {
    return `Reach is the number of accounts reached from platform insights. Facebook reach stays data limited until Meta Insights returns reach or impressions. ${comparison}`;
  }

  if (normalized.includes("reaction") || normalized.includes("like")) {
    return `Reactions or likes are direct platform interactions captured from the connected social account. ${comparison}`;
  }

  if (normalized.includes("comment")) {
    return `Comments count direct replies captured for the post or platform. ${comparison}`;
  }

  if (normalized.includes("share")) {
    return `Shares count how often the post was shared when the platform provides that metric. ${comparison}`;
  }

  if (normalized.includes("save")) {
    return `Saves show how often users saved the post, when the platform provides that metric. ${comparison}`;
  }

  if (normalized.includes("impression")) {
    return `Impressions show total content views when the platform provides that metric. ${comparison}`;
  }

  return comparison;
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
