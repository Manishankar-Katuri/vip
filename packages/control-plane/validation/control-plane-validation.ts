import type { ProvisionWorkspaceInput } from "../types";

const IDENTIFIER = /^[A-Za-z0-9_-]{1,128}$/;
const PERMISSION = /^(\*|[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*)$/;

export class ControlPlaneValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControlPlaneValidationError";
  }
}

export function validateWorkspaceId(workspaceId: string) {
  if (!IDENTIFIER.test(workspaceId)) throw new ControlPlaneValidationError("A safe workspaceId is required.");
}

export function validateAPIKeyScopes(scopes: string[]) {
  if (scopes.length === 0 || scopes.some((scope) => !PERMISSION.test(scope))) {
    throw new ControlPlaneValidationError("API key scopes must use valid permission identifiers.");
  }
}

export function validateProvisioningInput(input: ProvisionWorkspaceInput) {
  validateWorkspaceId(input.workspaceId);
  if (!input.workspaceName.trim() || !input.ownerUserId.trim() || !input.ownerEmail.includes("@") || !input.planCode.trim()) {
    throw new ControlPlaneValidationError("Workspace name, owner, valid email, and plan are required.");
  }
}
