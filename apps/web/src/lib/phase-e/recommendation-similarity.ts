import prisma from "@vip/database";

import { fingerprintRecommendation, lexicalSimilarity, normalizeRecommendationText } from "./similarity-utils";

export type DuplicateDetectionResult = {
  status: "UNIQUE" | "DUPLICATE" | "REVIEW";
  fingerprint: string;
  normalizedText: string;
  similarityScore: number;
  duplicateOfId: string | null;
};

export async function detectDuplicateRecommendation(workspaceId: string, text: string): Promise<DuplicateDetectionResult> {
  const normalizedText = normalizeRecommendationText(text);
  const fingerprint = fingerprintRecommendation(text);
  const recent = await prisma.recommendationSimilarityFingerprint.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, normalizedText: true, recommendationId: true, fingerprint: true },
  });

  let best = { score: 0, duplicateOfId: null as string | null };
  for (const candidate of recent) {
    const score = candidate.fingerprint === fingerprint ? 1 : lexicalSimilarity(normalizedText, candidate.normalizedText);
    if (score > best.score) best = { score, duplicateOfId: candidate.recommendationId ?? candidate.id };
  }

  return {
    status: best.score >= 0.85 ? "DUPLICATE" : best.score >= 0.72 ? "REVIEW" : "UNIQUE",
    fingerprint,
    normalizedText,
    similarityScore: Number(best.score.toFixed(4)),
    duplicateOfId: best.duplicateOfId,
  };
}

export { fingerprintRecommendation, lexicalSimilarity, normalizeRecommendationText };
