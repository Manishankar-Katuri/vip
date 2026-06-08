import prisma from "@vip/database";

import { ActionOrchestrator } from "../orchestration";
import { PrismaActionRepository, type ActionPrismaClient } from "../persistence";
import { BullMqActionQueue, type BullMqQueueOptions } from "../queue";

export function createPostgresActionEngine(
  queueOptions: BullMqQueueOptions,
  database: ActionPrismaClient = prisma as unknown as ActionPrismaClient
) {
  const repository = new PrismaActionRepository(database);
  const queue = new BullMqActionQueue(queueOptions);
  return { repository, queue, orchestrator: new ActionOrchestrator(repository, queue) };
}
