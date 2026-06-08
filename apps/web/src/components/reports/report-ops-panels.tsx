"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type { ReportListItem, ReportListResponse, ReportRecipient } from "@/lib/reports/types";

export function ReportApprovalsQueue() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<ReportListResponse>("/reports?limit=100", { cache: "no-store" });
      setReports(result.reports.sort((left, right) => approvalRank(left.approvalStatus) - approvalRank(right.approvalStatus)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <OwnerShell
      title="Approvals"
      description="Review report approvals before exported reports can be sent to clients."
      actions={<Button type="button" variant="outline" onClick={loadReports} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button>}
    >
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Report approvals</h2>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading approvals...</p> : null}
        {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        {!loading && !error && !reports.length ? <p className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No report drafts found yet.</p> : null}
        <div className="mt-4 grid gap-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{labelize(report.approvalStatus)}</span>
                  <h3 className="mt-3 text-base font-semibold text-slate-950">{report.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{report.clientName} - {labelize(report.status)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">Open report <ArrowUpRight className="size-4" aria-hidden /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </OwnerShell>
  );
}

export function ClientRecipientsPage({ clientId }: { clientId: string }) {
  const [recipients, setRecipients] = useState<ReportRecipient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiFetch<{ recipients: ReportRecipient[] }>(`/clients/${clientId}/recipients`, { cache: "no-store" });
      setRecipients(result.recipients);
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : "Unable to load recipients.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadRecipients();
  }, [loadRecipients]);

  async function addRecipient() {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/clients/${clientId}/recipients`, {
        method: "POST",
        body: JSON.stringify({ name, email, role, receivesReports: true }),
      });
      setName("");
      setEmail("");
      setRole("");
      await loadRecipients();
      setMessage("Recipient saved.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save recipient.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRecipient(recipient: ReportRecipient) {
    await apiFetch(`/clients/${clientId}/recipients/${recipient.id}`, {
      method: "PATCH",
      body: JSON.stringify({ receivesReports: !recipient.receivesReports }),
    });
    await loadRecipients();
  }

  async function deleteRecipient(recipient: ReportRecipient) {
    await apiFetch(`/clients/${clientId}/recipients/${recipient.id}`, { method: "DELETE" });
    await loadRecipients();
  }

  return (
    <OwnerShell
      title={`Client ${clientId}`}
      description="Manage report recipients for this client/workspace. Reports are only sent after explicit owner approval and send action."
      actions={<Button asChild variant="outline"><Link href="/clients">All clients</Link></Button>}
    >
      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Add report recipient</h2>
          <div className="mt-4 grid gap-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" />
            <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role (optional)" />
            <Button type="button" onClick={addRecipient} disabled={saving || !email.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              Add recipient
            </Button>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Report recipients</h2>
          {loading ? <p className="mt-4 text-sm text-slate-500">Loading recipients...</p> : null}
          {!loading && !recipients.length ? <p className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No recipients saved yet.</p> : null}
          <div className="mt-4 grid gap-3">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{recipient.name}</p>
                    <p className="text-sm text-slate-500">{recipient.email}{recipient.role ? ` - ${recipient.role}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-500">{recipient.receivesReports ? "Receives reports" : "Disabled for reports"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => void toggleRecipient(recipient)}>{recipient.receivesReports ? "Disable" : "Enable"}</Button>
                    <Button type="button" variant="outline" onClick={() => void deleteRecipient(recipient)}><Trash2 className="size-4" aria-hidden /> Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </OwnerShell>
  );
}

function approvalRank(status: string) {
  if (status === "pending") return 0;
  if (status === "changes_requested") return 1;
  if (status === "not_requested") return 2;
  if (status === "approved") return 3;
  if (status === "rejected") return 4;
  return 5;
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
