"use client";

import { UsersRound } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function WorkflowParticipants() {
  const campaigns = useOperationalStore((state) => state.campaigns).filter((item) => item.stage !== "published").slice(0, 4);

  return (
    <Panel className="p-5">
      <SectionHeader title="Collaborative ownership" description="Assigned reviewers and workflow participants" action={<UsersRound className="size-5 text-primary" aria-hidden />} />
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-xl border bg-background p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-sm font-medium">{campaign.title}</p>
              <StatusIndicator label={participantStatus(campaign.stage)} tone={campaign.stage === "doctor-approval" ? "warning" : "info"} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Owned by {campaign.owner}{campaign.reviewer ? ` - Reviewed by ${campaign.reviewer}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Workflow participants">
              {campaign.participants.map((participant) => (
                <span key={participant} className="rounded-full border bg-muted/45 px-2 py-1 text-xs capitalize">{participant}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function participantStatus(stage: string) {
  if (stage === "doctor-approval") return "Waiting on doctor approval";
  if (stage === "review") return "Updated by production";
  if (stage === "scheduled") return "Reviewed and scheduled";
  return "Production owner assigned";
}
