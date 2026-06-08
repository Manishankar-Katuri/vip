export type ContentGeneratorSourceDto = {
  publisher: string;
  title: string;
  url: string;
  use: string;
};

export type ContentGeneratorTemplateDto = {
  id: string;
  title: string;
  goal: string;
  tone: string;
  format: string;
};

export type ContentGeneratorResponseDto = {
  brandVoice: {
    tone: string;
    style: string;
    audience: string;
    messaging: string;
  } | null;
  activeStrategyThemes: Array<{
    key: string;
    title: string;
    rationale: string;
  }>;
  templates: ContentGeneratorTemplateDto[];
  recentCalendarItems: Array<{
    id: string;
    title: string;
    scheduledDate: string;
    status: string;
    category: string;
    contentType: string;
  }>;
  sourceReferences: ContentGeneratorSourceDto[];
  recentRuns: ContentGeneratorRunDto[];
};

export type ContentGeneratorRunDto = {
  id: string;
  hospitalId: string;
  idea: string;
  platform: string;
  format: string;
  audience: string;
  objective: string;
  doctorName: string | null;
  serviceLine: string | null;
  languagePlan: string;
  urgency: string;
  requestType: string;
  desiredPublishDate: string | null;
  strategyFit: string;
  contentPillar: string;
  generatedContext: unknown;
  evidence: unknown;
  safetyNotes: unknown;
  output: unknown;
  status: string;
  rejectionReason: string | null;
  calendarItemId: string | null;
  scriptId: string | null;
  createdAt: string;
  updatedAt: string;
};
