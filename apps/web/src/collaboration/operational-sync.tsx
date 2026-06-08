"use client";

import { useEffect } from "react";
import { Radio } from "lucide-react";
import { StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function OperationalSyncProvider() {
  const hydrate = useOperationalStore((state) => state.hydrate);
  const setSyncStatus = useOperationalStore((state) => state.setSyncStatus);

  useEffect(() => {
    void hydrate();
    const events = new EventSource("/api/operations/events");
    events.addEventListener("connected", () => setSyncStatus("live"));
    events.addEventListener("workflow-update", () => void hydrate());
    events.onerror = () => setSyncStatus("reconnecting");
    return () => events.close();
  }, [hydrate, setSyncStatus]);

  return null;
}

export function LiveStatus() {
  const status = useOperationalStore((state) => state.syncStatus);
  const label = status === "live" ? "Live" : status === "offline" ? "Offline draft" : status === "reconnecting" ? "Reconnecting" : "Connecting";
  const tone = status === "live" ? "success" : status === "offline" ? "warning" : "info";
  return (
    <div className="hidden items-center gap-2 md:flex" role="status" aria-live="polite">
      <Radio className="size-3.5 text-primary" aria-hidden />
      <StatusIndicator label={label} tone={tone} />
    </div>
  );
}
