import { ArrowUpRight } from "lucide-react";
import { PerformanceChart } from "@/charts/performance-chart";
import type { Kpi } from "@/demo-data/workspaces";
import { KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

export function KpiGrid({ metrics, spacious = false }: { metrics: Kpi[]; spacious?: boolean }) {
  return (
    <div className={`grid gap-3 ${spacious ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
      {metrics.map((metric) => <KpiSurface key={metric.label} {...metric} />)}
    </div>
  );
}

export function TrendCard({ compact = false }: { compact?: boolean }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Reputation momentum"
        description="Trust score and inquiry activity, past 6 weeks"
        action={<StatusIndicator label="Improving" tone="success" />}
      />
      <PerformanceChart compact={compact} />
    </Panel>
  );
}

export function SummaryCard({ title, value, context }: { title: string; value: string; context: string }) {
  return (
    <Panel className="surface-hover p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-3 flex items-center gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        <ArrowUpRight className="size-4 text-success" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{context}</p>
    </Panel>
  );
}
