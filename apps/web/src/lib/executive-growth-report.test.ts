import assert from "node:assert/strict";
import test from "node:test";

import { buildExecutiveGrowthReport, type ExecutiveGrowthInput, type GrowthPrediction } from "./executive-growth-report";

test("builds all board-level report sections from connected growth intelligence", () => {
  const report = buildExecutiveGrowthReport(connectedExperience());

  assert.equal(report.executiveSummary.strategicHighlights.length, 3);
  assert.equal(report.scorecard.length, 6);
  assert.ok(report.growthDrivers.positive.length > 0);
  assert.ok(report.growthDrivers.negative.length > 0);
  assert.equal(report.channels.length, 6);
  assert.equal(report.customerJourney.length, 5);
  assert.equal(report.strategicRisks.length, 4);
  assert.ok(report.opportunities.length >= 3);
  assert.equal(report.recommendations.length, 4);
  assert.equal(report.roadmap.length, 4);
  assert.ok(report.forecast.expectedOutcomes.length > 0);
});

test("uses Instagram decline as an engagement risk and decline driver", () => {
  const report = buildExecutiveGrowthReport(connectedExperience({
    direction: "DOWN",
    percentageChange: -28,
  }));

  const engagement = report.scorecard.find((item) => item.key === "engagement");
  assert.equal(engagement?.band, "At Risk");
  assert.ok(report.growthDrivers.negative.some((item) => item.title === "Engagement trend is declining"));
  assert.ok(report.strategicRisks.some((item) => item.category === "Visibility" && item.severity === "High"));
});

test("keeps disconnected channels visible without fake performance", () => {
  const report = buildExecutiveGrowthReport(connectedExperience());
  const disconnected = report.channels.filter((item) => item.channel !== "Instagram");

  assert.equal(disconnected.length, 5);
  assert.ok(disconnected.every((item) => item.status === "Not connected"));
  assert.ok(disconnected.every((item) => item.contributionScore === 0));
  assert.ok(disconnected.every((item) => item.executiveRead.toLowerCase().includes("not connected")));
});

test("marks forecast confidence as limited when history is insufficient", () => {
  const report = buildExecutiveGrowthReport(connectedExperience({ predictions30Day: [] }));

  assert.equal(report.forecast.confidence, 44);
  assert.ok(report.growthDrivers.negative.some((item) => item.title.includes("Forecast confidence")));
});

test("ranks higher priority recommendations into executive opportunities", () => {
  const report = buildExecutiveGrowthReport(connectedExperience());

  assert.equal(report.opportunities[0].tier, "High impact");
  assert.equal(report.opportunities[0].title, "Expand doctor-led trust content");
  assert.ok(report.executiveSummary.topDecision.includes("Expand doctor-led trust content"));
});

test("builds an evidence-limited report when no data is available", () => {
  const report = buildExecutiveGrowthReport();

  assert.equal(report.workspaceName, "No connected analytics workspace");
  assert.equal(report.channels[0].status, "Not connected");
  assert.equal(report.scorecard.find((item) => item.key === "overall")?.band, "At Risk");
  assert.ok(report.executiveSummary.majorRisks.length > 0);
});

function connectedExperience(overrides: {
  direction?: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  percentageChange?: number | null;
  predictions30Day?: GrowthPrediction[];
} = {}): ExecutiveGrowthInput {
  const direction = overrides.direction ?? "UP";
  const percentageChange = overrides.percentageChange ?? 18;
  const predictions30Day = overrides.predictions30Day ?? [{
    id: "prediction-1",
    workspaceId: "workspace-1",
    metric: "ENGAGEMENT_TRAJECTORY",
    currentValue: 6.4,
    predictedValue: 8.2,
    changePercent: 28,
    confidence: 0.74,
    horizonDays: 30,
    generatedAt: "2026-06-02T00:00:00.000Z",
    rationale: "Recent engagement trend supports a positive 30-day trajectory.",
  }];

  return {
    available: true,
    workspaceName: "VIP Hospital",
    workspaceId: "workspace-1",
    lastMeasuredAt: "2026-06-01",
    period: "1 May 2026 - 1 Jun 2026",
    measuredNarrative: "Engagement improved 18.0% across measured periods.",
    audienceInsights: [],
    operationalCounts: {
      recommendations: 2,
      plans: 2,
      approvals: 1,
      automations: 1,
      members: 4,
    },
    workflows: [],
    recommendations: [
      {
        id: "rec-1",
        title: "Expand doctor-led trust content",
        narrative: "Doctor-led education is the clearest growth lever.",
        evidence: "Top content and market themes align.",
        confidence: 91,
        type: "Reputation growth",
        status: "Persisted",
        sourceStatus: "Approved",
        sourceBasis: "Persisted recommendation",
        sourceCategory: "REPUTATION_CONTEXT",
        priority: "High",
        score: 92,
        expectedOutcome: "Increase trust and appointment readiness.",
        automationReady: false,
        riskLevel: "LOW",
        reasoning: "High response content supports trust-led growth.",
        supportingMetrics: [],
        nextAction: "Approve the trust campaign.",
      },
      {
        id: "rec-2",
        title: "Improve inquiry instrumentation",
        narrative: "Inquiry evidence is incomplete.",
        evidence: "WhatsApp and website are not connected.",
        confidence: 76,
        type: "Conversion readiness",
        status: "Proposed from analytics",
        sourceStatus: "Analytics fallback",
        sourceBasis: "Derived from missing attribution.",
        sourceCategory: "VIP_RECOMMENDATION",
        priority: "Medium",
        score: 74,
        expectedOutcome: "Improve conversion confidence.",
        automationReady: false,
        riskLevel: "MEDIUM",
        reasoning: "Conversion cannot be proven until inquiries are connected.",
        supportingMetrics: [],
        nextAction: "Connect inquiry source data.",
      },
    ],
    analytics: {
      workspaceId: "workspace-1",
      period: { from: "2026-05-01", to: "2026-06-01" },
      avgEngagementRate: 6.4,
      totalPosts: 24,
      totalReach: 64000,
      totalImpressions: 92000,
      rolling7Day: aggregate(5, 14000, 21000, 6.9),
      rolling30Day: aggregate(24, 64000, 92000, 6.4),
      meta: { sampledPosts: 24, truncated: false },
      bestPostingTimes: [{ dayOfWeek: 2, dayLabel: "Tuesday", hourOfDay: 11, postCount: 4, avgEngagementRate: 7.1, avgPerformanceScore: 82 }],
      postingFrequency: [{ date: "2026-05-01", postCount: 2 }, { date: "2026-06-01", postCount: 3 }],
      hashtagPerformance: [{ tag: "entcare", postCount: 4, avgEngagementRate: 7.2 }],
      bestByFormat: [],
      followerGrowth: {
        available: true,
        currentFollowers: 12000,
        change: 300,
        percentageChange: 2.5,
        series: [{ date: "2026-05-01", followers: 11700 }, { date: "2026-06-01", followers: 12000 }],
      },
      contentTypeBreakdown: {
        pillars: [{ pillar: "EDUCATIONAL", postCount: 12, percentage: 50, avgEngagementRate: 6.8, avgPerformanceScore: 78 }],
        formats: [{ contentType: "REEL", postCount: 10, percentage: 41.7, avgEngagementRate: 7.4 }],
      },
      engagementTrend: {
        direction,
        percentageChange,
        anomalies: [],
        series: [
          { date: "2026-05-01", postCount: 2, avgEngagementRate: direction === "DOWN" ? 8.2 : 4.8, movingAverage7Day: 4.8, reach: 4000, impressions: 6000, saves: 30, comments: 18 },
          { date: "2026-05-15", postCount: 4, avgEngagementRate: 6.1, movingAverage7Day: 5.5, reach: 9000, impressions: 12000, saves: 70, comments: 40 },
          { date: "2026-06-01", postCount: 3, avgEngagementRate: direction === "DOWN" ? 5.1 : 7.2, movingAverage7Day: 6.4, reach: 11000, impressions: 15000, saves: 90, comments: 50 },
        ],
      },
      topPosts: [{
        id: "post-1",
        postId: "ig-1",
        platform: "INSTAGRAM",
        url: null,
        caption: "Doctor explains when sinus symptoms need specialist care.",
        mediaUrl: null,
        contentType: "REEL",
        contentPillar: "EDUCATIONAL",
        postedAt: "2026-05-28T00:00:00.000Z",
        engagementRate: 9.1,
        reach: 14000,
        impressions: 21000,
        saves: 180,
        comments: 82,
        performanceScore: 94,
      }],
    },
    intelligence: {
      predictions7Day: [],
      predictions30Day,
      signals: [],
      scores: undefined,
      briefs: [],
      forecastBasis: predictions30Day.length
        ? "Predictions use engagement and content-response history."
        : "Forecasting requires at least three measured engagement observations.",
      marketContext: {
        version: "1.0",
        workspaceId: "workspace-1",
        hospitalName: "VIP Hospital",
        specialtyFocus: ["ENT"],
        region: { country: "IN", state: "Telangana", city: "Hyderabad" },
        regionKey: "in-telangana-hyderabad",
        generatedAt: "2026-06-02T00:00:00.000Z",
        demographics: {
          region: { country: "IN", state: "Telangana", city: "Hyderabad" },
          regionKey: "in-telangana-hyderabad",
          dominantAgeGroups: [],
          primaryLanguages: [],
          audienceSegments: [],
          audienceCharacteristics: [],
          recommendedTone: [],
          recommendedContentStyles: [],
          recommendedPlatforms: [],
          healthcareAwarenessLevel: "MODERATE",
          urbanRuralWeighting: { urban: 80, rural: 20 },
          sources: [],
        },
        trendingTopics: {
          topics: [],
          hashtags: [],
          reelFormats: [],
          viralTopics: [],
          risingTopics: [],
          decliningTopics: [],
          geoAwareHashtags: [],
          localLanguageTopics: [],
          sources: [],
        },
        healthcareSignals: [],
        competitorPatterns: {
          accountsAnalyzed: 3,
          patterns: [],
          topPerformingThemes: [],
          postingFrequencySignals: [],
          opportunityGaps: [],
          guardrail: "Use competitor evidence responsibly.",
          sources: [],
        },
        localContext: {
          region: { country: "IN", state: "Telangana", city: "Hyderabad" },
          items: [],
          seasonalPhase: "Monsoon readiness",
        },
        recommendedThemes: [],
        audienceInsights: [],
        opportunitySignals: [{
          key: "seasonal-ent",
          title: "Seasonal ENT education",
          reason: "Local seasonal demand supports proactive education.",
          score: 82,
          confidence: 78,
          recommendedFormat: "Doctor-led reel",
          relatedTopics: ["sinus", "allergy"],
        }],
        strategyInputs: {
          externalIntelligenceReady: true,
          combineWithInternal: [],
          caution: "Validate clinical claims.",
        },
      },
      competitors: {
        accountsAnalyzed: 3,
        topPerformingThemes: ["Doctor authority"],
        opportunityGaps: ["Underused local-language education"],
        postingFrequencySignals: ["Competitors post weekly"],
        guardrail: "Use public competitor data responsibly.",
        sources: [],
        patterns: [{
          label: "Doctor education",
          patternType: "THEME",
          prevalence: 72,
          performanceScore: 80,
          examplesCount: 8,
          interpretation: "Competitors are winning attention with doctor-led education.",
        }],
      },
    },
  } as unknown as ExecutiveGrowthInput;
}

function aggregate(totalPosts: number, totalReach: number, totalImpressions: number, avgEngagementRate: number) {
  return {
    totalPosts,
    postsWithMetrics: totalPosts,
    avgEngagementRate,
    totalReach,
    totalImpressions,
    totalLikes: 1200,
    totalComments: 180,
    totalSaves: 320,
  };
}
