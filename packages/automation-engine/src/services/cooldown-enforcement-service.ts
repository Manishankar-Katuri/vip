import type { AutomationRepository } from "../repositories";
import type { AutomationRuleMatch } from "../types";

export class CooldownEnforcementService {
  constructor(private readonly repository: AutomationRepository) {}

  async allows(match: AutomationRuleMatch, now: string) {
    const latest = await this.repository.latestExecutionForRule(match.recommendation.workspaceId, match.rule.id);
    const timestamp = new Date(now).getTime();
    if (latest && timestamp - new Date(latest.queuedAt).getTime() < match.rule.cooldownMinutes * 60_000) {
      return false;
    }
    const since = new Date(timestamp - match.rule.executionLimit.windowMinutes * 60_000).toISOString();
    const count = await this.repository.countRuleExecutionsSince(match.recommendation.workspaceId, match.rule.id, since);
    return count < match.rule.executionLimit.maxExecutions;
  }
}
