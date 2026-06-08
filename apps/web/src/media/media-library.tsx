"use client";

import { useMemo, useState } from "react";
import { Archive, Camera, FileText, Film, Link2, Search, Upload } from "lucide-react";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Role } from "@/design-system/theme";
import { useOperationalStore, type MediaAsset, type MediaStatus } from "@/state/operational-store";

const filters: Array<{ label: string; value: "all" | MediaStatus }> = [
  { label: "All media", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "In review", value: "under-review" },
  { label: "Approved", value: "approved" },
  { label: "Archived", value: "archived" },
];

export function MediaLibrary({ role, compact = false }: { role: "production" | "staff"; compact?: boolean }) {
  const assets = useOperationalStore((state) => state.mediaAssets);
  const campaigns = useOperationalStore((state) => state.campaigns);
  const uploadMedia = useOperationalStore((state) => state.uploadMedia);
  const attachMedia = useOperationalStore((state) => state.attachMedia);
  const updateStatus = useOperationalStore((state) => state.updateMediaStatus);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MediaStatus>("all");
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const visible = useMemo(() => assets.filter((asset) => {
    if (!asset.visibleTo.includes(role as Role)) return false;
    if (status !== "all" && asset.status !== status) return false;
    const match = `${asset.title} ${asset.fileName} ${asset.uploadedBy}`.toLowerCase();
    return match.includes(query.toLowerCase());
  }), [assets, query, role, status]);

  return (
    <Panel className="p-5">
      <SectionHeader
        title={role === "staff" ? "Operational media uploads" : "Media library"}
        description={role === "staff" ? "Clinic materials shared for responsible production use" : "Search, approve and connect reusable campaign assets"}
        action={<StatusIndicator label={`${visible.length} visible assets`} tone="info" />}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block flex-1">
          <span className="sr-only">Search media library</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets or uploader" className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm" />
        </label>
        {!compact && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter media status">
            {filters.map((filter) => (
              <Button key={filter.value} size="sm" variant={filter.value === status ? "default" : "outline"} onClick={() => setStatus(filter.value)}>
                {filter.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {!compact && role === "production" && (
        <label className="mb-5 flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-primary/25 bg-info/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <Upload className="size-5 text-primary" />
            <span>
              <span className="block text-sm font-medium">Upload campaign media</span>
              <span className="block text-xs text-muted-foreground">PNG, JPG, MP4 or PDF. Metadata persists for review.</span>
            </span>
          </span>
          <span className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Choose asset</span>
          <input
            type="file"
            className="sr-only"
            accept=".png,.jpg,.jpeg,.mp4,.pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMedia(file.name, file.type || "application/octet-stream", "production");
              event.currentTarget.value = "";
            }}
          />
        </label>
      )}
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`} aria-live="polite">
        {visible.map((asset) => (
          <MediaCard
            key={asset.id}
            asset={asset}
            campaignTitle={campaigns.find((campaign) => campaign.id === asset.campaignId)?.title}
            production={role === "production"}
            campaigns={campaigns.map((campaign) => ({ id: campaign.id, title: campaign.title }))}
            campaignId={campaignId}
            setCampaignId={setCampaignId}
            attachMedia={attachMedia}
            updateStatus={updateStatus}
          />
        ))}
        {!visible.length && <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No media matches this view.</p>}
      </div>
    </Panel>
  );
}

function MediaCard({
  asset,
  campaignTitle,
  production,
  campaigns,
  campaignId,
  setCampaignId,
  attachMedia,
  updateStatus,
}: {
  asset: MediaAsset;
  campaignTitle?: string;
  production: boolean;
  campaigns: Array<{ id: string; title: string }>;
  campaignId: string;
  setCampaignId: (id: string) => void;
  attachMedia: (id: string, campaignId: string) => void;
  updateStatus: (id: string, status: MediaStatus) => void;
}) {
  const Icon = asset.kind === "video" ? Film : asset.kind === "document" ? FileText : Camera;
  return (
    <article className="overflow-hidden rounded-xl border bg-background">
      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-info/55 to-muted/50" aria-label={`Preview for ${asset.title}`}>
        <Icon className="size-8 text-primary/65" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-5">{asset.title}</p>
          <StatusIndicator label={asset.status.replace("-", " ")} tone={mediaTone(asset.status)} />
        </div>
        <p className="mt-2 truncate text-xs text-muted-foreground">{asset.fileName}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{asset.uploadedBy} - {dateTime(asset.uploadedAt)}</p>
        {campaignTitle && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary"><Link2 className="size-3" /> {campaignTitle}</p>}
        {production && asset.status !== "archived" && (
          <div className="mt-3 space-y-2">
            {!asset.campaignId && (
              <div className="flex gap-2">
                <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} aria-label={`Campaign for ${asset.title}`} className="min-w-0 flex-1 rounded-md border bg-background px-2 text-xs">
                  {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={() => attachMedia(asset.id, campaignId)}>Attach</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {asset.status !== "approved" && <Button size="sm" onClick={() => updateStatus(asset.id, "approved")}>Approve</Button>}
              <Button size="sm" variant="ghost" onClick={() => updateStatus(asset.id, "archived")}><Archive /> Archive</Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function mediaTone(status: MediaStatus) {
  if (status === "approved") return "success" as const;
  if (status === "under-review") return "warning" as const;
  return "neutral" as const;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
