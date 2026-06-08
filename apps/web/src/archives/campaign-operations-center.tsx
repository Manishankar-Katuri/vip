"use client";

import { Archive, CalendarClock, ClipboardList, Send, Sparkles } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function CampaignOperationsCenter() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const activity = useOperationalStore((state) => state.activity);
  const active = campaigns.filter((item) => !["published"].includes(item.stage));
  const scheduled = campaigns.filter((item) => item.stage === "scheduled");
  const revisions = campaigns.filter((item) => item.approval === "revision-requested");
  const bottlenecks = campaigns.filter((item) => item.stage === "doctor-approval");
  const archive = campaigns.filter((item) => item.stage === "published");
  const adoption = campaigns.filter((item) => item.recommendation).length;

  return (
    <Panel className="p-5">
      <SectionHeader title="Campaign operations center" description="Publishing readiness, revisions and adoption accountability" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Counter icon={<ClipboardList />} label="Active tracker" value={active.length} tone="info" />
        <Counter icon={<CalendarClock />} label="Publishing queue" value={scheduled.length} tone="success" />
        <Counter icon={<Send />} label="Revision backlog" value={revisions.length} tone={revisions.length ? "warning" : "success"} />
        <Counter icon={<Archive />} label="Archive" value={archive.length} tone="neutral" />
        <Counter icon={<Sparkles />} label="AI adoption" value={`${Math.round((adoption / Math.max(campaigns.length, 1)) * 100)}%`} tone="info" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border bg-background p-4">
          <h3 className="text-sm font-semibold">Scheduled campaigns</h3>
          <div className="mt-3 space-y-2">
            {scheduled.map((campaign) => (
              <div key={campaign.id} className="flex flex-col justify-between gap-2 rounded-lg bg-muted/35 p-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">{campaign.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{campaign.scheduledFor ? displaySchedule(campaign.scheduledFor) : "Awaiting slot"}</p>
                </div>
                <StatusIndicator label="Approved to publish" tone="success" />
              </div>
            ))}
            {!scheduled.length && <p className="text-sm text-muted-foreground">No approved posts queued.</p>}
          </div>
        </section>
        <section className="rounded-xl border bg-background p-4">
          <h3 className="text-sm font-semibold">Approval bottlenecks</h3>
          <p className="mt-2 text-xs text-muted-foreground">Clinical review decisions are visible to operations leadership.</p>
          <div className="mt-3 space-y-2">
            {bottlenecks.map((campaign) => (
              <div key={campaign.id} className="rounded-lg bg-warning/10 p-3 text-sm">
                <p className="font-medium">{campaign.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{campaign.reviewer ?? "Clinical reviewer"} - awaiting decision</p>
              </div>
            ))}
            {!bottlenecks.length && <StatusIndicator label="No clinical bottlenecks" tone="success" />}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{activity.filter((item) => item.category === "approval").length} approval events retained in audit history.</p>
        </section>
      </div>
    </Panel>
  );
}

function Counter({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: "neutral" | "info" | "success" | "warning" }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <StatusIndicator label="Tracked" tone={tone} />
    </div>
  );
}

function displaySchedule(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
