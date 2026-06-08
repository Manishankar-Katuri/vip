"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarCheck,
  LineChart,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, StatusIndicator } from "@/design-system/primitives";
import { EvidenceCard, MetricStory, SpatialIntelligenceVisual } from "@/components/intelligence-os";

const intelligenceAreas = [
  {
    title:"Social intelligence",
    detail:"Understand doctor-led content performance, audience movement, and reputation pull.",
    icon:Megaphone,
  },
  {
    title:"Market intelligence",
    detail:"Track local demand, competitor pressure, and care-category opportunities.",
    icon:BarChart3,
  },
  {
    title:"Growth strategy",
    detail:"Turn signals into priorities, campaigns, and measurable execution plans.",
    icon:Target,
  },
  {
    title:"Automation control",
    detail:"Summarize workflow execution, exceptions, approvals, and next actions.",
    icon:Workflow,
  },
];

const roleCards = [
  {
    title:"Admin",
    href:"/roles/admin",
    eyebrow:"Administration",
    detail:"Operational control, hospital workspaces, intelligence modules, permissions, reports, and governance.",
    icon:ShieldCheck,
  },
  {
    title:"Marketing",
    href:"/roles/marketing",
    eyebrow:"Production",
    detail:"Campaign intelligence, content plans, social performance, and governed publishing workflows.",
    icon:Megaphone,
  },
  {
    title:"Doctor",
    href:"/roles/doctor",
    eyebrow:"Clinical leadership",
    detail:"Morning briefings, approvals, reputation signals, and patient growth opportunities.",
    icon:Brain,
  },
  {
    title:"Operations",
    href:"/roles/operations",
    eyebrow:"Execution",
    detail:"Task queues, requests, handoffs, and operational intelligence for clinic teams.",
    icon:CalendarCheck,
  },
] satisfies Array<{ title:string; href:string; eyebrow:string; detail:string; icon:LucideIcon }>;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">VIP</span>
            <span className="text-sm font-semibold">Vertical Intelligence Platform</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="#intelligence" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Intelligence</Link>
            <Link href="#roles" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Roles</Link>
            <Link href="/overview" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Overview</Link>
          </nav>
          <Button asChild size="sm">
            <Link href="/request-setup">Start setup</Link>
          </Button>
        </div>
      </header>

      <section className="border-b border-border/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-16">
          <div className="min-w-0 self-center">
            <StatusIndicator label="AI-powered hospital growth OS" tone="info" />
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Intelligence command center for hospitals that want faster growth decisions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              VIP connects analytics, market signals, strategy, recommendations, automation, and role permissions into one AI-native operating system for hospital growth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/overview">
                  Open command center
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin">Explore workspaces</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border bg-card px-2 py-1">Press Ctrl/Cmd+K anywhere</span>
              <span className="rounded-md border bg-card px-2 py-1">Permission-aware workspaces</span>
              <span className="rounded-md border bg-card px-2 py-1">Evidence-first AI briefs</span>
            </div>
          </div>
          <SpatialIntelligenceVisual />
        </div>
      </section>

      <section id="intelligence" className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Intelligence system</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboards become evidence, not the destination.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            VIP surfaces the decision first, then lets leadership drill into the metrics, source freshness, confidence, and workflow trail.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {intelligenceAreas.map((area) => (
            <FeatureCard key={area.title} {...area} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <MetricStory label="Reputation velocity" value="+18%" detail="Trend cards explain the why before exposing raw charts." icon={LineChart} />
          <MetricStory label="Action confidence" value="87%" detail="Recommendations carry confidence, evidence, and next workflow." icon={Sparkles} />
          <MetricStory label="Approval readiness" value="3 due" detail="Clinical and production queues stay visible without noise." icon={ShieldCheck} />
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/55">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">AI agents</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Human and AI collaboration, designed for governed healthcare work.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Strategy, analytics, recommendation, and automation agents operate as explainable collaborators. Every suggestion stays attached to evidence, owner, and permission boundary.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <EvidenceCard label="strategy agent" title="Find the next growth angle" detail="Compares social, reputation, competitor, and market signals before proposing action." status="ready" />
            <EvidenceCard label="analytics agent" title="Tell the metric story" detail="Summarizes trend movement and points leaders to the supporting chart." status="live" />
            <EvidenceCard label="recommendation agent" title="Rank the next best action" detail="Connects confidence, impact, and effort so teams can decide faster." status="ready" />
            <EvidenceCard label="automation agent" title="Move approved work forward" detail="Tracks execution, exceptions, and workflow handoffs without hiding failures." status="degraded" />
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Role workspaces</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Each user sees the intelligence they can act on.</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/overview">View adaptive overview</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {roleCards.map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-[linear-gradient(135deg,var(--primary),oklch(0.36_0.08_253))] p-6 text-primary-foreground shadow-[var(--shadow-raised)] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Run hospital growth as an intelligence system.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/80">
                Replace static reporting with an AI command center that clarifies what changed, why it matters, and what the team should do next.
              </p>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/request-setup">
                Request setup
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, detail, icon: Icon }: { title:string; detail:string; icon:LucideIcon }) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-surface)]">
      <Icon className="size-5 text-primary" aria-hidden />
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function RoleCard({ title, href, eyebrow, detail, icon: Icon }: (typeof roleCards)[number]) {
  return (
    <Link href={href} className="group rounded-xl border border-border/70 bg-card p-5 shadow-[var(--shadow-surface)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-10 items-center justify-center rounded-lg border bg-background text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </Link>
  );
}
