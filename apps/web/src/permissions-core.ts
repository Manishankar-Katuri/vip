export type UserRole = "ADMIN" | "DOCTOR" | "PRODUCTION" | "STAFF";

export type AuthUser = {
  userId:string;
  role:UserRole;
  hospitalId:string | null;
  isGlobal:boolean;
  permissions?:Permission[];
};

export const PERMISSIONS = {
  VIEW_MORNING_BRIEFING:"view_morning_briefing",
  VIEW_VIP_SCORE:"view_vip_score",
  VIEW_REVENUE:"view_revenue",
  VIEW_REPUTATION:"view_reputation",
  VIEW_COMPETITORS:"view_competitors",
  VIEW_AI_INSIGHTS:"view_ai_insights",
  VIEW_STRATEGY:"view_strategy",

  VIEW_CONTENT:"view_content",
  CREATE_CONTENT:"create_content",
  EDIT_CONTENT:"edit_content",
  DELETE_CONTENT:"delete_content",
  MANAGE_CAMPAIGNS:"manage_campaigns",
  MANAGE_CALENDAR:"manage_calendar",
  MANAGE_HASHTAGS:"manage_hashtags",

  VIEW_LEADS:"view_leads",
  MANAGE_LEADS:"manage_leads",
  MANAGE_FOLLOWUPS:"manage_followups",
  MANAGE_CALLS:"manage_calls",
  MANAGE_TEMPLATES:"manage_templates",

  MANAGE_USERS:"manage_users",
  MANAGE_ROLES:"manage_roles",
  MANAGE_HOSPITALS:"manage_hospitals",
  VIEW_AUDIT_LOGS:"view_audit_logs",
  MANAGE_INTEGRATIONS:"manage_integrations",
  MANAGE_BRAND_VOICE:"manage_brand_voice",

  VIEW_MARKET_INTELLIGENCE:"view_market_intelligence",
  VIEW_SOCIAL_INTELLIGENCE:"view_social_intelligence",
  VIEW_RECOMMENDATIONS:"view_recommendations",
  VIEW_WORKFLOWS:"view_workflows",
  MANAGE_WORKFLOWS:"manage_workflows"
} as const;

export type Permission =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS:Record<UserRole, readonly Permission[]> = {
  ADMIN:ALL_PERMISSIONS,
  DOCTOR:[
    PERMISSIONS.VIEW_MORNING_BRIEFING,
    PERMISSIONS.VIEW_VIP_SCORE,
    PERMISSIONS.VIEW_REVENUE,
    PERMISSIONS.VIEW_REPUTATION,
    PERMISSIONS.VIEW_COMPETITORS,
    PERMISSIONS.VIEW_AI_INSIGHTS,
    PERMISSIONS.VIEW_STRATEGY,
    PERMISSIONS.VIEW_MARKET_INTELLIGENCE,
    PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE,
    PERMISSIONS.VIEW_RECOMMENDATIONS
  ],
  PRODUCTION:[
    PERMISSIONS.VIEW_STRATEGY,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.MANAGE_HASHTAGS,
    PERMISSIONS.VIEW_SOCIAL_INTELLIGENCE
  ],
  STAFF:[
    PERMISSIONS.VIEW_STRATEGY,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.MANAGE_FOLLOWUPS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.MANAGE_TEMPLATES
  ]
};

export function getUserPermissions(
  userOrRole:AuthUser | UserRole | null | undefined
) {
  if (!userOrRole) return [];

  if (
    typeof userOrRole !== "string" &&
    Array.isArray(userOrRole.permissions)
  ) {
    return [...userOrRole.permissions];
  }

  const role =
    typeof userOrRole === "string"
      ? userOrRole
      : userOrRole.role;

  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasPermission(
  user:AuthUser | null | undefined,
  permission:Permission
) {
  if (!user) return false;

  return getUserPermissions(user).includes(permission);
}

export function canAccessHospital(
  user:AuthUser | null | undefined,
  hospitalId:string
) {
  if (!user) return false;
  if (user.isGlobal) return true;

  return user.hospitalId === hospitalId;
}
