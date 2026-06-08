import { z } from "zod";

const workspaceId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const dateTime = z.iso.datetime();
const listValue = z.preprocess(
  (value) => typeof value === "string" ? value.split(",").filter(Boolean) : value,
  z.array(z.string().trim().min(1)).optional()
);

export const PersistedRecommendationStatusSchema = z.enum([
  "GENERATED",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "IMPLEMENTED",
  "EXPIRED",
]);
export const RecommendationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "EXECUTED", "ARCHIVED"]);
export const RecommendationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RecommendationSortFieldSchema = z.enum(["score", "confidence", "generatedAt", "updatedAt", "priority"]);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const recommendationFilterFields = {
  workspaceId,
  statuses: listValue.pipe(z.array(RecommendationStatusSchema).optional()),
  priorities: listValue.pipe(z.array(RecommendationPrioritySchema).optional()),
  types: listValue,
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  maxConfidence: z.coerce.number().min(0).max(1).optional(),
  from: dateTime.optional(),
  to: dateTime.optional(),
};

function validRange<TSchema extends z.ZodType<{ minConfidence?: number; maxConfidence?: number; from?: string; to?: string }>>(schema: TSchema) {
  return schema.refine((value) => value.minConfidence === undefined || value.maxConfidence === undefined || value.minConfidence <= value.maxConfidence, {
    message: "minConfidence must not exceed maxConfidence.",
  })
  .refine((value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to), {
    message: "from must be before to.",
  });
}

export const RecommendationFilterSchema = validRange(z.object(recommendationFilterFields).strict());

export const RecommendationQuerySchema = validRange(z.object({
  ...recommendationFilterFields,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: RecommendationSortFieldSchema.default("score"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
}).strict());

export const SummaryQuerySchema = validRange(z.object({
  ...recommendationFilterFields,
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict());

export const SupportingMetricDtoSchema = z.object({
  metric: z.string().min(1),
  direction: z.string().min(1),
  currentValue: z.number().finite(),
  previousValue: z.number().finite(),
  changePercent: z.number().finite(),
}).strict();

export const ExplanationDtoSchema = z.object({
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
  supportingMetrics: z.array(SupportingMetricDtoSchema),
  expectedImpact: z.string().min(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reasoning: z.string().min(1),
}).strict();

export const RecommendationDtoSchema = z.object({
  id: z.string().min(1),
  workspaceId,
  type: z.string().min(1),
  category: z.string().nullable(),
  title: z.string().min(1),
  summary: z.string().min(1),
  rationale: z.string().min(1),
  status: RecommendationStatusSchema,
  sourceStatus: PersistedRecommendationStatusSchema,
  priority: RecommendationPrioritySchema,
  score: z.number().finite(),
  confidence: z.number().min(0).max(1),
  automationReady: z.boolean(),
  expectedImpact: z.string().nullable(),
  explanation: ExplanationDtoSchema,
  generatedAt: dateTime,
  updatedAt: dateTime,
}).strict();

export const PaginationDtoSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).strict();

export const RecommendationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(RecommendationDtoSchema),
  pagination: PaginationDtoSchema,
}).strict();

export const InsightsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: z.string(),
    counts: z.object({
      total: z.number().int().nonnegative(),
      byStatus: z.record(z.string(), z.number().int().nonnegative()),
      byPriority: z.record(z.string(), z.number().int().nonnegative()),
    }).strict(),
    riskSummary: z.object({
      highRiskCount: z.number().int().nonnegative(),
      criticalCount: z.number().int().nonnegative(),
      decliningEngagementCount: z.number().int().nonnegative(),
    }).strict(),
    engagementOpportunities: z.array(RecommendationDtoSchema),
  }).strict(),
}).strict();

export const ExplanationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    recommendationId: z.string().min(1),
    type: z.string().min(1),
    title: z.string().min(1),
    explanation: ExplanationDtoSchema,
  }).strict()),
}).strict();

export const OpportunitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    highestValue: z.array(RecommendationDtoSchema),
    growthOpportunities: z.array(RecommendationDtoSchema),
    criticalRecoveryActions: z.array(RecommendationDtoSchema),
    automationReady: z.array(RecommendationDtoSchema),
  }).strict(),
}).strict();

export type RecommendationQuery = z.infer<typeof RecommendationQuerySchema>;
export type SummaryQuery = z.infer<typeof SummaryQuerySchema>;
export type RecommendationFilter = z.infer<typeof RecommendationFilterSchema>;
export type RecommendationDto = z.infer<typeof RecommendationDtoSchema>;
export type ExplanationDto = z.infer<typeof ExplanationDtoSchema>;
