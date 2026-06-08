"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function OperationalCalendar() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const schedule = useOperationalStore((state) => state.scheduleCampaign);
  const approved = campaigns.filter((item) => item.approval === "approved");
  const [dates, setDates] = useState<Record<string, string>>({});

  return (
    <Panel className="p-5">
      <SectionHeader title="Operational publishing calendar" description="Durable dates released only after clinical approval" action={<StatusIndicator label={`${approved.length} approved`} tone="success" />} />
      <div className="space-y-3">
        {approved.map((campaign) => {
          const value = dates[campaign.id] ?? campaign.scheduledFor ?? "";
          return (
            <article key={campaign.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{campaign.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-success" /> Reviewed by {campaign.reviewer ?? "clinical leadership"}
                  </p>
                </div>
                <StatusIndicator label={campaign.stage === "published" ? "Published" : "Approval-linked"} tone="success" />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-medium">
                  Publishing date and time
                  <input
                    type="datetime-local"
                    value={value}
                    disabled={campaign.stage === "published"}
                    onChange={(event) => setDates((current) => ({ ...current, [campaign.id]: event.target.value }))}
                    className="mt-2 block min-h-11 w-full rounded-lg border bg-card px-3 text-sm"
                  />
                </label>
                {campaign.stage !== "published" && (
                  <Button size="lg" disabled={!value || value === campaign.scheduledFor} onClick={() => schedule(campaign.id, value)}>
                    <CalendarClock /> Save schedule
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
