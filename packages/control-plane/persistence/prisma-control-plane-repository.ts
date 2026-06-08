import type { ControlPlaneRepository } from "../interfaces";
import type {
  APIKeyRecord, AuditEntry, ProvisionWorkspaceInput, Role, SubscriptionPlan,
  UsageEvent, WorkspaceMember, WorkspaceSubscription,
} from "../types";

type Row = Record<string, unknown>;
interface Delegate {
  create(args: unknown): Promise<Row>;
  update(args: unknown): Promise<Row>;
  upsert(args: unknown): Promise<Row>;
  findFirst(args: unknown): Promise<Row | null>;
  findMany(args: unknown): Promise<Row[]>;
}
export interface ControlPlanePrismaClient {
  workspace: Delegate;
  workspaceMember: Delegate;
  role: Delegate;
  permission: Delegate;
  rolePermission: Delegate;
  workspaceMemberRole: Delegate;
  aPIKey: Delegate;
  usageEvent: Delegate;
  subscriptionPlan: Delegate;
  workspaceSubscription: Delegate;
  controlPlaneAuditEvent: Delegate;
  $transaction<T>(fn: (database: ControlPlanePrismaClient) => Promise<T>): Promise<T>;
}

export class PrismaControlPlaneRepository implements ControlPlaneRepository {
  constructor(private readonly database: ControlPlanePrismaClient) {}

  async provisionWorkspace(input: ProvisionWorkspaceInput) {
    const plan = await this.database.subscriptionPlan.findFirst({ where: { code: input.planCode, active: true } });
    if (!plan) throw new Error("Subscription plan not found.");
    await this.database.$transaction(async (db) => {
      await db.workspace.upsert({
        where: { id: input.workspaceId },
        create: { id: input.workspaceId, name: input.workspaceName, slug: input.workspaceId },
        update: { name: input.workspaceName },
      });
      const start = new Date();
      await db.workspaceSubscription.upsert({
        where: { workspaceId: input.workspaceId },
        create: { workspaceId: input.workspaceId, planId: String(plan.id), periodStart: start, periodEnd: new Date(start.getTime() + 30 * 86400000) },
        update: { planId: String(plan.id) },
      });
    });
  }

  async createMember(member: Omit<WorkspaceMember, "id">) {
    const row = await this.database.workspaceMember.create({ data: {
      workspaceId: member.workspaceId, userId: member.userId, email: member.email,
      displayName: member.displayName, status: member.status, joinedAt: member.status === "ACTIVE" ? new Date() : undefined,
    } });
    return memberFrom(row, member.roles);
  }

  async createRole(role: Omit<Role, "id">) {
    const row = await this.database.$transaction(async (db) => {
      const saved = await db.role.create({ data: {
        workspaceId: role.workspaceId, name: role.name, description: role.description, system: role.system ?? false,
      } });
      for (const permission of role.permissions) {
        const record = await db.permission.upsert({
          where: { key: permission }, create: { key: permission }, update: {},
        });
        await db.rolePermission.create({ data: { roleId: saved.id, permissionId: record.id } });
      }
      return saved;
    });
    return { ...role, id: String(row.id) };
  }

  async assignRole(memberId: string, roleId: string) {
    await this.database.workspaceMemberRole.create({ data: { memberId, roleId } });
  }

  async permissionsForMember(workspaceId: string, memberId: string) {
    const rows = await this.database.role.findMany({
      where: { workspaceId, members: { some: { memberId, member: { status: "ACTIVE" } } } },
      include: { permissions: { include: { permission: true } } },
    });
    return Array.from(new Set(rows.flatMap((role) => ((role.permissions as Row[] | undefined) ?? []).map((link) => String((link.permission as Row).key)))));
  }

  async saveAPIKey(key: APIKeyRecord) {
    await this.database.aPIKey.create({ data: {
      ...key, scopes: key.scopes, expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined,
    } });
    return key;
  }
  async findAPIKeyByPrefix(prefix: string) {
    const row = await this.database.aPIKey.findFirst({ where: { prefix } });
    return row ? keyFrom(row) : null;
  }
  async revokeAPIKey(workspaceId: string, keyId: string, revokedAt: string) {
    const existing = await this.database.aPIKey.findFirst({ where: { id: keyId, workspaceId } });
    if (!existing) throw new Error("API key not found in workspace.");
    await this.database.aPIKey.update({ where: { id: keyId }, data: { status: "REVOKED", revokedAt: new Date(revokedAt) } });
  }
  async findPlan(code: string) {
    const row = await this.database.subscriptionPlan.findFirst({ where: { OR: [{ code }, { id: code }], active: true } });
    return row ? planFrom(row) : null;
  }
  async subscription(workspaceId: string) {
    const row = await this.database.workspaceSubscription.findFirst({ where: { workspaceId } });
    return row ? subscriptionFrom(row) : null;
  }
  async recordUsage(event: UsageEvent) {
    await this.database.usageEvent.create({ data: { ...event, occurredAt: new Date(event.occurredAt) } });
  }
  async usageTotal(workspaceId: string, metric: string, from: string, to: string) {
    const rows = await this.database.usageEvent.findMany({
      where: { workspaceId, metric, occurredAt: { gte: new Date(from), lte: new Date(to) } },
    });
    return rows.reduce((sum, row) => sum + Number(row.quantity), 0);
  }
  async audit(entry: AuditEntry) {
    await this.database.controlPlaneAuditEvent.create({ data: { ...entry, createdAt: new Date(entry.createdAt) } });
  }
}

function memberFrom(row: Row, roles: string[]): WorkspaceMember { return { id: String(row.id), workspaceId: String(row.workspaceId), userId: String(row.userId), email: String(row.email), displayName: maybe(row.displayName), status: row.status as WorkspaceMember["status"], roles }; }
function keyFrom(row: Row): APIKeyRecord { return { id: String(row.id), workspaceId: String(row.workspaceId), name: String(row.name), prefix: String(row.prefix), secretHash: String(row.secretHash), encryptedSecret: maybe(row.encryptedSecret), scopes: row.scopes as string[], status: row.status as APIKeyRecord["status"], expiresAt: timestamp(row.expiresAt), revokedAt: timestamp(row.revokedAt) }; }
function planFrom(row: Row): SubscriptionPlan { return { id: String(row.id), code: String(row.code), name: String(row.name), limits: row.limits as Record<string, number>, features: row.features as string[], monthlyPrice: row.monthlyPrice == null ? undefined : Number(row.monthlyPrice) }; }
function subscriptionFrom(row: Row): WorkspaceSubscription { return { workspaceId: String(row.workspaceId), planId: String(row.planId), status: row.status as WorkspaceSubscription["status"], periodStart: timestamp(row.periodStart)!, periodEnd: timestamp(row.periodEnd)! }; }
function maybe(value: unknown) { return value == null ? undefined : String(value); }
function timestamp(value: unknown) { return value == null ? undefined : (value instanceof Date ? value : new Date(String(value))).toISOString(); }
