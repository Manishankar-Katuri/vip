import type { AutomationDeadLetterJob, AutomationQueueJob, AutomationRetryJob } from "../dto";
import { AutomationExecutionService } from "../execution";
import type { AutomationQueue, AutomationQueueConsumer, AutomationWorkflowExecutor, AutomationBackoffPolicy } from "../queue";
import { ExponentialAutomationBackoffPolicy } from "../queue";
import type { AutomationRepository } from "../repositories";
import type { AutomationDependencies } from "./automation-trigger-service";

export interface RetryCoordinatorOptions {
  retryWindowMs: number;
}

export class AutomationRetryCoordinator {
  constructor(
    private readonly queue: AutomationQueue,
    private readonly executionService: AutomationExecutionService,
    private readonly policy: AutomationBackoffPolicy = new ExponentialAutomationBackoffPolicy(),
    private readonly options: RetryCoordinatorOptions = { retryWindowMs: 24 * 60 * 60 * 1000 }
  ) {}

  async schedule(execution: Awaited<ReturnType<AutomationExecutionService["fail"]>>, reason: string, now: string) {
    if (execution.status !== "RETRYING") return false;
    const delayMs = this.policy.delayMs(execution.attempt, execution.retryPolicy.backoffMs);
    const runAt = new Date(new Date(now).getTime() + delayMs);
    const retryWindowEndsAt = new Date(new Date(execution.queuedAt).getTime() + this.options.retryWindowMs);
    if (runAt > retryWindowEndsAt) return false;
    const operationKey = `${execution.id}:retry:${execution.attempt}`;
    const job: AutomationRetryJob = {
      jobType: "AUTOMATION_RETRY",
      workspaceId: execution.workspaceId,
      executionId: execution.id,
      operationKey,
      enqueuedAt: now,
      runAt: runAt.toISOString(),
      attempt: execution.attempt,
      failureReason: reason,
      retryWindowEndsAt: retryWindowEndsAt.toISOString(),
    };
    await this.executionService.schedule(execution.workspaceId, execution.id, runAt.toISOString(), `${operationKey}:scheduled`);
    await this.queue.schedule(job, runAt, { operationKey, attempts: 1, backoffMs: delayMs });
    return true;
  }
}

export class AutomationDeadLetterEvaluator {
  constructor(private readonly queue: AutomationQueue, private readonly executionService: AutomationExecutionService) {}

  async evaluate(execution: Awaited<ReturnType<AutomationExecutionService["fail"]>>, reason: string, now: string) {
    if (execution.status !== "FAILED" && execution.status !== "RETRYING") return null;
    const operationKey = `${execution.id}:dead-letter`;
    const deadLettered = await this.executionService.deadLetter(
      execution.workspaceId, execution.id, reason, operationKey
    );
    const job: AutomationDeadLetterJob = {
      jobType: "AUTOMATION_DEAD_LETTER",
      workspaceId: deadLettered.workspaceId,
      executionId: deadLettered.id,
      operationKey,
      reason,
      deadLetteredAt: now,
      snapshot: deadLettered,
    };
    await this.queue.deadLetter(job);
    return deadLettered;
  }
}

export class AutomationExecutionCoordinator implements AutomationQueueConsumer {
  private readonly executionService: AutomationExecutionService;
  private readonly retries: AutomationRetryCoordinator;
  private readonly deadLetters: AutomationDeadLetterEvaluator;

  constructor(
    private readonly repository: AutomationRepository,
    private readonly queue: AutomationQueue,
    private readonly executor: AutomationWorkflowExecutor,
    dependencies?: AutomationDependencies
  ) {
    this.executionService = new AutomationExecutionService(repository, dependencies);
    this.retries = new AutomationRetryCoordinator(queue, this.executionService);
    this.deadLetters = new AutomationDeadLetterEvaluator(queue, this.executionService);
  }

  async dispatch(executionId: string, workspaceId: string, now = new Date().toISOString()) {
    const operationKey = `${executionId}:dispatch`;
    const job: AutomationQueueJob = {
      jobType: "AUTOMATION_EXECUTION", executionId, workspaceId, operationKey, enqueuedAt: now,
    };
    await this.queue.enqueue(job, { operationKey });
    return job;
  }

  async schedule(executionId: string, workspaceId: string, runAt: string, now = new Date().toISOString()) {
    const operationKey = `${executionId}:scheduled:${runAt}`;
    const job: AutomationQueueJob = {
      jobType: "AUTOMATION_EXECUTION", executionId, workspaceId, operationKey, enqueuedAt: now, runAt,
    };
    await this.executionService.schedule(workspaceId, executionId, runAt, `${operationKey}:state`);
    await this.queue.schedule(job, new Date(runAt), { operationKey });
    return job;
  }

  async handle(job: AutomationQueueJob | AutomationRetryJob) {
    const current = await this.repository.findExecutionById(job.workspaceId, job.executionId);
    if (!current) throw new Error("Queued automation execution was not found.");
    if (["COMPLETED", "ROLLED_BACK", "DEAD_LETTERED"].includes(current.status)) return;
    const running = await this.executionService.start(job.workspaceId, job.executionId, `${job.operationKey}:start`);
    try {
      const result = await this.executor.execute(running.id, running.workspaceId);
      await this.executionService.complete(running.workspaceId, running.id, result, `${job.operationKey}:complete`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Workflow execution failed.";
      const failed = await this.executionService.fail(running.workspaceId, running.id, reason, `${job.operationKey}:fail`);
      const retryScheduled = await this.retries.schedule(failed, reason, new Date().toISOString());
      if (!retryScheduled) await this.deadLetters.evaluate(failed, reason, new Date().toISOString());
    }
  }
}
