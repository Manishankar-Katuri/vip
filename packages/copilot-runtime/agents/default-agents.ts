import type { AgentRegistry } from "../interfaces";
import type { AgentDefinition, AgentType } from "../types";

const DEFINITIONS: Record<AgentType, AgentDefinition> = {
  STRATEGY_ANALYST: {
    type: "STRATEGY_ANALYST", name: "Strategy Analyst",
    purpose: "Explain recommendations and synthesize business evidence.",
    allowedTools: ["dashboard.read", "recommendation.read"], promptKey: "strategy-analyst",
  },
  GROWTH_AGENT: {
    type: "GROWTH_AGENT", name: "Growth Agent",
    purpose: "Recommend measurable growth experiments.",
    allowedTools: ["dashboard.read", "action.propose"], promptKey: "growth-agent",
  },
  CONTENT_AGENT: {
    type: "CONTENT_AGENT", name: "Content Agent",
    purpose: "Prepare approved content implementation sequences.",
    allowedTools: ["action.propose"], promptKey: "content-agent",
  },
  RISK_MONITOR: {
    type: "RISK_MONITOR", name: "Risk Monitor",
    purpose: "React to risk events and recommend mitigation.",
    allowedTools: ["dashboard.read", "alert.create"], promptKey: "risk-monitor",
  },
  CAMPAIGN_OPTIMIZER: {
    type: "CAMPAIGN_OPTIMIZER", name: "Campaign Optimizer",
    purpose: "Optimize active campaigns against outcomes.",
    allowedTools: ["dashboard.read", "action.propose"], promptKey: "campaign-optimizer",
  },
};

export class DefaultAgentRegistry implements AgentRegistry {
  get(type: AgentType) {
    return DEFINITIONS[type];
  }
}
