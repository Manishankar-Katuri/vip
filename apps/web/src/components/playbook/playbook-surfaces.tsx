import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { evidenceSources, type EvidenceSource, type PlaybookEvent } from "@/lib/playbook/harika-playbook";

export function EvidenceLinks({ sourceIds }: { sourceIds: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sourceIds.map((sourceId) => {
        const source = evidenceSources.find((item) => item.id === sourceId);
        if (!source) return null;
        return (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-primary hover:bg-info">
            {source.publisher} <ExternalLink className="size-3" />
          </a>
        );
      })}
    </div>
  );
}

export function SourcesPanel({ sources = evidenceSources }: { sources?: EvidenceSource[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="Authoritative sources" description="Public references used for planning; clinical copy remains subject to review." />
      <div className="space-y-3">
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border bg-background p-4 hover:border-primary/25">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">{source.title}<ExternalLink className="size-3.5" /></p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.use}</p>
          </a>
        ))}
      </div>
    </Panel>
  );
}

export function EventCard({ event }: { event: PlaybookEvent }) {
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${event.date}T00:00:00`));
  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">{date} / {event.type}</p>
          <h3 className="mt-1 text-base font-semibold">{event.name}</h3>
        </div>
        <StatusIndicator label={event.status} tone={event.status === "Upcoming" ? "info" : "neutral"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.relevance}</p>
      <EvidenceLinks sourceIds={event.sourceIds} />
      <Link
        href={`/opportunities/${event.slug}`}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/15 bg-info/35 px-3 text-sm font-medium text-primary hover:bg-info"
      >
        <Sparkles className="size-4" /> View complete action plan <ArrowUpRight className="size-4" />
      </Link>
    </article>
  );
}

export function WorkflowPromise() {
  return (
    <Panel className="border-primary/15 bg-info/25 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">How this playbook is different</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Every content idea moves through evidence, clinical approval, scheduling and outcome measurement. This page shows the plan; governance records the decision.</p>
          <Link href="/governance" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            View governance flow <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

export function StageRow() {
  const stages = [
    { name: "Evidence", icon: BookOpen },
    { name: "Draft", icon: CalendarDays },
    { name: "Clinical review", icon: CheckCircle2 },
    { name: "Schedule & measure", icon: ArrowUpRight },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        return (
          <div key={stage.name} className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4 text-primary" /> Step {index + 1}</p>
            <p className="mt-3 text-sm font-semibold">{stage.name}</p>
          </div>
        );
      })}
    </div>
  );
}
