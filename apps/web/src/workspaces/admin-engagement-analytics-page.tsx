"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  Flame,
  HeartPulse,
  LineChart,
  MessageCircle,
  Repeat2,
  Save,
  Share2,
  Sparkles,
  Stethoscope,
  ThumbsUp,
  TrendingUp,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import { IntelligenceHero } from "@/design-system/dashboard-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";

type EngagementAnalytics = {
  success: boolean;
  workspaceId: string | null;
  overview: {
    engagementRate: number;
    totalInteractions: number;
    growthTrend: { direction: string; percentageChange: number | null };
    postsAnalyzed: number;
  };
  interactionBreakdown: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  contentEngagement: Array<EngagementBucket & { format: string }>;
  audienceEngagement: {
    returningEngagers: number;
    newEngagers: number;
    returningShare: number;
    newShare: number;
    confidence: string;
    basis: string;
  };
  departmentPerformance: Array<EngagementBucket & { department: string }>;
  doctorInfluence: Array<{
    doctor: string;
    posts: number;
    interactions: number;
    engagementRate: number;
    influenceScore: number;
    topPost: { caption: string | null; engagementRate: number } | null;
  }>;
  qualityScore: {
    score: number;
    label: string;
    drivers: Array<{ label: string; value: number }>;
  };
  benchmarking: {
    historical: {
      current: number;
      average: number | null;
      label: string;
      status: string;
    };
    competitors: {
      current: number | null;
      average: number | null;
      sampleSize: number;
      label: string;
      status: string;
      competitors: Array<{ name: string; engagementRate: number }>;
    };
    industry: {
      current: number;
      average: number | null;
      label: string;
      status: string;
      references: Array<{ label: string; value: number; range: string; source: string }>;
    };
  };
  recommendations: Array<{
    title: string;
    priority: string;
    rationale: string;
    action: string;
  }>;
  notes: string[];
};

type EngagementBucket = {
  posts: number;
  interactions: number;
  engagementRate: number;
  qualitySignals: {
    saves: number;
    comments: number;
    shares: number;
  };
  topPost: { caption: string | null; engagementRate: number } | null;
};

const interactionIcons = {
  likes: ThumbsUp,
  comments: MessageCircle,
  shares: Share2,
  saves: Save,
};

export function AdminEngagementAnalyticsPage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/admin/engagement-analytics?hospitalId=${encodeURIComponent(selectedHospital.id)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load engagement analytics.");
        return response.json() as Promise<EngagementAnalytics>;
      })
      .then(async (payload) => {
        if (!payload.workspaceId && isHarikaSocialHospital(selectedHospital)) {
          const fallbackResponse = await fetch(
            "/api/admin/engagement-analytics?hospitalId=harika-ent-care-hospitals",
            { signal: controller.signal }
          );

          if (fallbackResponse.ok) {
            payload = (await fallbackResponse.json()) as EngagementAnalytics;
          }
        }

        setAnalytics(payload);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load engagement analytics.");
      });

    return () => controller.abort();
  }, [selectedHospital]);

  const totalInteractionValue = useMemo(() => {
    if (!analytics) return 0;
    const values = analytics.interactionBreakdown;
    return values.likes + values.comments + values.shares + values.saves;
  }, [analytics]);

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Analytics / Engagement"
        title={`${selectedHospital.name} engagement intelligence`}
        description="A decision dashboard for what earns attention, what creates deeper interaction, and where the next hospital content cycle should focus."
        icon={Flame}
        state={error ? "error" : analytics?.workspaceId ? "ready" : "empty"}
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <Panel className="border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
            {error}
          </Panel>
        )}

        {!error && analytics && (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ExecutiveMetric
                icon={Activity}
                label="Engagement rate"
                value={percent(analytics.overview.engagementRate)}
                detail={`${integer(analytics.overview.postsAnalyzed)} posts analyzed`}
                tone={analytics.overview.engagementRate > 0 ? "success" : "neutral"}
              />
              <ExecutiveMetric
                icon={HeartPulse}
                label="Total interactions"
                value={integer(analytics.overview.totalInteractions)}
                detail="Likes, comments, shares, saves, and clicks"
                tone="info"
              />
              <ExecutiveMetric
                icon={TrendingUp}
                label="Growth trend"
                value={trendLabel(analytics.overview.growthTrend)}
                detail={trendDetail(analytics.overview.growthTrend)}
                tone={trendTone(analytics.overview.growthTrend.direction)}
              />
              <ExecutiveMetric
                icon={Brain}
                label="Quality score"
                value={`${analytics.qualityScore.score}/100`}
                detail={analytics.qualityScore.label}
                tone={analytics.qualityScore.score >= 65 ? "success" : analytics.qualityScore.score >= 50 ? "warning" : "danger"}
              />
            </div>

            {!analytics.workspaceId ? (
              <Panel className="p-5">
                <SectionHeader
                  title="No connected engagement workspace"
                  description="This hospital is ready for the engagement analytics architecture, but no social workspace is mapped yet."
                  action={<StatusIndicator label="Empty" tone="neutral" />}
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  Connect Instagram, Facebook, or other social accounts to start calculating hospital engagement intelligence.
                </p>
              </Panel>
            ) : (
              <>
                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                  <Panel className="p-5">
                    <SectionHeader
                      title="Interaction breakdown"
                      description="Shows the mix of lightweight and deeper engagement actions."
                      action={<StatusIndicator label={integer(totalInteractionValue)} tone="info" />}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(analytics.interactionBreakdown).map(([key, value]) => {
                        const Icon = interactionIcons[key as keyof typeof interactionIcons];
                        return (
                          <MetricShareCard
                            key={key}
                            icon={Icon}
                            label={friendly(key)}
                            value={value}
                            total={Math.max(totalInteractionValue, 1)}
                          />
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <SectionHeader
                      title="Engagement quality score"
                      description="Balances rate, comment depth, saves, shares, and trend momentum."
                      action={<StatusIndicator label={analytics.qualityScore.label} tone={analytics.qualityScore.score >= 65 ? "success" : "warning"} />}
                    />
                    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                      <div className="flex aspect-square items-center justify-center rounded-full border bg-info text-center">
                        <div>
                          <p className="text-4xl font-semibold">{analytics.qualityScore.score}</p>
                          <p className="text-xs font-medium text-muted-foreground">out of 100</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {analytics.qualityScore.drivers.map((driver) => (
                          <ProgressRow
                            key={driver.label}
                            label={driver.label}
                            value={driver.value}
                            detail={driver.label.includes("Growth") ? `${driver.value}%` : `${driver.value}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </Panel>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel className="p-5">
                    <SectionHeader
                      title="Content engagement"
                      description="Which formats earn the strongest response."
                      action={<Video className="size-5 text-primary" aria-hidden />}
                    />
                    <div className="space-y-3">
                      {analytics.contentEngagement.map((item) => (
                        <PerformanceRow
                          key={item.format}
                          label={item.format}
                          value={item.engagementRate}
                          meta={`${integer(item.posts)} posts / ${integer(item.interactions)} interactions`}
                          detail={qualitySignalText(item)}
                        />
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <SectionHeader
                      title="Audience engagement"
                      description="Estimated returning and new engagement split."
                      action={<StatusIndicator label={analytics.audienceEngagement.confidence} tone="warning" />}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AudienceCard
                        icon={Repeat2}
                        label="Returning engagers"
                        value={analytics.audienceEngagement.returningEngagers}
                        share={analytics.audienceEngagement.returningShare}
                      />
                      <AudienceCard
                        icon={Users}
                        label="New engagers"
                        value={analytics.audienceEngagement.newEngagers}
                        share={analytics.audienceEngagement.newShare}
                      />
                    </div>
                    <p className="mt-3 rounded-lg border bg-card p-3 text-xs leading-5 text-muted-foreground">
                      {analytics.audienceEngagement.basis}
                    </p>
                  </Panel>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <Panel className="p-5">
                    <SectionHeader
                      title="Department performance"
                      description="Specialty signals inferred from category and caption evidence."
                      action={<Stethoscope className="size-5 text-primary" aria-hidden />}
                    />
                    <div className="space-y-3">
                      {analytics.departmentPerformance.map((item) => (
                        <PerformanceRow
                          key={item.department}
                          label={item.department}
                          value={item.engagementRate}
                          meta={`${integer(item.posts)} posts / ${integer(item.interactions)} interactions`}
                          detail={item.topPost?.caption ? truncate(item.topPost.caption, 110) : qualitySignalText(item)}
                        />
                      ))}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <SectionHeader
                      title="Doctor influence analytics"
                      description="Doctor-led content ranked by engagement and depth signals."
                      action={<UserRound className="size-5 text-primary" aria-hidden />}
                    />
                    {analytics.doctorInfluence.length ? (
                      <div className="space-y-3">
                        {analytics.doctorInfluence.map((doctor, index) => (
                          <div key={doctor.doctor} className="rounded-lg border bg-card p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">#{index + 1} {doctor.doctor}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {integer(doctor.posts)} posts / {integer(doctor.interactions)} interactions
                                </p>
                              </div>
                              <StatusIndicator label={`${doctor.influenceScore.toFixed(1)} score`} tone="success" />
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {percent(doctor.engagementRate)} engagement. {doctor.topPost?.caption ? truncate(doctor.topPost.caption, 120) : "No caption sample available."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border bg-card p-3 text-sm leading-6 text-muted-foreground">
                        Doctor-led posts were not confidently detected. Add doctor names to brand memory or captions to unlock ranking.
                      </p>
                    )}
                  </Panel>
                </div>

                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <Panel className="p-5">
                    <SectionHeader
                      title="Benchmarking"
                      description="Client history first, then competitor and industry context when available."
                      action={<BarChart3 className="size-5 text-primary" aria-hidden />}
                    />
                    <div className="space-y-3">
                      <BenchmarkCard
                        title="Historical performance"
                        current={analytics.benchmarking.historical.current}
                        average={analytics.benchmarking.historical.average}
                        label={analytics.benchmarking.historical.label}
                        status={analytics.benchmarking.historical.status}
                      />
                      <BenchmarkCard
                        title="Competitors"
                        current={analytics.overview.engagementRate}
                        average={analytics.benchmarking.competitors.average}
                        label={`${analytics.benchmarking.competitors.label} / ${analytics.benchmarking.competitors.sampleSize} competitors`}
                        status={analytics.benchmarking.competitors.status}
                      />
                      <BenchmarkCard
                        title="Industry averages"
                        current={analytics.benchmarking.industry.current}
                        average={analytics.benchmarking.industry.average}
                        label={analytics.benchmarking.industry.label}
                        status={analytics.benchmarking.industry.status}
                      />
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <SectionHeader
                      title="Recommendations"
                      description="Next actions tied to the dashboard signals."
                      action={<Sparkles className="size-5 text-primary" aria-hidden />}
                    />
                    <div className="space-y-3">
                      {analytics.recommendations.map((recommendation) => (
                        <div key={recommendation.title} className="rounded-lg border bg-card p-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-semibold">{recommendation.title}</h3>
                            <StatusIndicator label={recommendation.priority} tone={recommendation.priority === "HIGH" ? "warning" : "info"} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{recommendation.rationale}</p>
                          <p className="mt-2 rounded-md bg-background p-2 text-xs font-medium leading-5">
                            {recommendation.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                <Panel className="p-5">
                  <SectionHeader
                    title="Interpretation notes"
                    description="Important limits so decisions stay grounded."
                    action={<LineChart className="size-5 text-primary" aria-hidden />}
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    {analytics.notes.map((note) => (
                      <p key={note} className="rounded-lg border bg-card p-3 text-xs leading-5 text-muted-foreground">
                        {note}
                      </p>
                    ))}
                  </div>
                </Panel>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function ExecutiveMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label={label} tone={tone} />
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </Panel>
  );
}

function MetricShareCard({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
}) {
  const share = (value / total) * 100;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <span className="text-sm font-semibold">{integer(value)}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, share))}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{share.toFixed(1)}% of interactions</p>
    </div>
  );
}

function AudienceCard({
  icon: Icon,
  label,
  value,
  share,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  share: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{integer(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{share.toFixed(1)}% estimated share</p>
    </div>
  );
}

function PerformanceRow({
  label,
  value,
  meta,
  detail,
}: {
  label: string;
  value: number;
  meta: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
        <StatusIndicator label={percent(value)} tone={value > 0 ? "success" : "neutral"} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, value * 10))}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProgressRow({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-xs font-medium text-muted-foreground">{detail}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function BenchmarkCard({
  title,
  current,
  average,
  label,
  status,
}: {
  title: string;
  current: number;
  average: number | null;
  label: string;
  status: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p>
        </div>
        <StatusIndicator label={status === "DATA_LIMITED" ? "Data limited" : "Compared"} tone={status === "DATA_LIMITED" ? "neutral" : status === "BELOW_BENCHMARK" ? "warning" : "success"} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniValue label="Current" value={percent(current)} />
        <MiniValue label="Benchmark" value={average === null ? "N/A" : percent(average)} />
      </div>
    </div>
  );
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function qualitySignalText(item: Pick<EngagementBucket, "qualitySignals">) {
  return `${integer(item.qualitySignals.saves)} saves, ${integer(item.qualitySignals.comments)} comments, ${integer(item.qualitySignals.shares)} shares.`;
}

function trendLabel(trend: { direction: string; percentageChange: number | null }) {
  if (trend.percentageChange === null) return "Insufficient data";
  return `${trend.percentageChange > 0 ? "+" : ""}${trend.percentageChange}%`;
}

function trendDetail(trend: { direction: string; percentageChange: number | null }) {
  if (trend.percentageChange === null) return "Needs more post history";
  return `${friendly(trend.direction)} compared with earlier captured posts`;
}

function trendTone(direction: string) {
  if (direction === "UP") return "success";
  if (direction === "DOWN") return "warning";
  return "neutral";
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function friendly(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const isHarikaSocialHospital = isHarikaHospital;
