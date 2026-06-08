CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationWorkflowMapping" (
    "id" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    CONSTRAINT "AutomationWorkflowMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "workflow" JSONB NOT NULL,
    "retryPolicy" JSONB NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "queueJobId" TEXT,
    "lastFailure" TEXT,
    "deadLetterEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationOutboxEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "StrategyEventStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    CONSTRAINT "AutomationOutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutomationRule_workspaceId_enabled_trigger_idx" ON "AutomationRule"("workspaceId", "enabled", "trigger");
CREATE INDEX "AutomationWorkflowMapping_recommendationType_idx" ON "AutomationWorkflowMapping"("recommendationType");
CREATE UNIQUE INDEX "AutomationExecution_workspaceId_idempotencyKey_key" ON "AutomationExecution"("workspaceId", "idempotencyKey");
CREATE INDEX "AutomationExecution_workspaceId_status_queuedAt_idx" ON "AutomationExecution"("workspaceId", "status", "queuedAt");
CREATE INDEX "AutomationExecution_workspaceId_ruleId_queuedAt_idx" ON "AutomationExecution"("workspaceId", "ruleId", "queuedAt");
CREATE INDEX "AutomationExecutionLog_executionId_occurredAt_idx" ON "AutomationExecutionLog"("executionId", "occurredAt");
CREATE INDEX "AutomationExecutionLog_workspaceId_occurredAt_idx" ON "AutomationExecutionLog"("workspaceId", "occurredAt");
CREATE UNIQUE INDEX "AutomationOutboxEvent_workspaceId_idempotencyKey_key" ON "AutomationOutboxEvent"("workspaceId", "idempotencyKey");
CREATE INDEX "AutomationOutboxEvent_status_occurredAt_idx" ON "AutomationOutboxEvent"("status", "occurredAt");
CREATE INDEX "AutomationOutboxEvent_workspaceId_occurredAt_idx" ON "AutomationOutboxEvent"("workspaceId", "occurredAt");

ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationOutboxEvent" ADD CONSTRAINT "AutomationOutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationOutboxEvent" ADD CONSTRAINT "AutomationOutboxEvent_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
