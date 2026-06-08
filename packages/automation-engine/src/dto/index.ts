import { z } from "zod";

import { AutomationExecutionSchema } from "../schemas";

const id = z.string().trim().min(1).max(256);
const dateTime = z.string().datetime({ offset: true });

export const AutomationQueueJobSchema = z.object({
  jobType: z.literal("AUTOMATION_EXECUTION"),
  workspaceId: id,
  executionId: id,
  operationKey: id,
  enqueuedAt: dateTime,
  runAt: dateTime.optional(),
}).strict();

export const AutomationRetryJobSchema = AutomationQueueJobSchema.extend({
  jobType: z.literal("AUTOMATION_RETRY"),
  attempt: z.number().int().positive(),
  failureReason: id,
  retryWindowEndsAt: dateTime,
}).strict();

export const AutomationDeadLetterJobSchema = z.object({
  jobType: z.literal("AUTOMATION_DEAD_LETTER"),
  workspaceId: id,
  executionId: id,
  operationKey: id,
  reason: id,
  deadLetteredAt: dateTime,
  snapshot: AutomationExecutionSchema,
}).strict();

export const AutomationExecutionSnapshotSchema = z.object({
  execution: AutomationExecutionSchema,
  capturedAt: dateTime,
  operationKey: id,
}).strict();

export type AutomationQueueJob = z.infer<typeof AutomationQueueJobSchema>;
export type AutomationRetryJob = z.infer<typeof AutomationRetryJobSchema>;
export type AutomationDeadLetterJob = z.infer<typeof AutomationDeadLetterJobSchema>;
export type AutomationExecutionSnapshot = z.infer<typeof AutomationExecutionSnapshotSchema>;
