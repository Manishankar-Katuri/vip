import type { MarketContext } from "@vip/market-intelligence";

export interface StrategyContext {
  workspaceId: string;
  hospitalName?: string;
  specialtyFocus?: string[];
  marketContext?: MarketContext;
}

export interface StrategyRecommendation {
  type:
    | "CONTENT_IDEA"
    | "POSTING_SCHEDULE"
    | "CAPTION_STRATEGY"
    | "HASHTAG_STRATEGY"
    | "CAMPAIGN_IDEA"
    | "ENGAGEMENT_IMPROVEMENT"
    | "CONTENT_PILLAR"
    | "COMPETITOR_GAP"
    | "TREND_OPPORTUNITY";
  title: string;
  summary: string;
  rationale: string;
  priority: number;
  confidence: number;
  score: number;
  payload: Record<string, unknown>;
}

export interface StrategyProvider {
  generateRecommendations(
    context: StrategyContext
  ): Promise<StrategyRecommendation[]>;
}
