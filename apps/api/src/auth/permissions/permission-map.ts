import { UserRole } from "../types/user-role.enum";
import { Permission } from "./permissions.enum";

export const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PERMISSIONS:Record<UserRole, readonly Permission[]> = {
  [UserRole.ADMIN]:ALL_PERMISSIONS,
  [UserRole.DOCTOR]:[
    Permission.VIEW_MORNING_BRIEFING,
    Permission.VIEW_VIP_SCORE,
    Permission.VIEW_REVENUE,
    Permission.VIEW_REPUTATION,
    Permission.VIEW_COMPETITORS,
    Permission.VIEW_AI_INSIGHTS,
    Permission.VIEW_STRATEGY,
    Permission.VIEW_MARKET_INTELLIGENCE,
    Permission.VIEW_SOCIAL_INTELLIGENCE,
    Permission.VIEW_RECOMMENDATIONS
  ],
  [UserRole.PRODUCTION]:[
    Permission.VIEW_STRATEGY,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MANAGE_CAMPAIGNS,
    Permission.MANAGE_CALENDAR,
    Permission.MANAGE_HASHTAGS,
    Permission.VIEW_SOCIAL_INTELLIGENCE
  ],
  [UserRole.STAFF]:[
    Permission.VIEW_STRATEGY,
    Permission.VIEW_LEADS,
    Permission.MANAGE_LEADS,
    Permission.MANAGE_FOLLOWUPS,
    Permission.MANAGE_CALLS,
    Permission.MANAGE_TEMPLATES
  ]
};

export function getUserPermissions(
  role:UserRole
) {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasPermission(
  role:UserRole,
  permission:Permission
) {
  return getUserPermissions(role).includes(permission);
}
