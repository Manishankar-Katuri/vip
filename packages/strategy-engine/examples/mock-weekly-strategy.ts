import type { IntelligenceSignal, WorkspaceStrategyContext } from "../types";
import { WeeklyStrategyGenerator } from "../weekly";

export const mockWorkspaceContext: WorkspaceStrategyContext = {
  workspaceId: "workspace_demo_health",
  workspaceName: "VIP Health Network",
  industry: "Healthcare",
  objectives: ["Increase preventive care awareness", "Improve patient trust"],
};

export const mockIntelligenceSignals: IntelligenceSignal[] = [
  {
    id: "regional-respiratory-awareness",
    workspaceId: mockWorkspaceContext.workspaceId,
    type: "MARKET_TREND",
    title: "Respiratory care awareness",
    description: "Regional search and engagement interest is increasing.",
    direction: "RISING",
    sentiment: "POSITIVE",
    impact: 84,
    urgency: 72,
    strategicAlignment: 92,
    confidence: 0.88,
    observedAt: "2026-05-24T08:00:00.000Z",
    source: {
      provider: "mock-trend-provider",
      kind: "EXTERNAL",
      collectedAt: "2026-05-24T08:00:00.000Z",
    },
  },
  {
    id: "appointment-delay-feedback",
    workspaceId: mockWorkspaceContext.workspaceId,
    type: "CUSTOMER_FEEDBACK",
    title: "Appointment wait-time complaints",
    description: "Negative review mentions increased compared with the prior week.",
    direction: "RISING",
    sentiment: "NEGATIVE",
    impact: 91,
    urgency: 88,
    strategicAlignment: 85,
    confidence: 0.91,
    observedAt: "2026-05-24T10:00:00.000Z",
    source: {
      provider: "mock-review-analytics",
      kind: "INTERNAL",
      collectedAt: "2026-05-24T10:00:00.000Z",
    },
  },
  {
    id: "booking-conversion",
    workspaceId: mockWorkspaceContext.workspaceId,
    type: "PERFORMANCE_METRIC",
    title: "Online booking conversion",
    description: "Conversion has fallen for three consecutive reporting periods.",
    direction: "DECLINING",
    sentiment: "NEGATIVE",
    impact: 76,
    urgency: 64,
    strategicAlignment: 80,
    confidence: 0.86,
    observedAt: "2026-05-23T09:00:00.000Z",
    source: {
      provider: "mock-workspace-analytics",
      kind: "INTERNAL",
      collectedAt: "2026-05-23T09:00:00.000Z",
    },
  },
];

export function generateMockWeeklyStrategy() {
  return new WeeklyStrategyGenerator().generate({
    context: mockWorkspaceContext,
    signals: mockIntelligenceSignals,
    asOf: new Date("2026-05-25T12:00:00.000Z"),
  });
}
