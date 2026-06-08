"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Captions,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  ImageIcon,
  LineChart,
  ListChecks,
  RadioTower,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  EvidenceList,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital as isHarikaHospitalIdentity } from "@/lib/harika-workspace";

type Benchmark = {
  label: string;
  sampleSize: number;
  position: string;
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
};

type SocialPost = {
  id: string;
  platform: string;
  caption: string | null;
  url: string | null;
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
};

type TopPost = {
  id: string;
  platform: string;
  caption: string | null;
  contentType: string;
  contentPillar: string;
  postedAt: string;
  engagementRate: number;
  reach: number;
  saves: number;
  comments: number;
  performanceScore: number;
};

type HashtagInsight = {
  tag: string;
  postCount: number;
  avgEngagementRate: number;
  benchmark: Benchmark;
};

type PostingWindow = {
  dayLabel: string;
  hourOfDay: number;
  postCount: number;
  avgEngagementRate: number;
  avgPerformanceScore: number;
};

type FormatInsight = {
  contentType: string;
  postCount: number;
  percentage: number;
  avgEngagementRate: number;
};

type PillarInsight = {
  pillar: string;
  postCount: number;
  avgPerformanceScore: number;
};

type SocialIntelligenceResponse = {
  success: boolean;
  workspaceId: string | null;
  platforms: SocialPlatformSummary[];
  posts: SocialPost[];
  topPosts: TopPost[];
  hashtagPerformance: HashtagInsight[];
  bestPostingTimes: PostingWindow[];
  contentTypeBreakdown: {
    formats: FormatInsight[];
    pillars: PillarInsight[];
  };
  engagementTrend: { direction: string; percentageChange: number | null } | null;
  rolling7Day: { totalPosts: number; avgEngagementRate: number; totalReach: number; totalComments: number; totalSaves: number } | null;
  rolling30Day: { totalPosts: number; avgEngagementRate: number; totalReach: number; totalComments: number; totalSaves: number } | null;
  insightNotes: string[];
};

type LoadedSocial = {
  data: SocialIntelligenceResponse | null;
  error: string | null;
  isHarika: boolean;
  hospital: {
    id: string;
    name: string;
  };
};

export function ProductionSocialIntelligencePage() {
  const loaded = useProductionSocial();
  const data = loaded.data;
  const totals = useSocialTotals(data);
  const state = surfaceState(loaded);

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Production intelligence"
        title={`${loaded.hospital.name} social intelligence`}
        description="Production-ready view of connected post history, content patterns, posting windows, and what the team can safely act on next."
        icon={RadioTower}
        state={state}
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {loaded.error && (
          <AlertBanner
            title="Social intelligence could not load"
            message={loaded.error}
            tone="danger"
          />
        )}

        {!loaded.error && !loaded.isHarika && (
          <AlertBanner
            title="No connected production social workspace"
            message="This client can use the same intelligence surface once Instagram or Facebook data is mapped to its tenant workspace."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid
          metrics={[
            {
              label: "Posts measured",
              value: integer(totals.posts),
              detail: "Stored Instagram and Facebook posts available for production decisions.",
              state,
              icon: FileText,
            },
            {
              label: "Recorded reach",
              value: integer(totals.reach),
              detail: "Reach is available where the source platform returned it.",
              state: totals.reach ? "ready" : "degraded",
              icon: BarChart3,
            },
            {
              label: "Average engagement",
              value: percent(totals.avgEngagementRate),
              detail: "Engagement is calculated from stored post-level metrics.",
              state: totals.avgEngagementRate ? "ready" : "empty",
              icon: TrendingUp,
            },
            {
              label: "Production actions",
              value: integer(data?.topPosts.length ?? 0),
              detail: "Top posts, formats, timing, and hashtags can become content briefs.",
              state: data?.topPosts.length ? "ready" : "empty",
              icon: ListChecks,
            },
          ]}
        />

        <Panel className="p-5">
          <SectionHeader
            title="Source coverage"
            description="Same evidence pattern as the admin social view, focused on what production can use."
            action={<StatusIndicator label={data?.workspaceId ? "Live workspace" : "No workspace"} tone={data?.workspaceId ? "success" : "neutral"} />}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            <PlatformCard
              title="Instagram"
              summary={data?.platforms.find((platform) => platform.platform === "INSTAGRAM")}
              detail="Best source for format, hashtag, saves, reach, and engagement pattern decisions."
            />
            <PlatformCard
              title="Facebook"
              summary={data?.platforms.find((platform) => platform.platform === "FACEBOOK")}
              detail="Useful for captions, public post proof, reactions, comments, and shares. Reach stays limited until Insights permissions return it."
            />
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Panel className="p-5">
            <SectionHeader
              title="Top production candidates"
              description="Use these as evidence-backed starting points for the next reviewed content package."
              action={<StatusIndicator label={`${data?.topPosts.length ?? 0} ranked`} tone={data?.topPosts.length ? "success" : "neutral"} />}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {(data?.topPosts ?? []).slice(0, 6).map((post, index) => (
                <TopPostCard key={post.id} post={post} rank={index + 1} />
              ))}
              {!data?.topPosts.length && (
                <EmptyState message="Top post ranking appears after connected social metrics are available." />
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Best observed posting windows"
              description="Schedule suggestions remain tests, not guaranteed outcomes."
              action={<Clock3 className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {(data?.bestPostingTimes ?? []).slice(0, 6).map((slot) => (
                <div key={`${slot.dayLabel}-${slot.hourOfDay}`} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{slot.dayLabel} at {formatHour(slot.hourOfDay)}</p>
                    <StatusIndicator label={`${slot.postCount} posts`} tone="info" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {percent(slot.avgEngagementRate)} average engagement, {slot.avgPerformanceScore.toFixed(1)} performance score.
                  </p>
                </div>
              ))}
              {!data?.bestPostingTimes.length && (
                <EmptyState message="Posting windows need measured publish history." />
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader
              title="Format and pillar signal"
              description="Production should repeat patterns only after clinical review and fresh creative fit."
              action={<ImageIcon className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {(data?.contentTypeBreakdown.formats ?? []).slice(0, 5).map((format) => (
                <BreakdownRow
                  key={format.contentType}
                  label={friendly(format.contentType)}
                  value={format.percentage}
                  detail={`${format.postCount} posts, ${percent(format.avgEngagementRate)} avg engagement`}
                />
              ))}
            </div>
          </Panel>

          <EvidenceList
            title="Production guardrails"
            description="What can be done now without overstating the intelligence."
            items={[
              {
                title: "Use measured social response",
                detail: "Top posts, hashtags, timing, and formats can guide briefs because they come from stored post history.",
                state: data?.workspaceId ? "ready" : "empty",
              },
              {
                title: "Keep GBP separate",
                detail: "Google Business Profile reviews and location actions are not included in these social scores.",
                state: "degraded",
              },
              {
                title: "Require clinical review",
                detail: "Every patient-facing insight still needs doctor approval before publishing.",
                state: "ready",
              },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

export function ProductionHashtagIntelligencePage() {
  const loaded = useProductionSocial();
  const data = loaded.data;
  const hashtags = data?.hashtagPerformance ?? [];
  const top = hashtags[0];
  const state = surfaceState(loaded);

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Hashtag intelligence"
        title={`${loaded.hospital.name} hashtag and topic signals`}
        description="Ranked hashtag performance, content pillar evidence, and controlled next tests for the production team."
        icon={Hash}
        state={state}
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {loaded.error && (
          <AlertBanner
            title="Hashtag intelligence could not load"
            message={loaded.error}
            tone="danger"
          />
        )}

        <IntelligenceMetricGrid
          metrics={[
            {
              label: "Tracked hashtags",
              value: integer(hashtags.length),
              detail: "Unique hashtags ranked from stored social posts.",
              state,
              icon: Hash,
            },
            {
              label: "Leading hashtag",
              value: top ? `#${top.tag}` : "Pending",
              detail: top ? `${top.postCount} posts at ${percent(top.avgEngagementRate)} average engagement.` : "Hashtag signal appears after social ingestion.",
              state: top ? "ready" : "empty",
              icon: Sparkles,
            },
            {
              label: "Content pillars",
              value: integer(data?.contentTypeBreakdown.pillars.length ?? 0),
              detail: "Pillars help production avoid repeating hashtags without a content reason.",
              state: data?.contentTypeBreakdown.pillars.length ? "ready" : "empty",
              icon: Captions,
            },
            {
              label: "Testing window",
              value: data?.bestPostingTimes[0] ? `${data.bestPostingTimes[0].dayLabel}` : "Pending",
              detail: "Hashtag tests should be scheduled inside measured content windows when available.",
              state: data?.bestPostingTimes[0] ? "ready" : "degraded",
              icon: CalendarClock,
            },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Panel className="p-5">
            <SectionHeader
              title="Ranked hashtags"
              description="Sorted by average engagement from the connected social history."
              action={<StatusIndicator label={`${hashtags.length} signals`} tone={hashtags.length ? "success" : "neutral"} />}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hashtags.slice(0, 18).map((hashtag) => (
                <HashtagCard key={hashtag.tag} hashtag={hashtag} />
              ))}
              {!hashtags.length && (
                <EmptyState message="No hashtag evidence is available for this workspace yet." />
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Next hashtag tests"
              description="Use these as brief inputs, not automatic publishing decisions."
              action={<CheckCircle2 className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {hashtags.slice(0, 5).map((hashtag, index) => (
                <div key={`test-${hashtag.tag}`} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">Test {index + 1}: #{hashtag.tag}</p>
                    <StatusIndicator label={hashtag.benchmark.label} tone={index < 2 ? "success" : "info"} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Pair with a doctor-reviewed education angle and compare against the client history sample of {hashtag.benchmark.sampleSize} hashtag observations.
                  </p>
                </div>
              ))}
              {!hashtags.length && (
                <EmptyState message="Hashtag tests need measured hashtag history first." />
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader
              title="Topic pillars behind hashtags"
              description="Hashtags should support the content pillar, not replace strategy."
              action={<LineChart className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(data?.contentTypeBreakdown.pillars ?? []).slice(0, 8).map((pillar) => (
                <div key={pillar.pillar} className="rounded-lg border bg-background p-3">
                  <p className="text-sm font-semibold">{friendly(pillar.pillar)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {pillar.postCount} posts, {pillar.avgPerformanceScore.toFixed(1)} average performance score.
                  </p>
                </div>
              ))}
              {!data?.contentTypeBreakdown.pillars.length && (
                <EmptyState message="Content pillar breakdown appears after post classification." />
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Move into production"
              description="Turn hashtag evidence into reviewed content work."
              action={<StatusIndicator label="Workflow ready" tone="info" />}
            />
            <div className="space-y-3">
              <ProductionAction
                title="Create a hashtag-backed content brief"
                detail="Use the top hashtag with the strongest matching content pillar and add patient-safe education copy."
                href="/production/content-calendar"
              />
              <ProductionAction
                title="Schedule inside a measured window"
                detail="Use the best observed publishing window, then compare the result against the current benchmark."
                href="/production/calendar"
              />
              <ProductionAction
                title="Send to clinical approval"
                detail="Hashtag performance is not a medical claim. Doctor review still controls publication."
                href="/production/content-pipeline"
              />
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function useProductionSocial(): LoadedSocial {
  const { activeHospital } = useHospital();
  const hospital = activeHospital ?? DEMO_HOSPITALS[0];
  const isHarika = isHarikaHospital(hospital);
  const [data, setData] = useState<SocialIntelligenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/admin/social-intelligence?hospitalId=${encodeURIComponent(hospital.id)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if(!response.ok) {
          throw new Error("Unable to load social intelligence.");
        }

        return response.json() as Promise<SocialIntelligenceResponse>;
      })
      .then(async (payload) => {
        if(!payload.workspaceId && isHarika) {
          const fallback = await fetch(
            "/api/admin/social-intelligence?hospitalId=harika-ent-care-hospitals",
            { signal: controller.signal }
          );

          if(fallback.ok) {
            payload = await fallback.json() as SocialIntelligenceResponse;
          }
        }

        setData(payload);
        setError(null);
      })
      .catch((caught: unknown) => {
        if(caught instanceof DOMException && caught.name === "AbortError") return;
        setData(null);
        setError(caught instanceof Error ? caught.message : "Unable to load social intelligence.");
      });

    return () => controller.abort();
  }, [hospital.id, isHarika]);

  return {
    data,
    error,
    isHarika,
    hospital,
  };
}

function useSocialTotals(data: SocialIntelligenceResponse | null) {
  return useMemo(() => {
    const platforms = data?.platforms ?? [];
    const posts = platforms.reduce((total, platform) => total + platform.posts, 0);
    const reach = platforms.reduce((total, platform) => total + platform.reach, 0);
    const impressions = platforms.reduce((total, platform) => total + platform.impressions, 0);
    const weightedEngagement = platforms.reduce(
      (total, platform) => total + platform.avgEngagementRate * platform.posts,
      0
    );

    return {
      posts,
      reach,
      impressions,
      avgEngagementRate: posts ? weightedEngagement / posts : 0,
    };
  }, [data]);
}

function surfaceState(loaded: LoadedSocial): SurfaceState {
  if(loaded.error) return "error";
  if(loaded.data?.workspaceId) return "ready";
  if(loaded.isHarika) return "degraded";
  return "empty";
}

function PlatformCard({
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
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
        <StatusIndicator label={summary ? "Connected" : "Empty"} tone={summary ? "success" : "neutral"} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MiniMetric label="Posts" value={summary ? integer(summary.posts) : "0"} />
        <MiniMetric label={title === "Facebook" ? "Reactions" : "Likes"} value={summary ? integer(summary.likes) : "0"} />
        <MiniMetric label="Comments" value={summary ? integer(summary.comments) : "0"} />
        <MiniMetric label="Shares" value={summary ? integer(summary.shares) : "0"} />
        <MiniMetric label="Saves" value={summary ? integer(summary.saves) : "0"} />
        <MiniMetric label="Reach" value={summary ? integer(summary.reach) : "0"} />
        <MiniMetric label="Impressions" value={summary ? integer(summary.impressions) : "0"} />
        <MiniMetric label="Avg engagement" value={summary ? percent(summary.avgEngagementRate) : "0.00%"} />
      </div>
    </div>
  );
}

function TopPostCard({
  post,
  rank,
}: {
  post: TopPost;
  rank: number;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <StatusIndicator label={`#${rank}`} tone="success" />
        <StatusIndicator label={friendly(post.platform)} tone="info" />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6">
        {post.caption?.trim() ? truncate(post.caption, 128) : "Untitled social post"}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(post.postedAt)} | {friendly(post.contentType)} | {friendly(post.contentPillar)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Score" value={post.performanceScore.toFixed(1)} />
        <MiniMetric label="Engagement" value={percent(post.engagementRate)} />
        <MiniMetric label="Reach" value={integer(post.reach)} />
        <MiniMetric label="Saves" value={integer(post.saves)} />
      </div>
    </article>
  );
}

function HashtagCard({ hashtag }: { hashtag: HashtagInsight }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-semibold">#{hashtag.tag}</p>
        <StatusIndicator label={hashtag.benchmark.label} tone="info" />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {hashtag.postCount} posts, {percent(hashtag.avgEngagementRate)} average engagement.
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Compared with {hashtag.benchmark.sampleSize} hashtag observations in this client history.
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <StatusIndicator label={`${value.toFixed(0)}%`} tone="info" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

function ProductionAction({
  title,
  detail,
  href,
}: {
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="grid gap-3 rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30 md:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      <ArrowRight className="size-4 self-center text-primary" aria-hidden />
    </Link>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-2">
      <p className="break-words text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border bg-card p-4 text-sm leading-6 text-muted-foreground">
      {message}
    </p>
  );
}

function isHarikaHospital(hospital: { id: string; name: string; slug?: string }) {
  return isHarikaHospitalIdentity(hospital);
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
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
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}
