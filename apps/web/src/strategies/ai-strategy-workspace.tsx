import { CalendarClock, Layers3, Megaphone, Radar, UsersRound } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { percent } from "@/lib/product-experience";

export function AIStrategyWorkspace({ data, compact = false }: { data: LiveData; compact?: boolean }) {
  const context = data.intelligence?.marketContext;
  const strategies = data.recommendations.slice(0, compact ? 2 : 4);
  const bestFormat = data.analytics.contentTypeBreakdown.formats.slice().sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0];
  const bestTimes = data.analytics.bestPostingTimes.slice(0, 2);
  return (
    <Panel className="p-5">
      <SectionHeader
        title="AI strategy workspace"
        description="Campaign planning intelligence for clinically responsible healthcare growth"
        action={<StatusIndicator label={context ? "Market context connected" : "Internal signals active"} tone={context ? "success" : "info"} />}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {strategies.map((strategy) => (
          <article key={strategy.title} className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Megaphone className="size-4" />{strategy.type}</p>
              <StatusIndicator label={`${strategy.confidence}% confidence`} tone="info" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{strategy.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{strategy.reasoning}</p>
            <div className="mt-3 rounded-lg bg-info/35 p-3">
              <p className="text-xs font-semibold text-primary">Expected outcome</p>
              <p className="mt-1 text-sm leading-6">{strategy.expectedOutcome}</p>
            </div>
          </article>
        ))}
      </div>
      {!compact && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PlanSignal icon={<CalendarClock />} label="Recommended cadence" value={bestTimes.map((time) => `${time.dayLabel} ${clock(time.hourOfDay)}`).join(" / ") || "Awaiting observed window"} />
          <PlanSignal icon={<Layers3 />} label="Content mix lead" value={bestFormat ? `${friendly(bestFormat.contentType)} at ${percent(bestFormat.avgEngagementRate)} engagement` : "Awaiting format signals"} />
          <PlanSignal icon={<Radar />} label="Healthcare opportunity" value={context?.recommendedThemes[0] ?? "Connect saved market context to surface regional health themes."} />
          <PlanSignal icon={<UsersRound />} label="Audience timing" value={context?.audienceInsights[0] ?? "Use measured posting windows while audience profiles are collected."} />
        </div>
      )}
    </Panel>
  );
}

function PlanSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{icon}{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}

function clock(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
