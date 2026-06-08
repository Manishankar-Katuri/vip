import prisma from "@vip/database";

import { RuleBasedStrategyProvider } from "./rule-based-provider";
import { resolveSocialWorkspace } from "../workspace";
import {
  StrategyContext,
  StrategyProvider,
  StrategyRecommendation,
} from "./types";

export interface GenerateStrategyOptions extends StrategyContext {
  persist?: boolean;
  provider?: StrategyProvider;
}

export async function generateSocialStrategyRecommendations(
  options: GenerateStrategyOptions
): Promise<StrategyRecommendation[]> {
  await resolveSocialWorkspace(options.workspaceId);
  const provider = options.provider ?? new RuleBasedStrategyProvider();
  const recommendations = await provider.generateRecommendations(options);

  if (options.persist ?? true) {
    await persistRecommendations(options.workspaceId, recommendations);
  }

  return recommendations;
}

async function persistRecommendations(
  workspaceId: string,
  recommendations: StrategyRecommendation[]
) {
  for (const recommendation of recommendations) {
    await prisma.aIRecommendation.create({
      data: {
        workspaceId,
        type: recommendation.type,
        title: recommendation.title,
        summary: recommendation.summary,
        rationale: recommendation.rationale,
        priority: recommendation.priority,
        confidence: recommendation.confidence,
        score: recommendation.score,
        payload: toJson(recommendation.payload),
      },
    });
  }
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}
