import { CONTENT_EXECUTION_CRON_JOBS } from "./execution-window";

export type ContentExecutionScheduledJob = {
  id: string;
  cron: string;
  timezone: string;
  workflowType: "ADAPTIVE_THREE_DAY_CONTENT_EXECUTION_PLAN";
  enabled: boolean;
  description: string;
};

export function getContentExecutionSchedulerDefinitions(
  timezone = process.env.CONTENT_EXECUTION_TIMEZONE ?? "Asia/Kolkata"
): ContentExecutionScheduledJob[] {
  const enabled = process.env.CONTENT_EXECUTION_SCHEDULER_ENABLED === "true";

  return CONTENT_EXECUTION_CRON_JOBS.map((job) => ({
    id: `content-execution:${job.cron}`,
    cron: job.cron,
    timezone,
    workflowType: "ADAPTIVE_THREE_DAY_CONTENT_EXECUTION_PLAN",
    enabled,
    description: enabled
      ? `${job.label} at 9:00 AM in ${timezone}. Email delivery still follows CONTENT_EXECUTION_EMAIL_ENABLED.`
      : `${job.label} at 9:00 AM. Disabled until CONTENT_EXECUTION_SCHEDULER_ENABLED=true.`,
  }));
}
