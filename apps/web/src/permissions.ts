"use client";

import { useMemo } from "react";

export {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  canAccessHospital,
  getUserPermissions,
  hasPermission,
  type AuthUser,
  type Permission,
  type UserRole
} from "@/permissions-core";

import {
  canAccessHospital,
  getUserPermissions,
  hasPermission,
  type AuthUser,
  type Permission
} from "@/permissions-core";

export function usePermission(
  user:AuthUser | null | undefined,
  permission?:Permission
) {
  return useMemo(
    () => {
      if (!permission) {
        return {
          permissions:getUserPermissions(user),
          allowed:false,
          can:(candidate:Permission) =>
            hasPermission(user, candidate),
          canAccessHospital:(hospitalId:string) =>
            canAccessHospital(user, hospitalId)
        };
      }

      return {
        permissions:getUserPermissions(user),
        allowed:hasPermission(user, permission),
        can:(candidate:Permission) =>
          hasPermission(user, candidate),
        canAccessHospital:(hospitalId:string) =>
          canAccessHospital(user, hospitalId)
      };
    },
    [user, permission]
  );
}

export function usePermissions(
  user:AuthUser | null | undefined,
  permissions:Permission[] = []
) {
  return useMemo(
    () => {
      const resolvedPermissions = getUserPermissions(user);

      return {
        permissions:resolvedPermissions,
        hasAll:permissions.every(
          (permission) => resolvedPermissions.includes(permission)
        ),
        hasAny:permissions.some(
          (permission) => resolvedPermissions.includes(permission)
        ),
        can:(permission:Permission) =>
          resolvedPermissions.includes(permission)
      };
    },
    [user, permissions]
  );
}
