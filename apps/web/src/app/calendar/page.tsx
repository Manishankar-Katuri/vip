import { CalendarDays, ExternalLink } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { EventCard, SourcesPanel } from "@/components/playbook/playbook-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { playbookEvents } from "@/lib/playbook/harika-playbook";
import { EditorialCalendar } from "@/content-strategy/editorial-calendar";
import { buildEditorialPlan, contentStrategySources } from "@/lib/content-strategy/editorial-plan";
import { getProductExperience, percent } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = indiaDate(new Date());
  const data = await getProductExperience();
  const bestTime = data.analytics?.bestPostingTimes[0];
  const bestFormat = data.analytics?.contentTypeBreakdown.formats.slice().sort((left, right) => right.avgEngagementRate - left.avgEngagementRate)[0];
  const market = data.intelligence?.marketContext;
  const plan = buildEditorialPlan(today, {
    hospitalSpecialty: hospitalProfile.specialty,
    hospitalPromise: hospitalProfile.promise,
    languages: hospitalProfile.languages,
    channels: hospitalProfile.channels,
    locations: hospitalProfile.locations.map((location) => location.name),
    marketThemes: market?.recommendedThemes ?? [],
    healthcareSignals: market?.healthcareSignals.slice(0, 3).map((signal) => signal.title) ?? [],
    opportunitySignals: market?.opportunitySignals.slice(0, 3).map((signal) => signal.title) ?? [],
    audienceSignals: market?.audienceInsights ?? [],
    recommendations: data.recommendations.slice(0, 4).map((recommendation) => recommendation.title),
  }, {
    recommendedWindow: bestTime ? `${clock(bestTime.hourOfDay)} IST` : undefined,
    timingConfidence: bestTime ? (bestTime.postCount >= 3 ? 78 : bestTime.postCount === 2 ? 66 : 54) : undefined,
    timingEvidence: bestTime ? `Observed Instagram evidence: ${bestTime.postCount} measured post${bestTime.postCount === 1 ? "" : "s"} on ${bestTime.dayLabel} at this time averaged ${percent(bestTime.avgEngagementRate)} engagement. Treat this as a time-of-day test until more observations exist.` : undefined,
    formatEvidence: bestFormat ? `${friendly(bestFormat.contentType)} leads stored content formats at ${percent(bestFormat.avgEngagementRate)} average engagement.` : undefined,
    engagementEvidence: data.measuredNarrative,
    audienceEvidence: data.audienceInsights.length
      ? `${data.audienceInsights.length} stored audience observations inform targeting and language planning.`
      : undefined,
  });

  return (
    <PlaybookShell
      eyebrow="Content strategy / AI editorial calendar"
      title="AI decides the smartest content mission for each day."
      description="This live rolling strategy begins on today's India date, studies the hospital profile and available intelligence signals, ranks themes, assigns the right channel role and produces clinically governed content briefs. WhatsApp is treated as a central community-distribution pillar."
    >
      <div className="space-y-5">
        <EditorialCalendar plan={plan} />
        <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <Panel className="p-5">
            <SectionHeader title="Official moments feeding future strategy" description="Public-health and local-calendar opportunities remain governed inputs to the editorial plan" action={<StatusIndicator label="Source linked" tone="success" />} />
            <div className="space-y-3">
              {playbookEvents.map((event) => <EventCard key={`${event.date}-${event.name}`} event={event} />)}
            </div>
          </Panel>
          <div className="space-y-5">
            <Panel className="p-5">
              <CalendarDays className="size-5 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">Calendar policy</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">The calendar can recommend topics, platform formats, time windows and draft copy. Clinical meaning, privacy, claims and patient-facing publication must be approved before release.</p>
            </Panel>
            <Panel className="p-5">
              <SectionHeader title="Content strategy references" description="Platform and governance sources informing this demo workflow" />
              <div className="space-y-3">
                {contentStrategySources.map((source) => (
                  <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border bg-background p-4 hover:border-primary/25">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold">{source.name}<ExternalLink className="size-3.5" /></p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.use}</p>
                  </a>
                ))}
              </div>
            </Panel>
            <SourcesPanel />
          </div>
        </div>
      </div>
    </PlaybookShell>
  );
}

function clock(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function indiaDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
