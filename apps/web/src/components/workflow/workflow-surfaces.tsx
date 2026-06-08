import { RotateCcw } from "lucide-react";
import type { Activity, Approval } from "@/demo-data/workspaces";
import { Button, DetailDisclosure, Panel, SectionHeader, StatusIndicator, TimelineItem } from "@/design-system/primitives";

export function ApprovalQueue({ approvals, minimal = false }: { approvals: Approval[]; minimal?: boolean }) {
  return (
    <Panel className="p-4">
      <SectionHeader
        title={minimal ? "Your approvals" : "Approval queue"}
        description={minimal ? "Only decisions needing clinical input" : "Items waiting for review"}
      />
      <div className="space-y-2">
        {approvals.map((item) => (
          <div key={item.title} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <DetailDisclosure label="Owner" className="mt-2">{item.owner}</DetailDisclosure>
              </div>
              <StatusIndicator label={item.due} tone={item.risk} />
            </div>
            {minimal && (
              <div className="mt-4 flex gap-2">
                <Button size="lg">Approve</Button>
                <Button size="lg" variant="outline">Review</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ExecutionTimeline({ items }: { items: Activity[] }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Execution timeline" description="Live workflow activity" />
      <div>
        {items.map((item) => <TimelineItem key={item.title} {...item} />)}
      </div>
    </Panel>
  );
}

export function AutomationStatus() {
  return (
    <Panel className="p-4">
      <SectionHeader title="Automation status" description="Campaign delivery services" />
      <div className="space-y-3">
        <StatusRow name="Approval reminders" state="Running" tone="success" />
        <StatusRow name="Review response sync" state="Retry queued" tone="warning" retry />
        <StatusRow name="Performance summaries" state="Running" tone="success" />
      </div>
    </Panel>
  );
}

function StatusRow({ name, state, tone, retry }: { name: string; state: string; tone: "success" | "warning"; retry?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3">
      <p className="text-sm font-medium">{name}</p>
      <div className="flex items-center gap-2">
        {retry && <RotateCcw className="size-3.5 text-warning-foreground" aria-label="Retry scheduled" />}
        <StatusIndicator label={state} tone={tone} />
      </div>
    </div>
  );
}
