"use client";

import Link from "next/link";
import {
  ClipboardList,
  Hospital,
  Plug,
  ShieldCheck,
  Users
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { PERMISSIONS } from "@/permissions-core";

const commandItems = [
  {
    title:"User Management",
    href:"/admin/users",
    detail:"Create users, assign roles, and manage account status.",
    icon:Users
  },
  {
    title:"Hospital Management",
    href:"/admin/hospitals",
    detail:"Create and maintain tenant hospital workspaces.",
    icon:Hospital
  },
  {
    title:"Audit Logs",
    href:"/admin/audit-logs",
    detail:"Review administrative changes and role movement.",
    icon:ClipboardList
  },
  {
    title:"Brand Voice",
    href:"/admin/brand-voice",
    detail:"Maintain hospital tone, audience, and messaging defaults.",
    icon:ShieldCheck
  },
  {
    title:"Integrations",
    href:"/admin/integrations",
    detail:"View planned and connected platform integrations.",
    icon:Plug
  }
];

export default function AdminCommandCentrePage() {
  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_USERS}>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin
          </p>
          <h2 className="text-2xl font-semibold">
            Command Centre
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Central control for user access, hospital tenancy, configuration,
            and administrative auditability.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {commandItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </PermissionGate>
  );
}
