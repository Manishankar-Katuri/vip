"use client";

import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { useOperationalStore } from "@/state/operational-store";

export function ExecutiveInsights({ data, role }: { data?: LiveData; role: "doctor" | "admin" }) {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const pending = campaigns.filter((campaign) => campaign.approval === "pending").length;
  const approved = campaigns.filter((campaign) => campaign.approval === "approved").length;
  const measured = data?.analytics.avgEngagementRate;

  return (
    <Panel className="border-primary/15 bg-info/25 p-5">
      <SectionHeader
        title="Executive insight engine"
        description="Assistive summaries grounded in measured signals and accountable workflow state"
        action={<StatusIndicator label="Human review expected" tone="info" />}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <Insight icon={<TrendingUp />} label="Campaign outcome" value={measured === undefined ? "Performance measurement is pending connected analytics." : `Published Instagram content averages ${percent(measured)} engagement; retain clinically approved education patterns.`} />
        <Insight icon={<ShieldCheck />} label="Operational health" value={`${approved} campaigns are approved or published; ${pending} item${pending === 1 ? "" : "s"} currently await clinical approval.`} />
        <Insight icon={<Sparkles />} label={role === "admin" ? "Growth opportunity" : "Reputation signal"} value={data?.measuredNarrative ?? "No measured reputation signal is available; decisions remain workflow-led until analytics reconnect."} />
      </div>
    </Panel>
  );
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-primary [&_svg]:size-4">
        {icon}<p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-sm leading-6">{value}</p>
    </article>
  );
}
