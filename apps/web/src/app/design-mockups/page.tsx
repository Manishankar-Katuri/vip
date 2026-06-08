import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Megaphone,
  MonitorCheck,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";

type Mockup = {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  metrics: Array<{ label: string; value: string; state: Tone }>;
  lanes: Array<{ label: string; count: string; icon: LucideIcon }>;
  features: string[];
};

const mockups: Mockup[] = [
  {
    title: "Landing Page",
    subtitle: "Healthcare growth operating system with clear entry points for setup, demo, and role workspaces.",
    href: "/",
    icon: MonitorCheck,
    tone: "info",
    metrics: [
      { label: "Role hubs", value: "4", state: "success" },
      { label: "Proof states", value: "5", state: "info" },
      { label: "Core journeys", value: "Live", state: "success" },
    ],
    lanes: [
      { label: "Problem", count: "01", icon: Search },
      { label: "Roles", count: "04", icon: Users },
      { label: "Proof", count: "05", icon: ShieldCheck },
    ],
    features: ["Hero with product signal", "Role cards", "Intelligence loop", "Readiness proof", "Conversion CTAs"],
  },
  {
    title: "Admin Workspace",
    subtitle: "Portfolio command centre for hospitals, users, integrations, workflow health, and AI operations.",
    href: "/admin",
    icon: Building2,
    tone: "neutral",
    metrics: [
      { label: "Hospitals", value: "1+", state: "success" },
      { label: "Risks", value: "4", state: "warning" },
      { label: "Build gate", value: "API", state: "danger" },
    ],
    lanes: [
      { label: "Onboard", count: "03", icon: Building2 },
      { label: "Govern", count: "RBAC", icon: ShieldCheck },
      { label: "Observe", count: "Live", icon: BarChart3 },
    ],
    features: ["Hospital portfolio", "RBAC and invites", "Integration health", "Audit trail", "Failed-feature visibility"],
  },
  {
    title: "Doctor Workspace",
    subtitle: "Decision desk for clinical approvals, reputation momentum, morning briefing, and safe wording review.",
    href: "/doctor",
    icon: HeartPulse,
    tone: "success",
    metrics: [
      { label: "Approvals", value: "3", state: "warning" },
      { label: "Risk", value: "Med", state: "warning" },
      { label: "Evidence", value: "Ready", state: "success" },
    ],
    lanes: [
      { label: "Brief", count: "AM", icon: HeartPulse },
      { label: "Review", count: "03", icon: ClipboardCheck },
      { label: "Approve", count: "Safe", icon: CheckCircle2 },
    ],
    features: ["Morning briefing", "Approve/request changes", "Evidence panel", "Risk flags", "Leadership reports"],
  },
  {
    title: "Production Workspace",
    subtitle: "Throughput board for calendar, scripts, campaigns, media, approvals, publishing, and measurement.",
    href: "/production",
    icon: Megaphone,
    tone: "info",
    metrics: [
      { label: "Pipeline", value: "18", state: "success" },
      { label: "Scripts", value: "6", state: "info" },
      { label: "Blocked", value: "2", state: "warning" },
    ],
    lanes: [
      { label: "Plan", count: "AI", icon: Sparkles },
      { label: "Produce", count: "18", icon: FileText },
      { label: "Measure", count: "Live", icon: RadioTower },
    ],
    features: ["Content calendar", "Script studio", "Campaign manager", "Media library", "Recommendation handoff"],
  },
  {
    title: "Staff Workspace",
    subtitle: "Simple worklist for clinic tasks, uploads, requests, approvals support, and blockers.",
    href: "/staff",
    icon: UploadCloud,
    tone: "warning",
    metrics: [
      { label: "Tasks", value: "7", state: "info" },
      { label: "Uploads", value: "3", state: "info" },
      { label: "Blocked", value: "2", state: "warning" },
    ],
    lanes: [
      { label: "Request", count: "05", icon: ClipboardCheck },
      { label: "Upload", count: "03", icon: UploadCloud },
      { label: "Clear", count: "Done", icon: CheckCircle2 },
    ],
    features: ["Task queue", "Asset upload", "Production requests", "Status proof", "Clinic handoffs"],
  },
];

export default function DesignMockupsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Visual mockup board</p>
              <h1 className="mt-3 text-balance text-4xl font-semibold sm:text-5xl">Five connected screens before full data wiring.</h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                This is the in-app equivalent of the paper and Stitch pass: one design language, five primary surfaces, and visible live-output states.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/">
                  Open landing
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/production">Open role hub</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <Panel className="p-5">
          <SectionHeader
            title="Design system contract"
            description="Every role page uses the same primitives: command hero, state badges, action queue, workflow pulse, and evidence cards."
            action={<StatusIndicator label="Connected mockups" tone="success" />}
          />
          <div className="grid gap-3 md:grid-cols-5">
            {[
              ["ready", "Live data available", "success"],
              ["empty", "No records yet", "neutral"],
              ["degraded", "Needs integration attention", "warning"],
              ["mock", "Demo fallback visible", "info"],
              ["error", "Failure surfaced", "danger"],
            ].map(([label, text, tone]) => (
              <div key={label} className="rounded-lg border bg-background p-3">
                <StatusIndicator label={label} tone={tone as Tone} />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          {mockups.map((mockup) => (
            <MockupCard key={mockup.title} mockup={mockup} />
          ))}
        </div>
      </section>
    </main>
  );
}

function MockupCard({ mockup }: { mockup: Mockup }) {
  const Icon = mockup.icon;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b bg-muted/45 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{mockup.title}</h2>
                <StatusIndicator label="Visual ready" tone={mockup.tone} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{mockup.subtitle}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={mockup.href}>
              Open
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {mockup.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              <div className="mt-2">
                <StatusIndicator label="state" tone={metric.state} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {mockup.lanes.map((lane) => {
            const LaneIcon = lane.icon;
            return (
              <div key={lane.label} className="rounded-lg bg-info/35 p-3">
                <LaneIcon className="size-4 text-primary" aria-hidden />
                <p className="mt-3 text-xs font-medium text-muted-foreground">{lane.label}</p>
                <p className="mt-1 text-lg font-semibold">{lane.count}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {mockup.features.map((feature) => (
            <span key={feature} className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}
