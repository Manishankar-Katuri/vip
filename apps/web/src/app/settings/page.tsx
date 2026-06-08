import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleAlert, Database, FileText, Mail, ServerCog, ShieldCheck } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { buildProductionReadiness, type ReadinessStatus } from "@/lib/system";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const readiness = await buildProductionReadiness();

  return (
    <OwnerShell
      title="Settings"
      description="Production readiness for deployment, database access, report delivery, generated file storage, workflow operation, and tenant safety."
    >
      <div className="grid gap-5">
        <section className={`rounded-lg border p-5 shadow-sm ${statusPanel(readiness.status)}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">{labelize(readiness.status)}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Production readiness</h2>
              <p className="mt-2 text-sm text-slate-600">Last checked {formatDate(readiness.checkedAt)}. Checks use presence and connectivity only; no secret values are displayed.</p>
            </div>
            <Button asChild variant="outline"><Link href="/api/system/readiness">Open readiness JSON</Link></Button>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <section className="grid gap-4">
            <ReadinessCard
              icon={Database}
              title="Database"
              status={readiness.database.status}
              items={[
                { label: "Connection", value: readiness.database.reachable ? "Reachable" : "Blocked", ok: readiness.database.reachable },
                ...readiness.database.requiredModels.map((model) => ({ label: model.name, value: model.available ? "Queryable" : "Not queryable", ok: model.available })),
              ]}
              note={readiness.database.error}
            />
            <ReadinessCard
              icon={Mail}
              title="Email sending"
              status={readiness.email.status}
              items={[
                { label: "Provider", value: readiness.email.provider === "resend" ? "Resend" : "Disabled", ok: readiness.email.enabled },
                { label: "Required email config", value: readiness.email.requiredConfigPresent ? "Present" : "Missing or disabled", ok: readiness.email.requiredConfigPresent },
                { label: "From email", value: readiness.email.fromEmailConfigured ? "Configured" : "Missing", ok: readiness.email.fromEmailConfigured },
              ]}
              note={readiness.email.enabled ? "No test email is sent by readiness checks." : "Email sending is disabled; export and manual download remain available."}
            />
            <ReadinessCard
              icon={FileText}
              title="Report storage"
              status={readiness.reports.status}
              items={[
                { label: "Generated reports path", value: readiness.reports.generatedReportsPath, ok: readiness.reports.writable },
                { label: "Writable", value: readiness.reports.writable ? "Writable" : "Not writable", ok: readiness.reports.writable },
                { label: "Public URL path", value: readiness.reports.publicUrlAvailable ? "/generated/reports" : "Unavailable", ok: readiness.reports.publicUrlAvailable },
              ]}
              note={readiness.reports.productionStorageWarning ? "Local filesystem storage may not persist in serverless or container deployments." : undefined}
            />
            <ReadinessCard
              icon={ServerCog}
              title="Workflow scheduling"
              status={readiness.workflows.status}
              items={[
                { label: "Manual start API", value: readiness.workflows.manualStartAvailable ? "Available" : "Unavailable", ok: readiness.workflows.manualStartAvailable },
                { label: "Client schedule settings", value: readiness.workflows.scheduleSettingsStored ? "Stored" : "Model not queryable", ok: readiness.workflows.scheduleSettingsStored },
                { label: "Automatic scheduler", value: readiness.workflows.schedulerExecutionConfigured ? "Configured" : "Not configured", ok: readiness.workflows.schedulerExecutionConfigured },
              ]}
              note={readiness.workflows.note}
            />
            <ReadinessCard
              icon={ShieldCheck}
              title="Security guardrails"
              status="ready"
              items={[
                { label: "Manual approval", value: readiness.security.manualApprovalRequired ? "Required" : "Not enforced", ok: readiness.security.manualApprovalRequired },
                { label: "Auto-send", value: readiness.security.autoSendDisabled ? "Disabled" : "Enabled", ok: readiness.security.autoSendDisabled },
                { label: "Tenant checks", value: readiness.security.tenantChecksPresent ? "Present" : "Missing", ok: readiness.security.tenantChecksPresent },
                { label: "Secret leak check", value: readiness.security.secretLeakCheck, ok: readiness.security.secretLeakCheck === "safe" },
              ]}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Environment checklist</h2>
              <div className="mt-4 grid gap-2">
                {[...readiness.environment.required, ...readiness.environment.optional].map((item) => (
                  <div key={item.name} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.required ? "Required" : item.severity === "warning" ? "Recommended" : "Optional"}</p>
                      </div>
                      {item.configured ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> : <AlertTriangle className={item.required ? "size-4 text-rose-600" : "size-4 text-amber-600"} aria-hidden />}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Recommendations</h2>
              <div className="mt-4 grid gap-2">
                {readiness.recommendations.length ? readiness.recommendations.map((recommendation) => (
                  <p key={recommendation} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{recommendation}</p>
                )) : <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">No readiness recommendations are open.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Operational links</h2>
              <div className="mt-4 grid gap-2">
                <Button asChild variant="outline" className="justify-between"><Link href="/overview">Overview</Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link href="/workflows">Workflows</Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link href="/reports">Reports</Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link href="/clients">Clients</Link></Button>
                <Button asChild variant="outline" className="justify-between"><Link href="/admin/system/platform-verification">Legacy platform verification</Link></Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </OwnerShell>
  );
}

function ReadinessCard({
  icon: Icon,
  title,
  status,
  items,
  note,
}: {
  icon: typeof Database;
  title: string;
  status: ReadinessStatus;
  items: Array<{ label: string; value: string; ok: boolean }>;
  note?: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-sky-700" aria-hidden />
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        </div>
        <StatusBadge status={status} />
      </div>
      {note ? <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{note}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{item.label}</p>
              {item.ok ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> : <CircleAlert className="size-4 text-amber-600" aria-hidden />}
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: ReadinessStatus }) {
  const tone = status === "ready" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "blocked" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${tone}`}>{labelize(status)}</span>;
}

function statusPanel(status: ReadinessStatus) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50";
  if (status === "blocked") return "border-rose-200 bg-rose-50";
  return "border-amber-200 bg-amber-50";
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
