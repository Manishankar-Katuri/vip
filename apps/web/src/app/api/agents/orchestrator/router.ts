type AgentName =
  | "content-agent"
  | "review-agent"
  | "competitor-agent"
  | "trend-agent";

export function routeTask(task: string): AgentName {
  const normalizedTask = task.toLowerCase();

  if (normalizedTask.includes("review")) {
    return "review-agent";
  }

  if (normalizedTask.includes("competitor")) {
    return "competitor-agent";
  }

  if (normalizedTask.includes("trend")) {
    return "trend-agent";
  }

  return "content-agent";
}
