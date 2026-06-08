"use client";

import type React from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Hash,
  Layers3,
  PenTool,
  RadioTower,
  Sparkles,
} from "lucide-react";

import { HospitalSwitcher } from "@/components/hospital-switcher";
import { useHospital } from "@/hooks/useHospital";
import { WorkspaceFrame, type UnifiedNavigationSection } from "@/layouts/unified-workspace-shell";
import {
  hasPermission,
  PERMISSIONS,
  type Permission
} from "@/permissions-core";

type NavItem = {
  title:string;
  href:string;
  permission:Permission;
  icon:React.ComponentType<{ className?:string }>;
};

const NAV_SECTIONS:Array<{
  title:string;
  items:NavItem[];
}> = [
  {
    title:"Content",
    items:[
      {
        title:"Command Centre",
        href:"/production/command-centre",
        permission:PERMISSIONS.VIEW_CONTENT,
        icon:Layers3
      },
      {
        title:"Content Calendar",
        href:"/production/content-calendar",
        permission:PERMISSIONS.MANAGE_CALENDAR,
        icon:CalendarDays
      },
      {
        title:"Content Generator",
        href:"/production/content-generator",
        permission:PERMISSIONS.CREATE_CONTENT,
        icon:Sparkles
      },
      {
        title:"Script Studio",
        href:"/production/script-studio",
        permission:PERMISSIONS.CREATE_CONTENT,
        icon:PenTool
      },
      {
        title:"AI Recommendations",
        href:"/production/recommendations",
        permission:PERMISSIONS.VIEW_CONTENT,
        icon:Sparkles
      }
    ]
  },
  {
    title:"Strategy",
    items:[
      {
        title:"Content Strategy",
        href:"/strategy/content-strategy",
        permission:PERMISSIONS.VIEW_STRATEGY,
        icon:BookOpen
      }
    ]
  },
  {
    title:"Analytics",
    items:[
      {
        title:"Social Intelligence",
        href:"/production/social-intelligence",
        permission:PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
        icon:RadioTower
      },
      {
        title:"Hashtag Intelligence",
        href:"/production/hashtags",
        permission:PERMISSIONS.MANAGE_HASHTAGS,
        icon:Hash
      }
    ]
  }
];

export default function ProductionLayout({
  children
}: Readonly<{
  children:React.ReactNode;
}>) {
  const { activeHospital, currentUser } = useHospital();

  const navSections: UnifiedNavigationSection[] = NAV_SECTIONS
    .map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) => !currentUser || hasPermission(currentUser, item.permission))
        .map((item) => ({
          title: item.title,
          href: item.href,
          icon: item.icon,
        })),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <WorkspaceFrame
      workspaceLabel="Production"
      workspaceDescription="Campaign execution"
      workspaceHref="/production"
      navSections={navSections}
      hospitalName={activeHospital?.name ?? "No workspace selected"}
      userLabel={currentUser?.role ?? "Production"}
      userRole="Production workspace"
      workspaceSelector={<HospitalSwitcher />}
      sidebarFooter={
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <BarChart3 className="size-4" aria-hidden />
            Delivery focus
          </div>
          <p className="text-xs leading-5 text-emerald-900">
            Content, campaigns, and social intelligence only. Financial metrics and administration stay outside this workspace.
          </p>
        </div>
      }
    >
      {children}
    </WorkspaceFrame>
  );
}
