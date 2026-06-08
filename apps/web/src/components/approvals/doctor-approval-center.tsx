"use client";

import { Check, RefreshCcw, X } from "lucide-react";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

type RecommendationInput = { title: string; narrative: string; confidence: number };

export function DoctorApprovalCenter({ recommendations = [] }: { recommendations?: RecommendationInput[] }) {
  const allCampaigns = useOperationalStore((state) => state.campaigns);
  const campaigns = allCampaigns.filter((item) => item.stage === "doctor-approval");
  const decideCampaign = useOperationalStore((state) => state.decideCampaign);
  const decideStrategy = useOperationalStore((state) => state.decideStrategy);
  const statuses = useOperationalStore((state) => state.recommendationStatus);
  const strategy = recommendations[0];

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <SectionHeader
          title="Clinical approval queue"
          description="Decisions required before patient-facing publication"
          action={<StatusIndicator label={`${campaigns.length} pending`} tone={campaigns.length ? "warning" : "success"} />}
        />
        <div className="space-y-3" aria-live="polite">
          {!campaigns.length && <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No campaigns currently require clinical approval.</div>}
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{campaign.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{campaign.channel} - {campaign.clinicalRisk}</p>
                </div>
                <StatusIndicator label="Awaiting decision" tone="warning" />
              </div>
              <p className="mt-3 rounded-lg bg-muted/55 p-3 text-sm leading-6">{campaign.caption}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Production note: {campaign.strategyNote}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="lg" onClick={() => decideCampaign(campaign.id, "approve")}><Check /> Approve</Button>
                <Button size="lg" variant="outline" onClick={() => decideCampaign(campaign.id, "revision")}><RefreshCcw /> Request revision</Button>
                <Button size="lg" variant="destructive" onClick={() => decideCampaign(campaign.id, "reject")}><X /> Reject</Button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      {strategy && (
        <Panel className="p-5">
          <SectionHeader title="Strategy decision" description="AI proposals remain subject to leadership judgment" />
          <article className="rounded-xl border border-primary/15 bg-info/30 p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <p className="text-sm font-semibold">{strategy.title}</p>
              <StatusIndicator label={`${strategy.confidence}% confidence`} tone="info" />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{strategy.narrative}</p>
            {statuses[strategy.title] ? (
              <div className="mt-3">
                <StatusIndicator
                  label={statuses[strategy.title] === "applied" ? "Strategy approved" : "Recommendation rejected"}
                  tone={statuses[strategy.title] === "applied" ? "success" : "warning"}
                />
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="lg" onClick={() => decideStrategy(strategy.title, "approve")}><Check /> Approve strategy</Button>
                <Button size="lg" variant="outline" onClick={() => decideStrategy(strategy.title, "reject")}><X /> Reject AI recommendation</Button>
              </div>
            )}
          </article>
        </Panel>
      )}
    </div>
  );
}
