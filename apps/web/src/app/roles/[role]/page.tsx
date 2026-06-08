"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, StatusIndicator } from "@/design-system/primitives";
import { EvidenceCard, MetricStory, SpatialIntelligenceVisual } from "@/components/intelligence-os";

type RoleSlug = "marketing" | "doctor" | "operations";

const rolePages = {
  marketing: {
    title:"Marketing intelligence workspace",
    eyebrow:"Production / marketing team",
    summary:"A creative and analytical workspace for content strategy, campaigns, publishing readiness, social intelligence, and measurable learning.",
    appRole:"Maps to Production",
    icon:Megaphone,
    href:"/production",
    pillars:[
      ["Content strategy", "Translate market and reputation signals into approved campaign briefs.", Sparkles],
      ["Campaign execution", "Move scripts, calendars, media, and publishing work through governed workflows.", Workflow],
      ["Social learning", "Understand what formats, doctors, and topics are creating momentum.", BarChart3],
    ],
    evidence:[
      ["AI recommendations", "The next best content move is ranked by confidence and context."],
      ["Approval readiness", "Clinical sign-off is visible before publishing decisions."],
      ["Performance story", "Analytics explain trend movement and what to test next."],
    ],
  },
  doctor: {
    title:"Doctor AI briefing workspace",
    eyebrow:"Doctor / clinical leadership",
    summary:"A clean leadership surface for morning briefing, reputation intelligence, approvals, and patient-growth decisions that need clinical judgment.",
    appRole:"Maps to Doctor",
    icon:Brain,
    href:"/doctor",
    pillars:[
      ["Morning briefing", "Start with what changed, why it matters, and what needs clinical attention.", Brain],
      ["Reputation signals", "See patient trust themes without exposing patient-identifying content.", ShieldCheck],
      ["Approval decisions", "Review campaigns and content with clinical governance built in.", CheckCircle2],
    ],
    evidence:[
      ["Clinical decision brief", "AI explains growth opportunities in leadership language."],
      ["Reputation risk", "Themes, freshness, and response readiness stay visible."],
      ["Approval queue", "Doctor decisions are separated from production execution clutter."],
    ],
  },
  operations: {
    title:"Operations execution workspace",
    eyebrow:"Operations / staff team",
    summary:"A focused workspace for tasks, uploads, requests, follow-ups, and workflow handoffs that keep intelligence moving into execution.",
    appRole:"Maps to Staff / Operations",
    icon:CalendarCheck,
    href:"/staff",
    pillars:[
      ["Task clarity", "Show only the execution items staff can complete now.", CalendarCheck],
      ["Request flow", "Keep uploads, campaign requests, and clinic confirmations organized.", Workflow],
      ["Automation support", "Human exceptions and handoffs are clear when automation needs help.", Bot],
    ],
    evidence:[
      ["Work-now queue", "Operational tasks are grouped by due date, blocker, and owner."],
      ["Handoff visibility", "Staff can see what changed without entering restricted intelligence areas."],
      ["Execution feedback", "Completed work feeds back into the next AI brief."],
    ],
  },
} satisfies Record<RoleSlug, {
  title:string;
  eyebrow:string;
  summary:string;
  appRole:string;
  icon:LucideIcon;
  href:string;
  pillars:Array<[string, string, LucideIcon]>;
  evidence:Array<[string, string]>;
}>;

export default function RolePage({ params }: { params:Promise<{ role:string }> }) {
  const { role: roleParam } = use(params);
  const role = roleParam as RoleSlug;
  const content = rolePages[role];

  useEffect(() => {
    if (roleParam === "owner") {
      window.location.replace("/admin");
    }
  }, [roleParam]);

  if (roleParam === "owner") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-[var(--shadow-surface)]">
          <h1 className="text-xl font-semibold">Owner role moved to Administration</h1>
          <p className="mt-2 text-sm text-muted-foreground">VIP v3 removes the Owner role. Management workflows now live in the Administration workspace.</p>
          <Button asChild className="mt-4">
            <Link href="/admin">Open Administration</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-[var(--shadow-surface)]">
          <h1 className="text-xl font-semibold">Role page unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">This role workspace has not been defined.</p>
          <Button asChild className="mt-4">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </main>
    );
  }

  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">VIP</span>
            Intelligence OS
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/overview">Open overview</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-14">
        <div className="self-center">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={content.eyebrow} tone="info" />
            <StatusIndicator label={content.appRole} tone="neutral" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border bg-card text-primary shadow-[var(--shadow-surface)]">
              <Icon className="size-5" aria-hidden />
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{content.title}</h1>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{content.summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={content.href}>
                Enter workspace
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/request-setup">Request setup</Link>
            </Button>
          </div>
        </div>
        <SpatialIntelligenceVisual />
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {content.pillars.map(([title, detail, PillarIcon]) => (
            <article key={title} className="rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-surface)]">
              <PillarIcon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[var(--shadow-surface)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Experience model</p>
            <h2 className="mt-2 text-xl font-semibold">Designed around decisions, not modules.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This role page defines what the workspace should prioritize: speed, clarity, evidence, permissions, and actionability for the person using it.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricStory label="Primary surface" value="AI brief" detail="Summaries lead, dashboards support." icon={Sparkles} />
              <MetricStory label="Navigation" value="Scoped" detail="Only permitted workflows appear." icon={ShieldCheck} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {content.evidence.map(([title, detail], index) => (
              <EvidenceCard key={title} label={`pattern ${index + 1}`} title={title} detail={detail} status={index === 1 ? "live" : "ready"} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
