import type { AnalyticsSeries, CompetitorComparison, CompetitorDataset } from "../dto";
import { AnalyticsSeriesSchema, CompetitorComparisonSchema, CompetitorDatasetSchema } from "../schemas";
import { average } from "../utils";

export class CompetitorIntelligenceEngine {
  compare(input: AnalyticsSeries, competitor: CompetitorDataset, adoptedTrends: string[] = []): CompetitorComparison {
    const own = AnalyticsSeriesSchema.parse(input);
    const peer = CompetitorDatasetSchema.parse(competitor);
    const ownCategories = own.points[own.points.length - 1].categories;
    const peerCategories = peer.points[peer.points.length - 1].categories;
    const leadingCategories = Object.keys(peerCategories).filter((category) =>
      peerCategories[category] > (ownCategories[category] ?? 0));
    return CompetitorComparisonSchema.parse({
      workspaceId: own.workspaceId,
      competitorId: peer.competitorId,
      postingFrequencyDelta: average(own.points.map((point) => point.postsPublished)) -
        average(peer.points.map((point) => point.postsPublished)),
      engagementDelta: average(own.points.map((point) => point.engagementRate)) -
        average(peer.points.map((point) => point.engagementRate)),
      trendAdoptionGap: peer.adoptedTrends.filter((trend) => !adoptedTrends.includes(trend)),
      leadingCategories,
      generatedAt: own.observedAt,
    });
  }
}
