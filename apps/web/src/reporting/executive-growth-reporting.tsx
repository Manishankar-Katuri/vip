"use client";

import { CalendarDays, Download, LineChart, Printer, ShieldAlert, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import { buildExecutiveGrowthReport, type ExecutiveGrowthReport, type GrowthBand, type RiskSeverity } from "@/lib/executive-growth-report";
import type { ProductExperience } from "@/lib/product-experience";
import { cn } from "@/lib/utils";

export function ExecutiveGrowthReporting({ data, role }: { data?: ProductExperience; role: "doctor" | "admin" }) {
  const report = useMemo(() => buildExecutiveGrowthReport(data), [data]);
  return (
    <div className="space-y-5 report-export">
      <ReportToolbar report={report} role={role} />
      <ExecutiveSummary report={report} />
      <GrowthScorecard report={report} />
      <GrowthDrivers report={report} />
      <ChannelContribution report={report} />
      <CompetitivePosition report={report} />
      <CustomerJourney report={report} />
      <StrategicRisks report={report} />
      <GrowthOpportunities report={report} />
      <LeadershipRecommendations report={report} />
      <GrowthRoadmap report={report} />
      <Forecast report={report} />
    </div>
  );
}

function ReportToolbar({ report, role }: { report: ExecutiveGrowthReport; role: "doctor" | "admin" }) {
  const [scheduled, setScheduled] = useState(false);
  const exportCsv = () => {
    const rows = [
      ["Section", "Metric", "Value", "Interpretation"],
      ...report.scorecard.map((item) => ["Growth Scorecard", item.label, `${item.score}/100`, item.interpretation]),
      ...report.channels.map((item) => ["Channel Contribution", item.channel, item.status, item.executiveRead]),
      ...report.strategicRisks.map((item) => ["Strategic Risks", item.category, item.severity, item.implication]),
      ...report.opportunities.map((item) => ["Growth Opportunities", item.tier, item.title, item.expectedOutcome]),
    ];
    const content = rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    anchor.download = "vip-executive-growth-report.csv";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <Panel className="p-5 report-toolbar">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Executive growth report</p>
          <h2 className="mt-2 text-xl font-semibold">{role === "admin" ? "Portfolio growth command report" : "Hospital leadership growth report"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{report.workspaceName} · {report.period}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" onClick={() => window.print()}><Printer /> Print / PDF</Button>
          <Button variant="outline" size="lg" onClick={exportCsv}><Download /> Export growth CSV</Button>
          <Button size="lg" onClick={() => setScheduled(true)}><CalendarDays /> {scheduled ? "Monthly report scheduled" : "Schedule report"}</Button>
        </div>
      </div>
      {scheduled && <p role="status" className="mt-4 rounded-lg bg-info/35 p-3 text-sm">Monthly executive growth report is prepared for leadership delivery on the first business day.</p>}
    </Panel>
  );
}

function ExecutiveSummary({ report }: { report: ExecutiveGrowthReport }) {
  const overall = report.scorecard.find((item) => item.key === "overall")!;
  return (
    <section aria-labelledby="executive-summary" className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel className="border-primary/15 bg-info/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">1. Executive Summary</p>
            <h2 id="executive-summary" className="mt-2 text-2xl font-semibold">Growth status: {report.overallStatus}</h2>
          </div>
          <StatusIndicator label={`${overall.score}/100`} tone={toneForBand(report.overallStatus)} />
        </div>
        <p className="mt-4 text-sm leading-6">{report.executiveSummary.growthStatus}</p>
        <div className="mt-4 rounded-lg border bg-background/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Top executive decision</p>
          <p className="mt-1 text-sm font-medium leading-5">{report.executiveSummary.topDecision}</p>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryList title="Strategic highlights" items={report.executiveSummary.strategicHighlights} tone="success" icon="highlight" />
        <SummaryList title="Major risks" items={report.executiveSummary.majorRisks} tone="warning" icon="risk" />
      </div>
    </section>
  );
}

function GrowthScorecard({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="2. Growth Scorecard" description="Board-level scores across visibility, reputation, engagement, conversion, competitive position, and overall growth." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {report.scorecard.map((item) => (
          <article key={item.key} className={cn("rounded-lg border p-3", item.key === "overall" ? "border-primary/30 bg-info/35" : "bg-background")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-3xl font-semibold">{item.score}</p>
              </div>
              <StatusIndicator label={item.band} tone={toneForBand(item.band)} />
            </div>
            <ScoreBar value={item.score} tone={toneForBand(item.band)} />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.interpretation}</p>
            <DetailDisclosure label={`${item.confidence}% confidence`} className="mt-2">{item.evidence}</DetailDisclosure>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function GrowthDrivers({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DriverPanel title="3. Growth Drivers: what contributed most to growth" drivers={report.growthDrivers.positive} tone="success" />
      <DriverPanel title="3. Growth Drivers: what contributed most to decline" drivers={report.growthDrivers.negative} tone="warning" />
    </div>
  );
}

function ChannelContribution({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="4. Channel Contribution Analysis" description="Connected channels show contribution; disconnected channels remain visible as leadership evidence gaps." />
      <div className="grid gap-3 lg:grid-cols-2">
        {report.channels.map((item) => (
          <article key={item.channel} className="rounded-lg border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.channel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.executiveRead}</p>
              </div>
              <StatusIndicator label={item.status} tone={item.status === "Connected" ? "success" : "neutral"} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1"><ScoreBar value={item.contributionScore} tone={item.status === "Connected" ? "success" : "neutral"} /></div>
              <span className="w-16 text-right text-xs font-medium">{item.trend}</span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function CompetitivePosition({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="5. Competitive Position" description="Market standing, share indicators, relative performance, and pressure points." action={<StatusIndicator label={report.competitivePosition.pressureLevel} tone={toneForSeverity(report.competitivePosition.pressureLevel)} />} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <ExecutiveRead title="Market standing" text={report.competitivePosition.standing} />
        <ExecutiveRead title="Market share indicators" text={report.competitivePosition.marketShareIndicator} />
        <ExecutiveRead title="Relative performance" text={report.competitivePosition.relativePerformance} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CompactList title="Competitive advantages" items={report.competitivePosition.advantages} tone="success" />
        <CompactList title="Competitive gaps" items={report.competitivePosition.gaps} tone="warning" />
      </div>
    </Panel>
  );
}

function CustomerJourney({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="6. Customer Journey Overview" description="Discovery to retention, expressed as leadership health rather than operational task detail." />
      <ol className="grid gap-3 xl:grid-cols-5">
        {report.customerJourney.map((item) => (
          <li key={item.stage} className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{item.stage}</h3>
              <StatusIndicator label={item.health} tone={toneForBand(item.health)} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{item.score}</p>
            <DetailDisclosure label="Bottleneck" className="mt-2">{item.bottleneck}</DetailDisclosure>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.leadershipFocus}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function StrategicRisks({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="7. Strategic Risks" description="Reputation, competitive, visibility, and conversion risks requiring executive attention." />
      <div className="grid gap-3 md:grid-cols-2">
        {report.strategicRisks.map((item) => (
          <article key={`${item.category}-${item.title}`} className="rounded-lg border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{item.category} risk</p>
                  <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                </div>
              </div>
              <StatusIndicator label={item.severity} tone={toneForSeverity(item.severity)} />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.implication}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function GrowthOpportunities({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="8. Growth Opportunities" description="Ranked by high impact, medium impact, and long-term leadership value." />
      <div className="grid gap-3 lg:grid-cols-3">
        {(["High impact", "Medium impact", "Long-term"] as const).map((tier) => (
          <section key={tier} className="rounded-lg border bg-background p-3">
            <h3 className="text-sm font-semibold">{tier}</h3>
            <div className="mt-3 space-y-2">
              {report.opportunities.filter((item) => item.tier === tier).map((item) => (
                <article key={`${tier}-${item.title}`} className="rounded-md border bg-card p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <DetailDisclosure label="Rationale" className="mt-2">{item.rationale}</DetailDisclosure>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.expectedOutcome}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Panel>
  );
}

function LeadershipRecommendations({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="9. Leadership Recommendations" description="Top executive decisions to consider, framed as decisions rather than tasks." />
      <div className="space-y-2">
        {report.recommendations.map((item) => (
          <article key={item.decision} className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold">{item.decision}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.whyNow}</p>
            </div>
            <StatusIndicator label={item.owner} tone="info" />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function GrowthRoadmap({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="10. 30-Day Growth Roadmap" description="A leadership rhythm for the next growth cycle." />
      <div className="grid gap-3 lg:grid-cols-4">
        {report.roadmap.map((item) => (
          <article key={item.week} className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.week}</p>
            <h3 className="mt-2 text-sm font-semibold">{item.focus}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.leadershipOutcome}</p>
            <DetailDisclosure label="Milestone" className="mt-2">{item.milestone}</DetailDisclosure>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Forecast({ report }: { report: ExecutiveGrowthReport }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="11. Forecast" description="Growth trajectory, expected outcomes, key milestones, confidence, and assumptions." action={<StatusIndicator label={`${report.forecast.confidence}% confidence`} tone={report.forecast.confidence >= 70 ? "success" : "warning"} />} />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr_1fr]">
        <div className="rounded-lg border bg-info/35 p-4">
          <LineChart className="size-5 text-primary" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">Growth trajectory</p>
          <p className="mt-1 text-2xl font-semibold">{report.forecast.trajectory}</p>
        </div>
        <CompactList title="Expected outcomes" items={report.forecast.expectedOutcomes} tone="success" />
        <CompactList title="Key milestones" items={report.forecast.milestones} tone="info" />
      </div>
      <div className="mt-4">
        <CompactList title="Forecast assumptions" items={report.forecast.assumptions} tone="neutral" />
      </div>
    </Panel>
  );
}

function SummaryList({ title, items, tone, icon }: { title: string; items: string[]; tone: Tone; icon: "highlight" | "risk" }) {
  const Icon = icon === "highlight" ? TrendingUp : ShieldAlert;
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg border bg-background p-3 text-sm leading-5">
            <StatusIndicator label={tone === "success" ? "Highlight" : "Risk"} tone={tone} />
            <p className="mt-2">{item}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DriverPanel({ title, drivers, tone }: { title: string; drivers: ExecutiveGrowthReport["growthDrivers"]["positive"]; tone: Tone }) {
  return (
    <Panel className="p-5">
      <SectionHeader title={title} />
      <div className="space-y-3">
        {drivers.map((item) => (
          <article key={item.title} className="rounded-lg border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.evidence}</p>
              </div>
              <StatusIndicator label={`${item.score}`} tone={tone} />
            </div>
            <ScoreBar value={item.score} tone={tone} />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ExecutiveRead({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      <p className="mt-2 text-sm leading-5">{text}</p>
    </div>
  );
}

function CompactList({ title, items, tone }: { title: string; items: string[]; tone: Tone }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dotClass(tone))} aria-hidden />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ value, tone }: { value: number; tone: Tone }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", barClass(tone))} style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} />
    </div>
  );
}

function toneForBand(band: GrowthBand): Tone {
  if (band === "Accelerating") return "success";
  if (band === "Stable") return "info";
  if (band === "At Risk") return "warning";
  return "danger";
}

function toneForSeverity(severity: RiskSeverity): Tone {
  if (severity === "Critical") return "danger";
  if (severity === "High") return "warning";
  if (severity === "Medium") return "info";
  return "success";
}

function barClass(tone: Tone) {
  if (tone === "success") return "bg-success";
  if (tone === "warning") return "bg-warning";
  if (tone === "danger") return "bg-destructive";
  if (tone === "neutral") return "bg-muted-foreground";
  return "bg-primary";
}

function dotClass(tone: Tone) {
  if (tone === "success") return "bg-success";
  if (tone === "warning") return "bg-warning";
  if (tone === "danger") return "bg-destructive";
  if (tone === "neutral") return "bg-muted-foreground";
  return "bg-primary";
}
