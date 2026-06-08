import prisma from "@vip/database";

import { CompetitorIntelligence, CompetitorPattern } from "../types";
import { rounded } from "../utils";

type PublicPostPattern = {
  themes?: string[];
  format?: string;
  hookStyle?: string;
  engagementRate?: number;
};

type PublicMetrics = {
  postingFrequencyPerWeek?: number;
  topThemes?: string[];
  postPatterns?: PublicPostPattern[];
};

export async function analyzeCompetitorPatterns(workspaceId: string): Promise<CompetitorIntelligence> {
  const accounts = await prisma.competitorAccount.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const collectedAt = new Date().toISOString();
  const metrics = accounts.map((account) => readMetrics(account.metrics));
  const posts = metrics.flatMap((metric) => metric.postPatterns ?? []);
  const patterns = [
    ...themePatterns(posts, metrics),
    ...fieldPatterns(posts, "format", "FORMAT"),
    ...fieldPatterns(posts, "hookStyle", "HOOK"),
  ].sort((a, b) => b.prevalence - a.prevalence).slice(0, 15);
  const cadence = metrics
    .map((metric) => metric.postingFrequencyPerWeek)
    .filter((frequency): frequency is number => typeof frequency === "number");

  return {
    accountsAnalyzed: accounts.length,
    patterns,
    topPerformingThemes: patterns
      .filter((pattern) => pattern.patternType === "THEME")
      .slice(0, 6)
      .map((pattern) => pattern.label),
    postingFrequencySignals: cadence.length
      ? [`Observed competitor posting cadence averages ${rounded(cadence.reduce((a, b) => a + b, 0) / cadence.length, 1)} posts per week.`]
      : ["Collect public posting history to compare cadence and consistency."],
    opportunityGaps: accounts.length === 0
      ? ["Add local and specialty competitor accounts for regional pattern analysis."]
      : patterns.length === 0
        ? ["Capture structured public post pattern metadata to identify under-served themes."]
        : ["Compare observed themes with internal performance before selecting differentiated education topics."],
    guardrail: "Use competitor material only for aggregated pattern intelligence; do not copy captions, creative, or medical claims.",
    sources: accounts.length
      ? [{
          provider: "workspace-competitor-public-metadata",
          collectedAt,
          sourceType: "WORKSPACE",
          confidence: posts.length >= 10 ? 0.7 : 0.42,
          note: "Derived from structured public-post observations saved to competitor accounts.",
        }]
      : [],
  };
}

function themePatterns(posts: PublicPostPattern[], metrics: PublicMetrics[]) {
  const themes = [
    ...posts.flatMap((post) => post.themes ?? []),
    ...metrics.flatMap((metric) => metric.topThemes ?? []),
  ];
  return countedPatterns(themes, "THEME", Math.max(posts.length, metrics.length));
}

function fieldPatterns(
  posts: PublicPostPattern[],
  field: "format" | "hookStyle",
  patternType: CompetitorPattern["patternType"]
) {
  return countedPatterns(
    posts.map((post) => post[field]).filter((value): value is string => Boolean(value)),
    patternType,
    posts.length,
    posts
  );
}

function countedPatterns(
  labels: string[],
  patternType: CompetitorPattern["patternType"],
  total: number,
  posts: PublicPostPattern[] = []
) {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({
    label,
    patternType,
    prevalence: rounded(count / Math.max(total, 1), 3),
    performanceScore: meanEngagement(posts),
    examplesCount: count,
    interpretation: `${label} appears in ${count} observed public pattern record${count === 1 ? "" : "s"}.`,
  }));
}

function meanEngagement(posts: PublicPostPattern[]) {
  const values = posts.map((post) => post.engagementRate).filter((value): value is number => typeof value === "number");
  return values.length ? rounded(values.reduce((a, b) => a + b, 0) / values.length, 3) : undefined;
}

function readMetrics(value: unknown): PublicMetrics {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    postingFrequencyPerWeek: typeof record.postingFrequencyPerWeek === "number" ? record.postingFrequencyPerWeek : undefined,
    topThemes: Array.isArray(record.topThemes) ? record.topThemes.filter((item): item is string => typeof item === "string") : undefined,
    postPatterns: Array.isArray(record.postPatterns)
      ? record.postPatterns.filter((item): item is PublicPostPattern => Boolean(item) && typeof item === "object")
      : undefined,
  };
}
