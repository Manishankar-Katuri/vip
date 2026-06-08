import type {
  ExplanationBuilder,
  RecommendationGenerator,
  RuleExecutionContext,
  RuleExecutor,
} from "../interfaces";
import type { RecommendationCandidate, StrategicRecommendation } from "../types";
import { DefaultExplanationBuilder } from "../explanations";
import { createDefaultRuleExecutors } from "../rules";
import { RecommendationScorer } from "../scoring";
import { slug } from "../utils/numbers";

export interface RuleBasedRecommendationGeneratorOptions {
  rules?: RuleExecutor[];
  scorer?: RecommendationScorer;
  explanationBuilder?: ExplanationBuilder;
}

export class RuleBasedRecommendationGenerator implements RecommendationGenerator {
  private readonly rules: RuleExecutor[];
  private readonly scorer: RecommendationScorer;
  private readonly explanationBuilder: ExplanationBuilder;

  constructor(options: RuleBasedRecommendationGeneratorOptions = {}) {
    this.rules = options.rules ?? createDefaultRuleExecutors();
    this.scorer = options.scorer ?? new RecommendationScorer();
    this.explanationBuilder = options.explanationBuilder ?? new DefaultExplanationBuilder();
  }

  generate(context: RuleExecutionContext): StrategicRecommendation[] {
    return this.rules
      .flatMap((rule) => rule.execute(context))
      .map((candidate) => this.toRecommendation(candidate, context))
      .sort((left, right) => right.score.total - left.score.total);
  }

  private toRecommendation(
    candidate: RecommendationCandidate,
    context: RuleExecutionContext
  ): StrategicRecommendation {
    const generatedAt = context.asOf.toISOString();
    return {
      id: `${context.workspace.workspaceId}:${slug(candidate.ruleId)}:${generatedAt.slice(0, 10)}`,
      workspaceId: context.workspace.workspaceId,
      category: candidate.category,
      title: candidate.title,
      summary: candidate.summary,
      rationale: candidate.rationale,
      actions: candidate.actions,
      expectedOutcome: candidate.expectedOutcome,
      score: this.scorer.score(candidate.factors),
      explanation: this.explanationBuilder.build(candidate, context),
      evidence: candidate.signals,
      dashboardData: candidate.dashboardData ?? {},
      generatedAt,
    };
  }
}
