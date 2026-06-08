"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RefreshCw } from "lucide-react";

import { Button } from "@/design-system/primitives";

export function RunDailyGrowthMissionButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      await fetch(`/api/admin/workspaces/${workspaceId}/daily-growth-mission/run`, { method: "POST" });
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button onClick={run} disabled={running} size="lg">
      {running ? <RefreshCw className="mr-2 size-4 animate-spin" aria-hidden /> : <Play className="mr-2 size-4" aria-hidden />}
      Run mission
    </Button>
  );
}
