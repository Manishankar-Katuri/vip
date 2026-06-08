import { ActionOrchestrator } from "../orchestration";
import { InMemoryActionRepository } from "../persistence";
import { InMemoryActionQueue } from "../queue";
import { ActionWorkerProcessor } from "../workers";

export async function runMockSocialPublishingWorkflow() {
  const repository = new InMemoryActionRepository();
  const queue = new InMemoryActionQueue();
  const orchestrator = new ActionOrchestrator(repository, queue);
  const plan = await orchestrator.createAndQueue({
    workspaceId: "workspace_demo_health",
    name: "Respiratory awareness publishing campaign",
    type: "SOCIAL_PUBLISHING",
    idempotencyKey: "campaign:respiratory-awareness:week-22",
    requiresApproval: true,
    actor: { type: "AI_COPILOT", id: "content-agent" },
    steps: [
      { name: "Render compliant copy", processor: "render-copy" },
      { name: "Publish approved post", processor: "publish-social", requiresApproval: true },
    ],
  });
  await orchestrator.approve(plan.workspaceId, plan.id, { type: "USER", id: "marketing-lead" });
  const worker = new ActionWorkerProcessor(repository, queue, [
    { name: "render-copy", execute: async () => ({ caption: "Breathe better this season." }) },
    { name: "publish-social", execute: async () => ({ published: true }) },
  ]);
  const queued = queue.jobs[0].job;
  const execution = await worker.process(queued);
  return { plan, execution, metrics: await repository.metrics(plan.workspaceId), logs: repository.logs };
}
