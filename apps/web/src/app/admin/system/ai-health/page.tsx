"use client";

import { useEffect, useState } from "react";

import { AiHealthTable } from "@/components/phase-e";
import { AlertBanner, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { AiProviderHealthResult } from "@/lib/phase-e";

const healthDimensions = [
  {
    title: "Availability",
    value: "Provider uptime",
    detail: "Tracks whether each configured model can answer within the expected latency window."
  },
  {
    title: "Reliability",
    value: "Valid output",
    detail: "Checks structured responses and success rates before AI output reaches operational workflows."
  },
  {
    title: "Cost control",
    value: "Spend signal",
    detail: "Keeps token and cost telemetry visible beside quality signals, not hidden in a separate report."
  },
  {
    title: "Fallback posture",
    value: "Degraded mode",
    detail: "Separates not-configured providers from unhealthy providers so failover decisions stay clear."
  }
];

export default function AiHealthPage() {
  const [providers, setProviders] = useState<AiProviderHealthResult[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/system/ai-health", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load AI health.");
        const body = await response.json() as { providers: AiProviderHealthResult[] };
        setProviders(body.providers);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load AI health.");
      }
    }

    void load();
  }, []);

  async function runTests() {
    setRunning(true);
    try {
      const response = await fetch("/api/admin/system/ai-health", { method: "POST" });
      if (!response.ok) throw new Error("Unable to run AI tests.");
      const body = await response.json() as { providers: AiProviderHealthResult[] };
      setProviders(body.providers);
      setError(null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run AI tests.");
    } finally {
      setRunning(false);
    }
  }

  const configured = providers.filter((provider) => provider.status === "HEALTHY").length;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">System / AI Health</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">AI Health</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Provider readiness, latency, model availability, structured-output status, token usage, and cost telemetry.</p>
      </section>
      {error && <AlertBanner title="AI health unavailable" message={error} tone="danger" />}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiSurface label="Providers tracked" value={String(providers.length)} change="OpenAI, Gemini, Vertex, Anthropic" />
        <KpiSurface label="Configured providers" value={String(configured)} change={`${providers.length - configured} not configured`} tone={configured ? "success" : "warning"} />
        <KpiSurface label="Average success" value={`${Math.round(providers.reduce((sum, item) => sum + item.successRate, 0) / Math.max(1, providers.length))}%`} change="Latest checks" />
      </div>
      <Panel className="p-4">
        <SectionHeader
          title="Trust Signals"
          description="Operational AI monitoring aligned to NIST AI RMF themes: validity, reliability, transparency, and managed risk."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {healthDimensions.map((dimension) => (
            <div key={dimension.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{dimension.title}</p>
                <StatusIndicator label={dimension.value} tone="info" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{dimension.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
      <AiHealthTable providers={providers} onRun={runTests} running={running} />
    </div>
  );
}
