import { TrendSignal } from "../types";
import { clamp, directionFromMomentum, rounded } from "../utils";

export interface TrendSeriesPoint {
  observedAt: string;
  score: number;
  volume?: number;
}

export function scoreTrendMomentum(points: TrendSeriesPoint[]) {
  if (points.length < 2) return { momentum: 0, direction: "STABLE" as const };
  const ordered = [...points].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const first = ordered[0].score;
  const last = ordered[ordered.length - 1].score;
  const momentum = clamp(((last - first) / Math.max(first, 1)) * 100, -100, 100);
  return { momentum: rounded(momentum), direction: directionFromMomentum(momentum) };
}

export function contentOpportunityScore(
  trend: TrendSignal,
  regionalRelevance: number,
  clinicalRelevance: number
) {
  return rounded(clamp(
    trend.score * 0.4 +
    Math.max(trend.momentum, 0) * 0.25 +
    regionalRelevance * 0.15 +
    clinicalRelevance * 0.2
  ));
}

export function estimateAudienceSentiment(signals: TrendSignal[]) {
  const observed = signals.filter((signal) => typeof signal.sentiment === "number");
  if (observed.length === 0) return undefined;
  return rounded(observed.reduce((sum, signal) => sum + (signal.sentiment ?? 0), 0) / observed.length, 3);
}
