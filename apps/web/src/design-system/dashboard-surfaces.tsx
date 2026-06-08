import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import { cn } from "@/lib/utils";

export type SurfaceState = "ready" | "empty" | "degraded" | "mock" | "error";

export const surfaceTone: Record<SurfaceState, Tone> = {
  ready: "success",
  empty: "neutral",
  degraded: "warning",
  mock: "info",
  error: "danger",
};

export const surfaceLabel: Record<SurfaceState, string> = {
  ready: "Live",
  empty: "Empty",
  degraded: "Degraded",
  mock: "Mock",
  error: "Error",
};

export type IntelligenceMetric = {
  label: string;
  value: string;
  detail: string;
  state: SurfaceState;
  icon: LucideIcon;
};

export type IntelligenceAction = {
  title: string;
  detail: string;
  owner: string;
  due: string;
  state: SurfaceState;
  href?: string;
};

export function IntelligenceHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  state = "ready",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  state?: SurfaceState;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">{eyebrow}</p>
                <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusIndicator label={surfaceLabel[state]} tone={surfaceTone[state]} />
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function IntelligenceMetricGrid({ metrics }: { metrics: IntelligenceMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Panel key={metric.label} className="p-3">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
              <metric.icon className="size-5" aria-hidden />
            </span>
            <StatusIndicator label={surfaceLabel[metric.state]} tone={surfaceTone[metric.state]} />
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
          <DetailDisclosure label="Detail" className="mt-2">{metric.detail}</DetailDisclosure>
        </Panel>
      ))}
    </div>
  );
}

export function IntelligenceActionQueue({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: IntelligenceAction[];
}) {
  return (
    <Panel className="p-4">
      <SectionHeader title={title} description={description} action={<StatusIndicator label="Action first" tone="info" />} />
      <div className="space-y-2">
        {actions.map((action) => {
          const content = (
            <>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <StatusIndicator label={surfaceLabel[action.state]} tone={surfaceTone[action.state]} />
                </div>
                <DetailDisclosure label="Detail" className="mt-2">{action.detail}</DetailDisclosure>
              </div>
              <div className="flex items-center gap-3 text-sm md:justify-end">
                <span className="text-muted-foreground">{action.owner}</span>
                <span className="font-medium">{action.due}</span>
                {action.href && <ArrowRight className="size-4 text-primary" aria-hidden />}
              </div>
            </>
          );

          return action.href ? (
            <Link
              key={action.title}
              href={action.href}
              className="grid gap-2 rounded-lg border bg-background p-3 transition hover:border-primary/40 hover:bg-info/30 md:grid-cols-[1fr_auto]"
            >
              {content}
            </Link>
          ) : (
            <div key={action.title} className="grid gap-2 rounded-lg border bg-background p-3 md:grid-cols-[1fr_auto]">
              {content}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function InsightPanel({
  title,
  description,
  state = "ready",
  children,
}: {
  title: string;
  description: string;
  state?: SurfaceState;
  children: React.ReactNode;
}) {
  return (
    <Panel className="border-primary/15 bg-info/35 p-4">
      <SectionHeader title={title} description={description} action={<StatusIndicator label={surfaceLabel[state]} tone={surfaceTone[state]} />} />
      <div className="text-sm leading-5 text-foreground">{children}</div>
    </Panel>
  );
}

export function EvidenceList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ title: string; detail: string; state: SurfaceState }>;
}) {
  return (
    <Panel className="p-4">
      <SectionHeader title={title} description={description} />
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.title} className="flex gap-2 rounded-lg border bg-background p-2.5">
            <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", item.state === "degraded" ? "text-warning-foreground" : "text-success")} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <StatusIndicator label={surfaceLabel[item.state]} tone={surfaceTone[item.state]} />
              </div>
              <DetailDisclosure label="Detail" className="mt-2">{item.detail}</DetailDisclosure>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ComparisonBars({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number; detail: string; state?: SurfaceState }>;
}) {
  return (
    <Panel className="p-4">
      <SectionHeader title={title} description={description} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <DetailDisclosure label="Detail" className="mt-2">{item.detail}</DetailDisclosure>
              </div>
              <StatusIndicator label={`${item.value}%`} tone={surfaceTone[item.state ?? "ready"]} />
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(item.value, 100))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
