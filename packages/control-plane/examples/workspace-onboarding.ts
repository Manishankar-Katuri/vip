import { APIKeyService, RBACService } from "../auth";
import { InMemoryControlPlaneRepository } from "../persistence";
import { WorkspaceProvisioningService } from "../provisioning";
import { AesGcmSecretCipher } from "../security";
import { UsageMeteringService } from "../usage";

export async function runMockWorkspaceOnboarding() {
  const repository = new InMemoryControlPlaneRepository([{
    id: "plan-growth", code: "growth", name: "Growth", limits: { ai_runs: 100 }, features: ["copilot", "actions"],
  }]);
  const provisioning = new WorkspaceProvisioningService(repository);
  const result = await provisioning.provision({
    workspaceId: "workspace_demo_health", workspaceName: "VIP Health Network",
    ownerUserId: "owner-1", ownerEmail: "owner@vip.example", planCode: "growth",
  });
  const keys = new APIKeyService(repository, new AesGcmSecretCipher(Buffer.alloc(32, 7)));
  const issued = await keys.issue("workspace_demo_health", "Automation key", ["actions:create", "copilot:run"]);
  const usage = new UsageMeteringService(repository);
  await usage.record({ workspaceId: "workspace_demo_health", metric: "ai_runs", quantity: 1, source: "copilot", occurredAt: new Date().toISOString() });
  return {
    result,
    apiAuthentication: await keys.authenticate(issued.token),
    permissions: await new RBACService(repository).contextForMember("workspace_demo_health", result.owner.id),
    quota: await usage.quota("workspace_demo_health", "ai_runs"),
  };
}
