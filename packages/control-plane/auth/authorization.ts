import type { ControlPlaneRepository } from "../interfaces";
import type { AuthContext } from "../types";

export class TenantIsolationError extends Error {
  constructor() {
    super("Requested resource is outside the authorized workspace.");
    this.name = "TenantIsolationError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(permission: string) {
    super(`Permission required: ${permission}.`);
    this.name = "PermissionDeniedError";
  }
}

export class TenantIsolationGuard {
  assertWorkspace(context: AuthContext, resourceWorkspaceId: string) {
    if (context.workspaceId !== resourceWorkspaceId) throw new TenantIsolationError();
  }

  scopedCacheKey(context: AuthContext, key: string) {
    return `workspace:${context.workspaceId}:${key}`;
  }
}

export class PermissionGuard {
  require(context: AuthContext, permission: string) {
    if (!context.permissions.includes(permission) && !context.permissions.includes("*")) {
      throw new PermissionDeniedError(permission);
    }
  }
}

export class RBACService {
  constructor(private readonly repository: ControlPlaneRepository) {}

  async contextForMember(workspaceId: string, memberId: string): Promise<AuthContext> {
    return {
      workspaceId,
      subjectId: memberId,
      subjectType: "MEMBER",
      permissions: await this.repository.permissionsForMember(workspaceId, memberId),
    };
  }
}
