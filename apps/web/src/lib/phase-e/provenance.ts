import type { DataProvenance, DataProvenanceStatus } from "./contracts";

type BuildProvenanceInput = {
  source: string;
  sourceService: string;
  fetchedAt?: Date | string | null;
  recordCount?: number;
  apiCalled?: string | null;
  lastSuccessfulSyncAt?: Date | string | null;
  cacheTtlSeconds?: number;
  staleAfterSeconds?: number;
  mock?: boolean;
  metadata?: Record<string, unknown>;
};

export function buildDataProvenance(input: BuildProvenanceInput): DataProvenance {
  const fetchedAt = toDate(input.fetchedAt) ?? new Date();
  const cacheAgeSeconds = Math.max(0, Math.floor((Date.now() - fetchedAt.getTime()) / 1000));
  const status = provenanceStatus({
    cacheAgeSeconds,
    recordCount: input.recordCount ?? 0,
    cacheTtlSeconds: input.cacheTtlSeconds ?? 15 * 60,
    staleAfterSeconds: input.staleAfterSeconds ?? 24 * 60 * 60,
    mock: input.mock ?? false,
  });

  return {
    source: input.source,
    sourceService: input.sourceService,
    fetchedAt: fetchedAt.toISOString(),
    cacheAgeSeconds,
    freshnessScore: freshnessScore(cacheAgeSeconds, input.staleAfterSeconds ?? 24 * 60 * 60, status),
    status,
    recordCount: input.recordCount ?? 0,
    apiCalled: input.apiCalled ?? null,
    lastSuccessfulSyncAt: toDate(input.lastSuccessfulSyncAt)?.toISOString() ?? null,
    metadata: input.metadata ?? {},
  };
}

export function provenanceStatus(input: {
  cacheAgeSeconds: number;
  recordCount: number;
  cacheTtlSeconds: number;
  staleAfterSeconds: number;
  mock: boolean;
}): DataProvenanceStatus {
  if (input.mock || input.recordCount <= 0) return "MOCK";
  if (input.cacheAgeSeconds <= input.cacheTtlSeconds) return "LIVE";
  if (input.cacheAgeSeconds <= input.staleAfterSeconds) return "CACHED";
  return "STALE";
}

export function freshnessScore(cacheAgeSeconds: number, staleAfterSeconds: number, status: DataProvenanceStatus) {
  if (status === "MOCK") return 0;
  if (status === "STALE") return 15;
  const ratio = Math.min(1, cacheAgeSeconds / Math.max(1, staleAfterSeconds));
  return Math.round(Math.max(20, 100 - ratio * 80));
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

