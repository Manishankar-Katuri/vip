import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Files,
  FileUp,
  LayoutDashboard,
  NotebookTabs,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/design-system/theme";

export type NavigationItem = { label: string; href: string; icon: LucideIcon };

export const roleNavigation: Record<Role, NavigationItem[]> = {
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Strategy", href: "/admin/strategy/content", icon: BookOpen },
    { label: "Market Position", href: "/admin/hospitals", icon: Building2 },
    { label: "Forecasting", href: "/admin/analytics", icon: BarChart3 },
    { label: "Growth Report", href: "/admin/executive-growth-report", icon: NotebookTabs },
    { label: "Workflows", href: "/admin/workflows", icon: Workflow },
    { label: "Automation", href: "/admin/automation", icon: Activity },
    { label: "Opportunities", href: "/admin/ai", icon: Sparkles },
    { label: "Approvals", href: "/admin/approvals", icon: ShieldCheck },
    { label: "Teams", href: "/admin/teams", icon: Users },
  ],
  production: [
    { label: "AI Strategy", href: "/production", icon: LayoutDashboard },
    { label: "Strategy", href: "/strategy/content-strategy", icon: BookOpen },
    { label: "Optimization", href: "/production/content", icon: Files },
    { label: "AI Recommendations", href: "/production/recommendations", icon: Sparkles },
    { label: "Calendar", href: "/production/content-calendar", icon: CalendarDays },
    { label: "Generator", href: "/production/content-generator", icon: Sparkles },
    { label: "Forecasting", href: "/production/analytics", icon: BarChart3 },
    { label: "Workflows", href: "/production/workflows", icon: Workflow },
    { label: "Media Library", href: "/production/library", icon: NotebookTabs },
  ],
  staff: [
    { label: "Overview", href: "/staff", icon: LayoutDashboard },
    { label: "Strategy", href: "/strategy/content-strategy", icon: BookOpen },
    { label: "Tasks", href: "/staff/tasks", icon: CalendarCheck },
    { label: "Uploads", href: "/staff/uploads", icon: FileUp },
    { label: "Requests", href: "/staff/requests", icon: Files },
    { label: "Approvals", href: "/staff/approvals", icon: ClipboardCheck },
  ],
  doctor: [
    { label: "AI Briefing", href: "/doctor", icon: Stethoscope },
    { label: "Strategy", href: "/strategy/content-strategy", icon: BookOpen },
    { label: "Approvals", href: "/doctor/approvals", icon: ClipboardCheck },
    { label: "Growth Report", href: "/doctor/executive-growth-report", icon: NotebookTabs },
    { label: "Momentum", href: "/doctor/reputation", icon: BarChart3 },
    { label: "Strategy Summary", href: "/doctor/summary", icon: Sparkles },
  ],
};
