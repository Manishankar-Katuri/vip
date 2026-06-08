import { WorkflowMappingSchema } from "../schemas";
import type { WorkflowMapping } from "../types";
import type { Recommendation, RecommendationType, WorkflowReadyAction } from "@vip/recommendation-engine";

export class WorkflowTriggerMapper {
  private readonly mappings: Map<RecommendationType, WorkflowMapping>;

  constructor(mappings: WorkflowMapping[] = DEFAULT_WORKFLOW_MAPPINGS) {
    this.mappings = new Map(
      mappings.map((mapping) => {
        const valid = WorkflowMappingSchema.parse(mapping) as WorkflowMapping;
        return [valid.recommendationType, valid];
      })
    );
  }

  map(recommendation: Recommendation, executionKey: string): WorkflowReadyAction & { workflowType: string } {
    const mapping = this.mappings.get(recommendation.type);
    if (!mapping) throw new Error(`No workflow mapping is configured for ${recommendation.type}.`);
    return this.mapUsing(mapping, recommendation, executionKey);
  }

  mapUsing(
    mapping: WorkflowMapping,
    recommendation: Recommendation,
    executionKey: string
  ): WorkflowReadyAction & { workflowType: string } {
    const valid = WorkflowMappingSchema.parse(mapping) as WorkflowMapping;
    if (valid.recommendationType !== recommendation.type) {
      throw new Error(`Workflow mapping ${valid.id} cannot execute ${recommendation.type}.`);
    }
    return {
      ...valid.action,
      workflowType: valid.workflowType,
      idempotencyKey: `${executionKey}:workflow`,
      input: {
        ...valid.action.input,
        recommendationId: recommendation.id,
        recommendationType: recommendation.type,
      },
    };
  }
}

export const DEFAULT_WORKFLOW_MAPPINGS: WorkflowMapping[] = [
  mapping("CONTENT_STRATEGY", "content-strategy-workflow", "content-strategy"),
  mapping("HASHTAG_OPTIMIZATION", "content-optimization-workflow", "hashtag-optimization"),
  mapping("BEST_POSTING_TIME", "scheduling-workflow", "best-posting-time"),
  mapping("ENGAGEMENT_RECOVERY", "engagement-recovery-workflow", "engagement-recovery"),
  mapping("GROWTH_ACCELERATION", "growth-acceleration-workflow", "growth-acceleration"),
  mapping("CAMPAIGN_OPTIMIZATION", "campaign-optimization-workflow", "campaign-optimization"),
  mapping("COMPETITOR_RESPONSE", "competitor-response-workflow", "competitor-response"),
];

function mapping(type: RecommendationType, workflowType: string, processor: string): WorkflowMapping {
  return {
    id: `mapping:${type}`,
    recommendationType: type,
    workflowType,
    action: {
      name: workflowType,
      processor,
      requiresApproval: true,
      input: {},
    },
  };
}
