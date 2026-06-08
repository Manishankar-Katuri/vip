import type { AutomationExecutionStatus } from "../types";

const TRANSITIONS: Readonly<Record<AutomationExecutionStatus, readonly AutomationExecutionStatus[]>> = {
  QUEUED: ["SCHEDULED", "RUNNING"],
  SCHEDULED: ["RUNNING"],
  RUNNING: ["RETRYING", "FAILED", "COMPLETED", "ROLLED_BACK", "DEAD_LETTERED"],
  RETRYING: ["SCHEDULED", "RUNNING", "DEAD_LETTERED", "FAILED"],
  FAILED: ["DEAD_LETTERED"],
  COMPLETED: ["ROLLED_BACK"],
  ROLLED_BACK: [],
  DEAD_LETTERED: [],
};

export class AutomationTransitionError extends Error {
  constructor(from: AutomationExecutionStatus, to: AutomationExecutionStatus) {
    super(`Automation execution cannot transition from ${from.toLowerCase()} to ${to.toLowerCase()}.`);
    this.name = "AutomationTransitionError";
  }
}

export class AutomationExecutionStateMachine {
  canTransition(from: AutomationExecutionStatus, to: AutomationExecutionStatus) {
    return TRANSITIONS[from].includes(to);
  }

  assertTransition(from: AutomationExecutionStatus, to: AutomationExecutionStatus) {
    if (!this.canTransition(from, to)) throw new AutomationTransitionError(from, to);
  }
}
