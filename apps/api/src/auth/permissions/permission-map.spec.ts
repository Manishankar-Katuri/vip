import { UserRole } from "../types/user-role.enum";
import { Permission } from "./permissions.enum";
import {
  ALL_PERMISSIONS,
  getUserPermissions
} from "./permission-map";

describe("permission map", () => {
  it("grants ADMIN every permission", () => {
    expect(getUserPermissions(UserRole.ADMIN).sort()).toEqual(
      [...ALL_PERMISSIONS].sort()
    );
  });

  it("grants DOCTOR executive and intelligence permissions only", () => {
    expect(getUserPermissions(UserRole.DOCTOR).sort()).toEqual([
      Permission.VIEW_AI_INSIGHTS,
      Permission.VIEW_COMPETITORS,
      Permission.VIEW_MARKET_INTELLIGENCE,
      Permission.VIEW_MORNING_BRIEFING,
      Permission.VIEW_RECOMMENDATIONS,
      Permission.VIEW_REPUTATION,
      Permission.VIEW_REVENUE,
      Permission.VIEW_SOCIAL_INTELLIGENCE,
      Permission.VIEW_STRATEGY,
      Permission.VIEW_VIP_SCORE
    ].sort());
  });

  it("grants PRODUCTION content permissions only", () => {
    expect(getUserPermissions(UserRole.PRODUCTION).sort()).toEqual([
      Permission.CREATE_CONTENT,
      Permission.DELETE_CONTENT,
      Permission.EDIT_CONTENT,
      Permission.MANAGE_CALENDAR,
      Permission.MANAGE_CAMPAIGNS,
      Permission.MANAGE_HASHTAGS,
      Permission.VIEW_CONTENT,
      Permission.VIEW_SOCIAL_INTELLIGENCE,
      Permission.VIEW_STRATEGY
    ].sort());
  });

  it("grants STAFF operations permissions only", () => {
    expect(getUserPermissions(UserRole.STAFF).sort()).toEqual([
      Permission.MANAGE_CALLS,
      Permission.MANAGE_FOLLOWUPS,
      Permission.MANAGE_LEADS,
      Permission.MANAGE_TEMPLATES,
      Permission.VIEW_LEADS,
      Permission.VIEW_STRATEGY
    ].sort());
  });
});
