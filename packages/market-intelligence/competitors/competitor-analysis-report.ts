import { clamp, rounded } from "../utils";

export type ReportState = "ready" | "degraded" | "empty";
export type OpportunityHorizon = "quickWin" | "mediumTerm" | "strategic";
export type CompetitorReportSource = "VIP" | "Google Places" | "GBP" | "Similarweb" | "SEMrush" | "Ahrefs" | "Sprout Social";

export interface CompetitorReportInsight {
  winner: string;
  whyTheyAreWinning: string;
  recommendedAction: string;
  evidence: string[];
  confidence: number;
  sourceLabels: CompetitorReportSource[];
}

export interface HospitalCompetitorBaseline {
  name: string;
  domain?: string;
  location?: string;
  marketVisibility?: number;
  socialPresence?: number;
  reputation?: {
    rating?: number;
    reviewVolume?: number;
    sentiment?: number;
  };
  localSearchPresence?: number;
  seoVisibility?: number;
  contentStrength?: number;
  social?: {
    followers?: number;
    reach?: number;
    engagementRate?: number;
    postsPerWeek?: number;
  };
  seo?: {
    keywordVisibility?: number;
    servicePageVisibility?: number;
    localSeoStrength?: number;
  };
  content?: {
    themes?: string[];
    frequencyPerWeek?: number;
    topContentTypes?: string[];
  };
}

export interface CompetitorReportCompetitor extends HospitalCompetitorBaseline {
  id: string;
  sourceLabels?: CompetitorReportSource[];
  movement?: {
    metric: string;
    changePercent: number;
    trend: "growth" | "decline" | "emerging";
    observedAt?: string;
  }[];
}

export interface CompetitorReportSourceImports {
  similarweb?: CompetitorSourceImport[];
  semrush?: CompetitorSourceImport[];
  ahrefs?: CompetitorSourceImport[];
  sproutSocial?: CompetitorSourceImport[];
}

export interface CompetitorSourceImport {
  competitorId?: string;
  name?: string;
  domain?: string;
  confidence?: number;
  metrics?: Record<string, unknown>;
  movement?: CompetitorReportCompetitor["movement"];
}

export interface CompetitorAnalysisReportInput {
  workspaceId: string;
  generatedAt?: string;
  hospital: HospitalCompetitorBaseline;
  competitors: CompetitorReportCompetitor[];
  imports?: CompetitorReportSourceImports;
}

export interface CompetitorRankingRow {
  competitorId: string;
  name: string;
  marketVisibility: number | null;
  socialPresence: number | null;
  reputation: number | null;
  localSearchPresence: number | null;
  seoVisibility: number | null;
  contentStrength: number | null;
  totalScore: number;
  rank: number;
  state: ReportState;
  insight: CompetitorReportInsight;
}

export interface CompetitorComparisonRow {
  competitorId: string;
  name: string;
  state: ReportState;
  metrics: Record<string, number | string | null | string[]>;
  insight: CompetitorReportInsight;
}

export interface MarketGapItem {
  area: string;
  state: ReportState;
  competitorsDominate: CompetitorReportInsight[];
  competitorsIgnore: CompetitorReportInsight[];
}

export interface CompetitiveOpportunity {
  horizon: OpportunityHorizon;
  title: string;
  priority: "Critical" | "High" | "Medium";
  insight: CompetitorReportInsight;
}

export interface CompetitorMovementAlert {
  state: ReportState;
  title: string;
  insight: CompetitorReportInsight;
}

export interface CompetitivePositionScore {
  score: number;
  state: ReportState;
  breakdown: {
    marketVisibility: number;
    socialPresence: number;
    reputation: number;
    localSearchPresence: number;
    seoVisibility: number;
    contentStrength: number;
  };
  insight: CompetitorReportInsight;
}

export interface CompetitorAnalysisReport {
  version: "1.0";
  workspaceId: string;
  generatedAt: string;
  sourceAvailability: Record<CompetitorReportSource, ReportState>;
  executiveSummary: {
    currentMarketPosition: CompetitorReportInsight;
    competitiveThreats: CompetitorReportInsight[];
    competitiveOpportunities: CompetitorReportInsight[];
  };
  competitorRankingTable: CompetitorRankingRow[];
  socialComparison: CompetitorComparisonRow[];
  reputationComparison: CompetitorComparisonRow[];
  contentStrategyComparison: CompetitorComparisonRow[];
  seoComparison: CompetitorComparisonRow[];
  marketGapAnalysis: MarketGapItem[];
  competitiveOpportunities: {
    quickWins: CompetitiveOpportunity[];
    mediumTerm: CompetitiveOpportunity[];
    strategic: CompetitiveOpportunity[];
  };
  competitorMovementAlerts: CompetitorMovementAlert[];
  strategicRecommendations: CompetitorReportInsight[];
  competitivePositionScore: CompetitivePositionScore;
}

type MetricKey =
  | "marketVisibility"
  | "socialPresence"
  | "reputation"
  | "localSearchPresence"
  | "seoVisibility"
  | "contentStrength";

type NormalizedCompetitor = CompetitorReportCompetitor & {
  confidence: number;
  sourceLabels: CompetitorReportSource[];
  scores: Record<MetricKey, number | null>;
};

type DraftCompetitor = CompetitorReportCompetitor & { confidence?: number };

const metricKeys: MetricKey[] = [
  "marketVisibility",
  "socialPresence",
  "reputation",
  "localSearchPresence",
  "seoVisibility",
  "contentStrength",
];

const weights: Record<MetricKey, number> = {
  marketVisibility: 0.2,
  socialPresence: 0.16,
  reputation: 0.18,
  localSearchPresence: 0.18,
  seoVisibility: 0.16,
  contentStrength: 0.12,
};

const sourceByImport = {
  similarweb: "Similarweb",
  semrush: "SEMrush",
  ahrefs: "Ahrefs",
  sproutSocial: "Sprout Social",
} as const satisfies Record<keyof CompetitorReportSourceImports, CompetitorReportSource>;

export function generateCompetitorAnalysisReport(input: CompetitorAnalysisReportInput): CompetitorAnalysisReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const competitors = normalizeCompetitors(input);
  const hospitalScores = hospitalScore(input.hospital);
  const ranking = buildRanking(input.hospital.name, competitors);
  const sourceAvailability = buildSourceAvailability(input, competitors);
  const topCompetitor = ranking[0];
  const threatInsights = ranking.slice(0, 3).map((row) => row.insight);
  const opportunityInsights = opportunityGapInsights(input.hospital.name, competitors, hospitalScores).slice(0, 4);

  return {
    version: "1.0",
    workspaceId: input.workspaceId,
    generatedAt,
    sourceAvailability,
    executiveSummary: {
      currentMarketPosition: currentPositionInsight(input.hospital.name, topCompetitor, hospitalScores),
      competitiveThreats: threatInsights.length ? threatInsights : [emptyInsight(input.hospital.name, "Add competitors to identify market threats.")],
      competitiveOpportunities: opportunityInsights.length ? opportunityInsights : [emptyInsight(input.hospital.name, "Import competitor evidence to reveal market opportunities.")],
    },
    competitorRankingTable: ranking,
    socialComparison: buildSocialComparison(input.hospital, competitors),
    reputationComparison: buildReputationComparison(input.hospital, competitors),
    contentStrategyComparison: buildContentComparison(input.hospital, competitors),
    seoComparison: buildSeoComparison(input.hospital, competitors),
    marketGapAnalysis: buildMarketGaps(input.hospital.name, competitors, hospitalScores),
    competitiveOpportunities: buildOpportunities(input.hospital.name, competitors, hospitalScores),
    competitorMovementAlerts: buildMovementAlerts(input.hospital.name, competitors),
    strategicRecommendations: buildStrategicRecommendations(input.hospital.name, competitors, hospitalScores),
    competitivePositionScore: buildPositionScore(input.hospital.name, competitors, hospitalScores),
  };
}

function normalizeCompetitors(input: CompetitorAnalysisReportInput): NormalizedCompetitor[] {
  const byKey = new Map<string, DraftCompetitor>();

  for (const competitor of input.competitors) {
    byKey.set(identityKey(competitor), { ...competitor });
  }

  for (const [importKey, records] of Object.entries(input.imports ?? {}) as Array<[keyof CompetitorReportSourceImports, CompetitorSourceImport[] | undefined]>) {
    const source = sourceByImport[importKey];
    for (const record of records ?? []) {
      const key = identityKey({
        id: record.competitorId ?? record.domain ?? record.name ?? "unknown",
        name: record.name ?? record.domain ?? record.competitorId ?? "Unknown competitor",
        domain: record.domain,
      });
      const existing: DraftCompetitor = byKey.get(key) ?? {
        id: record.competitorId ?? key,
        name: record.name ?? record.domain ?? "Unknown competitor",
        domain: record.domain,
      };
      applyImportMetrics(existing, record, source);
      existing.sourceLabels = uniqueSources([...(existing.sourceLabels ?? []), source]);
      existing.movement = [...(existing.movement ?? []), ...(record.movement ?? [])];
      existing.confidence = Math.max(existing.confidence ?? 0, normalizedConfidence(record.confidence));
      byKey.set(key, existing);
    }
  }

  return [...byKey.values()].map((competitor) => {
    const scores = competitorScore(competitor);
    return {
      ...competitor,
      sourceLabels: uniqueSources(competitor.sourceLabels?.length ? competitor.sourceLabels : ["VIP"]),
      confidence: competitor.confidence ?? sourceConfidence(competitor.sourceLabels),
      scores,
    };
  });
}

function applyImportMetrics(target: CompetitorReportCompetitor, record: CompetitorSourceImport, source: CompetitorReportSource) {
  const metrics = record.metrics ?? {};
  const number = (keys: string[]) => firstNumber(metrics, keys);
  if (source === "Similarweb") {
    target.marketVisibility = coalesce(target.marketVisibility, number(["marketVisibility", "visibilityScore", "trafficShare", "trafficScore", "visits"]));
  }
  if (source === "SEMrush") {
    target.seoVisibility = coalesce(target.seoVisibility, number(["seoVisibility", "keywordVisibility", "organicVisibility", "visibilityScore"]));
    target.localSearchPresence = coalesce(target.localSearchPresence, number(["localSearchPresence", "localSeoStrength", "mapPackVisibility"]));
    target.seo = {
      ...target.seo,
      keywordVisibility: coalesce(target.seo?.keywordVisibility, number(["keywordVisibility", "organicKeywords"])),
      servicePageVisibility: coalesce(target.seo?.servicePageVisibility, number(["servicePageVisibility", "servicePages"])),
      localSeoStrength: coalesce(target.seo?.localSeoStrength, number(["localSeoStrength", "localSearchPresence"])),
    };
  }
  if (source === "Ahrefs") {
    target.contentStrength = coalesce(target.contentStrength, number(["contentStrength", "contentGapScore", "topPages", "contentScore"]));
    target.seoVisibility = coalesce(target.seoVisibility, number(["seoVisibility", "domainRating", "organicTraffic"]));
    target.content = {
      ...target.content,
      themes: coalesceArray(target.content?.themes, firstStringArray(metrics, ["themes", "contentThemes", "topThemes"])),
      frequencyPerWeek: coalesce(target.content?.frequencyPerWeek, number(["frequencyPerWeek", "contentFrequency"])),
      topContentTypes: coalesceArray(target.content?.topContentTypes, firstStringArray(metrics, ["topContentTypes", "contentTypes"])),
    };
  }
  if (source === "Sprout Social") {
    target.socialPresence = coalesce(target.socialPresence, number(["socialPresence", "socialScore", "shareOfVoice"]));
    target.social = {
      ...target.social,
      followers: coalesce(target.social?.followers, number(["followers", "followerCount"])),
      reach: coalesce(target.social?.reach, number(["reach", "totalReach"])),
      engagementRate: coalesce(target.social?.engagementRate, number(["engagementRate", "avgEngagementRate"])),
      postsPerWeek: coalesce(target.social?.postsPerWeek, number(["postsPerWeek", "postingFrequencyPerWeek"])),
    };
  }
}

function buildRanking(hospitalName: string, competitors: NormalizedCompetitor[]): CompetitorRankingRow[] {
  return competitors
    .map((competitor) => {
      const totalScore = weightedTotal(competitor.scores);
      return {
        competitorId: competitor.id,
        name: competitor.name,
        marketVisibility: competitor.scores.marketVisibility,
        socialPresence: competitor.scores.socialPresence,
        reputation: competitor.scores.reputation,
        localSearchPresence: competitor.scores.localSearchPresence,
        seoVisibility: competitor.scores.seoVisibility,
        contentStrength: competitor.scores.contentStrength,
        totalScore,
        rank: 0,
        state: availableMetricCount(competitor.scores) ? "ready" as const : "empty" as const,
        insight: insight(
          competitor.name,
          `${competitor.name} leads with a ${totalScore}/100 normalized competitive score across ${availableMetricCount(competitor.scores)} measured categories.`,
          `Prioritize the largest gaps against ${competitor.name} before lower-scoring competitors.`,
          evidenceForScores(competitor),
          competitor.confidence,
          competitor.sourceLabels,
        ),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      insight: {
        ...row.insight,
        recommendedAction: index === 0
          ? `Treat ${row.name} as the primary benchmark threat for ${hospitalName}.`
          : row.insight.recommendedAction,
      },
    }));
}

function buildSocialComparison(hospital: HospitalCompetitorBaseline, competitors: NormalizedCompetitor[]): CompetitorComparisonRow[] {
  const own = hospital.social ?? {};
  return competitors.map((competitor) => {
    const peer = competitor.social ?? {};
    const winner = compareNumbers(peer.engagementRate, own.engagementRate) >= 0 ? competitor.name : hospital.name;
    return {
      competitorId: competitor.id,
      name: competitor.name,
      state: hasAnyNumber([peer.followers, peer.reach, peer.engagementRate, peer.postsPerWeek]) ? "ready" : "empty",
      metrics: {
        followers: peer.followers ?? null,
        reach: peer.reach ?? null,
        engagement: peer.engagementRate ?? null,
        postingActivity: peer.postsPerWeek ?? null,
      },
      insight: insight(
        winner,
        `${winner} is winning the social comparison because it has the stronger available engagement or activity signal.`,
        winner === competitor.name
          ? "Close the social gap with repeatable doctor-led formats, measured cadence, and competitor profile refreshes."
          : "Protect the social lead by repurposing top-performing posts into competitor gap topics.",
        socialEvidence(competitor),
        competitor.confidence,
        competitor.sourceLabels.includes("Sprout Social") ? competitor.sourceLabels : uniqueSources([...competitor.sourceLabels, "Sprout Social"]),
      ),
    };
  });
}

function buildReputationComparison(hospital: HospitalCompetitorBaseline, competitors: NormalizedCompetitor[]): CompetitorComparisonRow[] {
  const own = hospital.reputation ?? {};
  return competitors.map((competitor) => {
    const peer = competitor.reputation ?? {};
    const peerScore = reputationScore(peer);
    const ownScore = reputationScore(own);
    const winner = compareNumbers(peerScore, ownScore) >= 0 ? competitor.name : hospital.name;
    return {
      competitorId: competitor.id,
      name: competitor.name,
      state: hasAnyNumber([peer.rating, peer.reviewVolume, peer.sentiment]) ? "ready" : "empty",
      metrics: {
        rating: peer.rating ?? null,
        reviewVolume: peer.reviewVolume ?? null,
        sentiment: peer.sentiment ?? null,
      },
      insight: insight(
        winner,
        `${winner} is winning reputation because its visible rating, review volume, or sentiment score is stronger in the available evidence.`,
        winner === competitor.name
          ? "Launch ethical review acquisition, improve reply coverage, and track sentiment themes by service line."
          : "Maintain review velocity and use positive themes in compliant, consent-safe content planning.",
        reputationEvidence(competitor),
        competitor.confidence,
        uniqueSources([...competitor.sourceLabels, "Google Places", "GBP"]),
      ),
    };
  });
}

function buildContentComparison(hospital: HospitalCompetitorBaseline, competitors: NormalizedCompetitor[]): CompetitorComparisonRow[] {
  return competitors.map((competitor) => {
    const peer = competitor.content ?? {};
    const own = hospital.content ?? {};
    const peerScore = competitor.scores.contentStrength ?? scoreFromValue(peer.frequencyPerWeek);
    const ownScore = scoreFromValue(hospital.contentStrength ?? own.frequencyPerWeek);
    const winner = compareNumbers(peerScore, ownScore) >= 0 ? competitor.name : hospital.name;
    return {
      competitorId: competitor.id,
      name: competitor.name,
      state: peerScore !== null || Boolean(peer.themes?.length) || Boolean(peer.topContentTypes?.length) ? "ready" : "empty",
      metrics: {
        contentThemes: peer.themes ?? [],
        contentFrequency: peer.frequencyPerWeek ?? null,
        topPerformingContentTypes: peer.topContentTypes ?? [],
      },
      insight: insight(
        winner,
        `${winner} is winning content strategy because its themes, publishing frequency, or top content type evidence is stronger.`,
        winner === competitor.name
          ? "Build doctor-reviewed service explainers and FAQs around competitor-owned themes without copying creative or claims."
          : "Extend owned top themes into search pages, GBP posts, and short-form social assets.",
        contentEvidence(competitor),
        competitor.confidence,
        uniqueSources([...competitor.sourceLabels, "Ahrefs"]),
      ),
    };
  });
}

function buildSeoComparison(hospital: HospitalCompetitorBaseline, competitors: NormalizedCompetitor[]): CompetitorComparisonRow[] {
  return competitors.map((competitor) => {
    const peer = competitor.seo ?? {};
    const own = hospital.seo ?? {};
    const peerScore = averageNumbers([peer.keywordVisibility, peer.servicePageVisibility, peer.localSeoStrength, competitor.scores.seoVisibility, competitor.scores.localSearchPresence]);
    const ownScore = averageNumbers([own.keywordVisibility, own.servicePageVisibility, own.localSeoStrength, hospital.seoVisibility, hospital.localSearchPresence]);
    const winner = compareNumbers(peerScore, ownScore) >= 0 ? competitor.name : hospital.name;
    return {
      competitorId: competitor.id,
      name: competitor.name,
      state: hasAnyNumber([peer.keywordVisibility, peer.servicePageVisibility, peer.localSeoStrength, competitor.scores.seoVisibility]) ? "ready" : "empty",
      metrics: {
        keywordVisibility: peer.keywordVisibility ?? null,
        servicePageVisibility: peer.servicePageVisibility ?? null,
        localSeoStrength: peer.localSeoStrength ?? null,
      },
      insight: insight(
        winner,
        `${winner} is winning SEO because its keyword, service page, or local SEO signal is stronger in the imported evidence.`,
        winner === competitor.name
          ? "Prioritize service-line pages, FAQ depth, internal links, and local-intent terms where competitors outrank VIP."
          : "Defend the SEO lead with refreshes, schema-ready FAQs, and link-worthy doctor education.",
        seoEvidence(competitor),
        competitor.confidence,
        uniqueSources([...competitor.sourceLabels, "SEMrush", "Ahrefs"]),
      ),
    };
  });
}

function buildMarketGaps(hospitalName: string, competitors: NormalizedCompetitor[], hospitalScores: Record<MetricKey, number | null>): MarketGapItem[] {
  return metricKeys.map((key) => {
    const leaders = competitors
      .filter((competitor) => compareNumbers(competitor.scores[key], hospitalScores[key]) > 0)
      .sort((a, b) => compareNumbers(b.scores[key], a.scores[key]))
      .slice(0, 2);
    const ignored = competitors
      .filter((competitor) => compareNumbers(competitor.scores[key], hospitalScores[key]) < 0)
      .sort((a, b) => compareNumbers(a.scores[key], b.scores[key]))
      .slice(0, 2);

    return {
      area: labelForMetric(key),
      state: leaders.length || ignored.length ? "ready" : competitors.length ? "degraded" : "empty",
      competitorsDominate: leaders.length ? leaders.map((competitor) => gapInsight(hospitalName, competitor, key, "dominates")) : [emptyInsight(hospitalName, `No competitor dominance detected for ${labelForMetric(key)}.`)],
      competitorsIgnore: ignored.length ? ignored.map((competitor) => gapInsight(hospitalName, competitor, key, "ignores")) : [emptyInsight(hospitalName, `No competitor neglect detected for ${labelForMetric(key)}.`)],
    };
  });
}

function buildOpportunities(hospitalName: string, competitors: NormalizedCompetitor[], hospitalScores: Record<MetricKey, number | null>) {
  const gaps = opportunityGapInsights(hospitalName, competitors, hospitalScores);
  const quickWins = gaps.slice(0, 3).map((item) => opportunity("quickWin", item));
  const mediumTerm = gaps.slice(3, 6).map((item) => opportunity("mediumTerm", item));
  const strategic = gaps.slice(6, 9).map((item) => opportunity("strategic", item));

  return {
    quickWins: quickWins.length ? quickWins : [opportunity("quickWin", emptyInsight(hospitalName, "Import competitor evidence to identify quick wins."))],
    mediumTerm: mediumTerm.length ? mediumTerm : [opportunity("mediumTerm", emptyInsight(hospitalName, "Add SEMrush/Ahrefs/Sprout inputs for medium-term opportunities."))],
    strategic: strategic.length ? strategic : [opportunity("strategic", emptyInsight(hospitalName, "Connect repeatable import cadence before strategic competitor bets."))],
  };
}

function buildMovementAlerts(hospitalName: string, competitors: NormalizedCompetitor[]): CompetitorMovementAlert[] {
  const alerts = competitors.flatMap((competitor) => (competitor.movement ?? []).map((movement) => ({
    state: "ready" as const,
    title: `${competitor.name} ${movement.trend}: ${movement.metric}`,
    insight: insight(
      competitor.name,
      `${competitor.name} shows ${movement.trend} movement of ${rounded(movement.changePercent, 1)}% in ${movement.metric}.`,
      movement.trend === "decline"
        ? `Check whether ${hospitalName} can capture the weakened ${movement.metric} area.`
        : `Review ${competitor.name}'s ${movement.metric} play and decide whether to counter, differentiate, or monitor.`,
      [`${movement.metric}: ${rounded(movement.changePercent, 1)}% change${movement.observedAt ? ` observed ${movement.observedAt}` : ""}.`],
      competitor.confidence,
      competitor.sourceLabels,
    ),
  })));

  return alerts.length ? alerts : [{
    state: "empty",
    title: "No competitor movement alerts",
    insight: emptyInsight(hospitalName, "Movement alerts require imported trend/change fields from Similarweb, SEMrush, Ahrefs, or Sprout Social."),
  }];
}

function buildStrategicRecommendations(hospitalName: string, competitors: NormalizedCompetitor[], hospitalScores: Record<MetricKey, number | null>) {
  const recommendations = opportunityGapInsights(hospitalName, competitors, hospitalScores)
    .slice(0, 5)
    .map((gap) => ({
      ...gap,
      recommendedAction: `Assign an owner and 30-day target for this action: ${gap.recommendedAction}`,
    }));

  return recommendations.length ? recommendations : [
    emptyInsight(hospitalName, "Create a monthly competitor import rhythm before making strategic recommendations."),
  ];
}

function buildPositionScore(hospitalName: string, competitors: NormalizedCompetitor[], hospitalScores: Record<MetricKey, number | null>): CompetitivePositionScore {
  const top = competitors.map((competitor) => competitor.scores).reduce<Record<MetricKey, number | null>>((best, scores) => {
    for (const key of metricKeys) best[key] = Math.max(best[key] ?? 0, scores[key] ?? 0);
    return best;
  }, { ...hospitalScores });
  const breakdown = Object.fromEntries(metricKeys.map((key) => {
    const own = hospitalScores[key] ?? 0;
    const benchmark = Math.max(top[key] ?? 0, 1);
    return [key, rounded(clamp((own / benchmark) * 100))];
  })) as CompetitivePositionScore["breakdown"];
  const score = rounded(metricKeys.reduce((total, key) => total + breakdown[key] * weights[key], 0));

  return {
    score,
    state: competitors.length ? "ready" : "empty",
    breakdown,
    insight: insight(
      hospitalName,
      `${hospitalName} scores ${score}/100 against the strongest available competitor benchmark across six categories.`,
      score >= 75
        ? "Defend the lead by monitoring movement alerts and refreshing high-performing channels."
        : "Close the two weakest category gaps first, then refresh the competitor import monthly.",
      metricKeys.map((key) => `${labelForMetric(key)}: ${breakdown[key]}/100 relative position.`),
      competitors.length ? 0.72 : 0.25,
      ["VIP"],
    ),
  };
}

function currentPositionInsight(hospitalName: string, topCompetitor: CompetitorRankingRow | undefined, hospitalScores: Record<MetricKey, number | null>) {
  const ownTotal = weightedTotal(hospitalScores);
  if (!topCompetitor) {
    return emptyInsight(hospitalName, "No competitor baseline is available yet.");
  }
  const winner = topCompetitor.totalScore > ownTotal ? topCompetitor.name : hospitalName;
  return insight(
    winner,
    `${winner} is winning the current market position because its normalized score is stronger than the main benchmark.`,
    winner === hospitalName
      ? "Protect the lead by monitoring imported competitor movement and maintaining review, SEO, and social velocity."
      : `Use ${topCompetitor.name} as the primary benchmark and close the weakest scored categories first.`,
    [`${hospitalName}: ${ownTotal}/100. ${topCompetitor.name}: ${topCompetitor.totalScore}/100.`],
    topCompetitor.insight.confidence,
    topCompetitor.insight.sourceLabels,
  );
}

function opportunityGapInsights(hospitalName: string, competitors: NormalizedCompetitor[], hospitalScores: Record<MetricKey, number | null>) {
  return competitors
    .flatMap((competitor) => metricKeys.map((key) => {
      const peer = competitor.scores[key] ?? 0;
      const own = hospitalScores[key] ?? 0;
      const gap = peer - own;
      return { competitor, key, gap };
    }))
    .filter((item) => item.gap > 5)
    .sort((a, b) => b.gap - a.gap)
    .map(({ competitor, key, gap }) => insight(
      competitor.name,
      `${competitor.name} is winning ${labelForMetric(key)} by ${rounded(gap, 1)} normalized points.`,
      actionForMetric(key, competitor.name),
      [`${labelForMetric(key)} gap: ${rounded(gap, 1)} points.`],
      competitor.confidence,
      competitor.sourceLabels,
    ));
}

function gapInsight(hospitalName: string, competitor: NormalizedCompetitor, key: MetricKey, mode: "dominates" | "ignores") {
  const label = labelForMetric(key);
  if (mode === "dominates") {
    return insight(
      competitor.name,
      `${competitor.name} is winning because it has stronger ${label} evidence.`,
      actionForMetric(key, competitor.name),
      [`${competitor.name} ${label}: ${competitor.scores[key] ?? "unavailable"}.`],
      competitor.confidence,
      competitor.sourceLabels,
    );
  }
  return insight(
    hospitalName,
    `${competitor.name} appears to ignore ${label}, creating a differentiation opening for ${hospitalName}.`,
    `Invest selectively in ${label.toLowerCase()} where competitor evidence is weak.`,
    [`${competitor.name} ${label}: ${competitor.scores[key] ?? "unavailable"}.`],
    competitor.confidence,
    competitor.sourceLabels,
  );
}

function opportunity(horizon: OpportunityHorizon, insightValue: CompetitorReportInsight): CompetitiveOpportunity {
  return {
    horizon,
    title: horizon === "quickWin" ? "Close the most visible competitor gap" : horizon === "mediumTerm" ? "Build repeatable competitor response" : "Create a competitive intelligence operating rhythm",
    priority: horizon === "quickWin" ? "High" : horizon === "mediumTerm" ? "Medium" : "High",
    insight: insightValue,
  };
}

function buildSourceAvailability(input: CompetitorAnalysisReportInput, competitors: NormalizedCompetitor[]) {
  const available = (source: CompetitorReportSource): ReportState =>
    competitors.some((competitor) => competitor.sourceLabels.includes(source)) ? "ready" : "empty";

  return {
    VIP: "ready" as const,
    "Google Places": competitors.some((competitor) => competitor.sourceLabels.includes("Google Places")) ? "ready" as const : "degraded" as const,
    GBP: competitors.some((competitor) => competitor.sourceLabels.includes("GBP")) ? "ready" as const : "degraded" as const,
    Similarweb: input.imports?.similarweb?.length ? "ready" as const : available("Similarweb"),
    SEMrush: input.imports?.semrush?.length ? "ready" as const : available("SEMrush"),
    Ahrefs: input.imports?.ahrefs?.length ? "ready" as const : available("Ahrefs"),
    "Sprout Social": input.imports?.sproutSocial?.length ? "ready" as const : available("Sprout Social"),
  };
}

function hospitalScore(hospital: HospitalCompetitorBaseline): Record<MetricKey, number | null> {
  return {
    marketVisibility: scoreFromValue(hospital.marketVisibility),
    socialPresence: scoreFromValue(hospital.socialPresence ?? averageNumbers([hospital.social?.followers, hospital.social?.reach, percentToScore(hospital.social?.engagementRate), hospital.social?.postsPerWeek])),
    reputation: reputationScore(hospital.reputation),
    localSearchPresence: scoreFromValue(hospital.localSearchPresence),
    seoVisibility: scoreFromValue(hospital.seoVisibility ?? averageNumbers([hospital.seo?.keywordVisibility, hospital.seo?.servicePageVisibility, hospital.seo?.localSeoStrength])),
    contentStrength: scoreFromValue(hospital.contentStrength ?? averageNumbers([hospital.content?.frequencyPerWeek, hospital.content?.themes?.length, hospital.content?.topContentTypes?.length])),
  };
}

function competitorScore(competitor: CompetitorReportCompetitor): Record<MetricKey, number | null> {
  return {
    marketVisibility: scoreFromValue(competitor.marketVisibility),
    socialPresence: scoreFromValue(competitor.socialPresence ?? averageNumbers([competitor.social?.followers, competitor.social?.reach, percentToScore(competitor.social?.engagementRate), competitor.social?.postsPerWeek])),
    reputation: reputationScore(competitor.reputation),
    localSearchPresence: scoreFromValue(competitor.localSearchPresence),
    seoVisibility: scoreFromValue(competitor.seoVisibility ?? averageNumbers([competitor.seo?.keywordVisibility, competitor.seo?.servicePageVisibility, competitor.seo?.localSeoStrength])),
    contentStrength: scoreFromValue(competitor.contentStrength ?? averageNumbers([competitor.content?.frequencyPerWeek, competitor.content?.themes?.length, competitor.content?.topContentTypes?.length])),
  };
}

function weightedTotal(scores: Record<MetricKey, number | null>) {
  const present = metricKeys.filter((key) => scores[key] !== null);
  if (!present.length) return 0;
  const totalWeight = present.reduce((total, key) => total + weights[key], 0);
  return rounded(present.reduce((total, key) => total + (scores[key] ?? 0) * weights[key], 0) / totalWeight);
}

function reputationScore(reputation?: HospitalCompetitorBaseline["reputation"]) {
  if (!reputation) return null;
  const rating = reputation.rating !== undefined ? (reputation.rating / 5) * 100 : undefined;
  const reviewVolume = scoreFromValue(reputation.reviewVolume, 500);
  const sentiment = reputation.sentiment !== undefined ? percentToScore(reputation.sentiment) : undefined;
  return averageNumbers([rating, reviewVolume, sentiment]);
}

function scoreFromValue(value: number | null | undefined, scale = 100) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value <= 1) return rounded(clamp(value * 100));
  return rounded(clamp((value / scale) * 100));
}

function percentToScore(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  if (Math.abs(value) <= 1) return value * 100;
  return value;
}

function compareNumbers(left: number | null | undefined, right: number | null | undefined) {
  return (left ?? Number.NEGATIVE_INFINITY) - (right ?? Number.NEGATIVE_INFINITY);
}

function averageNumbers(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value));
  return clean.length ? rounded(clean.reduce((total, value) => total + value, 0) / clean.length) : null;
}

function hasAnyNumber(values: Array<number | null | undefined>) {
  return values.some((value) => value !== null && value !== undefined && Number.isFinite(value));
}

function availableMetricCount(scores: Record<MetricKey, number | null>) {
  return metricKeys.filter((key) => scores[key] !== null).length;
}

function evidenceForScores(competitor: NormalizedCompetitor) {
  const evidence = metricKeys
    .filter((key) => competitor.scores[key] !== null)
    .map((key) => `${labelForMetric(key)}: ${competitor.scores[key]}/100.`);
  return evidence.length ? evidence : ["No normalized score evidence is available yet."];
}

function socialEvidence(competitor: NormalizedCompetitor) {
  return compact([
    competitor.social?.followers !== undefined ? `Followers: ${competitor.social.followers}.` : undefined,
    competitor.social?.reach !== undefined ? `Reach: ${competitor.social.reach}.` : undefined,
    competitor.social?.engagementRate !== undefined ? `Engagement: ${competitor.social.engagementRate}.` : undefined,
    competitor.social?.postsPerWeek !== undefined ? `Posting activity: ${competitor.social.postsPerWeek} posts/week.` : undefined,
  ], "No Sprout Social metric import is available for this competitor.");
}

function reputationEvidence(competitor: NormalizedCompetitor) {
  return compact([
    competitor.reputation?.rating !== undefined ? `Rating: ${competitor.reputation.rating}.` : undefined,
    competitor.reputation?.reviewVolume !== undefined ? `Review volume: ${competitor.reputation.reviewVolume}.` : undefined,
    competitor.reputation?.sentiment !== undefined ? `Sentiment: ${competitor.reputation.sentiment}.` : undefined,
  ], "No reputation metric is available for this competitor.");
}

function contentEvidence(competitor: NormalizedCompetitor) {
  return compact([
    competitor.content?.themes?.length ? `Themes: ${competitor.content.themes.join(", ")}.` : undefined,
    competitor.content?.frequencyPerWeek !== undefined ? `Frequency: ${competitor.content.frequencyPerWeek} posts/week.` : undefined,
    competitor.content?.topContentTypes?.length ? `Top content types: ${competitor.content.topContentTypes.join(", ")}.` : undefined,
  ], "No Ahrefs/content metric import is available for this competitor.");
}

function seoEvidence(competitor: NormalizedCompetitor) {
  return compact([
    competitor.seo?.keywordVisibility !== undefined ? `Keyword visibility: ${competitor.seo.keywordVisibility}.` : undefined,
    competitor.seo?.servicePageVisibility !== undefined ? `Service page visibility: ${competitor.seo.servicePageVisibility}.` : undefined,
    competitor.seo?.localSeoStrength !== undefined ? `Local SEO strength: ${competitor.seo.localSeoStrength}.` : undefined,
  ], "No SEMrush/Ahrefs SEO metric import is available for this competitor.");
}

function compact(values: Array<string | undefined>, fallback: string) {
  const clean = values.filter((value): value is string => Boolean(value));
  return clean.length ? clean : [fallback];
}

function actionForMetric(key: MetricKey, competitorName: string) {
  switch (key) {
    case "marketVisibility":
      return `Benchmark ${competitorName}'s visibility channels and improve source-backed web, search, and local presence evidence.`;
    case "socialPresence":
      return `Close the social gap with profile tracking, stronger cadence, and formats that match measured patient attention.`;
    case "reputation":
      return "Increase ethical review velocity, reply coverage, and sentiment learning.";
    case "localSearchPresence":
      return "Strengthen GBP services, photos, FAQs, hours, local pages, and centre-level CTAs.";
    case "seoVisibility":
      return "Prioritize keyword gaps, service pages, local-intent FAQs, and internal linking.";
    case "contentStrength":
      return "Publish doctor-reviewed content around competitor-owned themes and underserved service questions.";
  }
}

function labelForMetric(key: MetricKey) {
  return {
    marketVisibility: "Market visibility",
    socialPresence: "Social presence",
    reputation: "Reputation",
    localSearchPresence: "Local search presence",
    seoVisibility: "SEO visibility",
    contentStrength: "Content strength",
  }[key];
}

function insight(
  winner: string,
  whyTheyAreWinning: string,
  recommendedAction: string,
  evidence: string[],
  confidence: number,
  sourceLabels: CompetitorReportSource[],
): CompetitorReportInsight {
  return {
    winner,
    whyTheyAreWinning,
    recommendedAction,
    evidence,
    confidence: rounded(clamp(confidence, 0, 1), 3),
    sourceLabels: uniqueSources(sourceLabels),
  };
}

function emptyInsight(hospitalName: string, recommendedAction: string): CompetitorReportInsight {
  return insight(
    hospitalName,
    "No competitor is winning this area yet because the required source evidence is missing.",
    recommendedAction,
    ["Missing source evidence; no metric was estimated."],
    0.2,
    ["VIP"],
  );
}

function normalizedConfidence(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return 0.65;
  return value > 1 ? clamp(value / 100, 0, 1) : clamp(value, 0, 1);
}

function sourceConfidence(sources?: CompetitorReportSource[]) {
  if (!sources?.length) return 0.45;
  if (sources.some((source) => source === "Similarweb" || source === "SEMrush" || source === "Ahrefs" || source === "Sprout Social")) return 0.72;
  if (sources.some((source) => source === "Google Places" || source === "GBP")) return 0.68;
  return 0.5;
}

function identityKey(value: { id?: string; name?: string; domain?: string }) {
  return (value.id ?? value.domain ?? value.name ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function uniqueSources(values: CompetitorReportSource[]) {
  return [...new Set(values)];
}

function coalesce<T>(current: T | undefined, next: T | undefined | null): T | undefined {
  return current ?? (next ?? undefined);
}

function coalesceArray<T>(current: T[] | undefined, next: T[] | undefined) {
  return current?.length ? current : next;
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function firstStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  }
  return undefined;
}
