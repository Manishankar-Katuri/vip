"use client";

import { ArrowRight } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore, type CampaignStage } from "@/state/operational-store";

const workflow: Array<{ stage: CampaignStage | "recommendation"; label: string }> = [
  { stage: "recommendation", label: "AI recommendation" },
  { stage: "review", label: "Production review" },
  { stage: "doctor-approval", label: "Doctor approval" },
  { stage: "scheduled", label: "Scheduled campaign" },
  { stage: "published", label: "Analytics tracking" },
];

export function WorkflowJourney() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const campaign = campaigns.find((item) => item.recommendation) ?? campaigns[0];
  const currentIndex = workflow.findIndex((item) => item.stage === campaign.stage);

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Connected approval workflow"
        description={`Following: ${campaign.title}`}
        action={<StatusIndicator label={campaign.approval.replace("-", " ")} tone={campaign.approval === "approved" ? "success" : "warning"} />}
      />
      <ol className="grid gap-3 lg:grid-cols-5">
        {workflow.map((item, index) => {
          const complete = index < currentIndex || campaign.stage === "published";
          const active = index === currentIndex && campaign.stage !== "published";
          return (
            <li key={item.label} className="relative rounded-xl border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step {index + 1}</p>
              <p className="mt-2 text-sm font-medium">{item.label}</p>
              <div className="mt-3">
                <StatusIndicator
                  label={complete ? "Complete" : active ? "In progress" : "Awaiting prior step"}
                  tone={complete ? "success" : active ? "warning" : "neutral"}
                />
              </div>
              {index < workflow.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 hidden size-4 text-muted-foreground lg:block" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
