export type IndiaRegion = {
  country: "IN";
  state: string;
  city: string;
  district?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
};

export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type TrendDirection = "RISING" | "STABLE" | "DECLINING" | "EMERGING";

export type IntelligenceSource = {
  provider: string;
  collectedAt: string;
  sourceType: "ESTIMATE" | "PUBLIC_DATA" | "PLATFORM" | "WEATHER" | "CALENDAR" | "WORKSPACE";
  confidence: number;
  cached?: boolean;
  note?: string;
};

export type AgeGroupDistribution = {
  label: "0-17" | "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  share: number;
};

export interface DemographicProfile {
  region: IndiaRegion;
  regionKey: string;
  dominantAgeGroups: AgeGroupDistribution[];
  primaryLanguages: Array<{ language: string; share: number; contentPriority: number }>;
  audienceSegments: Array<{ label: string; relevance: number; healthcareNeed: string }>;
  audienceCharacteristics: string[];
  recommendedTone: string[];
  recommendedContentStyles: string[];
  recommendedPlatforms: string[];
  healthcareAwarenessLevel: "DEVELOPING" | "MODERATE" | "HIGH";
  urbanRuralWeighting: { urban: number; rural: number };
  sources: IntelligenceSource[];
}

export type MarketSignalCategory =
  | "HASHTAG"
  | "HEALTHCARE_TOPIC"
  | "CONTENT_FORMAT"
  | "VIRAL_TOPIC"
  | "DISEASE"
  | "POLLUTION"
  | "ALLERGY"
  | "AWARENESS_EVENT"
  | "LOCAL_BEHAVIOR";

export interface TrendSignal {
  key: string;
  label: string;
  category: MarketSignalCategory;
  regionKey: string;
  provider: string;
  score: number;
  volume?: number;
  momentum: number;
  direction: TrendDirection;
  sentiment?: number;
  confidence: number;
  observedAt: string;
  hashtags?: string[];
  languages?: string[];
  metadata?: Record<string, unknown>;
}

export interface TrendIntelligence {
  topics: TrendSignal[];
  hashtags: TrendSignal[];
  reelFormats: TrendSignal[];
  viralTopics: TrendSignal[];
  risingTopics: TrendSignal[];
  decliningTopics: TrendSignal[];
  geoAwareHashtags: string[];
  localLanguageTopics: TrendSignal[];
  sources: IntelligenceSource[];
}

export interface HealthcareSignal {
  key: string;
  title: string;
  type: "SEASONAL_DISEASE" | "ALLERGY" | "POLLUTION_IMPACT" | "WEATHER_HEALTH" | "ENT" | "AWARENESS";
  direction: TrendDirection;
  score: number;
  confidence: number;
  rationale: string;
  contentAngles: string[];
  evidence: IntelligenceSource[];
}

export interface CompetitorPattern {
  label: string;
  patternType: "THEME" | "FORMAT" | "HOOK" | "CADENCE" | "ENGAGEMENT";
  prevalence: number;
  performanceScore?: number;
  examplesCount: number;
  interpretation: string;
}

export interface CompetitorIntelligence {
  accountsAnalyzed: number;
  patterns: CompetitorPattern[];
  topPerformingThemes: string[];
  postingFrequencySignals: string[];
  opportunityGaps: string[];
  guardrail: string;
  sources: IntelligenceSource[];
}

export interface LocalContextItem {
  key: string;
  title: string;
  type: "FESTIVAL" | "HOLIDAY" | "SCHOOL" | "EXAM" | "LOCAL_EVENT" | "WEATHER_SHIFT" | "AWARENESS_DAY";
  startsAt: string;
  endsAt?: string;
  relevance: number;
  suggestedAngle: string;
  languages?: string[];
  source: IntelligenceSource;
}

export interface LocalContext {
  region: IndiaRegion;
  items: LocalContextItem[];
  seasonalPhase: string;
  weatherSummary?: string;
}

export interface OpportunitySignal {
  key: string;
  title: string;
  reason: string;
  score: number;
  confidence: number;
  recommendedFormat: string;
  relatedTopics: string[];
}

export interface MarketContext {
  version: "1.0";
  workspaceId: string;
  hospitalName?: string;
  specialtyFocus: string[];
  region: IndiaRegion;
  regionKey: string;
  generatedAt: string;
  demographics: DemographicProfile;
  trendingTopics: TrendIntelligence;
  healthcareSignals: HealthcareSignal[];
  competitorPatterns: CompetitorIntelligence;
  localContext: LocalContext;
  recommendedThemes: string[];
  audienceInsights: string[];
  opportunitySignals: OpportunitySignal[];
  strategyInputs: {
    externalIntelligenceReady: true;
    combineWithInternal: string[];
    caution: string;
  };
}

export interface BuildMarketContextInput {
  workspaceId: string;
  hospitalName?: string;
  specialtyFocus?: string[];
  region: IndiaRegion;
  asOf?: Date;
  persist?: boolean;
  forceRefresh?: boolean;
  trendProviders?: import("./providers").MarketSignalProvider[];
  healthcareProviders?: import("./providers").MarketSignalProvider[];
  environmentalContext?: {
    airQualityIndex?: number;
    weatherSummary?: string;
    temperatureC?: number;
    rainfallMm?: number;
  };
}
