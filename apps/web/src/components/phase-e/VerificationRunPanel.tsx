"use client";

import { RefreshCcw } from "lucide-react";

import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { PlatformReadiness } from "@/lib/phase-e";

export function VerificationRunPanel({ readiness, onRun, running }: { readiness: PlatformReadiness | null; onRun: () => void; running?: boolean }) {
  return (
    <Panel className="p-4">
      <SectionHeader
        title="Platform Verification"
        description="End-to-end verification across API, AI, database, auth, integrations, freshness, strategy generation, and PDF export."
        action={
          <Button type="button" onClick={onRun} disabled={running}>
            <RefreshCcw className="size-4" aria-hidden />
            {running ? "Running" : "Run verification"}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Overall Readiness</p>
          <p className="mt-3 text-5xl font-semibold text-slate-950">{readiness?.readinessScore ?? 0}%</p>
          <div className="mt-3">
            <StatusIndicator label={readiness?.status ?? "RUNNING"} tone={readiness?.status === "PASS" ? "success" : readiness?.status === "FAIL" ? "danger" : "warning"} />
          </div>
        </div>
        <div className="grid gap-2">
          {(readiness?.checks ?? []).map((check) => (
            <div key={check.subsystem} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{check.subsystem}</p>
                <p className="mt-1 text-xs text-slate-500">{check.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{check.score}%</span>
                <StatusIndicator label={check.status} tone={check.status === "PASS" ? "success" : check.status === "FAIL" ? "danger" : "warning"} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

