import type { ExplanationBuilder, RuleExecutionContext } from "../interfaces";
import type { ExplanationMetadata, RecommendationCandidate } from "../types";

export class DefaultExplanationBuilder implements ExplanationBuilder {
  build(candidate: RecommendationCandidate, context: RuleExecutionContext): ExplanationMetadata {
    const signals = candidate.signals;
    const facts = signals.slice(0, 3).map(
      (signal) =>
        `${signal.title}: ${signal.direction.toLowerCase()} direction, ${Math.round(
          signal.confidence * 100
        )}% confidence, impact ${signal.impact}/100.`
    );

    return {
      generatedBy: "RULE_ENGINE",
      version: "1.0",
      matchedRuleIds: [candidate.ruleId],
      evidenceSignalIds: signals.map((signal) => signal.id),
      evidenceTypes: Array.from(new Set(signals.map((signal) => signal.type))),
      reasoningSummary: `${candidate.title} was selected by ${candidate.ruleId} using ${signals.length} eligible signal(s).`,
      supportingFacts: facts,
      assumptions: [
        "Source confidence is supplied by the signal provider and has not been independently verified.",
        "Recommendations require workspace approval before execution.",
      ],
      llmContext: {
        eligible: true,
        promptVariables: {
          workspaceId: context.workspace.workspaceId,
          objectives: context.workspace.objectives ?? [],
          recommendationCategory: candidate.category,
          evidenceSignalIds: signals.map((signal) => signal.id),
        },
      },
    };
  }
}
