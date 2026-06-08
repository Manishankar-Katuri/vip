"use client";

import { useEffect, useState } from "react";

import { ApiAuditTable } from "@/components/phase-e";
import { AlertBanner, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { EndpointHealthResult } from "@/lib/phase-e";

const auditLanes = [
  {
    title: "Inventory coverage",
    detail: "Every handler is mapped with method, source file, owner context, auth posture, and environment exposure.",
    status: "OWASP API9"
  },
  {
    title: "Auth and tenant boundary",
    detail: "Endpoints that accept hospital, user, or workspace identifiers are flagged for object-level authorization review.",
    status: "Access risk"
  },
  {
    title: "Runtime evidence",
    detail: "Health checks capture status, response time, success rate, and which routes still need manual payload fixtures.",
    status: "Live check"
  },
  {
    title: "Remediation queue",
    detail: "Unknown, degraded, or manual-only routes become the first candidates for test fixtures and ownership cleanup.",
    status: "Next action"
  }
];

export default function ApiAuditPage() {
  const [endpoints, setEndpoints] = useState<EndpointHealthResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/system/api-audit", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load API audit.");
        const body = await response.json() as { endpoints: EndpointHealthResult[] };
        setEndpoints(body.endpoints);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load API audit.");
      }
    }

    void load();
  }, []);

  async function runValidation() {
    setRunning(true);
    try {
      const response = await fetch("/api/admin/system/api-audit", { method: "POST" });
      if (!response.ok) throw new Error("Unable to run validation.");
      const body = await response.json() as { results: EndpointHealthResult[] };
      setEndpoints(body.results);
      setError(null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run validation.");
    } finally {
      setRunning(false);
    }
  }

  const healthy = endpoints.filter((endpoint) => endpoint.status === "HEALTHY").length;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">System / API Audit</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">API Audit</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Discovered route handlers, validation readiness, health status, response timing, and source ownership.</p>
      </section>
      {error && <AlertBanner title="Audit unavailable" message={error} tone="danger" />}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiSurface label="Discovered endpoints" value={String(endpoints.length)} change="Registry scan" />
        <KpiSurface label="Healthy endpoints" value={String(healthy)} change={`${Math.round((healthy / Math.max(1, endpoints.length)) * 100)}% healthy`} tone="success" />
        <KpiSurface label="Manual fixtures" value={String(endpoints.filter((endpoint) => endpoint.responseTimeMs === null).length)} change="Needs payload/auth context" tone="warning" />
      </div>
      <Panel className="p-4">
        <SectionHeader
          title="Audit Workbench"
          description="A security-led route inventory shaped around OWASP API inventory practice, endpoint ownership, and production evidence."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {auditLanes.map((lane) => (
            <div key={lane.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{lane.title}</p>
                <StatusIndicator label={lane.status} tone={lane.status === "Access risk" ? "warning" : "info"} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{lane.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
      <ApiAuditTable endpoints={endpoints} onRun={runValidation} running={running} />
    </div>
  );
}
