import { AnalyticsAnalysisInputSchema, AnalyticsSignalSchema } from "../schemas";
import type { AnalyticsAnalysisInput, AnalyticsMetric, AnalyticsSignal, SignalDirection } from "../types";

const SCORE_MULTIPLIER = 2.5;

export class SignalAnalyzer {
  analyze(input: AnalyticsAnalysisInput): AnalyticsSignal[] {
    const valid = AnalyticsAnalysisInputSchema.parse(input);
    const currentConsistency = completionRate(valid.current.postsPublished, valid.current.targetPosts);
    const previousConsistency = completionRate(valid.previous.postsPublished, valid.previous.targetPosts);
    const baseSignals = [
      this.createSignal(valid, "ENGAGEMENT", valid.current.engagementRate, valid.previous.engagementRate),
      this.createSignal(valid, "REACH", valid.current.reach, valid.previous.reach),
      this.createSignal(valid, "POSTING_CONSISTENCY", currentConsistency, previousConsistency),
      this.createSignal(valid, "AUDIENCE_GROWTH", valid.current.audienceSize, valid.previous.audienceSize),
      this.createSignal(valid, "CONTENT_PERFORMANCE", valid.current.contentPerformance, valid.previous.contentPerformance),
    ];
    const componentShift = baseSignals.reduce((sum, signal) => sum + signedChange(signal), 0) / baseSignals.length;
    const currentMomentum = clamp(50 + componentShift / 2);
    const momentum = this.createSignal(valid, "MOMENTUM", currentMomentum, 50);

    return [...baseSignals, momentum].map((signal) => AnalyticsSignalSchema.parse(signal) as AnalyticsSignal);
  }

  private createSignal(
    input: AnalyticsAnalysisInput,
    metric: AnalyticsMetric,
    currentValue: number,
    previousValue: number
  ): AnalyticsSignal {
    const changePercent = round(changeFrom(previousValue, currentValue));
    const direction = directionFor(changePercent);
    return {
      id: `${input.workspaceId}:${metric}:${input.current.endsAt}`,
      workspaceId: input.workspaceId,
      metric,
      direction,
      currentValue: round(currentValue),
      previousValue: round(previousValue),
      changePercent,
      normalizedScore: round(clamp(Math.abs(changePercent) * SCORE_MULTIPLIER)),
      confidence: confidenceFor(input.current, input.previous),
      summary: describe(metric, direction, changePercent),
      observedAt: input.observedAt,
      source: input.source,
    };
  }
}

function completionRate(postsPublished: number, targetPosts: number) {
  return Math.min(postsPublished / targetPosts, 1) * 100;
}

function changeFrom(previous: number, current: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function directionFor(changePercent: number): SignalDirection {
  if (changePercent > 1) return "INCREASED";
  if (changePercent < -1) return "DECREASED";
  return "STABLE";
}

function signedChange(signal: AnalyticsSignal) {
  return signal.direction === "DECREASED" ? -Math.abs(signal.changePercent) : Math.abs(signal.changePercent);
}

function confidenceFor(current: AnalyticsAnalysisInput["current"], previous: AnalyticsAnalysisInput["previous"]) {
  const totalPosts = current.postsPublished + previous.postsPublished;
  return round(Math.min(0.98, 0.62 + totalPosts * 0.025), 2);
}

function describe(metric: AnalyticsMetric, direction: SignalDirection, changePercent: number) {
  const label = metric.toLowerCase().replace(/_/g, " ");
  if (direction === "STABLE") return `${label} remained stable against the previous period`;
  return `${label} ${direction === "INCREASED" ? "increased" : "declined"} by ${Math.abs(changePercent).toFixed(1)}% against the previous period`;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function round(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
