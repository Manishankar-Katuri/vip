import prisma from "@vip/database";
import { resolveSocialWorkspace } from "../workspace";

export interface AudienceDashboardOutput {
  workspaceId: string;
  insights: Array<{
    type: string;
    label: string;
    value: number;
    confidence: number;
  }>;
  radar: Array<{ axis: string; value: number }>;
  pie: Array<{ label: string; value: number }>;
}

export async function analyzeAudience(workspaceId: string): Promise<AudienceDashboardOutput> {
  await resolveSocialWorkspace(workspaceId);
  const insights = await prisma.audienceInsight.findMany({
    where: { workspaceId },
    orderBy: { capturedAt: "desc" },
    take: 100,
  });

  return {
    workspaceId,
    insights: insights.map((insight) => ({
      type: insight.type,
      label: insight.label,
      value: insight.value,
      confidence: insight.confidence,
    })),
    radar: insights.slice(0, 8).map((insight) => ({
      axis: insight.label,
      value: insight.value,
    })),
    pie: insights
      .filter((insight) => insight.type === "DEMOGRAPHIC" || insight.type === "INTEREST")
      .slice(0, 8)
      .map((insight) => ({ label: insight.label, value: insight.value })),
  };
}

export function inferAudienceSignals(captions: string[]) {
  const joined = captions.join(" ").toLowerCase();

  return [
    {
      type: "INFERRED_PERSONA" as const,
      label: "Preventive-care seekers",
      value: scoreTerms(joined, ["screening", "checkup", "preventive", "wellness"]),
      confidence: 0.45,
    },
    {
      type: "INFERRED_PERSONA" as const,
      label: "Specialty-care researchers",
      value: scoreTerms(joined, ["cardiology", "orthopedic", "surgery", "specialist"]),
      confidence: 0.4,
    },
  ].filter((signal) => signal.value > 0);
}

function scoreTerms(text: string, terms: string[]) {
  const matches = terms.filter((term) => text.includes(term)).length;
  return Number((matches / terms.length).toFixed(4));
}
