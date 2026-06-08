export type ReportDataState = "READY" | "ESTIMATED" | "DATA_LIMITED" | "UNAVAILABLE";
export type ReportChangeDirection = "UP" | "DOWN" | "UNCHANGED" | "UNKNOWN";
export type ReportMetricStatus = "STRONG" | "STABLE" | "WATCH" | "AT_RISK" | "DATA_LIMITED";
export type WeeklyOverallStatus = ReportMetricStatus;

export interface ReportPeriod {
  startsAt: string;
  endsAt: string;
}

export interface ReportMetric {
  label: string;
  value: number | null;
  previousValue: number | null;
  change: number | null;
  changeDirection: ReportChangeDirection;
  status: ReportMetricStatus;
  dataState: ReportDataState;
  unit?: "NUMBER" | "PERCENT" | "SCORE";
  note?: string;
}

export interface WeeklyAnalysisReport {
  id: string;
  workspaceId: string;
  hospitalName: string;
  generatedAt: string;
  period: ReportPeriod;
  comparisonPeriod: ReportPeriod;
  executiveSummary: {
    biggestWins: string[];
    biggestConcerns: string[];
    nextLeadershipFocus: string;
    overallStatus: WeeklyOverallStatus;
  };
  kpiSnapshot: {
    reach: ReportMetric;
    engagement: ReportMetric;
    leads: ReportMetric;
    appointments: ReportMetric;
    reviews: ReportMetric;
    websiteTraffic: ReportMetric;
  };
  socialMedia: {
    instagram: SocialPlatformSummary;
    facebook: SocialPlatformSummary;
    contentPerformance: ContentPerformanceSummary[];
  };
  gbp: {
    profileViews: ReportMetric;
    calls: ReportMetric;
    directionRequests: ReportMetric;
    websiteClicks: ReportMetric;
  };
  reputation: {
    newReviews: ReportMetric;
    ratingChange: ReportMetric;
    sentimentChanges: SentimentChangeSummary[];
  };
  whatsapp: {
    inquiries: ReportMetric;
    conversionRate: ReportMetric;
    responsePerformance: ReportMetric;
  };
  competitors: {
    majorMovements: string[];
    marketChanges: string[];
  };
  keyInsights: WeeklyKeyInsight[];
  recommendedActions: WeeklyRecommendedAction[];
  weeklyGrowthScore: {
    score: number;
    label: WeeklyOverallStatus;
    coveragePercent: number;
    drivers: string[];
  };
  dataQualityNotes: string[];
}

export interface SocialPlatformSummary {
  platform: "INSTAGRAM" | "FACEBOOK";
  posts: number;
  reach: ReportMetric;
  engagement: ReportMetric;
  engagementRate: ReportMetric;
  topPost: {
    caption: string;
    engagement: number;
    reach: number;
  } | null;
  summary: string;
  dataState: ReportDataState;
}

export interface ContentPerformanceSummary {
  label: string;
  posts: number;
  engagement: number;
  reach: number;
  engagementRate: number;
}

export interface SentimentChangeSummary {
  label: string;
  current: number;
  previous: number;
  change: number;
}

export interface WeeklyKeyInsight {
  whatHappened: string;
  whyItHappened: string;
  whatItMeans: string;
}

export interface WeeklyRecommendedAction {
  title: string;
  detail: string;
  owner?: string;
}

export interface WeeklyAnalysisReportInput {
  workspaceId: string;
  hospitalName: string;
  asOf?: Date;
  socialPosts?: WeeklySocialPostInput[];
  reviews?: WeeklyReviewInput[];
  competitors?: WeeklyCompetitorInput[];
  leads?: ConnectedMetricInput;
  appointments?: ConnectedMetricInput;
  websiteTraffic?: ConnectedMetricInput;
  gbp?: {
    profileViews?: ConnectedMetricInput;
    calls?: ConnectedMetricInput;
    directionRequests?: ConnectedMetricInput;
    websiteClicks?: ConnectedMetricInput;
  };
  whatsapp?: {
    inquiries?: ConnectedMetricInput;
    conversionRate?: ConnectedMetricInput;
    responsePerformance?: ConnectedMetricInput;
  };
}

export interface WeeklySocialPostInput {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | string;
  caption?: string | null;
  contentType?: string | null;
  contentCategory?: string | null;
  postedAt: string | Date;
  metrics?: {
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    saves?: number | null;
    clicks?: number | null;
    reach?: number | null;
    impressions?: number | null;
    engagementRate?: number | null;
  } | null;
}

export interface WeeklyReviewInput {
  id: string;
  rating: number;
  sentiment?: string | null;
  category?: string | null;
  createdAt: string | Date;
}

export interface WeeklyCompetitorInput {
  label: string;
  metrics?: Record<string, unknown> | null;
  lastAnalyzedAt?: string | Date | null;
}

export interface ConnectedMetricInput {
  current?: number | null;
  previous?: number | null;
  dataState?: ReportDataState;
  note?: string;
  unit?: ReportMetric["unit"];
}

export class WeeklyAnalysisReportGenerator {
  generate(input: WeeklyAnalysisReportInput): WeeklyAnalysisReport {
    const asOf = input.asOf ?? new Date();
    const period = rollingPeriod(asOf, 7);
    const comparisonPeriod = previousPeriod(period, 7);
    const social = summarizeSocial(input.socialPosts ?? [], period, comparisonPeriod);
    const reputation = summarizeReputation(input.reviews ?? [], period, comparisonPeriod);
    const limitedNote = "Integration not connected yet; metric is shown as data-limited.";
    const kpiSnapshot = {
      reach: social.totalReach,
      engagement: social.totalEngagement,
      leads: connectedMetric("Leads", input.leads, limitedNote),
      appointments: connectedMetric("Appointments", input.appointments, limitedNote),
      reviews: reputation.newReviews,
      websiteTraffic: connectedMetric("Website traffic", input.websiteTraffic, limitedNote),
    };
    const gbp = {
      profileViews: connectedMetric("Profile views", input.gbp?.profileViews, limitedNote),
      calls: connectedMetric("Calls", input.gbp?.calls, limitedNote),
      directionRequests: connectedMetric("Direction requests", input.gbp?.directionRequests, limitedNote),
      websiteClicks: connectedMetric("Website clicks", input.gbp?.websiteClicks, limitedNote),
    };
    const whatsapp = {
      inquiries: connectedMetric("Inquiries", input.whatsapp?.inquiries, limitedNote),
      conversionRate: connectedMetric("Conversion rate", input.whatsapp?.conversionRate, limitedNote, "PERCENT"),
      responsePerformance: connectedMetric("Response performance", input.whatsapp?.responsePerformance, limitedNote),
    };
    const growthScore = calculateGrowthScore({
      acquisition: scoreMetric(kpiSnapshot.reach),
      engagement: scoreMetric(kpiSnapshot.engagement),
      conversion: scoreMetric(kpiSnapshot.appointments.dataState === "READY" ? kpiSnapshot.appointments : kpiSnapshot.leads),
      reputation: scoreMetric(reputation.newReviews),
      localPresence: scoreMetric(gbp.profileViews),
    });
    const overallStatus = statusFromScore(growthScore.score, growthScore.coveragePercent);
    const dataQualityNotes = buildDataQualityNotes(kpiSnapshot, gbp, whatsapp, social, input.competitors ?? []);
    const competitors = summarizeCompetitors(input.competitors ?? []);
    const executiveSummary = buildExecutiveSummary({
      hospitalName: input.hospitalName,
      overallStatus,
      kpiSnapshot,
      social,
      reputation,
      competitors,
      dataQualityNotes,
    });
    const keyInsights = buildInsights({ kpiSnapshot, social, reputation, competitors, overallStatus });

    return {
      id: `${input.workspaceId}:weekly-analysis:${period.startsAt.slice(0, 10)}`,
      workspaceId: input.workspaceId,
      hospitalName: input.hospitalName,
      generatedAt: asOf.toISOString(),
      period,
      comparisonPeriod,
      executiveSummary,
      kpiSnapshot,
      socialMedia: {
        instagram: social.instagram,
        facebook: social.facebook,
        contentPerformance: social.contentPerformance,
      },
      gbp,
      reputation,
      whatsapp,
      competitors,
      keyInsights,
      recommendedActions: buildActions({ kpiSnapshot, social, reputation, overallStatus, dataQualityNotes }),
      weeklyGrowthScore: {
        score: growthScore.score,
        label: overallStatus,
        coveragePercent: growthScore.coveragePercent,
        drivers: growthScore.drivers,
      },
      dataQualityNotes,
    };
  }
}

function rollingPeriod(asOf: Date, days: number): ReportPeriod {
  const end = new Date(asOf);
  const start = new Date(asOf);
  start.setUTCDate(start.getUTCDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function previousPeriod(period: ReportPeriod, days: number): ReportPeriod {
  const currentStart = new Date(period.startsAt);
  const end = new Date(currentStart);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  start.setUTCHours(0, 0, 0, 0);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

function summarizeSocial(posts: WeeklySocialPostInput[], period: ReportPeriod, comparisonPeriod: ReportPeriod) {
  const current = posts.filter((post) => inPeriod(post.postedAt, period));
  const previous = posts.filter((post) => inPeriod(post.postedAt, comparisonPeriod));
  const instagram = platformSummary("INSTAGRAM", current, previous);
  const facebook = platformSummary("FACEBOOK", current, previous);
  const totalReach = metric("Reach", totalReachValue(current), totalReachValue(previous), hasMetrics(current) || hasMetrics(previous) ? "READY" : "DATA_LIMITED");
  const totalEngagement = metric("Engagement", totalEngagementValue(current), totalEngagementValue(previous), hasMetrics(current) || hasMetrics(previous) ? "READY" : "DATA_LIMITED");
  const contentPerformance = summarizeContent(current);

  return { instagram, facebook, totalReach, totalEngagement, contentPerformance };
}

function platformSummary(platform: "INSTAGRAM" | "FACEBOOK", current: WeeklySocialPostInput[], previous: WeeklySocialPostInput[]): SocialPlatformSummary {
  const currentPosts = current.filter((post) => post.platform === platform);
  const previousPosts = previous.filter((post) => post.platform === platform);
  const dataState: ReportDataState = hasMetrics(currentPosts) || hasMetrics(previousPosts) ? "READY" : currentPosts.length > 0 ? "DATA_LIMITED" : "UNAVAILABLE";
  const engagement = metric("Engagement", totalEngagementValue(currentPosts), totalEngagementValue(previousPosts), dataState);
  const reach = metric("Reach", totalReachValue(currentPosts), totalReachValue(previousPosts), dataState);
  const engagementRate = metric("Engagement rate", averageEngagementRate(currentPosts), averageEngagementRate(previousPosts), dataState, "PERCENT");
  const topPost = currentPosts
    .map((post) => ({ post, engagement: engagementValue(post), reach: numberValue(post.metrics?.reach) }))
    .sort((left, right) => right.engagement - left.engagement)[0];

  return {
    platform,
    posts: currentPosts.length,
    reach,
    engagement,
    engagementRate,
    topPost: topPost
      ? {
          caption: trimCaption(topPost.post.caption),
          engagement: topPost.engagement,
          reach: topPost.reach,
        }
      : null,
    summary: summarizePlatform(platform, currentPosts.length, engagement, reach, dataState),
    dataState,
  };
}

function summarizeContent(posts: WeeklySocialPostInput[]): ContentPerformanceSummary[] {
  const buckets = new Map<string, WeeklySocialPostInput[]>();
  for (const post of posts) {
    const label = post.contentCategory || post.contentType || "Uncategorized";
    buckets.set(label, [...(buckets.get(label) ?? []), post]);
  }

  return Array.from(buckets.entries())
    .map(([label, items]) => ({
      label,
      posts: items.length,
      engagement: totalEngagementValue(items),
      reach: totalReachValue(items),
      engagementRate: round(averageEngagementRate(items) ?? 0),
    }))
    .sort((left, right) => right.engagement - left.engagement)
    .slice(0, 5);
}

function summarizeReputation(reviews: WeeklyReviewInput[], period: ReportPeriod, comparisonPeriod: ReportPeriod) {
  const current = reviews.filter((review) => inPeriod(review.createdAt, period));
  const previous = reviews.filter((review) => inPeriod(review.createdAt, comparisonPeriod));
  const dataState: ReportDataState = current.length || previous.length ? "READY" : "DATA_LIMITED";
  const currentRating = average(current.map((review) => review.rating));
  const previousRating = average(previous.map((review) => review.rating));
  return {
    newReviews: metric("New reviews", current.length, previous.length, dataState),
    ratingChange: metric("Rating change", currentRating, previousRating, dataState, "SCORE"),
    sentimentChanges: sentimentChanges(current, previous),
  };
}

function summarizeCompetitors(competitors: WeeklyCompetitorInput[]) {
  if (competitors.length === 0) {
    return {
      majorMovements: ["No competitor accounts are configured for this hospital workspace yet."],
      marketChanges: ["Market movement is data-limited until competitor monitoring is connected."],
    };
  }

  const movements = competitors.slice(0, 3).map((competitor) => {
    const engagement = numericMetric(competitor.metrics, ["engagement", "engagementRate", "avgEngagementRate"]);
    const posts = numericMetric(competitor.metrics, ["posts", "postCount", "postingFrequency"]);
    if (engagement !== null || posts !== null) {
      return `${competitor.label} shows ${engagement !== null ? `engagement ${formatNumber(engagement)}` : "available"}${posts !== null ? ` across ${formatNumber(posts)} posts` : ""}.`;
    }
    return `${competitor.label} is configured, but movement metrics are data-limited.`;
  });

  return {
    majorMovements: movements,
    marketChanges: competitors.some((competitor) => competitor.metrics)
      ? ["Competitor evidence is available directionally; compare against hospital content and review movement before changing strategy."]
      : ["Competitor accounts exist, but stored movement metrics are not structured yet."],
  };
}

function buildExecutiveSummary(input: {
  hospitalName: string;
  overallStatus: WeeklyOverallStatus;
  kpiSnapshot: WeeklyAnalysisReport["kpiSnapshot"];
  social: ReturnType<typeof summarizeSocial>;
  reputation: ReturnType<typeof summarizeReputation>;
  competitors: WeeklyAnalysisReport["competitors"];
  dataQualityNotes: string[];
}) {
  const wins = [
    positiveLine(input.kpiSnapshot.reach, "Reach expanded across patient-facing channels."),
    positiveLine(input.kpiSnapshot.engagement, "Engagement improved, indicating stronger content resonance."),
    positiveLine(input.reputation.newReviews, "Review activity increased, adding fresh trust evidence."),
  ].filter(Boolean) as string[];
  const concerns = [
    concernLine(input.kpiSnapshot.reach, "Reach declined versus the previous week."),
    concernLine(input.kpiSnapshot.engagement, "Engagement softened versus the previous week."),
    input.dataQualityNotes.length ? "Key conversion and local action metrics need integration before leadership can see the full funnel." : "",
  ].filter(Boolean);

  return {
    biggestWins: fillList(wins, "Social and review evidence is available for weekly leadership review."),
    biggestConcerns: fillList(concerns, "No critical performance concern is visible in connected data this week."),
    nextLeadershipFocus:
      input.overallStatus === "DATA_LIMITED"
        ? "Connect conversion, GBP, WhatsApp, and website analytics so next week's score reflects the full patient acquisition journey."
        : "Protect the strongest channel gains while acting on the highest-risk patient trust or conversion signal.",
    overallStatus: input.overallStatus,
  };
}

function buildInsights(input: {
  kpiSnapshot: WeeklyAnalysisReport["kpiSnapshot"];
  social: ReturnType<typeof summarizeSocial>;
  reputation: ReturnType<typeof summarizeReputation>;
  competitors: WeeklyAnalysisReport["competitors"];
  overallStatus: WeeklyOverallStatus;
}): WeeklyKeyInsight[] {
  const insights: WeeklyKeyInsight[] = [
    {
      whatHappened: describeMetric(input.kpiSnapshot.engagement, "Engagement remained data-limited."),
      whyItHappened: input.social.contentPerformance[0]
        ? `${input.social.contentPerformance[0].label} content led connected engagement this week.`
        : "Content-level evidence is limited, so no specific format should be credited yet.",
      whatItMeans: "Leadership should judge content by patient action signals, not volume alone.",
    },
    {
      whatHappened: describeMetric(input.reputation.newReviews, "Review volume is data-limited."),
      whyItHappened: input.reputation.sentimentChanges.length
        ? "Stored review sentiment changed across the connected review sample."
        : "Review text or sentiment history is not yet deep enough for a stronger explanation.",
      whatItMeans: "Reputation remains a board-level trust signal and should stay visible every week.",
    },
    {
      whatHappened: `Overall weekly status is ${input.overallStatus.toLowerCase().replace("_", " ")}.`,
      whyItHappened: "The score uses only connected domains and marks missing acquisition data as data-limited.",
      whatItMeans: "The report is safe for leadership review without overstating disconnected systems.",
    },
  ];

  if (input.competitors.majorMovements.length) {
    insights.push({
      whatHappened: input.competitors.majorMovements[0],
      whyItHappened: "Competitor highlights come from configured accounts and stored movement metrics where available.",
      whatItMeans: "Use competitor evidence to prioritize gaps, not to copy claims or tactics blindly.",
    });
  }

  return insights.slice(0, 5);
}

function buildActions(input: {
  kpiSnapshot: WeeklyAnalysisReport["kpiSnapshot"];
  social: ReturnType<typeof summarizeSocial>;
  reputation: ReturnType<typeof summarizeReputation>;
  overallStatus: WeeklyOverallStatus;
  dataQualityNotes: string[];
}): WeeklyRecommendedAction[] {
  const actions: WeeklyRecommendedAction[] = [];
  if (input.dataQualityNotes.length) {
    actions.push({
      title: "Connect missing executive metrics",
      detail: "Prioritize GBP actions, WhatsApp inquiries, website traffic, leads, and appointments so the growth score reflects the full funnel.",
      owner: "Platform",
    });
  }
  if (input.kpiSnapshot.engagement.changeDirection === "DOWN") {
    actions.push({
      title: "Recover content engagement",
      detail: "Review the lowest-performing formats and shift next week's calendar toward the content category with the strongest connected engagement.",
      owner: "Marketing",
    });
  }
  if (input.kpiSnapshot.reach.changeDirection === "DOWN") {
    actions.push({
      title: "Restore patient reach",
      detail: "Increase distribution for doctor-led education and local service-line posts before the next weekly review.",
      owner: "Marketing",
    });
  }
  if (input.reputation.newReviews.dataState === "READY") {
    actions.push({
      title: "Turn review evidence into trust content",
      detail: "Summarize recurring positive themes and operational concerns for administrator review before publishing any patient-facing proof.",
      owner: "Admin",
    });
  }
  if (input.social.contentPerformance[0]) {
    actions.push({
      title: `Repeat the strongest content pattern`,
      detail: `Use ${input.social.contentPerformance[0].label} as next week's starting point, with fresh clinical review and a clear appointment path.`,
      owner: "Content",
    });
  }

  actions.push(
    {
      title: "Review the weekly score in leadership standup",
      detail: "Use the report to decide which one patient acquisition blocker and one trust-building action need executive attention.",
      owner: "Leadership",
    },
    {
      title: "Keep competitor monitoring source-labeled",
      detail: "Use competitor movement as context only until benchmark data is complete and clinically safe to act on.",
      owner: "Strategy",
    },
    {
      title: "Prepare next week's measurement checklist",
      detail: "Confirm the report has current social, review, GBP, WhatsApp, website, lead, and appointment evidence before publication.",
      owner: "Operations",
    }
  );

  return actions.slice(0, 5);
}

function calculateGrowthScore(input: {
  acquisition: ScoreInput;
  engagement: ScoreInput;
  conversion: ScoreInput;
  reputation: ScoreInput;
  localPresence: ScoreInput;
}) {
  const weighted = [
    { label: "Acquisition", weight: 25, value: input.acquisition },
    { label: "Engagement", weight: 20, value: input.engagement },
    { label: "Conversion", weight: 20, value: input.conversion },
    { label: "Reputation", weight: 20, value: input.reputation },
    { label: "Local presence", weight: 15, value: input.localPresence },
  ];
  const available = weighted.filter((item) => item.value.available);
  const availableWeight = available.reduce((total, item) => total + item.weight, 0);
  const score = availableWeight
    ? round(available.reduce((total, item) => total + item.value.score * item.weight, 0) / availableWeight)
    : 0;
  return {
    score,
    coveragePercent: availableWeight,
    drivers: available.map((item) => `${item.label}: ${item.value.reason}`),
  };
}

interface ScoreInput {
  available: boolean;
  score: number;
  reason: string;
}

function scoreMetric(input: ReportMetric): ScoreInput {
  if (input.dataState !== "READY" || input.value === null) {
    return { available: false, score: 0, reason: "data-limited" };
  }
  if (input.change === null) {
    return { available: true, score: 60, reason: "connected without prior comparison" };
  }
  const score = input.changeDirection === "UP" ? 70 + Math.min(20, Math.abs(input.change)) : input.changeDirection === "DOWN" ? 50 - Math.min(25, Math.abs(input.change)) : 60;
  return { available: true, score: clamp(score), reason: `${input.changeDirection.toLowerCase()} ${round(input.change)}%` };
}

function connectedMetric(label: string, input: ConnectedMetricInput | undefined, note: string, unit: ReportMetric["unit"] = input?.unit ?? "NUMBER") {
  if (!input || input.current === undefined || input.current === null) {
    return metric(label, null, null, input?.dataState ?? "DATA_LIMITED", unit, input?.note ?? note);
  }
  return metric(label, input.current, input.previous ?? null, input.dataState ?? "READY", unit, input.note);
}

function metric(label: string, value: number | null, previousValue: number | null, dataState: ReportDataState, unit: ReportMetric["unit"] = "NUMBER", note?: string): ReportMetric {
  const change = value !== null && previousValue !== null && previousValue !== 0
    ? round(((value - previousValue) / Math.abs(previousValue)) * 100)
    : value !== null && previousValue === 0
      ? value > 0 ? 100 : 0
      : null;
  const changeDirection = change === null ? "UNKNOWN" : change > 0 ? "UP" : change < 0 ? "DOWN" : "UNCHANGED";
  return {
    label,
    value: value === null ? null : round(value),
    previousValue: previousValue === null ? null : round(previousValue),
    change,
    changeDirection,
    status: dataState === "READY" ? metricStatus(changeDirection, change) : "DATA_LIMITED",
    dataState,
    unit,
    note,
  };
}

function metricStatus(direction: ReportChangeDirection, change: number | null): ReportMetricStatus {
  if (direction === "UP" && (change ?? 0) >= 10) return "STRONG";
  if (direction === "DOWN" && Math.abs(change ?? 0) >= 10) return "WATCH";
  return "STABLE";
}

function statusFromScore(score: number, coverage: number): WeeklyOverallStatus {
  if (coverage < 60) return "DATA_LIMITED";
  if (score >= 75) return "STRONG";
  if (score >= 60) return "STABLE";
  if (score >= 45) return "WATCH";
  return "AT_RISK";
}

function buildDataQualityNotes(
  kpi: WeeklyAnalysisReport["kpiSnapshot"],
  gbp: WeeklyAnalysisReport["gbp"],
  whatsapp: WeeklyAnalysisReport["whatsapp"],
  social: ReturnType<typeof summarizeSocial>,
  competitors: WeeklyCompetitorInput[]
) {
  const notes: string[] = [];
  for (const item of [kpi.leads, kpi.appointments, kpi.websiteTraffic, gbp.profileViews, gbp.calls, gbp.directionRequests, gbp.websiteClicks, whatsapp.inquiries, whatsapp.conversionRate, whatsapp.responsePerformance]) {
    if (item.dataState !== "READY" && item.note) notes.push(`${item.label}: ${item.note}`);
  }
  if (social.instagram.dataState !== "READY") notes.push("Instagram: connected metrics are unavailable or incomplete for this period.");
  if (social.facebook.dataState !== "READY") notes.push("Facebook: connected metrics are unavailable or incomplete for this period.");
  if (competitors.length === 0) notes.push("Competitors: no configured competitor accounts are available for weekly movement.");
  return Array.from(new Set(notes));
}

function sentimentChanges(current: WeeklyReviewInput[], previous: WeeklyReviewInput[]): SentimentChangeSummary[] {
  const labels = Array.from(new Set([...current.map(sentimentLabel), ...previous.map(sentimentLabel)]));
  return labels
    .map((label) => {
      const currentCount = current.filter((review) => sentimentLabel(review) === label).length;
      const previousCount = previous.filter((review) => sentimentLabel(review) === label).length;
      return { label, current: currentCount, previous: previousCount, change: currentCount - previousCount };
    })
    .filter((item) => item.current || item.previous);
}

function sentimentLabel(review: WeeklyReviewInput) {
  return review.sentiment?.trim().toUpperCase() || (review.rating >= 4 ? "POSITIVE" : review.rating <= 2 ? "NEGATIVE" : "NEUTRAL");
}

function inPeriod(value: string | Date, period: ReportPeriod) {
  const time = new Date(value).getTime();
  return time >= new Date(period.startsAt).getTime() && time <= new Date(period.endsAt).getTime();
}

function totalReachValue(posts: WeeklySocialPostInput[]) {
  return posts.reduce((total, post) => total + numberValue(post.metrics?.reach), 0);
}

function totalEngagementValue(posts: WeeklySocialPostInput[]) {
  return posts.reduce((total, post) => total + engagementValue(post), 0);
}

function engagementValue(post: WeeklySocialPostInput) {
  return numberValue(post.metrics?.likes) + numberValue(post.metrics?.comments) + numberValue(post.metrics?.shares) + numberValue(post.metrics?.saves) + numberValue(post.metrics?.clicks);
}

function averageEngagementRate(posts: WeeklySocialPostInput[]) {
  return average(posts.map((post) => post.metrics?.engagementRate).filter((value): value is number => typeof value === "number" && Number.isFinite(value)));
}

function hasMetrics(posts: WeeklySocialPostInput[]) {
  return posts.some((post) => post.metrics);
}

function numberValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function average(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((total, value) => total + value, 0) / finite.length;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, round(value)));
}

function trimCaption(caption: string | null | undefined) {
  const value = caption?.trim() || "Untitled post";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function summarizePlatform(platform: string, posts: number, engagement: ReportMetric, reach: ReportMetric, dataState: ReportDataState) {
  if (dataState !== "READY") return `${platform} performance is ${dataState.toLowerCase().replace("_", " ")} for this week.`;
  return `${platform} published ${posts} post(s), reaching ${formatNumber(reach.value)} people and generating ${formatNumber(engagement.value)} connected engagements.`;
}

function positiveLine(metric: ReportMetric, text: string) {
  return metric.changeDirection === "UP" ? text : "";
}

function concernLine(metric: ReportMetric, text: string) {
  return metric.changeDirection === "DOWN" ? text : "";
}

function fillList(values: string[], fallback: string) {
  return values.length ? values.slice(0, 3) : [fallback];
}

function describeMetric(metric: ReportMetric, fallback: string) {
  if (metric.dataState !== "READY" || metric.value === null) return fallback;
  const direction = metric.changeDirection === "UNKNOWN" ? "has no prior comparison" : `${metric.changeDirection.toLowerCase()} ${Math.abs(metric.change ?? 0)}%`;
  return `${metric.label} is ${formatNumber(metric.value)} and ${direction}.`;
}

function numericMetric(metrics: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metrics) return null;
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function formatNumber(value: number | null) {
  return value === null ? "unavailable" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
