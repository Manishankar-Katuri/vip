"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Globe2,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  SearchCheck,
  ShieldCheck,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import { WorkspaceFrame, WorkspacePageHeader, type UnifiedNavigationSection } from "@/layouts/unified-workspace-shell";

type NavigationGroup = {
  label: string;
  items: ReadonlyArray<{ label: string; href: string; icon: LucideIcon; description?: string }>;
};

const navigation: ReadonlyArray<NavigationGroup> = [
  {
    label: "Today",
    items: [
      { label: "Today", href: "/today", icon: ClipboardCheck, description: "Daily actions" },
      { label: "Overview", href: "/", icon: LayoutDashboard, description: "Workspace summary" },
      { label: "Campaign Studio", href: "/campaign-studio", icon: Megaphone, description: "Campaign builder" },
      { label: "Calendar", href: "/calendar", icon: CalendarDays, description: "Publishing plan" },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Growth Plan", href: "/growth-plan", icon: Compass, description: "Strategic plan" },
      { label: "8 Weeks Ahead", href: "/eight-weeks", icon: Timer, description: "Upcoming work" },
    ],
  },
  {
    label: "Market",
    items: [
      { label: "Local Market", href: "/local-market", icon: MapPinned, description: "Market context" },
      { label: "Outreach", href: "/outreach", icon: Globe2, description: "Referral paths" },
    ],
  },
  {
    label: "Measure",
    items: [
      { label: "Website & Listings", href: "/website-listings", icon: SearchCheck, description: "Listing quality" },
      { label: "Results", href: "/results", icon: BarChart3, description: "Performance" },
      { label: "Analytics", href: "/analytics", icon: BarChart3, description: "Metrics" },
      { label: "Governance", href: "/governance", icon: ShieldCheck, description: "Approval trail" },
    ],
  },
];

const navSections: UnifiedNavigationSection[] = navigation.map((section) => ({
  title: section.label,
  items: section.items.map((item) => ({
    title: item.label,
    href: item.href,
    icon: item.icon,
    description: item.description,
  })),
}));

export function PlaybookShell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceFrame
      workspaceLabel="VIP Playbook"
      workspaceDescription="Growth playbook"
      workspaceHref="/today"
      navSections={navSections}
      hospitalName={hospitalProfile.name}
      userRole="Governed playbook"
      statusLabel="Governed"
      sidebarFooter={
        <div className="rounded-xl border border-primary/15 bg-white p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" aria-hidden />
            Clinical review active
          </p>
          <p className="mt-1.5 truncate text-xs text-slate-500">{hospitalProfile.name}</p>
        </div>
      }
    >
      <WorkspacePageHeader eyebrow={eyebrow} title={title} summary={description} />
      {children}
    </WorkspaceFrame>
  );
}
