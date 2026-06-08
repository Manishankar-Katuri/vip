"use client";

import { useEffect, useState } from "react";

import { PermissionGate } from "@/components/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type AuditLog = {
  id:string;
  action:string;
  resource:string;
  resourceId:string | null;
  hospitalId:string | null;
  createdAt:string;
  user?:{
    email:string;
    role:string;
  } | null;
  hospital?:{
    name:string;
  } | null;
};

const previewAuditLogs:AuditLog[] = [
  {
    id:"preview-audit-1",
    action:"hospital.preview.open",
    resource:"HospitalWorkspace",
    resourceId:"harika-ent-care-hospitals",
    hospitalId:"harika-ent-care-hospitals",
    createdAt:new Date("2026-06-01T09:30:00+05:30").toISOString(),
    user:{ email:"preview-admin@vip.local", role:"ADMIN" },
    hospital:{ name:"Harika ENT care hospitals" }
  },
  {
    id:"preview-audit-2",
    action:"permissions.preview.review",
    resource:"RolePermission",
    resourceId:null,
    hospitalId:null,
    createdAt:new Date("2026-05-31T16:15:00+05:30").toISOString(),
    user:{ email:"preview-admin@vip.local", role:"ADMIN" },
    hospital:null
  }
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    void apiFetch<AuditLog[]>("/admin/audit-logs")
      .then(setLogs)
      .catch(() => {
        setIsPreview(true);
        setLogs(previewAuditLogs);
      });
  }, []);

  return (
    <PermissionGate permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Audit Logs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Administrative actions across users, roles, hospitals, and configuration.
          </p>
        </div>
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Preview mode: showing sample audit entries because authentication is not configured.
          </div>
        ) : null}
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.user?.email ?? "System"}</TableCell>
                  <TableCell>{log.hospital?.name ?? log.hospitalId ?? "Global"}</TableCell>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </PermissionGate>
  );
}
