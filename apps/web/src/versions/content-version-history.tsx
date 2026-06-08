"use client";

import { History, RotateCcw } from "lucide-react";
import { StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function ContentVersionHistory({ campaignId }: { campaignId: string }) {
  const versions = useOperationalStore((state) => state.contentVersions.filter((item) => item.campaignId === campaignId).sort((left, right) => right.version - left.version));
  return (
    <section className="rounded-xl border bg-background p-4" aria-label="Content version history">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="size-4 text-primary" /> Version history</h3>
        <StatusIndicator label={`${versions.length} revisions`} tone="neutral" />
      </div>
      <ol className="mt-4 space-y-3">
        {versions.map((version, index) => (
          <li key={version.id} className="rounded-lg bg-muted/35 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold">Version {version.version}{index === 0 ? " - Current" : ""}</p>
              <StatusIndicator label={version.approval.replace("-", " ")} tone={version.approval === "approved" ? "success" : version.approval === "pending" ? "info" : "warning"} />
            </div>
            <p className="mt-2 text-xs leading-5">{version.changedSummary}</p>
            <p className="mt-2 text-xs text-muted-foreground">{version.modifiedBy} - {formatDate(version.createdAt)}</p>
            {version.rollbackAvailable && index > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><RotateCcw className="size-3" /> Available for rollback review</p>
            )}
          </li>
        ))}
        {!versions.length && <li className="text-sm text-muted-foreground">No revisions recorded.</li>}
      </ol>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
