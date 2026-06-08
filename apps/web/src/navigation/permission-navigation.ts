import { PERMISSIONS, type Permission } from "@/permissions-core";

export type NavigationItem = {
  title:string;
  href:string;
  permission:Permission;
  module:
    | "analytics"
    | "social"
    | "market"
    | "crm"
    | "content"
    | "recommendations"
    | "workflows"
    | "admin";
};

export const NAVIGATION_ITEMS:NavigationItem[] = [
  {
    title:"Morning Briefing",
    href:"/today",
    permission:PERMISSIONS.VIEW_MORNING_BRIEFING,
    module:"analytics"
  },
  {
    title:"VIP Score",
    href:"/dashboard",
    permission:PERMISSIONS.VIEW_VIP_SCORE,
    module:"analytics"
  },
  {
    title:"Revenue",
    href:"/analytics",
    permission:PERMISSIONS.VIEW_REVENUE,
    module:"analytics"
  },
  {
    title:"Reputation",
    href:"/results",
    permission:PERMISSIONS.VIEW_REPUTATION,
    module:"analytics"
  },
  {
    title:"Competitors",
    href:"/local-market",
    permission:PERMISSIONS.VIEW_COMPETITORS,
    module:"market"
  },
  {
    title:"Content",
    href:"/campaign-studio",
    permission:PERMISSIONS.VIEW_CONTENT,
    module:"content"
  },
  {
    title:"Leads",
    href:"/outreach",
    permission:PERMISSIONS.VIEW_LEADS,
    module:"crm"
  },
  {
    title:"Recommendations",
    href:"/opportunities",
    permission:PERMISSIONS.VIEW_RECOMMENDATIONS,
    module:"recommendations"
  },
  {
    title:"Workflows",
    href:"/governance",
    permission:PERMISSIONS.VIEW_WORKFLOWS,
    module:"workflows"
  },
  {
    title:"Hospitals",
    href:"/admin",
    permission:PERMISSIONS.MANAGE_HOSPITALS,
    module:"admin"
  }
];

export function getNavigationForPermissions(
  permissions:readonly Permission[]
) {
  return NAVIGATION_ITEMS.filter((item) =>
    permissions.includes(item.permission)
  );
}
