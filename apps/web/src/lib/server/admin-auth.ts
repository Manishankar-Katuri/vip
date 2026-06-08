import "server-only";

import type { NextRequest } from "next/server";

import {
  PERMISSIONS,
  hasPermission,
  type AuthUser,
  type Permission,
  type UserRole
} from "@/permissions-core";

export class AdminAuthError extends Error {
  constructor(message:string, readonly status = 401) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function requireAdminPermission(
  request:NextRequest | Request,
  permission:Permission = PERMISSIONS.MANAGE_HOSPITALS
) {
  const user = readAuthUser(request);

  if (!user) {
    throw new AdminAuthError("Authentication is required.", 401);
  }

  if (!user.isGlobal || !hasPermission(user, permission)) {
    throw new AdminAuthError("Global admin permission is required.", 403);
  }

  return user;
}

export function readAuthUser(request:NextRequest | Request):AuthUser | null {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7)
    : null;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = getCookie(cookieHeader, "vip_access_token") ?? getCookie(cookieHeader, "access_token");
  const token = bearerToken ?? cookieToken;

  return token ? decodeJwtPayload(token) : null;
}

function decodeJwtPayload(token:string):AuthUser | null {
  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AuthUser>;

    if (
      typeof payload.userId !== "string" ||
      !isUserRole(payload.role) ||
      typeof payload.isGlobal !== "boolean"
    ) {
      return null;
    }

    return {
      userId:payload.userId,
      role:payload.role,
      hospitalId:typeof payload.hospitalId === "string" ? payload.hospitalId : null,
      isGlobal:payload.isGlobal
    };
  } catch {
    return null;
  }
}

function base64UrlDecode(value:string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function getCookie(header:string, name:string) {
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isUserRole(role:unknown):role is UserRole {
  return role === "ADMIN" || role === "DOCTOR" || role === "PRODUCTION" || role === "STAFF";
}
