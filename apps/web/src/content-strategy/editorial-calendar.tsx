"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Clock3, MapPin, MessageCircle, PlayCircle, Target } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { EditorialBrief, EditorialPlan, EditorialPlatform } from "@/lib/content-strategy/editorial-plan";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EditorialCalendar({ plan }: { plan: EditorialPlan }) {
  const [selectedId, setSelectedId] = useState(plan.briefs[0].id);
  const selected = plan.briefs.find((brief) => brief.id === selectedId) ?? plan.briefs[0];
  const firstOffset = new Date(`${plan.startsOn}T00:00:00.000Z`).getUTCDay();

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <SectionHeader
          title="Content strategy calendar"
          description={`${plan.period}. Select a date to see exactly what to post.`}
          action={<StatusIndicator label={`Live from today - ${formatShortDate(plan.today)}`} tone="success" />}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <SignalCard label="Plan" value="31 daily content ideas" />
          <SignalCard label="Post time" value="AI-selected per post and platform" />
          <SignalCard label="Review" value="Doctor approval before publishing" />
        </div>
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <Panel className="p-5">
          <SectionHeader
            title="Content calendar"
            description="Select a day to open the planned content mission"
            action={<StatusIndicator label={`${plan.briefs.length} briefs`} tone="info" />}
          />
          <div className="grid grid-cols-7 gap-1.5">
            {weekdays.map((weekday) => (
              <p key={weekday} className="pb-2 text-center text-xs font-semibold text-muted-foreground">{weekday}</p>
            ))}
            {Array.from({ length: firstOffset }, (_, index) => (
              <div key={`empty-${index}`} className="min-h-28 rounded-lg bg-muted/15" aria-hidden />
            ))}
            {plan.briefs.map((brief) => (
              <CalendarCell key={brief.id} brief={brief} isToday={brief.date === plan.today} selected={brief.id === selected.id} onSelect={() => setSelectedId(brief.id)} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Legend tone="bg-primary" label="Selected brief" />
            <Legend tone="bg-warning" label="Clinical review priority" />
            <Legend tone="bg-success" label="Evidence linked" />
          </div>
        </Panel>

        <EditorialBriefDetail brief={selected} />
      </div>
    </div>
  );
}

function CalendarCell({ brief, isToday, selected, onSelect }: { brief: EditorialBrief; isToday: boolean; selected: boolean; onSelect: () => void }) {
  const statusDot = brief.status === "Clinical review priority" ? "bg-warning" : brief.status === "Evidence linked" ? "bg-success" : "bg-muted-foreground/45";
  return (
    <button
      type="button"
      aria-label={`Open ${formatShortDate(brief.date)} brief: ${brief.topic}`}
      onClick={onSelect}
      className={cn(
        "min-h-28 rounded-lg border p-2 text-left transition-colors hover:border-primary/30 hover:bg-info/30",
        selected ? "border-primary/30 bg-info/45 ring-1 ring-primary/15" : "bg-background",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-semibold">{brief.day} <span className="font-normal text-muted-foreground">{shortMonth(brief.date)}</span></span>
        <span className={cn("mt-1 size-1.5 rounded-full", selected ? "bg-primary" : statusDot)} />
      </div>
      {isToday && <span className="mt-1 inline-flex rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">Today</span>}
      <p className="mt-2 line-clamp-3 text-[11px] font-medium leading-4">{brief.shortLabel}</p>
      <p className="mt-2 truncate text-[10px] text-muted-foreground">{brief.platform}</p>
    </button>
  );
}

function EditorialBriefDetail({ brief }: { brief: EditorialBrief }) {
  return (
    <Panel className="p-5 xl:sticky xl:top-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">
            <PlatformIcon platform={brief.platform} /> {formatLongDate(brief.date)} / {brief.platform} {brief.format}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{brief.topic}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{brief.objective}</p>
        </div>
        <StatusIndicator label={brief.status} tone={brief.status === "Clinical review priority" ? "warning" : brief.status === "Evidence linked" ? "success" : "info"} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DetailCard icon={<Clock3 />} title="Recommended time" value={`${brief.recommendedTime} / ${brief.timeConfidence}% confidence / ${brief.timeSource === "measured" ? "VIP measured" : "benchmark test"}`} />
        <DetailCard icon={<Target />} title="Audience" value={brief.audience} />
      </div>

      <Tabs defaultValue="content" className="mt-5 flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brief">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
          <TabsTrigger value="measure">Measure</TabsTrigger>
        </TabsList>
        <TabsContent value="brief" className="mt-4 space-y-4">
          <section className="rounded-xl border border-primary/15 bg-info/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Topic overview</p>
            <p className="mt-2 text-sm leading-6">{brief.objective}</p>
          </section>
          <section className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Why this post matters</p>
            <p className="mt-2 text-sm leading-6">{brief.impactHypothesis}</p>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextDetail title="Content pillar" value={brief.pillar} />
            <TextDetail title="Language plan" value={brief.language} />
          </div>
        </TabsContent>
        <TabsContent value="content" className="mt-4 space-y-4">
          <section className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Opening hook</p>
            <p className="mt-2 text-sm font-medium leading-6">{brief.hook}</p>
          </section>
          <section className="rounded-xl border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Points to cover in the post or reel</p>
            <ul className="space-y-2">
              {brief.keyPoints.map((point) => (
                <li key={point} className="flex gap-3 rounded-lg bg-muted/30 p-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
          <LabeledList title="Production notes" items={brief.productionNotes} />
          <section className="rounded-xl border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><MessageCircle className="size-4" /> Caption and tags</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6">{brief.caption}</p>
            <p className="mt-3 text-xs leading-6 text-primary">{brief.hashtags.map((tag) => `#${tag}`).join(" ")}</p>
          </section>
        </TabsContent>
        <TabsContent value="approval" className="mt-4 space-y-4">
          <LabeledList title="Approval checks" items={brief.approvalChecks} />
          <section className="rounded-xl border border-primary/15 bg-info/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Clinical safety rule</p>
            <p className="mt-2 text-sm leading-6">Publish only after clinical and privacy review. Keep claims factual, avoid diagnosis language, and never use patient identity or testimonials without valid permission.</p>
          </section>
        </TabsContent>
        <TabsContent value="measure" className="mt-4 space-y-4">
          <LabeledList title="Outcome measurements" items={brief.measurement} />
          <section className="rounded-xl border border-primary/15 bg-info/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Learning loop</p>
            <p className="mt-2 text-sm leading-6">Once published, measured performance is compared with this brief&apos;s topic, format and timing recommendation. Strong outcomes improve the next calendar cycle; weak outcomes trigger strategy revision.</p>
          </section>
        </TabsContent>
      </Tabs>
    </Panel>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}

function DetailCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground [&_svg]:size-4 [&_svg]:text-primary">{icon}{title}</p>
      <p className="mt-2 text-sm font-medium leading-5">{value}</p>
    </div>
  );
}

function TextDetail({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-medium leading-5">{value}</p>
    </div>
  );
}

function LabeledList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1">
      <span className={cn("size-2 rounded-full", tone)} />
      {label}
    </span>
  );
}

function PlatformIcon({ platform }: { platform: EditorialPlatform }) {
  if (platform === "Instagram") return <Camera />;
  if (platform === "YouTube") return <PlayCircle />;
  if (platform === "Google Business Profile") return <MapPin />;
  return <MessageCircle />;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function shortMonth(value: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}
