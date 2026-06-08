import type {
  APIKeyRecord, AuditEntry, ProvisionWorkspaceInput, Role, SubscriptionPlan,
  UsageEvent, WorkspaceMember, WorkspaceSubscription,
} from "../types";

export interface ControlPlaneRepository {
  provisionWorkspace(input: ProvisionWorkspaceInput): Promise<void>;
  createMember(member: Omit<WorkspaceMember, "id">): Promise<WorkspaceMember>;
  createRole(role: Omit<Role, "id">): Promise<Role>;
  assignRole(memberId: string, roleId: string): Promise<void>;
  permissionsForMember(workspaceId: string, memberId: string): Promise<string[]>;
  saveAPIKey(key: APIKeyRecord): Promise<APIKeyRecord>;
  findAPIKeyByPrefix(prefix: string): Promise<APIKeyRecord | null>;
  revokeAPIKey(workspaceId: string, keyId: string, revokedAt: string): Promise<void>;
  findPlan(code: string): Promise<SubscriptionPlan | null>;
  subscription(workspaceId: string): Promise<WorkspaceSubscription | null>;
  recordUsage(event: UsageEvent): Promise<void>;
  usageTotal(workspaceId: string, metric: string, from: string, to: string): Promise<number>;
  audit(entry: AuditEntry): Promise<void>;
}

export interface SecretCipher {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export interface RateLimitHook {
  assertAllowed(workspaceId: string, metric: string): Promise<void>;
}
