"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  CircleDot,
  FileText,
  Gauge,
  LineChart,
  LockKeyhole,
  Search,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  StatusIndicator,
} from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import { cn } from "@/lib/utils";
import type { Permission } from "@/permissions-core";
import { getNavigationForPermissions } from "@/navigation/permission-navigation";

export type IntelligenceStatus = "live" | "fallback" | "empty" | "degraded" | "ready";

const statusTone: Record<IntelligenceStatus, Tone> = {
  live: "success",
  ready: "success",
  fallback: "warning",
  degraded: "warning",
  empty: "neutral",
};

const commandItems = [
  { label: "Admin home", href: "/admin", area: "Workspace", icon: LockKeyhole },
  { label: "Morning briefing", href: "/today", area: "Workspace", icon: Gauge },
  { label: "Analytics", href: "/analytics", area: "Workspace", icon: BarChart3 },
  { label: "Admin reports", href: "/admin/reports", area: "Report", icon: FileText },
  { label: "Marketing intelligence", href: "/roles/marketing", area: "Role", icon: Target },
  { label: "Doctor briefing", href: "/roles/doctor", area: "Role", icon: Brain },
  { label: "Operations workspace", href: "/roles/operations", area: "Role", icon: Workflow },
  { label: "Production hub", href: "/production", area: "Workspace", icon: Bot },
  { label: "Executive growth report", href: "/admin/executive-growth-report", area: "Report", icon: FileText },
  { label: "Request setup", href: "/request-setup", area: "Public", icon: ArrowRight },
];

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    function onOpenPalette() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("vip:open-command-palette", onOpenPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("vip:open-command-palette", onOpenPalette);
    };
  }, []);

  const filteredItems = commandItems.filter((item) => {
    const searchText = `${item.label} ${item.area}`.toLowerCase();
    return searchText.includes(query.toLowerCase().trim());
  });

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className="overflow-hidden border-border/70 p-0 shadow-[var(--shadow-command)] sm:max-w-2xl" showCloseButton={false}>
        <ModalHeader className="sr-only">
          <ModalTitle>Command palette</ModalTitle>
          <ModalDescription>Search VIP routes and command center actions.</ModalDescription>
        </ModalHeader>
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search intelligence, roles, reports..."
            className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted/70"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border bg-card text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.area}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No command found.</p>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

export function CommandCenterHero({
  eyebrow,
  title,
  summary,
  meta,
  status = "live",
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  meta: string;
  status?: IntelligenceStatus;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border/65 bg-[linear-gradient(135deg,var(--card),var(--muted))] p-4 shadow-[var(--shadow-surface)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={eyebrow} tone="info" />
            <StatusIndicator label={status} tone={statusTone[status]} />
            <span className="text-xs text-muted-foreground">{meta}</span>
          </div>
          <h1 className="mt-4 max-w-4xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {summary}
          </p>
          {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
        </div>
        <SpatialIntelligenceVisual compact />
      </div>
    </section>
  );
}

export function DecisionQueue({ actions }: { actions: Array<{ id: string; label: string; detail: string; href: string; priority: "HIGH" | "MEDIUM" | "LOW" }> }) {
  return (
    <section className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Decision queue</p>
          <h2 className="mt-1 text-lg font-semibold">Next best moves</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ranked from the modules available to the current user.</p>
        </div>
        <StatusIndicator label={`${actions.length} actions`} tone={actions.length ? "info" : "neutral"} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {actions.length ? actions.map((action, index) => (
          <Link
            key={action.id}
            href={action.href}
            className="group rounded-lg border border-border/70 bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-raised)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
              <StatusIndicator label={action.priority.toLowerCase()} tone={action.priority === "HIGH" ? "warning" : "info"} />
            </div>
            <h3 className="mt-4 text-sm font-semibold leading-5">{action.label}</h3>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{action.detail}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Open workflow <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        )) : (
          <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground lg:col-span-3">
            No urgent action is available right now. VIP will surface decisions here as live signals or AI recommendations become available.
          </div>
        )}
      </div>
    </section>
  );
}

export function IntelligenceLane({
  title,
  description,
  icon: Icon,
  status = "ready",
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: IntelligenceStatus;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
        <StatusIndicator label={status} tone={statusTone[status]} />
      </div>
      {children}
    </section>
  );
}

export function EvidenceCard({
  label,
  title,
  detail,
  status = "ready",
  href,
  metric,
  tone,
}: {
  label: string;
  title: string;
  detail: string;
  status?: IntelligenceStatus;
  href?: string;
  metric?: string;
  tone?: Tone;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <StatusIndicator label={label} tone={tone ?? statusTone[status]} />
        {metric && <span className="font-mono text-xl font-semibold tracking-tight">{metric}</span>}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-5">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
          Review evidence <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group rounded-lg border border-border/70 bg-background p-3 transition hover:border-primary/40 hover:bg-muted/30">
        {content}
      </Link>
    );
  }

  return <article className="rounded-lg border border-border/70 bg-background p-3">{content}</article>;
}

export function MetricStory({ label, value, detail, icon: Icon = LineChart }: { label: string; value: string; detail: string; icon?: LucideIcon }) {
  return (
    <article className="rounded-lg border border-border/70 bg-background p-3">
      <Icon className="size-4 text-primary" aria-hidden />
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}

export function InsightTimeline({ items }: { items: Array<{ title: string; detail: string; tone?: Tone }> }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="grid grid-cols-[1.5rem_1fr] gap-3">
          <span className="mt-1 flex size-6 items-center justify-center rounded-full border bg-background text-primary">
            <CircleDot className="size-3.5" aria-hidden />
          </span>
          <div className="rounded-lg border border-border/70 bg-background p-3">
            <StatusIndicator label={index === 0 ? "now" : "signal"} tone={item.tone ?? "info"} />
            <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PermissionAwareNav({ permissions }: { permissions: string[] }) {
  const items = getNavigationForPermissions(permissions as Permission[]);

  return (
    <section className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Permission map</p>
          <h2 className="mt-1 text-base font-semibold">Available intelligence</h2>
        </div>
        <StatusIndicator label={`${items.length} routes`} tone="info" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={`${item.href}-${item.permission}`} href={item.href} className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-muted/35">
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.module}</span>
            </span>
            <LockKeyhole className="size-3.5 text-muted-foreground transition group-hover:text-primary" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SpatialIntelligenceVisual({ compact = false }: { compact?: boolean }) {
  const nodes = useMemo(() => [
    { label: "Signals", x: 22, y: 30, icon: BarChart3 },
    { label: "AI Brief", x: 50, y: 18, icon: Sparkles },
    { label: "Decisions", x: 78, y: 36, icon: Target },
    { label: "Automation", x: 61, y: 68, icon: Bot },
    { label: "Evidence", x: 28, y: 70, icon: CheckCircle2 },
  ], []);

  return (
    <div className={cn("relative min-h-[260px] overflow-hidden rounded-xl border border-border/60 bg-background/80 p-4", compact && "min-h-[220px]")}>
      <div className="absolute inset-4 rounded-[2rem] border border-primary/10" aria-hidden />
      <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-primary/5 shadow-[0_0_80px_rgb(32_91_155_/_0.16)]" aria-hidden />
      <svg className="absolute inset-0 h-full w-full text-primary/25" viewBox="0 0 100 90" aria-hidden>
        <path d="M22 30 L50 18 L78 36 L61 68 L28 70 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <path d="M50 18 L61 68 M22 30 L78 36 M28 70 L78 36" fill="none" stroke="currentColor" strokeWidth="0.45" strokeDasharray="2 2" />
      </svg>
      {nodes.map((node) => {
        const Icon = node.icon;
        return (
          <div
            key={node.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card/95 px-2.5 py-2 shadow-[var(--shadow-surface)]"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-medium">{node.label}</span>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-3 left-3 right-3 rounded-lg border bg-card/95 p-3">
        <p className="text-xs font-semibold text-foreground">Hospital growth intelligence graph</p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Signals become decisions, decisions become governed workflows, and workflows feed the next brief.</p>
      </div>
    </div>
  );
}

export function ContextTabs({
  items,
}: {
  items:Array<{ label:string; href:string; active?:boolean }>;
}) {
  return (
    <nav aria-label="Context navigation" className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-border/65 bg-card p-1 shadow-[var(--shadow-surface)] sm:min-w-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              item.active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AICollaborationPanel({
  title,
  summary,
  prompts,
  status = "ready",
}: {
  title:string;
  summary:string;
  prompts:string[];
  status?:IntelligenceStatus;
}) {
  return (
    <section className="rounded-xl border border-primary/20 bg-[linear-gradient(135deg,var(--card),var(--info))] p-4 shadow-[var(--shadow-surface)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">AI collaborator</p>
            <h2 className="mt-1 text-base font-semibold">{title}</h2>
          </div>
        </div>
        <StatusIndicator label={status} tone={statusTone[status]} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{summary}</p>
      <div className="mt-4 grid gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-card"
          >
            <span>{prompt}</span>
            <ArrowRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}

export function AutomationSummary({
  items,
}: {
  items:Array<{ label:string; value:string; detail:string; status?:IntelligenceStatus }>;
}) {
  return (
    <section className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Automation layer</p>
          <h2 className="mt-1 text-base font-semibold">Execution health</h2>
        </div>
        <Bot className="size-4 text-primary" aria-hidden />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-lg border border-border/70 bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <StatusIndicator label={item.status ?? "ready"} tone={statusTone[item.status ?? "ready"]} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MotionReveal({ children, className }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={cn("motion-reveal", className)}>
      {children}
    </div>
  );
}
