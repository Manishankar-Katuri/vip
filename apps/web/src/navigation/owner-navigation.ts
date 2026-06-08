import {
  BarChart3,
  Brain,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type OwnerNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const ownerNavigation: OwnerNavigationItem[] = [
  {
    label: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    description: "Today status, reports ready, approvals due, and client health.",
  },
  {
    label: "Daily Workflow",
    href: "/workflows",
    icon: Workflow,
    description: "Daily growth runs from data collection to owner approval.",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Business-friendly performance movement and next actions.",
  },
  {
    label: "Intelligence",
    href: "/intelligence",
    icon: Brain,
    description: "Risks, opportunities, patterns, blockers, and audience insights.",
  },
  {
    label: "Strategy Plan",
    href: "/strategy",
    icon: Lightbulb,
    description: "Prioritized recommendations with evidence and approval state.",
  },
  {
    label: "Content Plan",
    href: "/content-plan",
    icon: ListChecks,
    description: "Execution-ready content plans in simple client-friendly language.",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Preview, edit, export, approve, and send client reports.",
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    description: "Owner decisions for reports, strategy, and content plans.",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    description: "Client profiles, connections, schedules, recipients, and settings.",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Platform settings, integrations, templates, and production readiness.",
  },
];

