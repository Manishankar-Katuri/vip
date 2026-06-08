"use client";

import { Database, Radio, RotateCcw, TriangleAlert } from "lucide-react";

import { StatusIndicator } from "@/design-system/primitives";
import type { DataProvenance, DataProvenanceStatus } from "@/lib/phase-e";

const toneByStatus = {
  LIVE: "success",
  CACHED: "warning",
  STALE: "danger",
  MOCK: "neutral",
} as const;

const IconByStatus = {
  LIVE: Radio,
  CACHED: RotateCcw,
  STALE: TriangleAlert,
  MOCK: Database,
};

export function FreshnessBadge({ provenance }: { provenance: DataProvenance | null | undefined }) {
  const normalized = provenance ?? unknownProvenance();
  const Icon = IconByStatus[normalized.status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5" aria-hidden />
      <StatusIndicator label={`${normalized.status} · ${relativeAge(normalized.cacheAgeSeconds)}`} tone={toneByStatus[normalized.status]} />
    </span>
  );
}

function unknownProvenance(): DataProvenance {
  return {
    source: "unknown",
    sourceService: "unknown",
    fetchedAt: new Date(0).toISOString(),
    cacheAgeSeconds: 0,
    freshnessScore: 0,
    status: "MOCK" satisfies DataProvenanceStatus,
    recordCount: 0,
    apiCalled: null,
    lastSuccessfulSyncAt: null,
    metadata: {},
  };
}

function relativeAge(seconds: number) {
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr ago`;
  return `${Math.round(seconds / 86400)} days ago`;
}

