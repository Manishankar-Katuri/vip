import {
  analyzeCompetitors,
  analyzeEngagement,
  analyzePostingFrequency,
  analyzeTrends,
} from "../services";
import { StrategyContext, StrategyProvider, StrategyRecommendation } from "./types";

export class RuleBasedStrategyProvider implements StrategyProvider {
  async generateRecommendations(
    context: StrategyContext
  ): Promise<StrategyRecommendation[]> {
    const [engagement, trends, posting, competitors] = await Promise.all([
      analyzeEngagement(context.workspaceId),
      analyzeTrends(context.workspaceId),
      analyzePostingFrequency(context.workspaceId),
      analyzeCompetitors(context.workspaceId),
    ]);

    const bestWindow = posting.bestWindows[0];
    const topHashtags = trends.hashtags.slice(0, 8).map((item) => `#${item.tag}`);
    const recommendations: StrategyRecommendation[] = [
      {
        type: "POSTING_SCHEDULE",
        title: "Anchor the weekly schedule around proven engagement windows",
        summary: bestWindow
          ? `Prioritize day ${bestWindow.dayOfWeek} at ${bestWindow.hourOfDay}:00 UTC for high-value posts.`
          : "Build a consistent three-post weekly schedule while more engagement history accumulates.",
        rationale:
          "Posting consistency improves learnability for both audiences and platform ranking systems.",
        priority: 1,
        confidence: bestWindow ? 0.72 : 0.48,
        score: posting.consistencyScore,
        payload: { bestWindows: posting.bestWindows, chart: posting.chart },
      },
      {
        type: "HASHTAG_STRATEGY",
        title: "Use a balanced hospital hashtag set",
        summary:
          topHashtags.length > 0
            ? `Reuse proven tags such as ${topHashtags.join(", ")} with specialty-specific tags.`
            : "Start with branded, location, specialty, and patient-education hashtag groups.",
        rationale:
          "Hashtags should help discovery without making clinical content feel generic or spammy.",
        priority: 2,
        confidence: topHashtags.length > 0 ? 0.7 : 0.45,
        score: topHashtags.length * 10,
        payload: { hashtags: topHashtags, heatmap: trends.heatmap },
      },
      {
        type: "ENGAGEMENT_IMPROVEMENT",
        title: "Turn top-performing posts into repeatable content formats",
        summary: `Average engagement is ${engagement.averageEngagementRate}%. Repackage the strongest posts into doctor Q&A, patient education, and community updates.`,
        rationale:
          "A hospital social engine should learn from format performance, not just individual post totals.",
        priority: 2,
        confidence: engagement.totalPosts > 5 ? 0.76 : 0.5,
        score: engagement.averageEngagementRate,
        payload: { topPosts: engagement.topPosts },
      },
      {
        type: "CONTENT_PILLAR",
        title: "Balance trust, education, access, and community pillars",
        summary:
          "Use content pillars for doctor credibility, preventive education, service-line awareness, and local trust.",
        rationale:
          "Hospitals need durable content systems that support reputation and patient acquisition together.",
        priority: 3,
        confidence: 0.68,
        score: 70,
        payload: {
          pillars: [
            "Doctor expertise",
            "Preventive care",
            "Patient trust",
            "Community presence",
          ],
        },
      },
    ];

    for (const gap of competitors.gaps) {
      recommendations.push({
        type: "COMPETITOR_GAP",
        title: gap.label,
        summary: gap.rationale,
        rationale: "Competitor visibility is required for gap-based social strategy.",
        priority: 2,
        confidence: gap.confidence,
        score: 60,
        payload: { gap },
      });
    }

    for (const opportunity of context.marketContext?.opportunitySignals.slice(0, 3) ?? []) {
      recommendations.push({
        type: "TREND_OPPORTUNITY",
        title: opportunity.title,
        summary: `${opportunity.reason} Recommended format: ${opportunity.recommendedFormat}.`,
        rationale:
          "External regional intelligence is combined with internal performance evidence before content is selected.",
        priority: opportunity.score >= 70 ? 1 : 2,
        confidence: opportunity.confidence,
        score: opportunity.score,
        payload: {
          marketRegion: context.marketContext?.region,
          relatedTopics: opportunity.relatedTopics,
          externalContextGeneratedAt: context.marketContext?.generatedAt,
        },
      });
    }

    return recommendations;
  }
}
