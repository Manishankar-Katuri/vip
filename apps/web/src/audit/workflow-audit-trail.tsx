"use client";

import { ShieldCheck } from "lucide-react";
import type { Role } from "@/design-system/theme";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function WorkflowAuditTrail({ role }: { role: Role }) {
  const events = useOperationalStore((state) => state.activity)
    .filter((item) => item.visibleTo.includes(role) && (item.transitionTo || item.category === "recommendation"))
    .slice(0, 8);

  return (
    <Panel className="p-5">
      <SectionHeader title="Workflow audit trail" description="Attribution and status transition history" action={<ShieldCheck className="size-5 text-primary" aria-hidden />} />
      <ol className="space-y-3">
        {events.map((item) => (
          <li key={item.id} className="rounded-xl border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              {item.transitionTo && <StatusIndicator label={`${human(item.transitionFrom)} to ${human(item.transitionTo)}`} tone={item.tone} />}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{item.actor} - {formatAuditTime(item.occurredAt)}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function human(value?: string) {
  return value ? value.replaceAll("-", " ") : "created";
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
