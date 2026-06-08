import type { ActionOrchestrator } from "@vip/action-engine";
import type { ToolDefinition } from "../interfaces";

export class ActionProposalTool implements ToolDefinition {
  readonly name = "action.propose";
  readonly requiredPermission = "actions:create";

  constructor(private readonly orchestrator: ActionOrchestrator) {}

  async execute(input: Record<string, unknown>, context: { workspaceId: string }) {
    const plan = await this.orchestrator.createAndQueue({
      workspaceId: context.workspaceId,
      name: String(input.name ?? "Copilot proposed action"),
      type: "AI_ACTION_SEQUENCE",
      idempotencyKey: String(input.idempotencyKey ?? `copilot:${Date.now()}`),
      requiresApproval: true,
      steps: [{ name: "Review proposed action", processor: "human-review", requiresApproval: true }],
      actor: { type: "AI_COPILOT" },
    });
    return { actionPlanId: plan.id, status: plan.status };
  }
}
