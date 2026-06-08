"use client";

import { RefreshCcw } from "lucide-react";

import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { AiProviderHealthResult } from "@/lib/phase-e";

export function AiHealthTable({ providers, onRun, running }: { providers: AiProviderHealthResult[]; onRun: () => void; running?: boolean }) {
  return (
    <Panel className="p-4">
      <SectionHeader
        title="AI Provider Health"
        description="Provider availability, model readiness, structured-output validity, latency, and cost metadata."
        action={
          <Button type="button" onClick={onRun} disabled={running}>
            <RefreshCcw className="size-4" aria-hidden />
            {running ? "Testing" : "Run tests"}
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => (
          <div key={`${provider.provider}-${provider.model}-${provider.checkedAt}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold capitalize text-slate-950">{provider.provider}</p>
                <p className="mt-1 text-xs text-slate-500">{provider.model}</p>
              </div>
              <StatusIndicator label={provider.status} tone={tone(provider.status)} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Latency" value={provider.latencyMs === null ? "N/A" : `${provider.latencyMs}ms`} />
              <Metric label="Success" value={`${Math.round(provider.successRate)}%`} />
              <Metric label="Cost" value={`$${provider.costEstimate.toFixed(2)}`} />
              <Metric label="Structured" value={provider.structuredOutputValid === null ? "N/A" : provider.structuredOutputValid ? "Valid" : "Invalid"} />
            </dl>
            {provider.errorMessage && <p className="mt-3 text-xs leading-5 text-slate-500">{provider.errorMessage}</p>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function tone(status: string) {
  if (status === "HEALTHY") return "success";
  if (status === "UNHEALTHY") return "danger";
  return "warning";
}

