export type DataProvenanceStatus = "LIVE" | "CACHED" | "STALE" | "MOCK";
export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "NOT_CONFIGURED" | "UNKNOWN";
export type VerificationCheckStatus = "PASS" | "WARNING" | "FAIL";
export type VerificationRunStatus = VerificationCheckStatus | "RUNNING";
export type PdfExportStatus = "REQUESTED" | "RUNNING" | "COMPLETED" | "FAILED";

export type DataProvenance = {
  source: string;
  sourceService: string;
  fetchedAt: string;
  cacheAgeSeconds: number;
  freshnessScore: number;
  status: DataProvenanceStatus;
  recordCount: number;
  apiCalled?: string | null;
  lastSuccessfulSyncAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type EndpointHealthResult = {
  endpoint: string;
  method: string;
  authentication: "PUBLIC" | "AUTHENTICATED" | "ADMIN" | "UNKNOWN";
  status: HealthStatus;
  responseTimeMs: number | null;
  lastStatusCode: number | null;
  successRate: number;
  errorCount: number;
  sourceService: string;
  sourceFile?: string | null;
  schemaValid?: boolean | null;
  schemaMessage?: string | null;
  errorMessage?: string | null;
  lastCheckedAt: string;
};

export type AiProviderHealthResult = {
  provider: string;
  model: string;
  status: HealthStatus;
  latencyMs: number | null;
  availability: number;
  lastCallAt: string | null;
  successRate: number;
  tokenUsage: Record<string, unknown>;
  costEstimate: number;
  structuredOutputValid: boolean | null;
  errorMessage?: string | null;
  checkedAt: string;
};

export type PdfExportSection = {
  heading: string;
  body?: string;
  rows?: Array<Record<string, string | number | null>>;
};

export type PdfExportRequest = {
  pageType: string;
  title: string;
  business?: string | null;
  generatedAt?: string;
  summary?: string;
  kpis?: Array<{ label: string; value: string; detail?: string }>;
  insights?: string[];
  recommendations?: Array<{ title: string; summary: string; confidence?: number; evidence?: string }>;
  actionPlan?: string[];
  evidenceSources?: Array<{ label: string; source: string; observedAt?: string | null }>;
  sections?: PdfExportSection[];
};

export type VerificationCheck = {
  subsystem: string;
  status: VerificationCheckStatus;
  score: number;
  message: string;
  details?: Record<string, unknown>;
  checkedAt: string;
};

export type PlatformReadiness = {
  status: VerificationRunStatus;
  readinessScore: number;
  summary: Record<string, number>;
  checks: VerificationCheck[];
  generatedAt: string;
};

