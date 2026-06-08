"use client";

import { Building2 } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { useOperationalStore } from "@/state/operational-store";

export function ComparativeIntelligence({ data }: { data?: LiveData }) {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const harikaEfficiency = Math.round((campaigns.filter((item) => item.approval === "approved").length / Math.max(campaigns.length, 1)) * 100);
  const comparisons = [
    { name: data?.workspaceName ?? "Harika ENT Care Network", engagement: data ? percent(data.analytics.avgEngagementRate) : "Pending", growth: data?.analytics.followerGrowth.available ? `${data.analytics.followerGrowth.percentageChange.toFixed(1)}%` : "N/A", efficiency: `${harikaEfficiency}%`, effect: "Measured", tone: "success" as const },
    { name: "Eastview Women's Hospital", engagement: "4.08%", growth: "+2.1%", efficiency: "61%", effect: "Review needed", tone: "warning" as const },
    { name: "Silver Oak Cardiac Centre", engagement: "3.74%", growth: "+4.9%", efficiency: "82%", effect: "Stable", tone: "info" as const },
  ];
  return (
    <Panel className="p-5 report-block">
      <SectionHeader title="Comparative intelligence" description="Portfolio ranking and approval efficiency for administrative review" />
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-left text-sm">
          <caption className="sr-only">Hospital engagement, growth, approval efficiency and campaign effectiveness ranking</caption>
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="pb-3 font-medium">Hospital</th><th className="pb-3 font-medium">Engagement</th><th className="pb-3 font-medium">Growth</th><th className="pb-3 font-medium">Approval efficiency</th><th className="pb-3 font-medium">Effectiveness</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisons.map((row, index) => (
              <tr key={row.name}>
                <td className="py-3 font-medium"><span className="mr-2 text-xs text-muted-foreground">#{index + 1}</span><Building2 className="mr-2 inline size-4 text-primary" />{row.name}</td>
                <td className="py-3">{row.engagement}</td>
                <td className="py-3">{row.growth}</td>
                <td className="py-3">{row.efficiency}</td>
                <td className="py-3"><StatusIndicator label={row.effect} tone={row.tone} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Connected workspace metrics are measured where available. Peer rows are operational comparison benchmarks for portfolio planning.</p>
    </Panel>
  );
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}
