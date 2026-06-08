"use client";

import { Panel, SectionHeader, TimelineItem } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function OperationalTimeline({ limit = 6 }: { limit?: number }) {
  const activity = useOperationalStore((state) => state.activity);
  const items = activity.slice(0, limit);

  return (
    <Panel className="p-5">
      <SectionHeader title="Operational activity" description="Approval, publishing and automation events" />
      <div aria-live="polite">
        {items.map((item) => (
          <TimelineItem
            key={item.id}
            title={item.title}
            meta={`${item.actor} - ${item.time}`}
            detail={item.description}
            tone={item.tone}
          />
        ))}
      </div>
    </Panel>
  );
}
