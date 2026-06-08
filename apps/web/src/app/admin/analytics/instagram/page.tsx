"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import { DataInspectorDrawer, ExportPdfButton, FreshnessBadge } from "@/components/phase-e";
import { Panel, SectionHeader, StatusIndicator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import type { DataProvenance } from "@/lib/phase-e";
import { cn } from "@/lib/utils";

type BenchmarkStatus = "ABOVE_BENCHMARK" | "ON_BENCHMARK" | "BELOW_BENCHMARK" | "DATA_LIMITED";

type BenchmarkComparison = {
  label: "Hospital History" | "Local Competitors" | "Industry Average";
  value: number | null;
  status: BenchmarkStatus;
  display: string;
  source: string;
};

type Kpi = {
  key: string;
  label: string;
  value: number | null;
  displayValue: string;
  momChange: number | null;
  displayChange: string;
  benchmarkComparisons: BenchmarkComparison[];
};

type ContentRow = {
  id: string;
  title: string;
  format: string;
  postedAt: string;
  mediaUrl: string | null;
  url: string | null;
  reach: number;
  impressions: number;
  engagementRate: number;
  saves: number;
  shares: number;
  comments: number;
  appointmentClicks: number;
  benchmark: BenchmarkStatus;
};

type HealthcareRow = {
  label: string;
  posts: number;
  reach: number;
  engagementRate: number;
  appointmentClicks: number;
  benchmark: BenchmarkStatus;
};

type InstagramAnalyticsPayload = {
  success: boolean;
  workspaceId: string | null;
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  dataFreshness: string | null;
  provenance: DataProvenance;
  overview: {
    kpis: Kpi[];
    trend: Array<{ date: string; reach: number; impressions: number; engagementRate: number }>;
    summary: string[];
  };
  audience: {
    growthSeries: Array<{ date: string; followers: number }>;
    ageGroups: Array<{ label: string; value: number }>;
    genderSplit: Array<{ label: string; value: number }>;
    topCities: Array<{ label: string; value: number }>;
    activeHours: Array<{ day: string; hour: number; value: number }>;
  };
  content: {
    topByFormat: Record<string, ContentRow[]>;
    engagementByType: Array<{ label: string; posts: number; engagementRate: number }>;
  };
  engagement: {
    totals: Array<{ label: string; value: number; displayValue: string }>;
    mixTrend: Array<{ date: string; likes: number; comments: number; saves: number; shares: number }>;
    highestIntent: ContentRow[];
  };
  discovery: {
    reachTrend: Array<{ date: string; reach: number }>;
    impressionsTrend: Array<{ date: string; impressions: number }>;
    hashtags: Array<{ tag: string; postCount: number; reach: number; avgEngagementRate: number; benchmark: BenchmarkStatus }>;
    exploreReach: { value: number | null; status: BenchmarkStatus; note: string };
    discoverySplit: Array<{ label: string; value: number }> | null;
  };
  healthcareInsights: {
    departments: HealthcareRow[];
    doctorContent: HealthcareRow[];
    educationalContent: HealthcareRow[];
    awarenessCampaigns: HealthcareRow[];
  };
  benchmarks: Array<{ metric: string; current: string; comparisons: BenchmarkComparison[] }>;
  recommendations: Array<{
    title: string;
    priority: "High" | "Medium" | "Low";
    expectedImpact: string;
    evidenceMetric: string;
    owner: string;
    nextAction: string;
  }>;
  notes: string[];
  message?: string;
};

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const contentFormats = ["Posts", "Reels", "Carousels", "Stories"];

export default function InstagramAnalyticsPage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital;
  const [payload, setPayload] = useState<InstagramAnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!selectedHospital) return;
    const controller = new AbortController();

    fetch(`/api/admin/instagram-analytics?hospitalId=${encodeURIComponent(selectedHospital.id)}&days=${days}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load Instagram analytics.");
        return response.json() as Promise<InstagramAnalyticsPayload>;
      })
      .then((nextPayload) => {
        setError(null);
        setPayload(nextPayload);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load Instagram analytics.");
      });

    return () => controller.abort();
  }, [days, selectedHospital]);

  const primaryKpis = useMemo(() => payload?.overview.kpis ?? [], [payload]);

  if (!selectedHospital) {
    return (
      <div className="space-y-5">
        <Panel className="p-5 text-sm text-slate-600">Select a live workspace to load Instagram analytics.</Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Analytics / Instagram</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Instagram Analytics</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hospital social growth, audience discovery, content performance, and appointment intent.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Select analytics date range"
            >
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4" />
              {payload?.dataFreshness ? `Fresh as of ${dateLabel(payload.dataFreshness)}` : "Awaiting data"}
            </span>
            {payload?.provenance && <FreshnessBadge provenance={payload.provenance} />}
            {payload?.provenance && <DataInspectorDrawer provenance={payload.provenance} />}
            {payload && (
              <ExportPdfButton
                request={{
                  pageType: "analytics",
                  title: "Instagram Analytics",
                  business: selectedHospital.name,
                  summary: payload.overview.summary.join(" "),
                  kpis: payload.overview.kpis.slice(0, 6).map((kpi) => ({ label: kpi.label, value: kpi.displayValue, detail: kpi.displayChange })),
                  insights: payload.overview.summary,
                  recommendations: payload.recommendations.map((recommendation) => ({
                    title: recommendation.title,
                    summary: recommendation.nextAction,
                    evidence: recommendation.evidenceMetric,
                  })),
                  actionPlan: payload.recommendations.map((recommendation) => recommendation.nextAction),
                  evidenceSources: [{ label: "Instagram analytics", source: payload.provenance.sourceService, observedAt: payload.provenance.fetchedAt }],
                }}
              />
            )}
          </div>
        </div>
      </section>

      {error && (
        <Panel className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </Panel>
      )}

      {!payload && !error && (
        <Panel className="p-5 text-sm text-slate-600">Loading Instagram analytics for {selectedHospital.name}...</Panel>
      )}

      {payload && !payload.workspaceId && (
        <Panel className="p-5">
          <SectionHeader title="No Instagram account connected" description="Connect and map an Instagram Business account before using this analytics page for decisions." />
          <p className="text-sm text-slate-600">{payload.notes[0]}</p>
        </Panel>
      )}

      {payload?.workspaceId && (
        <>
          <ExecutiveOverview kpis={primaryKpis} trend={payload.overview.trend} summary={payload.overview.summary} provenance={payload.provenance} />
          <AudienceAnalytics audience={payload.audience} />
          <ContentPerformance content={payload.content} />
          <EngagementAnalytics engagement={payload.engagement} />
          <ReachDiscovery discovery={payload.discovery} />
          <HealthcareInsights healthcare={payload.healthcareInsights} />
          <Benchmarking benchmarks={payload.benchmarks} />
          <Recommendations recommendations={payload.recommendations} notes={payload.notes} />
        </>
      )}
    </div>
  );
}

function ExecutiveOverview({ kpis, trend, summary, provenance }: { kpis: Kpi[]; trend: InstagramAnalyticsPayload["overview"]["trend"]; summary: string[]; provenance: DataProvenance }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} provenance={provenance} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel className="p-4">
          <SectionHeader title="Reach and engagement trend" description="Compact 30-day view for executive review." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <LineChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => dateLabel(String(value))} />
                <Line dataKey="reach" name="Reach" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line dataKey="engagementRate" name="Engagement rate" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionHeader title="What changed this month" description="Three leadership-level signals from the current period." />
          <div className="space-y-3">
            {summary.map((item) => (
              <div key={item} className="flex gap-2 rounded-lg border bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function KpiCard({ kpi, provenance }: { kpi: Kpi; provenance: DataProvenance }) {
  const lead = kpi.benchmarkComparisons[0];
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{kpi.displayValue}</p>
        </div>
        <BenchmarkBadge status={lead?.status ?? "DATA_LIMITED"} />
      </div>
      <p className={cn("mt-2 text-xs font-medium", kpi.momChange !== null && kpi.momChange >= 0 ? "text-emerald-700" : "text-slate-500")}>
        {kpi.displayChange}
      </p>
      <div className="mt-3">
        <FreshnessBadge provenance={provenance} />
      </div>
      <div className="mt-3 grid gap-2">
        {kpi.benchmarkComparisons.map((comparison) => (
          <div key={comparison.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">{comparison.label}</span>
            <span className="font-medium text-slate-800">{statusLabel(comparison.status)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AudienceAnalytics({ audience }: { audience: InstagramAnalyticsPayload["audience"] }) {
  const hasAudience =
    audience.growthSeries.length || audience.ageGroups.length || audience.genderSplit.length || audience.topCities.length || audience.activeHours.length;

  return (
    <Panel className="p-4">
      <SectionHeader title="Audience Analytics" description="Growth, demographics, top cities, and active-hour signals from Instagram audience insights." />
      {!hasAudience ? (
        <EmptyMessage message="Audience demographics require Instagram business insights and enough audience volume." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="Audience growth trend">
            <LineMiniChart data={audience.growthSeries} x="date" y="followers" />
          </ChartPanel>
          <ChartPanel title="Age groups">
            <BarMiniChart data={audience.ageGroups} x="label" y="value" />
          </ChartPanel>
          <ChartPanel title="Gender split">
            <PieMiniChart data={audience.genderSplit} />
          </ChartPanel>
          <TopList title="Top cities" rows={audience.topCities} />
          <div className="xl:col-span-2">
            <ActiveHourHeatmap rows={audience.activeHours} />
          </div>
        </div>
      )}
    </Panel>
  );
}

function ContentPerformance({ content }: { content: InstagramAnalyticsPayload["content"] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Content Performance" description="Top posts, reels, carousels, stories, and engagement per content type." />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ChartPanel title="Engagement per content type">
          <BarMiniChart data={content.engagementByType} x="label" y="engagementRate" />
        </ChartPanel>
        <Tabs defaultValue="Posts" className="min-w-0">
          <TabsList className="grid w-full grid-cols-4">
            {contentFormats.map((format) => <TabsTrigger key={format} value={format}>{format}</TabsTrigger>)}
          </TabsList>
          {contentFormats.map((format) => (
            <TabsContent key={format} value={format}>
              <ContentTable rows={content.topByFormat[format] ?? []} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Panel>
  );
}

function EngagementAnalytics({ engagement }: { engagement: InstagramAnalyticsPayload["engagement"] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Engagement Analytics" description="Likes, comments, saves, shares, engagement rate, and high-intent interactions." />
      <div className="grid gap-3 md:grid-cols-5">
        {engagement.totals.map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{metric.displayValue}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartPanel title="Engagement mix over time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={engagement.mixTrend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => dateLabel(String(value))} />
                <Bar dataKey="likes" stackId="engagement" fill="var(--chart-1)" />
                <Bar dataKey="comments" stackId="engagement" fill="var(--chart-2)" />
                <Bar dataKey="saves" stackId="engagement" fill="var(--chart-3)" />
                <Bar dataKey="shares" stackId="engagement" fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">Highest intent engagement</h3>
          <ContentTable rows={engagement.highestIntent} compact />
        </div>
      </div>
    </Panel>
  );
}

function ReachDiscovery({ discovery }: { discovery: InstagramAnalyticsPayload["discovery"] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Reach & Discovery" description="Reach, impressions, hashtag performance, Explore reach, and discovery source signals." />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Reach trend">
          <LineMiniChart data={discovery.reachTrend} x="date" y="reach" />
        </ChartPanel>
        <ChartPanel title="Impressions trend">
          <LineMiniChart data={discovery.impressionsTrend} x="date" y="impressions" />
        </ChartPanel>
        <div className="rounded-lg border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Explore reach</p>
              <p className="mt-1 text-2xl font-semibold">{discovery.exploreReach.value?.toLocaleString("en-IN") ?? "Not connected"}</p>
            </div>
            <BenchmarkBadge status={discovery.exploreReach.status} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{discovery.exploreReach.note}</p>
        </div>
        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Discovery split</p>
          {discovery.discoverySplit ? <PieMiniChart data={discovery.discoverySplit} /> : <p className="mt-3 text-sm text-slate-500">Follower vs non-follower reach is not connected in stored Meta metrics yet.</p>}
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Hashtag</th><th className="px-3 py-2">Posts</th><th className="px-3 py-2">Reach</th><th className="px-3 py-2">Avg engagement</th><th className="px-3 py-2">Benchmark</th></tr>
          </thead>
          <tbody className="divide-y">
            {discovery.hashtags.map((row) => (
              <tr key={row.tag}>
                <td className="px-3 py-2 font-medium text-slate-950">#{row.tag}</td>
                <td className="px-3 py-2">{row.postCount}</td>
                <td className="px-3 py-2">{row.reach.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{percent(row.avgEngagementRate)}</td>
                <td className="px-3 py-2"><BenchmarkBadge status={row.benchmark} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function HealthcareInsights({ healthcare }: { healthcare: InstagramAnalyticsPayload["healthcareInsights"] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Healthcare Content Insights" description="Department-wise, doctor-led, educational, and awareness campaign performance." />
      <div className="grid gap-4 xl:grid-cols-2">
        <HealthcareTable title="Department-wise performance" rows={healthcare.departments} />
        <HealthcareTable title="Doctor content performance" rows={healthcare.doctorContent} />
        <HealthcareTable title="Educational content performance" rows={healthcare.educationalContent} />
        <HealthcareTable title="Awareness campaign performance" rows={healthcare.awarenessCampaigns} />
      </div>
    </Panel>
  );
}

function Benchmarking({ benchmarks }: { benchmarks: InstagramAnalyticsPayload["benchmarks"] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Benchmarking" description="Every core metric compared against hospital history, local competitors, and industry references." />
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Metric</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Hospital historical average</th><th className="px-3 py-2">Local competitors</th><th className="px-3 py-2">Industry average</th></tr>
          </thead>
          <tbody className="divide-y">
            {benchmarks.map((row) => (
              <tr key={row.metric}>
                <td className="px-3 py-3 font-medium text-slate-950">{row.metric}</td>
                <td className="px-3 py-3">{row.current}</td>
                {row.comparisons.map((comparison) => (
                  <td key={comparison.label} className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span>{comparison.display}</span>
                      <BenchmarkBadge status={comparison.status} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Recommendations({ recommendations, notes }: { recommendations: InstagramAnalyticsPayload["recommendations"]; notes: string[] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="AI-generated recommendations" description="Deterministic, evidence-led actions that can be enriched by VIP AI recommendations later." />
      <div className="grid gap-3 xl:grid-cols-2">
        {recommendations.map((recommendation) => (
          <div key={recommendation.title} className="rounded-lg border bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{recommendation.title}</h3>
              <StatusIndicator label={recommendation.priority} tone={recommendation.priority === "High" ? "warning" : recommendation.priority === "Medium" ? "info" : "neutral"} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.expectedImpact}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <span><strong>Evidence:</strong> {recommendation.evidenceMetric}</span>
              <span><strong>Owner:</strong> {recommendation.owner}</span>
              <span><strong>Next:</strong> {recommendation.nextAction}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border bg-white p-3 text-xs leading-5 text-slate-500">
        {notes.map((note) => <p key={note}>{note}</p>)}
      </div>
    </Panel>
  );
}

function ContentTable({ rows, compact = false }: { rows: ContentRow[]; compact?: boolean }) {
  if (!rows.length) return <EmptyMessage message="No measured content in this segment yet." />;
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th className="px-3 py-2">Content</th><th className="px-3 py-2">Reach</th><th className="px-3 py-2">Engagement</th><th className="px-3 py-2">Saves</th><th className="px-3 py-2">Shares</th><th className="px-3 py-2">Appt clicks</th><th className="px-3 py-2">Benchmark</th></tr>
        </thead>
        <tbody className="divide-y">
          {rows.slice(0, compact ? 6 : undefined).map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {row.mediaUrl ? (
                      <div
                        aria-hidden
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${row.mediaUrl})` }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium text-slate-950">{row.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.format} · {dateLabel(row.postedAt)}</p>
                  </div>
                  {row.url ? <a href={row.url} target="_blank" rel="noreferrer" aria-label="Open Instagram content"><ExternalLink className="h-4 w-4 text-slate-400" /></a> : null}
                </div>
              </td>
              <td className="px-3 py-3">{row.reach.toLocaleString("en-IN")}</td>
              <td className="px-3 py-3">{percent(row.engagementRate)}</td>
              <td className="px-3 py-3">{row.saves.toLocaleString("en-IN")}</td>
              <td className="px-3 py-3">{row.shares.toLocaleString("en-IN")}</td>
              <td className="px-3 py-3">{row.appointmentClicks.toLocaleString("en-IN")}</td>
              <td className="px-3 py-3"><BenchmarkBadge status={row.benchmark} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HealthcareTable({ title, rows }: { title: string; rows: HealthcareRow[] }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {!rows.length ? <EmptyMessage message="No measured rows yet." /> : (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border bg-white p-3">
              <div>
                <p className="text-sm font-medium text-slate-950">{row.label}</p>
                <p className="mt-1 text-xs text-slate-500">{row.posts} posts · {row.reach.toLocaleString("en-IN")} reach · {row.appointmentClicks.toLocaleString("en-IN")} appointment clicks</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{percent(row.engagementRate)}</p>
                <BenchmarkBadge status={row.benchmark} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </div>
  );
}

function LineMiniChart({ data, x, y }: { data: Array<Record<string, string | number>>; x: string; y: string }) {
  if (!data.length) return <EmptyMessage message="No trend data yet." />;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tickFormatter={shortDate} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => dateLabel(String(value))} />
          <Area dataKey={y} stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarMiniChart({ data, x, y }: { data: Array<Record<string, string | number>>; x: string; y: string }) {
  if (!data.length) return <EmptyMessage message="No chart data yet." />;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
        <BarChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={y} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieMiniChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data.length) return <EmptyMessage message="No split data yet." />;
  return (
    <div className="grid min-h-56 items-center gap-3 md:grid-cols-[220px_1fr]">
      <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={1}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={86} paddingAngle={2}>
            {data.map((entry, index) => <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div key={entry.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />{entry.label}</span>
            <span className="font-medium">{entry.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-950">{title}</h3>
      {!rows.length ? <EmptyMessage message="No location data yet." /> : rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
          <span className="font-medium text-slate-700">{row.label}</span>
          <span className="text-slate-500">{row.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

function ActiveHourHeatmap({ rows }: { rows: Array<{ day: string; hour: number; value: number }> }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <h3 className="mb-3 text-sm font-semibold text-slate-950">Active hours</h3>
      {!rows.length ? <EmptyMessage message="No active-hour data yet." /> : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {rows.map((row) => (
            <div key={`${row.day}-${row.hour}`} className="rounded-lg border bg-white p-2">
              <p className="text-xs font-medium text-slate-500">{row.day} · {clock(row.hour)}</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-pink-600" style={{ width: `${Math.max(8, Math.min(100, row.value))}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{row.value.toLocaleString("en-IN")} signal</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BenchmarkBadge({ status }: { status: BenchmarkStatus }) {
  const tone = status === "ABOVE_BENCHMARK" ? "success" : status === "ON_BENCHMARK" ? "info" : status === "BELOW_BENCHMARK" ? "warning" : "neutral";
  return <StatusIndicator label={statusLabel(status)} tone={tone} />;
}

function EmptyMessage({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-slate-500">{message}</p>;
}

function statusLabel(status: BenchmarkStatus) {
  if (status === "ABOVE_BENCHMARK") return "Above benchmark";
  if (status === "ON_BENCHMARK") return "On benchmark";
  if (status === "BELOW_BENCHMARK") return "Below benchmark";
  return "Data limited";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function shortDate(value: string | number) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(String(value)));
}

function percent(value: number) {
  return `${Number(value).toFixed(2)}%`;
}

function clock(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: true }).format(new Date(2026, 0, 1, hour));
}

const tooltipStyle = {
  background: "white",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};
