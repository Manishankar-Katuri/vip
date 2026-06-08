"use client";

import type React from "react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { LiveStatus, OperationalSyncProvider } from "@/collaboration/operational-sync";
import { workspaceMeta, type Role } from "@/design-system/theme";
import { WorkspaceFrame, WorkspacePageHeader, type UnifiedNavigationSection } from "@/layouts/unified-workspace-shell";
import { roleNavigation } from "@/navigation/role-navigation";

function groupedNavigation(role: Role): UnifiedNavigationSection[] {
  const items = roleNavigation[role];

  if (role === "staff") {
    return [
      { title: "Tasks", items: items.filter((item) => ["/staff", "/staff/tasks"].includes(item.href)).map(toUnifiedItem) },
      { title: "Requests", items: items.filter((item) => item.href.includes("requests")).map(toUnifiedItem) },
      { title: "Uploads", items: items.filter((item) => item.href.includes("uploads")).map(toUnifiedItem) },
      { title: "Leads", items: items.filter((item) => !["/staff", "/staff/tasks", "/staff/requests", "/staff/uploads"].includes(item.href)).map(toUnifiedItem) },
    ].filter((section) => section.items.length > 0);
  }

  const splitAt = role === "admin" || role === "production" ? 4 : role === "doctor" ? 2 : 3;
  return [
    { title: role === "doctor" ? "Decisions" : "Work now", items: items.slice(0, splitAt).map(toUnifiedItem) },
    { title: role === "doctor" ? "Insights" : "Track and manage", items: items.slice(splitAt).map(toUnifiedItem) },
  ].filter((section) => section.items.length > 0);
}

function toUnifiedItem(item: (typeof roleNavigation)[Role][number]) {
  return {
    title: item.label,
    href: item.href,
    icon: item.icon,
  };
}

export function WorkspaceShell({
  role,
  title,
  subtitle,
  children,
  section,
}: {
  role: Role;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  section?: string;
}) {
  const meta = workspaceMeta[role];

  return (
    <WorkspaceFrame
      workspaceLabel={meta.label}
      workspaceDescription={meta.description}
      workspaceHref={roleNavigation[role][0]?.href ?? "/"}
      navSections={groupedNavigation(role)}
      hospitalName={meta.hospital}
      userRole={meta.label}
      statusLabel="Live sync"
      topBarAction={
        <div className="flex items-center gap-2">
          <LiveStatus />
          <NotificationCenter role={role} />
        </div>
      }
      sidebarFooter={
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Workspace</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">{meta.hospital}</p>
        </div>
      }
    >
      <OperationalSyncProvider />
      <WorkspacePageHeader eyebrow={section ?? meta.description} title={title} summary={subtitle} />
      {children}
    </WorkspaceFrame>
  );
}
