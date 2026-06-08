export type ReportType =
  | "DAILY_ANALYTICS_REPORT"
  | "DAILY_STRATEGY_REPORT"
  | "THREE_DAY_CONTENT_PLAN"
  | "WEEKLY_GROWTH_REPORT"
  | "MONTHLY_CLIENT_REPORT";

export type ReportStatus = "draft" | "ready_for_review" | "approved" | "exported" | "sent" | "archived" | "failed";
export type ReportSectionContentType = "text" | "table" | "list" | "metric_summary" | "action_plan";

export type ReportSection = {
  id: string;
  title: string;
  order: number;
  content: string | string[] | Array<Record<string, string | number | null>>;
  contentType: ReportSectionContentType;
  editable: boolean;
  sourceRefs?: string[];
};

export type ReportListItem = {
  id: string;
  clientId: string;
  workspaceId: string;
  clientName: string;
  workflowRunId: string | null;
  reportType: ReportType;
  title: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  generatedAt: string | null;
  editedAt: string | null;
  approvalStatus: string;
  exportStatus: string;
  sentStatus: string;
  pdfUrl: string | null;
  docxUrl: string | null;
  summary: string;
};

export type ReportSourceData = {
  analyticsSourcesUsed: string[];
  strategySourcesUsed: string[];
  contentPlanSourcesUsed: string[];
  workflowReferencesUsed: string[];
  missingDataWarnings: string[];
};

export type ReportWorkflowReference = {
  workflowRunId: string | null;
  workflowStatus: string | null;
  workflowStartedAt: string | null;
  workflowCompletedAt: string | null;
};

export type ReportApproval = {
  id: string;
  status: string;
  requestedAt: string | null;
  approvedAt: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  notes: string | null;
};

export type ReportExport = {
  id?: string;
  format: "PDF" | "DOCX";
  status: string;
  url: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  errorMessage?: string | null;
  createdAt: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type ReportExportListResponse = {
  exports: ReportExport[];
  latest: {
    PDF: ReportExport | null;
    DOCX: ReportExport | null;
  };
};

export type ReportDelivery = {
  id?: string;
  recipient: string;
  recipientName?: string | null;
  format?: string;
  status: string;
  exportIds?: string[];
  sentAt: string | null;
  error: string | null;
  providerMessageId?: string | null;
  message?: string | null;
  createdAt?: string | null;
};

export type ReportRecipient = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: string | null;
  isDefault: boolean;
  receivesReports: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReportApprovalResponse = {
  current: ReportApproval | null;
  history: ReportApproval[];
  approvalStatus: string;
};

export type ReportDeliveryResponse = {
  deliveries: ReportDelivery[];
  sentStatus: string;
};

export type ReportRecipientListResponse = {
  recipients: ReportRecipient[];
};

export type ReportDetailResponse = {
  report: ReportListItem;
  sections: ReportSection[];
  sourceData: ReportSourceData;
  workflow: ReportWorkflowReference;
  approvals: ReportApproval[];
  exports: ReportExport[];
  deliveries: ReportDelivery[];
};

export type ReportListResponse = {
  reports: ReportListItem[];
  filters: {
    clientId: string | null;
    workflowRunId: string | null;
    reportType: string | null;
    status: string | null;
    date: string | null;
    limit: number;
  };
};

export type GenerateReportInput = {
  reportType: ReportType;
  clientId?: string;
  workspaceId?: string;
  workflowRunId?: string;
  date?: string;
  forceRegenerate?: boolean;
};

export type PatchReportInput = {
  title?: string;
  summary?: string;
  status?: "draft" | "ready_for_review" | "archived";
  sections?: Array<Pick<ReportSection, "id" | "content">>;
};

export const REPORT_TYPES: ReportType[] = [
  "DAILY_ANALYTICS_REPORT",
  "DAILY_STRATEGY_REPORT",
  "THREE_DAY_CONTENT_PLAN",
  "WEEKLY_GROWTH_REPORT",
  "MONTHLY_CLIENT_REPORT",
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  DAILY_ANALYTICS_REPORT: "Daily Analytics Report",
  DAILY_STRATEGY_REPORT: "Daily Strategy Report",
  THREE_DAY_CONTENT_PLAN: "Three-Day Content Plan",
  WEEKLY_GROWTH_REPORT: "Weekly Growth Report",
  MONTHLY_CLIENT_REPORT: "Monthly Client Report",
};
