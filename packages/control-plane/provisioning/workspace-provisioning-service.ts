import type { ControlPlaneRepository } from "../interfaces";
import type { ProvisionWorkspaceInput } from "../types";
import { validateProvisioningInput } from "../validation";

export const DEFAULT_OWNER_PERMISSIONS = [
  "*", "strategy:read", "actions:create", "actions:approve", "copilot:run", "usage:read", "members:manage",
];

export class WorkspaceProvisioningService {
  constructor(private readonly repository: ControlPlaneRepository) {}

  async provision(input: ProvisionWorkspaceInput) {
    validateProvisioningInput(input);
    const plan = await this.repository.findPlan(input.planCode);
    if (!plan) throw new Error(`Subscription plan not found: ${input.planCode}.`);
    await this.repository.provisionWorkspace(input);
    const ownerRole = await this.repository.createRole({
      workspaceId: input.workspaceId,
      name: "OWNER",
      description: "Workspace owner with full administration rights.",
      permissions: DEFAULT_OWNER_PERMISSIONS,
      system: true,
    });
    const owner = await this.repository.createMember({
      workspaceId: input.workspaceId,
      userId: input.ownerUserId,
      email: input.ownerEmail,
      status: "ACTIVE",
      roles: ["OWNER"],
    });
    await this.repository.assignRole(owner.id, ownerRole.id);
    await this.repository.audit({
      workspaceId: input.workspaceId,
      action: "WORKSPACE_PROVISIONED",
      actorType: "SYSTEM",
      actorId: input.actorId,
      targetType: "Workspace",
      targetId: input.workspaceId,
      payload: { planCode: input.planCode, ownerUserId: input.ownerUserId },
      createdAt: new Date().toISOString(),
    });
    return { owner, ownerRole, plan };
  }
}
