"use client";

import type React from "react";

import { useHospital } from "@/hooks/useHospital";
import {
  hasPermission,
  type Permission
} from "@/permissions";

export function PermissionGate({
  permission,
  permissions,
  mode = "all",
  fallback = null,
  children
}: Readonly<{
  permission?:Permission;
  permissions?:Permission[];
  mode?:"all" | "any";
  fallback?:React.ReactNode;
  children:React.ReactNode;
}>) {
  const { currentUser } = useHospital();
  const requiredPermissions = [
    ...(permission ? [permission] : []),
    ...(permissions ?? [])
  ];
  const allowed =
    !currentUser ||
    requiredPermissions.length === 0 ||
    (mode === "all"
      ? requiredPermissions.every(
          (candidate) => hasPermission(currentUser, candidate)
        )
      : requiredPermissions.some(
          (candidate) => hasPermission(currentUser, candidate)
        ));

  return allowed ? <>{children}</> : <>{fallback}</>;
}
