import { TrendCard, KpiGrid } from "@/components/analytics/analytics-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { adminData } from "@/demo-data/workspaces";
import { SurfaceReveal } from "@/design-system/motion";
import { ExecutionTimeline } from "@/components/workflow/workflow-surfaces";

export function AdminWorkspace() {
  return (
    <SurfaceReveal>
      <div className="space-y-5">
        {adminData.alerts.map((alert) => <AlertBanner key={alert.title} {...alert} />)}
        <KpiGrid metrics={adminData.kpis} />
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <TrendCard />
          <Panel className="p-5">
            <SectionHeader title="System oversight" description="Orchestration and intelligence services" />
            <div className="space-y-3">
              {adminData.systems.map((system) => (
                <div key={system.label} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4">
                  <p className="text-sm font-medium">{system.label}</p>
                  <StatusIndicator label={system.status} tone={system.tone} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
          <ExecutionTimeline items={adminData.activity} />
          <Panel className="p-5">
            <SectionHeader title="Hospital portfolio" description="Attention required across partner workspaces" />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Hospital</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Campaigns</th>
                    <th className="pb-3 font-medium">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Harika ENT Care", "86", "12", "Healthy"],
                    ["Eastview Women's", "73", "8", "Review"],
                    ["Silver Oak Cardiac", "81", "4", "Onboarding"],
                  ].map(([name, score, campaigns, state]) => (
                    <tr key={name}>
                      <td className="py-3 font-medium">{name}</td>
                      <td className="py-3">{score}</td>
                      <td className="py-3">{campaigns}</td>
                      <td className="py-3">
                        <StatusIndicator label={state} tone={state === "Review" ? "warning" : "success"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </SurfaceReveal>
  );
}
