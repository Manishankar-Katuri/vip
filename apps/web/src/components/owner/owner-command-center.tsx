"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, ClipboardCheck, FileText, Loader2, RefreshCw, Send, Users, Workflow } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { ReportListItem, ReportListResponse } from "@/lib/reports/types";
import type { WorkflowListItem, WorkflowListResponse } from "@/lib/workflows/types";

export function OwnerCommandCenter() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [workflowData, reportData] = await Promise.all([
        apiFetch<WorkflowListResponse>("/workflows?limit=8", { cache: "no-store" }),
        apiFetch<ReportListResponse>("/reports?limit=20", { cache: "no-store" }),
      ]);
      setWorkflows(workflowData.workflows);
      setReports(reportData.reports);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Owner command center could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarize(workflows, reports), [workflows, reports]);

  return (
    <OwnerShell
      title="Overview"
      description="Today status for workflows, reports, approvals, delivery readiness, and client setup."
      actions={<Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button>}
    >
      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Workflow} label="Today workflows" value={summary.workflowStatus} detail={`${summary.runningWorkflows} running, ${summary.failedWorkflows} failed`} />
        <MetricCard icon={ClipboardCheck} label="Needs approval" value={String(summary.needsApproval)} detail="Reports waiting or needing changes" />
        <MetricCard icon={FileText} label="Ready to export" value={String(summary.readyToExport)} detail="Approved reports without final export" />
        <MetricCard icon={Send} label="Ready to send" value={String(summary.readyToSend)} detail="Approved reports with exports" />
        <MetricCard icon={AlertTriangle} label="Failures" value={String(summary.failures)} detail="Failed workflows or deliveries" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Recent workflows" href="/workflows" />
          <div className="mt-4 grid gap-3">
            {workflows.length ? workflows.map((workflow) => (
              <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="rounded-lg border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{workflow.clientName}</p>
                    <p className="mt-1 text-sm text-slate-500">{workflow.currentStep} - {labelize(workflow.status)}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{workflow.progressPercent}%</span>
                </div>
              </Link>
            )) : <EmptyLine text={loading ? "Loading workflows..." : "No workflow runs found yet."} />}
          </div>
        </section>

        <aside className="space-y-5">
          <ActionLinks />
          <ReportQueue title="Reports needing approval" reports={reports.filter((report) => ["pending", "changes_requested", "not_requested"].includes(report.approvalStatus)).slice(0, 5)} empty="No approval blockers." />
          <ReportQueue title="Ready to export or send" reports={reports.filter((report) => report.approvalStatus === "approved").slice(0, 5)} empty="No approved reports ready yet." />
          <ClientReminders reports={reports} workflows={workflows} />
        </aside>
      </div>
    </OwnerShell>
  );
}

function ActionLinks() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Quick links</h2>
      <div className="mt-3 grid gap-2">
        {[
          { label: "Daily Workflow", href: "/workflows" },
          { label: "Reports", href: "/reports" },
          { label: "Approvals", href: "/approvals" },
          { label: "Clients", href: "/clients" },
        ].map((link) => (
          <Button key={link.href} asChild variant="outline" className="justify-between">
            <Link href={link.href}>{link.label}<ArrowUpRight className="size-4" aria-hidden /></Link>
          </Button>
        ))}
      </div>
    </section>
  );
}

function ReportQueue({ title, reports, empty }: { title: string; reports: ReportListItem[]; empty: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title={title} href="/reports" compact />
      <div className="mt-3 grid gap-2">
        {reports.length ? reports.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`} className="rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
            <p className="font-semibold text-slate-950">{report.title}</p>
            <p className="mt-1 text-xs text-slate-500">{report.clientName} - {labelize(report.approvalStatus)} - {labelize(report.sentStatus)}</p>
          </Link>
        )) : <EmptyLine text={empty} />}
      </div>
    </section>
  );
}

function ClientReminders({ reports, workflows }: { reports: ReportListItem[]; workflows: WorkflowListItem[] }) {
  const clientIds = new Set([...reports.map((report) => report.workspaceId), ...workflows.map((workflow) => workflow.workspaceId)]);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 size-4 text-slate-500" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Client setup reminders</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Check recipients, integrations, workflow schedule, approval settings, and report preferences for active clients.
          </p>
          <p className="mt-2 text-xs text-slate-500">{clientIds.size} client/workspace ids seen in recent workflows and reports.</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Workflow; label: string; value: string; detail: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <Icon className="size-5 text-sky-700" aria-hidden />
      </div>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </section>
  );
}

function SectionTitle({ title, href, compact = false }: { title: string; href: string; compact?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className={compact ? "text-sm font-semibold text-slate-950" : "text-base font-semibold text-slate-950"}>{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950">Open <ArrowUpRight className="size-3.5" aria-hidden /></Link>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">{text}</p>;
}

function summarize(workflows: WorkflowListItem[], reports: ReportListItem[]) {
  const runningWorkflows = workflows.filter((workflow) => workflow.status === "running").length;
  const failedWorkflows = workflows.filter((workflow) => workflow.status === "failed").length;
  const failedDeliveries = reports.filter((report) => report.sentStatus === "failed").length;
  const needsApproval = reports.filter((report) => ["pending", "changes_requested", "not_requested"].includes(report.approvalStatus)).length;
  const readyToExport = reports.filter((report) => report.approvalStatus === "approved" && report.exportStatus !== "exported").length;
  const readyToSend = reports.filter((report) => report.approvalStatus === "approved" && report.exportStatus === "exported" && report.sentStatus !== "sent").length;
  return {
    workflowStatus: workflows.length ? `${workflows.filter((workflow) => workflow.status === "completed").length}/${workflows.length}` : "0",
    runningWorkflows,
    failedWorkflows,
    failedDeliveries,
    needsApproval,
    readyToExport,
    readyToSend,
    failures: failedWorkflows + failedDeliveries,
  };
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
