import type {
  ContentDecision,
  DailyIntelligenceSnapshot,
  PlannedCalendarItem,
  PlatformAnalytics,
  RecentContentPerformance,
} from "./types";

type DecisionInput = {
  plannedItems: PlannedCalendarItem[];
  intelligence: DailyIntelligenceSnapshot;
  clientConfig?: {
    preferredHashtags?: string[];
    unavailableAssets?: string[];
    riskTerms?: string[];
  };
};

const DEFAULT_RISK_TERMS = ["guaranteed cure", "before after", "patient identity", "emergency claim"];

export class ContentDecisionEngine {
  evaluate(input: DecisionInput): ContentDecision[] {
    const decisions = input.plannedItems.map((item, index) =>
      this.evaluateItem(item, index, input)
    );
    const trendAddition = this.evaluateTrendAddition(input, decisions);

    return trendAddition ? [...decisions, trendAddition] : decisions;
  }

  private evaluateItem(
    item: PlannedCalendarItem,
    index: number,
    input: DecisionInput
  ): ContentDecision {
    const analytics = platformAnalyticsFor(item.platform, input.intelligence.platformAnalytics);
    const relatedPerformance = findRelatedPerformance(item, input.intelligence.recentContentPerformance);
    const topicSignal = findTopicSignal(item, input.intelligence.topicPerformance);
    const platformSignal = input.intelligence.platformPerformance.find((signal) =>
      normalize(signal.platform) === normalize(item.platform)
    );
    const assetSignal = input.intelligence.assetSignals.find((signal) =>
      normalize(signal.topicOrItemId) === normalize(item.id) ||
      normalize(signal.topicOrItemId) === normalize(item.plannedTopic) ||
      normalize(item.plannedTopic).includes(normalize(signal.topicOrItemId))
    );
    const repeated = input.plannedItems
      .slice(0, index)
      .some((other) => normalize(other.plannedTopic) === normalize(item.plannedTopic));
    const riskyTerm = findRiskTerm(item, input.clientConfig?.riskTerms ?? DEFAULT_RISK_TERMS);
    const unavailableAsset = item.plannedAssets.find((asset) =>
      (input.clientConfig?.unavailableAssets ?? []).some((missing) =>
        normalize(asset).includes(normalize(missing))
      )
    );
    const strongerTrend = input.intelligence.trendSignals.find((signal) =>
      signal.score >= 85 && signal.confidence !== undefined ? signal.confidence >= 0.65 : signal.score >= 85
    );
    const normalizedTrend = input.intelligence.trendSignalsNormalized.find((signal) => signal.urgency === "HIGH");

    if (
      riskyTerm ||
      unavailableAsset ||
      assetSignal?.status === "MISSING" ||
      assetSignal?.status === "RISKY" ||
      item.approvalStatus === "REJECTED"
    ) {
      return this.buildDecision(item, "PAUSE", {
        reason: riskyTerm
          ? `This item should pause until the claim language around "${riskyTerm}" is reviewed.`
          : assetSignal?.status === "RISKY"
            ? `This item should pause because intelligence flagged an asset or approval risk: ${assetSignal.reason}`
            : assetSignal?.status === "MISSING"
              ? `This item should pause because a required asset is missing: ${assetSignal.reason}`
              : `This item should pause because the required asset "${unavailableAsset}" is not ready yet.`,
        confidenceScore: 0.78,
        signals: { riskyTerm, unavailableAsset, assetSignal },
        contentType: item.plannedContentType,
        topic: item.plannedTopic,
      });
    }

    if ((relatedPerformance && relatedPerformance.engagementRate < 0.006) || topicSignal?.signal === "WEAK" || repeated) {
      const replacementTopic = normalizedTrend?.topic
        ? `${normalizedTrend.topic}: practical patient guidance`
        : strongerTrend?.label
        ? `${strongerTrend.label}: practical patient guidance`
        : `Fresh angle on ${item.goal || item.campaignTheme || item.plannedTopic}`;

      return this.buildDecision(item, "REPLACE", {
        reason: relatedPerformance || topicSignal?.signal === "WEAK"
          ? `Recent intelligence shows this related topic is weak, so this plan replaces it with a stronger angle. ${topicSignal?.reason ?? "Recent similar content underperformed."}`
          : "The window already repeats this topic, so one item is replaced to keep the client plan varied and useful.",
        confidenceScore: relatedPerformance ? 0.82 : 0.74,
        signals: { relatedPerformance, topicSignal, repeated, strongerTrend, normalizedTrend },
        contentType: normalizedTrend?.recommendedContentType ?? analytics?.bestContentType ?? platformSignal?.topContentTypes?.[0] ?? item.plannedContentType,
        topic: replacementTopic,
      });
    }

    if ((relatedPerformance && relatedPerformance.engagementRate >= 0.018) || topicSignal?.signal === "STRONG") {
      return this.buildDecision(item, "KEEP", {
        reason: topicSignal?.reason ?? "Recent related content performed well, and there is no stronger urgent opportunity replacing this slot.",
        confidenceScore: 0.86,
        signals: { relatedPerformance, topicSignal },
        contentType: item.plannedContentType,
        topic: item.plannedTopic,
      });
    }

    const preferredFormat = analytics?.bestContentType ?? platformSignal?.topContentTypes?.[0];

    if (
      preferredFormat &&
      !sameFormat(preferredFormat, item.plannedContentType)
    ) {
      return this.buildDecision(item, "IMPROVE", {
        reason: `${item.platform} has recently performed better with ${preferredFormat.toLowerCase()} content, so the topic stays but the format, opening line, and patient action are tightened.`,
        confidenceScore: 0.81,
        signals: { analytics, platformSignal },
        contentType: preferredFormat,
        topic: item.plannedTopic,
        postingTime: analytics?.bestPostingTime ?? platformSignal?.bestPostingTime ?? item.plannedPostingTime,
      });
    }

    const preferredPostingTime = analytics?.bestPostingTime ?? platformSignal?.bestPostingTime;

    if (
      preferredPostingTime &&
      preferredPostingTime !== item.plannedPostingTime
    ) {
      return this.buildDecision(item, "IMPROVE", {
        reason: "The topic is strong, but the posting time is adjusted to match recent platform performance.",
        confidenceScore: 0.76,
        signals: { analytics, platformSignal },
        contentType: item.plannedContentType,
        topic: item.plannedTopic,
        postingTime: preferredPostingTime,
      });
    }

    return this.buildDecision(item, "KEEP", {
      reason: "The planned topic fits the current campaign and has simple preparation needs, so it remains in the execution plan.",
      confidenceScore: 0.68,
      signals: { campaignTheme: item.campaignTheme, goal: item.goal, sourceLabel: input.intelligence.sourceLabel },
      contentType: item.plannedContentType,
      topic: item.plannedTopic,
    });
  }

  private evaluateTrendAddition(
    input: DecisionInput,
    existingDecisions: ContentDecision[]
  ): ContentDecision | null {
    const normalizedTrend = input.intelligence.trendSignalsNormalized
      .filter((signal) => signal.urgency === "HIGH")
      .sort((left, right) => urgencyRank(right.urgency) - urgencyRank(left.urgency))[0];
    const urgentTrend = input.intelligence.trendSignals
      .filter((signal) => signal.score >= 82 && (signal.confidence ?? 0.7) >= 0.6)
      .sort((left, right) => right.score - left.score)[0];

    if ((!urgentTrend && !normalizedTrend) || input.plannedItems.length >= 6) return null;
    const trendTopic = normalizedTrend?.topic ?? urgentTrend?.label ?? "Timely patient education";

    const hasRelatedPlan = existingDecisions.some((decision) =>
      normalize(decision.finalTopic).includes(normalize(trendTopic)) ||
      normalize(trendTopic).includes(normalize(decision.finalTopic))
    );

    if (hasRelatedPlan) return null;

    const platform = input.intelligence.platformAnalytics[0]?.platform ?? "INSTAGRAM";
    const format = input.intelligence.platformAnalytics[0]?.bestContentType ?? "REEL";

    return {
      decision: "ADD",
      finalTopic: `${trendTopic}: timely content opportunity`,
      finalContentType: normalizedTrend?.recommendedContentType ?? format,
      decisionReason: normalizedTrend?.reason ?? "A high-momentum trend is relevant enough to add one timely item without removing the baseline calendar.",
      intelligenceSignalsUsed: { urgentTrend, normalizedTrend },
      confidenceScore: 0.84,
      platform,
      postingTime: input.intelligence.platformAnalytics[0]?.bestPostingTime ?? "09:30",
      approvalStatus: "NEEDS_APPROVAL",
      generatedContent: buildGeneratedContent(`${trendTopic}: timely content opportunity`, normalizedTrend?.recommendedContentType ?? format, "ADD"),
    };
  }

  private buildDecision(
    item: PlannedCalendarItem,
    decision: ContentDecision["decision"],
    options: {
      reason: string;
      confidenceScore: number;
      signals: Record<string, unknown>;
      topic: string;
      contentType: string;
      postingTime?: string;
    }
  ): ContentDecision {
    return {
      decision,
      calendarItemId: item.id,
      originalTopic: item.plannedTopic,
      finalTopic: options.topic,
      originalContentType: item.plannedContentType,
      finalContentType: options.contentType,
      decisionReason: options.reason,
      intelligenceSignalsUsed: options.signals,
      confidenceScore: clampConfidence(options.confidenceScore),
      date: item.date,
      platform: item.platform,
      postingTime: options.postingTime ?? item.plannedPostingTime,
      approvalStatus: item.approvalStatus,
      generatedContent: buildGeneratedContent(options.topic, options.contentType, decision),
    };
  }
}

function platformAnalyticsFor(platform: string, analytics: PlatformAnalytics[]) {
  return analytics.find((item) => normalize(item.platform) === normalize(platform));
}

function findRelatedPerformance(
  item: PlannedCalendarItem,
  performances: RecentContentPerformance[]
) {
  const topicWords = normalize(item.plannedTopic).split("-").filter((word) => word.length > 3);

  return performances.find((performance) =>
    performance.platform === item.platform &&
    topicWords.some((word) => normalize(performance.topic).includes(word))
  );
}

function findTopicSignal(
  item: PlannedCalendarItem,
  signals: DailyIntelligenceSnapshot["topicPerformance"]
) {
  const topicWords = normalize(item.plannedTopic).split("-").filter((word) => word.length > 3);

  return signals.find((signal) =>
    (!signal.platform || normalize(signal.platform) === normalize(item.platform)) &&
    topicWords.some((word) => normalize(signal.topic).includes(word))
  );
}

function findRiskTerm(item: PlannedCalendarItem, terms: string[]) {
  const text = normalize(`${item.plannedTopic} ${item.plannedCaption ?? ""}`);

  return terms.find((term) => text.includes(normalize(term)));
}

function sameFormat(left: string, right: string) {
  const normalizedLeft = normalize(left).replace("short-form-video", "reel").replace("video", "reel");
  const normalizedRight = normalize(right).replace("short-form-video", "reel").replace("video", "reel");

  return normalizedLeft === normalizedRight;
}

function buildGeneratedContent(topic: string, contentType: string, decision: ContentDecision["decision"]) {
  const topicLower = topic.toLowerCase();

  return {
    hook: decision === "KEEP"
      ? `A clear answer patients need about ${topicLower}`
      : `What changed about ${topicLower}, and what patients should do next`,
    caption: `Use this ${contentType.toLowerCase()} to explain ${topicLower} in simple, practical language. Keep the message useful, clinically safe, and action-oriented.`,
    hashtags: ["#PatientEducation", "#HealthAwareness", "#VIPContent"],
    cta: "Reply with your question or contact the clinic team for guidance.",
    creativeDirection: `Lead with a direct patient question, keep visuals clean, and end with one clear next step.`,
    assetRequirements: contentType === "REEL" || contentType === "YOUTUBE_SHORT"
      ? ["Doctor availability for short video", "Clinic visuals or approved stock visual"]
      : ["Approved image or carousel template", "Doctor-reviewed key points"],
    internalTeamTasks: ["Finalize opening line and post description", "Prepare post design/edit", "Run final check"],
    clientPreparationTasks: ["Confirm medical accuracy", "Share any required clinic asset"],
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function urgencyRank(value: "LOW" | "MEDIUM" | "HIGH") {
  return value === "HIGH" ? 3 : value === "MEDIUM" ? 2 : 1;
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}
