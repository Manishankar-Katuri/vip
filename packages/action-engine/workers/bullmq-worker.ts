import { Worker, type ConnectionOptions } from "bullmq";

import type { ActionJob } from "../types";
import { ActionWorkerProcessor } from "./action-worker-processor";

export function createBullMqActionWorker(
  processor: ActionWorkerProcessor,
  connection: ConnectionOptions,
  queueName = "vip-actions"
) {
  return new Worker<ActionJob>(
    queueName,
    async (job) => processor.process(job.data, String(job.id)),
    { connection, concurrency: 10 }
  );
}
