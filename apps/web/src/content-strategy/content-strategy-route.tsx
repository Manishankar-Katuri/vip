import { ContentStrategyPage } from "@/content-strategy/production-content-strategy";
import {
  buildEditorialPlan,
  type ContentIntelligenceInput,
  type PlatformTimingEvidence,
  type StrategyEvidence,
} from "@/lib/content-strategy/editorial-plan";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { getProductExperience } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";

export async function ContentStrategyRoute() {
  const today = indiaDate(new Date());
  const data = await getProductExperience();
  const analytics = data.analytics;
  const bestTime = analytics?.bestPostingTimes[0];
  const bestFormat = analytics?.contentTypeBreakdown.formats
    .slice()
    .sort((left, right) => right.avgEngagementRate - left.avgEngagementRate)[0];
  const bestPillar = analytics?.contentTypeBreakdown.pillars
    .slice()
    .sort((left, right) => right.avgPerformanceScore - left.avgPerformanceScore)[0];
  const topPost = analytics?.topPosts[0];
  const hashtag = analytics?.hashtagPerformance[0];
  const market = data.intelligence?.marketContext;
  const hasMeasuredTiming = Boolean(bestTime && bestTime.postCount >= 3);
  const timingEvidence = timingEvidenceFor(bestTime);
  const evidence: StrategyEvidence = {
    recommendedWindow: hasMeasuredTiming && bestTime ? `${clock(bestTime.hourOfDay)} IST` : "1:00 PM IST",
    timingConfidence: hasMeasuredTiming ? 78 : bestTime ? 58 : 52,
    timingSource: hasMeasuredTiming ? "measured" : "benchmark",
    timingEvidence,
    timingOptions: {
      Instagram: measuredInstagramTimingOptions(analytics?.bestPostingTimes, timingEvidence),
      Facebook: benchmarkTimingOptions("Facebook", "family and caregiver reach"),
      "Google Business Profile": benchmarkTimingOptions("Google Business Profile", "local search and appointment-access clarity"),
      YouTube: benchmarkTimingOptions("YouTube", "evergreen doctor-led explainers"),
      WhatsApp: benchmarkTimingOptions("WhatsApp", "approved community forwarding and staff response readiness"),
    },
    platformWindows: {
      Instagram: {
        window: hasMeasuredTiming && bestTime ? `${clock(bestTime.hourOfDay)} IST` : "1:00 PM IST",
        confidence: hasMeasuredTiming ? 78 : bestTime ? 58 : 52,
        source: hasMeasuredTiming ? "measured" : "benchmark",
        evidence: timingEvidence,
      } satisfies PlatformTimingEvidence,
    },
    formatEvidence: bestFormat
      ? `${friendly(bestFormat.contentType)} leads stored content formats at ${percent(bestFormat.avgEngagementRate)} average engagement.`
      : "Format response is using benchmark-led planning until enough measured posts are available.",
    engagementEvidence: data.measuredNarrative,
    audienceEvidence: data.audienceInsights.length
      ? `${data.audienceInsights.length} stored audience observations inform language and targeting choices.`
      : "Audience observations are not fully connected yet; planning stays conservative and local-context led.",
    measuredPostCount: analytics?.totalPosts,
    avgEngagementRate: analytics?.avgEngagementRate,
    bestFormat: bestFormat ? friendly(bestFormat.contentType) : undefined,
    topHashtag: hashtag?.tag,
    competitorEvidence: competitorEvidenceFrom(data.intelligence?.competitors),
  };

  const plansByHospital = Object.fromEntries(
    DEMO_HOSPITALS.map((hospital) => {
      const isHarika = hospital.id === "harika-ent-care-hospitals";
      return [
        hospital.id,
        buildEditorialPlan(
          today,
          contentInputForHospital(hospital, isHarika ? {
            marketThemes: market?.recommendedThemes ?? [],
            healthcareSignals: market?.healthcareSignals.slice(0, 3).map((signal) => signal.title) ?? [],
            opportunitySignals: market?.opportunitySignals.slice(0, 3).map((signal) => signal.title) ?? [],
            audienceSignals: market?.audienceInsights ?? [],
            recommendations: data.recommendations.slice(0, 4).map((recommendation) => recommendation.title),
          } : {}),
          isHarika ? evidence : benchmarkEvidenceForHospital(hospital),
        ),
      ];
    }),
  );
  const plan = plansByHospital["harika-ent-care-hospitals"];
  const sourceStatusByHospital = Object.fromEntries(
    DEMO_HOSPITALS.map((hospital) => [
      hospital.id,
      hospital.id === "harika-ent-care-hospitals"
        ? (hasMeasuredTiming ? "VIP measured timing active" : "Benchmark timing tests active")
        : `${hospital.specialty ?? "Client"} strategy generated`,
    ]),
  );
  const sourceToneByHospital = Object.fromEntries(
    DEMO_HOSPITALS.map((hospital) => [
      hospital.id,
      hospital.id === "harika-ent-care-hospitals" && hasMeasuredTiming ? "success" : "info",
    ]),
  ) as Record<string, "neutral" | "info" | "success" | "warning">;

  return (
    <ContentStrategyPage
      plan={plan}
      plansByHospital={plansByHospital}
      metrics={[
        {
          label: "Posts measured",
          value: analytics ? integer(analytics.totalPosts) : "0",
          detail: analytics ? `${data.workspaceName} is feeding strategy decisions.` : "No measured social workspace is available yet.",
          tone: analytics ? "success" : "warning",
        },
        {
          label: "Best timing basis",
          value: hasMeasuredTiming && bestTime ? `${bestTime.dayLabel}, ${clock(bestTime.hourOfDay)}` : "Benchmark test",
          detail: hasMeasuredTiming ? "VIP measured timing is strong enough to override generic benchmarks." : "External benchmarks are labeled as tests until VIP evidence is stronger.",
          tone: hasMeasuredTiming ? "success" : "warning",
        },
        {
          label: "Strongest format",
          value: bestFormat ? friendly(bestFormat.contentType) : "Pending",
          detail: bestFormat ? `${percent(bestFormat.avgEngagementRate)} average engagement in stored history.` : "Format mix will update after connected content performance is available.",
          tone: bestFormat ? "success" : "warning",
        },
        {
          label: "Recommendations used",
          value: integer(data.recommendations.length),
          detail: data.recommendations.length ? "Current VIP recommendation intelligence is included in topic ranking." : "The plan uses analytics and benchmarks until recommendations are available.",
          tone: data.recommendations.length ? "info" : "warning",
        },
      ]}
      signals={[
        {
          label: "Top post evidence",
          value: topPost ? shortCaption(topPost.caption) : "No top post connected",
          detail: topPost ? `${integer(topPost.reach)} reach, ${percent(topPost.engagementRate)} engagement.` : "Top-post evidence will appear after social analytics are connected.",
        },
        {
          label: "Best posting window",
          value: bestTime ? `${bestTime.dayLabel} at ${clock(bestTime.hourOfDay)}` : "Benchmark-led timing",
          detail: bestTime ? `${bestTime.postCount} measured posts, ${percent(bestTime.avgEngagementRate)} average engagement.` : "Sprout, Buffer and Hootsuite benchmarks provide a starting test.",
        },
        {
          label: "Strongest format",
          value: bestFormat ? friendly(bestFormat.contentType) : "Benchmark-led format mix",
          detail: bestFormat ? `${bestFormat.postCount} posts measured for this format.` : "Reels, carousels, GBP updates, Shorts and WhatsApp cards stay active modeled channels.",
        },
        {
          label: "Hashtag or topic signal",
          value: hashtag ? `#${hashtag.tag}` : bestPillar ? friendly(bestPillar.pillar) : "ENT education themes",
          detail: hashtag ? `${hashtag.postCount} posts, ${percent(hashtag.avgEngagementRate)} average engagement.` : "Theme ranking uses ENT specialty, local seasonality and official health moments.",
        },
        {
          label: "Recommendation intelligence",
          value: data.recommendations[0]?.title ?? "No persisted recommendation",
          detail: data.recommendations[0]?.evidence ?? "Fallback recommendations are derived from measured analytics where available.",
        },
        {
          label: "Local market and seasonal context",
          value: market?.recommendedThemes[0] ?? "Hyderabad ENT seasonal planning",
          detail: market?.healthcareSignals[0]?.title ?? "Monsoon, hearing, throat health, safe-care education and verified access are used as context.",
        },
      ]}
      sourceStatus={hasMeasuredTiming ? "VIP measured timing active" : "Benchmark timing tests active"}
      sourceTone={hasMeasuredTiming ? "success" : "warning"}
      sourceStatusByHospital={sourceStatusByHospital}
      sourceToneByHospital={sourceToneByHospital}
    />
  );
}

function contentInputForHospital(
  hospital: (typeof DEMO_HOSPITALS)[number],
  intelligence: Partial<Pick<ContentIntelligenceInput, "marketThemes" | "healthcareSignals" | "opportunitySignals" | "audienceSignals" | "recommendations">>,
): ContentIntelligenceInput {
  if (hospital.id === "harika-ent-care-hospitals") {
    return {
      hospitalSpecialty: hospitalProfile.specialty,
      hospitalPromise: hospitalProfile.promise,
      languages: hospitalProfile.languages,
      channels: hospitalProfile.channels,
      locations: hospitalProfile.locations.map((location) => location.name),
      marketThemes: intelligence.marketThemes ?? [],
      healthcareSignals: intelligence.healthcareSignals ?? [],
      opportunitySignals: intelligence.opportunitySignals ?? [],
      audienceSignals: intelligence.audienceSignals ?? [],
      recommendations: intelligence.recommendations ?? [],
    };
  }

  if (hospital.id === "aayu-geriatrics") {
    return {
      hospitalSpecialty: "Geriatrics",
      hospitalPromise: "Practical elderly care guidance for families and caregivers.",
      languages: ["English", "Telugu"],
      channels: ["Instagram", "Facebook", "Google Business Profile", "YouTube", "WhatsApp"],
      locations: [hospital.city ?? "Hyderabad"],
      marketThemes: ["Healthy ageing", "Caregiver education", "Medicine safety", "Fall prevention"],
      healthcareSignals: ["Families need simple warning signs for elderly parents.", "Caregivers need checklists before consultations."],
      opportunitySignals: ["Make elderly-care education saveable and family-forwardable.", "Use local access posts for geriatric consultation clarity."],
      audienceSignals: ["Adult children", "Caregivers", "Senior citizens"],
      recommendations: ["Build caregiver-first education content around falls, medicines, memory and function."],
    };
  }

  return {
    hospitalSpecialty: hospital.specialty ?? "Multispecialty",
    hospitalPromise: "Clear care navigation and preventive health guidance for families.",
    languages: ["English", "Telugu"],
    channels: ["Instagram", "Facebook", "Google Business Profile", "YouTube", "WhatsApp"],
    locations: [hospital.city ?? "Vijayawada"],
    marketThemes: ["Family health", "Preventive checkups", "Emergency warning signs", "Follow-up care"],
    healthcareSignals: ["Families need simple guidance on when to seek medical attention.", "Preventive checkups and follow-ups are broad multispecialty content opportunities."],
    opportunitySignals: ["Create saveable safety posts and care-navigation reels.", "Clarify verified hospital access for local search visitors."],
    audienceSignals: ["Families", "Working adults", "Caregivers"],
    recommendations: ["Use broad, clinically safe content around fever, emergencies, checkups and follow-up care."],
  };
}

function benchmarkEvidenceForHospital(hospital: (typeof DEMO_HOSPITALS)[number]): StrategyEvidence {
  return {
    recommendedWindow: "7:00 PM IST",
    timingConfidence: 48,
    timingSource: "benchmark",
    timingEvidence: `${hospital.name} does not have enough connected social performance history yet. Use this as a starting test and replace it with measured client timing after publishing data is available.`,
    timingOptions: {
      Instagram: benchmarkTimingOptions("Instagram", `${hospital.specialty ?? "specialty"} discovery and saves`),
      Facebook: benchmarkTimingOptions("Facebook", "family reach and community sharing"),
      "Google Business Profile": benchmarkTimingOptions("Google Business Profile", "local discovery and verified access"),
      YouTube: benchmarkTimingOptions("YouTube", "doctor-led evergreen education"),
      WhatsApp: benchmarkTimingOptions("WhatsApp", "approved direct sharing"),
    },
    audienceEvidence: `${hospital.name} plan is generated from client specialty, city, target audience and available planning signals.`,
    formatEvidence: "Use reels, carousels, GBP updates, Shorts and WhatsApp cards as starting formats until client-specific format performance is measured.",
    engagementEvidence: "Engagement learning begins after approved posts are published and measured for this client.",
    measuredPostCount: 0,
    competitorEvidence: [
      `${hospital.name} competitor data is not connected yet; use local specialty topic gaps as a benchmark starting point.`,
      "Track competitor education formats after publishing begins.",
    ],
  };
}

function competitorEvidenceFrom(value: unknown) {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const patterns = Array.isArray(record.patterns) ? record.patterns : [];
  const insights = Array.isArray(record.insights) ? record.insights : [];
  const candidates = [...patterns, ...insights]
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const object = item as Record<string, unknown>;
        return [object.title, object.summary, object.evidence, object.pattern].find((part) => typeof part === "string") as string | undefined;
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item));

  return candidates.length ? candidates.slice(0, 3) : [
    "Connected competitor intelligence is limited; use VIP topic gaps and local search positioning as the starting point.",
    "Review competitor posts monthly to identify underserved patient questions.",
  ];
}

function measuredInstagramTimingOptions(
  slots: Array<{ dayLabel: string; hourOfDay: number; postCount: number; avgEngagementRate: number; avgPerformanceScore?: number }> | undefined,
  fallbackEvidence: string,
): PlatformTimingEvidence[] {
  const measured = slots
    ?.slice()
    .sort((left, right) => right.avgEngagementRate - left.avgEngagementRate || (right.avgPerformanceScore ?? 0) - (left.avgPerformanceScore ?? 0))
    .slice(0, 6)
    .map((slot) => ({
      window: `${clock(slot.hourOfDay)} IST`,
      confidence: slot.postCount >= 3 ? 78 : 60,
      source: slot.postCount >= 3 ? "measured" as const : "benchmark" as const,
      evidence: slot.postCount >= 3
        ? `VIP measured evidence: ${slot.postCount} posts on ${slot.dayLabel} at ${clock(slot.hourOfDay)} averaged ${percent(slot.avgEngagementRate)} engagement. AI can rotate this proven slot with nearby high-performing windows instead of using one default time.`
        : `VIP early signal: ${slot.postCount} post${slot.postCount === 1 ? "" : "s"} on ${slot.dayLabel} at ${clock(slot.hourOfDay)} averaged ${percent(slot.avgEngagementRate)} engagement. Treat as a test until more posts confirm it.`,
    })) ?? [];

  return measured.length ? measured : [
    {
      window: "1:00 PM IST",
      confidence: 52,
      source: "benchmark",
      evidence: fallbackEvidence,
    },
    ...benchmarkTimingOptions("Instagram", "discovery, saves and shares").slice(1),
  ];
}

function benchmarkTimingOptions(platform: "Instagram" | "Facebook" | "Google Business Profile" | "YouTube" | "WhatsApp", intent: string): PlatformTimingEvidence[] {
  const options: Record<typeof platform, Array<{ window: string; confidence: number }>> = {
    Instagram: [
      { window: "11:30 AM IST", confidence: 52 },
      { window: "1:00 PM IST", confidence: 53 },
      { window: "6:30 PM IST", confidence: 55 },
      { window: "7:30 PM IST", confidence: 54 },
      { window: "8:15 PM IST", confidence: 52 },
    ],
    Facebook: [
      { window: "12:30 PM IST", confidence: 48 },
      { window: "4:30 PM IST", confidence: 49 },
      { window: "6:00 PM IST", confidence: 50 },
      { window: "7:00 PM IST", confidence: 48 },
    ],
    "Google Business Profile": [
      { window: "10:30 AM IST", confidence: 44 },
      { window: "11:00 AM IST", confidence: 45 },
      { window: "12:00 PM IST", confidence: 44 },
    ],
    YouTube: [
      { window: "6:30 PM IST", confidence: 45 },
      { window: "7:00 PM IST", confidence: 46 },
      { window: "8:00 PM IST", confidence: 45 },
    ],
    WhatsApp: [
      { window: "9:30 AM IST", confidence: 46 },
      { window: "10:00 AM IST", confidence: 47 },
      { window: "11:00 AM IST", confidence: 46 },
      { window: "5:30 PM IST", confidence: 45 },
    ],
  };

  return options[platform].map((slot) => ({
    ...slot,
    source: "benchmark" as const,
    evidence: `AI selected this ${platform} timing as a labeled test for ${intent}. It uses platform benchmark ranges plus the calendar's channel mix and should be replaced by client measured data once enough posts exist.`,
  }));
}

function timingEvidenceFor(bestTime: { dayLabel: string; hourOfDay: number; postCount: number; avgEngagementRate: number } | undefined) {
  if (bestTime && bestTime.postCount >= 3) {
    return `VIP measured evidence: ${bestTime.postCount} posts on ${bestTime.dayLabel} at ${clock(bestTime.hourOfDay)} averaged ${percent(bestTime.avgEngagementRate)} engagement. This overrides generic timing benchmarks.`;
  }

  if (bestTime) {
    return `VIP has an early signal from ${bestTime.postCount} measured post${bestTime.postCount === 1 ? "" : "s"}, but the sample is thin. Use Sprout Social, Buffer and Hootsuite benchmark timing as a controlled test until more publishing history exists.`;
  }

  return "No measured posting window is connected yet. Use Sprout Social, Buffer and Hootsuite benchmark timing as a controlled starting test, then replace it with VIP account evidence.";
}

function clock(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function shortCaption(value: string | null | undefined) {
  if (!value) return "Published content with measured response";
  return value.length > 92 ? `${value.slice(0, 89)}...` : value;
}

function indiaDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
