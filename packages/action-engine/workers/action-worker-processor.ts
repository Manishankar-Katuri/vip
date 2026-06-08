import type { ActionQueue, ActionRepository, RetryPolicy, StepProcessor } from "../interfaces";
import type { ActionEvent, ActionExecution, ActionJob, ActionPlan, ExecutionStep } from "../types";

export class ExponentialRetryPolicy implements RetryPolicy {
  constructor(private readonly baseDelayMs = 1000) {}

  nextDelayMs(attempt: number) {
    return this.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  }

  shouldRetry(attempt: number, maxAttempts: number) {
    return attempt < maxAttempts;
  }
}

export class ActionWorkerProcessor {
  private readonly processors: Map<string, StepProcessor>;

  constructor(
    private readonly repository: ActionRepository,
    private readonly queue: ActionQueue,
    processors: StepProcessor[],
    private readonly retryPolicy: RetryPolicy = new ExponentialRetryPolicy()
  ) {
    this.processors = new Map(processors.map((processor) => [processor.name, processor]));
  }

  async process(job: ActionJob, queueJobId?: string) {
    const alreadyCompleted = await this.repository.findExecution(job.workspaceId, job.executionIdempotencyKey);
    if (alreadyCompleted?.status === "COMPLETED") return alreadyCompleted;
    const plan = await this.repository.findPlan(job.workspaceId, job.actionPlanId);
    if (!plan) throw new Error("Action plan not found.");
    const execution = alreadyCompleted ?? await this.repository.startExecution(job, queueJobId);
    let running: ActionExecution = {
      ...execution,
      status: "RUNNING",
      attempt: execution.attempt + 1,
      startedAt: execution.startedAt ?? new Date().toISOString(),
    };
    running = await this.repository.updateExecution(
      running,
      log(running, "INFO", "execution.started", "Execution started.")
    );

    try {
      for (const step of plan.steps.sort((left, right) => left.position - right.position)) {
        if (step.status === "COMPLETED") continue;
        if (step.requiresApproval) {
          const approval = await this.repository.findApproval(plan.id);
          if (approval?.status !== "APPROVED") {
            const waiting = { ...running, status: "WAITING_APPROVAL" as const };
            return this.repository.updateExecution(
              waiting,
              log(waiting, "INFO", "execution.waiting_approval", `Step ${step.name} requires approval.`)
            );
          }
        }
        await this.runStep(plan, running, step);
      }
      const completed = {
        ...running,
        status: "COMPLETED" as const,
        completedAt: new Date().toISOString(),
        durationMs: elapsed(running.startedAt),
      };
      return this.repository.updateExecution(
        completed,
        log(completed, "INFO", "execution.completed", "Execution completed."),
        executionEvent(completed, "action.execution.completed")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action execution failed.";
      const retryable = this.retryPolicy.shouldRetry(running.attempt, plan.maxAttempts ?? 3, error);
      const status = retryable ? "RETRY_SCHEDULED" as const : "DEAD_LETTERED" as const;
      const failed = {
        ...running,
        status,
        failedAt: new Date().toISOString(),
        deadLetteredAt: retryable ? undefined : new Date().toISOString(),
        nextRetryAt: retryable
          ? new Date(Date.now() + this.retryPolicy.nextDelayMs(running.attempt)).toISOString()
          : undefined,
      };
      await this.repository.recordFailure({
        workspaceId: failed.workspaceId,
        actionExecutionId: failed.id,
        code: "STEP_PROCESSOR_FAILED",
        message,
        retryable,
        attempt: failed.attempt,
        occurredAt: failed.failedAt,
      }, failed, executionEvent(failed, retryable ? "action.execution.retry_scheduled" : "action.execution.dead_lettered"));
      if (retryable) await this.queue.schedule(job, new Date(failed.nextRetryAt!), { jobId: `${job.executionIdempotencyKey}:retry:${failed.attempt}` });
      else await this.queue.deadLetter(job, message);
      return failed;
    }
  }

  private async runStep(plan: ActionPlan, execution: ActionExecution, step: ExecutionStep) {
    const processor = this.processors.get(step.processor);
    if (!processor) throw new Error(`No processor registered for ${step.processor}.`);
    const running = { ...step, status: "RUNNING" as const, attempts: step.attempts + 1 };
    await this.repository.updateStep(plan.id, running);
    const output = await processor.execute({ plan, execution, step: running });
    await this.repository.updateStep(plan.id, {
      ...running,
      status: "COMPLETED",
      output: output ?? {},
    });
  }
}

function log(execution: ActionExecution, level: "INFO" | "ERROR", eventType: string, message: string) {
  return {
    workspaceId: execution.workspaceId,
    actionExecutionId: execution.id,
    level,
    eventType,
    message,
    createdAt: new Date().toISOString(),
  };
}

function executionEvent(execution: ActionExecution, eventType: string): ActionEvent {
  return {
    workspaceId: execution.workspaceId,
    actionExecutionId: execution.id,
    eventType,
    aggregateType: "ACTION_EXECUTION",
    aggregateId: execution.id,
    payload: { status: execution.status, attempt: execution.attempt },
    occurredAt: new Date().toISOString(),
  };
}

function elapsed(startedAt?: string) {
  return startedAt ? Math.max(0, Date.now() - new Date(startedAt).getTime()) : undefined;
}
