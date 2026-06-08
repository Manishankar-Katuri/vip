"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type { GenerateReportInput, ReportDetailResponse, ReportExport, ReportListResponse, ReportRecipient, ReportSection, ReportType } from "@/lib/reports/types";
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

type GenerateDefaults = {
  reportType: ReportType;
  title: string;
  description: string;
};

export function ReportsCenter() {
  const router = useRouter();
  const [data, setData] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ clientId: "", workflowRunId: "", reportType: "", status: "" });

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.clientId) params.set("clientId", filters.clientId);
      if (filters.workflowRunId) params.set("workflowRunId", filters.workflowRunId);
      if (filters.reportType) params.set("reportType", filters.reportType);
      if (filters.status) params.set("status", filters.status);
      params.set("limit", "50");
      setData(await apiFetch<ReportListResponse>(`/reports?${params.toString()}`, { cache: "no-store" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const reports = data?.reports ?? [];

  return (
    <OwnerShell
      title="Reports"
      description="Generate, review, edit, and prepare client-ready report drafts from persisted workflow, analytics, strategy, and content data."
      actions={<Button type="button" variant="outline" onClick={loadReports} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button>}
    >
      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <GenerateReportPanel
            defaults={{
              reportType: "DAILY_ANALYTICS_REPORT",
              title: "Generate Report",
              description: "Create a new editable draft. Existing drafts for the same client, date, type, and workflow are reused unless regeneration is requested.",
            }}
            onGenerated={(report) => router.push(`/reports/${report.report.id}`)}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Filters</h2>
            <div className="mt-4 grid gap-3">
              <Field label="Client/workspace id">
                <Input value={filters.clientId} onChange={(event) => setFilters((current) => ({ ...current, clientId: event.target.value }))} placeholder="workspace id" />
              </Field>
              <Field label="Workflow run id">
                <Input value={filters.workflowRunId} onChange={(event) => setFilters((current) => ({ ...current, workflowRunId: event.target.value }))} placeholder="optional workflow run id" />
              </Field>
              <Field label="Report type">
                <select className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={filters.reportType} onChange={(event) => setFilters((current) => ({ ...current, reportType: event.target.value }))}>
                  <option value="">All report types</option>
                  {REPORT_TYPES.map((type) => <option key={type} value={type}>{REPORT_TYPE_LABELS[type]}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                  <option value="">All statuses</option>
                  {["draft", "ready_for_review", "approved", "exported", "sent", "archived", "failed"].map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
                </select>
              </Field>
            </div>
          </section>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Report drafts</h2>
              <p className="mt-1 text-sm text-slate-500">{reports.length ? `${reports.length} report draft${reports.length === 1 ? "" : "s"} ready for review.` : "No report drafts match the current filters."}</p>
            </div>
          </div>

          {loading ? <LoadingBlock label="Loading report drafts" /> : null}
          {error ? <ErrorBlock message={error} onRetry={loadReports} /> : null}
          {!loading && !error && !reports.length ? <EmptyBlock title="No reports yet" message="Generate the first draft from a client/workspace id or from a workflow run." /> : null}

          <div className="mt-4 grid gap-3">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={report.status} />
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">{REPORT_TYPE_LABELS[report.reportType]}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-950">{report.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{report.clientName} - Generated {formatDateTime(report.generatedAt ?? report.createdAt)}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{report.summary || "No summary has been written yet."}</p>
                  </div>
                  <div className="grid min-w-[220px] gap-2 text-xs text-slate-500">
                    <MiniState label="Approval" value={report.approvalStatus} />
                    <MiniState label="Export" value={report.exportStatus} />
                    <MiniState label="PDF" value={report.pdfUrl ? "available" : "not_exported"} />
                    <MiniState label="DOCX" value={report.docxUrl ? "available" : "not_exported"} />
                    <MiniState label="Sent" value={report.sentStatus} />
                    <span className="inline-flex items-center justify-end gap-1 font-medium text-slate-700">Open <ArrowUpRight className="size-3.5" aria-hidden /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </OwnerShell>
  );
}

export function ReportDetail({ reportId }: { reportId: string }) {
  const [detail, setDetail] = useState<ReportDetailResponse | null>(null);
  const [draft, setDraft] = useState<{ title: string; summary: string; status: string; sections: ReportSection[] } | null>(null);
  const [recipients, setRecipients] = useState<ReportRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"PDF" | "DOCX" | null>(null);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [sendMessage, setSendMessage] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<ReportDetailResponse>(`/reports/${reportId}`, { cache: "no-store" });
      setDetail(result);
      setDraft({ title: result.report.title, summary: result.report.summary, status: result.report.status, sections: result.sections });
      try {
        const recipientResult = await apiFetch<{ recipients: ReportRecipient[] }>(`/clients/${result.report.workspaceId}/recipients`, { cache: "no-store" });
        setRecipients(recipientResult.recipients);
      } catch {
        setRecipients([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function saveChanges() {
    if (!draft) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await apiFetch<ReportDetailResponse>(`/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title,
          summary: draft.summary,
          status: draft.status,
          sections: draft.sections.map((section) => ({ id: section.id, content: section.content })),
        }),
      });
      setDetail(result);
      setDraft({ title: result.report.title, summary: result.report.summary, status: result.report.status, sections: result.sections });
      setSaveMessage("Report changes saved.");
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "Unable to save report.");
    } finally {
      setSaving(false);
    }
  }

  async function exportDraft(format: "PDF" | "DOCX", forceRegenerate: boolean) {
    setExportingFormat(format);
    setExportMessage(null);
    try {
      const result = await apiFetch<{ export: ReportExport; report: ReportDetailResponse; reused: boolean }>(`/reports/${reportId}/exports`, {
        method: "POST",
        body: JSON.stringify({ format, forceRegenerate }),
      });
      setDetail(result.report);
      setDraft({ title: result.report.report.title, summary: result.report.report.summary, status: result.report.report.status, sections: result.report.sections });
      setExportMessage(`${format} export ${result.reused ? "reused" : "completed"}.`);
    } catch (exportError) {
      setExportMessage(exportError instanceof Error ? exportError.message : `Unable to export ${format}.`);
      void loadDetail();
    } finally {
      setExportingFormat(null);
    }
  }

  async function actOnApproval(action: string, notes: string, decidedBy: string) {
    setApprovalAction(action);
    setApprovalMessage(null);
    try {
      await apiFetch(`/reports/${reportId}/approval`, {
        method: "POST",
        body: JSON.stringify({ action, notes, decidedBy }),
      });
      setApprovalMessage("Approval status updated.");
      await loadDetail();
    } catch (approvalError) {
      setApprovalMessage(approvalError instanceof Error ? approvalError.message : "Unable to update approval.");
    } finally {
      setApprovalAction(null);
    }
  }

  async function sendDraft(input: { recipients: Array<string | { id?: string; email?: string; name?: string }>; formats: string; message: string }) {
    setSending(true);
    setSendMessage(null);
    try {
      const result = await apiFetch<{ deliveries: unknown[]; sentStatus: string }>(`/reports/${reportId}/send`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      setSendMessage(result.sentStatus === "sent" ? "Report sent." : "Delivery attempt recorded. Check delivery history for details.");
      await loadDetail();
    } catch (sendError) {
      setSendMessage(sendError instanceof Error ? sendError.message : "Unable to send report.");
      await loadDetail();
    } finally {
      setSending(false);
    }
  }

  return (
    <OwnerShell
      title={detail?.report.title ?? "Report"}
      description="Preview, edit, export, and prepare this client-ready report draft. Approval/send controls arrive in Phase 6."
      actions={<Button asChild variant="outline"><Link href="/reports">All reports</Link></Button>}
    >
      {loading ? <LoadingBlock label="Loading report detail" /> : null}
      {error ? <ErrorBlock message={error} onRetry={loadDetail} /> : null}
      {!loading && !error && detail && draft ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={detail.report.status} />
                <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">{REPORT_TYPE_LABELS[detail.report.reportType]}</span>
                {detail.workflow.workflowRunId ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/workflows/${detail.workflow.workflowRunId}`}>Workflow <ArrowUpRight className="size-3.5" aria-hidden /></Link>
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Editable title">
                  <Input value={draft.title} onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value } : current)} />
                </Field>
                <Field label="Editable summary">
                  <textarea className="min-h-24 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6" value={draft.summary} onChange={(event) => setDraft((current) => current ? { ...current, summary: event.target.value } : current)} />
                </Field>
                <Field label="Report status">
                  <select className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={draft.status} onChange={(event) => setDraft((current) => current ? { ...current, status: event.target.value } : current)}>
                    <option value="draft">Draft</option>
                    <option value="ready_for_review">Ready for review</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={saveChanges} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                    Save changes
                  </Button>
                  {saveMessage ? <p className="text-sm text-slate-600">{saveMessage}</p> : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {draft.sections.sort((a, b) => a.order - b.order).map((section) => (
                <EditableSection
                  key={section.id}
                  section={section}
                  onChange={(content) => setDraft((current) => current ? { ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, content } : item) } : current)}
                />
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <StatusPanel detail={detail} exportingFormat={exportingFormat} exportMessage={exportMessage} onExport={exportDraft} />
            <ApprovalPanel detail={detail} action={approvalAction} message={approvalMessage} onAction={actOnApproval} />
            <SendPanel detail={detail} recipients={recipients} sending={sending} message={sendMessage} onSend={sendDraft} />
            <SourcePanel detail={detail} />
          </aside>
        </div>
      ) : null}
    </OwnerShell>
  );
}

export function GenerateReportPanel({ defaults, compact = false, onGenerated }: { defaults: GenerateDefaults; compact?: boolean; onGenerated?: (detail: ReportDetailResponse) => void }) {
  const router = useRouter();
  const [reportType, setReportType] = useState<ReportType>(defaults.reportType);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workflowRunId, setWorkflowRunId] = useState("");
  const [date, setDate] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setMessage(null);
    try {
      const body: GenerateReportInput = {
        reportType,
        workspaceId: workspaceId || undefined,
        workflowRunId: workflowRunId || undefined,
        date: date || undefined,
        forceRegenerate,
      };
      const result = await apiFetch<ReportDetailResponse>("/reports/generate", { method: "POST", body: JSON.stringify(body) });
      if (onGenerated) onGenerated(result);
      else router.push(`/reports/${result.report.id}`);
    } catch (generateError) {
      setMessage(generateError instanceof Error ? generateError.message : "Unable to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", compact ? "p-4" : "p-5")}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-950">{defaults.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{defaults.description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="Report type">
          <select className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
            {REPORT_TYPES.map((type) => <option key={type} value={type}>{REPORT_TYPE_LABELS[type]}</option>)}
          </select>
        </Field>
        <Field label="Client/workspace id">
          <Input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} placeholder="required unless workflow id is provided" />
        </Field>
        <Field label="Workflow run id">
          <Input value={workflowRunId} onChange={(event) => setWorkflowRunId(event.target.value)} placeholder="optional" />
        </Field>
        <Field label="Report date">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={forceRegenerate} onChange={(event) => setForceRegenerate(event.target.checked)} />
          Regenerate existing draft
        </label>
        <Button type="button" onClick={generate} disabled={generating || (!workspaceId && !workflowRunId)}>
          {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />}
          Generate draft
        </Button>
        {message ? <p className="text-sm text-rose-700">{message}</p> : null}
      </div>
    </section>
  );
}

function EditableSection({ section, onChange }: { section: ReportSection; onChange: (content: ReportSection["content"]) => void }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{section.title}</h2>
          {section.sourceRefs?.length ? <p className="mt-1 text-xs text-slate-500">Sources: {section.sourceRefs.join(", ")}</p> : null}
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          <Pencil className="size-3.5" aria-hidden />
          {section.editable ? "Editable" : "Read only"}
        </span>
      </div>
      <div className="mt-4">
        {Array.isArray(section.content) && section.content.every((item) => typeof item === "object") ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {(section.content as Array<Record<string, string | number | null>>).map((row, index) => (
              <div key={`${section.id}-${index}`} className="grid gap-2 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[170px_1fr]">
                <span className="text-xs font-semibold uppercase text-slate-500">{String(row.field ?? `Item ${index + 1}`)}</span>
                <textarea className="min-h-16 rounded-md border border-slate-200 p-2 text-sm leading-6" value={String(row.value ?? "")} disabled={!section.editable} onChange={(event) => onChange((section.content as Array<Record<string, string | number | null>>).map((item, rowIndex) => rowIndex === index ? { ...item, value: event.target.value } : item))} />
              </div>
            ))}
          </div>
        ) : Array.isArray(section.content) ? (
          <textarea className="min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm leading-6" value={section.content.join("\n")} disabled={!section.editable} onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))} />
        ) : (
          <textarea className="min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm leading-6" value={section.content} disabled={!section.editable} onChange={(event) => onChange(event.target.value)} />
        )}
      </div>
    </section>
  );
}

function StatusPanel({
  detail,
  exportingFormat,
  exportMessage,
  onExport,
}: {
  detail: ReportDetailResponse;
  exportingFormat: "PDF" | "DOCX" | null;
  exportMessage: string | null;
  onExport: (format: "PDF" | "DOCX", forceRegenerate: boolean) => void;
}) {
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const latestPdf = latestExport(detail.exports, "PDF");
  const latestDocx = latestExport(detail.exports, "DOCX");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Status</h2>
      <div className="mt-3 grid gap-2">
        <StatusCard icon={CheckCircle2} label="Approval" value={detail.report.approvalStatus} />
        <StatusCard icon={Download} label="Export" value={detail.report.exportStatus || "not exported"} />
        <StatusCard icon={Mail} label="Send" value={detail.report.sentStatus || "coming in Phase 6"} />
      </div>
      <div className="mt-4 grid gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={forceRegenerate} onChange={(event) => setForceRegenerate(event.target.checked)} />
          Regenerate existing export
        </label>
        <Button type="button" variant="outline" onClick={() => onExport("PDF", forceRegenerate)} disabled={Boolean(exportingFormat)}>
          {exportingFormat === "PDF" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          Export PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => onExport("DOCX", forceRegenerate)} disabled={Boolean(exportingFormat)}>
          {exportingFormat === "DOCX" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          Export DOCX
        </Button>
        {latestPdf?.url ? <Button asChild variant="outline"><Link href={latestPdf.url}>Open latest PDF</Link></Button> : null}
        {latestDocx?.url ? <Button asChild variant="outline"><Link href={latestDocx.url}>Open latest DOCX</Link></Button> : null}
        <Button type="button" variant="outline" disabled><Send className="size-4" aria-hidden /> Approval/send in Phase 6</Button>
        {exportMessage ? <p className="text-sm text-slate-600">{exportMessage}</p> : null}
        {detail.exports.filter((item) => item.errorMessage).map((item) => (
          <p key={`${item.id}-${item.format}-error`} className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {item.format} failed: {item.errorMessage}
          </p>
        ))}
      </div>
    </section>
  );
}

function ApprovalPanel({
  detail,
  action,
  message,
  onAction,
}: {
  detail: ReportDetailResponse;
  action: string | null;
  message: string | null;
  onAction: (action: string, notes: string, decidedBy: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [decidedBy, setDecidedBy] = useState("");
  const archived = detail.report.status === "archived";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Approval</h2>
      <p className="mt-2 text-sm text-slate-600">Current status: <span className="font-semibold text-slate-950">{labelize(detail.report.approvalStatus)}</span></p>
      <div className="mt-3 grid gap-2">
        <textarea className="min-h-20 rounded-md border border-slate-200 p-2 text-sm leading-6" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes for approval history" />
        <Input value={decidedBy} onChange={(event) => setDecidedBy(event.target.value)} placeholder="Decided by (optional until auth identity is wired)" />
        <div className="grid grid-cols-2 gap-2">
          <ApprovalButton label="Request approval" actionName="request_approval" active={action} disabled={archived} onClick={() => onAction("request_approval", notes, decidedBy)} />
          <ApprovalButton label="Approve" actionName="approve" active={action} disabled={archived} onClick={() => onAction("approve", notes, decidedBy)} />
          <ApprovalButton label="Request changes" actionName="request_changes" active={action} disabled={archived} onClick={() => onAction("request_changes", notes, decidedBy)} />
          <ApprovalButton label="Reject" actionName="reject" active={action} disabled={archived} onClick={() => onAction("reject", notes, decidedBy)} />
        </div>
        {archived ? <p className="text-sm text-amber-700">Archived reports cannot be approved or sent.</p> : null}
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
      {detail.approvals.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Approval history</p>
          {detail.approvals.slice(0, 4).map((approval) => (
            <div key={approval.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
              <p className="font-semibold text-slate-950">{labelize(approval.status)}</p>
              <p className="text-xs text-slate-500">{formatMaybeDate(approval.decidedAt ?? approval.requestedAt)}</p>
              {approval.notes ? <p className="mt-1 text-slate-600">{approval.notes}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ApprovalButton({ label, actionName, active, disabled, onClick }: { label: string; actionName: string; active: string | null; disabled: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" disabled={disabled || Boolean(active)} onClick={onClick}>
      {active === actionName ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {label}
    </Button>
  );
}

function SendPanel({
  detail,
  recipients,
  sending,
  message,
  onSend,
}: {
  detail: ReportDetailResponse;
  recipients: ReportRecipient[];
  sending: boolean;
  message: string | null;
  onSend: (input: { recipients: Array<string | { id?: string; email?: string; name?: string }>; formats: string; message: string }) => void;
}) {
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [formats, setFormats] = useState("PDF");
  const [customMessage, setCustomMessage] = useState("");
  const latestPdf = latestExport(detail.exports, "PDF");
  const latestDocx = latestExport(detail.exports, "DOCX");
  const approved = detail.report.approvalStatus === "approved";
  const hasPdf = Boolean(latestPdf?.status === "completed" && latestPdf.url);
  const hasDocx = Boolean(latestDocx?.status === "completed" && latestDocx.url);
  const requestedExportReady = formats === "BOTH" ? hasPdf && hasDocx : formats === "PDF" ? hasPdf : hasDocx;
  const hasRecipient = selectedRecipientIds.length > 0 || Boolean(manualEmail.trim());
  const disabledReason = !approved
    ? "Approve the report before sending."
    : !requestedExportReady
      ? "Export the selected file format before sending."
      : !hasRecipient
        ? "Select or enter at least one recipient."
        : null;

  function toggleRecipient(id: string) {
    setSelectedRecipientIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Send</h2>
      <div className="mt-3 grid gap-2 text-sm">
        <MiniState label="Approved" value={approved ? "yes" : "no"} />
        <MiniState label="PDF" value={hasPdf ? "available" : "missing"} />
        <MiniState label="DOCX" value={hasDocx ? "available" : "missing"} />
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="Format">
          <select className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={formats} onChange={(event) => setFormats(event.target.value)}>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="BOTH">PDF and DOCX</option>
          </select>
        </Field>
        {recipients.length ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-slate-700">Recipients</p>
            {recipients.map((recipient) => (
              <label key={recipient.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                <input type="checkbox" checked={selectedRecipientIds.includes(recipient.id)} onChange={() => toggleRecipient(recipient.id)} />
                <span>{recipient.name} <span className="text-slate-500">({recipient.email})</span></span>
              </label>
            ))}
          </div>
        ) : <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">No saved recipients yet. Add a manual email for this send.</p>}
        <Field label="Manual recipient email">
          <Input value={manualEmail} onChange={(event) => setManualEmail(event.target.value)} placeholder="client@example.com" />
        </Field>
        <Field label="Manual recipient name">
          <Input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="optional" />
        </Field>
        <Field label="Message">
          <textarea className="min-h-20 rounded-md border border-slate-200 p-2 text-sm leading-6" value={customMessage} onChange={(event) => setCustomMessage(event.target.value)} placeholder="Optional note to include in the email" />
        </Field>
        <Button
          type="button"
          disabled={sending || Boolean(disabledReason)}
          onClick={() => onSend({
            recipients: [
              ...selectedRecipientIds,
              ...(manualEmail.trim() ? [{ email: manualEmail, name: manualName }] : []),
            ],
            formats,
            message: customMessage,
          })}
        >
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          Send report
        </Button>
        {disabledReason ? <p className="text-sm text-amber-700">{disabledReason}</p> : null}
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
      {detail.deliveries.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Delivery history</p>
          {detail.deliveries.slice(0, 5).map((delivery) => (
            <div key={delivery.id ?? `${delivery.recipient}-${delivery.createdAt}`} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
              <p className="font-semibold text-slate-950">{delivery.recipient} - {labelize(delivery.status)}</p>
              <p className="text-xs text-slate-500">{delivery.format ?? "Report"} - {formatMaybeDate(delivery.sentAt ?? delivery.createdAt ?? null)}</p>
              {delivery.error ? <p className="mt-1 text-rose-700">{delivery.error}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SourcePanel({ detail }: { detail: ReportDetailResponse }) {
  const warnings = detail.sourceData.missingDataWarnings;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">Source data</h2>
      <div className="mt-3 grid gap-3">
        <SourceList label="Analytics" items={detail.sourceData.analyticsSourcesUsed} />
        <SourceList label="Strategy" items={detail.sourceData.strategySourcesUsed} />
        <SourceList label="Content plan" items={detail.sourceData.contentPlanSourcesUsed} />
        <SourceList label="Workflow" items={detail.sourceData.workflowReferencesUsed} />
      </div>
      {warnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="size-4" aria-hidden />
            Missing data
          </div>
          <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-900">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" aria-hidden /> {label}</div>;
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm font-semibold text-rose-900">Reports unavailable</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function EmptyBlock({ title, message }: { title: string; message: string }) {
  return <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-950">{title}</p><p className="mt-1 text-sm text-slate-500">{message}</p></div>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{labelize(value)}</span>;
}

function MiniState({ label, value }: { label: string; value: string }) {
  return <span className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2 py-1"><span>{label}</span><span className="font-medium text-slate-700">{labelize(value)}</span></span>;
}

function StatusCard({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><Icon className="size-4 text-slate-500" aria-hidden /><span className="min-w-0"><span className="block text-xs text-slate-500">{label}</span><span className="block text-sm font-semibold text-slate-950">{labelize(value)}</span></span></div>;
}

function SourceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{items.length ? items.join(", ") : "No source found"}</p>
    </div>
  );
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function latestExport(exports: ReportExport[], format: "PDF" | "DOCX") {
  const matching = exports.filter((item) => item.format === format);
  return matching.find((item) => item.status === "completed") ?? matching[0] ?? null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMaybeDate(value: string | null | undefined) {
  if (!value) return "Not available yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available yet";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
