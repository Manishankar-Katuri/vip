import type { SignalAggregator as SignalAggregatorContract } from "../interfaces";
import type {
  AggregatedSignalSet,
  IntelligenceSignal,
  NormalizedSignal,
  SignalGroupSummary,
  WorkspaceStrategyContext,
} from "../types";
import { average, clamp, round } from "../utils/numbers";

export interface SignalAggregatorOptions {
  maximumAgeDays?: number;
  minimumConfidence?: number;
}

export class DefaultSignalAggregator implements SignalAggregatorContract {
  private readonly maximumAgeDays: number;
  private readonly minimumConfidence: number;

  constructor(options: SignalAggregatorOptions = {}) {
    this.maximumAgeDays = options.maximumAgeDays ?? 30;
    this.minimumConfidence = options.minimumConfidence ?? 0.25;
  }

  aggregate(
    context: WorkspaceStrategyContext,
    signals: IntelligenceSignal[],
    asOf = new Date()
  ): AggregatedSignalSet {
    const eligible = signals.filter(
      (signal) =>
        signal.workspaceId === context.workspaceId &&
        signal.confidence >= this.minimumConfidence &&
        (!signal.expiresAt || new Date(signal.expiresAt).getTime() >= asOf.getTime())
    );
    const deduplicated = new Map<string, IntelligenceSignal>();

    for (const signal of eligible) {
      const key = `${signal.type}:${signal.id}`;
      const current = deduplicated.get(key);
      if (!current || new Date(signal.observedAt).getTime() > new Date(current.observedAt).getTime()) {
        deduplicated.set(key, signal);
      }
    }

    const normalized = Array.from(deduplicated.values())
      .map((signal) => this.normalize(signal, asOf))
      .sort((left, right) => right.relevanceScore - left.relevanceScore);

    const selectedIds = new Set(normalized.map((signal) => signal.id));
    const discardedSignalIds = signals
      .filter((signal) => signal.workspaceId === context.workspaceId && !selectedIds.has(signal.id))
      .map((signal) => signal.id);

    return {
      workspaceId: context.workspaceId,
      generatedAt: asOf.toISOString(),
      signals: normalized,
      groups: this.group(normalized),
      sourceProviders: Array.from(new Set(normalized.map((signal) => signal.source.provider))),
      discardedSignalIds,
    };
  }

  private normalize(signal: IntelligenceSignal, asOf: Date): NormalizedSignal {
    const ageMs = Math.max(0, asOf.getTime() - new Date(signal.observedAt).getTime());
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const recencyScore = clamp(100 - (ageDays / this.maximumAgeDays) * 100);
    const relevanceScore = round(
      clamp(
        signal.impact * 0.42 +
          (signal.urgency ?? 50) * 0.18 +
          signal.confidence * 100 * 0.25 +
          recencyScore * 0.15
      )
    );

    return { ...signal, recencyScore: round(recencyScore), relevanceScore };
  }

  private group(signals: NormalizedSignal[]): SignalGroupSummary[] {
    const grouped = new Map<NormalizedSignal["type"], NormalizedSignal[]>();
    for (const signal of signals) {
      grouped.set(signal.type, [...(grouped.get(signal.type) ?? []), signal]);
    }

    return Array.from(grouped.entries())
      .map(([type, entries]) => ({
        type,
        count: entries.length,
        averageRelevance: round(average(entries.map((entry) => entry.relevanceScore))),
        highestSignalId: entries[0].id,
      }))
      .sort((left, right) => right.averageRelevance - left.averageRelevance);
  }
}
