import { ArrowRight, CalendarDays, Camera, Database, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { EngagementTrendChart } from "@/charts/engagement-trend-chart";
import type { ProductExperience } from "@/lib/product-experience";
import { formatDate, integer, percent, shortCaption } from "@/lib/product-experience";
import { AlertBanner, Button, DetailDisclosure, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

export type LiveData = ProductExperience & { available: true; analytics: NonNullable<ProductExperience["analytics"]> };

export function SourceNotice({ data }: { data: ProductExperience }) {
  if (!data.available) {
    return (
      <AlertBanner
        title="Connected analytics could not be loaded"
        message="Operational surfaces will populate when the stored social workspace is available."
        tone="warning"
      />
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/12 bg-info/45 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Database className="size-4 text-primary" />
        <span className="font-medium">Measured Instagram data</span>
        <span className="text-muted-foreground">{data.workspaceName}</span>
      </div>
      <StatusIndicator
        label={data.lastMeasuredAt ? `Updated through ${formatDate(data.lastMeasuredAt)}` : "Connected"}
        tone="info"
      />
    </div>
  );
}

export function RealKpis({ data, executive = false }: { data: LiveData; executive?: boolean }) {
  const analytics = data.analytics;
  const metrics = executive
    ? [
        { label: "Average engagement", value: percent(analytics.avgEngagementRate), change: "Measured Instagram response", tone: "info" as const },
        { label: "Recorded reach", value: integer(analytics.totalReach), change: `${analytics.totalPosts} published posts`, tone: "success" as const },
        { label: "Approvals requiring action", value: String(data.operationalCounts.approvals), change: data.operationalCounts.approvals ? "Open requests" : "None recorded", tone: data.operationalCounts.approvals ? "warning" as const : "success" as const },
      ]
    : [
        { label: "Instagram posts", value: integer(analytics.totalPosts), change: data.period ?? "Measured history", tone: "info" as const },
        { label: "Recorded reach", value: integer(analytics.totalReach), change: "Post-level analytics", tone: "success" as const },
        { label: "Average engagement", value: percent(analytics.avgEngagementRate), change: trendLabel(analytics.engagementTrend.direction, analytics.engagementTrend.percentageChange), tone: analytics.engagementTrend.direction === "DOWN" ? "warning" as const : "success" as const },
        { label: "Stored workflows", value: String(data.operationalCounts.plans), change: data.operationalCounts.plans ? "Action plans available" : "No plans persisted", tone: "neutral" as const },
      ];
  return (
    <div className={`grid gap-3 ${executive ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
      {metrics.map((metric) => <KpiSurface key={metric.label} {...metric} />)}
    </div>
  );
}

export function RealEngagementTrend({ data }: { data: LiveData }) {
  const analytics = data.analytics;
  return (
    <Panel className="p-4">
      <SectionHeader
        title="Measured engagement trend"
        description="Post-level Instagram engagement from stored analytics"
        action={<StatusIndicator label={trendLabel(analytics.engagementTrend.direction, analytics.engagementTrend.percentageChange)} tone={analytics.engagementTrend.direction === "DOWN" ? "warning" : "success"} />}
      />
      {analytics.engagementTrend.series.length ? (
        <EngagementTrendChart data={analytics.engagementTrend.series} />
      ) : (
        <EmptyMessage text="Not enough measured posts are available to chart a trend." />
      )}
    </Panel>
  );
}

export function NarrativeSummary({ data, concise = false }: { data: LiveData; concise?: boolean }) {
  return (
    <Panel className="border-primary/15 bg-info/35 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{concise ? "Executive summary" : "Measured insight"}</p>
      <p className="mt-2 text-sm leading-5">{data.measuredNarrative}</p>
      {!concise && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Recommendations below are grounded in available post analytics; unrecorded approvals and execution events are not presented as completed work.
        </p>
      )}
    </Panel>
  );
}

export function TopContentTable({ data, limit = 5 }: { data: LiveData; limit?: number }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Highest-response content" description="Ranked by measured performance" />
      <div className="space-y-2">
        {data.analytics.topPosts.slice(0, limit).map((post) => (
          <article key={post.id} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Camera className="size-3.5" /> Instagram · {formatDate(post.postedAt)} · {friendly(post.contentType)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{shortCaption(post.caption)}</p>
              </div>
              <StatusIndicator label={`${percent(post.engagementRate)} engagement`} tone="success" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{integer(post.reach)} measured reach</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function RecommendationCenter({ data, compact = false }: { data: LiveData; compact?: boolean }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="AI recommendation center" description="Evidence-led opportunities for production review" />
      <div className="space-y-2">
        {data.recommendations.slice(0, compact ? 2 : undefined).map((item) => (
          <article key={item.title} className="rounded-lg border border-primary/12 bg-info/35 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 gap-3">
                <Sparkles className="mt-1 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-medium text-primary">{item.type}</p>
                  <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                </div>
              </div>
              <StatusIndicator label={`${item.confidence}% confidence`} tone={item.confidence >= 85 ? "success" : "info"} />
            </div>
            <DetailDisclosure label="Narrative and evidence" className="mt-2">
              <p>{item.narrative}</p>
              <p className="mt-1">{item.evidence}</p>
            </DetailDisclosure>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusIndicator label={item.status} tone={item.status === "Persisted" ? "success" : "info"} />
              <Button asChild size="sm" variant="outline">
                <Link href="/production/recommendations">Open details</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ConnectedWorkflow({ data }: { data: LiveData }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Connected workflow" description="Recommendation to performance measurement" />
      <ol className="grid gap-2 xl:grid-cols-5">
        {data.workflows.map((item, index) => (
          <li key={`${item.stage}-${item.title}`} className="relative rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.stage}</p>
            <p className="mt-1 text-sm font-medium leading-5">{item.title}</p>
            <DetailDisclosure label="Detail" className="mt-2">{item.detail}</DetailDisclosure>
            <StatusIndicator label={item.status} tone={item.tone} />
            {index < data.workflows.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 hidden size-4 text-muted-foreground xl:block" />}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function ContentPipeline({ data }: { data: LiveData }) {
  const top = data.analytics.topPosts;
  const stages = [
    { title: "Draft", items: data.recommendations.slice(0, 2).map((item) => item.title), tone: "info" as const },
    { title: "Review", items: ["Evidence and clinical language review"], tone: "warning" as const },
    { title: "Doctor approval", items: data.operationalCounts.approvals ? ["Open persisted approval request"] : [], tone: "warning" as const },
    { title: "Scheduled", items: [], tone: "neutral" as const },
    { title: "Published", items: top.slice(0, 2).map((post) => shortCaption(post.caption)), tone: "success" as const },
  ];
  return (
    <Panel className="p-4">
      <SectionHeader title="Content pipeline" description="Published evidence alongside proposed next work" />
      <div className="grid gap-3 lg:grid-cols-5">
        {stages.map((stage) => (
          <section key={stage.title} className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{stage.title}</h3>
              <StatusIndicator label={String(stage.items.length)} tone={stage.tone} />
            </div>
            <div className="space-y-2">
              {stage.items.length ? stage.items.map((item) => (
                <div key={item} className="rounded-lg border bg-card p-3 text-xs leading-5">{item}</div>
              )) : <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">No recorded items</p>}
            </div>
          </section>
        ))}
      </div>
    </Panel>
  );
}

export function CampaignCalendar({ data }: { data: LiveData }) {
  const slots = data.analytics.bestPostingTimes.slice(0, 4);
  return (
    <Panel className="p-4">
      <SectionHeader title="Recommended publishing windows" description="Observed high-performance slots, awaiting approved campaigns" />
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => (
          <div key={`${slot.dayOfWeek}-${slot.hourOfDay}`} className="rounded-lg border p-3">
            <CalendarDays className="size-4 text-primary" />
            <p className="mt-2 text-sm font-semibold">{slot.dayLabel}, {time(slot.hourOfDay)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{slot.postCount} measured posts · {percent(slot.avgEngagementRate)} average engagement</p>
            <StatusIndicator label="Available after approval" tone="neutral" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function AssetLibrary({ data }: { data: LiveData }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="Performance-backed library" description="Published reference content for future briefs" />
      <div className="grid gap-3 md:grid-cols-2">
        {data.analytics.topPosts.slice(0, 6).map((post) => (
          <article key={post.id} className="rounded-lg border p-3">
            <FileText className="size-4 text-primary" />
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-5">{shortCaption(post.caption)}</p>
            <div className="mt-2 flex gap-1.5">
              <StatusIndicator label={friendly(post.contentType)} tone="neutral" />
              <StatusIndicator label={percent(post.engagementRate)} tone="success" />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function EmptyMessage({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{text}</div>;
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function time(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function trendLabel(direction: string, change: number | null) {
  if (change === null) return "Trend unavailable";
  const prefix = direction === "DOWN" ? "Down" : direction === "UP" ? "Up" : "Stable";
  return `${prefix} ${Math.abs(change).toFixed(1)}%`;
}
