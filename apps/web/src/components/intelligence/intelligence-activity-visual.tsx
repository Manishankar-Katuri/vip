"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Compass,
  Eye,
  FileText,
  LineChart,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type IntelligenceLayer = {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  glow: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const intelligenceLayers = {
  content: {
    id: "content",
    label: "Content Strategy Intelligence",
    shortLabel: "Content",
    color: "text-emerald-500",
    glow: "bg-emerald-500",
    Icon: FileText,
  },
  analytics: {
    id: "analytics",
    label: "Analytics Intelligence",
    shortLabel: "Analytics",
    color: "text-blue-500",
    glow: "bg-blue-500",
    Icon: BarChart3,
  },
  market: {
    id: "market",
    label: "Market Intelligence",
    shortLabel: "Market",
    color: "text-violet-500",
    glow: "bg-violet-500",
    Icon: Compass,
  },
  trend: {
    id: "trend",
    label: "Trend Intelligence",
    shortLabel: "Trends",
    color: "text-amber-500",
    glow: "bg-amber-500",
    Icon: TrendingUp,
  },
  recommendation: {
    id: "recommendation",
    label: "Recommendation Intelligence",
    shortLabel: "Recs",
    color: "text-cyan-500",
    glow: "bg-cyan-500",
    Icon: Sparkles,
  },
  approval: {
    id: "approval",
    label: "Approval Intelligence",
    shortLabel: "Approval",
    color: "text-teal-500",
    glow: "bg-teal-500",
    Icon: ShieldCheck,
  },
  review: {
    id: "review",
    label: "Review Intelligence",
    shortLabel: "Reviews",
    color: "text-rose-500",
    glow: "bg-rose-500",
    Icon: MessageSquareText,
  },
  competitor: {
    id: "competitor",
    label: "Competitor Intelligence",
    shortLabel: "Competitor",
    color: "text-fuchsia-500",
    glow: "bg-fuchsia-500",
    Icon: Eye,
  },
  forecast: {
    id: "forecast",
    label: "Forecast Intelligence",
    shortLabel: "Forecast",
    color: "text-sky-500",
    glow: "bg-sky-500",
    Icon: LineChart,
  },
  search: {
    id: "search",
    label: "Search Intelligence",
    shortLabel: "Search",
    color: "text-indigo-500",
    glow: "bg-indigo-500",
    Icon: Search,
  },
  audience: {
    id: "audience",
    label: "Audience Intelligence",
    shortLabel: "Audience",
    color: "text-lime-600",
    glow: "bg-lime-500",
    Icon: UsersRound,
  },
  operations: {
    id: "operations",
    label: "Operations Intelligence",
    shortLabel: "Ops",
    color: "text-orange-500",
    glow: "bg-orange-500",
    Icon: CalendarClock,
  },
  strategy: {
    id: "strategy",
    label: "Strategy Intelligence",
    shortLabel: "Strategy",
    color: "text-purple-500",
    glow: "bg-purple-500",
    Icon: Target,
  },
} satisfies Record<string, IntelligenceLayer>;

const aiRouteMap: Array<{ match: (pathname: string) => boolean; layers: IntelligenceLayer[] }> = [
  {
    match: (pathname) =>
      pathname.startsWith("/strategy/content-strategy") ||
      pathname.startsWith("/production/content-strategy"),
    layers: [
      intelligenceLayers.content,
      intelligenceLayers.analytics,
      intelligenceLayers.market,
      intelligenceLayers.trend,
      intelligenceLayers.recommendation,
      intelligenceLayers.approval,
    ],
  },
  {
    match: (pathname) => pathname.includes("/recommendations"),
    layers: [intelligenceLayers.recommendation, intelligenceLayers.analytics, intelligenceLayers.strategy],
  },
  {
    match: (pathname) => pathname.includes("/social-intelligence"),
    layers: [intelligenceLayers.analytics, intelligenceLayers.trend, intelligenceLayers.audience],
  },
  {
    match: (pathname) => pathname.includes("/competitor") || pathname.includes("/local-market"),
    layers: [intelligenceLayers.competitor, intelligenceLayers.market, intelligenceLayers.search],
  },
  {
    match: (pathname) => pathname.includes("/forecast"),
    layers: [intelligenceLayers.forecast, intelligenceLayers.analytics, intelligenceLayers.market],
  },
  {
    match: (pathname) => pathname.includes("/review") || pathname.includes("/reputation"),
    layers: [intelligenceLayers.review, intelligenceLayers.approval, intelligenceLayers.recommendation],
  },
  {
    match: (pathname) => pathname.includes("/content") || pathname.includes("/campaign-studio") || pathname.includes("/script-studio"),
    layers: [intelligenceLayers.content, intelligenceLayers.audience, intelligenceLayers.approval],
  },
  {
    match: (pathname) => pathname.includes("/admin/ai") || pathname.includes("/api/agents") || pathname.includes("/intelligence"),
    layers: [intelligenceLayers.strategy, intelligenceLayers.analytics, intelligenceLayers.recommendation],
  },
  {
    match: (pathname) => pathname.includes("/opportunities") || pathname.includes("/growth-plan"),
    layers: [intelligenceLayers.strategy, intelligenceLayers.market, intelligenceLayers.recommendation],
  },
  {
    match: (pathname) => pathname.includes("/analytics"),
    layers: [intelligenceLayers.analytics, intelligenceLayers.forecast, intelligenceLayers.trend],
  },
];

export function IntelligenceActivityVisual() {
  const pathname = usePathname();
  const activeLayers = useMemo(() => layersForPath(pathname), [pathname]);

  if (!activeLayers.length) return null;

  const primary = activeLayers[0];
  const PrimaryIcon = primary.Icon;
  const statusLabel = `${primary.label} active`;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
      className="pointer-events-none fixed bottom-4 left-4 z-50 w-[min(calc(100vw-2rem),22rem)] select-none sm:bottom-6 sm:left-6"
    >
      <div className="overflow-hidden rounded-lg border border-white/70 bg-white/88 p-3 shadow-[0_18px_48px_rgb(15_23_42/0.16)] ring-1 ring-slate-950/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center">
            <span className={cn("absolute inset-1 rounded-full opacity-[0.18] blur-md", primary.glow)} aria-hidden />
            <span
              className={cn(
                "absolute inset-0 rounded-full border border-current/20",
                "motion-safe:animate-[spin_4s_linear_infinite]",
                primary.color,
              )}
              aria-hidden
            >
              <span className={cn("absolute -right-0.5 top-1 size-2 rounded-full", primary.glow)} />
            </span>
            <span className="relative flex size-8 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm">
              <PrimaryIcon className={cn("size-4 motion-safe:animate-pulse", primary.color)} aria-hidden />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Activity className="size-3.5 text-slate-500" aria-hidden />
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                Intelligence active
              </p>
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">{primary.label}</p>
          </div>

          <BrainCircuit className="size-5 shrink-0 text-slate-400 motion-safe:animate-[spin_7s_linear_infinite]" aria-hidden />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeLayers.map((layer) => {
            const Icon = layer.Icon;
            return (
              <span
                key={layer.id}
                className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 px-2 text-[0.68rem] font-medium text-slate-700"
              >
                <span className={cn("size-1.5 rounded-full", layer.glow)} aria-hidden />
                <Icon className={cn("size-3", layer.color)} aria-hidden />
                {layer.shortLabel}
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function layersForPath(pathname: string | null) {
  if (!pathname) return [];
  return aiRouteMap.find((route) => route.match(pathname))?.layers ?? [];
}
