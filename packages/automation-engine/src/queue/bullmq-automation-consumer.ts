import { Worker, type ConnectionOptions, type Job } from "bullmq";

import { AutomationQueueJobSchema, AutomationRetryJobSchema, type AutomationQueueJob, type AutomationRetryJob } from "../dto";
import type { AutomationQueueConsumer } from "./index";

export class BullMqAutomationConsumer {
  private readonly worker: Worker<AutomationQueueJob | AutomationRetryJob>;

  constructor(
    consumer: AutomationQueueConsumer,
    connection: ConnectionOptions,
    queueName = "vip-automations"
  ) {
    this.worker = new Worker(queueName, async (job: Job<AutomationQueueJob | AutomationRetryJob>) => {
      const payload = job.data.jobType === "AUTOMATION_RETRY"
        ? AutomationRetryJobSchema.parse(job.data)
        : AutomationQueueJobSchema.parse(job.data);
      await consumer.handle(payload);
    }, { connection });
  }

  async close() {
    await this.worker.close();
  }
}
