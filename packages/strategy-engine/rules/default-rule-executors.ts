import type { RuleExecutionContext, RuleExecutor } from "../interfaces";
import type { NormalizedSignal, RecommendationCandidate, SignalType } from "../types";
import { average, clamp, round } from "../utils/numbers";

abstract class SignalRule implements RuleExecutor {
  abstract readonly id: string;
  abstract readonly description: string;
  abstract execute(context: RuleExecutionContext): RecommendationCandidate[];

  protected matching(
    context: RuleExecutionContext,
    types: SignalType[],
    predicate: (signal: NormalizedSignal) => boolean
  ) {
    return context.signalSet.signals.filter(
      (signal) => types.includes(signal.type) && predicate(signal)
    );
  }

  protected factors(signals: NormalizedSignal[], alignmentBoost = 0) {
    return {
      impact: round(average(signals.map((signal) => signal.impact))),
      urgency: round(average(signals.map((signal) => signal.urgency ?? signal.relevanceScore))),
      confidence: round(average(signals.map((signal) => signal.confidence * 100))),
      strategicAlignment: round(
        clamp(average(signals.map((signal) => signal.strategicAlignment ?? 60)) + alignmentBoost)
      ),
      evidenceStrength: round(clamp(50 + signals.length * 12)),
    };
  }
}

export class OpportunityRuleExecutor extends SignalRule {
  readonly id = "opportunity-emerging-demand";
  readonly description = "Identifies relevant positive demand or market opportunities.";

  execute(context: RuleExecutionContext): RecommendationCandidate[] {
    const signals = this.matching(
      context,
      ["MARKET_TREND", "BUSINESS_OPPORTUNITY"],
      (signal) =>
        signal.relevanceScore >= 55 &&
        ["EMERGING", "RISING"].includes(signal.direction) &&
        signal.sentiment !== "NEGATIVE"
    ).slice(0, 3);

    if (signals.length === 0) return [];

    return [{
      ruleId: this.id,
      category: "GROWTH_OPPORTUNITY",
      title: `Activate demand around ${signals[0].title}`,
      summary: "Convert emerging audience or market interest into a time-boxed growth initiative.",
      rationale: "Fresh, positively directed signals with meaningful impact indicate an opportunity worth testing this week.",
      actions: [
        `Launch one targeted initiative aligned to "${signals[0].title}".`,
        "Define conversion and engagement measures before publishing.",
        "Review performance after seven days and promote successful variants.",
      ],
      expectedOutcome: "Increased qualified engagement and measurable demand capture.",
      signals,
      factors: this.factors(signals, 8),
      dashboardData: { experimentRecommended: true, signalTheme: signals[0].title },
    }];
  }
}

export class RiskMitigationRuleExecutor extends SignalRule {
  readonly id = "risk-negative-pressure";
  readonly description = "Escalates operational or customer sentiment risks.";

  execute(context: RuleExecutionContext): RecommendationCandidate[] {
    const signals = this.matching(
      context,
      ["OPERATIONAL_RISK", "CUSTOMER_FEEDBACK"],
      (signal) =>
        signal.relevanceScore >= 50 &&
        (signal.sentiment === "NEGATIVE" || ["EMERGING", "RISING"].includes(signal.direction))
    ).slice(0, 3);

    if (signals.length === 0) return [];

    return [{
      ruleId: this.id,
      category: "RISK_MITIGATION",
      title: `Contain risk: ${signals[0].title}`,
      summary: "Address elevated risk evidence before it affects trust, delivery, or retention.",
      rationale: "Negative or growing operational evidence should trigger an owned mitigation plan and follow-up measurement.",
      actions: [
        "Assign an accountable owner and validate the root cause within 48 hours.",
        "Publish or communicate a remediation response where customer impact is visible.",
        "Monitor the related signal weekly until relevance drops below threshold.",
      ],
      expectedOutcome: "Reduced customer impact and earlier visibility into unresolved risk.",
      signals,
      factors: this.factors(signals, 12),
      dashboardData: { requiresOwner: true, escalation: "weekly-review" },
    }];
  }
}

export class PerformanceOptimizationRuleExecutor extends SignalRule {
  readonly id = "performance-declining-metric";
  readonly description = "Responds to declining internal business performance.";

  execute(context: RuleExecutionContext): RecommendationCandidate[] {
    const signals = this.matching(
      context,
      ["PERFORMANCE_METRIC"],
      (signal) => signal.direction === "DECLINING" && signal.relevanceScore >= 45
    ).slice(0, 2);

    if (signals.length === 0) return [];

    return [{
      ruleId: this.id,
      category: "PERFORMANCE_OPTIMIZATION",
      title: `Recover declining performance in ${signals[0].title}`,
      summary: "Use a short optimization cycle to diagnose and reverse deteriorating workspace metrics.",
      rationale: "Internal performance decline provides actionable evidence for prioritizing operational experiments.",
      actions: [
        "Compare the last four weeks against the prior baseline and isolate the largest driver.",
        "Run one corrective experiment with a defined success threshold.",
        "Feed measured outcome back into future recommendation scoring.",
      ],
      expectedOutcome: "Clear diagnosis and an evidence-backed performance recovery action.",
      signals,
      factors: this.factors(signals, 5),
      dashboardData: { feedbackLearningCandidate: true },
    }];
  }
}

export class CompetitorResponseRuleExecutor extends SignalRule {
  readonly id = "competitor-activity-shift";
  readonly description = "Identifies external competitor movements requiring a differentiated response.";

  execute(context: RuleExecutionContext): RecommendationCandidate[] {
    const signals = this.matching(
      context,
      ["COMPETITOR_ACTIVITY"],
      (signal) => ["EMERGING", "RISING"].includes(signal.direction) && signal.relevanceScore >= 52
    ).slice(0, 2);

    if (signals.length === 0) return [];

    return [{
      ruleId: this.id,
      category: "COMPETITIVE_RESPONSE",
      title: `Differentiate against ${signals[0].title}`,
      summary: "Respond to competitor momentum with a distinct value proposition, not replication.",
      rationale: "Material competitor activity can reveal an underserved position or messaging gap.",
      actions: [
        "Map the observed competitor move to the workspace's strongest differentiator.",
        "Test one differentiated message or offering with the target segment.",
        "Compare response signals without copying competitor creative or claims.",
      ],
      signals,
      factors: this.factors(signals),
      dashboardData: { competitorMonitoring: true },
    }];
  }
}

export function createDefaultRuleExecutors(): RuleExecutor[] {
  return [
    new RiskMitigationRuleExecutor(),
    new OpportunityRuleExecutor(),
    new PerformanceOptimizationRuleExecutor(),
    new CompetitorResponseRuleExecutor(),
  ];
}
