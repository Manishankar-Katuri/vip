"use client";

import type { Role } from "@/design-system/theme";
import { Panel, SectionHeader, StatusIndicator, TimelineItem } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function LiveActivityStream({ role, limit = 10 }: { role: Role; limit?: number }) {
  const events = useOperationalStore((state) => state.activity)
    .filter((item) => item.visibleTo.includes(role))
    .slice(0, limit);
  const groups = groupBy(events, (item) => activityDay(item.occurredAt));

  return (
    <Panel className="p-5">
      <SectionHeader title="Live activity stream" description="Shared workflow updates visible to your role" action={<StatusIndicator label="Live updates" tone="success" />} />
      <div className="space-y-5" aria-live="polite" aria-atomic="false">
        {Object.entries(groups).map(([date, items]) => (
          <section key={date} aria-label={date}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{date}</p>
            {(items ?? []).map((item) => (
              <TimelineItem key={item.id} title={item.title} meta={`${item.actor} - ${item.time}`} detail={item.description} tone={item.tone} />
            ))}
          </section>
        ))}
      </div>
    </Panel>
  );
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = keyFor(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}

function activityDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? "Today"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
