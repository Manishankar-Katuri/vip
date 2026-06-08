"use client";

import { Activity, RefreshCcw } from "lucide-react";

import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { EndpointHealthResult } from "@/lib/phase-e";

export function ApiAuditTable({ endpoints, onRun, running }: { endpoints: EndpointHealthResult[]; onRun: () => void; running?: boolean }) {
  return (
    <Panel className="p-4">
      <SectionHeader
        title="API Registry"
        description={`${endpoints.length} route handlers discovered across apps/web and apps/api.`}
        action={
          <Button type="button" onClick={onRun} disabled={running}>
            <RefreshCcw className="size-4" aria-hidden />
            {running ? "Running" : "Run validation"}
          </Button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">Endpoint</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Auth</th>
              <th className="py-2 pr-3">Response</th>
              <th className="py-2 pr-3">Success</th>
              <th className="py-2 pr-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {endpoints.map((endpoint) => (
              <tr key={`${endpoint.method}-${endpoint.endpoint}`} className="align-top">
                <td className="py-2 pr-3 font-medium text-slate-900">{endpoint.endpoint}</td>
                <td className="py-2 pr-3">{endpoint.method}</td>
                <td className="py-2 pr-3"><StatusIndicator label={endpoint.status} tone={tone(endpoint.status)} /></td>
                <td className="py-2 pr-3">{endpoint.authentication}</td>
                <td className="py-2 pr-3">{endpoint.responseTimeMs === null ? "Manual" : `${endpoint.responseTimeMs}ms`}</td>
                <td className="py-2 pr-3">{Math.round(endpoint.successRate)}%</td>
                <td className="py-2 pr-3 text-xs text-slate-500">{endpoint.sourceFile ?? endpoint.sourceService}</td>
              </tr>
            ))}
            {!endpoints.length && (
              <tr>
                <td className="py-8 text-center text-slate-500" colSpan={7}>
                  <Activity className="mx-auto mb-2 size-5" aria-hidden />
                  No API endpoints discovered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function tone(status: string) {
  if (status === "HEALTHY") return "success";
  if (status === "DEGRADED" || status === "UNKNOWN" || status === "NOT_CONFIGURED") return "warning";
  return "danger";
}

