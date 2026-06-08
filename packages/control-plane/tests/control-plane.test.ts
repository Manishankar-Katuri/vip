import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import {
  APIKeyService, PermissionDeniedError, PermissionGuard, RBACService, TenantIsolationError, TenantIsolationGuard,
} from "../auth";
import { InMemoryControlPlaneRepository } from "../persistence";
import { WorkspaceProvisioningService } from "../provisioning";
import { AesGcmSecretCipher, WebhookSignatureVerifier } from "../security";
import { QuotaExceededError, UsageMeteringService } from "../usage";
import { ControlPlaneValidationError } from "../validation";

function repository() {
  return new InMemoryControlPlaneRepository([{
    id: "starter-id", code: "starter", name: "Starter", limits: { ai_runs: 2 }, features: ["copilot"],
  }]);
}

test("provisions isolated workspace ownership and applies RBAC guards", async () => {
  const repo = repository();
  const provisioned = await new WorkspaceProvisioningService(repo).provision({
    workspaceId: "workspace-1", workspaceName: "One", ownerUserId: "user-1", ownerEmail: "owner@example.test", planCode: "starter",
  });
  const context = await new RBACService(repo).contextForMember("workspace-1", provisioned.owner.id);
  new PermissionGuard().require(context, "actions:approve");
  assert.throws(() => new TenantIsolationGuard().assertWorkspace(context, "workspace-2"), TenantIsolationError);
  assert.equal(new TenantIsolationGuard().scopedCacheKey(context, "dashboard"), "workspace:workspace-1:dashboard");
  assert.throws(() => new PermissionGuard().require({ ...context, permissions: [] }, "actions:create"), PermissionDeniedError);
});

test("issues encrypted API keys, authenticates scopes, revokes keys, and verifies webhooks", async () => {
  const repo = repository();
  const cipher = new AesGcmSecretCipher(randomBytes(32));
  const service = new APIKeyService(repo, cipher);
  const issued = await service.issue("workspace-1", "Worker", ["actions:create"]);
  assert.ok(issued.record.encryptedSecret);
  assert.equal((await service.authenticate(issued.token))?.workspaceId, "workspace-1");
  await service.revoke("workspace-1", issued.record.id);
  assert.equal(await service.authenticate(issued.token), null);
  const verifier = new WebhookSignatureVerifier("webhook-secret");
  const timestamp = new Date().toISOString();
  assert.equal(verifier.verify("payload", timestamp, verifier.sign("payload", timestamp)), true);
  assert.equal(verifier.verify("tampered", timestamp, verifier.sign("payload", timestamp)), false);
});

test("meters usage and enforces subscription quota boundaries", async () => {
  const repo = repository();
  await new WorkspaceProvisioningService(repo).provision({
    workspaceId: "workspace-1", workspaceName: "One", ownerUserId: "user-1", ownerEmail: "owner@example.test", planCode: "starter",
  });
  const usage = new UsageMeteringService(repo);
  for (let index = 0; index < 2; index += 1) {
    await usage.record({ workspaceId: "workspace-1", metric: "ai_runs", quantity: 1, source: "copilot", occurredAt: new Date().toISOString() });
  }
  assert.equal((await usage.quota("workspace-1", "ai_runs")).exceeded, true);
  await assert.rejects(
    () => usage.record({ workspaceId: "workspace-1", metric: "ai_runs", quantity: 1, source: "copilot", occurredAt: new Date().toISOString() }),
    QuotaExceededError
  );
  assert.equal(repo.audits[0].action, "WORKSPACE_PROVISIONED");
});

test("rejects unsafe tenant identifiers and malformed key scopes", async () => {
  const repo = repository();
  await assert.rejects(
    () => new WorkspaceProvisioningService(repo).provision({
      workspaceId: "../escape", workspaceName: "Unsafe", ownerUserId: "user", ownerEmail: "owner@example.test", planCode: "starter",
    }),
    ControlPlaneValidationError
  );
  await assert.rejects(
    () => new APIKeyService(repo).issue("workspace-1", "Unsafe", ["not a permission"]),
    ControlPlaneValidationError
  );
});
