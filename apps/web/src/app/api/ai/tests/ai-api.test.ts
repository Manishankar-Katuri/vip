import assert from "node:assert/strict";
import test from "node:test";

import {
  ExplanationsResponseSchema,
  InsightsResponseSchema,
  OpportunitiesResponseSchema,
  RecommendationsResponseSchema,
} from "../_lib/contracts";
import { createAiApiHandlers } from "../_lib/handlers";
import { parseRecommendationQuery } from "../_lib/query";
import type {
  AiRecommendationQueryRepository,
  PagedRecords,
  RecommendationRecord,
} from "../_lib/ports";
import { TransientAiRepositoryError } from "../_lib/ports";
import { serializeRecommendation } from "../_lib/serialization";
import { AiRecommendationReadService } from "../_lib/service";
import type { AiApiTelemetryEvent } from "../_lib/telemetry";

const records: RecommendationRecord[] = [
  recommendation({
    id: "recovery",
    type: "ENGAGEMENT_RECOVERY",
    priority: 1,
    score: 91,
    confidence: 0.94,
    status: "GENERATED",
    explanation: {
      reason: "Engagement declined sharply.",
      confidence: 0.94,
      supportingMetrics: [{
        metric: "ENGAGEMENT",
        direction: "DECREASED",
        currentValue: 3,
        previousValue: 8,
        changePercent: -62.5,
      }],
      expectedImpact: "+12% engagement",
      riskLevel: "HIGH",
      explanation: "Engagement recovery is urgent.",
    },
  }),
  recommendation({
    id: "growth",
    type: "GROWTH_ACCELERATION",
    priority: 2,
    score: 80,
    confidence: 0.88,
    status: "ACCEPTED",
    expectedOutcome: "+10% reach",
  }),
  recommendation({
    id: "timing",
    type: "BEST_POSTING_TIME",
    priority: 4,
    score: 22,
    confidence: 0.68,
    status: "GENERATED",
  }),
];

test("recommendations route validates, filters, sorts, paginates, and records telemetry", async () => {
  const telemetry: AiApiTelemetryEvent[] = [];
  const handlers = createAiApiHandlers(
    new AiRecommendationReadService(new FixtureRepository(records)),
    { record: (event) => telemetry.push(event) }
  );
  const response = await handlers.recommendations(new Request(
    "http://localhost/api/ai/recommendations?workspaceId=workspace_social&statuses=PENDING,APPROVED&priorities=CRITICAL,HIGH&minConfidence=0.8&page=1&pageSize=1&sortBy=score&sortDirection=desc",
    { headers: { "x-request-id": "request-1" } }
  ));
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const body = RecommendationsResponseSchema.parse(await response.json());

  assert.equal(body.data[0].id, "recovery");
  assert.equal(body.data[0].status, "PENDING");
  assert.equal(body.data[0].sourceStatus, "GENERATED");
  assert.deepEqual(body.pagination, { page: 1, pageSize: 1, total: 2, totalPages: 2 });
  assert.equal(telemetry[0].requestId, "request-1");
  assert.equal(telemetry[0].outcome, "success");
});

test("invalid query ranges return the centralized validation error response", async () => {
  const handlers = createAiApiHandlers(
    new AiRecommendationReadService(new FixtureRepository(records)),
    { record: () => undefined }
  );
  const response = await handlers.recommendations(new Request(
    "http://localhost/api/ai/recommendations?workspaceId=workspace_social&minConfidence=0.9&maxConfidence=0.2"
  ));
  const body = await response.json() as { error: { code: string } };

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_QUERY");
  assert.throws(
    () => parseRecommendationQuery("http://localhost/api/ai/recommendations?workspaceId=../bad"),
    /Invalid/
  );
});

test("insights, explanations, and opportunities serialize persisted recommendation evidence", async () => {
  const handlers = createAiApiHandlers(
    new AiRecommendationReadService(new FixtureRepository(records)),
    { record: () => undefined }
  );
  const base = "http://localhost/api/ai";
  const query = "?workspaceId=workspace_social&limit=2";
  const insightsResponse = await handlers.insights(new Request(`${base}/insights${query}`));
  assert.equal(insightsResponse.status, 200, JSON.stringify(await insightsResponse.clone().json()));
  const insights = InsightsResponseSchema.parse(await insightsResponse.json());
  const explanations = ExplanationsResponseSchema.parse(await (await handlers.explanations(new Request(`${base}/explanations${query}`))).json());
  const opportunities = OpportunitiesResponseSchema.parse(await (await handlers.opportunities(new Request(`${base}/opportunities${query}`))).json());

  assert.equal(insights.data.counts.total, 3);
  assert.equal(insights.data.riskSummary.decliningEngagementCount, 1);
  assert.equal(explanations.data[0].explanation.expectedImpact, "+12% engagement");
  assert.equal(explanations.data[0].explanation.supportingMetrics[0].metric, "ENGAGEMENT");
  assert.equal(opportunities.data.growthOpportunities[0].id, "growth");
  assert.equal(opportunities.data.criticalRecoveryActions[0].id, "recovery");
  assert.equal(opportunities.data.automationReady.length, 2);
});

test("serialization provides safe legacy explanation fallbacks without inventing metrics", () => {
  const serialized = serializeRecommendation(records[1]);
  assert.equal(serialized.explanation.reason, records[1].rationale);
  assert.equal(serialized.explanation.expectedImpact, "+10% reach");
  assert.deepEqual(serialized.explanation.supportingMetrics, []);
  assert.equal(serialized.automationReady, true);
});

test("retries transient read failures without duplicating write-side effects", async () => {
  let attempts = 0;
  const repository: AiRecommendationQueryRepository = {
    list: async () => {
      attempts += 1;
      if (attempts === 1) throw new TransientAiRepositoryError("Temporary read failure.");
      return { rows: [records[0]], total: 1 };
    },
    summarize: async () => records,
  };
  const response = await new AiRecommendationReadService(repository).recommendations(
    parseRecommendationQuery("http://localhost/api/ai/recommendations?workspaceId=workspace_social")
  );

  assert.equal(attempts, 2);
  assert.equal(response.data[0].id, "recovery");
});

class FixtureRepository implements AiRecommendationQueryRepository {
  constructor(private readonly values: RecommendationRecord[]) {}

  async list(query: ReturnType<typeof parseRecommendationQuery>): Promise<PagedRecords> {
    const filtered = filterValues(this.values, query).sort((left, right) =>
      query.sortDirection === "desc"
        ? numericValue(right, query.sortBy) - numericValue(left, query.sortBy)
        : numericValue(left, query.sortBy) - numericValue(right, query.sortBy)
    );
    return {
      rows: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
      total: filtered.length,
    };
  }

  async summarize(filters: Parameters<AiRecommendationQueryRepository["summarize"]>[0]) {
    return filterValues(this.values, filters).sort((left, right) => right.score - left.score);
  }
}

function filterValues(values: RecommendationRecord[], filters: Parameters<AiRecommendationQueryRepository["summarize"]>[0]) {
  return values.filter((record) =>
    record.workspaceId === filters.workspaceId &&
    (!filters.statuses || filters.statuses.some((status) => status === canonicalStatus(record.status))) &&
    (!filters.types || filters.types.includes(record.type)) &&
    (!filters.priorities || filters.priorities.some((priority) => priority === priorityFor(record.priority))) &&
    (filters.minConfidence === undefined || record.confidence >= filters.minConfidence) &&
    (filters.maxConfidence === undefined || record.confidence <= filters.maxConfidence) &&
    (!filters.from || record.generatedAt >= new Date(filters.from)) &&
    (!filters.to || record.generatedAt <= new Date(filters.to))
  );
}

function numericValue(record: RecommendationRecord, field: string) {
  if (field === "generatedAt" || field === "updatedAt") return record[field].getTime();
  return Number(record[field as "score" | "confidence" | "priority"]);
}

function priorityFor(priority: number) {
  return ({ 1: "CRITICAL", 2: "HIGH", 3: "MEDIUM", 4: "LOW" }[priority] ?? "LOW");
}

function canonicalStatus(value: string) {
  return ({ GENERATED: "PENDING", VIEWED: "PENDING", ACCEPTED: "APPROVED", REJECTED: "REJECTED", IMPLEMENTED: "EXECUTED", EXPIRED: "ARCHIVED" }[value] ?? "PENDING");
}

function recommendation(overrides: Partial<RecommendationRecord>): RecommendationRecord {
  return {
    id: "base",
    workspaceId: "workspace_social",
    type: "CONTENT_STRATEGY",
    category: null,
    title: "Recommendation title",
    summary: "Recommendation summary",
    rationale: "Recommendation rationale",
    priority: 3,
    confidence: 0.8,
    score: 50,
    actions: [{ processor: "workflow" }],
    expectedOutcome: null,
    explanation: null,
    evidence: null,
    status: "GENERATED",
    generatedAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}
