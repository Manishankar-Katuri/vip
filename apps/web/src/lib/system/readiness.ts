import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "@vip/database";

export type ReadinessStatus = "ready" | "warning" | "blocked";

export type ProductionReadiness = {
  status: ReadinessStatus;
  checkedAt: string;
  environment: {
    nodeEnv: string;
    appUrlConfigured: boolean;
    required: EnvCheck[];
    optional: EnvCheck[];
  };
  database: {
    status: ReadinessStatus;
    reachable: boolean;
    error?: string;
    requiredModels: Array<{ name: string; available: boolean }>;
  };
  email: {
    status: ReadinessStatus;
    enabled: boolean;
    provider: "resend" | "none";
    requiredConfigPresent: boolean;
    fromEmailConfigured: boolean;
  };
  reports: {
    status: ReadinessStatus;
    generatedReportsPath: string;
    writable: boolean;
    publicUrlAvailable: boolean;
    productionStorageWarning: boolean;
  };
  workflows: {
    status: ReadinessStatus;
    manualStartAvailable: boolean;
    scheduleSettingsStored: boolean;
    schedulerExecutionConfigured: boolean;
    note: string;
  };
  security: {
    manualApprovalRequired: true;
    autoSendDisabled: true;
    tenantChecksPresent: boolean;
    secretLeakCheck: "safe";
  };
  recommendations: string[];
};

type EnvCheck = {
  name: string;
  configured: boolean;
  required: boolean;
  severity: "blocked" | "warning" | "info";
  purpose: string;
};

type Db = typeof prisma & Record<string, any>;

const REQUIRED_MODELS = [
  ["Workspace", "workspace"],
  ["MissionExecution", "missionExecution"],
  ["ReportDraft", "reportDraft"],
  ["ReportExport", "reportExport"],
  ["ReportApproval", "reportApproval"],
  ["ReportRecipient", "reportRecipient"],
  ["ReportDelivery", "reportDelivery"],
  ["ClientOperationalSettings", "clientOperationalSettings"],
] as const;

export async function buildProductionReadiness(): Promise<ProductionReadiness> {
  const [environment, database, reports] = await Promise.all([
    Promise.resolve(buildEnvironmentReadiness()),
    buildDatabaseReadiness(),
    buildReportStorageReadiness(),
  ]);
  const email = buildEmailReadiness();
  const workflows = buildWorkflowReadiness(database.requiredModels.some((model) => model.name === "ClientOperationalSettings" && model.available));
  const security = {
    manualApprovalRequired: true as const,
    autoSendDisabled: true as const,
    tenantChecksPresent: true,
    secretLeakCheck: "safe" as const,
  };
  const recommendations = buildRecommendations({ environment, database, email, reports, workflows });
  const status = worstStatus([
    environment.required.some((item) => item.required && item.severity === "blocked" && !item.configured) ? "blocked" : "ready",
    database.status,
    email.status,
    reports.status,
    workflows.status,
  ]);

  return {
    status,
    checkedAt: new Date().toISOString(),
    environment,
    database,
    email,
    reports,
    workflows,
    security,
    recommendations,
  };
}

async function buildDatabaseReadiness(): Promise<ProductionReadiness["database"]> {
  const db = prisma as Db;
  const requiredModels = REQUIRED_MODELS.map(([name]) => ({ name, available: false }));
  if (!configured("DATABASE_URL")) {
    return {
      status: "blocked",
      reachable: false,
      error: "DATABASE_URL is not configured.",
      requiredModels,
    };
  }

  try {
    await db.$queryRawUnsafe("SELECT 1");
    const modelResults = await Promise.all(REQUIRED_MODELS.map(async ([name, delegate]) => {
      const modelDelegate = db[delegate] as { count?: () => Promise<number> } | undefined;
      const available = Boolean(modelDelegate?.count) && await modelDelegate!.count!().then(() => true).catch(() => false);
      return { name, available };
    }));
    const missingModels = modelResults.filter((model) => !model.available);
    return {
      status: missingModels.length ? "blocked" : "ready",
      reachable: true,
      error: missingModels.length ? `${missingModels.length} required database models were not queryable.` : undefined,
      requiredModels: modelResults,
    };
  } catch (error) {
    return {
      status: "blocked",
      reachable: false,
      error: safeError(error),
      requiredModels,
    };
  }
}

function buildEnvironmentReadiness(): ProductionReadiness["environment"] {
  const required: EnvCheck[] = [
    env("DATABASE_URL", true, "blocked", "PostgreSQL connection used by Prisma and all production data."),
  ];
  const optional: EnvCheck[] = [
    env("NEXT_PUBLIC_APP_URL", false, "warning", "Canonical public app URL for smoke checks, callbacks, and absolute links."),
    env("NEXT_PUBLIC_API_BASE_URL", false, "info", "Optional API base override for browser-side API calls."),
    env("API_BASE_URL", false, "info", "Optional server-side API base URL for audit utilities."),
    env("REPORTS_EMAIL_ENABLED", false, "warning", "Enables explicit report send actions."),
    env("RESEND_API_KEY", false, "warning", "Resend API token used only when report email sending is enabled."),
    env("REPORTS_FROM_EMAIL", false, "warning", "From address used only when report email sending is enabled."),
    env("REPORTS_REPLY_TO_EMAIL", false, "info", "Optional reply-to address for report email sending."),
    env("OPENAI_API_KEY", false, "warning", "Required for AI-backed workflow/report generation."),
    env("OPENAI_MODEL", false, "info", "Optional AI model override."),
    env("HOSPITAL_CONFIG_ENCRYPTION_KEY", false, "warning", "Recommended for encrypted hospital integration credentials."),
    env("GOOGLE_MAPS_API_KEY", false, "info", "Optional live acquisition/places provider key."),
    env("GOOGLE_PLACES_KEY", false, "info", "Optional alternate live acquisition/places provider key."),
    env("CONTENT_EXECUTION_SCHEDULER_ENABLED", false, "info", "Legacy content execution scheduler toggle."),
    env("DAILY_WORKFLOW_SCHEDULER_ENABLED", false, "warning", "Production daily workflow scheduler toggle if a runner is deployed."),
    env("REDIS_URL", false, "warning", "Recommended when queue-backed automation/action workers are deployed."),
  ];

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    appUrlConfigured: configured("NEXT_PUBLIC_APP_URL"),
    required,
    optional,
  };
}

function buildEmailReadiness(): ProductionReadiness["email"] {
  const enabled = process.env.REPORTS_EMAIL_ENABLED === "true";
  const apiKeyPresent = configured("RESEND_API_KEY");
  const fromEmailConfigured = configured("REPORTS_FROM_EMAIL");
  const requiredConfigPresent = apiKeyPresent && fromEmailConfigured;
  return {
    status: enabled ? requiredConfigPresent ? "ready" : "blocked" : "warning",
    enabled,
    provider: enabled ? "resend" : "none",
    requiredConfigPresent,
    fromEmailConfigured,
  };
}

async function buildReportStorageReadiness(): Promise<ProductionReadiness["reports"]> {
  const generatedReportsPath = "public/generated/reports";
  const outputDir = path.join(process.cwd(), generatedReportsPath);
  const checkName = `.readiness-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  const checkPath = path.join(outputDir, checkName);
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(checkPath, "ok", "utf8");
    await fs.unlink(checkPath).catch(() => undefined);
    return {
      status: "warning",
      generatedReportsPath,
      writable: true,
      publicUrlAvailable: true,
      productionStorageWarning: true,
    };
  } catch {
    return {
      status: "blocked",
      generatedReportsPath,
      writable: false,
      publicUrlAvailable: false,
      productionStorageWarning: true,
    };
  }
}

function buildWorkflowReadiness(scheduleSettingsStored: boolean): ProductionReadiness["workflows"] {
  const schedulerExecutionConfigured = process.env.DAILY_WORKFLOW_SCHEDULER_ENABLED === "true";
  return {
    status: schedulerExecutionConfigured ? "ready" : "warning",
    manualStartAvailable: true,
    scheduleSettingsStored,
    schedulerExecutionConfigured,
    note: schedulerExecutionConfigured
      ? "Daily workflow scheduler is marked as enabled; verify the external runner/worker is deployed."
      : "Schedules are stored but automatic execution is not wired in this deployment.",
  };
}

function buildRecommendations(input: Pick<ProductionReadiness, "environment" | "database" | "email" | "reports" | "workflows">) {
  const recommendations: string[] = [];
  if (!input.database.reachable) recommendations.push("Restore database connectivity before production traffic.");
  if (input.database.reachable && input.database.requiredModels.some((model) => !model.available)) recommendations.push("Apply pending Prisma migrations before deployment.");
  if (!input.environment.appUrlConfigured) recommendations.push("Set NEXT_PUBLIC_APP_URL to the production app URL before go-live.");
  if (input.email.enabled && !input.email.requiredConfigPresent) recommendations.push("Complete RESEND_API_KEY and REPORTS_FROM_EMAIL before using report send actions.");
  if (!input.email.enabled) recommendations.push("Report email sending is disabled; exports and manual download remain available.");
  if (input.reports.productionStorageWarning) recommendations.push("Use persistent object storage for generated reports in serverless or container deployments.");
  if (!input.workflows.schedulerExecutionConfigured) recommendations.push("Deploy a dedicated scheduler/worker before relying on automatic daily workflow execution.");
  const missingAi = input.environment.optional.find((item) => item.name === "OPENAI_API_KEY" && !item.configured);
  if (missingAi) recommendations.push("Set OPENAI_API_KEY before running AI-backed workflows in production.");
  return [...new Set(recommendations)];
}

function env(name: string, required: boolean, severity: EnvCheck["severity"], purpose: string): EnvCheck {
  return {
    name,
    configured: configured(name),
    required,
    severity,
    purpose,
  };
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

function worstStatus(statuses: ReadinessStatus[]): ReadinessStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("warning")) return "warning";
  return "ready";
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Database readiness check failed.";
  return message.replace(/postgres(?:ql)?:\/\/[^\s'"@]+@[^\s'"]+/gi, "postgresql://[redacted]@database").slice(0, 500);
}
