"use client";

import { useEffect, useState } from "react";

import { IntegrationHealthDashboard } from "@/components/phase-e";
import { AlertBanner, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

type IntegrationHealth = {
  id: string;
  hospital: string;
  provider: string;
  apiName: string;
  status: string;
  tokenExpiration: string | number | null;
  rateLimitRemaining: string | number | null;
  lastSuccessfulSync: string | null;
  lastFailedSync: string | null;
  lastError: string | null;
};

const integrationSignals = [
  {
    title: "Credential freshness",
    detail: "Token expiry, disabled connections, and missing configuration are visible before syncs fail.",
    status: "Credentials"
  },
  {
    title: "Sync reliability",
    detail: "Last success and last failure sit together so stalled integrations are easy to spot.",
    status: "Recency"
  },
  {
    title: "Rate-limit pressure",
    detail: "Remaining quota is tracked beside the API name to separate provider limits from application errors.",
    status: "Quota"
  },
  {
    title: "Incident handoff",
    detail: "Provider, hospital, and last error are grouped for quick escalation into support or status workflows.",
    status: "Handoff"
  }
];

export default function IntegrationHealthPage() {
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/integrations/health", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load integration health.");
        return response.json() as Promise<{ integrations: IntegrationHealth[] }>;
      })
      .then((body) => {
        setIntegrations(body.integrations);
        setError(null);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load integration health."));
  }, []);

  const connected = integrations.filter((integration) => integration.status === "CONNECTED").length;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Integrations / Health</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Integration Health</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Credential status, token expiry metadata, rate-limit hints, and social sync timing across all connected platforms.</p>
      </section>
      {error && <AlertBanner title="Integration health unavailable" message={error} tone="danger" />}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiSurface label="Tracked integrations" value={String(integrations.length)} change="Configured API records" />
        <KpiSurface label="Connected" value={String(connected)} change={`${integrations.length - connected} need attention`} tone={connected ? "success" : "warning"} />
        <KpiSurface label="Failures" value={String(integrations.filter((item) => item.lastFailedSync || item.lastError).length)} change="Last known errors" tone="warning" />
      </div>
      <Panel className="p-4">
        <SectionHeader
          title="Operational Signals"
          description="Integration monitoring shaped around credential hygiene, sync recency, quota pressure, and incident handoff."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {integrationSignals.map((signal) => (
            <div key={signal.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{signal.title}</p>
                <StatusIndicator label={signal.status} tone="info" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{signal.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
      <IntegrationHealthDashboard integrations={integrations} />
    </div>
  );
}
