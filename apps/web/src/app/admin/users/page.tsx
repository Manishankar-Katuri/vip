"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  RotateCw,
  Send,
  UserRoundX,
  XCircle
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import { PERMISSIONS, type UserRole } from "@/permissions-core";

type Hospital = {
  id:string;
  name:string;
};

type AdminUser = {
  id:string;
  email:string;
  name:string | null;
  role:UserRole;
  hospitalId:string | null;
  isGlobal:boolean;
  isActive:boolean;
  hospital?:Hospital | null;
};

type Invitation = {
  id:string;
  email:string;
  role:UserRole;
  hospitalId:string | null;
  isGlobal:boolean;
  status:"PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt:string;
  createdAt:string;
  acceptedAt:string | null;
  onboardingUrl?:string;
  hospital?:Hospital | null;
};

const roles:UserRole[] = [
  "ADMIN",
  "DOCTOR",
  "PRODUCTION",
  "STAFF"
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [form, setForm] = useState({
    email:"",
    role:"STAFF" as UserRole,
    hospitalId:""
  });

  async function load() {
    try {
      const [nextUsers, nextHospitals, nextInvitations] = await Promise.all([
        apiFetch<AdminUser[]>("/admin/users"),
        apiFetch<Hospital[]>("/admin/hospitals"),
        apiFetch<Invitation[]>("/admin/invitations")
      ]);

      setUsers(nextUsers);
      setHospitals(nextHospitals);
      setInvitations(nextInvitations);
      setIsPreview(false);
    } catch {
      setUsers([]);
      setHospitals([]);
      setInvitations([]);
      setIsPreview(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function inviteUser() {
    if (isPreview || !getAccessToken()) {
      setLastInviteUrl("Preview mode: connect admin authentication to send invitations.");
      return;
    }

    const invitation = await apiFetch<Invitation>("/admin/invitations", {
      method:"POST",
      body:JSON.stringify({
        email:form.email,
        role:form.role,
        hospitalId:isGlobalRole(form.role) ? null : form.hospitalId
      })
    });

    setLastInviteUrl(invitation.onboardingUrl ?? "");
    setForm({
      email:"",
      role:"STAFF",
      hospitalId:""
    });
    await load();
  }

  async function revokeInvitation(id:string) {
    if (isPreview || !getAccessToken()) return;

    await apiFetch(`/admin/invitations/${id}/revoke`, {
      method:"POST"
    });
    await load();
  }

  async function resendInvitation(id:string) {
    if (isPreview || !getAccessToken()) {
      setLastInviteUrl("Preview mode: connect admin authentication to resend invitations.");
      return;
    }

    const invitation = await apiFetch<Invitation>(
      `/admin/invitations/${id}/resend`,
      { method:"POST" }
    );

    setLastInviteUrl(invitation.onboardingUrl ?? "");
    await load();
  }

  async function deactivateUser(id:string) {
    if (isPreview || !getAccessToken()) return;

    await apiFetch(`/admin/users/${id}`, {
      method:"DELETE"
    });
    await load();
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_USERS}>
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="mt-1 text-sm text-slate-600">
            Invite users, track onboarding status, and manage active accounts.
          </p>
        </div>
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No live users or invitations are available for the current session.
          </div>
        ) : null}

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Invite user</h3>
              <p className="text-sm text-slate-600">
                Invitations expire after 7 days and require password setup.
              </p>
            </div>
            <Send className="h-5 w-5 text-slate-500" />
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto]">
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email:event.target.value })
              }
            />
            <select
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              value={form.role}
              onChange={(event) =>
                setForm({
                  ...form,
                  role:event.target.value as UserRole,
                  hospitalId:isGlobalRole(event.target.value as UserRole)
                    ? ""
                    : form.hospitalId
                })
              }
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm disabled:bg-slate-100"
              value={form.hospitalId}
              disabled={isGlobalRole(form.role)}
              onChange={(event) =>
                setForm({ ...form, hospitalId:event.target.value })
              }
            >
              <option value="">Hospital</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
            <Button onClick={inviteUser} disabled={isPreview}>
              <Send className="h-4 w-4" />
              Invite
            </Button>
          </div>
          {lastInviteUrl ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium">Latest onboarding URL</span>
              <code className="break-all text-slate-600">
                {lastInviteUrl}
              </code>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(lastInviteUrl)}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="px-2 py-3">
            <h3 className="font-semibold">Pending invitations</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>
                    {invitation.isGlobal
                      ? "Global"
                      : invitation.hospital?.name ?? invitation.hospitalId}
                  </TableCell>
                  <TableCell>{invitation.status}</TableCell>
                  <TableCell>
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => resendInvitation(invitation.id)}
                        disabled={isPreview || invitation.status === "ACCEPTED"}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => revokeInvitation(invitation.id)}
                        disabled={isPreview || invitation.status !== "PENDING"}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="px-2 py-3">
            <h3 className="font-semibold">Active accounts</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.isGlobal
                      ? "Global"
                      : user.hospital?.name ?? user.hospitalId}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => deactivateUser(user.id)}
                      disabled={isPreview}
                      aria-label="Deactivate user"
                    >
                      <UserRoundX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </PermissionGate>
  );
}

function isGlobalRole(role:UserRole) {
  return role === "ADMIN" || role === "PRODUCTION";
}
