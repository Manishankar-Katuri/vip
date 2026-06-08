import { Crosshair, Search, ShieldCheck, Users } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { SourcesPanel, StageRow } from "@/components/playbook/playbook-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { growthPillars, hospitalProfile } from "@/lib/playbook/harika-playbook";

export default function GrowthPlanPage() {
  return (
    <PlaybookShell
      eyebrow="Strategy / Current tenant"
      title="An ENT growth plan grounded in trust, access and measurable action."
      description={`${hospitalProfile.name} is the first active client workspace in a multi-tenant platform. Its Hyderabad strategy is scoped to its verified centres and remains subject to clinical governance.`}
    >
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="Verified tenant foundation" description="Facts and guardrails that each tenant-scoped campaign should inherit" action={<StatusIndicator label="Current client" tone="info" />} />
          <div className="grid gap-3 md:grid-cols-3">
            <Fact icon={<Crosshair />} label="Focus" value={hospitalProfile.specialty} />
            <Fact icon={<Users />} label="Audience" value="Patients, families and referrers in Hyderabad" />
            <Fact icon={<ShieldCheck />} label="Approval rule" value="Doctor review before clinical publication" />
          </div>
          <div className="mt-4 rounded-xl bg-muted/45 p-4">
            <p className="text-sm font-medium">Positioning promise</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{hospitalProfile.promise}</p>
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionHeader title="Three growth pillars" description="Planning outcomes instead of collecting disconnected post ideas" />
          <div className="grid gap-4 lg:grid-cols-3">
            {growthPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-xl border bg-background p-4">
                <Search className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.objective}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {pillar.actions.map((action) => <li key={action} className="rounded-lg bg-muted/40 p-2.5">{action}</li>)}
                </ul>
                <p className="mt-4 text-xs font-medium text-primary">Measure: {pillar.outcome}</p>
              </article>
            ))}
          </div>
        </Panel>
        <StageRow />
        <SourcesPanel />
      </div>
    </PlaybookShell>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}
