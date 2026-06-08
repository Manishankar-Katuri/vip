import Link from "next/link";
import { ArrowRight, CalendarClock, MapPinned, ShieldCheck } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { EventCard, WorkflowPromise } from "@/components/playbook/playbook-surfaces";
import { RealKpis, SourceNotice } from "@/components/operations/operational-surfaces";
import { Button, KpiSurface, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { hospitalProfile, playbookEvents, todayAgenda } from "@/lib/playbook/harika-playbook";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const nextEvent = playbookEvents.find((event) => event.status === "Upcoming") ?? playbookEvents[0];
  const intelligence = await getProductExperience();

  return (
    <PlaybookShell
      eyebrow="Today / Living playbook"
      title={`Build trust for ${hospitalProfile.name}, one verified action at a time.`}
      description="Your daily growth brief joins local opportunities, official health-calendar moments and clinically governed execution in one place."
    >
      <div className="space-y-5">
        <SourceNotice data={intelligence} />
        {intelligence.available && intelligence.analytics ? (
          <RealKpis data={{ ...intelligence, available: true, analytics: intelligence.analytics }} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiSurface label="Priority actions" value="3" change="One clinical decision due" tone="warning" />
            <KpiSurface label="Next official moment" value="31 May" change="World No Tobacco Day" tone="info" />
            <KpiSurface label="Ready channels" value="5" change="Approved workflow available" tone="success" />
            <KpiSurface label="Evidence standard" value="100%" change="Source each campaign trigger" tone="success" />
          </div>
        )}
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-5">
            <SectionHeader title="Actions for today" description="Generated from the next campaign window and approval dependencies" />
            <div className="space-y-3">
              {todayAgenda.map((action) => (
                <article key={action.title} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-primary">{action.channel}</p>
                      <h3 className="mt-1 text-sm font-semibold">{action.title}</h3>
                    </div>
                    <StatusIndicator label={action.due} tone={action.tone} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.detail}</p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">Owner: {action.owner}</p>
                  {action.channel === "Clinical approval" && (
                    <Link href={`/opportunities/${nextEvent.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Review complete strategy brief <ArrowRight className="size-4" />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </Panel>
          <div className="space-y-5">
            <Panel className="p-5">
              <SectionHeader title="Next campaign trigger" description="Official-source planning moment" />
              <EventCard event={nextEvent} />
              <Button asChild size="lg" className="mt-4 w-full min-h-11">
                <Link href="/campaign-studio">Prepare campaign <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
            </Panel>
            <WorkflowPromise />
          </div>
        </div>
        <Panel className="p-5">
          <SectionHeader title="The tenant playbook loop" description="The current client sees actions and outcomes; the multi-tenant platform retains the governing foundation." />
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { icon: MapPinned, title: "Sense", detail: "Local market and trusted public-health signals" },
              { icon: CalendarClock, title: "Plan", detail: "Calendar-linked campaigns and outreach" },
              { icon: ShieldCheck, title: "Approve", detail: "Clinical and brand safety review" },
              { icon: ArrowRight, title: "Learn", detail: "Results guide the next action" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border bg-background p-4">
                  <Icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </PlaybookShell>
  );
}
