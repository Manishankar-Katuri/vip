import { RecommendationDraftSchema } from "../schemas";
import type {
  AnalyticsSignal,
  ExplanationPayload,
  RecommendationDraft,
  RecommendationScore,
  RecommendationType,
  WorkflowReadyAction,
} from "../types";
import { AiExplanationGenerator } from "../explanations";
import { RecommendationScorer } from "../scoring";

export interface PriorityCandidate {
  type: RecommendationType;
  signals: AnalyticsSignal[];
}

export interface RecommendationCandidate extends PriorityCandidate {
  workspaceId: string;
  title: string;
  actions: WorkflowReadyAction[];
  idempotencyKey: string;
}

export interface PrioritizedRecommendation {
  type: RecommendationType;
  score: RecommendationScore;
  explanation: ExplanationPayload;
}

export class RecommendationPriorityEngine {
  constructor(
    private readonly scorer = new RecommendationScorer(),
    private readonly explanations = new AiExplanationGenerator()
  ) {}

  build(candidate: RecommendationCandidate): RecommendationDraft {
    const score = this.scorer.scoreSignals(candidate.signals);
    return RecommendationDraftSchema.parse({
      ...candidate,
      score,
      explanation: this.explanations.generate({ type: candidate.type, signals: candidate.signals, score }),
    }) as RecommendationDraft;
  }

  prioritize(candidates: PriorityCandidate[]): PrioritizedRecommendation[] {
    return candidates
      .map((candidate) => {
        const score = this.scorer.scoreSignals(candidate.signals);
        return {
          type: candidate.type,
          score,
          explanation: this.explanations.generate({ ...candidate, score }),
        };
      })
      .sort((left, right) => right.score.total - left.score.total);
  }
}
