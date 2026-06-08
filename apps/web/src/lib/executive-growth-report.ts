export type GrowthBand = "Accelerating" | "Stable" | "At Risk" | "Critical";
export type GrowthTrend = "Improving" | "Stable" | "Declining" | "Insufficient evidence" | "Not connected";
export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type OpportunityTier = "High impact" | "Medium impact" | "Long-term";
export type JourneyStageName = "Discovery" | "Consideration" | "Inquiry" | "Appointment" | "Retention";
export type ChannelName = "Instagram" | "Facebook" | "Google Business Profile" | "Reviews" | "WhatsApp" | "Website";

export type ExecutiveGrowthInput = {
  available: boolean;
  workspaceName: string;
  workspaceId?: string;
  lastMeasuredAt?: string;
  period?: string;
  measuredNarrative?: string;
  analytics?: GrowthAnalytics;
  recommendations: GrowthRecommendation[];
  intelligence?: {
    predictions30Day: GrowthPrediction[];
    forecastBasis: string;
    marketContext?: GrowthMarketContext;
    competitors: GrowthCompetitors;
  };
  operationalCounts: {
    recommendations: number;
    plans: number;
    approvals: number;
    automations: number;
    members: number;
  };
};

export type GrowthAnalytics = {
  avgEngagementRate: number;
  totalPosts: number;
  totalReach: number;
  engagementTrend: {
    direction: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
    percentageChange: number | null;
    series: Array<{ date: string; avgEngagementRate: number; reach: number; postCount: number }>;
  };
  topPosts: Array<{
    caption: string | null;
    engagementRate: number;
    reach: number;
    performanceScore: number;
  }>;
};

export type GrowthRecommendation = {
  title: string;
  score: number;
  expectedOutcome: string;
  reasoning: string;
  sourceCategory: "VIP_RECOMMENDATION" | "SOCIAL_ANALYTICS" | "MARKET_CONTEXT" | "SEARCH_CONTEXT" | "REPUTATION_CONTEXT";
};

export type GrowthPrediction = {
  metric: string;
  horizonDays: number;
  predictedValue: number;
};

export type GrowthMarketContext = {
  opportunitySignals: Array<{
    title: string;
    reason: string;
    recommendedFormat: string;
  }>;
};

export type GrowthCompetitors = {
  accountsAnalyzed: number;
  patterns: Array<{ interpretation: string }>;
  topPerformingThemes: string[];
  opportunityGaps: string[];
};

export type GrowthScore = {
  key: "visibility" | "reputation" | "engagement" | "conversion" | "competitive" | "overall";
  label: string;
  score: number;
  band: GrowthBand;
  confidence: number;
  interpretation: string;
  evidence: string;
};

export type GrowthDriver = {
  title: string;
  impact: "Growth" | "Decline";
  score: number;
  evidence: string;
};

export type ChannelContribution = {
  channel: ChannelName;
  status: "Connected" | "Not connected" | "Insufficient evidence";
  trend: GrowthTrend;
  contributionScore: number;
  confidence: number;
  executiveRead: string;
};

export type CompetitivePosition = {
  standing: string;
  marketShareIndicator: string;
  relativePerformance: string;
  pressureLevel: RiskSeverity;
  advantages: string[];
  gaps: string[];
};

export type JourneyStage = {
  stage: JourneyStageName;
  health: GrowthBand;
  score: number;
  bottleneck: string;
  leadershipFocus: string;
};

export type StrategicRisk = {
  category: "Reputation" | "Competitive" | "Visibility" | "Conversion";
  severity: RiskSeverity;
  title: string;
  implication: string;
};

export type GrowthOpportunity = {
  tier: OpportunityTier;
  title: string;
  rationale: string;
  expectedOutcome: string;
};

export type LeadershipRecommendation = {
  decision: string;
  whyNow: string;
  owner: "CEO" | "Hospital Director" | "Growth Leadership" | "Investor Review";
};

export type RoadmapItem = {
  week: string;
  focus: string;
  leadershipOutcome: string;
  milestone: string;
};

export type GrowthForecast = {
  trajectory: GrowthTrend;
  expectedOutcomes: string[];
  milestones: string[];
  confidence: number;
  assumptions: string[];
};

export type ExecutiveGrowthReport = {
  generatedAt: string;
  workspaceName: string;
  period: string;
  overallStatus: GrowthBand;
  executiveSummary: {
    growthStatus: string;
    strategicHighlights: string[];
    majorRisks: string[];
    topDecision: string;
  };
  scorecard: GrowthScore[];
  growthDrivers: {
    positive: GrowthDriver[];
    negative: GrowthDriver[];
  };
  channels: ChannelContribution[];
  competitivePosition: CompetitivePosition;
  customerJourney: JourneyStage[];
  strategicRisks: StrategicRisk[];
  opportunities: GrowthOpportunity[];
  recommendations: LeadershipRecommendation[];
  roadmap: RoadmapItem[];
  forecast: GrowthForecast;
};

export function buildExecutiveGrowthReport(data?: ExecutiveGrowthInput): ExecutiveGrowthReport {
  const connectedData = data?.available && data.analytics ? data : undefined;
  const available = Boolean(connectedData);
  const analytics = connectedData?.analytics;
  const intelligence = connectedData?.intelligence;
  const competitors = intelligence?.competitors;
  const marketContext = intelligence?.marketContext;
  const recommendations = connectedData?.recommendations ?? [];

  const engagementScore = analytics
    ? clampScore(66 + trendAdjustment(analytics.engagementTrend.direction, analytics.engagementTrend.percentageChange) + volumeAdjustment(analytics.totalPosts, 15))
    : 58;
  const visibilityScore = analytics
    ? clampScore(60 + reachAdjustment(analytics.totalReach) + marketContextAdjustment(marketContext))
    : 55;
  const reputationScore = clampScore(available ? 64 + recommendationCategoryAdjustment(recommendations, "REPUTATION_CONTEXT") : 55);
  const conversionScore = clampScore(connectedData ? 58 + conversionReadinessAdjustment(connectedData) : 54);
  const competitiveScore = clampScore(available ? 58 + competitorAdjustment(competitors) + marketContextAdjustment(marketContext) : 52);
  const overallScore = Math.round((visibilityScore + reputationScore + engagementScore + conversionScore + competitiveScore) / 5);
  const overallStatus = bandFor(overallScore);

  const scorecard: GrowthScore[] = [
    score("visibility", "Visibility score", visibilityScore, available ? 76 : 42, visibilityInterpretation(visibilityScore, analytics?.totalReach), available ? "Instagram reach and market context signals." : "Visibility data sources are not connected."),
    score("reputation", "Reputation score", reputationScore, reviewConfidence(data), reputationInterpretation(reputationScore, recommendations), reviewEvidence(data)),
    score("engagement", "Engagement score", engagementScore, analytics ? 86 : 42, engagementInterpretation(analytics), analytics ? `${analytics.totalPosts} Instagram posts with ${integer(analytics.totalReach)} recorded reach.` : "Engagement analytics are not connected."),
    score("conversion", "Conversion score", conversionScore, available ? 58 : 36, conversionInterpretation(data), "Conversion score reflects workflow and inquiry readiness, not final appointment attribution."),
    score("competitive", "Competitive score", competitiveScore, competitors?.accountsAnalyzed ? 72 : 46, competitiveInterpretation(competitors), competitorEvidence(competitors)),
  ];
  scorecard.push(score("overall", "Overall growth score", overallScore, average(scorecard.map((item) => item.confidence)), overallInterpretation(overallStatus), "Weighted equally across visibility, reputation, engagement, conversion, and competitive position."));

  const positive = buildPositiveDrivers(data, analytics);
  const negative = buildNegativeDrivers(data, analytics, competitors);
  const channels = buildChannels(data);
  const strategicRisks = buildStrategicRisks(data, analytics, competitors, channels);

  return {
    generatedAt: new Date().toISOString(),
    workspaceName: data?.workspaceName ?? "No connected analytics workspace",
    period: data?.period ?? "No measured period",
    overallStatus,
    executiveSummary: {
      growthStatus: growthStatusSentence(overallStatus, overallScore, data),
      strategicHighlights: topThree([
        ...positive.map((item) => item.title),
        marketContext?.opportunitySignals[0]?.title && `Market opportunity: ${marketContext.opportunitySignals[0].title}`,
        competitors?.topPerformingThemes[0] && `Competitive theme to watch: ${competitors.topPerformingThemes[0]}`,
      ]),
      majorRisks: topThree(strategicRisks.map((risk) => risk.title)),
      topDecision: recommendations[0]?.title
        ? `Decide whether to fund and operationalize: ${recommendations[0].title}.`
        : "Decide whether to prioritize growth instrumentation before expanding acquisition activity.",
    },
    scorecard,
    growthDrivers: { positive, negative },
    channels,
    competitivePosition: buildCompetitivePosition(competitors, competitiveScore),
    customerJourney: buildJourney(scorecard, channels, data),
    strategicRisks,
    opportunities: buildOpportunities(data, recommendations, marketContext),
    recommendations: buildLeadershipRecommendations(data, recommendations, strategicRisks),
    roadmap: buildRoadmap(overallStatus, recommendations),
    forecast: buildForecast(data, analytics, overallStatus),
  };
}

function score(key: GrowthScore["key"], label: string, scoreValue: number, confidence: number, interpretation: string, evidence: string): GrowthScore {
  return { key, label, score: clampScore(scoreValue), band: bandFor(scoreValue), confidence: clampScore(confidence), interpretation, evidence };
}

function buildPositiveDrivers(data?: ExecutiveGrowthInput, analytics?: GrowthAnalytics): GrowthDriver[] {
  const drivers: GrowthDriver[] = [];
  if (analytics) {
    drivers.push({
      title: analytics.engagementTrend.direction === "DOWN" ? "Measured reach base is available for recovery planning" : "Measured audience engagement is supporting growth momentum",
      impact: "Growth",
      score: analytics.engagementTrend.direction === "UP" ? 88 : 70,
      evidence: `${integer(analytics.totalReach)} recorded reach across ${integer(analytics.totalPosts)} Instagram posts.`,
    });
    const topPost = analytics.topPosts[0];
    if (topPost) {
      drivers.push({
        title: "High-response clinical content can be extended",
        impact: "Growth",
        score: Math.round(topPost.performanceScore),
        evidence: `${shortText(topPost.caption ?? "Top Instagram post")} delivered ${topPost.engagementRate.toFixed(2)}% engagement.`,
      });
    }
  }
  data?.recommendations.slice(0, 2).forEach((item) => {
    drivers.push({
      title: item.title,
      impact: "Growth",
      score: item.score,
      evidence: item.expectedOutcome,
    });
  });
  return rankedOrFallback(drivers, "Connected growth signals are still forming.", "Growth");
}

function buildNegativeDrivers(
  data?: ExecutiveGrowthInput,
  analytics?: GrowthAnalytics,
  competitors?: GrowthCompetitors,
): GrowthDriver[] {
  const drivers: GrowthDriver[] = [];
  if (analytics?.engagementTrend.direction === "DOWN") {
    drivers.push({
      title: "Engagement trend is declining",
      impact: "Decline",
      score: Math.min(95, 70 + Math.abs(analytics.engagementTrend.percentageChange ?? 0)),
      evidence: `Engagement is down ${Math.abs(analytics.engagementTrend.percentageChange ?? 0).toFixed(1)}% across measured periods.`,
    });
  }
  if (!data?.intelligence?.predictions30Day.length) {
    drivers.push({
      title: "Forecast confidence is limited by short measurement history",
      impact: "Decline",
      score: 66,
      evidence: data?.intelligence?.forecastBasis ?? "Forecasting inputs are not connected.",
    });
  }
  if (!competitors?.accountsAnalyzed) {
    drivers.push({
      title: "Competitive position lacks enough live competitor evidence",
      impact: "Decline",
      score: 64,
      evidence: "Competitor analysis is not connected or has no analyzed accounts.",
    });
  }
  if (!data?.available) {
    drivers.push({
      title: "Growth report is evidence-limited",
      impact: "Decline",
      score: 82,
      evidence: "Connected analytics could not be loaded.",
    });
  }
  return rankedOrFallback(drivers, "No major decline driver is visible in connected data.", "Decline");
}

function buildChannels(data?: ExecutiveGrowthInput): ChannelContribution[] {
  const analytics = data?.available ? data.analytics : undefined;
  const instagramTrend = analytics ? trendFromDirection(analytics.engagementTrend.direction) : "Not connected";
  const instagramScore = analytics ? clampScore(engagementScoreFromAnalytics(analytics)) : 0;
  return [
    {
      channel: "Instagram",
      status: analytics ? "Connected" : "Not connected",
      trend: instagramTrend,
      contributionScore: instagramScore,
      confidence: analytics ? 88 : 20,
      executiveRead: analytics
        ? `Primary measured growth signal: ${integer(analytics.totalReach)} reach, ${analytics.avgEngagementRate.toFixed(2)}% average engagement.`
        : "Instagram analytics are unavailable, so social growth contribution cannot be assessed.",
    },
    disconnected("Facebook", "Facebook performance is not connected; leadership should not infer growth contribution."),
    disconnected("Google Business Profile", "GBP visibility and action data are not connected; local discovery contribution is evidence-limited."),
    disconnected("Reviews", "Review volume, rating, and sentiment are not connected; reputation score remains evidence-limited."),
    disconnected("WhatsApp", "WhatsApp inquiry and response data are not connected; conversion contribution cannot be proven."),
    disconnected("Website", "Website traffic and appointment behavior are not connected; digital conversion attribution is unavailable."),
  ];
}

function buildCompetitivePosition(
  competitors: GrowthCompetitors | undefined,
  competitiveScore: number,
): CompetitivePosition {
  const hasCompetitors = Boolean(competitors?.accountsAnalyzed);
  return {
    standing: hasCompetitors ? `${bandFor(competitiveScore)} relative market position` : "Evidence-limited market position",
    marketShareIndicator: hasCompetitors
      ? `${competitors?.accountsAnalyzed ?? 0} competitor account${competitors?.accountsAnalyzed === 1 ? "" : "s"} analyzed for share-of-voice style signals.`
      : "Market share indicators require competitor, search, and local listing data.",
    relativePerformance: competitors?.patterns[0]?.interpretation ?? "Relative performance cannot be fully assessed until competitor evidence is connected.",
    pressureLevel: competitiveScore >= 75 ? "Low" : competitiveScore >= 60 ? "Medium" : "High",
    advantages: nonEmpty(competitors?.topPerformingThemes, ["Connected VIP analytics can be used to define ownable growth themes."]),
    gaps: nonEmpty(competitors?.opportunityGaps, ["Competitor evidence coverage is incomplete."]),
  };
}

function buildJourney(scorecard: GrowthScore[], channels: ChannelContribution[], data?: ExecutiveGrowthInput): JourneyStage[] {
  const scoreByKey = new Map(scorecard.map((item) => [item.key, item.score]));
  const instagram = channels.find((item) => item.channel === "Instagram");
  return [
    {
      stage: "Discovery",
      health: bandFor(scoreByKey.get("visibility") ?? 50),
      score: scoreByKey.get("visibility") ?? 50,
      bottleneck: instagram?.status === "Connected" ? "Discovery is measurable through social reach, but local search sources remain incomplete." : "Discovery channels are not sufficiently connected.",
      leadershipFocus: "Build one leadership view of social, local search, and website discovery.",
    },
    {
      stage: "Consideration",
      health: bandFor(scoreByKey.get("reputation") ?? 50),
      score: scoreByKey.get("reputation") ?? 50,
      bottleneck: "Review and trust evidence is not yet complete enough for board-level reputation proof.",
      leadershipFocus: "Close reputation evidence gaps before scaling visibility spend.",
    },
    {
      stage: "Inquiry",
      health: bandFor(scoreByKey.get("conversion") ?? 50),
      score: scoreByKey.get("conversion") ?? 50,
      bottleneck: "WhatsApp, website, and inquiry attribution are not yet connected.",
      leadershipFocus: "Instrument inquiry sources and response quality.",
    },
    {
      stage: "Appointment",
      health: bandFor((scoreByKey.get("conversion") ?? 50) - 4),
      score: clampScore((scoreByKey.get("conversion") ?? 50) - 4),
      bottleneck: "Appointment outcomes are not available in the executive data layer.",
      leadershipFocus: "Connect appointment milestones before claiming revenue conversion.",
    },
    {
      stage: "Retention",
      health: bandFor(data?.operationalCounts.approvals ? 62 : 55),
      score: data?.operationalCounts.approvals ? 62 : 55,
      bottleneck: "Retention signal needs review follow-up, patient experience, and repeat visit evidence.",
      leadershipFocus: "Use reputation monitoring as the early retention signal.",
    },
  ];
}

function buildStrategicRisks(
  data: ExecutiveGrowthInput | undefined,
  analytics: GrowthAnalytics | undefined,
  competitors: GrowthCompetitors | undefined,
  channels: ChannelContribution[],
): StrategicRisk[] {
  const risks: StrategicRisk[] = [
    {
      category: "Reputation",
      severity: channels.find((item) => item.channel === "Reviews")?.status === "Connected" ? "Medium" : "High",
      title: "Reputation risk is evidence-limited",
      implication: "Leadership cannot separate service-quality issues from perception risk until review intelligence is connected.",
    },
    {
      category: "Competitive",
      severity: competitors?.accountsAnalyzed ? "Medium" : "High",
      title: competitors?.accountsAnalyzed ? "Competitors are shaping patient attention in visible themes" : "Competitive risk lacks sufficient live market evidence",
      implication: competitors?.opportunityGaps[0] ?? "Market standing may be under- or over-estimated without competitor coverage.",
    },
    {
      category: "Visibility",
      severity: analytics?.engagementTrend.direction === "DOWN" ? "High" : "Medium",
      title: analytics?.engagementTrend.direction === "DOWN" ? "Visibility momentum is weakening" : "Visibility depends on too few connected channels",
      implication: "Growth leadership should avoid scaling spend until visibility sources are reconciled.",
    },
    {
      category: "Conversion",
      severity: data?.operationalCounts.approvals ? "Medium" : "High",
      title: "Conversion attribution is not yet board-grade",
      implication: "Appointment impact cannot be claimed until inquiry and appointment systems are connected.",
    },
  ];
  return risks.sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity));
}

function buildOpportunities(
  data: ExecutiveGrowthInput | undefined,
  recommendations: GrowthRecommendation[],
  marketContext: GrowthMarketContext | undefined,
): GrowthOpportunity[] {
  const high = recommendations.slice(0, 2).map<GrowthOpportunity>((item) => ({
    tier: "High impact",
    title: item.title,
    rationale: item.reasoning,
    expectedOutcome: item.expectedOutcome,
  }));
  const medium = marketContext?.opportunitySignals.slice(0, 2).map<GrowthOpportunity>((item) => ({
    tier: "Medium impact",
    title: item.title,
    rationale: item.reason,
    expectedOutcome: `Validate ${item.recommendedFormat} as a growth lever.`,
  })) ?? [];
  const longTerm: GrowthOpportunity[] = [
    {
      tier: "Long-term",
      title: "Build a single executive growth data layer",
      rationale: data?.available ? "Connected Instagram data proves the model; remaining channels need the same standard." : "The current report is limited by missing connected data.",
      expectedOutcome: "Board-grade visibility across discovery, reputation, inquiry, appointment, and retention.",
    },
  ];
  return nonEmpty([...high, ...medium, ...longTerm], [{
    tier: "High impact",
    title: "Connect growth instrumentation",
    rationale: "Leadership needs reliable source coverage before making acquisition decisions.",
    expectedOutcome: "A defensible baseline for future growth decisions.",
  }]);
}

function buildLeadershipRecommendations(
  data: ExecutiveGrowthInput | undefined,
  recommendations: GrowthRecommendation[],
  risks: StrategicRisk[],
): LeadershipRecommendation[] {
  const primary = recommendations[0];
  return [
    {
      decision: primary ? `Approve or defer the growth initiative: ${primary.title}.` : "Approve growth data instrumentation as the next executive priority.",
      whyNow: primary?.expectedOutcome ?? "Current evidence coverage limits board-grade growth decisions.",
      owner: "CEO",
    },
    {
      decision: "Mandate channel-level accountability for disconnected sources.",
      whyNow: "Facebook, GBP, Reviews, WhatsApp, and Website should remain visible as gaps until connected.",
      owner: "Growth Leadership",
    },
    {
      decision: `Escalate ${risks[0]?.category.toLowerCase() ?? "growth"} risk into the next leadership review.`,
      whyNow: risks[0]?.implication ?? "The highest-risk growth dependency needs a named owner.",
      owner: "Hospital Director",
    },
    {
      decision: data?.available ? "Review whether connected growth momentum supports incremental investment." : "Defer investment claims until evidence is connected.",
      whyNow: data?.available ? "VIP has measured signals, but not complete acquisition attribution." : "The report cannot defend ROI without source coverage.",
      owner: "Investor Review",
    },
  ];
}

function buildRoadmap(status: GrowthBand, recommendations: GrowthRecommendation[]): RoadmapItem[] {
  const primary = recommendations[0]?.title ?? "growth instrumentation";
  return [
    { week: "Days 1-7", focus: "Leadership alignment", leadershipOutcome: `Confirm the executive decision on ${primary}.`, milestone: "Decision owner and growth target confirmed." },
    { week: "Days 8-14", focus: "Visibility and reputation baseline", leadershipOutcome: "Close the most important data gaps across local discovery and trust.", milestone: "GBP, Reviews, Website, and WhatsApp connection plan approved." },
    { week: "Days 15-21", focus: "Conversion readiness", leadershipOutcome: "Define inquiry-to-appointment measurement before claiming business impact.", milestone: "Inquiry and appointment milestones mapped." },
    { week: "Days 22-30", focus: "Executive review cadence", leadershipOutcome: `Move from ${status.toLowerCase()} status to a measurable next-cycle growth target.`, milestone: "Next monthly board report baseline locked." },
  ];
}

function buildForecast(
  data: ExecutiveGrowthInput | undefined,
  analytics: GrowthAnalytics | undefined,
  status: GrowthBand,
): GrowthForecast {
  const predictions = data?.intelligence?.predictions30Day ?? [];
  const trajectory = analytics ? trendFromDirection(analytics.engagementTrend.direction) : "Insufficient evidence";
  return {
    trajectory,
    expectedOutcomes: predictions.length
      ? predictions.slice(0, 3).map((item) => `${label(item.metric)} expected at ${Math.round(item.predictedValue)} in ${item.horizonDays} days.`)
      : [`Growth is expected to remain ${status.toLowerCase()} until more channel and conversion evidence is connected.`],
    milestones: [
      "7-day signal review",
      "30-day growth score refresh",
      "Channel coverage decision",
      "Inquiry and appointment attribution checkpoint",
    ],
    confidence: predictions.length ? 72 : 44,
    assumptions: [
      data?.intelligence?.forecastBasis ?? "Forecasting requires connected measurement history.",
      "Disconnected channels are treated as evidence gaps, not as negative performance.",
      "Conversion readiness is not equivalent to appointment or revenue conversion.",
    ],
  };
}

function trendAdjustment(direction: string, change: number | null) {
  const magnitude = Math.min(18, Math.abs(change ?? 0) / 2);
  if (direction === "UP") return 10 + magnitude;
  if (direction === "DOWN") return -10 - magnitude;
  if (direction === "STABLE") return 2;
  return -4;
}

function engagementScoreFromAnalytics(analytics: GrowthAnalytics) {
  return 64 + trendAdjustment(analytics.engagementTrend.direction, analytics.engagementTrend.percentageChange) + Math.min(12, analytics.avgEngagementRate);
}

function volumeAdjustment(value: number, target: number) {
  return Math.min(8, Math.floor(value / target) * 2);
}

function reachAdjustment(reach: number) {
  if (reach >= 100000) return 16;
  if (reach >= 50000) return 12;
  if (reach >= 10000) return 8;
  if (reach > 0) return 4;
  return -4;
}

function marketContextAdjustment(context: GrowthMarketContext | undefined) {
  return context?.opportunitySignals.length ? 6 : 0;
}

function competitorAdjustment(competitors: GrowthCompetitors | undefined) {
  if (!competitors?.accountsAnalyzed) return -6;
  return Math.min(14, competitors.accountsAnalyzed * 3 + competitors.opportunityGaps.length);
}

function recommendationCategoryAdjustment(recommendations: GrowthRecommendation[], category: string) {
  return recommendations.some((item) => item.sourceCategory === category) ? 8 : 0;
}

function conversionReadinessAdjustment(data: ExecutiveGrowthInput) {
  return Math.min(16, data.operationalCounts.approvals * 2 + data.operationalCounts.plans * 3 + data.operationalCounts.automations * 2);
}

function reviewConfidence(data?: ExecutiveGrowthInput) {
  return data?.recommendations.some((item) => item.sourceCategory === "REPUTATION_CONTEXT") ? 68 : 38;
}

function reviewEvidence(data?: ExecutiveGrowthInput) {
  return data?.recommendations.some((item) => item.sourceCategory === "REPUTATION_CONTEXT")
    ? "Reputation recommendations are available, but review platform detail is not fully connected."
    : "Reviews are not connected; reputation score is evidence-limited.";
}

function visibilityInterpretation(scoreValue: number, reach?: number) {
  if (reach) return `Visibility is ${bandFor(scoreValue).toLowerCase()} with ${integer(reach)} measured social reach.`;
  return "Visibility cannot be fully assessed until discovery sources are connected.";
}

function reputationInterpretation(scoreValue: number, recommendations: GrowthRecommendation[]) {
  if (recommendations.some((item) => item.sourceCategory === "REPUTATION_CONTEXT")) return `Reputation is ${bandFor(scoreValue).toLowerCase()} based on available trust intelligence.`;
  return "Reputation requires connected reviews before leadership can treat this as a board-grade score.";
}

function engagementInterpretation(analytics?: GrowthAnalytics) {
  if (!analytics) return "Engagement is unavailable until channel analytics are connected.";
  const trend = trendFromDirection(analytics.engagementTrend.direction).toLowerCase();
  return `Engagement is ${trend} at ${analytics.avgEngagementRate.toFixed(2)}% average measured response.`;
}

function conversionInterpretation(data?: ExecutiveGrowthInput) {
  if (!data?.available) return "Conversion readiness cannot be assessed without connected growth data.";
  return data.operationalCounts.approvals || data.operationalCounts.plans
    ? "Conversion readiness has operational evidence, but appointment attribution is not connected."
    : "Conversion is evidence-limited because inquiry and appointment systems are not connected.";
}

function competitiveInterpretation(competitors?: GrowthCompetitors) {
  if (competitors?.accountsAnalyzed) return `Competitive read is based on ${competitors.accountsAnalyzed} analyzed account${competitors.accountsAnalyzed === 1 ? "" : "s"}.`;
  return "Competitive position is limited by missing live competitor evidence.";
}

function competitorEvidence(competitors?: GrowthCompetitors) {
  if (competitors?.patterns[0]) return competitors.patterns[0].interpretation;
  return "Competitor source coverage is incomplete.";
}

function overallInterpretation(status: GrowthBand) {
  if (status === "Accelerating") return "Growth signals support leadership confidence, subject to conversion attribution.";
  if (status === "Stable") return "Growth is directionally healthy, but leadership should close data and conversion gaps.";
  if (status === "At Risk") return "Growth requires executive intervention before scaling investment.";
  return "Growth evidence is too weak or negative for investment claims.";
}

function growthStatusSentence(status: GrowthBand, overallScore: number, data?: ExecutiveGrowthInput) {
  const source = data?.available ? `based on ${data.workspaceName} measured intelligence` : "because connected analytics are unavailable";
  return `VIP growth status is ${status} at ${overallScore}/100 ${source}.`;
}

function disconnected(channel: ChannelName, executiveRead: string): ChannelContribution {
  return { channel, status: "Not connected", trend: "Not connected", contributionScore: 0, confidence: 20, executiveRead };
}

function trendFromDirection(direction: string): GrowthTrend {
  if (direction === "UP") return "Improving";
  if (direction === "DOWN") return "Declining";
  if (direction === "STABLE") return "Stable";
  return "Insufficient evidence";
}

function bandFor(scoreValue: number): GrowthBand {
  const value = clampScore(scoreValue);
  if (value >= 80) return "Accelerating";
  if (value >= 60) return "Stable";
  if (value >= 40) return "At Risk";
  return "Critical";
}

function severityWeight(severity: RiskSeverity) {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[severity];
}

function rankedOrFallback(drivers: GrowthDriver[], fallback: string, impact: GrowthDriver["impact"]) {
  const ranked = drivers.sort((left, right) => right.score - left.score).slice(0, 4);
  return ranked.length ? ranked : [{ title: fallback, impact, score: 50, evidence: "No additional evidence available." }];
}

function topThree(values: Array<string | undefined | false>) {
  const filtered = values.filter((value): value is string => Boolean(value));
  return filtered.length ? filtered.slice(0, 3) : ["Connect growth data sources to establish board-grade evidence."];
}

function nonEmpty<T>(values: T[] | undefined, fallback: T[]): T[] {
  return values?.length ? values : fallback;
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character: string) => character.toUpperCase());
}

function shortText(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 72 ? `${cleaned.slice(0, 70)}...` : cleaned;
}
