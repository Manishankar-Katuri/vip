"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, LineChart, MessageSquareText, ShieldCheck, TrendingUp } from "lucide-react";

import type { ReportMetric, WeeklyAnalysisReport } from "@vip/strategy-engine/weekly";

import { Button } from "@/design-system/primitives";
import {
  EvidenceList,
  InsightPanel,
  IntelligenceHero,
  IntelligenceMetricGrid,
} from "@/design-system/dashboard-surfaces";

type ApiResponse = { success: true; report: WeeklyAnalysisReport };

export function WeeklyAnalysisReportPage({
  hospitalId,
  heroEyebrow = "Executive briefing",
}: {
  hospitalId: string;
  heroEyebrow?: string;
}) {
  const [report, setReport] = useState<WeeklyAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/admin/weekly-analysis-report?hospitalId=${encodeURIComponent(hospitalId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Report request failed with ${response.status}`);
        return response.json() as Promise<ApiResponse>;
      })
      .then((data) => setReport(data.report))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load weekly report.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [hospitalId]);

  const title = report ? `${report.hospitalName} weekly performance` : "Weekly Hospital Performance Report";

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow={heroEyebrow}
        title="Weekly Hospital Performance Report"
        description={report ? `${formatDate(report.period.startsAt)} to ${formatDate(report.period.endsAt)} - ${title}` : "Leadership-ready weekly performance across connected VIP intelligence systems."}
        icon={FileText}
        state={report?.weeklyGrowthScore.label === "DATA_LIMITED" ? "degraded" : report ? "ready" : "empty"}
      >
        <Button onClick={() => window.print()} size="lg" variant="outline">
          <Download className="size-4" aria-hidden />
          Generate PDF
        </Button>
      </IntelligenceHero>

      <section className="report-export mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8 print:px-0">
        {loading ? <ReportLoading /> : null}
        {error ? <ReportError message={error} /> : null}
        {report ? <ReportBody report={report} /> : null}
      </section>
    </main>
  );
}

function ReportBody({ report }: { report: WeeklyAnalysisReport }) {
  const platformMax = Math.max(report.socialMedia.instagram.engagement.value ?? 0, report.socialMedia.facebook.engagement.value ?? 0, 1);
  const kpis = useMemo(
    () => [
      { metric: report.kpiSnapshot.reach, icon: TrendingUp },
      { metric: report.kpiSnapshot.engagement, icon: LineChart },
      { metric: report.kpiSnapshot.leads, icon: ShieldCheck },
      { metric: report.kpiSnapshot.appointments, icon: ShieldCheck },
      { metric: report.kpiSnapshot.reviews, icon: MessageSquareText },
      { metric: report.kpiSnapshot.websiteTraffic, icon: LineChart },
    ],
    [report]
  );

  return (
    <>
      <IntelligenceMetricGrid
        metrics={[
          {
            label: "Weekly growth score",
            value: `${report.weeklyGrowthScore.score}/100`,
            detail: `${friendlyStatus(report.weeklyGrowthScore.label)} - ${report.weeklyGrowthScore.coveragePercent}% source coverage`,
            state: report.weeklyGrowthScore.label === "DATA_LIMITED" ? "degraded" : "ready",
            icon: TrendingUp,
          },
          {
            label: "Overall status",
            value: friendlyStatus(report.executiveSummary.overallStatus),
            detail: report.executiveSummary.nextLeadershipFocus,
            state: report.executiveSummary.overallStatus === "DATA_LIMITED" ? "degraded" : "ready",
            icon: ShieldCheck,
          },
          {
            label: "Connected reach",
            value: formatMetricValue(report.kpiSnapshot.reach),
            detail: metricDelta(report.kpiSnapshot.reach),
            state: metricState(report.kpiSnapshot.reach),
            icon: LineChart,
          },
          {
            label: "Connected engagement",
            value: formatMetricValue(report.kpiSnapshot.engagement),
            detail: metricDelta(report.kpiSnapshot.engagement),
            state: metricState(report.kpiSnapshot.engagement),
            icon: MessageSquareText,
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <InsightPanel title="Biggest wins" description="What leadership should notice first." state="ready">
          <ExecutiveList items={report.executiveSummary.biggestWins} />
        </InsightPanel>
        <InsightPanel title="Biggest concerns" description="What needs executive attention." state={report.executiveSummary.biggestConcerns.length ? "degraded" : "ready"}>
          <ExecutiveList items={report.executiveSummary.biggestConcerns} />
        </InsightPanel>
        <InsightPanel title="Next leadership focus" description="The clearest decision for next week." state="ready">
          {report.executiveSummary.nextLeadershipFocus}
        </InsightPanel>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm print:break-inside-avoid">
        <SectionHeader title="KPI Snapshot" description="Six weekly leadership indicators with prior-period movement." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(({ metric, icon: Icon }) => (
            <div key={metric.label} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{formatMetricValue(metric)}</p>
                </div>
                <Icon className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{metricDelta(metric)}</p>
              {metric.note ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.note}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border bg-card p-5 shadow-sm print:break-inside-avoid">
          <SectionHeader title="Social Media Performance" description="Instagram, Facebook, and content evidence." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <PlatformPanel title="Instagram summary" summary={report.socialMedia.instagram} max={platformMax} />
            <PlatformPanel title="Facebook summary" summary={report.socialMedia.facebook} max={platformMax} />
          </div>
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Content performance</h3>
            <div className="mt-3 divide-y rounded-lg border">
              {report.socialMedia.contentPerformance.length ? report.socialMedia.contentPerformance.map((item) => (
                <div key={item.label} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_90px_110px_110px]">
                  <span className="font-medium">{item.label}</span>
                  <span>{item.posts} post(s)</span>
                  <span>{formatNumber(item.engagement)} engagements</span>
                  <span>{formatNumber(item.reach)} reach</span>
                </div>
              )) : <p className="p-3 text-sm text-muted-foreground">Content performance is data-limited for this period.</p>}
            </div>
          </div>
        </section>

        <EvidenceList
          title="Top 5 recommended actions"
          description="Leadership-focused actions for next week."
          items={report.recommendedActions.map((action) => ({
            title: action.title,
            detail: action.owner ? `${action.detail} Owner: ${action.owner}.` : action.detail,
            state: "ready",
          }))}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <MetricSection title="GBP Performance" metrics={[report.gbp.profileViews, report.gbp.calls, report.gbp.directionRequests, report.gbp.websiteClicks]} />
        <MetricSection title="Review & Reputation" metrics={[report.reputation.newReviews, report.reputation.ratingChange]} extra={report.reputation.sentimentChanges.map((item) => `${friendlyStatus(item.label)}: ${item.current} (${signed(item.change)})`)} />
        <MetricSection title="WhatsApp Summary" metrics={[report.whatsapp.inquiries, report.whatsapp.conversionRate, report.whatsapp.responsePerformance]} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <EvidenceList
          title="Competitor highlights"
          description="Major competitor movements and market changes."
          items={[...report.competitors.majorMovements, ...report.competitors.marketChanges].map((item) => ({
            title: item,
            detail: "Use as source-labeled context for leadership decisions.",
            state: "degraded",
          }))}
        />
        <EvidenceList
          title="Data quality notes"
          description="What is connected, limited, or waiting on integration."
          items={(report.dataQualityNotes.length ? report.dataQualityNotes : ["All requested report sections have connected source evidence."]).map((note) => ({
            title: note,
            detail: "This prevents unsupported executive claims.",
            state: report.dataQualityNotes.length ? "degraded" : "ready",
          }))}
        />
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm print:break-inside-avoid">
        <SectionHeader title="Key Insights" description="What happened, why it happened, and what it means." />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {report.keyInsights.map((insight, index) => (
            <div key={`${insight.whatHappened}-${index}`} className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What happened</p>
              <p className="mt-2 text-sm leading-6">{insight.whatHappened}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it happened</p>
              <p className="mt-2 text-sm leading-6">{insight.whyItHappened}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What it means</p>
              <p className="mt-2 text-sm leading-6">{insight.whatItMeans}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PlatformPanel({ title, summary, max }: { title: string; summary: WeeklyAnalysisReport["socialMedia"]["instagram"]; max: number }) {
  const engagement = summary.engagement.value ?? 0;
  const width = Math.max(6, Math.round((engagement / max) * 100));
  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary.summary}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <MiniStat label="Posts" value={formatNumber(summary.posts)} />
        <MiniStat label="Reach" value={formatMetricValue(summary.reach)} />
        <MiniStat label="Engagement" value={formatMetricValue(summary.engagement)} />
      </div>
      {summary.topPost ? <p className="mt-4 text-xs leading-5 text-muted-foreground">Top post: {summary.topPost.caption}</p> : null}
    </div>
  );
}

function MetricSection({ title, metrics, extra = [] }: { title: string; metrics: ReportMetric[]; extra?: string[] }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm print:break-inside-avoid">
      <SectionHeader title={title} />
      <div className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3">
            <div>
              <p className="text-sm font-medium">{metric.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{metricDelta(metric)}</p>
            </div>
            <p className="text-lg font-semibold">{formatMetricValue(metric)}</p>
          </div>
        ))}
        {extra.map((item) => <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>)}
      </div>
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function ExecutiveList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => <li key={item} className="text-sm leading-6">{item}</li>)}
    </ul>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ReportLoading() {
  return <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Loading weekly analysis report...</div>;
}

function ReportError({ message }: { message: string }) {
  return <div className="rounded-lg border border-destructive/40 bg-card p-5 text-sm text-destructive">{message}</div>;
}

function formatMetricValue(metric: ReportMetric) {
  if (metric.value === null) return "Data limited";
  if (metric.unit === "PERCENT") return `${formatNumber(metric.value)}%`;
  if (metric.unit === "SCORE") return formatNumber(metric.value);
  return formatNumber(metric.value);
}

function metricDelta(metric: ReportMetric) {
  if (metric.dataState !== "READY") return friendlyStatus(metric.dataState);
  if (metric.change === null) return "No prior-period comparison";
  return `${metric.changeDirection === "DOWN" ? "Down" : metric.changeDirection === "UP" ? "Up" : "Flat"} ${Math.abs(metric.change)}% vs previous 7 days`;
}

function metricState(metric: ReportMetric): "ready" | "degraded" {
  return metric.dataState === "READY" && metric.status !== "WATCH" && metric.status !== "AT_RISK" ? "ready" : "degraded";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function friendlyStatus(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
