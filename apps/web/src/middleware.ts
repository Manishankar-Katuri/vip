import { NextResponse, type NextRequest } from "next/server";

import {
  PERMISSIONS,
  hasPermission,
  type AuthUser,
  type Permission,
  type UserRole
} from "@/permissions-core";

const ROLE_HOME:Record<UserRole, string> = {
  ADMIN:"/overview",
  DOCTOR:"/overview",
  PRODUCTION:"/overview",
  STAFF:"/overview"
};

const PUBLIC_VISUAL_PREVIEW_PATHS = new Set([
  "/admin",
  "/admin/ai-audit",
  "/admin/audit-logs",
  "/admin/executive-growth-report",
  "/admin/hospitals",
  "/admin/permissions",
  "/admin/users",
  "/doctor",
  "/production",
  "/production/content-calendar",
  "/strategy",
  "/strategy/content-strategy",
  "/staff"
]);

const PRODUCTION_BLOCKED_PATH_PREFIXES = [
  "/design-mockups",
  "/production/campaigns",
  "/production/content-pipeline",
  "/production/special-days",
  "/api/test-agent",
  "/api/test-ingest",
  "/api/social/test-ingest"
];

const PATH_PERMISSIONS:Record<string, Permission> = {
  "/admin/command-centre":PERMISSIONS.MANAGE_USERS,
  "/admin/users":PERMISSIONS.MANAGE_USERS,
  "/admin/hospitals":PERMISSIONS.MANAGE_HOSPITALS,
  "/admin/permissions":PERMISSIONS.MANAGE_ROLES,
  "/admin/audit-logs":PERMISSIONS.VIEW_AUDIT_LOGS,
  "/admin/brand-voice":PERMISSIONS.MANAGE_BRAND_VOICE,
  "/admin/templates":PERMISSIONS.MANAGE_TEMPLATES,
  "/admin/integrations":PERMISSIONS.MANAGE_INTEGRATIONS,
  "/admin":PERMISSIONS.MANAGE_USERS,
  "/doctor/morning-briefing":PERMISSIONS.VIEW_MORNING_BRIEFING,
  "/doctor":PERMISSIONS.VIEW_MORNING_BRIEFING,
  "/production":PERMISSIONS.VIEW_CONTENT,
  "/strategy":PERMISSIONS.VIEW_STRATEGY,
  "/staff":PERMISSIONS.VIEW_LEADS
};

export function middleware(
  request:NextRequest
) {
  const path = request.nextUrl.pathname;

  if (isProductionBlockedPath(path)) {
    return new NextResponse(null, { status:404 });
  }

  const token =
    request.cookies.get("vip_access_token")?.value ??
    request.cookies.get("access_token")?.value;
  const user = token ? decodeJwtPayload(token) : null;

  if (path === "/production/content-strategy") {
    return redirect(request, "/strategy/content-strategy");
  }

  if (path === "/strategy") {
    return NextResponse.next();
  }

  if (
    PUBLIC_VISUAL_PREVIEW_PATHS.has(path) ||
    path.startsWith("/admin/system") ||
    path === "/admin/integrations/health" ||
    path.startsWith("/admin/intelligence") ||
    path.startsWith("/admin/analytics") ||
    path.startsWith("/admin/strategy") ||
    path.startsWith("/admin/reports") ||
    isAdminCompetitorIntelligencePath(path) ||
    isAdminExecutiveReportPath(path) ||
    isAdminStrategyPath(path) ||
    path.startsWith("/strategy/") ||
    path.startsWith("/production/social-intelligence") ||
    path.startsWith("/production/hashtags")
  ) {
    return NextResponse.next();
  }

  if (!isProtectedPortalPath(path)) {
    if (path === "/login" && user) {
      return redirectToRoleHome(request, user.role);
    }

    return NextResponse.next();
  }

  if (!user) {
    return redirect(request, "/login");
  }

  if (!user.isGlobal && !user.hospitalId) {
    return redirect(request, "/unauthorized");
  }

  const requiredPermission = getRequiredPermission(path);

  if (
    requiredPermission &&
    !hasPermission(user, requiredPermission)
  ) {
    return redirectToRoleHome(request, user.role);
  }

  return NextResponse.next();
}

export const config = {
  matcher:[
    "/admin/:path*",
    "/doctor/:path*",
    "/production/:path*",
    "/strategy/:path*",
    "/staff/:path*",
    "/overview",
    "/login",
    "/design-mockups",
    "/api/test-agent/:path*",
    "/api/test-ingest/:path*",
    "/api/social/test-ingest/:path*"
  ]
};

function isProductionBlockedPath(
  path:string
) {
  return process.env.NODE_ENV === "production" &&
    PRODUCTION_BLOCKED_PATH_PREFIXES.some((prefix) =>
      path === prefix || path.startsWith(`${prefix}/`)
    );
}

function isProtectedPortalPath(
  path:string
) {
  return path === "/overview" || Object.keys(PATH_PERMISSIONS).some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function isAdminCompetitorIntelligencePath(
  path:string
) {
  return /^\/admin\/workspaces\/[^/]+\/competitor-intelligence$/.test(path);
}

function isAdminExecutiveReportPath(
  path:string
) {
  return /^\/admin\/workspaces\/[^/]+\/executive$/.test(path);
}

function isAdminStrategyPath(
  path:string
) {
  return /^\/admin\/workspaces\/[^/]+\/strategy(?:\/[^/]+)?$/.test(path);
}

function getRequiredPermission(
  path:string
) {
  const prefix = Object.keys(PATH_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((candidate) =>
      path === candidate || path.startsWith(`${candidate}/`)
    );

  return prefix
    ? PATH_PERMISSIONS[prefix]
    : null;
}

function redirectToRoleHome(
  request:NextRequest,
  role:UserRole
) {
  return redirect(
    request,
    ROLE_HOME[role]
  );
}

function redirect(
  request:NextRequest,
  path:string
) {
  return NextResponse.redirect(
    new URL(path, request.url)
  );
}

function decodeJwtPayload(
  token:string
): AuthUser | null {
  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as Partial<AuthUser>;

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
      hospitalId:
        typeof payload.hospitalId === "string"
          ? payload.hospitalId
          : null,
      isGlobal:payload.isGlobal
    };
  } catch {
    return null;
  }
}

function base64UrlDecode(
  value:string
) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - base64.length % 4) % 4),
    "="
  );

  return atob(padded);
}

function isUserRole(
  role:unknown
): role is UserRole {
  return (
    role === "ADMIN" ||
    role === "DOCTOR" ||
    role === "PRODUCTION" ||
    role === "STAFF"
  );
}
