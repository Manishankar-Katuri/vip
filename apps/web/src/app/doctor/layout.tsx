"use client";

import type React from "react";

import { useHospital } from "@/hooks/useHospital";
import { WorkspaceFrame, type UnifiedNavigationSection } from "@/layouts/unified-workspace-shell";
import { roleNavigation } from "@/navigation/role-navigation";

export default function DoctorLayout({
  children
}: Readonly<{
  children:React.ReactNode;
}>) {
  const { activeHospital, currentUser } = useHospital();
  const navSections: UnifiedNavigationSection[] = [
    {
      title: "Briefing",
      items: roleNavigation.doctor.slice(0, 1).map((item) => ({
        title: item.label,
        href: item.href,
        icon: item.icon,
      })),
    },
    {
      title: "Approvals",
      items: roleNavigation.doctor.slice(2, 3).map((item) => ({
        title: item.label,
        href: item.href,
        icon: item.icon,
      })),
    },
    {
      title: "Reputation",
      items: roleNavigation.doctor.slice(4, 5).map((item) => ({
        title: item.label,
        href: item.href,
        icon: item.icon,
      })),
    },
    {
      title: "Strategy",
      items: [roleNavigation.doctor[1], roleNavigation.doctor[3], roleNavigation.doctor[5]].filter(Boolean).map((item) => ({
        title: item.label,
        href: item.href,
        icon: item.icon,
      })),
    },
  ];

  return (
    <WorkspaceFrame
      workspaceLabel="Doctor Portal"
      workspaceDescription="Clinical leadership"
      workspaceHref="/doctor"
      navSections={navSections}
      hospitalName={activeHospital?.name ?? "Hospital briefing"}
      userLabel={currentUser?.role ?? "Doctor"}
      userRole="Morning briefing"
      statusLabel="Clinical review"
    >
      {children}
    </WorkspaceFrame>
  );
}
