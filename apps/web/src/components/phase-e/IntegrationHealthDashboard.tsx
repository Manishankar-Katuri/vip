"use client";

import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

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

export function IntegrationHealthDashboard({ integrations }: { integrations: IntegrationHealth[] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Integration Health" description="Credential, sync, failure, and rate-limit visibility for connected social and platform APIs." />
      <div className="grid gap-3">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{integration.provider} / {integration.apiName}</p>
                <p className="mt-1 text-xs text-slate-500">{integration.hospital}</p>
              </div>
              <StatusIndicator label={integration.status} tone={integration.status === "CONNECTED" ? "success" : integration.status === "DISABLED" ? "neutral" : "warning"} />
            </div>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
              <Detail label="Token expiration" value={String(integration.tokenExpiration ?? "Not recorded")} />
              <Detail label="Rate limit" value={String(integration.rateLimitRemaining ?? "Not recorded")} />
              <Detail label="Last sync" value={integration.lastSuccessfulSync ? new Date(integration.lastSuccessfulSync).toLocaleString() : "Not recorded"} />
              <Detail label="Last failure" value={integration.lastFailedSync ? new Date(integration.lastFailedSync).toLocaleString() : integration.lastError ?? "None"} />
            </div>
          </div>
        ))}
        {!integrations.length && <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No integration configs are available yet.</p>}
      </div>
    </Panel>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

