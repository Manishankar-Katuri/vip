import prisma from "@vip/database";

import { ProviderRequest, ProviderRunner, MarketSignalProvider } from "../providers";
import { IntelligenceSource, TrendIntelligence, TrendSignal } from "../types";
import { directionFromMomentum, rounded, toJson } from "../utils";

export interface CollectTrendsOptions extends ProviderRequest {
  providers?: MarketSignalProvider[];
  forceRefresh?: boolean;
  runner?: ProviderRunner;
}

export async function collectTrendIntelligence(options: CollectTrendsOptions): Promise<TrendIntelligence> {
  const providerResults = options.providers?.length
    ? await collectFromProviders(options)
    : [];
  const newSignals = providerResults.flatMap((result) => result.signals);

  if (newSignals.length > 0) {
    await persistTrendSignals(options.workspaceId, newSignals);
  }

  const signals = newSignals.length > 0
    ? scoreSignals(newSignals)
    : await readRecentSignals(options.workspaceId, options.regionKey);
  const sources: IntelligenceSource[] = providerResults.map((result) => ({
    provider: result.providerId,
    collectedAt: result.collectedAt,
    sourceType: "PLATFORM",
    confidence: averageConfidence(result.signals),
    cached: result.cached,
  }));
  if (providerResults.length === 0 && signals.length > 0) {
    sources.push({
      provider: "stored-market-signal-observations",
      collectedAt: options.asOf.toISOString(),
      sourceType: "WORKSPACE",
      confidence: averageConfidence(signals),
      cached: true,
    });
  }

  return {
    topics: filter(signals, "HEALTHCARE_TOPIC"),
    hashtags: filter(signals, "HASHTAG"),
    reelFormats: filter(signals, "CONTENT_FORMAT"),
    viralTopics: filter(signals, "VIRAL_TOPIC"),
    risingTopics: signals.filter((signal) => signal.direction === "RISING" || signal.direction === "EMERGING").slice(0, 12),
    decliningTopics: signals.filter((signal) => signal.direction === "DECLINING").slice(0, 12),
    geoAwareHashtags: filter(signals, "HASHTAG").slice(0, 12).map((signal) => signal.label.startsWith("#") ? signal.label : `#${signal.label}`),
    localLanguageTopics: signals.filter((signal) => (signal.languages?.length ?? 0) > 0).slice(0, 12),
    sources,
  };
}

async function collectFromProviders(options: CollectTrendsOptions) {
  const runner = options.runner ?? new ProviderRunner();
  return Promise.all(
    (options.providers ?? []).map((provider) => runner.collect(provider, options, options.forceRefresh))
  );
}

async function persistTrendSignals(workspaceId: string, signals: TrendSignal[]) {
  await prisma.marketSignalObservation.createMany({
    data: signals.map((signal) => ({
      workspaceId,
      provider: signal.provider,
      category: signal.category,
      regionKey: signal.regionKey,
      signalKey: signal.key,
      label: signal.label,
      score: signal.score,
      volume: signal.volume,
      momentum: signal.momentum,
      sentiment: signal.sentiment,
      confidence: signal.confidence,
      metadata: toJson({ hashtags: signal.hashtags, languages: signal.languages, ...signal.metadata }),
      observedAt: new Date(signal.observedAt),
    })),
    skipDuplicates: true,
  });
}

async function readRecentSignals(workspaceId: string, regionKey: string) {
  const observations = await prisma.marketSignalObservation.findMany({
    where: { workspaceId, regionKey },
    orderBy: { observedAt: "desc" },
    take: 250,
  });
  const latest = new Map<string, (typeof observations)[number]>();
  for (const observation of observations) {
    const key = `${observation.category}:${observation.signalKey}`;
    if (!latest.has(key)) latest.set(key, observation);
  }

  return scoreSignals([...latest.values()].map((observation) => {
    const metadata = readMetadata(observation.metadata);
    return {
    key: observation.signalKey,
    label: observation.label,
    category: observation.category as TrendSignal["category"],
    regionKey: observation.regionKey,
    provider: observation.provider,
    score: observation.score,
    volume: observation.volume ?? undefined,
    momentum: observation.momentum ?? 0,
    direction: directionFromMomentum(observation.momentum ?? 0),
    sentiment: observation.sentiment ?? undefined,
    confidence: observation.confidence,
    observedAt: observation.observedAt.toISOString(),
    hashtags: metadata.hashtags,
    languages: metadata.languages,
    metadata,
  };
  }));
}

function scoreSignals(signals: TrendSignal[]) {
  return signals
    .map((signal) => ({
      ...signal,
      score: rounded(signal.score),
      momentum: rounded(signal.momentum),
      direction: directionFromMomentum(signal.momentum),
    }))
    .sort((a, b) => b.score + b.momentum * 0.3 - (a.score + a.momentum * 0.3));
}

function filter(signals: TrendSignal[], category: TrendSignal["category"]) {
  return signals.filter((signal) => signal.category === category).slice(0, 20);
}

function averageConfidence(signals: TrendSignal[]) {
  if (signals.length === 0) return 0;
  return rounded(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length, 3);
}

function readMetadata(value: unknown): Record<string, unknown> & {
  hashtags?: string[];
  languages?: string[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const data = value as Record<string, unknown>;
  return {
    ...data,
    hashtags: Array.isArray(data.hashtags)
      ? data.hashtags.filter((item): item is string => typeof item === "string")
      : undefined,
    languages: Array.isArray(data.languages)
      ? data.languages.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}
