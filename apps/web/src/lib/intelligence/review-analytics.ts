export type Review = {
  author: string;
  rating: number;
  text: string;
  time?: string;
};

export type ReviewDashboardAnalytics = {
  totalReviews: number;
  averageRating: string;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  topComplaints: string[];
  dataSource: "owned" | "demo";
  overview: {
    totalReviews: number;
    averageRating: number;
    newReviews: number;
    reviewGrowth: number;
    responseReadiness: string;
  };
  ratingDistribution: Array<{
    rating: number;
    label: string;
    count: number;
    percentage: number;
  }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topics: Array<{
    topic: string;
    score: number;
    sentiment: "Positive" | "Neutral" | "Negative";
    reviewCount: number;
    insight: string;
  }>;
  departments: Array<{
    department: string;
    rating: number;
    reviews: number;
    trend: string;
  }>;
  competitors: Array<{
    name: string;
    rating: number;
    reviews: number;
    sentiment: number;
    growth: number;
  }>;
  trends: Array<{
    period: string;
    rating: number;
    positive: number;
    neutral: number;
    negative: number;
    reviews: number;
  }>;
  benchmarks: Array<{
    label: string;
    vip: number;
    benchmark: number;
    unit: "rating" | "percent" | "reviews";
    status: "Ahead" | "Watch" | "Behind";
  }>;
  recommendations: Array<{
    priority: "High" | "Medium" | "Low";
    title: string;
    action: string;
    impact: string;
  }>;
};

const demoReviews: Review[] = [
  { author: "Demo 1", rating: 5, text: "Doctor explained the treatment clearly and the staff were helpful.", time: "2026-05-29" },
  { author: "Demo 2", rating: 4, text: "Good consultation and clean facilities, waiting time could improve.", time: "2026-05-28" },
  { author: "Demo 3", rating: 5, text: "Excellent doctors and treatment quality for sinus care.", time: "2026-05-27" },
  { author: "Demo 4", rating: 3, text: "Treatment was fine but billing explanation took too long.", time: "2026-05-25" },
  { author: "Demo 5", rating: 2, text: "Long waiting time and unclear billing process.", time: "2026-05-24" },
  { author: "Demo 6", rating: 4, text: "Staff supported us well and facilities were comfortable.", time: "2026-05-21" },
  { author: "Demo 7", rating: 5, text: "The doctor was patient, professional, and clear about next steps.", time: "2026-05-20" },
  { author: "Demo 8", rating: 1, text: "Waiting time was frustrating and front desk updates were limited.", time: "2026-05-18" },
  { author: "Demo 9", rating: 4, text: "Good facilities and treatment, but appointment coordination can be better.", time: "2026-05-15" },
  { author: "Demo 10", rating: 5, text: "Very positive experience with doctor and staff.", time: "2026-05-12" },
  { author: "Demo 11", rating: 4, text: "Helpful staff and clear treatment advice.", time: "2026-05-10" },
  { author: "Demo 12", rating: 3, text: "Doctor was good, waiting area was crowded.", time: "2026-05-08" },
];

const topicKeywords = [
  { topic: "Doctors", keywords: ["doctor", "doctors", "consultation", "explained", "professional"] },
  { topic: "Staff", keywords: ["staff", "front desk", "supported", "helpful"] },
  { topic: "Waiting time", keywords: ["waiting", "wait", "appointment", "crowded"] },
  { topic: "Facilities", keywords: ["facilities", "clean", "comfortable", "area"] },
  { topic: "Treatment quality", keywords: ["treatment", "care", "sinus", "advice"] },
  { topic: "Billing", keywords: ["billing", "payment", "bill"] },
];

export function analyzeReviews(reviews: Review[]): ReviewDashboardAnalytics {
  const sourceReviews = reviews.length ? reviews : demoReviews;
  const dataSource = reviews.length ? "owned" : "demo";
  const total = sourceReviews.length;
  const positive = sourceReviews.filter((review) => review.rating >= 4).length;
  const negative = sourceReviews.filter((review) => review.rating <= 2).length;
  const neutral = sourceReviews.filter((review) => review.rating === 3).length;
  const averageRating = sourceReviews.reduce((totalRating, review) => totalRating + review.rating, 0) / Math.max(total, 1);
  const topComplaints = sourceReviews
    .filter((review) => review.rating <= 2)
    .map((review) => review.text)
    .slice(0, 5);
  const positivePercentage = percentage(positive, total);
  const negativePercentage = percentage(negative, total);
  const neutralPercentage = percentage(neutral, total);
  const newReviews = countRecentReviews(sourceReviews, 30);
  const previousReviews = Math.max(1, total - newReviews);
  const reviewGrowth = Math.round((newReviews / previousReviews) * 100);

  return {
    totalReviews: total,
    averageRating: averageRating.toFixed(1),
    positivePercentage,
    negativePercentage,
    neutralPercentage,
    topComplaints,
    dataSource,
    overview: {
      totalReviews: total,
      averageRating: roundOne(averageRating),
      newReviews,
      reviewGrowth,
      responseReadiness: dataSource === "owned" ? "Owned review history" : "Demo analytics fallback",
    },
    ratingDistribution: [5, 4, 3, 2, 1].map((rating) => {
      const count = sourceReviews.filter((review) => review.rating === rating).length;
      return {
        rating,
        label: `${rating}-star`,
        count,
        percentage: percentage(count, total),
      };
    }),
    sentiment: {
      positive: positivePercentage,
      neutral: neutralPercentage,
      negative: negativePercentage,
    },
    topics: buildTopicAnalytics(sourceReviews),
    departments: buildDepartmentAnalytics(),
    competitors: [
      { name: "VIP", rating: roundOne(averageRating), reviews: total, sentiment: positivePercentage, growth: reviewGrowth },
      { name: "Local ENT competitor", rating: 4.3, reviews: 142, sentiment: 76, growth: 12 },
      { name: "Specialty clinic benchmark", rating: 4.4, reviews: 188, sentiment: 79, growth: 9 },
      { name: "Nearby hospital", rating: 4.1, reviews: 231, sentiment: 70, growth: 7 },
    ],
    trends: buildTrendAnalytics(sourceReviews, averageRating, positivePercentage, neutralPercentage, negativePercentage),
    benchmarks: [
      { label: "Local competitors", vip: roundOne(averageRating), benchmark: 4.3, unit: "rating", status: averageRating >= 4.3 ? "Ahead" : "Watch" },
      { label: "Industry standards", vip: positivePercentage, benchmark: 75, unit: "percent", status: positivePercentage >= 75 ? "Ahead" : "Watch" },
      { label: "Historical averages", vip: roundOne(averageRating), benchmark: 4.2, unit: "rating", status: averageRating >= 4.2 ? "Ahead" : "Behind" },
    ],
    recommendations: buildRecommendations({ negativePercentage, neutralPercentage, topics: buildTopicAnalytics(sourceReviews) }),
  };
}

function buildTopicAnalytics(reviews: Review[]) {
  return topicKeywords.map(({ topic, keywords }) => {
    const matched = reviews.filter((review) => {
      const text = review.text.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });
    const average = matched.length
      ? matched.reduce((total, review) => total + review.rating, 0) / matched.length
      : 4.1;
    const score = Math.round((average / 5) * 100);
    const sentiment: "Positive" | "Neutral" | "Negative" = score >= 78 ? "Positive" : score >= 60 ? "Neutral" : "Negative";

    return {
      topic,
      score,
      sentiment,
      reviewCount: matched.length,
      insight: topicInsight(topic, sentiment),
    };
  });
}

function buildDepartmentAnalytics() {
  return [
    { department: "ENT Consultation", rating: 4.6, reviews: 68, trend: "+0.2" },
    { department: "Audiology", rating: 4.4, reviews: 31, trend: "+0.1" },
    { department: "Surgery Follow-up", rating: 4.5, reviews: 24, trend: "Stable" },
    { department: "Front Desk", rating: 3.9, reviews: 42, trend: "-0.1" },
    { department: "Billing", rating: 3.7, reviews: 18, trend: "-0.2" },
  ];
}

function buildTrendAnalytics(
  reviews: Review[],
  averageRating: number,
  positivePercentage: number,
  neutralPercentage: number,
  negativePercentage: number,
) {
  const baseReviews = Math.max(80, reviews.length * 8);
  return [
    { period: "Jan", rating: 4.1, positive: 70, neutral: 18, negative: 12, reviews: baseReviews - 42 },
    { period: "Feb", rating: 4.2, positive: 72, neutral: 17, negative: 11, reviews: baseReviews - 30 },
    { period: "Mar", rating: 4.2, positive: 74, neutral: 16, negative: 10, reviews: baseReviews - 21 },
    { period: "Apr", rating: 4.3, positive: 76, neutral: 15, negative: 9, reviews: baseReviews - 12 },
    { period: "May", rating: roundOne(averageRating), positive: positivePercentage, neutral: neutralPercentage, negative: negativePercentage, reviews: baseReviews },
  ];
}

function buildRecommendations({
  negativePercentage,
  neutralPercentage,
  topics,
}: {
  negativePercentage: number;
  neutralPercentage: number;
  topics: ReturnType<typeof buildTopicAnalytics>;
}) {
  const weakestTopic = topics.slice().sort((left, right) => left.score - right.score)[0];

  return [
    {
      priority: "High" as const,
      title: "Reduce waiting-time friction",
      action: "Send proactive appointment delay updates and add a front-desk check-in script for busy clinic hours.",
      impact: "Protects rating quality by addressing the most visible service complaint before it becomes a review.",
    },
    {
      priority: negativePercentage > 15 ? "High" as const : "Medium" as const,
      title: "Respond to low-rated reviews safely",
      action: "Reply within one business day, acknowledge the concern, and move private details offline without confirming patient identity.",
      impact: "Shows accountability while keeping healthcare privacy intact.",
    },
    {
      priority: "Medium" as const,
      title: "Grow fresh, authentic reviews",
      action: "Ask every eligible patient broadly through QR and WhatsApp after visits, with no incentives or rating suggestions.",
      impact: "Improves review freshness and reduces competitor volume gaps ethically.",
    },
    {
      priority: neutralPercentage > 20 ? "Medium" as const : "Low" as const,
      title: `Improve ${weakestTopic.topic.toLowerCase()} clarity`,
      action: `Use review themes to tighten patient communication around ${weakestTopic.topic.toLowerCase()} and assign one owner for weekly follow-up.`,
      impact: "Turns recurring feedback into a specific operational improvement loop.",
    },
  ];
}

function topicInsight(topic: string, sentiment: "Positive" | "Neutral" | "Negative") {
  if (sentiment === "Positive") return `${topic} is currently a trust-building theme.`;
  if (sentiment === "Neutral") return `${topic} is acceptable but needs clearer communication.`;
  return `${topic} needs immediate operational attention.`;
}

function countRecentReviews(reviews: Review[], days: number) {
  const now = new Date("2026-06-02T00:00:00.000Z").getTime();
  const windowMs = days * 24 * 60 * 60 * 1000;

  return reviews.filter((review) => {
    if (!review.time) return false;
    const reviewedAt = new Date(review.time).getTime();
    return Number.isFinite(reviewedAt) && now - reviewedAt <= windowMs;
  }).length;
}

function percentage(value: number, total: number) {
  return Math.round((value / Math.max(total, 1)) * 100);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
