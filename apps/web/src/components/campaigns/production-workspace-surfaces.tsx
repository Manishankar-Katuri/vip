"use client";

import { useState } from "react";
import { Bookmark, CalendarClock, Camera, GripVertical, Heart, MessageCircle, PencilLine, PlayCircle, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Button, DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import { useOperationalStore, type CampaignStage, type OperationalCampaign } from "@/state/operational-store";
import { ContentVersionHistory } from "@/versions/content-version-history";

const stages: Array<{ value: CampaignStage; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "doctor-approval", label: "Doctor Approval" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

function approvalTone(campaign: OperationalCampaign) {
  if (campaign.approval === "approved") return "success" as const;
  if (campaign.approval === "rejected" || campaign.approval === "revision-requested") return "warning" as const;
  if (campaign.approval === "pending") return "info" as const;
  return "neutral" as const;
}

export function ContentPipelineBoard() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const moveCampaign = useOperationalStore((state) => state.moveCampaign);
  const submitCampaign = useOperationalStore((state) => state.submitCampaign);
  const [dragged, setDragged] = useState<string>();
  const [editing, setEditing] = useState<OperationalCampaign>();

  return (
    <>
      <Panel className="p-4">
        <SectionHeader
          title="Content pipeline board"
          description="Drag cards between review stages or use accessible actions on each card"
          action={<StatusIndicator label={`${campaigns.length} active items`} tone="info" />}
        />
        <div className="grid gap-3 lg:grid-cols-5">
          {stages.map((stage) => {
            const items = campaigns.filter((campaign) => campaign.stage === stage.value);
            return (
              <section
                key={stage.value}
                aria-label={`${stage.label} content`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged) moveCampaign(dragged, stage.value);
                  setDragged(undefined);
                }}
                className="min-h-48 rounded-xl border bg-muted/25 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <StatusIndicator label={String(items.length)} tone={items.length ? "info" : "neutral"} />
                </div>
                <div className="space-y-2">
                  {!items.length && <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Drop content here</div>}
                  {items.map((campaign) => (
                    <article
                      key={campaign.id}
                      draggable
                      onDragStart={() => setDragged(campaign.id)}
                      className="rounded-lg border bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-5">{campaign.title}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{campaign.channel} - {campaign.updated}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <StatusIndicator label={campaign.approval.replace("-", " ")} tone={approvalTone(campaign)} />
                        {campaign.recommendation && <StatusIndicator label="AI-linked" tone="info" />}
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                        {campaign.stage === "doctor-approval" ? "Waiting on doctor approval" : campaign.stage === "review" ? "Updated by production" : campaign.reviewer ? `Reviewed by ${campaign.reviewer}` : `Owner: ${campaign.owner}`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Button variant="ghost" size="lg" className="min-h-10" onClick={() => setEditing(campaign)}><PencilLine /> Edit</Button>
                        {(stage.value === "draft" || stage.value === "review") && (
                          <Button size="lg" className="min-h-10" onClick={() => submitCampaign(campaign.id)}><Send /> Submit</Button>
                        )}
                        {stage.value === "scheduled" && (
                          <Button size="lg" className="min-h-10" variant="outline" onClick={() => moveCampaign(campaign.id, "published")}>Publish</Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>
      {editing && <CampaignEditor campaign={editing} onClose={() => setEditing(undefined)} />}
    </>
  );
}

function CampaignEditor({ campaign, onClose }: { campaign: OperationalCampaign; onClose: () => void }) {
  const editCampaign = useOperationalStore((state) => state.editCampaign);
  const [caption, setCaption] = useState(campaign.caption);
  const [note, setNote] = useState(campaign.strategyNote);

  return (
      <Panel className="border-primary/20 p-4">
      <SectionHeader title="Revise content" description={campaign.title} action={<Button variant="ghost" size="icon" onClick={onClose} aria-label="Close editor"><X /></Button>} />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <PostPreview campaign={{ ...campaign, caption }} />
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            editCampaign(campaign.id, caption, note);
            onClose();
          }}
        >
          <label className="block text-sm font-medium">
            Caption preview
            <textarea className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3 text-sm" value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Approval note
            <textarea className="mt-2 min-h-20 w-full rounded-lg border bg-background p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button size="lg" type="submit">Save revision</Button>
            <Button size="lg" variant="outline" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

export function CampaignWorkspace() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const mediaAssets = useOperationalStore((state) => state.mediaAssets);
  const activity = useOperationalStore((state) => state.activity);
  const submitCampaign = useOperationalStore((state) => state.submitCampaign);
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id);
  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0];
  const attachedMedia = mediaAssets.filter((asset) => asset.campaignId === selected?.id);
  const approvals = activity.filter((item) => item.campaignId === selected?.id && item.category === "approval");

  return (
    <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
      <Panel className="p-4">
        <SectionHeader title="Campaign workspace" description="Active clinical communication initiatives" />
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <button
              type="button"
              key={campaign.id}
              onClick={() => setSelectedId(campaign.id)}
              className={cn("w-full rounded-lg border p-3 text-left transition-colors", selected?.id === campaign.id ? "border-primary/30 bg-info/35" : "bg-background hover:bg-muted/35")}
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm font-semibold">{campaign.title}</p>
                <StatusIndicator label={stages.find((stage) => stage.value === campaign.stage)?.label ?? campaign.stage} tone={approvalTone(campaign)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{campaign.channel} - {campaign.updated}</p>
            </button>
          ))}
        </div>
      </Panel>
      {selected && (
        <Panel className="p-4">
          <SectionHeader title={selected.title} description="Campaign detail and content preview" />
          <div className="grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
            <PostPreview campaign={selected} mediaLabel={attachedMedia[0]?.title} />
            <div className="space-y-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">Primary action</p>
                <p className="mt-1 text-sm font-semibold leading-5">{selected.objective}</p>
              </div>
              <DetailDisclosure label="Audience notes">{selected.audienceNotes}</DetailDisclosure>
              <DetailDisclosure label="Strategy note">{selected.strategyNote}</DetailDisclosure>
              {selected.recommendation && <DetailDisclosure label="AI linkage">{selected.recommendation}</DetailDisclosure>}
              <Detail label="Ownership" value={`${selected.owner}${selected.reviewer ? ` - Reviewed by ${selected.reviewer}` : ""}`} />
              <Detail label="Schedule" value={selected.scheduledFor ? displaySchedule(selected.scheduledFor) : "Available after clinical approval"} icon={<CalendarClock className="size-4 text-primary" />} />
              <Detail label="Publishing status" value={selected.stage.replace("-", " ")} />
              <DetailDisclosure label="Engagement expectations">{selected.performance ?? selected.engagementExpectation}</DetailDisclosure>
              <DetailDisclosure label="Approval history">{approvals.length ? approvals.map((entry) => `${entry.title} - ${entry.time}`).join(" | ") : "No clinical decision recorded yet."}</DetailDisclosure>
              {(selected.stage === "draft" || selected.stage === "review") && (
                <Button size="lg" onClick={() => submitCampaign(selected.id)}><Send /> Submit for approval</Button>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ContentVersionHistory campaignId={selected.id} />
            <section className="rounded-lg border bg-background p-3">
              <h3 className="text-sm font-semibold">Connected media</h3>
              <p className="mt-1 text-xs text-muted-foreground">Assets follow clinical approval and publishing schedules.</p>
              <div className="mt-3 space-y-2">
                {attachedMedia.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/35 p-3 text-sm">
                    <span>{asset.title}</span>
                    <StatusIndicator label={asset.status.replace("-", " ")} tone={asset.status === "approved" ? "success" : "warning"} />
                  </div>
                ))}
                {!attachedMedia.length && <p className="text-sm text-muted-foreground">No asset attached. Select one from Media Library.</p>}
              </div>
            </section>
          </div>
        </Panel>
      )}
    </div>
  );
}

function PostPreview({ campaign, mediaLabel }: { campaign: OperationalCampaign; mediaLabel?: string }) {
  return (
    <div className="mx-auto w-full max-w-[350px] overflow-hidden rounded-[1.55rem] border bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b p-3 text-xs font-medium">
        <span className="flex size-7 items-center justify-center rounded-full bg-info text-primary">VIP</span>
        <span className="flex-1">harikaentcare</span>
        <StatusIndicator label={campaign.approval === "approved" ? "Approved" : "Review"} tone={approvalTone(campaign)} />
      </div>
      <div className={cn("relative flex items-center justify-center bg-gradient-to-br from-info/70 to-muted", campaign.format === "reel" ? "aspect-[9/13]" : "aspect-square")}>
        <div className="text-center text-muted-foreground">
          {campaign.format === "reel" ? <PlayCircle className="mx-auto size-10" /> : <Camera className="mx-auto size-7" />}
          <p className="mt-2 text-xs">{mediaLabel ?? (campaign.format === "reel" ? "Reel preview placeholder" : "Media pending attachment")}</p>
        </div>
        {campaign.format === "reel" && <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2 py-1 text-[10px] font-medium">0:20</span>}
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-3 text-foreground">
          <Heart className="size-4" /><MessageCircle className="size-4" /><Send className="size-4" /><Bookmark className="ml-auto size-4" />
        </div>
        <p className="text-xs leading-5 whitespace-pre-line"><span className="font-semibold">harikaentcare </span>{campaign.caption}</p>
        <p className="mt-2 text-xs leading-5 text-primary">{campaign.hashtags.map((tag) => `#${tag}`).join(" ")}</p>
        <div className="mt-3 rounded-lg bg-info/35 p-2 text-[11px] text-muted-foreground">
          Approval annotation: {campaign.strategyNote}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {campaign.scheduledFor ? `Posting schedule: ${displaySchedule(campaign.scheduledFor)}` : "Schedule released after clinical approval"}
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 text-sm leading-5">{value}</p>
    </div>
  );
}

function displaySchedule(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

type RecommendationInput = { title: string; narrative: string; evidence: string; confidence: number; type: string };

export function RecommendationActionCenter({ recommendations, compact = false }: { recommendations: RecommendationInput[]; compact?: boolean }) {
  const statuses = useOperationalStore((state) => state.recommendationStatus);
  const act = useOperationalStore((state) => state.actOnRecommendation);

  return (
    <Panel className="p-4">
      <SectionHeader title="AI recommendation actions" description="Actions first. Evidence remains available inside each row." />
      <div className="space-y-2">
        {recommendations.slice(0, compact ? 2 : undefined).map((recommendation) => (
          <article key={recommendation.title} className="rounded-lg border border-primary/12 bg-info/30 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex gap-2">
                <Sparkles className="mt-1 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium text-primary">{recommendation.type}</p>
                  <h3 className="mt-1 text-sm font-semibold">{recommendation.title}</h3>
                </div>
              </div>
              <StatusIndicator label={`${recommendation.confidence}% confidence`} tone="info" />
            </div>
            <DetailDisclosure label="Why this action" className="mt-2">
              <p>{recommendation.narrative}</p>
              <p className="mt-1">{recommendation.evidence}</p>
            </DetailDisclosure>
            {statuses[recommendation.title] ? (
              <div className="mt-3"><StatusIndicator label={statuses[recommendation.title]} tone={statuses[recommendation.title] === "dismissed" ? "neutral" : "success"} /></div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button asChild size="lg" variant="outline">
                  <Link href="/production/recommendations">View evidence page</Link>
                </Button>
                <Button size="lg" onClick={() => act(recommendation.title, "convert")}>Convert to campaign</Button>
                <Button size="lg" variant="outline" onClick={() => act(recommendation.title, "attach")}>Attach to content</Button>
                <Button size="lg" variant="ghost" onClick={() => act(recommendation.title, "apply")}>Apply</Button>
                <Button size="lg" variant="ghost" onClick={() => act(recommendation.title, "dismiss")}>Dismiss</Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </Panel>
  );
}
