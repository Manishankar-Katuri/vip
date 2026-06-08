import { Queue, type ConnectionOptions } from "bullmq";

import {
  AutomationDeadLetterJobSchema, AutomationQueueJobSchema, AutomationRetryJobSchema,
  type AutomationDeadLetterJob, type AutomationQueueJob, type AutomationRetryJob,
} from "../dto";
import type { AutomationQueue, AutomationQueueOptions } from "./index";

export interface BullMqAutomationQueueOptions {
  connection: ConnectionOptions;
  queueName?: string;
  deadLetterQueueName?: string;
}

export class BullMqAutomationQueue implements AutomationQueue {
  private readonly queue: Queue<AutomationQueueJob | AutomationRetryJob>;
  private readonly deadLetters: Queue<AutomationDeadLetterJob>;

  constructor(options: BullMqAutomationQueueOptions) {
    this.queue = new Queue(options.queueName ?? "vip-automations", { connection: options.connection });
    this.deadLetters = new Queue(options.deadLetterQueueName ?? "vip-automations-dead-letter", { connection: options.connection });
  }

  async enqueue(job: AutomationQueueJob, options: AutomationQueueOptions) {
    const queued = await this.queue.add("execute-automation", AutomationQueueJobSchema.parse(job), queueOptions(options));
    return String(queued.id);
  }

  async schedule(job: AutomationQueueJob | AutomationRetryJob, runAt: Date, options: AutomationQueueOptions) {
    const payload = job.jobType === "AUTOMATION_RETRY"
      ? AutomationRetryJobSchema.parse(job)
      : AutomationQueueJobSchema.parse(job);
    const queued = await this.queue.add("schedule-automation", payload, {
      ...queueOptions(options),
      delay: Math.max(0, runAt.getTime() - Date.now()),
    });
    return String(queued.id);
  }

  async deadLetter(job: AutomationDeadLetterJob) {
    await this.deadLetters.add("dead-letter-automation", AutomationDeadLetterJobSchema.parse(job), {
      jobId: job.operationKey,
      removeOnComplete: 1000,
    });
  }

  async close() {
    await Promise.all([this.queue.close(), this.deadLetters.close()]);
  }
}

function queueOptions(options: AutomationQueueOptions) {
  return {
    jobId: options.operationKey,
    attempts: options.attempts ?? 1,
    backoff: { type: "exponential" as const, delay: options.backoffMs ?? 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  };
}
