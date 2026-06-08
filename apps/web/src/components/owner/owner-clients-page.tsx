"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleAlert, Loader2, RefreshCw, Search, Users } from "lucide-react";

import { OwnerShell } from "@/components/owner/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type { OwnerClient, OwnerClientListResponse, OwnerClientStatus } from "@/lib/clients/types";

export function OwnerClientsPage() {
  const [clients, setClients] = useState<OwnerClient[]>([]);
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OwnerClientStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ limit: "75" });
      if (search.trim()) query.set("search", search.trim());
      if (status !== "all") query.set("status", status);
      const data = await apiFetch<OwnerClientListResponse>(`/clients?${query.toString()}`, { cache: "no-store" });
      setClients(data.clients);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Client operations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => ({
    active: clients.filter((client) => client.status === "active").length,
    setup: clients.filter((client) => client.status === "setup_needed").length,
    attention: clients.filter((client) => client.integrationsNeedingAttentionCount || client.failedDeliveryCount || !client.recipientsCount).length,
  }), [clients]);

  return (
    <OwnerShell
      title="Clients"
      description="Canonical owner client operations for integrations, recipients, workflow schedules, approvals, and report preferences."
      actions={<Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />} Refresh</Button>}
    >
      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Users className="mt-1 size-5 text-sky-700" aria-hidden />
              <div>
                <h2 className="text-base font-semibold text-slate-950">Open a client</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Use a workspace id, slug, or client name to open setup directly. Existing recipient APIs remain available from the detail page.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="workspace id, slug, or name" />
              <Button asChild disabled={!clientId.trim()}>
                <Link href={clientId.trim() ? `/clients/${encodeURIComponent(clientId.trim())}` : "/clients"}>
                  <Search className="size-4" aria-hidden />
                  Open client
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Filters</h2>
            <div className="mt-4 grid gap-3">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" />
              <select value={status} onChange={(event) => setStatus(event.target.value as OwnerClientStatus | "all")} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="setup_needed">Setup needed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Readiness</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Metric label="Active" value={summary.active} />
              <Metric label="Setup" value={summary.setup} />
              <Metric label="Attention" value={summary.attention} />
            </div>
            <div className="mt-4 grid gap-2">
              <Button asChild variant="outline" className="justify-between"><Link href="/admin/hospitals">Legacy hospitals <ArrowUpRight className="size-4" aria-hidden /></Link></Button>
              <Button asChild variant="outline" className="justify-between"><Link href="/admin/integrations">Legacy integrations <ArrowUpRight className="size-4" aria-hidden /></Link></Button>
            </div>
          </section>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Owner clients</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Backed by Workspace records and enriched with reports, workflows, recipients, and matched hospital integration health.</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{clients.length} clients</span>
          </div>
          <div className="mt-4 grid gap-3">
            {loading ? <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Loading clients...</p> : null}
            {!loading && !clients.length ? <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No clients matched the current filters.</p> : null}
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${encodeURIComponent(client.id)}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={client.status} />
                      <h3 className="font-semibold text-slate-950">{client.name}</h3>
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-500">{client.workspaceId}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Last workflow: {client.lastWorkflowStatus ? labelize(client.lastWorkflowStatus) : "No runs yet"}{client.lastWorkflowAt ? ` at ${formatDate(client.lastWorkflowAt)}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <Chip>{client.reportsReadyCount} ready reports</Chip>
                      <Chip>{client.approvalsPendingCount} approvals</Chip>
                      <Chip>{client.recipientsCount} recipients</Chip>
                      <Chip>{client.failedDeliveryCount} failed sends</Chip>
                    </div>
                  </div>
                  <div className="min-w-[220px] rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-medium text-slate-800">
                      {client.integrationsNeedingAttentionCount ? <CircleAlert className="size-4 text-amber-600" aria-hidden /> : <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />}
                      {client.integrationsConnectedCount} connected, {client.integrationsNeedingAttentionCount} need attention
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{client.settings.workflowSchedule.enabled ? `Daily workflow at ${client.settings.workflowSchedule.timeOfDay}` : "Manual workflow start available; schedule disabled."}</p>
                    <p className="mt-3 inline-flex items-center gap-1 font-medium text-slate-800">Manage client <ArrowUpRight className="size-4" aria-hidden /></p>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-lg font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: OwnerClientStatus }) {
  const tone = status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "inactive" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${tone}`}>{labelize(status)}</span>;
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1">{children}</span>;
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
