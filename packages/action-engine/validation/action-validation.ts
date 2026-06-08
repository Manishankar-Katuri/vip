import type { ActionPlanInput } from "../types";

const WORKSPACE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export class ActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionValidationError";
  }
}

export function validateActionPlanInput(input: ActionPlanInput) {
  if (!WORKSPACE_ID.test(input.workspaceId) || !input.name.trim() || !input.idempotencyKey.trim()) {
    throw new ActionValidationError("Action plan requires safe workspace, name, and idempotency key.");
  }
  if (input.steps.length === 0 || input.steps.some((step) => !step.name.trim() || !step.processor.trim())) {
    throw new ActionValidationError("Action plan requires executable named steps.");
  }
  if (input.maxAttempts !== undefined && (input.maxAttempts < 1 || input.maxAttempts > 20)) {
    throw new ActionValidationError("Action plan attempts must be between 1 and 20.");
  }
  return input;
}
