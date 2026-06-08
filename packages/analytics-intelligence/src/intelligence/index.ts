import { randomUUID } from "node:crypto";

import type { Insight, IntelligenceScores, IntelligenceSignal, Prediction } from "../dto";
import { InsightSchema } from "../schemas";

export class AIInsightGenerator {
  constructor(private readonly id: () => string = () => randomUUID()) {}

  generate(
    workspaceId: string,
    signals: IntelligenceSignal[],
    predictions: Prediction[],
    scores: IntelligenceScores,
    generatedAt: string
  ): Insight[] {
    const evidenceIds = [...signals.map((signal) => signal.id), ...predictions.map((prediction) => prediction.id)];
    const strongest = signals.slice().sort((left, right) => Math.abs(right.magnitude) - Math.abs(left.magnitude))[0];
    const trajectory = predictions.find((prediction) => prediction.metric === "ENGAGEMENT_TRAJECTORY");
    const insights: Insight[] = [
      this.insight(workspaceId, "DAILY_SUMMARY", "Daily intelligence summary",
        strongest ? strongest.summary : "Performance remains within observed baselines.", "MEDIUM", generatedAt, evidenceIds),
      this.insight(workspaceId, "WEEKLY_SUMMARY", "Weekly performance outlook",
        `Projected engagement change is ${format(trajectory?.changePercent ?? 0)} over the forecast window.`, "MEDIUM", generatedAt, evidenceIds),
      this.insight(workspaceId, "EXECUTIVE_SUMMARY", "Executive intelligence brief",
        `Growth score ${scores.growth}; opportunity score ${scores.opportunity}; risk score ${scores.risk}.`, scores.risk >= 70 ? "HIGH" : "MEDIUM", generatedAt, evidenceIds),
    ];
    if (scores.risk >= 50) {
      insights.push(this.insight(workspaceId, "RISK_ALERT", "Performance risk detected",
        "Risk indicators require review before scaling active workflows.", scores.risk >= 75 ? "CRITICAL" : "HIGH", generatedAt, evidenceIds));
    }
    if (scores.opportunity >= 50) {
      insights.push(this.insight(workspaceId, "OPPORTUNITY_REPORT", "Opportunity window identified",
        "Positive momentum supports a time-bound content or campaign activation.", "HIGH", generatedAt, evidenceIds));
      insights.push(this.insight(workspaceId, "ACTION", "Act on emerging momentum",
        "Route the highest-confidence opportunity into recommendation evaluation.", "HIGH", generatedAt, evidenceIds));
    }
    return insights;
  }

  private insight(
    workspaceId: string, type: Insight["type"], title: string, narrative: string,
    priority: Insight["priority"], generatedAt: string, evidenceIds: string[]
  ) {
    return InsightSchema.parse({ id: this.id(), workspaceId, type, title, narrative, priority, generatedAt, evidenceIds });
  }
}

function format(value: number) {
  return `${Math.round(value * 100) / 100}%`;
}
