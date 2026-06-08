import type { ControlPlaneRepository, RateLimitHook } from "../interfaces";
import type { QuotaSnapshot, UsageEvent } from "../types";

export class QuotaExceededError extends Error {
  constructor(metric: string) {
    super(`Quota exceeded for ${metric}.`);
    this.name = "QuotaExceededError";
  }
}

export class UsageMeteringService implements RateLimitHook {
  constructor(private readonly repository: ControlPlaneRepository) {}

  async record(event: UsageEvent) {
    await this.assertAllowed(event.workspaceId, event.metric);
    await this.repository.recordUsage(event);
  }

  async quota(workspaceId: string, metric: string, asOf = new Date()): Promise<QuotaSnapshot> {
    const subscription = await this.repository.subscription(workspaceId);
    const plan = subscription ? await this.repository.findPlan(subscription.planId) : null;
    const from = subscription?.periodStart ?? new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1)).toISOString();
    const to = subscription?.periodEnd ?? asOf.toISOString();
    const used = await this.repository.usageTotal(workspaceId, metric, from, to);
    const limit = plan?.limits[metric];
    return {
      workspaceId, metric, used, limit,
      remaining: limit === undefined ? undefined : Math.max(0, limit - used),
      exceeded: limit !== undefined && used >= limit,
    };
  }

  async assertAllowed(workspaceId: string, metric: string) {
    const quota = await this.quota(workspaceId, metric);
    if (quota.exceeded) throw new QuotaExceededError(metric);
  }
}
