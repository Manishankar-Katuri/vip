"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  Inbox,
  Layers3,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Leads", href: "/leads", icon: UserRoundCheck },
  { label: "Strategy", href: "/strategy", icon: Target },
  { label: "Approvals", href: "/approvals", icon: Inbox },
];

export function IntelligenceShell({
  children,
  activePath,
  title,
  subtitle,
}: {
  children: ReactNode;
  activePath?: string;
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <div className="min-h-screen bg-[#f6faf9] text-[#17212f]">
      <header className="sticky top-0 z-40 border-b border-[#d7e5e4] bg-white/92 backdrop-blur-xl">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#008080] text-sm font-semibold text-white">
              VIP
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-semibold text-[#000080]">VIP Intelligence OS</span>
              <span className="block truncate text-xs text-slate-500">Healthcare business intelligence</span>
            </span>
          </Link>

          <button
            type="button"
            className="ml-auto hidden h-11 min-w-44 items-center justify-between gap-3 rounded-lg border border-[#c9dbda] bg-[#f9fcfc] px-3 text-left text-sm font-medium text-slate-700 md:flex"
          >
            Dr. Harika ENT Care
            <ChevronDown className="size-4 text-slate-500" aria-hidden />
          </button>

          <div className="hidden h-11 items-center gap-2 rounded-lg border border-[#c9dbda] bg-white px-3 text-sm text-slate-600 lg:flex">
            <Search className="size-4 text-[#008080]" aria-hidden />
            <span>Search actions, clients, signals...</span>
            <kbd className="ml-6 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">Ctrl K</kbd>
          </div>

          <span className="hidden h-9 items-center rounded-full border border-[#d7e5e4] bg-[#edf7f6] px-3 text-xs font-semibold text-[#006767] sm:inline-flex">
            Clinical Admin
          </span>
          <PrivacyStatusBadge compact />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] border-r border-[#d7e5e4] bg-white px-3 py-5 lg:block">
          <nav aria-label="Primary" className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(currentPath, item.href)} />
            ))}
          </nav>
          <div className="mt-6 rounded-lg border border-[#d7e5e4] bg-[#f6faf9] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#000080]">
              <LockKeyhole className="size-4" aria-hidden />
              Privacy boundary
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Previews mask identifiers. Audit trails and raw records stay behind governed detail views.
            </p>
          </div>
        </aside>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#008080]">Clinical-grade intelligence</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#000080] sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{subtitle}</p>
              </div>
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#008080] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#006f6f]">
                <Sparkles className="size-5" aria-hidden />
                Ask VIP
              </button>
            </div>
            {children}
          </div>
        </main>
      </div>

      <BottomNav activePath={currentPath} />
    </div>
  );
}

export function BottomNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#c9dbda] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-10px_30px_rgb(15_23_42_/_0.08)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(currentPath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold",
                active ? "bg-[#e6f4f3] text-[#000080]" : "text-slate-500"
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-semibold transition",
        active ? "bg-[#e6f4f3] text-[#000080]" : "text-slate-600 hover:bg-slate-50 hover:text-[#000080]"
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}

function isActive(pathname: string | null | undefined, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard" || pathname === "/overview";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MetricCard({
  label,
  value,
  conclusion,
  trend = "stable",
  points = [28, 36, 34, 44, 48, 54],
}: {
  label: string;
  value: string;
  conclusion: string;
  trend?: "up" | "down" | "stable";
  points?: number[];
}) {
  const path = useMemo(() => sparklinePath(points), [points]);
  const tone = trend === "down" ? "text-amber-700" : trend === "up" ? "text-[#006767]" : "text-slate-600";

  return (
    <article className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-[#000080]">{value}</p>
        </div>
        <svg className={cn("h-12 w-24", tone)} viewBox="0 0 100 48" role="img" aria-label={`${label} sparkline`}>
          <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
        </svg>
      </div>
      <p className="mt-3 text-base leading-6 text-slate-700">{conclusion}</p>
    </article>
  );
}

export function InsightCard({
  eyebrow,
  title,
  summary,
  tone = "info",
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  tone?: "info" | "success" | "warning" | "danger";
  children?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={tone}>{eyebrow}</StatusPill>
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-normal text-[#17212f]">{title}</h2>
      <p className="mt-2 text-base leading-7 text-slate-600">{summary}</p>
      {children ? (
        <details className="mt-4 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
          <summary className="cursor-pointer text-base font-semibold text-[#000080]">View Details</summary>
          <div className="mt-3 text-base leading-7 text-slate-600">{children}</div>
        </details>
      ) : null}
    </article>
  );
}

export function AIRecommendationCard({
  title,
  recommendation,
  confidence,
  nextAction,
  evidence,
}: {
  title: string;
  recommendation: string;
  confidence: string;
  nextAction: string;
  evidence: string;
}) {
  return (
    <article className="rounded-lg border border-[#b9dddd] bg-[#f3fbfa] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#008080] text-white">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#008080]">AI recommended action</p>
            <h3 className="mt-1 text-xl font-semibold text-[#000080]">{title}</h3>
          </div>
        </div>
        <StatusPill tone="success">{confidence}</StatusPill>
      </div>
      <p className="mt-4 text-base leading-7 text-slate-700">{recommendation}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-semibold text-[#17212f]">{nextAction}</p>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#000080] px-4 text-base font-semibold text-white">
          Start action <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
      <details className="mt-4 rounded-lg border border-[#c9dbda] bg-white p-3">
        <summary className="cursor-pointer text-base font-semibold text-[#000080]">See Evidence</summary>
        <p className="mt-2 text-base leading-7 text-slate-600">{evidence}</p>
      </details>
    </article>
  );
}

export function PrivacyStatusBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#b9dddd] bg-[#edf7f6] px-3 text-xs font-semibold text-[#006767]">
      <ShieldCheck className="size-4" aria-hidden />
      {compact ? "Server-side" : "HIPAA/privacy-safe server-side processing"}
    </span>
  );
}

export function RefineResultsTray({ children }: { children: ReactNode }) {
  return (
    <details className="rounded-lg border border-[#d7e5e4] bg-white p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-[#000080]">
        Refine Results
        <ChevronDown className="size-5" aria-hidden />
      </summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{children}</div>
    </details>
  );
}

export function ApprovalActionBar({ label = "approval item" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "approved" | "rejected">("idle");

  if (state !== "idle") {
    return (
      <SuccessState
        title={state === "approved" ? "Approved" : "Decision recorded"}
        message={`${label} was ${state}. No content was sent, published, or executed automatically.`}
      />
    );
  }

  return (
    <div className="sticky bottom-[78px] z-10 -mx-4 mt-4 border-t border-[#d7e5e4] bg-white/95 p-4 backdrop-blur md:static md:mx-0 md:rounded-lg md:border">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setState("approved")}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#008080] px-4 text-base font-semibold text-white"
        >
          <Check className="size-5" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => setState("rejected")}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-base font-semibold text-rose-700"
        >
          <X className="size-5" aria-hidden />
          Reject
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#b9dddd] bg-white p-6 text-center">
      <Layers3 className="mx-auto size-8 text-[#008080]" aria-hidden />
      <h3 className="mt-3 text-xl font-semibold text-[#000080]">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-600">{message}</p>
    </div>
  );
}

export function SuccessState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-base leading-7">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" }) {
  const classes = {
    info: "border-sky-200 bg-sky-50 text-sky-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold", classes[tone])}>{children}</span>;
}

export function FieldChip({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] px-3 py-2 text-base font-semibold text-slate-800">{value}</span>
    </label>
  );
}

export function SectionHeader({
  icon: Icon = Activity,
  title,
  summary,
}: {
  icon?: LucideIcon;
  title: string;
  summary: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#b9dddd] bg-white text-[#008080]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-[#000080]">{title}</h2>
        <p className="mt-1 text-base leading-7 text-slate-600">{summary}</p>
      </div>
    </div>
  );
}

export function TimelineStamp({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
      <Clock3 className="size-4" aria-hidden />
      {children}
    </span>
  );
}

function sparklinePath(points: number[]) {
  const safe = points.length ? points : [20, 28, 24, 36];
  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = Math.max(max - min, 1);
  return safe
    .map((point, index) => {
      const x = (index / Math.max(safe.length - 1, 1)) * 96 + 2;
      const y = 44 - ((point - min) / range) * 36;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
