import type { ReviewDashboardAnalytics } from "@/lib/intelligence/review-analytics";

export type ReputationHealthSubScore = {
  label: string;
  score: number;
  detail: string;
};

export type ReputationHealthScore = {
  total: number;
  label: "Strong" | "Improving" | "Needs focus";
  summary: string;
  subScores: ReputationHealthSubScore[];
};

export type ReviewAcquisitionTarget = {
  type: "Department" | "Doctor";
  name: string;
  priority: "Critical" | "High" | "Medium";
  reason: string;
  requestMoment: string;
  channel: string;
  target: string;
};

export type ReviewCampaign = {
  title: string;
  audience: string;
  channel: "QR" | "WhatsApp" | "Front desk" | "Follow-up";
  owner: string;
  cadence: string;
  script: string;
  safety: string;
};

export type ReviewRecoveryAction = {
  trigger: string;
  owner: string;
  responseSla: string;
  publicReply: string;
  offlineResolution: string;
  serviceAction: string;
};

export type ReviewResponseRecommendation = {
  reviewType: "Positive" | "Neutral" | "Negative" | "Privacy-sensitive" | "Fake or spam";
  goal: string;
  recommendation: string;
  example: string;
};

export type SentimentImprovementAction = {
  topic: string;
  priority: "Critical" | "High" | "Medium";
  action: string;
  owner: string;
  metric: string;
};

export type CompetitorReputationGap = {
  competitor: string;
  ratingGap: string;
  reviewGap: string;
  sentimentGap: string;
  growthGap: string;
  action: string;
};

export type WeeklyReputationRoadmapItem = {
  week: string;
  focus: string;
  actions: string[];
  successMetric: string;
};

export type ReputationExpectedOutcome = {
  metric: string;
  baseline: string;
  target: string;
  note: string;
};

export type ReputationGrowthStrategy = {
  healthScore: ReputationHealthScore;
  acquisitionTargets: ReviewAcquisitionTarget[];
  campaigns: ReviewCampaign[];
  recoveryPlan: ReviewRecoveryAction[];
  amplificationPlan: Array<{ channel: string; action: string; safety: string }>;
  responseRecommendations: ReviewResponseRecommendation[];
  sentimentActions: SentimentImprovementAction[];
  competitorGaps: CompetitorReputationGap[];
  weeklyRoadmap: WeeklyReputationRoadmapItem[];
  expectedOutcomes: ReputationExpectedOutcome[];
};

export function createReputationGrowthStrategy({
  analytics,
  gbpConnected,
}: {
  analytics: ReviewDashboardAnalytics;
  gbpConnected: boolean;
}): ReputationGrowthStrategy {
  const healthScore = buildHealthScore(analytics, gbpConnected);
  const acquisitionTargets = buildAcquisitionTargets(analytics);

  return {
    healthScore,
    acquisitionTargets,
    campaigns: buildCampaigns(acquisitionTargets),
    recoveryPlan: buildRecoveryPlan(analytics),
    amplificationPlan: buildAmplificationPlan(analytics),
    responseRecommendations: buildResponseRecommendations(),
    sentimentActions: buildSentimentActions(analytics),
    competitorGaps: buildCompetitorGaps(analytics),
    weeklyRoadmap: buildWeeklyRoadmap(analytics, acquisitionTargets),
    expectedOutcomes: buildExpectedOutcomes(analytics, healthScore),
  };
}

function buildHealthScore(analytics: ReviewDashboardAnalytics, gbpConnected: boolean): ReputationHealthScore {
  const weakestDepartment = analytics.departments.slice().sort((left, right) => left.rating - right.rating)[0];
  const topCompetitor = analytics.competitors.filter((item) => item.name !== "VIP").sort((left, right) => right.reviews - left.reviews)[0];
  const competitorReviewGap = topCompetitor ? Math.max(0, topCompetitor.reviews - analytics.overview.totalReviews) : 0;
  const rating = clamp((analytics.overview.averageRating / 5) * 100);
  const volume = clamp(Math.min(100, Math.log10(analytics.overview.totalReviews + 1) * 32));
  const sentiment = clamp(analytics.sentiment.positive - analytics.sentiment.negative + 35);
  const freshness = clamp(Math.min(100, analytics.overview.newReviews * 8));
  const response = gbpConnected ? 85 : 45;
  const departmentRisk = weakestDepartment ? clamp((weakestDepartment.rating / 5) * 100 - (weakestDepartment.trend.startsWith("-") ? 12 : 0)) : 50;
  const competitorGap = clamp(100 - Math.min(70, competitorReviewGap / 3));
  const subScores = [
    { label: "Rating", score: Math.round(rating), detail: `${analytics.overview.averageRating.toFixed(1)}/5 average rating.` },
    { label: "Review volume", score: Math.round(volume), detail: `${analytics.overview.totalReviews.toLocaleString("en-IN")} reviews in the current dataset.` },
    { label: "Sentiment", score: Math.round(sentiment), detail: `${analytics.sentiment.positive}% positive and ${analytics.sentiment.negative}% negative.` },
    { label: "Freshness", score: Math.round(freshness), detail: `${analytics.overview.newReviews} reviews in the last 30 days.` },
    { label: "Response readiness", score: response, detail: gbpConnected ? "GBP review access is available." : "GBP review access needs restoration." },
    { label: "Department risk", score: Math.round(departmentRisk), detail: weakestDepartment ? `${weakestDepartment.department} is the weakest department signal.` : "No department baseline available." },
    { label: "Competitor gap", score: Math.round(competitorGap), detail: topCompetitor ? `${topCompetitor.name} review gap: ${competitorReviewGap.toLocaleString("en-IN")}.` : "No competitor baseline available." },
  ];
  const total = Math.round(subScores.reduce((sum, item) => sum + item.score, 0) / subScores.length);
  const label = total >= 75 ? "Strong" : total >= 58 ? "Improving" : "Needs focus";

  return {
    total,
    label,
    summary: `${label} reputation health: prioritize ${weakestDepartment?.department ?? "department"} reviews, response coverage, and competitor gap closure.`,
    subScores,
  };
}

function buildAcquisitionTargets(analytics: ReviewDashboardAnalytics): ReviewAcquisitionTarget[] {
  const departmentTargets = analytics.departments
    .map((department): ReviewAcquisitionTarget => {
      const weakRating = department.rating < 4.2;
      const weakVolume = department.reviews < 35;
      const negativeTrend = department.trend.startsWith("-");
      return {
        type: "Department",
        name: department.department,
        priority: weakRating || negativeTrend ? "High" : weakVolume ? "Medium" : "Medium",
        reason: `${department.rating.toFixed(1)}/5 rating, ${department.reviews} reviews, ${department.trend} trend.`,
        requestMoment: requestMomentForDepartment(department.department),
        channel: weakRating ? "Front desk handoff + WhatsApp follow-up" : "QR + WhatsApp follow-up",
        target: weakRating ? "+8-12 balanced reviews this month" : "+5-8 fresh reviews this month",
      };
    })
    .sort(prioritySort);

  const doctorTargets: ReviewAcquisitionTarget[] = [
    {
      type: "Doctor",
      name: "Dr. Harika",
      priority: "High",
      reason: "Known doctor profile. Owned review tagging is needed for precise doctor-level scoring.",
      requestMoment: "After consultations where the patient received clear next steps and no active complaint is open.",
      channel: "Doctor-safe staff handoff + QR card",
      target: "+10 fresh doctor-mention reviews this month",
    },
    {
      type: "Doctor",
      name: "ENT consultation team",
      priority: "Medium",
      reason: "Doctor clarity is a recurring trust theme in review analytics.",
      requestMoment: "After routine ENT consultation completion.",
      channel: "WhatsApp follow-up",
      target: "+6 consultation-specific reviews this month",
    },
  ];

  return [...departmentTargets, ...doctorTargets];
}

function buildCampaigns(targets: ReviewAcquisitionTarget[]): ReviewCampaign[] {
  const topDepartment = targets.find((target) => target.type === "Department");
  const topDoctor = targets.find((target) => target.type === "Doctor");
  return [
    {
      title: `${topDepartment?.name ?? "Department"} review lift`,
      audience: `Eligible ${topDepartment?.name ?? "department"} patients after completed visits.`,
      channel: "QR",
      owner: "Front desk",
      cadence: "Daily during checkout",
      script: "Your feedback helps us improve patient experience. If you are comfortable, this QR code opens our Google review page.",
      safety: "Do not suggest a rating or ask only happy patients.",
    },
    {
      title: `${topDoctor?.name ?? "Doctor"} trust signal campaign`,
      audience: "Patients who received clear consultation guidance and have no unresolved service issue.",
      channel: "WhatsApp",
      owner: "Reputation",
      cadence: "Same day or next morning",
      script: "Thank you for visiting. Your feedback helps other families understand the care experience and helps our team improve.",
      safety: "Keep the message general; do not mention diagnosis, procedure, or treatment details.",
    },
    {
      title: "Negative sentiment prevention follow-up",
      audience: "Patients affected by delay, billing confusion, or appointment coordination friction.",
      channel: "Follow-up",
      owner: "Patient experience",
      cadence: "Within 24 hours of flagged visit",
      script: "We noticed your visit may not have been as smooth as expected. Our team would like to understand and help resolve the issue.",
      safety: "Use private feedback before public review request when a service concern is known.",
    },
    {
      title: "Front desk review handoff",
      audience: "Patients leaving after routine, completed interactions.",
      channel: "Front desk",
      owner: "Operations",
      cadence: "Every eligible checkout",
      script: "If you would like to share feedback, this card has the review link. It is optional and helps us improve.",
      safety: "No pressure, no reward, no filtering by expected sentiment.",
    },
  ];
}

function buildRecoveryPlan(analytics: ReviewDashboardAnalytics): ReviewRecoveryAction[] {
  const weakestTopics = analytics.topics.slice().sort((left, right) => left.score - right.score).slice(0, 3);
  return weakestTopics.map((topic) => ({
    trigger: `${topic.topic} sentiment is ${topic.sentiment.toLowerCase()} at ${topic.score}/100.`,
    owner: topic.topic === "Billing" ? "Billing lead" : topic.topic === "Waiting time" ? "Front desk lead" : "Patient experience",
    responseSla: "Same day for 1-2 star reviews; next business day for 3-star reviews.",
    publicReply: "Acknowledge the concern, thank them for the feedback, and invite private follow-up without confirming patient identity.",
    offlineResolution: `Call or message privately to understand the ${topic.topic.toLowerCase()} issue and document the service recovery outcome.`,
    serviceAction: sentimentServiceAction(topic.topic),
  }));
}

function buildAmplificationPlan(analytics: ReviewDashboardAnalytics) {
  const positiveTopics = analytics.topics.filter((topic) => topic.sentiment === "Positive").slice(0, 3);
  const proofTheme = positiveTopics.map((topic) => topic.topic).join(", ") || "doctor clarity, staff support, and facilities";
  return [
    { channel: "GBP posts", action: `Create weekly proof posts around ${proofTheme}.`, safety: "Use theme-level language, not patient-identifying quotes." },
    { channel: "Website", action: "Add anonymized trust points near appointment CTAs and centre pages.", safety: "Avoid clinical outcome claims or implied guaranteed results." },
    { channel: "Social", action: "Turn positive review themes into doctor-led educational reels or staff-process posts.", safety: "Do not show patient details without documented consent." },
    { channel: "WhatsApp", action: "Share simple reputation proof in appointment follow-up templates.", safety: "Keep it factual and avoid pressure to review." },
  ];
}

function buildResponseRecommendations(): ReviewResponseRecommendation[] {
  return [
    {
      reviewType: "Positive",
      goal: "Reinforce trust and warmth.",
      recommendation: "Thank the reviewer, mention the team generally, and avoid adding medical details.",
      example: "Thank you for sharing your experience. Our team is glad the visit felt clear and supportive.",
    },
    {
      reviewType: "Neutral",
      goal: "Recover the middle ground.",
      recommendation: "Acknowledge what worked, invite improvement feedback, and route privately.",
      example: "Thank you for the feedback. We appreciate the note and would like to understand what could have been smoother.",
    },
    {
      reviewType: "Negative",
      goal: "Show accountability without public argument.",
      recommendation: "Apologize for the experience, avoid defensiveness, and offer a private resolution path.",
      example: "We are sorry the experience did not meet expectations. Please contact our team so we can understand and address this properly.",
    },
    {
      reviewType: "Privacy-sensitive",
      goal: "Avoid protected health information risk.",
      recommendation: "Do not confirm the person was a patient or discuss visit, diagnosis, procedure, billing, or treatment details.",
      example: "Thank you for raising this. Please contact the hospital directly so the appropriate team can review the concern privately.",
    },
    {
      reviewType: "Fake or spam",
      goal: "Protect the listing without public escalation.",
      recommendation: "Do not accuse publicly. Document evidence, flag through Google, and keep public response minimal if needed.",
      example: "We take feedback seriously and are unable to verify this experience from the information provided. Please contact us directly.",
    },
  ];
}

function buildSentimentActions(analytics: ReviewDashboardAnalytics): SentimentImprovementAction[] {
  return analytics.topics
    .slice()
    .sort((left, right) => left.score - right.score)
    .map((topic): SentimentImprovementAction => ({
      topic: topic.topic,
      priority: topic.score < 60 ? "Critical" : topic.score < 78 ? "High" : "Medium",
      action: sentimentServiceAction(topic.topic),
      owner: ownerForTopic(topic.topic),
      metric: `Move ${topic.topic} from ${topic.score}/100 to ${Math.min(90, topic.score + 8)}/100.`,
    }));
}

function buildCompetitorGaps(analytics: ReviewDashboardAnalytics): CompetitorReputationGap[] {
  const vip = analytics.competitors.find((competitor) => competitor.name === "VIP") ?? analytics.competitors[0];
  return analytics.competitors
    .filter((competitor) => competitor.name !== vip.name)
    .map((competitor) => {
      const reviewGap = competitor.reviews - vip.reviews;
      const ratingGap = competitor.rating - vip.rating;
      const sentimentGap = competitor.sentiment - vip.sentiment;
      const growthGap = competitor.growth - vip.growth;
      return {
        competitor: competitor.name,
        ratingGap: ratingGap > 0 ? `Behind by ${ratingGap.toFixed(1)}` : `Ahead by ${Math.abs(ratingGap).toFixed(1)}`,
        reviewGap: reviewGap > 0 ? `Behind by ${reviewGap.toLocaleString("en-IN")}` : `Ahead by ${Math.abs(reviewGap).toLocaleString("en-IN")}`,
        sentimentGap: sentimentGap > 0 ? `Behind by ${sentimentGap}%` : `Ahead by ${Math.abs(sentimentGap)}%`,
        growthGap: growthGap > 0 ? `Behind by ${growthGap}%` : `Ahead by ${Math.abs(growthGap)}%`,
        action: reviewGap > 0
          ? "Run centre-specific review request campaigns until the public volume gap narrows."
          : "Maintain response speed and amplify positive proof to preserve the lead.",
      };
    });
}

function buildWeeklyRoadmap(analytics: ReviewDashboardAnalytics, targets: ReviewAcquisitionTarget[]): WeeklyReputationRoadmapItem[] {
  const topTarget = targets[0];
  const weakTopic = analytics.topics.slice().sort((left, right) => left.score - right.score)[0];
  return [
    {
      week: "Week 1",
      focus: "Set up command center",
      actions: ["Confirm GBP access", "Verify review link and QR", "Create response templates", `Brief ${topTarget?.name ?? "priority department"} request workflow`],
      successMetric: "Review request workflow live and first response SLA dashboard ready.",
    },
    {
      week: "Week 2",
      focus: "Launch acquisition campaigns",
      actions: ["Start QR handoff", "Send WhatsApp follow-ups", "Track department review counts", "Review daily response queue"],
      successMetric: "Target +5-8 fresh reviews and all new reviews triaged.",
    },
    {
      week: "Week 3",
      focus: "Fix sentiment friction",
      actions: [`Run ${weakTopic?.topic ?? "weakest topic"} service improvement huddle`, "Assign recovery tasks", "Audit neutral and negative review themes"],
      successMetric: "At least one service friction action completed and measured.",
    },
    {
      week: "Week 4",
      focus: "Amplify proof and compare competitors",
      actions: ["Publish GBP proof post", "Refresh website trust copy", "Compare competitor gaps", "Choose next month department target"],
      successMetric: "Target +20-30 fresh reviews in 30 days and response coverage above 90%.",
    },
  ];
}

function buildExpectedOutcomes(analytics: ReviewDashboardAnalytics, healthScore: ReputationHealthScore): ReputationExpectedOutcome[] {
  const ratingTarget = Math.min(4.8, analytics.overview.averageRating + 0.2);
  return [
    {
      metric: "Rating improvement",
      baseline: `${analytics.overview.averageRating.toFixed(1)}/5`,
      target: `Target ${ratingTarget.toFixed(1)}/5 in 60-90 days`,
      note: "Target assumes fresh balanced reviews and fewer repeated complaint themes.",
    },
    {
      metric: "Review volume increase",
      baseline: `${analytics.overview.totalReviews.toLocaleString("en-IN")} reviews`,
      target: "Target +20-30 fresh reviews in 30 days",
      note: "Run broad, ethical requests across priority departments and doctor-led visits.",
    },
    {
      metric: "Trust improvement",
      baseline: `${healthScore.total}/100 health score`,
      target: `Target ${Math.min(92, healthScore.total + 10)}/100`,
      note: "Improves through rating quality, freshness, response coverage, and positive proof reuse.",
    },
    {
      metric: "Response coverage",
      baseline: analytics.overview.responseReadiness,
      target: "Target above 90% response coverage",
      note: "Requires owned GBP review queue and daily response rhythm.",
    },
    {
      metric: "Complaint reduction",
      baseline: `${analytics.sentiment.negative}% negative sentiment`,
      target: `Target ${Math.max(3, analytics.sentiment.negative - 5)}% negative sentiment`,
      note: "Depends on service recovery for waiting time, billing, staff communication, and follow-up themes.",
    },
  ];
}

function requestMomentForDepartment(department: string) {
  if (department.includes("Billing")) return "After billing explanation is complete and no dispute is open.";
  if (department.includes("Front Desk")) return "After checkout when appointment coordination was smooth.";
  if (department.includes("Follow-up")) return "After follow-up instructions are clearly explained.";
  if (department.includes("Audiology")) return "After hearing test explanation and next-step handoff.";
  return "After consultation completion when the patient has clear next steps.";
}

function sentimentServiceAction(topic: string) {
  if (topic === "Waiting time") return "Send delay updates, add check-in expectation script, and review peak-hour staffing.";
  if (topic === "Billing") return "Explain billing before payment, give a printed summary, and route disputes privately.";
  if (topic === "Staff") return "Coach front desk on warm handoff, queue updates, and escalation language.";
  if (topic === "Doctors") return "Reinforce clear next-step explanations and post-consultation summary handoff.";
  if (topic === "Facilities") return "Audit waiting area comfort, signage, cleanliness, and patient flow.";
  return "Assign one owner to review the theme weekly and close the service loop.";
}

function ownerForTopic(topic: string) {
  if (topic === "Billing") return "Billing lead";
  if (topic === "Waiting time" || topic === "Staff") return "Front desk lead";
  if (topic === "Doctors" || topic === "Treatment quality") return "Doctor lead";
  return "Operations";
}

function prioritySort(left: ReviewAcquisitionTarget, right: ReviewAcquisitionTarget) {
  const score = { Critical: 0, High: 1, Medium: 2 };
  return score[left.priority] - score[right.priority];
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
