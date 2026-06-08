-- CreateEnum
CREATE TYPE "ActionPlanType" AS ENUM ('SOCIAL_PUBLISHING', 'MARKETING_PLAYBOOK', 'CAMPAIGN_EXECUTION', 'ALERT_PIPELINE', 'AI_ACTION_SEQUENCE');
CREATE TYPE "ActionPlanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'DEAD_LETTERED');
CREATE TYPE "ActionExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_APPROVAL', 'RETRY_SCHEDULED', 'COMPLETED', 'FAILED', 'DEAD_LETTERED');
CREATE TYPE "ExecutionStepStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'SKIPPED');
CREATE TYPE "ExecutionLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "AIAgentType" AS ENUM ('STRATEGY_ANALYST', 'GROWTH_AGENT', 'CONTENT_AGENT', 'RISK_MONITOR', 'CAMPAIGN_OPTIMIZER');
CREATE TYPE "AIRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED');
CREATE TYPE "WorkspaceMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');
CREATE TYPE "APIKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ActionPlanType" NOT NULL,
    "status" "ActionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "input" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "cronExpression" TEXT,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdByType" "StrategyActorType" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionExecution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "queueJobId" TEXT,
    "status" "ActionExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "output" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecutionStep" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "actionExecutionId" TEXT,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "processor" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "status" "ExecutionStepStatus" NOT NULL DEFAULT 'PENDING',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExecutionStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionExecutionId" TEXT NOT NULL,
    "executionStepId" TEXT,
    "level" "ExecutionLogLevel" NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecutionFailure" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionExecutionId" TEXT NOT NULL,
    "executionStepId" TEXT,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "retryable" BOOLEAN NOT NULL,
    "attempt" INTEGER NOT NULL,
    "details" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutionFailure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByType" "StrategyActorType" NOT NULL,
    "requestedById" TEXT,
    "decidedByType" "StrategyActorType",
    "decidedById" TEXT,
    "reason" TEXT NOT NULL,
    "decisionNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionOutboxEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actionPlanId" TEXT,
    "actionExecutionId" TEXT,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "StrategyEventStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    CONSTRAINT "ActionOutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIExecutionTrace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "actionPlanId" TEXT,
    "agentType" "AIAgentType" NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "AIRunStatus" NOT NULL DEFAULT 'PENDING',
    "triggerType" TEXT,
    "triggerId" TEXT,
    "model" TEXT,
    "input" JSONB,
    "output" JSONB,
    "toolCalls" JSONB,
    "promptKey" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "AIExecutionTrace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentMemoryEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "agentType" "AIAgentType" NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentMemoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agentType" "AIAgentType" NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "WorkspaceMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE "WorkspaceMemberRole" (
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "WorkspaceMemberRole_pkey" PRIMARY KEY ("memberId","roleId")
);

CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "encryptedSecret" TEXT,
    "scopes" JSONB NOT NULL,
    "status" "APIKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "metric" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limits" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "monthlyPrice" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceSubscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ControlPlaneAuditEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" "StrategyActorType" NOT NULL,
    "actorId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlPlaneAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActionPlan_workspaceId_idempotencyKey_key" ON "ActionPlan"("workspaceId", "idempotencyKey");
CREATE INDEX "ActionPlan_workspaceId_status_scheduledFor_idx" ON "ActionPlan"("workspaceId", "status", "scheduledFor");
CREATE INDEX "ActionPlan_recommendationId_idx" ON "ActionPlan"("recommendationId");
CREATE UNIQUE INDEX "ActionExecution_workspaceId_idempotencyKey_key" ON "ActionExecution"("workspaceId", "idempotencyKey");
CREATE INDEX "ActionExecution_workspaceId_status_createdAt_idx" ON "ActionExecution"("workspaceId", "status", "createdAt");
CREATE INDEX "ActionExecution_actionPlanId_createdAt_idx" ON "ActionExecution"("actionPlanId", "createdAt");
CREATE UNIQUE INDEX "ExecutionStep_actionPlanId_position_key" ON "ExecutionStep"("actionPlanId", "position");
CREATE INDEX "ExecutionStep_workspaceId_status_updatedAt_idx" ON "ExecutionStep"("workspaceId", "status", "updatedAt");
CREATE INDEX "ExecutionLog_actionExecutionId_createdAt_idx" ON "ExecutionLog"("actionExecutionId", "createdAt");
CREATE INDEX "ExecutionLog_workspaceId_createdAt_idx" ON "ExecutionLog"("workspaceId", "createdAt");
CREATE INDEX "ExecutionFailure_actionExecutionId_occurredAt_idx" ON "ExecutionFailure"("actionExecutionId", "occurredAt");
CREATE INDEX "ExecutionFailure_workspaceId_occurredAt_idx" ON "ExecutionFailure"("workspaceId", "occurredAt");
CREATE INDEX "ApprovalRequest_workspaceId_status_requestedAt_idx" ON "ApprovalRequest"("workspaceId", "status", "requestedAt");
CREATE INDEX "ApprovalRequest_actionPlanId_requestedAt_idx" ON "ApprovalRequest"("actionPlanId", "requestedAt");
CREATE INDEX "ActionOutboxEvent_status_occurredAt_idx" ON "ActionOutboxEvent"("status", "occurredAt");
CREATE INDEX "ActionOutboxEvent_workspaceId_occurredAt_idx" ON "ActionOutboxEvent"("workspaceId", "occurredAt");
CREATE INDEX "AIExecutionTrace_workspaceId_agentType_startedAt_idx" ON "AIExecutionTrace"("workspaceId", "agentType", "startedAt");
CREATE INDEX "AIExecutionTrace_workspaceId_status_startedAt_idx" ON "AIExecutionTrace"("workspaceId", "status", "startedAt");
CREATE UNIQUE INDEX "AgentMemoryEntry_workspaceId_agentType_scope_key_key" ON "AgentMemoryEntry"("workspaceId", "agentType", "scope", "key");
CREATE INDEX "AgentMemoryEntry_workspaceId_agentType_updatedAt_idx" ON "AgentMemoryEntry"("workspaceId", "agentType", "updatedAt");
CREATE UNIQUE INDEX "PromptTemplate_workspaceId_key_version_key" ON "PromptTemplate"("workspaceId", "key", "version");
CREATE INDEX "PromptTemplate_workspaceId_agentType_active_idx" ON "PromptTemplate"("workspaceId", "agentType", "active");
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_email_key" ON "WorkspaceMember"("workspaceId", "email");
CREATE INDEX "WorkspaceMember_workspaceId_status_idx" ON "WorkspaceMember"("workspaceId", "status");
CREATE UNIQUE INDEX "Role_workspaceId_name_key" ON "Role"("workspaceId", "name");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "APIKey_prefix_key" ON "APIKey"("prefix");
CREATE INDEX "APIKey_workspaceId_status_idx" ON "APIKey"("workspaceId", "status");
CREATE INDEX "UsageEvent_workspaceId_metric_occurredAt_idx" ON "UsageEvent"("workspaceId", "metric", "occurredAt");
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");
CREATE UNIQUE INDEX "WorkspaceSubscription_workspaceId_key" ON "WorkspaceSubscription"("workspaceId");
CREATE INDEX "WorkspaceSubscription_status_periodEnd_idx" ON "WorkspaceSubscription"("status", "periodEnd");
CREATE INDEX "ControlPlaneAuditEvent_workspaceId_createdAt_idx" ON "ControlPlaneAuditEvent"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActionExecution" ADD CONSTRAINT "ActionExecution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionExecution" ADD CONSTRAINT "ActionExecution_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_actionExecutionId_fkey" FOREIGN KEY ("actionExecutionId") REFERENCES "ActionExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_actionExecutionId_fkey" FOREIGN KEY ("actionExecutionId") REFERENCES "ActionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_executionStepId_fkey" FOREIGN KEY ("executionStepId") REFERENCES "ExecutionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutionFailure" ADD CONSTRAINT "ExecutionFailure_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionFailure" ADD CONSTRAINT "ExecutionFailure_actionExecutionId_fkey" FOREIGN KEY ("actionExecutionId") REFERENCES "ActionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionFailure" ADD CONSTRAINT "ExecutionFailure_executionStepId_fkey" FOREIGN KEY ("executionStepId") REFERENCES "ExecutionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionOutboxEvent" ADD CONSTRAINT "ActionOutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionOutboxEvent" ADD CONSTRAINT "ActionOutboxEvent_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionOutboxEvent" ADD CONSTRAINT "ActionOutboxEvent_actionExecutionId_fkey" FOREIGN KEY ("actionExecutionId") REFERENCES "ActionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIExecutionTrace" ADD CONSTRAINT "AIExecutionTrace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIExecutionTrace" ADD CONSTRAINT "AIExecutionTrace_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIExecutionTrace" ADD CONSTRAINT "AIExecutionTrace_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentMemoryEntry" ADD CONSTRAINT "AgentMemoryEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMemberRole" ADD CONSTRAINT "WorkspaceMemberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMemberRole" ADD CONSTRAINT "WorkspaceMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceSubscription" ADD CONSTRAINT "WorkspaceSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceSubscription" ADD CONSTRAINT "WorkspaceSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlPlaneAuditEvent" ADD CONSTRAINT "ControlPlaneAuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
