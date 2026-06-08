"use client";

import { useEffect, useState } from "react";

import { VerificationRunPanel } from "@/components/phase-e";
import { AlertBanner, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { PlatformReadiness } from "@/lib/phase-e";

const readinessGates = [
  {
    title: "Service health",
    detail: "API, database, auth, and integration checks must show usable production behavior.",
    tone: "success" as const
  },
  {
    title: "Observability",
    detail: "Freshness, failures, response time, and export outcomes are visible before release.",
    tone: "info" as const
  },
  {
    title: "Release blockers",
    detail: "Any failed critical subsystem should stay visible until ownership and recovery are confirmed.",
    tone: "warning" as const
  }
];

export default function PlatformVerificationPage() {
  const [readiness, setReadiness] = useState<PlatformReadiness | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void runVerification();
  }, []);

  async function runVerification() {
    setRunning(true);
    try {
      const response = await fetch("/api/admin/system/platform-verification", { method: "POST" });
      if (!response.ok) throw new Error("Unable to run platform verification.");
      setReadiness(await response.json() as PlatformReadiness);
      setError(null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run platform verification.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">System / Platform Verification</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Platform Verification</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">PASS, WARNING, and FAIL evidence for every Phase E subsystem and the final production readiness score.</p>
      </section>
      {error && <AlertBanner title="Verification unavailable" message={error} tone="danger" />}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiSurface label="Readiness score" value={`${readiness?.readinessScore ?? 0}%`} change={readiness?.status ?? "Running"} tone={readiness?.status === "PASS" ? "success" : readiness?.status === "FAIL" ? "danger" : "warning"} />
        <KpiSurface label="Checks executed" value={String(readiness?.checks.length ?? 0)} change="Subsystem gates" />
        <KpiSurface label="Open blockers" value={String(readiness?.checks.filter((check) => check.status === "FAIL").length ?? 0)} change="Failing checks" tone={readiness?.checks.some((check) => check.status === "FAIL") ? "danger" : "success"} />
      </div>
      <Panel className="p-4">
        <SectionHeader
          title="Production Gates"
          description="A release-readiness view inspired by SRE production readiness reviews: service health, observable evidence, and blocker ownership."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {readinessGates.map((gate) => (
            <div key={gate.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{gate.title}</p>
                <StatusIndicator label="Gate" tone={gate.tone} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{gate.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
      <VerificationRunPanel readiness={readiness} onRun={runVerification} running={running} />
    </div>
  );
}
