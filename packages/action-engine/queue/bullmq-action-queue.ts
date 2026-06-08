import { Queue, type ConnectionOptions } from "bullmq";

import type { ActionQueue, QueueOptions } from "../interfaces";
import type { ActionJob } from "../types";

export interface BullMqQueueOptions {
  queueName?: string;
  connection: ConnectionOptions;
  deadLetterQueueName?: string;
}

export class BullMqActionQueue implements ActionQueue {
  private readonly queue: Queue<ActionJob>;
  private readonly deadLetters: Queue<ActionJob & { reason: string }>;

  constructor(options: BullMqQueueOptions) {
    this.queue = new Queue<ActionJob>(options.queueName ?? "vip-actions", {
      connection: options.connection,
    });
    this.deadLetters = new Queue<ActionJob & { reason: string }>(
      options.deadLetterQueueName ?? "vip-actions-dead-letter",
      { connection: options.connection }
    );
  }

  async enqueue(job: ActionJob, options: QueueOptions = {}) {
    const queued = await this.queue.add("execute-action-plan", job, bullOptions(options));
    return String(queued.id);
  }

  async schedule(job: ActionJob, runAt: Date, options: QueueOptions = {}) {
    const delay = Math.max(0, runAt.getTime() - Date.now());
    const queued = await this.queue.add("execute-scheduled-action-plan", job, {
      ...bullOptions(options),
      delay,
    });
    return String(queued.id);
  }

  async repeat(job: ActionJob, cronExpression: string, options: QueueOptions = {}) {
    const queued = await this.queue.add("execute-recurring-action-plan", job, {
      ...bullOptions(options),
      repeat: { pattern: cronExpression },
    });
    return String(queued.id);
  }

  async deadLetter(job: ActionJob, reason: string) {
    await this.deadLetters.add("dead-letter-action", { ...job, reason });
  }

  async close() {
    await Promise.all([this.queue.close(), this.deadLetters.close()]);
  }
}

function bullOptions(options: QueueOptions) {
  return {
    jobId: options.jobId,
    attempts: options.attempts ?? 3,
    backoff: { type: "exponential" as const, delay: options.backoffMs ?? 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  };
}
