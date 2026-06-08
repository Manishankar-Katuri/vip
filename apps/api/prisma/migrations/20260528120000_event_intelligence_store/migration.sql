CREATE TABLE "EventEnvelope" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "event" JSONB NOT NULL,
  "metadata" JSONB NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "sequence" SERIAL NOT NULL,
  "state" TEXT NOT NULL,

  CONSTRAINT "EventEnvelope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventDelivery" (
  "id" TEXT NOT NULL,
  "envelopeId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "deliveryKey" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "error" TEXT,

  CONSTRAINT "EventDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventDeadLetter" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "envelopeId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "failure" TEXT NOT NULL,
  "deadLetteredAt" TIMESTAMP(3) NOT NULL,
  "snapshot" JSONB NOT NULL,

  CONSTRAINT "EventDeadLetter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventEnvelope_eventId_key" ON "EventEnvelope"("eventId");
CREATE UNIQUE INDEX "EventEnvelope_sequence_key" ON "EventEnvelope"("sequence");
CREATE UNIQUE INDEX "EventEnvelope_workspaceId_idempotencyKey_key" ON "EventEnvelope"("workspaceId", "idempotencyKey");
CREATE INDEX "EventEnvelope_priority_state_publishedAt_idx" ON "EventEnvelope"("priority", "state", "publishedAt");
CREATE INDEX "EventEnvelope_workspaceId_aggregateId_sequence_idx" ON "EventEnvelope"("workspaceId", "aggregateId", "sequence");
CREATE INDEX "EventEnvelope_eventType_occurredAt_idx" ON "EventEnvelope"("eventType", "occurredAt");
CREATE INDEX "EventEnvelope_topic_state_publishedAt_idx" ON "EventEnvelope"("topic", "state", "publishedAt");

CREATE UNIQUE INDEX "EventDelivery_deliveryKey_key" ON "EventDelivery"("deliveryKey");
CREATE INDEX "EventDelivery_subscriberId_status_completedAt_idx" ON "EventDelivery"("subscriberId", "status", "completedAt");
CREATE INDEX "EventDelivery_envelopeId_subscriberId_idx" ON "EventDelivery"("envelopeId", "subscriberId");

CREATE INDEX "EventDeadLetter_workspaceId_deadLetteredAt_idx" ON "EventDeadLetter"("workspaceId", "deadLetteredAt");
CREATE INDEX "EventDeadLetter_subscriberId_deadLetteredAt_idx" ON "EventDeadLetter"("subscriberId", "deadLetteredAt");

ALTER TABLE "EventDelivery"
ADD CONSTRAINT "EventDelivery_envelopeId_fkey"
FOREIGN KEY ("envelopeId") REFERENCES "EventEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventDeadLetter"
ADD CONSTRAINT "EventDeadLetter_envelopeId_fkey"
FOREIGN KEY ("envelopeId") REFERENCES "EventEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
