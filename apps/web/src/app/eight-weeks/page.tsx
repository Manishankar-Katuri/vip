import { CalendarClock, CheckSquare, Target } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { EvidenceLinks, SourcesPanel } from "@/components/playbook/playbook-surfaces";
import { SourceNotice, type LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { buildEightWeekSchedule, evidenceSources } from "@/lib/playbook/harika-playbook";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function EightWeeksPage() {
  const data = await getProductExperience();
  const liveData = data.available && data.analytics ? data as LiveData : undefined;
  const format = liveData?.analytics.contentTypeBreakdown.formats
    .slice()
    .sort((left, right) => right.avgEngagementRate - left.avgEngagementRate)[0];
  const postingTime = liveData?.analytics.bestPostingTimes[0];
  const weeks = buildEightWeekSchedule({
    bestFormat: format ? friendly(format.contentType) : undefined,
    publishingWindow: postingTime ? `${postingTime.dayLabel} around ${formatHour(postingTime.hourOfDay)}` : undefined,
    engagementSignal: liveData ? `${liveData.analytics.avgEngagementRate.toFixed(2)}% stored average Instagram engagement` : undefined,
  });

  return (
    <PlaybookShell
      eyebrow="Strategy / Eight-week execution"
      title="A content schedule built as accountable work, not a list of post ideas."
      description="This cycle combines official health references, current tenant governance and available channel evidence. Each week has an objective, deliverables, owners, deadlines and a measurement decision."
    >
      <div className="space-y-5">
        <SourceNotice data={data} />
        <Panel className="p-5">
          <SectionHeader title="Planning method" description="Adapted from established social strategy and calendar workflows" action={<StatusIndicator label="8 weeks / 24 assigned tasks" tone="info" />} />
          <div className="grid gap-4 md:grid-cols-3">
            <Method icon={<Target />} title="Objectives and pillars" text="Assign each content choice to an audience need and measurable objective, rather than filling calendar slots." sourceId="hootsuite-strategy" />
            <Method icon={<CalendarClock />} title="Publishing calendar" text="Record channel, asset, campaign trigger, owner, approval state and publishing date in the weekly work." sourceId="sprout-calendar" />
            <Method icon={<CheckSquare />} title="Review and iterate" text="Use a sustainable cadence and measured results to decide the following cycle." sourceId="buffer-calendar" />
          </div>
        </Panel>
        <div className="space-y-4">
          {weeks.map((week) => (
            <Panel key={week.week} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{week.week} / {week.dates}</p>
                  <h2 className="mt-2 text-lg font-semibold">{week.objective}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Trigger: {week.trigger}</p>
                </div>
                <StatusIndicator label={week.pillar} tone="info" />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_0.75fr]">
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliverables</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {week.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned tasks</p>
                  <div className="mt-3 space-y-3">
                    {week.tasks.map((task) => (
                      <div key={`${task.owner}-${task.task}`} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">{task.task}</p>
                          <p className="text-xs text-muted-foreground">{task.owner}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs font-medium text-primary">{task.due}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/12 bg-info/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Measure</p>
                  <p className="mt-3 text-sm leading-6">{week.measurement}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <SourcesPanel sources={evidenceSources.filter((source) => ["hootsuite-strategy", "sprout-calendar", "buffer-calendar", "who-tobacco-day-2026", "dghs-nppcd"].includes(source.id))} />
      </div>
    </PlaybookShell>
  );
}

function Method({ icon, title, text, sourceId }: { icon: React.ReactNode; title: string; text: string; sourceId: string }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      <EvidenceLinks sourceIds={[sourceId]} />
    </article>
  );
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatHour(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}
