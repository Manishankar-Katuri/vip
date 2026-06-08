"use client";

import { Activity, AlertTriangle, Bot, Building2, CheckCircle2, ClipboardCheck, Clock3, UploadCloud } from "lucide-react";
import { Button, DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import { useOperationalStore } from "@/state/operational-store";

export function HospitalPortfolioGrid({ connectedName, engagement }: { connectedName: string; engagement: string }) {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const awaiting = campaigns.filter((item) => item.stage === "doctor-approval").length;
  const hospitals = [
    { name: connectedName, engagement, growth: "+8.4%", reputation: "Strong", backlog: awaiting, tone: "success" as const },
    { name: "Eastview Women's Hospital", engagement: "4.08%", growth: "+2.1%", reputation: "Stable", backlog: 5, tone: "warning" as const },
    { name: "Silver Oak Cardiac Centre", engagement: "3.74%", growth: "+4.9%", reputation: "Improving", backlog: 1, tone: "info" as const },
  ];
  return (
    <Panel className="p-4">
      <SectionHeader title="Hospital portfolio" description="Engagement rank, reputation signal and approval demand" />
      <div className="grid gap-3 md:grid-cols-3">
        {hospitals.map((hospital, index) => (
          <article key={hospital.name} className="rounded-lg border bg-background p-3">
            <div className="flex justify-between gap-2">
              <Building2 className="size-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Rank {index + 1}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{hospital.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Engagement" value={hospital.engagement} />
              <Metric label="Growth" value={hospital.growth} />
              <Metric label="Reputation" value={hospital.reputation} />
              <Metric label="Backlog" value={String(hospital.backlog)} />
            </div>
            <div className="mt-3"><StatusIndicator label={hospital.backlog > 3 ? "Attention needed" : "On track"} tone={hospital.tone} /></div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ProductionTeamOversight() {
  const campaigns = useOperationalStore((state) => state.campaigns);
  const review = campaigns.filter((item) => item.stage === "review").length;
  const approval = campaigns.filter((item) => item.stage === "doctor-approval").length;
  const scheduled = campaigns.filter((item) => item.stage === "scheduled").length;
  const published = campaigns.filter((item) => item.stage === "published").length;
  return (
    <Panel className="p-4">
      <SectionHeader title="Production team oversight" description="Workflow throughput and bottlenecks" />
      <div className="grid gap-3 sm:grid-cols-4">
        <Oversight label="In review" value={review} tone="info" />
        <Oversight label="Approval wait" value={approval} tone="warning" />
        <Oversight label="Scheduled" value={scheduled} tone="success" />
        <Oversight label="Published" value={published} tone="success" />
      </div>
      <div className="mt-3 rounded-lg border bg-background p-3">
        <p className="text-sm font-medium">Bottleneck monitor</p>
        <p className="mt-1 text-sm text-muted-foreground">{approval ? `${approval} clinical review item is awaiting a doctor decision.` : "No stalled clinical reviews detected."}</p>
      </div>
    </Panel>
  );
}

export function AutomationMonitor() {
  const activity = useOperationalStore((state) => state.activity);
  return (
    <Panel className="p-4">
      <SectionHeader title="Automation monitoring" description="Publishing orchestration and queue health" action={<StatusIndicator label="Operational" tone="success" />} />
      <div className="space-y-2">
        <Service icon={<Activity />} label="Approval reminder workflow" status="Running" detail="Next check in 14 minutes" tone="success" />
        <Service icon={<Clock3 />} label="Publishing queue" status="1 pending" detail="Approved post scheduled for evening slot" tone="info" />
        <Service icon={<AlertTriangle />} label="Asset validation retry" status="Recovered" detail="One retry completed without escalation" tone="warning" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{activity.length} workflow events visible in the operational timeline.</p>
    </Panel>
  );
}

export function AIOversight({ recommendations }: { recommendations: number }) {
  return (
    <Panel className="p-4">
      <SectionHeader title="AI oversight" description="Assistive recommendation activity and governance" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Recommendations" value={String(recommendations)} />
        <Metric label="Review confidence" value="88%" />
        <Metric label="Pending human action" value="2" />
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/12 bg-info/30 p-3">
        <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-5 text-muted-foreground">Recommendations expose measured evidence and require production or clinical review before publication.</p>
      </div>
    </Panel>
  );
}

export function OperationalHeatmap() {
  const cells = [
    ["Campaign response", 4, 3, 4, 5, 4],
    ["Hospital activity", 3, 2, 4, 4, 5],
    ["Approval velocity", 5, 3, 2, 4, 4],
    ["Engagement", 3, 4, 4, 5, 5],
  ] as const;
  return (
    <Panel className="p-4">
      <SectionHeader title="Operational heatmap" description="Relative operational movement this week" />
      <div className="space-y-3">
        <div className="grid grid-cols-[minmax(110px,1fr)_repeat(5,44px)] gap-2 text-center text-xs text-muted-foreground">
          <span />
          {["Thu", "Fri", "Sat", "Sun", "Mon"].map((day) => <span key={day}>{day}</span>)}
        </div>
        {cells.map(([label, ...values]) => (
          <div key={label} className="grid grid-cols-[minmax(110px,1fr)_repeat(5,44px)] items-center gap-2">
            <p className="text-xs font-medium">{label}</p>
            {values.map((value, index) => (
              <span
                key={`${label}-${index}`}
                aria-label={`${label} level ${value}`}
                className={cn("h-9 rounded-md", value >= 5 ? "bg-primary/70" : value === 4 ? "bg-primary/45" : value === 3 ? "bg-primary/25" : "bg-muted")}
              />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function StaffTaskTracker() {
  const tasks = useOperationalStore((state) => state.staffTasks);
  const submit = useOperationalStore((state) => state.submitTask);
  const complete = useOperationalStore((state) => state.completeTask);

  return (
    <Panel className="p-4">
      <SectionHeader title="Assigned clinic tasks" description="Simple actions supporting approved patient communication" />
      <div className="space-y-2" aria-live="polite">
        {tasks.map((task) => (
          <article key={task.id} className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {task.completed ? <CheckCircle2 className="mt-0.5 size-5 text-success" /> : <ClipboardCheck className="mt-0.5 size-5 text-primary" />}
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.due}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIndicator label={task.status} tone={task.status === "Complete" ? "success" : task.status === "Submitted" ? "info" : "warning"} />
              {task.status === "Assigned" && <Button size="lg" onClick={() => submit(task.id)}>Submit</Button>}
              {task.status === "Submitted" && <Button size="lg" variant="outline" onClick={() => complete(task.id)}>Mark done</Button>}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function StaffRequests() {
  return (
    <Panel className="p-4">
      <SectionHeader title="Upload requests" description="Requested by the production team" />
      <div className="rounded-lg border bg-background p-3">
        <div className="flex gap-3">
          <UploadCloud className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Updated clinic exterior and hours signage</p>
            <DetailDisclosure label="Reason" className="mt-2">Needed for local listing and appointment guidance campaign.</DetailDisclosure>
            <div className="mt-3"><StatusIndicator label="Pending upload" tone="warning" /></div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Oversight({ label, value, tone }: { label: string; value: number; tone: "info" | "warning" | "success" }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <StatusIndicator label="Items" tone={tone} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Service({ icon, label, status, detail, tone }: { icon: React.ReactNode; label: string; status: string; detail: string; tone: "success" | "warning" | "info" }) {
  return (
    <div className="flex gap-2 rounded-lg border bg-background p-2.5">
      <span className="[&_svg]:size-4 text-primary">{icon}</span>
      <div className="flex-1">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          <StatusIndicator label={status} tone={tone} />
        </div>
        <DetailDisclosure label="Detail" className="mt-2">{detail}</DetailDisclosure>
      </div>
    </div>
  );
}
