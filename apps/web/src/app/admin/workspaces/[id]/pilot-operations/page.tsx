import Link from "next/link";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  GitCompare,
  History,
  PackageCheck,
  ShieldCheck,
  Star,
} from "lucide-react";

import { QualityReviewForm } from "@/components/pilot-operations/quality-review-form";
import { IntelligenceHero, IntelligenceMetricGrid } from "@/design-system/dashboard-surfaces";
import { Panel, SectionHeader, StatusIndicator, TimelineItem } from "@/design-system/primitives";
import { contentQualityScore, getPilotOperations, reportQualityScore } from "@/lib/daily-growth-pilot-operations";

export default async function PilotOperationsConsole({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const pilot = await getPilotOperations(workspaceId);
  const latest = pilot.latest;
  const duration = latest ? durationLabel(latest.startedAt, latest.completedAt ?? latest.failedAt ?? new Date()) : "No active mission";
  const errors = pilot.traces.filter((trace: any) => trace.status === "FAILED");
  const warnings = [
    ...pilot.approvals.filter((approval: any) => approval.status === "PENDING").map((approval: any) => `Pending approval: ${approval.reason}`),
    ...pilot.executions.filter((execution: any) => execution.status === "WAITING_APPROVAL").map((execution: any) => `Mission waiting approval: ${new Date(execution.businessDate).toLocaleDateString()}`),
  ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Pilot validation"
        title="Pilot Operations Console"
        description="Seven-day Daily Growth Mission validation across reliability, quality, learning, replay, and exit criteria."
        icon={ShieldCheck}
        state={pilot.exitCriteria === "PRODUCTION READY" ? "ready" : pilot.exitCriteria === "PILOT READY" ? "ready" : "mock"}
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <IntelligenceMetricGrid
          metrics={[
            { label: "Exit criteria", value: pilot.exitCriteria, detail: "Automatically derived from pilot results.", state: pilot.exitCriteria === "NOT READY" ? "mock" : "ready", icon: ShieldCheck },
            { label: "Overall pilot score", value: `${pilot.scorecard.overallPilotScore}/100`, detail: "Reliability, intelligence, learning, and content.", state: scoreState(pilot.scorecard.overallPilotScore), icon: Star },
            { label: "Active mission", value: latest?.status ?? "None", detail: latest?.currentPhase ?? "No mission execution found.", state: latest ? "ready" : "mock", icon: Activity },
            { label: "Duration", value: duration, detail: "Started to completed, failed, or now.", state: latest ? "ready" : "mock", icon: Clock },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader title="Mission monitoring" description="Active mission status, phase, duration, errors, and warnings." action={<StatusIndicator label={latest?.currentPhase ?? "No phase"} tone={statusTone(latest?.status)} />} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact label="Active Mission" value={latest?.id ?? "No active mission"} />
              <Fact label="Current Phase" value={latest?.currentPhase ?? "None"} />
              <Fact label="Duration" value={duration} />
              <Fact label="Status" value={latest?.status ?? "None"} />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <IssueList title="Errors" items={errors.map((trace: any) => trace.error ?? "AI generation error")} tone="danger" empty="No generation errors recorded." />
              <IssueList title="Warnings" items={warnings} tone="warning" empty="No approval or mission warnings." />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader title="Pilot scorecard" description="Scores are derived from mission records and reviewer feedback." />
            <ScoreRows rows={[
              ["Mission Reliability", pilot.scorecard.missionReliabilityScore],
              ["Intelligence Quality", pilot.scorecard.intelligenceQualityScore],
              ["Learning Effectiveness", pilot.scorecard.learningEffectivenessScore],
              ["Content Quality", pilot.scorecard.contentQualityScore],
              ["Overall Pilot", pilot.scorecard.overallPilotScore],
            ]} />
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader title="Mission replay" description="Events, decisions, recommendations, and learning updates." action={<History className="size-5 text-primary" aria-hidden />} />
            <div className="mt-4">
              {pilot.events.slice(0, 12).map((event: any) => (
                <TimelineItem key={event.id} title={event.eventType} meta={`sequence ${event.sequence}`} detail={event.topic} tone="info" />
              ))}
              {!pilot.events.length && <p className="text-sm text-muted-foreground">No replay events yet.</p>}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader title="Mission comparison" description="Day 1, Day 2, Day 3, and Day 7 changes." action={<GitCompare className="size-5 text-primary" aria-hidden />} />
            <div className="mt-4 space-y-3">
              {pilot.compared.map((item) => (
                <div key={item.day} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Day {item.day}</p>
                    <StatusIndicator label={item.execution ? item.execution.status : "No run"} tone={statusTone(item.execution?.status)} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Strategy: {item.strategyChange}</p>
                  <p className="text-xs leading-5 text-muted-foreground">Content: {item.contentChange}</p>
                  <p className="text-xs leading-5 text-muted-foreground">Learning: {item.learningChange}</p>
                  <p className="text-xs leading-5 text-muted-foreground">KPI: {item.kpiPredictionChange}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader title="Quality review" description="Rate generated reports and content packages. Feedback is stored for pilot scoring." action={<BarChart3 className="size-5 text-primary" aria-hidden />} />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Generated reports</h3>
              {pilot.executions.flatMap((execution: any) => execution.dailyGrowthReports.map((report: any) => (
                <ReviewTarget key={report.id} title={report.title} score={reportQualityScore(report, pilot.reviews.find((review: any) => review.targetId === report.id))} icon={FileText}>
                  <QualityReviewForm workspaceId={workspaceId} executionId={execution.id} targetType="REPORT" targetId={report.id} />
                </ReviewTarget>
              )))}
              {!pilot.executions.some((execution: any) => execution.dailyGrowthReports.length) && <p className="text-sm text-muted-foreground">No generated reports yet.</p>}
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Content packages</h3>
              {pilot.executions.flatMap((execution: any) => execution.contentProductionPackages.map((pkg: any) => (
                <ReviewTarget key={pkg.id} title={pkg.topic} score={contentQualityScore(pkg, pilot.reviews.find((review: any) => review.targetId === pkg.id))} icon={PackageCheck}>
                  <QualityReviewForm workspaceId={workspaceId} executionId={execution.id} targetType="CONTENT_PACKAGE" targetId={pkg.id} />
                </ReviewTarget>
              )))}
              {!pilot.executions.some((execution: any) => execution.contentProductionPackages.length) && <p className="text-sm text-muted-foreground">No content packages yet.</p>}
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <SectionHeader title="Learning updates" description="Latest stored learning memory." action={<Brain className="size-5 text-primary" aria-hidden />} />
            <SignalList items={pilot.learning.map((memory: any) => ({ title: memory.scope, detail: memory.key, score: Math.round(Number(memory.confidenceScore ?? 0) * 100) }))} />
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="KPI prediction validation" description="Predicted vs actual KPI records." action={<BarChart3 className="size-5 text-primary" aria-hidden />} />
            <SignalList items={pilot.executions.flatMap((execution: any) => execution.contentOutcomes.map((outcome: any) => ({ title: "Content outcome", detail: `Predicted ${JSON.stringify(outcome.predictedKpi)} · Actual ${JSON.stringify(outcome.actualKpi)}`, score: Math.round(Number(outcome.performanceScore ?? 0)) })))} />
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="Exit criteria" description="Automatic readiness classification." action={<CheckCircle2 className="size-5 text-primary" aria-hidden />} />
            <p className="mt-4 text-3xl font-semibold">{pilot.exitCriteria}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Production Ready requires 7 completed days and overall score of 88 or higher. Pilot Ready requires at least 3 mission days and overall score of 70 or higher.</p>
            <Link href={`/admin/workspaces/${workspaceId}/mission-control`} className="mt-4 inline-flex rounded-md border px-3 py-2 text-sm font-medium transition hover:border-primary/40">Open Mission Control</Link>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function IssueList({ title, items, tone, empty }: { title: string; items: string[]; tone: "warning" | "danger"; empty: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <StatusIndicator label={String(items.length)} tone={items.length ? tone : "success"} />
      </div>
      <div className="mt-2 space-y-1">
        {items.slice(0, 4).map((item, index) => <p key={index} className="text-xs leading-5 text-muted-foreground">{item}</p>)}
        {!items.length && <p className="text-xs text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function ScoreRows({ rows }: { rows: Array<[string, number]> }) {
  return (
    <div className="mt-4 space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
          <p className="text-sm font-medium">{label}</p>
          <StatusIndicator label={`${value}/100`} tone={value >= 80 ? "success" : value >= 65 ? "warning" : "danger"} />
        </div>
      ))}
    </div>
  );
}

function ReviewTarget({ title, score, icon: Icon, children }: { title: string; score: number; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" aria-hidden />
            <p className="truncate text-sm font-semibold">{title}</p>
          </div>
        </div>
        <StatusIndicator label={`${Math.round(score)}/100`} tone={score >= 80 ? "success" : score >= 65 ? "warning" : "danger"} />
      </div>
      {children}
    </div>
  );
}

function SignalList({ items }: { items: Array<{ title: string; detail: string; score?: number }> }) {
  return (
    <div className="mt-4 space-y-3">
      {items.slice(0, 6).map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{item.title}</p>
            {typeof item.score === "number" && <StatusIndicator label={`${item.score}/100`} tone={item.score >= 70 ? "success" : "warning"} />}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">No records yet.</p>}
    </div>
  );
}

function durationLabel(start?: Date | string | null, end?: Date | string | null) {
  if (!start) return "Not started";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((endMs - startMs) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function statusTone(status?: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED" || status === "CANCELLED") return "danger" as const;
  if (status === "WAITING_APPROVAL" || status === "RUNNING") return "warning" as const;
  return "neutral" as const;
}

function scoreState(value: number) {
  if (value >= 80) return "ready" as const;
  if (value >= 65) return "degraded" as const;
  return "mock" as const;
}
