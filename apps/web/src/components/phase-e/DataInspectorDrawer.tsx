"use client";

import { Info } from "lucide-react";

import { Button, Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/design-system/primitives";
import type { DataProvenance } from "@/lib/phase-e";

export function DataInspectorDrawer({ provenance }: { provenance: DataProvenance | null | undefined }) {
  const data = provenance ?? {
    source: "unknown",
    sourceService: "unknown",
    fetchedAt: new Date(0).toISOString(),
    cacheAgeSeconds: 0,
    freshnessScore: 0,
    status: "MOCK",
    recordCount: 0,
    apiCalled: null,
    lastSuccessfulSyncAt: null,
    metadata: {},
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Info className="size-4" aria-hidden />
          View Data Source
        </Button>
      </DrawerTrigger>
      <DrawerContent side="right" className="w-full max-w-md">
        <DrawerHeader>
          <DrawerTitle>Data Source</DrawerTitle>
          <DrawerDescription>Freshness, source, and sync details for this surface.</DrawerDescription>
        </DrawerHeader>
        <dl className="grid gap-3 px-4 pb-6 text-sm">
          <Detail label="Status" value={`${data.status} (${data.freshnessScore}/100)`} />
          <Detail label="Source" value={data.source} />
          <Detail label="Source service" value={data.sourceService} />
          <Detail label="API called" value={data.apiCalled ?? "Not recorded"} />
          <Detail label="Fetched at" value={formatDate(data.fetchedAt)} />
          <Detail label="Cache age" value={`${data.cacheAgeSeconds}s`} />
          <Detail label="Record count" value={String(data.recordCount)} />
          <Detail label="Last successful sync" value={data.lastSuccessfulSyncAt ? formatDate(data.lastSuccessfulSyncAt) : "Not recorded"} />
        </dl>
      </DrawerContent>
    </Drawer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
}

