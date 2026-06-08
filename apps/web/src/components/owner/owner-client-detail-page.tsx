"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleAlert, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type {
  ClientSettingsPatch,
  OwnerClientDetailResponse,
  ReportPreferenceSettings,
  WorkflowScheduleSettings,
} from "@/lib/clients/types";
import { ALL_REPORT_TYPES } from "@/lib/clients/types";
import type { ReportRecipient } from "@/lib/reports/types";

export function OwnerClientDetailPage({ clientId }: { clientId: string }) {
  const [detail, setDetail] = useState<OwnerClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recipientForm, setRecipientForm] = useState({ name: "", email: "", role: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiFetch<OwnerClientDetailResponse>(`/clients/${encodeURIComponent(clientId)}`, { cache: "no-store" });
      setDetail(result);
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : "Unable to load client.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const client = detail?.client;
  const enabledRecipients = useMemo(() => detail?.recipients.filter((recipient) => recipient.receivesReports).length ?? 0, [detail]);

  async function patchClient(section: string, patch: ClientSettingsPatch) {
    setSavingSection(section);
    setMessage(null);
    try {
      const result = await apiFetch<OwnerClientDetailResponse>(`/clients/${encodeURIComponent(clientId)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setDetail(result);
      setMessage("Client settings saved.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save client settings.");
    } finally {
      setSavingSection(null);
    }
  }

  async function addRecipient() {
    setSavingSection("recipient");
    setMessage(null);
    try {
      await apiFetch(`/clients/${encodeURIComponent(clientId)}/recipients`, {
        method: "POST",
        body: JSON.stringify({ ...recipientForm, receivesReports: true }),
      });
      setRecipientForm({ name: "", email: "", role: "" });
      await load();
      setMessage("Recipient saved.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save recipient.");
    } finally {
      setSavingSection(null);
    }
  }

  async function toggleRecipient(recipient: ReportRecipient) {
    setSavingSection(recipient.id);
    await apiFetch(`/clients/${encodeURIComponent(clientId)}/recipients/${recipient.id}`, {
      method: "PATCH",
      body: JSON.stringify({ receivesReports: !recipient.receivesReports }),
    });
    await load();
    setSavingSection(null);
  }

  async function deleteRecipient(recipient: ReportRecipient) {
    setSavingSection(recipient.id);
    await apiFetch(`/clients/${encodeURIComponent(clientId)}/recipients/${recipient.id}`, { method: "DELETE" });
    await load();
    setSavingSection(null);
  }

  return (
    <OwnerShell
      title={client?.name ?? `Client ${clientId}`}
      description="Client readiness, integration health, recipients, workflow schedule, approval policy, and report preferences."
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/clients">All clients</Link></Button><Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button></div>}
    >
      {message ? <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">{message}</div> : null}
      {loading && !detail ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Loading client...</div> : null}
      {client ? (
        <div className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{labelize(client.status)}</span>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">{client.name}</h2>
                <p className="mt-1 break-all text-sm text-slate-500">{client.workspaceId}{client.hospitalId ? ` / hospital ${client.hospitalId}` : ""}</p>
                <p className="mt-2 text-sm text-slate-600">{client.businessType ?? "Business type not set"}{client.location ? ` - ${client.location}` : ""} - {client.timezone}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Recipients" value={enabledRecipients} />
                <Metric label="Ready reports" value={client.reportsReadyCount} />
                <Metric label="Approvals" value={client.approvalsPendingCount} />
                <Metric label="Failed sends" value={client.failedDeliveryCount} />
              </div>
            </div>
            {detail.setupWarnings.length ? (
              <div className="mt-4 grid gap-2">
                {detail.setupWarnings.map((warning) => <p key={warning} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{warning}</p>)}
              </div>
            ) : <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Client setup has no immediate warnings.</p>}
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div className="grid gap-5">
              <ClientProfileCard client={client} saving={savingSection === "profile"} onSave={(patch) => void patchClient("profile", patch)} />
              <WorkflowScheduleCard settings={client.settings.workflowSchedule} saving={savingSection === "workflow"} onSave={(workflowSchedule) => void patchClient("workflow", { workflowSchedule })} />
              <ApprovalPolicyCard settings={client.settings.approvalPolicy} saving={savingSection === "approval"} onSave={(approvalPolicy) => void patchClient("approval", { approvalPolicy })} />
              <ReportPreferencesCard settings={client.settings.reportPreferences} saving={savingSection === "reports"} onSave={(reportPreferences) => void patchClient("reports", { reportPreferences })} />
              <RecipientPanel
                recipients={detail.recipients}
                form={recipientForm}
                savingSection={savingSection}
                setForm={setRecipientForm}
                addRecipient={() => void addRecipient()}
                toggleRecipient={(recipient) => void toggleRecipient(recipient)}
                deleteRecipient={(recipient) => void deleteRecipient(recipient)}
              />
            </div>
            <aside className="grid content-start gap-5">
              <IntegrationHealthPanel detail={detail} />
              <RecentActivityPanel detail={detail} />
            </aside>
          </div>
        </div>
      ) : null}
    </OwnerShell>
  );
}

function ClientProfileCard({ client, saving, onSave }: { client: OwnerClientDetailResponse["client"]; saving: boolean; onSave: (patch: ClientSettingsPatch) => void }) {
  const [status, setStatus] = useState(client.status);
  const [businessType, setBusinessType] = useState(client.businessType ?? "");
  const [location, setLocation] = useState(client.location ?? "");
  const [timezone, setTimezone] = useState(client.timezone);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Client profile</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
          <option value="active">Active</option>
          <option value="setup_needed">Setup needed</option>
          <option value="inactive">Inactive</option>
        </select>
        <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone" />
        <Input value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Business type" />
        <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
      </div>
      <Button type="button" className="mt-4" onClick={() => onSave({ status, businessType, location, timezone })} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save profile
      </Button>
    </section>
  );
}

function WorkflowScheduleCard({ settings, saving, onSave }: { settings: WorkflowScheduleSettings; saving: boolean; onSave: (settings: Partial<WorkflowScheduleSettings>) => void }) {
  const [draft, setDraft] = useState(settings);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Daily workflow schedule</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /> Schedule enabled</label>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={draft.manualStartAllowed} onChange={(event) => setDraft({ ...draft, manualStartAllowed: event.target.checked })} /> Manual start allowed</label>
        <Input type="time" value={draft.timeOfDay} onChange={(event) => setDraft({ ...draft, timeOfDay: event.target.value })} />
        <Input value={draft.timezone} onChange={(event) => setDraft({ ...draft, timezone: event.target.value })} />
      </div>
      <Button type="button" className="mt-4" onClick={() => onSave(draft)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save schedule</Button>
    </section>
  );
}

function ApprovalPolicyCard({ settings, saving, onSave }: { settings: { manualApprovalRequired: boolean; autoSendEnabled: false; allowedReportTypes: string[]; defaultApprovalNotes?: string | null }; saving: boolean; onSave: (settings: Record<string, unknown>) => void }) {
  const [allowedReportTypes, setAllowedReportTypes] = useState(settings.allowedReportTypes);
  const [defaultApprovalNotes, setDefaultApprovalNotes] = useState(settings.defaultApprovalNotes ?? "");
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Approval policy</h2>
      <div className="mt-4 grid gap-3">
        <label className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><input type="checkbox" checked readOnly /> Manual approval required</label>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"><input type="checkbox" checked={false} readOnly /> Automatic sending disabled</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_REPORT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={allowedReportTypes.includes(type)} onChange={(event) => setAllowedReportTypes(event.target.checked ? [...allowedReportTypes, type] : allowedReportTypes.filter((item) => item !== type))} />
              {labelize(type)}
            </label>
          ))}
        </div>
        <Input value={defaultApprovalNotes} onChange={(event) => setDefaultApprovalNotes(event.target.value)} placeholder="Default approval note" />
      </div>
      <Button type="button" className="mt-4" onClick={() => onSave({ manualApprovalRequired: true, autoSendEnabled: false, allowedReportTypes, defaultApprovalNotes })} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save approval policy</Button>
    </section>
  );
}

function ReportPreferencesCard({ settings, saving, onSave }: { settings: ReportPreferenceSettings; saving: boolean; onSave: (settings: Partial<ReportPreferenceSettings>) => void }) {
  const [draft, setDraft] = useState(settings);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Report preferences</h2>
      <div className="mt-4 grid gap-3">
        <select value={draft.defaultFormats} onChange={(event) => setDraft({ ...draft, defaultFormats: event.target.value as ReportPreferenceSettings["defaultFormats"] })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
          <option value="BOTH">PDF and DOCX</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_REPORT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={draft.defaultReportTypes.includes(type)} onChange={(event) => setDraft({ ...draft, defaultReportTypes: event.target.checked ? [...draft.defaultReportTypes, type] : draft.defaultReportTypes.filter((item) => item !== type) })} />
              {labelize(type)}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={draft.includeMissingDataWarnings} onChange={(event) => setDraft({ ...draft, includeMissingDataWarnings: event.target.checked })} /> Include missing data warnings</label>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={draft.clientFriendlyLanguage} onChange={(event) => setDraft({ ...draft, clientFriendlyLanguage: event.target.checked })} /> Use client-friendly language</label>
      </div>
      <Button type="button" className="mt-4" onClick={() => onSave(draft)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save report preferences</Button>
    </section>
  );
}

function RecipientPanel(props: {
  recipients: ReportRecipient[];
  form: { name: string; email: string; role: string };
  savingSection: string | null;
  setForm: (form: { name: string; email: string; role: string }) => void;
  addRecipient: () => void;
  toggleRecipient: (recipient: ReportRecipient) => void;
  deleteRecipient: (recipient: ReportRecipient) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Report recipients</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input value={props.form.name} onChange={(event) => props.setForm({ ...props.form, name: event.target.value })} placeholder="Name" />
        <Input value={props.form.email} onChange={(event) => props.setForm({ ...props.form, email: event.target.value })} placeholder="email@example.com" />
        <Input value={props.form.role} onChange={(event) => props.setForm({ ...props.form, role: event.target.value })} placeholder="Role" />
        <Button type="button" onClick={props.addRecipient} disabled={props.savingSection === "recipient" || !props.form.email.trim()}>{props.savingSection === "recipient" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Add</Button>
      </div>
      <div className="mt-4 grid gap-3">
        {!props.recipients.length ? <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No recipients saved yet.</p> : null}
        {props.recipients.map((recipient) => (
          <div key={recipient.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{recipient.name}</p>
                <p className="text-sm text-slate-500">{recipient.email}{recipient.role ? ` - ${recipient.role}` : ""}</p>
                <p className="mt-1 text-xs text-slate-500">{recipient.receivesReports ? "Receives reports" : "Disabled for reports"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => props.toggleRecipient(recipient)} disabled={props.savingSection === recipient.id}>{recipient.receivesReports ? "Disable" : "Enable"}</Button>
                <Button type="button" variant="outline" onClick={() => props.deleteRecipient(recipient)} disabled={props.savingSection === recipient.id}><Trash2 className="size-4" aria-hidden /> Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationHealthPanel({ detail }: { detail: OwnerClientDetailResponse }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Integration health</h2>
      <div className="mt-4 grid gap-3">
        {detail.integrationHealth.map((item) => (
          <div key={item.provider} className="rounded-lg border border-slate-200 p-3">
            <p className="flex items-center gap-2 font-medium text-slate-950">
              {item.status === "connected" ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> : <CircleAlert className="size-4 text-amber-600" aria-hidden />}
              {item.label}
            </p>
            <p className="mt-1 text-sm text-slate-600">{labelize(item.status)}</p>
            {item.issue ? <p className="mt-1 text-xs text-slate-500">{item.issue}</p> : null}
            <p className="mt-2 text-xs text-slate-500">{item.actionRequired}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivityPanel({ detail }: { detail: OwnerClientDetailResponse }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Recent activity</h2>
      <div className="mt-4 grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Workflows</h3>
          <div className="mt-2 grid gap-2">
            {detail.recentWorkflows.slice(0, 4).map((workflow) => (
              <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
                <span className="font-medium text-slate-900">{labelize(workflow.status)}</span>
                <span className="block text-xs text-slate-500">{workflow.currentStep}</span>
              </Link>
            ))}
            {!detail.recentWorkflows.length ? <p className="text-sm text-slate-500">No workflow runs yet.</p> : null}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Reports</h3>
          <div className="mt-2 grid gap-2">
            {detail.recentReports.slice(0, 4).map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`} className="rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50">
                <span className="font-medium text-slate-900">{report.title}</span>
                <span className="block text-xs text-slate-500">{labelize(report.approvalStatus)} - {labelize(report.sentStatus)}</span>
              </Link>
            ))}
            {!detail.recentReports.length ? <p className="text-sm text-slate-500">No reports yet.</p> : null}
          </div>
        </div>
        <Button asChild variant="outline" className="justify-between"><Link href="/admin/integrations">Open legacy integrations <ArrowUpRight className="size-4" aria-hidden /></Link></Button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-lg font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
