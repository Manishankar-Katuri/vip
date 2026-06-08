import { Activity, ShieldCheck } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { OperationalSyncProvider, LiveStatus } from "@/collaboration/operational-sync";
import { DoctorApprovalCenter } from "@/components/approvals/doctor-approval-center";
import { OperationalCalendar } from "@/calendars/operational-calendar";
import { WorkflowJourney } from "@/components/workflows/workflow-journey";
import { Panel, SectionHeader } from "@/design-system/primitives";

export default function GovernancePage() {
  return (
    <PlaybookShell
      eyebrow="Governance / Human decision layer"
      title="Clinical review remains part of every patient-facing growth action."
      description="This is the visible bridge to the retained VIP foundation: approvals, versioned workflows and controlled scheduling remain active inside each tenant playbook."
    >
      <OperationalSyncProvider />
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="Governance standard" description="The playbook remains clinically supervised and operationally traceable" action={<LiveStatus />} />
          <div className="grid gap-3 md:grid-cols-3">
            <Rule icon={<ShieldCheck />} title="Clinical sign-off" detail="Health guidance is reviewed before patient-facing publication." />
            <Rule icon={<Activity />} title="Workflow trail" detail="Actions and decisions are retained as operational events." />
            <Rule icon={<ShieldCheck />} title="Controlled release" detail="Scheduling becomes available only after approval." />
          </div>
        </Panel>
        <WorkflowJourney />
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <DoctorApprovalCenter />
          <OperationalCalendar />
        </div>
      </div>
    </PlaybookShell>
  );
}

function Rule({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}
