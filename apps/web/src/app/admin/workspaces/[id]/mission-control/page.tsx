import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { RunDailyGrowthMissionButton } from "@/components/daily-growth-mission/run-button";
import {
  EvidenceList,
  IntelligenceHero,
  IntelligenceMetricGrid,
} from "@/design-system/dashboard-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import {
  getDailyGrowthMissionDetail,
  getDailyGrowthMissionReplay,
  listDailyGrowthMissions,
} from "@/lib/daily-growth-mission";
import { prisma } from "@vip/database";

export default async function MissionControl({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const history = await listDailyGrowthMissions(workspaceId);
  const latest = history[0] ? await getDailyGrowthMissionDetail(workspaceId, history[0].id) : null;
  const replay = latest ? await getDailyGrowthMissionReplay(workspaceId, latest.id) : [];
  const db = prisma as typeof prisma & Record<string, any>;
  const actionPlanId = latest?.contentProductionPackages?.[0]?.actionPlanId;
  const actionPlan = actionPlanId ? await db.actionPlan.findUnique({ where: { id: actionPlanId }, include: { approvals: true, steps: true } }) : null;
  const tasks = await db.operationalTask.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 6 });
  const learningMemory = await db.agentLearningMemory.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 6 });
  const snapshot = latest?.businessSnapshots?.[0];
  const report = latest?.dailyGrowthReports?.[0];
  const productionPackage = latest?.contentProductionPackages?.[0];
  const trendData = jsonObject(snapshot?.trends);
  const competitorData = jsonObject(snapshot?.competitors);
  const calendarData = jsonObject(snapshot?.calendar);
  const trendSignals = Array.isArray(trendData.signals) ? trendData.signals : [];
  const competitorGaps = Array.isArray(competitorData.gaps) ? competitorData.gaps : [];
  const calendarOpportunities = Array.isArray(calendarData.opportunities) ? calendarData.opportunities : [];

  const pages = [
    { name: "Dashboard", href: `/admin/workspaces/${workspaceId}/dashboard`, icon: LayoutDashboard, state: "ready" as const },
    { name: "Alerts", href: `/admin/workspaces/${workspaceId}/alerts`, icon: AlertTriangle, state: "ready" as const },
    { name: "AI Copilot", href: `/admin/workspaces/${workspaceId}/copilot`, icon: Bot, state: "mock" as const },
    { name: "Tasks", href: `/admin/workspaces/${workspaceId}/tasks`, icon: ClipboardCheck, state: "ready" as const },
    { name: "Insights", href: `/admin/workspaces/${workspaceId}/insights`, icon: Gauge, state: "ready" as const },
    { name: "Command Center", href: `/admin/workspaces/${workspaceId}/command-center`, icon: Workflow, state: "ready" as const },
    { name: "War Room", href: `/admin/workspaces/${workspaceId}/war-room`, icon: ShieldCheck, state: "mock" as const },
    { name: "Daily Growth", href: `/admin/workspaces/${workspaceId}/mission-control`, icon: CalendarClock, state: latest ? "ready" as const : "mock" as const },
  ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Mission Control"
        title="Daily Growth Mission"
        description="A persisted, event-backed daily mission that reads workspace data, generates production work, and records every phase for replay."
        icon={Sparkles}
        state={latest ? "ready" : "mock"}
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Daily Growth Mission</h1>
            <p className="text-sm text-muted-foreground">Manual runs use the same persisted event path as the 5:00 AM scheduler.</p>
          </div>
          <RunDailyGrowthMissionButton workspaceId={workspaceId} />
        </div>

        <IntelligenceMetricGrid
          metrics={[
            { label: "Mission status", value: latest?.status ?? "Not run", detail: latest?.currentPhase ?? "No execution has been persisted yet.", state: latest ? "ready" : "mock", icon: Workflow },
            { label: "Replay events", value: String(replay.length), detail: "Durable event envelopes for this execution.", state: replay.length ? "ready" : "mock", icon: MessageSquareText },
            { label: "Production packages", value: String(latest?.contentProductionPackages?.length ?? 0), detail: "Approval-gated content packages.", state: productionPackage ? "ready" : "mock", icon: PackageCheck },
            { label: "Reports", value: String(latest?.dailyGrowthReports?.length ?? 0), detail: report?.pdfFileName ?? "PDF payload is created after a run.", state: report ? "ready" : "mock", icon: FileText },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Mission phase"
              description="Persisted status, source acquisition, and agent activity from the latest execution."
              action={<StatusIndicator label={latest?.status ?? "Not run"} tone={statusTone(latest?.status)} />}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {sourceEntries(snapshot?.sourceStatuses).map(([source, status]) => (
                <div key={source} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize">{source}</span>
                    <StatusIndicator label={String(status)} tone={sourceTone(String(status))} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Recorded as persisted source status. No unavailable feed is mocked.</p>
                </div>
              ))}
            </div>
            {!snapshot && <p className="mt-4 text-sm text-muted-foreground">Run the mission to collect source statuses from persisted workspace data.</p>}
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Approvals"
              description="Action Engine plan with Doctor Approval and Production Approval."
              action={<StatusIndicator label={actionPlan?.status ?? "No plan"} tone={actionPlan ? "warning" : "neutral"} />}
            />
            <div className="mt-4 space-y-3">
              {(actionPlan?.steps ?? []).map((step: any) => (
                <div key={step.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.processor}</p>
                  </div>
                  <StatusIndicator label={step.status} tone={step.requiresApproval ? "warning" : "info"} />
                </div>
              ))}
              {!actionPlan && <p className="text-sm text-muted-foreground">Approval requests appear after content production.</p>}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <SectionHeader title="Generated PDFs" description="Downloadable files generated during report creation." />
            {report?.pdfFileName ? (
              <Link href={report.pdfFileName} className="mt-4 inline-flex rounded-md border px-3 py-2 text-sm font-medium transition hover:border-primary/40">
                Download PDF
              </Link>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">PDF appears after report generation.</p>
            )}
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="Trend signals" description="Persisted market signals scored for this mission." />
            <SignalList items={trendSignals} empty="No trend signals available." />
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="Competitor signals" description="Competitor gaps generated from stored accounts and metrics." />
            <SignalList items={competitorGaps} empty="No competitor gaps available." />
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <SectionHeader title="Calendar opportunities" description="Today, tomorrow, next 7 days, and next 30 days from the hospital calendar." />
            <SignalList items={calendarOpportunities} empty="No calendar opportunities available." />
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="Learning memory" description="Recent learning used to influence opportunity and content generation." />
            <div className="mt-4 space-y-3">
              {learningMemory.map((memory: any) => (
                <div key={memory.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{memory.scope}</p>
                    <StatusIndicator label={`${Math.round(Number(memory.confidenceScore ?? 0) * 100)}%`} tone="info" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{memory.key}</p>
                </div>
              ))}
              {!learningMemory.length && <p className="text-sm text-muted-foreground">Learning memory appears after completed missions.</p>}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            <SectionHeader title="Production package" description="Complete daily content package generated from the approved brief." />
            {productionPackage ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold">{productionPackage.topic}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{productionPackage.fullScript}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Fact label="Hook" value={productionPackage.hook} />
                  <Fact label="CTA" value={productionPackage.cta} />
                  <Fact label="Platform" value={productionPackage.platformRecommendation} />
                  <Fact label="Thumbnail" value={productionPackage.thumbnailText} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No production package has been generated yet.</p>
            )}
          </Panel>

          <Panel className="p-5">
            <SectionHeader title="Operational tasks" description="Tasks created for doctor, production, and staff roles." />
            <div className="mt-4 space-y-3">
              {tasks.map((task: any) => (
                <div key={task.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <StatusIndicator label={task.assigneeRole} tone="info" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{task.status} · {task.due}</p>
                </div>
              ))}
              {!tasks.length && <p className="text-sm text-muted-foreground">Tasks appear after a mission run.</p>}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <EvidenceList
            title="Replay"
            description="Event envelopes for the latest Daily Growth Mission execution."
            items={replay.slice(0, 8).map((event: any) => ({ title: event.eventType, detail: `${event.topic} · sequence ${event.sequence}`, state: "ready" }))}
          />

          <Panel className="p-5">
            <SectionHeader title="Mission history" description="Persisted executions for this workspace." />
            <div className="mt-4 space-y-3">
              {history.map((execution: any) => (
                <Link key={execution.id} href={`/api/admin/workspaces/${workspaceId}/daily-growth-mission/${execution.id}`} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/40">
                  <div>
                    <p className="text-sm font-medium">{new Date(execution.businessDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{execution.currentPhase}</p>
                  </div>
                  <StatusIndicator label={execution.status} tone={statusTone(execution.status)} />
                </Link>
              ))}
              {!history.length && <p className="text-sm text-muted-foreground">No mission history yet.</p>}
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader title="Product surface map" description="Workspace routes connected to mission outputs and operational review." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pages.map((page) => (
              <Link key={page.name} href={page.href} className="rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-info text-info-foreground">
                    <page.icon className="size-5" aria-hidden />
                  </span>
                  <StatusIndicator label={page.state === "ready" ? "Live" : "Mock"} tone={page.state === "ready" ? "success" : "info"} />
                </div>
                <h2 className="mt-4 text-sm font-semibold">{page.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Open module</p>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}

function SignalList({ items, empty }: { items: any[]; empty: string }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="mt-4 space-y-3">
      {list.slice(0, 5).map((item, index) => (
        <div key={item.id ?? item.title ?? item.label ?? index} className="rounded-lg border bg-background p-3">
          <p className="text-sm font-medium">{item.title ?? item.label ?? item.topic ?? "Signal"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail ?? item.category ?? item.opportunityType ?? item.scheduledDate ?? "Persisted mission signal"}</p>
        </div>
      ))}
      {!list.length && <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

function sourceEntries(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>);
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function sourceTone(status: string) {
  if (status === "COLLECTED") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "NO_DATA") return "warning" as const;
  return "neutral" as const;
}

function statusTone(status?: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED" || status === "CANCELLED") return "danger" as const;
  if (status === "WAITING_APPROVAL" || status === "RUNNING") return "warning" as const;
  return "neutral" as const;
}
