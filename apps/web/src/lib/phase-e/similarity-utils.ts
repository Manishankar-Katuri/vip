import { createHash } from "node:crypto";

export function normalizeRecommendationText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprintRecommendation(value: string) {
  return createHash("sha256").update(normalizeRecommendationText(value)).digest("hex");
}

export function lexicalSimilarity(left: string, right: string) {
  const leftSet = new Set(normalizeRecommendationText(left).split(" ").filter(Boolean));
  const rightSet = new Set(normalizeRecommendationText(right).split(" ").filter(Boolean));
  if (!leftSet.size || !rightSet.size) return 0;
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  const jaccard = intersection / union;
  const containment = intersection / Math.min(leftSet.size, rightSet.size);
  return Math.max(jaccard, containment);
}
