import assert from "node:assert/strict";
import test from "node:test";

import {
  CompetitorAnalysisReport,
  CompetitorAnalysisReportInput,
  generateCompetitorAnalysisReport,
} from "./competitor-analysis-report";

test("full imported dataset produces all competitor report sections", () => {
  const report = generateCompetitorAnalysisReport(fullInput());

  assert.equal(report.version, "1.0");
  assert.ok(report.executiveSummary.currentMarketPosition);
  assert.equal(report.competitorRankingTable.length, 2);
  assert.equal(report.socialComparison.length, 2);
  assert.equal(report.reputationComparison.length, 2);
  assert.equal(report.contentStrategyComparison.length, 2);
  assert.equal(report.seoComparison.length, 2);
  assert.equal(report.marketGapAnalysis.length, 6);
  assert.ok(report.competitiveOpportunities.quickWins.length);
  assert.ok(report.competitiveOpportunities.mediumTerm.length);
  assert.ok(report.competitiveOpportunities.strategic.length);
  assert.ok(report.competitorMovementAlerts.some((alert) => alert.state === "ready"));
  assert.ok(report.strategicRecommendations.length);
  assert.ok(report.competitivePositionScore.score >= 0 && report.competitivePositionScore.score <= 100);
  assertEveryInsightIsActionable(report);
});

test("missing source imports produce degraded states without fabricated metrics", () => {
  const report = generateCompetitorAnalysisReport({
    workspaceId: "workspace-1",
    hospital: { name: "VIP Hospital" },
    competitors: [{ id: "competitor-1", name: "Peer Hospital" }],
  });

  assert.equal(report.sourceAvailability.Similarweb, "empty");
  assert.equal(report.sourceAvailability.SEMrush, "empty");
  assert.equal(report.sourceAvailability.Ahrefs, "empty");
  assert.equal(report.sourceAvailability["Sprout Social"], "empty");
  assert.equal(report.competitorRankingTable[0].marketVisibility, null);
  assert.equal(report.competitorRankingTable[0].totalScore, 0);
  assert.equal(report.competitorMovementAlerts[0].state, "empty");
  assert.match(report.competitorMovementAlerts[0].insight.evidence[0], /Missing source evidence/);
  assertEveryInsightIsActionable(report);
});

test("ranking identifies the normalized category winner instead of raw single-source totals", () => {
  const report = generateCompetitorAnalysisReport(fullInput());

  assert.equal(report.competitorRankingTable[0].name, "Strong Multi Channel ENT");
  assert.ok(report.competitorRankingTable[0].totalScore > report.competitorRankingTable[1].totalScore);
  assert.equal(report.socialComparison[0].insight.winner, "Strong Multi Channel ENT");
});

test("competitive position score remains bounded", () => {
  const report = generateCompetitorAnalysisReport({
    ...fullInput(),
    hospital: {
      ...fullInput().hospital,
      marketVisibility: 999,
      socialPresence: 999,
      localSearchPresence: 999,
      seoVisibility: 999,
      contentStrength: 999,
      reputation: { rating: 10, reviewVolume: 9999, sentiment: 999 },
    },
  });

  assert.ok(report.competitivePositionScore.score >= 0);
  assert.ok(report.competitivePositionScore.score <= 100);
});

function fullInput(): CompetitorAnalysisReportInput {
  return {
    workspaceId: "workspace-1",
    generatedAt: "2026-06-02T00:00:00.000Z",
    hospital: {
      name: "VIP Hospital",
      domain: "vip.example",
      marketVisibility: 35,
      socialPresence: 40,
      localSearchPresence: 55,
      seoVisibility: 45,
      contentStrength: 50,
      reputation: { rating: 4.5, reviewVolume: 120, sentiment: 72 },
      social: { followers: 9000, reach: 45000, engagementRate: 3.2, postsPerWeek: 4 },
      seo: { keywordVisibility: 45, servicePageVisibility: 50, localSeoStrength: 58 },
      content: { themes: ["sinus care"], frequencyPerWeek: 4, topContentTypes: ["Reels"] },
    },
    competitors: [
      {
        id: "competitor-1",
        name: "Strong Multi Channel ENT",
        domain: "strong.example",
        sourceLabels: ["Google Places"],
        reputation: { rating: 4.7, reviewVolume: 300, sentiment: 78 },
        localSearchPresence: 80,
      },
      {
        id: "competitor-2",
        name: "Single Spike Clinic",
        domain: "spike.example",
        sourceLabels: ["Google Places"],
        marketVisibility: 95,
        reputation: { rating: 4.1, reviewVolume: 90, sentiment: 60 },
      },
    ],
    imports: {
      similarweb: [
        { competitorId: "competitor-1", confidence: 0.82, metrics: { marketVisibility: 75 }, movement: [{ metric: "traffic share", changePercent: 18, trend: "growth" }] },
        { competitorId: "competitor-2", confidence: 0.82, metrics: { marketVisibility: 95 } },
      ],
      semrush: [
        { competitorId: "competitor-1", confidence: 0.78, metrics: { keywordVisibility: 82, servicePageVisibility: 76, localSeoStrength: 80 } },
        { competitorId: "competitor-2", confidence: 0.78, metrics: { keywordVisibility: 30, servicePageVisibility: 24, localSeoStrength: 25 } },
      ],
      ahrefs: [
        { competitorId: "competitor-1", confidence: 0.74, metrics: { contentStrength: 84, themes: ["hearing", "sinus"], frequencyPerWeek: 6, topContentTypes: ["Guides", "Videos"] } },
        { competitorId: "competitor-2", confidence: 0.74, metrics: { contentStrength: 22, themes: ["offers"], frequencyPerWeek: 1, topContentTypes: ["Images"] } },
      ],
      sproutSocial: [
        { competitorId: "competitor-1", confidence: 0.7, metrics: { socialPresence: 88, followers: 18000, reach: 90000, engagementRate: 5.8, postsPerWeek: 7 } },
        { competitorId: "competitor-2", confidence: 0.7, metrics: { socialPresence: 28, followers: 6000, reach: 12000, engagementRate: 1.8, postsPerWeek: 2 } },
      ],
    },
  };
}

function assertEveryInsightIsActionable(report: CompetitorAnalysisReport) {
  const insights = [
    report.executiveSummary.currentMarketPosition,
    ...report.executiveSummary.competitiveThreats,
    ...report.executiveSummary.competitiveOpportunities,
    ...report.competitorRankingTable.map((row) => row.insight),
    ...report.socialComparison.map((row) => row.insight),
    ...report.reputationComparison.map((row) => row.insight),
    ...report.contentStrategyComparison.map((row) => row.insight),
    ...report.seoComparison.map((row) => row.insight),
    ...report.marketGapAnalysis.flatMap((item) => [...item.competitorsDominate, ...item.competitorsIgnore]),
    ...report.competitiveOpportunities.quickWins.map((item) => item.insight),
    ...report.competitiveOpportunities.mediumTerm.map((item) => item.insight),
    ...report.competitiveOpportunities.strategic.map((item) => item.insight),
    ...report.competitorMovementAlerts.map((item) => item.insight),
    ...report.strategicRecommendations,
    report.competitivePositionScore.insight,
  ];

  for (const insight of insights) {
    assert.ok(insight.winner);
    assert.ok(insight.whyTheyAreWinning);
    assert.ok(insight.recommendedAction);
    assert.ok(insight.evidence.length);
    assert.ok(insight.confidence >= 0 && insight.confidence <= 1);
    assert.ok(insight.sourceLabels.length);
  }
}
