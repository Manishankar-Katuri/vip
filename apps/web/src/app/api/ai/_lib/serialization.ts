import {
  ExplanationDtoSchema,
  RecommendationDtoSchema,
  SupportingMetricDtoSchema,
  type ExplanationDto,
  type RecommendationDto,
} from "./contracts";
import type { RecommendationRecord } from "./ports";

export function serializeRecommendation(record: RecommendationRecord): RecommendationDto {
  const confidence = normalizedConfidence(record.confidence);
  const explanation = serializeExplanation(record, confidence);
  return RecommendationDtoSchema.parse({
    id: record.id,
    workspaceId: record.workspaceId,
    type: record.type,
    category: record.category,
    title: record.title,
    summary: record.summary,
    rationale: record.rationale,
    status: canonicalStatus(record.status),
    sourceStatus: record.status,
    priority: priorityName(record.priority),
    score: record.score,
    confidence,
    automationReady: hasWorkflowAction(record.actions),
    expectedImpact: record.expectedOutcome,
    explanation,
    generatedAt: record.generatedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export function serializeExplanation(record: RecommendationRecord, confidence = normalizedConfidence(record.confidence)): ExplanationDto {
  const source = objectValue(record.explanation);
  const metrics = metricsFrom(source.supportingMetrics ?? record.evidence);
  const riskLevel = source.riskLevel === "LOW" || source.riskLevel === "MEDIUM" || source.riskLevel === "HIGH"
    ? source.riskLevel
    : riskFor(record.priority, confidence);
  return ExplanationDtoSchema.parse({
    reason: stringValue(source.reason) ?? record.rationale,
    confidence: numberValue(source.confidence) ?? confidence,
    supportingMetrics: metrics,
    expectedImpact: stringValue(source.expectedImpact) ?? record.expectedOutcome ?? "Impact estimate unavailable",
    riskLevel,
    reasoning: stringValue(source.explanation) ?? stringValue(source.reasoningSummary) ?? record.rationale,
  });
}

function metricsFrom(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = SupportingMetricDtoSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

function normalizedConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hasWorkflowAction(actions: unknown) {
  if (!Array.isArray(actions) || actions.length === 0) return false;
  return actions.every((action) => typeof action === "string" || Boolean(objectValue(action).processor));
}

function priorityName(value: number) {
  return ({ 1: "CRITICAL", 2: "HIGH", 3: "MEDIUM", 4: "LOW" }[value] ?? "LOW") as RecommendationDto["priority"];
}

function canonicalStatus(value: string) {
  return {
    GENERATED: "PENDING",
    VIEWED: "PENDING",
    ACCEPTED: "APPROVED",
    REJECTED: "REJECTED",
    IMPLEMENTED: "EXECUTED",
    EXPIRED: "ARCHIVED",
  }[value] ?? "PENDING";
}

function riskFor(priority: number, confidence: number) {
  if (priority === 1 || confidence < 0.7) return "HIGH";
  if (priority === 2 || confidence < 0.85) return "MEDIUM";
  return "LOW";
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 1 ? value : undefined;
}
