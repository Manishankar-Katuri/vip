import { BarChart3, Link2, Target } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { OperationalSyncProvider } from "@/collaboration/operational-sync";
import { NarrativeSummary, RealEngagementTrend, RealKpis, SourceNotice, type LiveData } from "@/components/operations/operational-surfaces";
import { OperationalKpis } from "@/reporting/executive-reporting";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { resultMeasures } from "@/lib/playbook/harika-playbook";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const data = await getProductExperience();
  const liveData = data.available && data.analytics ? data as LiveData : undefined;

  return (
    <PlaybookShell
      eyebrow="Results / Growth measurement"
      title="Measure patient access and trust, not just post engagement."
      description="The operational foundation records campaign throughput and approval outcomes. Stored social measurements are shown with provenance; tenant-specific discovery and appointment intent require verified channel mapping."
    >
      <OperationalSyncProvider />
      <div className="space-y-5">
        <SourceNotice data={data} />
        {liveData && (
          <>
            <RealKpis data={liveData} />
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <RealEngagementTrend data={liveData} />
              <NarrativeSummary data={liveData} />
            </div>
          </>
        )}
        <Panel className="p-5">
          <SectionHeader title="Operational results already supported" description="Campaign and approval metrics from the retained VIP execution layer" action={<StatusIndicator label="Foundation active" tone="success" />} />
          <OperationalKpis />
        </Panel>
        <Panel className="p-5">
          <SectionHeader title="Full measurement framework" description="The metrics that distinguish a growth system from a post generator" />
          <div className="grid gap-4 md:grid-cols-2">
            {resultMeasures.map((group) => (
              <article key={group.label} className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  <h2 className="font-semibold">{group.label}</h2>
                </div>
                <div className="mt-4 space-y-2">
                  {group.measures.map((measure) => (
                    <div key={measure} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                      <span>{measure}</span>
                      <StatusIndicator label={group.label === "Execution" ? "Tracked" : "Verify connector"} tone={group.label === "Execution" ? "success" : "neutral"} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <BarChart3 className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Recommendation outcomes</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Campaign decisions should eventually report whether the recommendation produced qualified reach, inquiries or access outcomes.</p>
          </Panel>
          <Panel className="p-5">
            <Link2 className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Connections to add</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Google Business Profile actions, website conversion events, call/WhatsApp attribution and outreach referral tracking.</p>
          </Panel>
        </div>
      </div>
    </PlaybookShell>
  );
}
