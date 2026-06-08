export type ContentPlanDecisionType = "KEEP" | "IMPROVE" | "REPLACE" | "ADD" | "PAUSE";
export type ContentExecutionDocumentMode = "real" | "preview";
export type ContentExecutionGenerationMode = "scheduled" | "fromToday";

export type ScriptScene = {
  sceneNumber: number;
  sceneTitle: string;
  timestamp: string;
  doctorLines?: string[];
  voiceoverLines?: string[];
  onScreenText?: string[];
  visualDirection?: string;
  brollSuggestions?: string[];
};

export type CarouselSlide = {
  slideNumber: number;
  headline: string;
  body: string;
  visualSuggestion: string;
};

export type BlogArticlePlan = {
  title: string;
  outline: string[];
  introParagraph: string;
  sectionHeadings: string[];
  cta: string;
};

export type DetailedContentInstruction = {
  date: string;
  platform: string;
  decision: ContentPlanDecisionType;
  postingTime: string;
  contentType: string;
  topic: string;
  objective: string;
  targetAudience: string;
  duration?: string;
  fullScript?: {
    scenes: ScriptScene[];
  };
  carouselSlides?: CarouselSlide[];
  gbpPostCopy?: string;
  gbpSuggestedImage?: string;
  gbpServiceCategory?: string;
  whatsappMessage?: string;
  whatsappAudienceSegment?: string;
  whatsappFollowUpNote?: string;
  blogArticlePlan?: BlogArticlePlan;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  thumbnailText?: string;
  creativeDirection: string;
  recordingInstructions?: string[];
  editingInstructions?: string[];
  designInstructions?: string[];
  assetsRequired: string[];
  clientPreparationNeeded: string[];
  internalTeamTasks: string[];
  approvalChecklist: string[];
  medicalSafetyNote: string;
  expectedImpact: string;
};

export type PlannedCalendarItem = {
  id: string;
  workspaceId: string;
  clientId?: string | null;
  date: string;
  platform: string;
  plannedTopic: string;
  plannedContentType: string;
  plannedCaption?: string | null;
  plannedAssets: string[];
  plannedPostingTime: string;
  campaignTheme?: string | null;
  goal?: string | null;
  status: string;
  approvalStatus: string;
};

export type RecentContentPerformance = {
  id: string;
  platform: string;
  topic: string;
  contentType: string;
  postedAt: string;
  reach: number;
  engagementRate: number;
  saves: number;
  shares: number;
  comments: number;
};

export type PlatformAnalytics = {
  platform: string;
  bestContentType?: string;
  bestPostingTime?: string;
  averageEngagementRate: number;
  averageReach: number;
};

export type IntelligenceSignal = {
  label: string;
  score: number;
  category?: string;
  momentum?: number | null;
  confidence?: number;
  metadata?: Record<string, unknown> | null;
};

export type NormalizedPlatformPerformance = {
  platform: string;
  reach?: number;
  engagementRate?: number;
  saves?: number;
  shares?: number;
  comments?: number;
  followersDelta?: number;
  bestPostingTime?: string;
  topContentTypes?: string[];
  weakContentTypes?: string[];
};

export type NormalizedTopicPerformance = {
  topic: string;
  platform?: string;
  score: number;
  signal: "STRONG" | "WEAK" | "NEUTRAL";
  reason: string;
};

export type NormalizedTrendSignal = {
  topic: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  recommendedContentType?: string;
};

export type NormalizedAssetSignal = {
  topicOrItemId: string;
  status: "AVAILABLE" | "MISSING" | "RISKY" | "NEEDS_APPROVAL";
  reason: string;
};

export type DailyIntelligenceSnapshot = {
  workspaceId: string;
  generatedAt: string;
  lookbackWindowDays: number;
  sourceLabel: "REAL" | "MIXED" | "FALLBACK";
  platformPerformance: NormalizedPlatformPerformance[];
  topicPerformance: NormalizedTopicPerformance[];
  trendSignalsNormalized: NormalizedTrendSignal[];
  assetSignals: NormalizedAssetSignal[];
  platformAnalytics: PlatformAnalytics[];
  recentContentPerformance: RecentContentPerformance[];
  audienceSignals: IntelligenceSignal[];
  trendSignals: IntelligenceSignal[];
  competitorSignals: IntelligenceSignal[];
};

export type ContentDecision = {
  decision: ContentPlanDecisionType;
  calendarItemId?: string;
  originalTopic?: string;
  finalTopic: string;
  originalContentType?: string;
  finalContentType: string;
  decisionReason: string;
  intelligenceSignalsUsed: Record<string, unknown>;
  confidenceScore: number;
  date?: string;
  platform?: string;
  postingTime?: string;
  approvalStatus?: string;
  generatedContent?: {
    hook?: string;
    caption?: string;
    hashtags?: string[];
    cta?: string;
    creativeDirection?: string;
    assetRequirements?: string[];
    internalTeamTasks?: string[];
    clientPreparationTasks?: string[];
  };
};

export type ExecutionWindow = {
  windowType: "MONDAY_WEDNESDAY" | "THURSDAY_SATURDAY" | "WEEKEND_NEXT_WEEK" | "FROM_TODAY";
  sendDay: "Sunday" | "Wednesday" | "Saturday" | "Manual";
  sendTime: string;
  windowStartDate: string;
  windowEndDate: string;
  label: string;
  purpose: string;
  timezone: string;
  generationMode?: ContentExecutionGenerationMode;
};

export type ThreeDayContentExecutionDocument = {
  title: string;
  mode: ContentExecutionDocumentMode;
  modeLabel: string;
  generationMode: ContentExecutionGenerationMode;
  clientName: string;
  workspaceName: string;
  workspaceId: string;
  generatedAt: string;
  contentWindow: {
    startDate: string;
    endDate: string;
    displayStartDate: string;
    displayEndDate: string;
    displayRange: string;
    label: string;
    purpose: string;
    sendDay: string;
    sendTime: string;
  };
  executiveBrief: {
    mainTheme: string;
    primaryGoal: string;
    platformsCovered: string[];
    totalContentPieces: number;
    adjustedItemsCount: number;
    freshAiItemsCount: number;
    priorityPreparationSummary: string;
  };
  intelligenceNote: string;
  intelligenceBasedAdjustments: Array<{
    date: string;
    platform: string;
    originalPlan: string;
    finalPlan: string;
    decision: ContentPlanDecisionType;
    reason: string;
  }>;
  dayWiseSchedule: Array<{
    date: string;
    day: string;
    platform: string;
    contentType: string;
    topic: string;
    postingTime: string;
    assetNeeded: string;
    approvalStatus: string;
  }>;
  detailedContentInstructions: DetailedContentInstruction[];
  assetChecklist: {
    neededFromClient: string[];
    neededFromInternalTeam: string[];
  };
  priorityActions: string[];
  emailSummaryPreview: {
    subject: string;
    body: string;
  };
};
