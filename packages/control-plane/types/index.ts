export type MemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type APIKeyStatus = "ACTIVE" | "REVOKED" | "EXPIRED";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface AuthContext {
  workspaceId: string;
  subjectId: string;
  subjectType: "MEMBER" | "API_KEY" | "SYSTEM" | "AGENT";
  permissions: string[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  displayName?: string;
  status: MemberStatus;
  roles: string[];
}

export interface Role {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  permissions: string[];
  system?: boolean;
}

export interface APIKeyRecord {
  id: string;
  workspaceId: string;
  name: string;
  prefix: string;
  secretHash: string;
  encryptedSecret?: string;
  scopes: string[];
  status: APIKeyStatus;
  expiresAt?: string;
  revokedAt?: string;
}

export interface IssuedAPIKey {
  record: APIKeyRecord;
  token: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  limits: Record<string, number>;
  features: string[];
  monthlyPrice?: number;
}

export interface WorkspaceSubscription {
  workspaceId: string;
  planId: string;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
}

export interface UsageEvent {
  workspaceId: string;
  apiKeyId?: string;
  metric: string;
  quantity: number;
  source: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface QuotaSnapshot {
  workspaceId: string;
  metric: string;
  used: number;
  limit?: number;
  remaining?: number;
  exceeded: boolean;
}

export interface AuditEntry {
  workspaceId: string;
  action: string;
  actorType: "USER" | "SYSTEM" | "AI_COPILOT" | "AGENT" | "INTEGRATION";
  actorId?: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ProvisionWorkspaceInput {
  workspaceId: string;
  workspaceName: string;
  ownerUserId: string;
  ownerEmail: string;
  planCode: string;
  actorId?: string;
}
