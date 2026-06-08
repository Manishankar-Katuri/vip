import type { AutomationDeadLetterJob, AutomationQueueJob, AutomationRetryJob } from "../dto";

export interface AutomationQueueOptions {
  operationKey: string;
  delayMs?: number;
  attempts?: number;
  backoffMs?: number;
}

export interface AutomationQueue {
  enqueue(job: AutomationQueueJob, options: AutomationQueueOptions): Promise<string>;
  schedule(job: AutomationQueueJob | AutomationRetryJob, runAt: Date, options: AutomationQueueOptions): Promise<string>;
  deadLetter(job: AutomationDeadLetterJob): Promise<void>;
}

export interface AutomationQueueConsumer {
  handle(job: AutomationQueueJob | AutomationRetryJob): Promise<void>;
}

export interface AutomationWorkflowExecutor {
  execute(executionId: string, workspaceId: string): Promise<Record<string, unknown>>;
  rollBack?(executionId: string, workspaceId: string, reason: string): Promise<void>;
}

export interface AutomationBackoffPolicy {
  delayMs(attempt: number, baseDelayMs: number): number;
}

export class ExponentialAutomationBackoffPolicy implements AutomationBackoffPolicy {
  delayMs(attempt: number, baseDelayMs: number) {
    return baseDelayMs * 2 ** Math.max(0, attempt - 1);
  }
}
