"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Gauge,
  LineChart,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceMetric,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { ReviewDashboardAnalytics } from "@/lib/intelligence/review-analytics";

type ReviewAnalyticsResponse = {
  success: boolean;
  analytics: ReviewDashboardAnalytics;
};

const formatter = new Intl.NumberFormat("en-IN");

export function AdminReviewAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReviewDashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const response = await fetch("/api/intelligence/reviews?hospital=Harika ENT Care Hospitals");
        const payload = await response.json() as ReviewAnalyticsResponse;

        if (!cancelled) {
          if (!payload.success) {
            setError("Review analytics could not be loaded.");
            return;
          }
          setAnalytics(payload.analytics);
        }
      } catch {
        if (!cancelled) setError("Review analytics could not be loaded.");
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo<IntelligenceMetric[]>(() => {
    if (!analytics) return [];

    return [
      {
        label: "Total reviews",
        value: formatter.format(analytics.overview.totalReviews),
        detail: "Owned review count when available; otherwise a structured demo baseline for dashboard preview.",
        state: analytics.dataSource === "owned" ? "ready" : "mock",
        icon: MessageSquareText,
      },
      {
        label: "Average rating",
        value: `${analytics.overview.averageRating.toFixed(1)}/5`,
        detail: "Weighted from available review-level ratings in the current analytics set.",
        state: analytics.overview.averageRating >= 4.3 ? "ready" : "degraded",
        icon: Star,
      },
      {
        label: "New reviews",
        value: formatter.format(analytics.overview.newReviews),
        detail: "Reviews dated in the last 30 days. Undated historical reviews are excluded from freshness counts.",
        state: analytics.overview.newReviews > 0 ? "ready" : "empty",
        icon: TrendingUp,
      },
      {
        label: "Review growth",
        value: `${analytics.overview.reviewGrowth}%`,
        detail: "Recent review velocity compared with the older review base in the current dataset.",
        state: analytics.overview.reviewGrowth >= 20 ? "ready" : "degraded",
        icon: Gauge,
      },
    ];
  }, [analytics]);

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AlertBanner title="Review analytics unavailable" message={error} tone="danger" />
        </section>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Panel className="p-5">
            <SectionHeader title="Loading review analytics" description="Preparing reputation intelligence." />
          </Panel>
        </section>
      </main>
    );
  }

  const pageState: SurfaceState = analytics.dataSource === "owned" ? "ready" : "mock";

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Analytics / Reviews"
        title="Review analytics dashboard"
        description="Reputation intelligence for reviews, ratings, sentiment, topics, departments, competitors, trends, benchmarks, and action priorities."
        icon={Star}
        state={pageState}
      >
        <StatusIndicator
          label={analytics.dataSource === "owned" ? "Owned reviews" : "Demo fallback"}
          tone={analytics.dataSource === "owned" ? "success" : "info"}
        />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {analytics.dataSource !== "owned" && (
          <AlertBanner
            title="Owned GBP review history is not fully connected"
            message="This page is showing structured demo reputation analytics so the workflow is visible. Connect and persist Google Business Profile reviews before treating sentiment, response coverage, and freshness as governed review intelligence."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Rating distribution"
              description="1-star to 5-star breakdown of current review evidence."
              action={<BarChart3 className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {analytics.ratingDistribution.map((item) => (
                <div key={item.rating}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.count} reviews - {item.percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, item.percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Sentiment analytics"
              description="Positive, neutral, and negative review mix."
              action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <SentimentCard label="Positive" value={analytics.sentiment.positive} tone="success" />
              <SentimentCard label="Neutral" value={analytics.sentiment.neutral} tone="neutral" />
              <SentimentCard label="Negative" value={analytics.sentiment.negative} tone="warning" />
            </div>
            <div className="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[analytics.sentiment]} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={() => "Sentiment"} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" name="Positive" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" fill="#64748b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="negative" name="Negative" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader
              title="Topic analysis"
              description="Review themes that should guide patient-experience action."
              action={<Users className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {analytics.topics.map((topic) => (
                <div key={topic.topic} className="rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{topic.topic}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{topic.insight}</p>
                    </div>
                    <StatusIndicator label={`${topic.score}/100`} tone={topic.sentiment === "Positive" ? "success" : topic.sentiment === "Neutral" ? "neutral" : "warning"} />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${topic.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Department review analytics"
              description="Ratings by department, with weak spots visible without extra drilldown."
              action={<Building2 className="size-5 text-primary" aria-hidden />}
            />
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Department</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                    <th className="px-3 py-2 font-medium">Reviews</th>
                    <th className="px-3 py-2 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.departments.map((department) => (
                    <tr key={department.department} className="border-t">
                      <td className="px-3 py-2 font-medium">{department.department}</td>
                      <td className="px-3 py-2">{department.rating.toFixed(1)}</td>
                      <td className="px-3 py-2">{department.reviews}</td>
                      <td className="px-3 py-2">
                        <StatusIndicator label={department.trend} tone={department.trend.startsWith("-") ? "warning" : "success"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Competitor reputation comparison"
            description="Local comparison of rating, review volume, sentiment, and growth."
            action={<Radar className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {analytics.competitors.map((competitor) => (
              <div key={competitor.name} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{competitor.name}</p>
                  <StatusIndicator label={`${competitor.rating.toFixed(1)}/5`} tone={competitor.name === "VIP" ? "success" : "neutral"} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Reviews" value={formatter.format(competitor.reviews)} />
                  <MiniStat label="Sentiment" value={`${competitor.sentiment}%`} />
                  <MiniStat label="Growth" value={`${competitor.growth}%`} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader
              title="Trend analysis"
              description="Rating trend and sentiment trend over time."
              action={<LineChart className="size-5 text-primary" aria-hidden />}
            />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={analytics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="rating" domain={[3.5, 5]} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="sentiment" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="rating" type="monotone" dataKey="rating" name="Rating" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="sentiment" type="monotone" dataKey="positive" name="Positive sentiment" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="sentiment" type="monotone" dataKey="negative" name="Negative sentiment" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Benchmarking"
              description="VIP compared with local competitors, industry standards, and historical averages."
              action={<Gauge className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {analytics.benchmarks.map((benchmark) => (
                <div key={benchmark.label} className="rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{benchmark.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        VIP {formatBenchmark(benchmark.vip, benchmark.unit)} vs benchmark {formatBenchmark(benchmark.benchmark, benchmark.unit)}
                      </p>
                    </div>
                    <StatusIndicator label={benchmark.status} tone={benchmark.status === "Ahead" ? "success" : benchmark.status === "Watch" ? "warning" : "danger"} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="AI recommendations"
            description="Plain actions to improve reputation without overcomplicating the workflow."
            action={<Sparkles className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {analytics.recommendations.map((recommendation) => (
              <div key={recommendation.title} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{recommendation.title}</h3>
                  <StatusIndicator label={recommendation.priority} tone={recommendation.priority === "High" ? "warning" : recommendation.priority === "Medium" ? "info" : "neutral"} />
                </div>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{recommendation.action}</p>
                <p className="mt-3 rounded-md bg-info/60 px-2.5 py-2 text-xs leading-5 text-info-foreground">{recommendation.impact}</p>
              </div>
            ))}
          </div>
        </Panel>

        <AlertBanner
          title="Healthcare-safe interpretation"
          message="Review analytics measure patient experience signals and public trust movement. They should not be presented as clinical outcome rankings or proof of treatment quality."
          tone="info"
        />
      </section>
    </main>
  );
}

function SentimentCard({ label, value, tone }: { label: string; value: number; tone: "success" | "neutral" | "warning" }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <StatusIndicator label={`${value}%`} tone={tone} />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}%</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function formatBenchmark(value: number, unit: "rating" | "percent" | "reviews") {
  if (unit === "rating") return `${value.toFixed(1)}/5`;
  if (unit === "percent") return `${value}%`;
  return formatter.format(value);
}
