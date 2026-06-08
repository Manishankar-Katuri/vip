import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { PERMISSIONS } from "@/permissions-core";
import { AdminAuthError, requireAdminPermission } from "@/lib/server/admin-auth";

export const hospitalInputSchema = z.object({
  name:z.string().min(1),
  hospitalName:z.string().optional(),
  hospitalCode:z.string().optional().nullable(),
  slug:z.string().optional().nullable(),
  domain:z.string().url().optional().or(z.literal("")).nullable(),
  industryType:z.string().optional().nullable(),
  contactEmail:z.string().email().optional().or(z.literal("")).nullable(),
  specialty:z.string().optional().nullable(),
  city:z.string().optional().nullable(),
  status:z.enum(["CREATING", "ACTIVE", "PAUSED"]).default("ACTIVE")
});

export const hospitalPatchSchema = hospitalInputSchema.partial().extend({
  disabled:z.boolean().optional()
});

export function hospitalSelect() {
  return {
    id:true,
    name:true,
    hospitalName:true,
    slug:true,
    hospitalCode:true,
    domain:true,
    industryType:true,
    contactEmail:true,
    specialty:true,
    city:true,
    status:true,
    lastSyncAt:true,
    disabledAt:true,
    createdAt:true,
    updatedAt:true,
    _count:{
      select:{
        integrationConfigs:true
      }
    }
  } as const;
}

export function toHospitalDto(hospital:{
  id:string;
  name:string;
  hospitalName:string;
  slug:string;
  hospitalCode:string | null;
  domain:string | null;
  industryType:string | null;
  contactEmail:string | null;
  specialty:string | null;
  city:string | null;
  status:string;
  lastSyncAt:Date | null;
  disabledAt:Date | null;
  createdAt:Date;
  updatedAt:Date;
  _count?:{ integrationConfigs:number };
}) {
  return {
    id:hospital.id,
    name:hospital.name,
    hospitalName:hospital.hospitalName,
    slug:hospital.slug,
    hospitalCode:hospital.hospitalCode,
    domain:hospital.domain,
    industryType:hospital.industryType,
    contactEmail:hospital.contactEmail,
    specialty:hospital.specialty,
    city:hospital.city,
    status:hospital.disabledAt ? "PAUSED" : hospital.status,
    connectedApisCount:hospital._count?.integrationConfigs ?? 0,
    lastSyncAt:hospital.lastSyncAt?.toISOString() ?? null,
    disabledAt:hospital.disabledAt?.toISOString() ?? null,
    createdAt:hospital.createdAt.toISOString(),
    updatedAt:hospital.updatedAt.toISOString()
  };
}

export function slugify(value:string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uniqueSlug(name:string, requested?:string | null) {
  const base = slugify(requested || name) || `hospital-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (await prisma.hospitalWorkspace.findUnique({ where:{ slug:candidate }, select:{ id:true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function normalizeCode(value:string | null | undefined, fallback:string) {
  const code = (value || fallback)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return code || null;
}

export async function initializeDefaultRolePermissions(hospitalId:string, actorId?:string | null) {
  await prisma.auditLog.create({
    data:{
      userId:actorId ?? null,
      action:"hospital.roles.initialize",
      resource:"HospitalWorkspace",
      resourceId:hospitalId,
      hospitalId
    }
  });
}

export function adminJsonError(error:unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ success:false, error:error.message }, { status:error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success:false, error:error.issues.map((issue) => issue.message).join(" ") },
      { status:400 }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  const status = message.includes("not found") ? 404 : 500;

  return NextResponse.json({ success:false, error:message }, { status });
}

export function requireHospitalAdmin(request:Request) {
  return requireAdminPermission(request, PERMISSIONS.MANAGE_HOSPITALS);
}

export function requireIntegrationAdmin(request:Request) {
  return requireAdminPermission(request, PERMISSIONS.MANAGE_INTEGRATIONS);
}
