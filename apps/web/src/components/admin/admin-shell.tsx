"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  Flame,
  Globe,
  HeartHandshake,
  Hospital,
  Image,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  Radar,
  RadioTower,
  Route,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  Users
} from "lucide-react";

import { useHospital } from "@/hooks/useHospital";
import { ExportPdfButton } from "@/components/phase-e";
import { getAccessToken } from "@/lib/api-client";
import {
  WorkspaceFrame,
  type UnifiedNavigationSection
} from "@/layouts/unified-workspace-shell";
import {
  PERMISSIONS,
  getUserPermissions,
  hasPermission,
  type Permission
} from "@/permissions-core";

type AdminNavigationSection = {
  title:string;
  items:Array<{
    title:string;
    href:string;
    permission?:Permission;
    icon:React.ComponentType<{ className?:string }>;
    description:string;
  }>;
};

const navigationSections: AdminNavigationSection[] = [
  {
    title:"Overview",
    items:[
      {
        title:"Overview",
        href:"/admin",
        icon:LayoutDashboard,
        description:"Summary for intelligence, strategy, and analytics"
      }
    ]
  },
  {
    title:"Intelligence",
    items:[
      {
        title:"Social",
        href:"/admin/intelligence/social",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:RadioTower,
        description:"Instagram and social signals"
      },
      {
        title:"GBP",
        href:"/admin/intelligence/gbp",
        permission:PERMISSIONS.VIEW_REPUTATION,
        icon:Star,
        description:"Google Business Profile"
      },
      {
        title:"SEO",
        href:"/admin/intelligence/seo",
        permission:PERMISSIONS.VIEW_MARKET_INTELLIGENCE,
        icon:Globe,
        description:"Search visibility"
      },
      {
        title:"Trend",
        href:"/admin/intelligence/trend",
        permission:PERMISSIONS.VIEW_AI_INSIGHTS,
        icon:TrendingUp,
        description:"Market and care trends"
      },
      {
        title:"Competitor",
        href:"/admin/workspaces/:hospitalId/competitor-intelligence",
        permission:PERMISSIONS.VIEW_COMPETITORS,
        icon:Radar,
        description:"Competitor movement"
      },
      {
        title:"AI Recommendations",
        href:"/admin#intelligence-recommendations",
        permission:PERMISSIONS.VIEW_RECOMMENDATIONS,
        icon:Sparkles,
        description:"Next-best actions"
      },
      {
        title:"Forecasting",
        href:"/admin/intelligence/forecasting",
        permission:PERMISSIONS.VIEW_AI_INSIGHTS,
        icon:LineChart,
        description:"Predictive signals"
      }
    ]
  },
  {
    title:"Strategy",
    items:[
      {
        title:"Content Strategy",
        href:"/admin/strategy/content",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:BookOpen,
        description:"AI content plan, timing, captions, and evidence"
      },
      {
        title:"GBP Strategy",
        href:"/admin/strategy/gbp",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:Star,
        description:"Google Business Profile growth actions"
      },
      {
        title:"Review Strategy",
        href:"/admin/strategy/reviews",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:MessageSquareText,
        description:"Review requests, responses, and trust"
      },
      {
        title:"SEO Strategy",
        href:"/admin/strategy/seo",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:Globe,
        description:"Search and service-page visibility"
      },
      {
        title:"Social Presence",
        href:"/admin/strategy/social",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:RadioTower,
        description:"Doctor-led social growth"
      },
      {
        title:"WhatsApp",
        href:"/admin/strategy/whatsapp",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:MessageCircle,
        description:"Community follow-through"
      },
      {
        title:"Competitor Gap",
        href:"/admin/strategy/competitor-gap",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:Radar,
        description:"Market gaps to attack"
      },
      {
        title:"Conversion Path",
        href:"/admin/strategy/conversion-path",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:Route,
        description:"Calls, directions, and bookings"
      },
      {
        title:"Positioning Trust",
        href:"/admin/strategy/positioning",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:HeartHandshake,
        description:"Trust message across channels"
      }
    ]
  },
  {
    title:"Analytics",
    items:[
      {
        title:"Instagram Analytics",
        href:"/admin/analytics/instagram",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:Image,
        description:"Instagram performance"
      },
      {
        title:"Facebook Analytics",
        href:"/admin/analytics/facebook",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:Users,
        description:"Facebook performance"
      },
      {
        title:"WhatsApp Analytics",
        href:"/admin#analytics-whatsapp",
        permission:PERMISSIONS.VIEW_LEADS,
        icon:MessageCircle,
        description:"Inquiry and lead flow"
      },
      {
        title:"Review Analytics",
        href:"/admin/analytics/reviews",
        permission:PERMISSIONS.VIEW_REPUTATION,
        icon:MessageSquareText,
        description:"Reviews and sentiment"
      },
      {
        title:"Competitor Analytics",
        href:"/admin/workspaces/:hospitalId/competitor-intelligence",
        permission:PERMISSIONS.VIEW_COMPETITORS,
        icon:ChartNoAxesCombined,
        description:"Market comparison"
      },
      {
        title:"Engagement Analytics",
        href:"/admin/analytics/engagement",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:Flame,
        description:"Interaction quality"
      },
      {
        title:"Reach Analytics",
        href:"/admin#analytics-reach",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:Search,
        description:"Audience visibility"
      }
    ]
  },
  {
    title:"Reports",
    items:[
      {
        title:"Weekly Analysis Report",
        href:"/admin/reports/weekly-analysis",
        permission:PERMISSIONS.VIEW_AI_INSIGHTS,
        icon:Newspaper,
        description:"Weekly performance summary"
      },
      {
        title:"Competitor Analysis Report",
        href:"/admin/workspaces/:hospitalId/competitor-intelligence",
        permission:PERMISSIONS.VIEW_COMPETITORS,
        icon:FileText,
        description:"Competitor movements"
      },
      {
        title:"Executive Growth Report",
        href:"/admin/executive-growth-report",
        permission:PERMISSIONS.VIEW_AI_INSIGHTS,
        icon:ClipboardList,
        description:"Leadership-ready report"
      }
    ]
  },
  {
    title:"Administration",
    items:[
      {
        title:"Hospitals",
        href:"/admin/hospitals",
        permission:PERMISSIONS.MANAGE_HOSPITALS,
        icon:Hospital,
        description:"Client workspaces"
      },
      {
        title:"Users",
        href:"/admin/users",
        permission:PERMISSIONS.MANAGE_USERS,
        icon:Users,
        description:"Access control"
      },
      {
        title:"Permissions",
        href:"/admin/permissions",
        permission:PERMISSIONS.MANAGE_ROLES,
        icon:Shield,
        description:"Role visibility and feature access"
      },
      {
        title:"Audit Logs",
        href:"/admin/audit-logs",
        permission:PERMISSIONS.VIEW_AUDIT_LOGS,
        icon:Shield,
        description:"Governance trail"
      },
      {
        title:"AI Audit",
        href:"/admin/ai-audit",
        permission:PERMISSIONS.VIEW_AUDIT_LOGS,
        icon:Sparkles,
        description:"AI usage, cost, and latency"
      },
      {
        title:"API Audit",
        href:"/admin/system/api-audit",
        icon:Route,
        description:"Endpoint discovery and health"
      },
      {
        title:"AI Health",
        href:"/admin/system/ai-health",
        icon:Sparkles,
        description:"Provider availability"
      },
      {
        title:"Platform Verification",
        href:"/admin/system/platform-verification",
        icon:Stethoscope,
        description:"Production readiness score"
      },
      {
        title:"Integration Health",
        href:"/admin/integrations/health",
        icon:RadioTower,
        description:"Credential and sync status"
      }
    ]
  }
];

export function AdminShell({
  children
}: Readonly<{
  children:React.ReactNode;
}>) {
  const pathname = usePathname();
  const {
    activeHospital,
    availableHospitals,
    currentUser,
    isLoading,
    setActiveHospital
  } = useHospital();
  const permissions = getUserPermissions(currentUser);
  const canAccessAdmin =
    currentUser &&
    (
      hasPermission(currentUser, PERMISSIONS.MANAGE_USERS) ||
      hasPermission(currentUser, PERMISSIONS.MANAGE_ROLES)
    );
  const hasPendingAuthToken =
    !currentUser &&
    typeof window !== "undefined" &&
    Boolean(getAccessToken());
  const isDevelopmentPreview = process.env.NODE_ENV !== "production";
  const isOverviewPreview = isDevelopmentPreview && (
    pathname === "/admin" ||
    pathname === "/admin/ai-audit" ||
    pathname === "/admin/audit-logs" ||
    pathname === "/admin/executive-growth-report" ||
    pathname === "/admin/hospitals" ||
    pathname === "/admin/permissions" ||
    pathname === "/admin/users" ||
    pathname.startsWith("/admin/system") ||
    pathname === "/admin/integrations/health" ||
    pathname.startsWith("/admin/intelligence") ||
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/strategy") ||
    pathname.startsWith("/admin/reports") ||
    /^\/admin\/workspaces\/[^/]+\/competitor-intelligence$/.test(pathname) ||
    /^\/admin\/workspaces\/[^/]+\/executive$/.test(pathname)
  );

  if (!canAccessAdmin && !isOverviewPreview && hasPendingAuthToken) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Loading admin access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            VIP is applying your signed-in admin session.
          </p>
        </section>
      </main>
    );
  }

  if (!canAccessAdmin && !isOverviewPreview) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This area requires the manage_users permission.
          </p>
        </section>
      </main>
    );
  }

  const filteredSections: UnifiedNavigationSection[] = navigationSections
    .map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) =>
          isOverviewPreview ||
          !item.permission ||
          permissions.includes(item.permission)
        )
        .map((item) => ({
          title: item.title,
          href: item.href.replace(":hospitalId", activeHospital?.id ?? "harika-ent-care-hospitals"),
          icon: item.icon,
          description: item.description,
        })),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <WorkspaceFrame
      workspaceLabel="VIP Admin"
      workspaceDescription="Operational control"
      workspaceHref="/admin"
      navSections={filteredSections}
      hospitalName={activeHospital?.name ?? "Select workspace"}
      userLabel={currentUser?.userId ?? "Unauthenticated"}
      userRole={currentUser?.role ?? "No admin session"}
      workspaceSelector={
        <>
          <label className="sr-only" htmlFor="admin-workspace-select">Select active workspace</label>
          <select
            id="admin-workspace-select"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={activeHospital?.id ?? ""}
            disabled={isLoading || availableHospitals.length === 0}
            onChange={(event) => {
              void setActiveHospital(event.target.value);
            }}
            aria-label="Select active workspace"
          >
            {availableHospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </>
      }
      sidebarFooter={
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Building2 className="size-4" aria-hidden />
            {activeHospital?.name ?? "Hospital workspace"}
          </div>
          <p className="text-xs leading-5 text-slate-500">Admin shell preserves permissions, intelligence routes, and hospital context.</p>
        </div>
      }
    >
      <PhaseEUniversalExport pathname={pathname} hospitalName={activeHospital?.name ?? "Hospital workspace"} />
      {children}
    </WorkspaceFrame>
  );
}

function PhaseEUniversalExport({ pathname, hospitalName }: { pathname: string; hospitalName: string }) {
  const enabled =
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/intelligence") ||
    pathname.startsWith("/admin/strategy") ||
    pathname.startsWith("/admin/reports") ||
    pathname === "/admin/executive-growth-report" ||
    pathname === "/admin/ai-audit";

  if (!enabled) return null;

  return (
    <div className="mb-4 flex justify-end">
      <ExportPdfButton
        request={{
          pageType: pageType(pathname),
          title: pageTitle(pathname),
          business: hospitalName,
          summary: "Executive export generated from the current VIP Intelligence OS page.",
          insights: ["Use the on-screen source labels, freshness badges, and evidence sections to validate decisions before execution."],
          evidenceSources: [{ label: "VIP Intelligence OS page", source: pathname, observedAt: new Date().toISOString() }],
        }}
      />
    </div>
  );
}

function pageType(pathname: string) {
  if (pathname.includes("/analytics")) return "analytics";
  if (pathname.includes("/strategy")) return "strategy";
  if (pathname.includes("/reports")) return "report";
  if (pathname.includes("/intelligence")) return "intelligence";
  return "ai-report";
}

function pageTitle(pathname: string) {
  const leaf = pathname.split("/").filter(Boolean).at(-1) ?? "report";
  return leaf.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
