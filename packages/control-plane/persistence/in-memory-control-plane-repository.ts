import type { ControlPlaneRepository } from "../interfaces";
import type {
  APIKeyRecord, AuditEntry, ProvisionWorkspaceInput, Role, SubscriptionPlan,
  UsageEvent, WorkspaceMember, WorkspaceSubscription,
} from "../types";

export class InMemoryControlPlaneRepository implements ControlPlaneRepository {
  readonly members: WorkspaceMember[] = [];
  readonly roles: Role[] = [];
  readonly apiKeys: APIKeyRecord[] = [];
  readonly usage: UsageEvent[] = [];
  readonly audits: AuditEntry[] = [];
  readonly workspaces = new Set<string>();
  readonly subscriptions: WorkspaceSubscription[] = [];

  constructor(readonly plans: SubscriptionPlan[] = []) {}

  async provisionWorkspace(input: ProvisionWorkspaceInput) {
    this.workspaces.add(input.workspaceId);
    const plan = this.plans.find((item) => item.code === input.planCode)!;
    this.subscriptions.push({
      workspaceId: input.workspaceId, planId: plan.id, status: "TRIAL",
      periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }
  async createMember(member: Omit<WorkspaceMember, "id">) {
    const saved = { ...member, id: `member-${this.members.length + 1}` };
    this.members.push(saved); return saved;
  }
  async createRole(role: Omit<Role, "id">) {
    const saved = { ...role, id: `role-${this.roles.length + 1}` };
    this.roles.push(saved); return saved;
  }
  async assignRole(memberId: string, roleId: string) {
    const member = this.members.find((item) => item.id === memberId);
    const role = this.roles.find((item) => item.id === roleId);
    if (member && role && !member.roles.includes(role.name)) member.roles.push(role.name);
  }
  async permissionsForMember(workspaceId: string, memberId: string) {
    const member = this.members.find((item) => item.id === memberId && item.workspaceId === workspaceId);
    if (!member || member.status !== "ACTIVE") return [];
    return Array.from(new Set(this.roles.filter((role) => role.workspaceId === workspaceId && member.roles.includes(role.name)).flatMap((role) => role.permissions)));
  }
  async saveAPIKey(key: APIKeyRecord) { this.apiKeys.push(key); return key; }
  async findAPIKeyByPrefix(prefix: string) { return this.apiKeys.find((item) => item.prefix === prefix) ?? null; }
  async revokeAPIKey(workspaceId: string, keyId: string, revokedAt: string) {
    const key = this.apiKeys.find((item) => item.id === keyId && item.workspaceId === workspaceId);
    if (key) { key.status = "REVOKED"; key.revokedAt = revokedAt; }
  }
  async findPlan(codeOrId: string) { return this.plans.find((item) => item.code === codeOrId || item.id === codeOrId) ?? null; }
  async subscription(workspaceId: string) { return this.subscriptions.find((item) => item.workspaceId === workspaceId) ?? null; }
  async recordUsage(event: UsageEvent) { this.usage.push(event); }
  async usageTotal(workspaceId: string, metric: string, from: string, to: string) {
    return this.usage.filter((item) => item.workspaceId === workspaceId && item.metric === metric && item.occurredAt >= from && item.occurredAt <= to).reduce((sum, item) => sum + item.quantity, 0);
  }
  async audit(entry: AuditEntry) { this.audits.push(entry); }
}
