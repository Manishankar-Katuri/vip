"use client";

import { useState } from "react";
import { CalendarPlus, Download, FileText, Presentation, Printer } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { EngagementTrendChart } from "@/charts/engagement-trend-chart";
import { Button, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";
import { ExecutiveInsights } from "@/insights/executive-insights";
import { ComparativeIntelligence } from "@/comparisons/comparative-intelligence";

export function ExecutiveReporting({ data, role }: { data?: LiveData; role: "doctor" | "admin" }) {
  return (
    <div className="space-y-5 report-export">
      <ReportToolbar role={role} />
      <OperationalKpis data={data} />
      <ExecutiveInsights data={data} role={role} />
      <HistoricalAnalytics data={data} />
      {role === "admin" && <ComparativeIntelligence data={data} />}
      <ReportCatalog role={role} />
    </div>
  );
}

export function OperationalKpis({ data }: { data?: LiveData }) {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const activity = useOperationalStore((state) => state.activity);
  const recommendations = useOperationalStore((state) => state.recommendationStatus);
  const approvals = campaigns.filter((item) => item.approval === "approved").length;
  const published = campaigns.filter((item) => item.stage === "published").length;
  const scheduled = campaigns.filter((item) => item.stage === "scheduled" || item.stage === "published").length;
  const adoption = Object.values(recommendations).filter((value) => ["converted", "attached", "applied"].includes(value)).length;
  const metrics = [
    { label: "Workflow throughput", value: `${published}/${campaigns.length}`, change: "Published campaign outputs", tone: "info" as const },
    { label: "Approval success rate", value: `${Math.round(approvals / Math.max(campaigns.length, 1) * 100)}%`, change: "Approved operational content", tone: "success" as const },
    { label: "Publishing consistency", value: `${Math.round(scheduled / Math.max(approvals, 1) * 100)}%`, change: "Approved work scheduled", tone: "success" as const },
    { label: "Recommendation adoption", value: `${adoption}`, change: "Applied decisions retained", tone: "info" as const },
    { label: "Approval velocity", value: `${activity.filter((item) => item.category === "approval").length}`, change: "Recorded approval events", tone: "neutral" as const },
    { label: "Engagement velocity", value: data ? percent(data.analytics.avgEngagementRate) : "Pending", change: "Measured published response", tone: data ? "success" as const : "neutral" as const },
  ];
  return (
    <section aria-label="Operational KPI system" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => <KpiSurface key={metric.label} {...metric} />)}
    </section>
  );
}

function HistoricalAnalytics({ data }: { data?: LiveData }) {
  const activity = useOperationalStore((state) => state.activity);
  const approvals = activity.filter((item) => item.category === "approval");
  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel className="p-5 report-block">
        <SectionHeader title="Historical engagement trends" description="Recorded publishing performance over time" action={data && <StatusIndicator label={`${integer(data.analytics.totalPosts)} posts`} tone="info" />} />
        {data?.analytics.engagementTrend.series.length ? (
          <EngagementTrendChart data={data.analytics.engagementTrend.series} />
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Historical engagement appears after connected channel measurements are available.</div>
        )}
      </Panel>
      <Panel className="p-5 report-block">
        <SectionHeader title="Workflow throughput trend" description="Approval velocity and release readiness" />
        <div className="space-y-3">
          <MetricRow label="Approval decisions recorded" value={String(approvals.length)} />
          <MetricRow label="Clinical queue state" value={approvals.length ? "Traceable" : "Awaiting events"} />
          <MetricRow label="Analytics linkage" value={data ? "Connected" : "Pending"} />
          <MetricRow label="Monthly reporting" value="Ready for export" />
        </div>
      </Panel>
    </div>
  );
}

function ReportToolbar({ role }: { role: "doctor" | "admin" }) {
  const [scheduled, setScheduled] = useState(false);
  const [presentationReady, setPresentationReady] = useState(false);
  const campaigns = useOperationalStore((state) => state.campaigns);
  const exportCsv = () => {
    const rows = [["Campaign", "Stage", "Approval", "Schedule"], ...campaigns.map((campaign) => [campaign.title, campaign.stage, campaign.approval, campaign.scheduledFor ?? ""])];
    const content = rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    anchor.download = "vip-executive-campaign-summary.csv";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  return (
    <Panel className="p-5 report-toolbar">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Executive reporting</p>
          <h2 className="mt-2 text-xl font-semibold">{role === "admin" ? "Portfolio intelligence report" : "Leadership performance brief"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Printable summary prepared for clinical and operational governance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" onClick={() => window.print()}><Printer /> Print / PDF</Button>
          <Button variant="outline" size="lg" onClick={() => setPresentationReady(true)}><Presentation /> Presentation summary</Button>
          <Button variant="outline" size="lg" onClick={exportCsv}><Download /> Export data</Button>
          <Button size="lg" onClick={() => setScheduled(true)}><CalendarPlus /> {scheduled ? "Monthly report scheduled" : "Schedule report"}</Button>
        </div>
      </div>
      {presentationReady && <p role="status" className="mt-4 rounded-lg bg-info/35 p-3 text-sm">Presentation summary view is ready: use Print / PDF with landscape presentation settings for a leadership handout.</p>}
      {scheduled && <p role="status" className="mt-4 rounded-lg bg-info/35 p-3 text-sm">Monthly executive report is prepared for delivery on the first business day, pending delivery configuration.</p>}
    </Panel>
  );
}

function ReportCatalog({ role }: { role: "doctor" | "admin" }) {
  const reports = role === "admin"
    ? ["Portfolio operational summary", "Hospital comparison brief", "Approval velocity and workflow report", "AI recommendation governance review"]
    : ["Campaign outcome summary", "Engagement and growth report", "Approval outcomes record", "Reputation signal brief"];
  return (
    <Panel className="p-5 report-block">
      <SectionHeader title="Export-ready report library" description="Concise report structures for meetings and governance records" />
      <div className="grid gap-3 md:grid-cols-2">
        {reports.map((report) => (
          <article key={report} className="flex items-start justify-between gap-3 rounded-xl border bg-background p-4">
            <div className="flex gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{report}</p>
                <p className="mt-1 text-xs text-muted-foreground">PDF-ready - presentation summary available</p>
              </div>
            </div>
            <StatusIndicator label="Ready" tone="success" />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
