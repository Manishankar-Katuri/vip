import prisma from "@vip/database";

import type { RecommendationFilter, RecommendationQuery } from "./contracts";
import {
  TransientAiRepositoryError,
  type AiRecommendationQueryRepository,
  type PagedRecords,
  type RecommendationRecord,
} from "./ports";

export class PrismaAiRecommendationQueryRepository implements AiRecommendationQueryRepository {
  async list(query: RecommendationQuery): Promise<PagedRecords> {
    try {
      const where = whereFor(query);
      const orderBy = { [query.sortBy]: query.sortDirection };
      const [rows, total] = await Promise.all([
        prisma.aIRecommendation.findMany({
          where,
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: selection,
        }),
        prisma.aIRecommendation.count({ where }),
      ]);
      return { rows: rows as RecommendationRecord[], total };
    } catch (error) {
      throw repositoryFailure(error);
    }
  }

  async summarize(filters: RecommendationFilter): Promise<RecommendationRecord[]> {
    try {
      return await prisma.aIRecommendation.findMany({
        where: whereFor(filters),
        orderBy: { score: "desc" },
        select: selection,
      }) as RecommendationRecord[];
    } catch (error) {
      throw repositoryFailure(error);
    }
  }
}

const selection = {
  id: true,
  workspaceId: true,
  type: true,
  category: true,
  title: true,
  summary: true,
  rationale: true,
  priority: true,
  confidence: true,
  score: true,
  actions: true,
  expectedOutcome: true,
  explanation: true,
  evidence: true,
  status: true,
  generatedAt: true,
  updatedAt: true,
};

function whereFor(filters: RecommendationFilter) {
  return {
    workspaceId: filters.workspaceId,
    ...(filters.statuses?.length ? { status: { in: Array.from(new Set(filters.statuses.flatMap(persistedStatuses))) } } : {}),
    ...(filters.types?.length ? { type: { in: filters.types } } : {}),
    ...(filters.priorities?.length ? { priority: { in: filters.priorities.map(priorityValue) } } : {}),
    ...(filters.minConfidence !== undefined || filters.maxConfidence !== undefined ? {
      confidence: {
        ...(filters.minConfidence !== undefined ? { gte: filters.minConfidence } : {}),
        ...(filters.maxConfidence !== undefined ? { lte: filters.maxConfidence } : {}),
      },
    } : {}),
    ...(filters.from || filters.to ? {
      generatedAt: {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      },
    } : {}),
  };
}

function priorityValue(priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
  return { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }[priority];
}

type PersistedStatus = "GENERATED" | "VIEWED" | "ACCEPTED" | "REJECTED" | "IMPLEMENTED" | "EXPIRED";

function persistedStatuses(status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "ARCHIVED"): PersistedStatus[] {
  return {
    PENDING: ["GENERATED", "VIEWED"] as PersistedStatus[],
    APPROVED: ["ACCEPTED"] as PersistedStatus[],
    REJECTED: ["REJECTED"] as PersistedStatus[],
    EXECUTED: ["IMPLEMENTED"] as PersistedStatus[],
    ARCHIVED: ["EXPIRED"] as PersistedStatus[],
  }[status];
}

function repositoryFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Recommendation query failed.";
  return new TransientAiRepositoryError(message);
}
