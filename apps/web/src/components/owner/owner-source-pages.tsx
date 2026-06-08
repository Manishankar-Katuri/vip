"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, FileText, Loader2, RefreshCw } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { GenerateReportPanel } from "@/components/reports/report-system";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { ReportListItem, ReportListResponse, ReportType } from "@/lib/reports/types";
import { REPORT_TYPE_LABELS } from "@/lib/reports/types";
import type { WorkflowListItem, WorkflowListResponse } from "@/lib/workflows/types";

type OwnerSourcePageProps = {
  title: string;
  description: string;
  reportType?: ReportType;
  generateTitle?: string;
  generateDescription?: string;
  reportFilterTypes: ReportType[];
  languageCards: Array<{ title: string; body: string }>;
  links: Array<{ label: string; href: string; note: string }>;
  workflowMode?: "intelligence" | "default";
};

export function OwnerSourcePage({
  title,
  description,
  reportType,
  generateTitle,
  generateDescription,
  reportFilterTypes,
  languageCards,
  links,
  workflowMode = "default",
}: OwnerSourcePageProps) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportData, workflowData] = await Promise.all([
        apiFetch<ReportListResponse>("/reports?limit=30", { cache: "no-store" }),
        apiFetch<WorkflowListResponse>("/workflows?limit=8", { cache: "no-store" }),
      ]);
      setReports(reportData.reports.filter((report) => reportFilterTypes.includes(report.reportType)));
      setWorkflows(workflowData.workflows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `${title} could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [reportFilterTypes, title]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <OwnerShell
      title={title}
      description={description}
      actions={<Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button>}
    >
      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          {reportType && generateTitle && generateDescription ? (
            <GenerateReportPanel defaults={{ reportType, title: generateTitle, description: generateDescription }} />
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Preserved deeper surfaces</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">These legacy/admin views remain available for detailed operations while this page is the owner entry point.</p>
            <div className="mt-3 grid gap-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
                  <span className="flex items-center justify-between gap-2 font-semibold text-slate-950">{link.label}<ArrowUpRight className="size-4" aria-hidden /></span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{link.note}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            {languageCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title={workflowMode === "intelligence" ? "Recent workflow intelligence" : "Recent reports"} loading={loading} />
            <div className="mt-4 grid gap-3">
              {reports.length ? reports.slice(0, 6).map((report) => (
                <ReportRow key={report.id} report={report} />
              )) : <EmptyLine text={loading ? "Loading recent reports..." : "No recent matching reports yet. Generate a draft from this page when data is available."} />}
            </div>
          </section>

          {workflowMode === "intelligence" ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Workflow patterns and risks" loading={loading} />
              <div className="mt-4 grid gap-3">
                {workflows.length ? workflows.map((workflow) => (
                  <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{workflow.clientName}</p>
                        <p className="mt-1 text-sm text-slate-500">{workflow.currentStep} - {labelize(workflow.status)}</p>
                      </div>
                      <span className="text-sm text-slate-500">{workflow.errorCount} errors, {workflow.warningCount} warnings</span>
                    </div>
                  </Link>
                )) : <EmptyLine text="No workflow intelligence is available yet." />}
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </OwnerShell>
  );
}

function ReportRow({ report }: { report: ReportListItem }) {
  return (
    <Link href={`/reports/${report.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700"><FileText className="size-3.5" aria-hidden /> {REPORT_TYPE_LABELS[report.reportType]}</span>
          <h3 className="mt-3 font-semibold text-slate-950">{report.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{report.clientName} - {labelize(report.status)} - {labelize(report.approvalStatus)}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{report.summary || "No summary available."}</p>
        </div>
        <ArrowUpRight className="size-4 text-slate-500" aria-hidden />
      </div>
    </Link>
  );
}

function SectionHeader({ title, loading }: { title: string; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {loading ? <Loader2 className="size-4 animate-spin text-slate-400" aria-hidden /> : <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}

export const analyticsLanguage = [
  { title: "What changed", body: "Summarize movement in social, reviews, search, website, and lead signals without forcing the owner to inspect raw metrics." },
  { title: "Why it matters", body: "Translate performance movement into business impact: trust, patient interest, appointment momentum, and operational risk." },
  { title: "What to do next", body: "Turn the data into a short set of actions that can feed reports, strategy, and content plans." },
];

export const strategyLanguage = [
  { title: "Priority", body: "Which recommendation matters most right now for the client." },
  { title: "Reason", body: "The data or pattern that supports the recommendation." },
  { title: "Expected impact", body: "The business outcome the owner should expect if the action is approved." },
];

export const contentLanguage = [
  { title: "Opening line", body: "The first sentence or idea the doctor/staff member can use to start clearly." },
  { title: "Main message", body: "The single patient-friendly point the content should communicate." },
  { title: "Action needed", body: "Video shots needed, patient action, and doctor/staff instruction without marketing jargon." },
];

export const intelligenceLanguage = [
  { title: "Patterns", body: "Repeated signals across workflows, reports, reviews, content, and client activity." },
  { title: "Risks", body: "Failures, missing data, delivery issues, or client setup problems that can block production." },
  { title: "Opportunities", body: "Openings for better content, stronger reviews, improved search presence, or sharper strategy." },
];

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
