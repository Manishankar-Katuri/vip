import type { ActionQueue, QueueOptions } from "../interfaces";
import type { ActionJob } from "../types";

export class InMemoryActionQueue implements ActionQueue {
  readonly jobs: Array<{ job: ActionJob; runAt?: Date; cron?: string; options?: QueueOptions }> = [];
  readonly deadLetters: Array<{ job: ActionJob; reason: string }> = [];

  async enqueue(job: ActionJob, options?: QueueOptions) {
    this.jobs.push({ job, options });
    return options?.jobId ?? `job-${this.jobs.length}`;
  }

  async schedule(job: ActionJob, runAt: Date, options?: QueueOptions) {
    this.jobs.push({ job, runAt, options });
    return options?.jobId ?? `job-${this.jobs.length}`;
  }

  async repeat(job: ActionJob, cron: string, options?: QueueOptions) {
    this.jobs.push({ job, cron, options });
    return options?.jobId ?? `job-${this.jobs.length}`;
  }

  async deadLetter(job: ActionJob, reason: string) {
    this.deadLetters.push({ job, reason });
  }
}
