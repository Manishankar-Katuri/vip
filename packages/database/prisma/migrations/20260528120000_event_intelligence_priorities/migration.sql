ALTER TABLE "EventEnvelope"
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL';

CREATE INDEX "EventEnvelope_priority_state_publishedAt_idx"
ON "EventEnvelope"("priority", "state", "publishedAt");
