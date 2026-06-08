import { prisma } from "@vip/database";

import { PrismaAutomationRepository, type AutomationPrismaClient } from "../repositories";

export function createPostgresAutomationRepository(
  database: AutomationPrismaClient = prisma as unknown as AutomationPrismaClient
) {
  return new PrismaAutomationRepository(database);
}
