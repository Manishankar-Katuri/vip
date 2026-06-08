"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Filter,
  Loader2,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
  Workflow,
  XCircle,
} from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  WorkflowAgentActivity,
  WorkflowApproval,
  WorkflowDataSource,
  WorkflowDetailResponse,
  WorkflowError,
  WorkflowListItem,
  WorkflowListResponse,
  WorkflowReport,
  WorkflowRun,
  WorkflowStep,
  WorkflowTimelineEvent,
} from "@/lib/workflows/types";

const statusLabels: Record<string, string> = {
  queued: "Pending",
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  waiting_approval: "Waiting for approval",
  skipped: "Not available yet",
  unknown: "Not available yet",
  generated: "Report ready",
  approved: "Approved",
  rejected: "Failed",
  not_generated: "Not available yet",
  not_requested: "Not available yet",
  not_sent: "Not sent",
};

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const statusTone: Record<string, StatusTone> = {
  queued: "neutral",
  pending: "neutral",
  running: "info",
  completed: "success",
  failed: "danger",
  waiting_approval: "warning",
  skipped: "neutral",
  unknown: "neutral",
  generated: "success",
  approved: "success",
  rejected: "danger",
  not_generated: "neutral",
  not_requested: "neutral",
  not_sent: "neutral",
};

const toneClass: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
};

export function WorkflowsCenter() {
  const router = useRouter();
  const [data, setData] = useState<WorkflowListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [manualWorkspaceId, setManualWorkspaceId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  async function loadWorkflows() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (clientId.trim()) params.set("clientId", clientId.trim());
      if (date) params.set("date", date);
      params.set("limit", "50");
      const result = await apiFetch<WorkflowListResponse>(`/workflows?${params.toString()}`, { cache: "no-store" });
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load workflows.");
    } finally {
      setLoading(false);
    }
  }

  async function startManualWorkflow() {
    const workspaceId = manualWorkspaceId.trim();
    if (!workspaceId) {
      setManualError("Enter a workspace or client id before starting a workflow.");
      return;
    }
    setManualLoading(true);
    setManualError(null);
    try {
      const result = await apiFetch<{ workflow?: WorkflowDetailResponse }>("/workflows/manual-start", {
        method: "POST",
        body: JSON.stringify({ workspaceId }),
      });
      if (result.workflow?.run.id) {
        router.push(`/workflows/${result.workflow.run.id}`);
        return;
      }
      await loadWorkflows();
    } catch (startError) {
      setManualError(startError instanceof Error ? startError.message : "Unable to start workflow.");
    } finally {
      setManualLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workflows = useMemo(() => data?.workflows ?? [], [data?.workflows]);
  const summary = useMemo(() => summarizeWorkflows(workflows), [workflows]);

  return (
    <OwnerShell
      title="Daily Workflow"
      description="Shows daily automated client growth workflows and their current status."
      actions={
        <div className="flex flex-col gap-2 sm:min-w-[360px]">
          <div className="flex gap-2">
            <input
              value={manualWorkspaceId}
              onChange={(event) => setManualWorkspaceId(event.target.value)}
              placeholder="Workspace/client id"
              className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"
              aria-label="Workspace or client id"
            />
            <Button type="button" onClick={startManualWorkflow} disabled={manualLoading}>
              {manualLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
              Manual start
            </Button>
          </div>
          {manualError && <p className="text-xs text-rose-700">{manualError}</p>}
        </div>
      }
    >
      <div className="space-y-5">
        <WorkflowSummaryCards summary={summary} />

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <Filter className="size-4 text-sky-700" aria-hidden />
                Workflow filters
              </h2>
              <p className="mt-1 text-sm text-slate-500">Filter by status, client/workspace id, or business date.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[160px_220px_170px_auto]">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">All statuses</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="WAITING_APPROVAL">Waiting approval</option>
              </select>
              <input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="Client/workspace id" className="min-h-10 rounded-md border border-slate-200 px-3 text-sm" />
              <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="min-h-10 rounded-md border border-slate-200 px-3 text-sm" />
              <Button type="button" variant="outline" onClick={loadWorkflows} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
                Apply
              </Button>
            </div>
          </div>
        </section>

        {loading && !data ? <LoadingPanel label="Loading workflows..." /> : null}
        {error ? <ErrorPanel title="Workflows unavailable" message={error} onRetry={loadWorkflows} /> : null}
        {!loading && !error && workflows.length === 0 ? (
          <EmptyWorkflowState onStart={startManualWorkflow} starting={manualLoading} />
        ) : null}
        {!error && workflows.length > 0 ? <WorkflowList workflows={workflows} refreshing={loading} onRefresh={loadWorkflows} /> : null}
      </div>
    </OwnerShell>
  );
}

export function WorkflowRunDetail({ runId }: { runId: string }) {
  const [detail, setDetail] = useState<WorkflowDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  async function loadDetail() {
    setLoading(true);
    setError(null);
    try {
      setDetail(await apiFetch<WorkflowDetailResponse>(`/workflows/${runId}`, { cache: "no-store" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load workflow run.");
    } finally {
      setLoading(false);
    }
  }

  async function retryWorkflow() {
    if (!detail?.retrySummary.retryable) return;
    setRetrying(true);
    setRetryMessage(null);
    try {
      const result = await apiFetch<{ workflow?: WorkflowDetailResponse; error?: string }>(`/workflows/${runId}/retry`, { method: "POST" });
      if (result.workflow) {
        setDetail(result.workflow);
        setRetryMessage("Retry request completed. The workflow detail has been refreshed.");
      } else {
        setRetryMessage(result.error ?? "Retry completed but no workflow was returned.");
        await loadDetail();
      }
    } catch (retryError) {
      setRetryMessage(retryError instanceof Error ? retryError.message : "Unable to retry workflow.");
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return (
    <OwnerShell
      title={detail ? detail.run.clientName : `Workflow Run ${runId}`}
      description="A visual story of one daily workflow run, from data collection through reports, approvals, errors, and retry readiness."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/workflows">All workflows</Link>
          </Button>
          <Button type="button" variant="outline" onClick={loadDetail} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCcw className="size-4" aria-hidden />}
            Refresh
          </Button>
        </div>
      }
    >
      {loading && !detail ? <LoadingPanel label="Loading workflow run..." /> : null}
      {error ? <ErrorPanel title="Workflow unavailable" message={error} onRetry={loadDetail} /> : null}
      {detail ? (
        <div className="space-y-5">
          <RunHeader run={detail.run} />
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <WorkflowStepProgress steps={detail.steps} />
            <WorkflowTimeline events={detail.timeline} />
          </div>
          <DataSourceCards sources={detail.dataSources.length ? detail.dataSources : detail.apiCalls} />
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <AgentActivityPanel activities={detail.agentActivity} />
            <WorkflowReportCards reports={detail.reports} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <WorkflowApprovalPanel approvals={detail.approvals} />
            <WorkflowErrorPanel errors={detail.errors} retrySummary={detail.retrySummary} retrying={retrying} retryMessage={retryMessage} onRetry={retryWorkflow} />
          </div>
        </div>
      ) : null}
    </OwnerShell>
  );
}

function WorkflowSummaryCards({ summary }: { summary: ReturnType<typeof summarizeWorkflows> }) {
  const cards = [
    { label: "Total workflows", value: summary.total, icon: Workflow, tone: "neutral" as StatusTone },
    { label: "Running", value: summary.running, icon: Timer, tone: "info" as StatusTone },
    { label: "Completed", value: summary.completed, icon: CheckCircle2, tone: "success" as StatusTone },
    { label: "Failed", value: summary.failed, icon: XCircle, tone: "danger" as StatusTone },
    { label: "Waiting for approval", value: summary.waitingApproval, icon: ShieldCheck, tone: "warning" as StatusTone },
    { label: "Reports ready", value: summary.reportsReady, icon: FileText, tone: "success" as StatusTone },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <span className={cn("flex size-8 items-center justify-center rounded-md border", toneClass[card.tone])}>
              <card.icon className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
        </div>
      ))}
    </section>
  );
}

function WorkflowList({ workflows, refreshing, onRefresh }: { workflows: WorkflowListItem[]; refreshing: boolean; onRefresh: () => void }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Workflow runs</h2>
          <p className="mt-1 text-sm text-slate-500">Client workflows with current step, progress, reports, approvals, and errors.</p>
        </div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCcw className="size-4" aria-hidden />}
          Refresh
        </Button>
      </div>
      <div className="divide-y divide-slate-200">
        {workflows.map((workflow) => (
          <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="block p-4 transition hover:bg-slate-50">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_1fr_0.8fr_0.7fr] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-950">{workflow.clientName}</h3>
                  <WorkflowStatusBadge status={workflow.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{workflow.workflowType}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Current step</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{workflow.currentStep}</p>
              </div>
              <ProgressBlock percent={workflow.progressPercent} />
              <div className="text-sm text-slate-600">
                <p>Started {formatDateTime(workflow.startedAt)}</p>
                <p className="mt-1">{workflow.completedAt ? `Completed ${formatDateTime(workflow.completedAt)}` : `Duration ${workflow.duration ?? "In progress"}`}</p>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <WorkflowStatusBadge status={workflow.reportStatus} />
                <WorkflowStatusBadge status={workflow.approvalStatus} />
                {workflow.errorCount > 0 ? <WorkflowStatusBadge status="failed" label={`${workflow.errorCount} error${workflow.errorCount === 1 ? "" : "s"}`} /> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RunHeader({ run }: { run: WorkflowRun }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkflowStatusBadge status={run.status} />
            <WorkflowStatusBadge status={run.triggerType} label={`Trigger: ${readable(run.triggerType)}`} />
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">{run.workflowType}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{run.summary}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <HeaderMetric label="Started" value={formatDateTime(run.startedAt)} icon={Clock} />
          <HeaderMetric label="Completed" value={formatDateTime(run.completedAt)} icon={CheckCircle2} />
          <HeaderMetric label="Duration" value={run.duration ?? "In progress"} icon={Timer} />
          <HeaderMetric label="Current phase" value={readable(run.currentPhase)} icon={Workflow} />
        </div>
      </div>
      <div className="mt-5">
        <ProgressBlock percent={run.progressPercent} large />
      </div>
    </section>
  );
}

function WorkflowTimeline({ events }: { events: WorkflowTimelineEvent[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Workflow timeline" description="What happened during the run, ordered by time." icon={Clock} />
      <div className="mt-4 space-y-4">
        {events.length ? events.map((event) => (
          <div key={event.id} className="relative flex gap-3">
            <span className={cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border", toneClass[statusTone[event.status] ?? "neutral"])}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
            </span>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{event.label}</p>
                <WorkflowStatusBadge status={event.status} />
                <span className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p>
              <p className="mt-1 text-xs text-slate-400">{readable(event.sourceType)}</p>
            </div>
          </div>
        )) : <EmptyMiniState message="No timeline events recorded yet." />}
      </div>
    </section>
  );
}

function WorkflowStepProgress({ steps }: { steps: WorkflowStep[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Step progress" description="Production workflow phases for this run." icon={Workflow} />
      <div className="mt-4 grid gap-3">
        {steps.map((step) => (
          <div key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{step.order}</span>
                  <h3 className="text-sm font-semibold text-slate-950">{step.label}</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
              </div>
              <WorkflowStatusBadge status={step.status} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>Time: {formatDateTime(step.completedAt ?? step.startedAt)}</p>
              <p>Records: {step.recordsProcessed ?? "Not available yet"}</p>
              <p>Duration: {step.duration ?? "Not available yet"}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{step.outputSummary}</p>
            {step.errorMessage ? <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">{step.errorMessage}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function DataSourceCards({ sources }: { sources: WorkflowDataSource[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Data sources / API calls" description="Data pulled or checked during the workflow." icon={Database} />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {sources.length ? sources.map((source) => (
          <div key={source.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-950">{source.label}</p>
                <p className="mt-1 text-xs text-slate-500">{source.provider}</p>
              </div>
              <WorkflowStatusBadge status={source.status} />
            </div>
            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div><dt className="font-medium text-slate-500">Records fetched</dt><dd>{source.recordsFetched ?? "Not available yet"}</dd></div>
              <div><dt className="font-medium text-slate-500">Data types</dt><dd>{source.dataTypes.join(", ") || "Not available yet"}</dd></div>
              <div><dt className="font-medium text-slate-500">Last successful sync</dt><dd>{formatDateTime(source.lastSuccessfulSyncAt)}</dd></div>
            </dl>
            {source.errorMessage ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{source.errorMessage}</p> : null}
          </div>
        )) : <EmptyMiniState message="No data-source records are available yet." />}
      </div>
    </section>
  );
}

function AgentActivityPanel({ activities }: { activities: WorkflowAgentActivity[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Agent activity" description="Agents, tools, and AI operations used by this workflow." icon={Bot} />
      <div className="mt-4 space-y-3">
        {activities.length ? activities.map((activity) => (
          <div key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{activity.agentName}</p>
                <p className="mt-1 text-xs text-slate-500">{activity.action}</p>
              </div>
              <WorkflowStatusBadge status={activity.status} />
            </div>
            <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
              <p>Tools: {activity.toolCalls.length}</p>
              <p>Started: {formatDateTime(activity.startedAt)}</p>
              <p>Tokens: {activity.tokenUsage ? activity.tokenUsage.totalTokens : "Not available yet"}</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <TextBlock label="Input" value={activity.inputSummary} />
              <TextBlock label="Output" value={activity.outputSummary} />
            </div>
            {activity.errorMessage ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">{activity.errorMessage}</p> : null}
          </div>
        )) : <EmptyMiniState message="No agent activity is available yet." />}
      </div>
    </section>
  );
}

function WorkflowReportCards({ reports }: { reports: WorkflowReport[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Reports" description="Generated report drafts and export readiness." icon={FileText} />
      <div className="mt-4 space-y-3">
        {reports.length ? reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{report.title}</p>
                <p className="mt-1 text-xs text-slate-500">{report.reportType}</p>
              </div>
              <WorkflowStatusBadge status={report.status} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <p>Generated: {formatDateTime(report.generatedAt)}</p>
              <p>Export: {readable(statusLabels[report.exportStatus] ?? report.exportStatus)}</p>
              <p>Approval: {readable(statusLabels[report.approvalStatus] ?? report.approvalStatus)}</p>
              <p>Sent: {readable(statusLabels[report.sentStatus] ?? report.sentStatus)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {isReportDraftType(report.reportType) ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/reports/${report.id}`}>Open report</Link>
                </Button>
              ) : null}
              {report.pdfUrl ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={report.pdfUrl}>Open PDF</Link>
                </Button>
              ) : <WorkflowStatusBadge status="unknown" label="PDF not available yet" />}
              <WorkflowStatusBadge status="unknown" label={report.docxUrl ? "DOCX ready" : "DOCX not available yet"} />
            </div>
          </div>
        )) : <EmptyMiniState message="No report draft has been generated yet." />}
      </div>
    </section>
  );
}

function WorkflowApprovalPanel({ approvals }: { approvals: WorkflowApproval[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Approvals" description="Owner and role approval state for this workflow." icon={ShieldCheck} />
      <div className="mt-4 space-y-3">
        {approvals.length ? approvals.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{readable(approval.targetType)}</p>
                <p className="mt-1 text-xs text-slate-500">{approval.targetId}</p>
              </div>
              <WorkflowStatusBadge status={approval.status} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <p>Requested: {formatDateTime(approval.requestedAt)}</p>
              <p>Approved: {formatDateTime(approval.approvedAt)}</p>
              <p>Approved by: {approval.approvedBy ?? "Not available yet"}</p>
              <p>Notes: {approval.notes ?? "Not available yet"}</p>
            </div>
          </div>
        )) : <EmptyMiniState message="No approval requests are attached yet." />}
      </div>
    </section>
  );
}

function WorkflowErrorPanel({
  errors,
  retrySummary,
  retrying,
  retryMessage,
  onRetry,
}: {
  errors: WorkflowError[];
  retrySummary: WorkflowDetailResponse["retrySummary"];
  retrying: boolean;
  retryMessage: string | null;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle title="Errors and retry" description="Issues that need attention and retry readiness." icon={AlertTriangle} />
      <div className="mt-4 space-y-3">
        {errors.length ? errors.map((error) => (
          <div key={error.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-rose-950">{error.source}</p>
                <p className="mt-1 text-xs text-rose-700">{readable(error.sourceType)} · {readable(error.severity)}</p>
              </div>
              <WorkflowStatusBadge status="failed" />
            </div>
            <p className="mt-3 text-sm leading-6 text-rose-900">{error.message}</p>
            <p className="mt-2 text-sm font-medium text-rose-950">Recommended action: {error.recommendedAction}</p>
          </div>
        )) : <EmptyMiniState message="No errors are recorded for this workflow." />}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{retrySummary.retryable ? "Retry is available" : "Retry unavailable"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{retrySummary.reason}</p>
            </div>
            {retrySummary.retryable ? (
              <Button type="button" onClick={onRetry} disabled={retrying}>
                {retrying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
                Retry Workflow
              </Button>
            ) : <WorkflowStatusBadge status="unknown" label="No retry action" />}
          </div>
          <p className="mt-2 text-sm text-slate-600">{retrySummary.recommendedAction}</p>
          {retryMessage ? <p className="mt-3 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">{retryMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}

function WorkflowStatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase();
  const tone = statusTone[normalized] ?? "neutral";
  return (
    <span className={cn("inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium", toneClass[tone])}>
      {label ?? statusLabels[normalized] ?? readable(status)}
    </span>
  );
}

function ProgressBlock({ percent, large = false }: { percent: number; large?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className={cn("font-medium text-slate-700", large ? "text-sm" : "text-xs")}>Progress</p>
        <p className={cn("font-semibold text-slate-950", large ? "text-sm" : "text-xs")}>{percent}%</p>
      </div>
      <div className={cn("mt-2 overflow-hidden rounded-full bg-slate-100", large ? "h-3" : "h-2")}>
        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function HeaderMetric({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-slate-500" aria-hidden />
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SectionTitle({ title, description, icon: Icon }: { title: string; description: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-sky-700" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      </div>
    </div>
  );
}

function ErrorPanel({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-rose-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCcw className="size-4" aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}

function EmptyWorkflowState({ onStart, starting }: { onStart: () => void; starting: boolean }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <Workflow className="mx-auto size-10 text-slate-400" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">No workflow has run yet</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Daily automated client growth workflows will appear here after they are scheduled or manually started.
      </p>
      <Button type="button" className="mt-5" onClick={onStart} disabled={starting}>
        {starting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
        Start manually
      </Button>
    </section>
  );
}

function EmptyMiniState({ message }: { message: string }) {
  return <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{message}</p>;
}

function summarizeWorkflows(workflows: WorkflowListItem[]) {
  return {
    total: workflows.length,
    running: workflows.filter((item) => item.status === "running").length,
    completed: workflows.filter((item) => item.status === "completed").length,
    failed: workflows.filter((item) => item.status === "failed").length,
    waitingApproval: workflows.filter((item) => item.status === "waiting_approval").length,
    reportsReady: workflows.filter((item) => item.reportStatus === "generated").length,
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readable(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isReportDraftType(value: string) {
  return [
    "DAILY_ANALYTICS_REPORT",
    "DAILY_STRATEGY_REPORT",
    "THREE_DAY_CONTENT_PLAN",
    "WEEKLY_GROWTH_REPORT",
    "MONTHLY_CLIENT_REPORT",
  ].includes(value);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
