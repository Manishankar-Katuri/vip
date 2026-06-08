import prisma from "@vip/database";
import { resolveSocialWorkspace } from "../workspace";

export interface CompetitorComparison {
  workspaceId: string;
  competitors: Array<{
    id: string;
    platform: string;
    handle: string;
    displayName: string | null;
    tier: string;
    lastAnalyzedAt: Date | null;
    metrics: unknown;
  }>;
  gaps: Array<{ label: string; confidence: number; rationale: string }>;
}

export async function analyzeCompetitors(
  workspaceId: string
): Promise<CompetitorComparison> {
  await resolveSocialWorkspace(workspaceId);
  const competitors = await prisma.competitorAccount.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return {
    workspaceId,
    competitors: competitors.map((competitor) => ({
      id: competitor.id,
      platform: competitor.platform,
      handle: competitor.handle,
      displayName: competitor.displayName,
      tier: competitor.tier,
      lastAnalyzedAt: competitor.lastAnalyzedAt,
      metrics: competitor.metrics,
    })),
    gaps: competitors.length === 0
      ? [
          {
            label: "Competitor baseline missing",
            confidence: 0.9,
            rationale:
              "Add local and specialty competitor accounts to unlock comparative recommendations.",
          },
        ]
      : [],
  };
}
