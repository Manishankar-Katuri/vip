import prisma from "@vip/database";

import { DashboardProjectionService } from "../dashboard";
import { FeedbackLearningService } from "../feedback";
import { RecommendationLifecycleEngine } from "../lifecycle";
import {
  PrismaStrategyRepository,
  StrategyPersistenceService,
  type StrategyPrismaClient,
} from "../persistence";

export function createPostgresStrategyOperations(
  database: StrategyPrismaClient = prisma as unknown as StrategyPrismaClient
) {
  const repository = new PrismaStrategyRepository(database);

  return {
    repository,
    persistence: new StrategyPersistenceService(repository),
    lifecycle: new RecommendationLifecycleEngine(repository),
    feedback: new FeedbackLearningService(repository),
    dashboard: new DashboardProjectionService(repository),
  };
}
